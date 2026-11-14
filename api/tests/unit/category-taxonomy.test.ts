import { describe, expect, it } from "vitest";
import { categoryCatalog, categoryMatchesSearch, categorySuggestions, groupCategories } from "@hubdigital/shared";

describe("category browsing", () => {
  it("finds specific categories using accents and common alternative terms", () => {
    expect(categoryMatchesSearch({ key: "languages", name: "Línguas" }, "kriolu")).toBe(true);
    expect(categoryMatchesSearch({ key: "ecommerce", name: "Comércio eletrónico" }, "comercio")).toBe(true);
    expect(categoryMatchesSearch({ key: "data_analytics", name: "Dados & Análise" }, "analytics")).toBe(true);
    expect(categoryMatchesSearch({ key: "payments", name: "Pagamentos" }, "turismo")).toBe(false);
  });

  it("keeps moderator-created categories selectable and includes each choice exactly once", () => {
    const choices = [{ id: 1, key: "payments", name: "Pagamentos" }, { id: 2, key: "custom", name: "Categoria da comunidade" }];
    const groups = groupCategories(choices);
    expect(groups.flatMap((group) => group.categories.map((category) => category.id)).sort()).toEqual([1, 2]);
    expect(groups.find((group) => group.key === "other")?.categories[0]).toEqual(choices[1]);
    expect(categoryMatchesSearch(choices[1], "comunidade")).toBe(true);
  });
  it("prioritizes builder categories while leaving every local category searchable", () => {
    const original = [...categoryCatalog];
    const suggestions = categorySuggestions(original);
    expect(suggestions).toHaveLength(12);
    expect(suggestions.slice(0, 4).map((item) => item.key)).toEqual(["ai", "developer_tools", "apis", "automation"]);
    expect(categorySuggestions(original, "agricultura").map((item) => item.key)).toEqual(["agritech"]);
    expect(categorySuggestions(original, "kubernetes").map((item) => item.key)).toEqual(["devops"]);
    expect(categorySuggestions(original, "iot").map((item) => item.key)).toEqual(["iot"]);
    expect(original).toEqual(categoryCatalog);
    expect(new Set(categoryCatalog.map((item) => item.key)).size).toBe(categoryCatalog.length);
    expect(groupCategories(original).flatMap((group) => group.categories)).toHaveLength(categoryCatalog.length);
  });

});
