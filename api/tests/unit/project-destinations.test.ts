import { projectLinkReferralHref } from "@hubdigital/shared";
import { describe, expect, it } from "vitest";
import { projectAppStore, projectLinkDisplayLabel, projectLinkHref, projectPublicationSchema, projectLinkActionLabel } from "@hubdigital/shared";
import { sanitizeProjectDescription } from "@/utils/project-content";

const project = { name: "Nha projeto", shortDescription: "Uma ideia útil para a comunidade", projectStage: "idea", availability: "not_available", categoryId: 1 };
describe("project destinations and publication", () => {
  it("lets an idea publish without a website, business model, pricing, audience or platforms", () => {
    expect(projectPublicationSchema.safeParse(project).success).toBe(true);
  });
  it("requires a primary destination for a usable product or signup, and keeps beta separate from licensing", () => {
    for (const availability of ["available", "waitlist", "invite_only", "public_beta"]) {
      expect(projectPublicationSchema.safeParse({ ...project, availability }).success).toBe(false);
      expect(projectPublicationSchema.safeParse({ ...project, availability, sourceModel: "open_source", links: [{ kind: "repository", url: "https://codeberg.org/maker/tool", isPrimary: true }] }).success).toBe(true);
    }
  });
  it("rejects multiple primary links and duplicate destinations", () => {
    expect(projectPublicationSchema.safeParse({ ...project, links: [
      { kind: "website", url: "https://example.cv", isPrimary: true }, { kind: "demo", url: "example.cv", isPrimary: true },
    ] }).success).toBe(false);
  });
  it.each(["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "ftp://example.cv", "//example.cv", "https://user:secret@example.cv", "https://example.cv\njavascript:alert(1)"])("does not produce an executable destination for %s", (url) => {
    expect(projectLinkHref({ kind: "website", url })).toBeNull();
  });
  it("normalizes ordinary addresses while preserving queries and fragments", () => {
    expect(projectLinkHref({ kind: "website", url: "example.cv/path?token=abc#demo" })).toBe("https://example.cv/path?token=abc#demo");
    expect(projectLinkHref({ kind: "other", url: "mailto:team@example.cv" })).toBeNull();
    expect(projectLinkActionLabel({ kind: "app_store" }, "available")).toBe("Instalar");
    expect(projectLinkActionLabel({ kind: "repository" }, "available")).toBe("Ver código");
  });
  it("recognises App Store and Google Play links by host", () => {
    expect(projectAppStore({ kind: "app_store", url: "https://apps.apple.com/app/id123" })).toBe("apple");
    expect(projectAppStore({ kind: "app_store", url: "play.google.com/store/apps/details?id=cv.hub" })).toBe("google_play");
    expect(projectAppStore({ kind: "app_store", url: "https://appgallery.huawei.com/app/C1" })).toBeNull();
    expect(projectAppStore({ kind: "website", url: "https://apps.apple.com/app/id123" })).toBeNull();
    expect(projectLinkDisplayLabel({ kind: "app_store", url: "https://play.google.com/store/apps/details?id=cv.hub" })).toBe("Google Play");
    expect(projectLinkDisplayLabel({ kind: "app_store", url: "https://apps.apple.com/app/id123", label: "iPhone" })).toBe("iPhone");
  });
  it("removes executable HTML while retaining supported rich text", () => {
    const result = sanitizeProjectDescription('<p onclick="bad()"><strong>Olá</strong><script>bad()</script><img src=x onerror=bad()><iframe src="https://bad.test"></iframe><a href="javascript:bad()">Mau</a><a href="https://example.cv">Bom</a></p>');
    expect(result).toContain("<strong>Olá</strong>");
    expect(result).toContain('href="https://example.cv"');
    expect(result).not.toMatch(/onclick|onerror|javascript:|<script|<img|<iframe/);
  });
});

it("attributes only opted-in plain websites, preserving fragments and signed queries",()=>{
 expect(projectLinkReferralHref({kind:"website",url:"https://example.com/path#demo",referralAttribution:true})).toBe("https://example.com/path?utm_source=hubdigital&utm_medium=referral#demo");
 expect(projectLinkReferralHref({kind:"website",url:"https://example.com/?token=x",referralAttribution:true})).toBe("https://example.com/?token=x");
 expect(projectLinkReferralHref({kind:"app_store",url:"https://apps.apple.com/app/example",referralAttribution:true})).toBe("https://apps.apple.com/app/example");
});
