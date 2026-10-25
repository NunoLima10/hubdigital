import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProjectGallery } from "../src/components/project-gallery/project-gallery";

let root: Root;
let container: HTMLDivElement;

function button(label: string) {
  return document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
}

beforeEach(async () => {
  Object.assign(globalThis, {
    IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (callback: FrameRequestCallback) => window.setTimeout(callback, 0),
  });
  window.scrollTo = () => undefined;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <ProjectGallery
        imageUrls={["/first.jpg", "/second.jpg"]}
        projectName="Projeto teste"
      />,
    );
  });
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  document.body.innerHTML = "";
});

describe("project image lightbox", () => {
  it("opens an image and navigates with controls and keyboard arrows", async () => {
    await act(async () => {
      button("Ampliar imagem 1 de Projeto teste").click();
    });

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.querySelector('img[src="/first.jpg"][draggable="false"]')).not.toBeNull();
    expect(document.body.textContent).toContain("1 / 2");

    await act(async () => {
      button("Imagem seguinte").click();
    });
    expect(document.querySelector('img[src="/second.jpg"][draggable="false"]')).not.toBeNull();
    expect(document.body.textContent).toContain("2 / 2");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    });
    expect(document.querySelector('img[src="/first.jpg"][draggable="false"]')).not.toBeNull();
  });

  it("closes from the dedicated close button", async () => {
    await act(async () => {
      button("Ampliar imagem 1 de Projeto teste").click();
    });
    await act(async () => {
      button("Fechar visualização ampliada").click();
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("closes when the backdrop is clicked", async () => {
    await act(async () => {
      button("Ampliar imagem 1 de Projeto teste").click();
    });

    const backdrop = document.querySelector<HTMLElement>("[data-hub-dialog-backdrop]")!;
    await act(async () => {
      backdrop.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      backdrop.click();
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
