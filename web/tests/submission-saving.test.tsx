import { act, type PropsWithChildren } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SumbmitProvider from "../src/modules/submit/context/sumbmit-form";
import { useSubmitForm } from "../src/modules/submit/hooks/use-submit-form";
import { draftPayloadFromForm } from "../src/modules/submit/utils/draft";
import { StepLayout } from "../src/modules/submit/ui/components/step-layout/step-layout";

const mocks = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn(), navigate: vi.fn() }));
vi.mock("@/api/api", () => ({ API: mocks }));
vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: () => ({ data: { user: { id: "saving-test" } } }) },
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/modules/releases/utils/launch-celebration", () => ({ celebrateLaunch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/ui/button", () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
}));
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  ViewTransition: ({ children }: PropsWithChildren) => children,
}));

let state: ReturnType<typeof useSubmitForm>;
let root: Root;
let container: HTMLDivElement;
const saved = { data: { data: { id: 42, slug: "saving-test" } } };
function Probe() {
  state = useSubmitForm();
  return (
    <StepLayout>
      <input {...state.form.register("name")} />
    </StepLayout>
  );
}
function deferred() {
  let resolve!: (value: typeof saved) => void;
  const promise = new Promise<typeof saved>((done) => {
    resolve = done;
  });
  return { promise, resolve: () => resolve(saved) };
}
async function edit(name: string) {
  await act(async () => {
    state.form.setValue("name", name);
  });
}
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
function button(text: string) {
  return [...container.querySelectorAll("button")].find((item) => item.textContent === text)!;
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorage.clear();
  mocks.post.mockResolvedValue(saved);
  mocks.patch.mockResolvedValue(saved);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <SumbmitProvider>
        <Probe />
      </SumbmitProvider>,
    );
  });
});
afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.useRealTimers();
});

