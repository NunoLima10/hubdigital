import { describe, expect, it } from "vitest";
import { sanitizeProjectDescription } from "@/utils/project-content";

describe("untrusted project HTML", () => {
  it("handles nested discarded iframes within the description size limit", () => {
    expect(() => sanitizeProjectDescription("<iframe>".repeat(2500))).not.toThrow();
  });
  it("keeps formatting while removing executable markup and URL schemes", () => {
    const result = sanitizeProjectDescription('<p onclick="alert(1)">Hello <strong>world</strong><script>alert(1)</script><a href="javascript:alert(1)">link</a></p>');
    expect(result).toContain("<strong>world</strong>");
    expect(result).not.toMatch(/onclick|javascript:|<script/);
  });
});
