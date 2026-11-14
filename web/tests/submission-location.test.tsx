import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useForm, type UseFormReturn } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { islandValues } from "@hubdigital/shared";
import { LocationFields } from "@/modules/submit/ui/components/location-fields/location-fields";
import { initialProjectValues } from "@/modules/submit/context/initial-project-values";
import type { CreateProjectInput } from "@/modules/submit/types/project";

vi.mock("@/modules/submit/ui/components/location-fields/public-pin-picker", () => ({
  PublicPinPicker: () => <div data-testid="public-pin-picker" />,
}));

let root: Root;
let container: HTMLDivElement;
let form: UseFormReturn<CreateProjectInput>;

function Harness() {
  form = useForm<CreateProjectInput>({ defaultValues: initialProjectValues });
  return <LocationFields form={form} />;
}

function button(text: string) {
  return [...document.querySelectorAll("button")].find((item) => item.textContent === text)!;
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Harness />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("submission location choices", () => {
  it("keeps location optional and shows flags in the country list and selected country", async () => {
    expect(container.querySelector('input[type="radio"]')).toBeNull();
    expect(form.getValues("location.country")).toBe("");
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="País da base do projeto"]')!.click();
    });
    const portugal = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((item) => item.textContent === "Portugal")!;
    expect(portugal.querySelector(".fi-pt")).not.toBeNull();
    await act(async () => portugal.click());
    expect(form.getValues("location.country")).toBe("pt");
    expect(container.querySelector('[aria-label="País da base do projeto"] .fi-pt')).not.toBeNull();
    await act(async () => button("Não informar país").click());
    expect(form.getValues("location.country")).toBe("");
  });

  it("shows onboarding island cards for Cabo Verde with single selection", async () => {
    await act(async () => form.setValue("location.country", "cv"));
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios.length).toBe(islandValues.length);
    expect(radios[0].closest("label")!.querySelector("svg")).not.toBeNull();
    await act(async () => radios[0].click());
    expect(form.getValues("location.island")).toBe(islandValues[0]);
    expect(radios[0].checked).toBe(true);
    await act(async () => radios[1].click());
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(true);
    await act(async () => button("Não informar ilha").click());
    expect(form.getValues("location.island")).toBe("");
    expect(form.getValues("location.country")).toBe("cv");
  });

  it("clears stale finer location data and the pin when changing islands", async () => {
    await act(async () => form.setValue("location", {
      country: "cv", island: "CV1", municipality: "11", zone: "old-zone",
      locality: "Old locality", publicPin: { latitude: 17, longitude: -25, precision: "exact" },
    }));
    await act(async () => container.querySelector<HTMLInputElement>('input[value="CV2"]')!.click());
    expect(form.getValues("location")).toEqual({
      country: "cv", island: "CV2", municipality: "", zone: "", locality: "", publicPin: null,
    });
  });

  it("clears island data and hides the cards when the country changes", async () => {
    await act(async () => form.setValue("location.country", "cv"));
    await act(async () => container.querySelector<HTMLInputElement>('input[value="CV1"]')!.click());
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="País da base do projeto"]')!.click();
    });
    const portugal = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((item) => item.textContent === "Portugal")!;
    await act(async () => portugal.click());
    expect(form.getValues("location.country")).toBe("pt");
    expect(form.getValues("location.island")).toBe("");
    expect(container.querySelector('input[type="radio"]')).toBeNull();
  });
});