describe("submission saving", () => {
  it("keeps Next and Back usable while an autosave is unresolved", async () => {
    const pending = deferred();
    mocks.post.mockReturnValueOnce(pending.promise);
    await edit("Draft in progress");
    await advance(1200);
    expect(state.isSaving).toBe(true);
    expect(button("Próximo").disabled).toBe(false);
    await act(async () => {
      button("Próximo").click();
    });
    expect(state.active).toBe(1);
    expect(button("Voltar").disabled).toBe(false);
    await act(async () => {
      button("Voltar").click();
      pending.resolve();
    });
    expect(state.active).toBe(0);
    expect(state.saveState).toBe("saved");
  });

  it("releases a stalled save after its deadline and retries with the same creation key", async () => {
    mocks.post.mockImplementationOnce(
      (_url, _body, options) =>
        new Promise((_resolve, reject) => {
          setTimeout(() => reject(new Error("timeout")), options.timeout);
        }),
    );
    await edit("Recoverable draft");
    await advance(1200);
    expect(mocks.post.mock.calls[0][2].timeout).toBe(15000);
    await advance(15000);
    expect(state.isSaving).toBe(false);
    expect(state.saveState).toBe("error");
    expect(state.form.getValues("name")).toBe("Recoverable draft");
    expect(JSON.parse(localStorage.getItem("hd:submission:saving-test:new")!).values.name).toBe(
      "Recoverable draft",
    );
    await advance(5000);
    expect(mocks.post).toHaveBeenCalledTimes(1);
    await act(async () => {
      state.saveDraft();
    });
    expect(state.saveState).toBe("saved");
    expect(mocks.post.mock.calls[1][1].creationKey).toBe(mocks.post.mock.calls[0][1].creationKey);
  });

  it("coalesces edits made during a save into a later write without overlapping saves", async () => {
    const pending = deferred();
    mocks.patch.mockReturnValueOnce(pending.promise);
    await edit("First snapshot");
    await advance(1200);
    await edit("Newest snapshot");
    await advance(3000);
    expect(mocks.patch).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.resolve();
    });
    await advance(1200);
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.patch).toHaveBeenCalledTimes(2);
    expect(mocks.patch.mock.calls[1][1].name).toBe("Newest snapshot");
    expect(state.saveState).toBe("saved");
  });

  it("retries a failed update using the existing draft ID", async () => {
    mocks.patch.mockRejectedValueOnce(new Error("offline"));
    await edit("Keep my changes");
    await advance(1200);
    expect(state.saveState).toBe("error");
    expect(state.isSaving).toBe(false);
    await act(async () => {
      state.saveDraft();
    });
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.patch.mock.calls[1][0]).toBe("/projects/42");
    expect(state.saveState).toBe("saved");
  });

  it("releases publication controls when required fields are missing", async () => {
    await act(async () => {
      state.publish();
    });
    expect(state.isPublishing).toBe(false);
    expect(button("Próximo").disabled).toBe(false);
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("waits for autosave, persists current values and publishes only once", async () => {
    const pending = deferred();
    mocks.post
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ data: { data: { ...saved.data.data, status: "pending" } } });
    await act(async () => {
      state.form.setValue("name", "Before save");
      state.form.setValue("shortDescription", "A useful project for builders");
      state.form.setValue("categoryId", 1);
      state.form.setValue("projectStage", "idea");
      state.form.setValue("availability", "not_available");
    });
    await advance(1200);
    await edit("Latest published name");
    await act(async () => {
      state.publish();
      state.publish();
    });
    expect(state.isPublishing).toBe(true);
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(button("Próximo").disabled).toBe(true);
    await act(async () => {
      pending.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mocks.patch).toHaveBeenCalledTimes(2);
    expect(mocks.patch.mock.calls[1][1].name).toBe("Latest published name");
    expect(mocks.post).toHaveBeenCalledTimes(2);
    expect(mocks.post.mock.calls[1][0]).toBe("/projects/42/publish");
    expect(mocks.post.mock.calls[1][2].timeout).toBe(15000);
    expect(state.isPublishing).toBe(false);
    expect(localStorage.getItem("hd:submission:saving-test:new")).toBeNull();
  });
  it("navigates directly to all four steps and resumes recovery at the final step", async () => {
    await act(async () => {
      state.goToStep(3);
    });
    expect(state.active).toBe(3);
    expect(state.isLast).toBe(true);
    await act(async () => {
      state.goToStep(2);
    });
    expect(state.active).toBe(2);
    expect(state.isLast).toBe(false);
    await edit("Four-step draft");
    await act(async () => {
      state.goToStep(3);
    });
    await act(async () => {
      root.unmount();
    });
    root = createRoot(container);
    await act(async () => {
      root.render(
        <SumbmitProvider>
          <Probe />
        </SumbmitProvider>,
      );
    });
    expect(state.recovery?.step).toBe(3);
    await act(async () => {
      state.resumeRecovery();
    });
    expect(state.active).toBe(3);
    expect(state.form.getValues("name")).toBe("Four-step draft");
  });

  it("returns invalid coordinates to the base step before any publication request", async () => {
    await act(async () => {
      state.form.setValue("name", "Location validation");
      state.form.setValue("shortDescription", "A useful project for builders");
      state.form.setValue("categoryId", 1);
      state.form.setValue("projectStage", "idea");
      state.form.setValue("availability", "not_available");
      state.form.setValue("location.country", "pt");
      state.form.setValue("location.publicPin", {
        latitude: 100,
        longitude: 0,
        precision: "exact",
      });
      state.goToStep(3);
    });
    await act(async () => {
      state.publish();
    });
    expect(state.active).toBe(2);
    expect(state.isPublishing).toBe(false);
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("discards an unfinished removed service-area answer without discarding an existing complete answer", () => {
    const values = state.form.getValues();
    expect(
      draftPayloadFromForm({ ...values, serviceArea: { scope: "countries", countries: [] } })
        .serviceArea,
    ).toBeNull();
    expect(
      draftPayloadFromForm({ ...values, serviceArea: { scope: "countries", countries: ["pt"] } })
        .serviceArea,
    ).toEqual({ scope: "countries", countries: ["pt"] });
  });
  it("keeps categories and local connections in recovery before a project name is entered", async () => {
    await act(async () => {
      state.form.setValue("categoryId", 1);
      state.form.setValue("localConnections", ["diaspora"]);
    });
    const recovery = JSON.parse(localStorage.getItem("hd:submission:saving-test:new")!);
    expect(recovery.values.categoryId).toBe(1);
    expect(recovery.values.localConnections).toEqual(["diaspora"]);
    expect(recovery.values.name).toBe("");
    await advance(5000);
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
