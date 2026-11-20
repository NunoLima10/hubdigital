import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Input } from "../src/components/ui/input";
import { Textarea } from "../src/components/ui/textarea";

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function renderControl(element: ReactElement, selector: string) {
  await act(async () => {
    root.render(element);
  });
  return container.querySelector<HTMLElement>(selector)!;
}

describe("form control font size", () => {
  it.each([
    ["Input", <Input aria-label="Nome" />, "input"],
    ["Textarea", <Textarea aria-label="Descrição" />, "textarea"],
  ])("renders %s at 16px on mobile to prevent iOS focus zoom", async (_, element, selector) => {
    const control = await renderControl(element, selector);

    expect(control.classList.contains("text-base")).toBe(true);
    expect(control.classList.contains("md:text-sm")).toBe(true);
    expect(control.classList.contains("text-sm")).toBe(false);
  });
});
