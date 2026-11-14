// Run against the local API and web dev servers. PLAYWRIGHT_MODULE can point
// to an existing Playwright installation when it is not a workspace dependency.
const { chromium, expect } = require(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test",
);
const { mkdirSync } = require("node:fs");
const { resolve } = require("node:path");
const assert = require("node:assert/strict");

const origin = process.env.BACKLOG_WEB_URL || "http://localhost:5173";
const artifacts = resolve(
  process.env.BACKLOG_ARTIFACTS || "web/node_modules/.tmp/backlog-qa",
);
mkdirSync(artifacts, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${origin}/map`);
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 60000,
    });
    await expect(
      page.getByRole("button", { name: /Ver \d+ projetos/ }),
    ).toBeVisible();
    const layout = await page.locator(".leaflet-container").boundingBox();
    assert(
      layout.height > 650,
      `Expected the map to dominate the viewport, got ${layout.height}px`,
    );
    assert(layout.width >= 380, "Map should fill mobile width");
    assert.equal(
      await page
        .getByRole("complementary", { name: "Projetos no mapa" })
        .isVisible(),
      false,
    );
    await page.waitForFunction(
      () => {
        const tiles = [...document.querySelectorAll(".leaflet-tile")];
        return tiles.length > 0 && tiles.every((tile) => tile.complete && tile.naturalWidth > 0);
      },
      undefined,
      { timeout: 30000 },
    );
    await page.screenshot({ path: resolve(artifacts, "map-mobile.png") });
    // Exercise gestures without generating automated tile traffic to OSM.
    await page.route("https://tile.openstreetmap.org/**", (route) =>
      route.abort(),
    );
    const touch = await context.newCDPSession(page);
    const readCamera = () => page.evaluate(() => sessionStorage.getItem("hub-map-camera:cv::"));
    const initialZoom = JSON.parse(await readCamera()).zoom;
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 160, y: 300, id: 1 }, { x: 240, y: 300, id: 2 }] });
    for (let step = 1; step <= 4; step++) {
      await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 160 - step * 15, y: 300, id: 1 }, { x: 240 + step * 15, y: 300, id: 2 }] });
    }
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(async () => JSON.parse(await readCamera()).zoom).toBeGreaterThan(initialZoom);
    const beforePan = await readCamera();
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 300, y: 450, id: 1 }] });
    for (let step = 1; step <= 4; step++) {
      await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 300 + step * 8, y: 450 - step * 10, id: 1 }] });
    }
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(readCamera).not.toBe(beforePan);
    await touch.detach();
    console.log("PASS: touch panning and pinch-to-zoom");
    await page.getByRole("button", { name: /Filtros do mapa/ }).click();
    await expect(
      page.getByRole("dialog", { name: "Filtros do mapa" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: /Ver \d+ projetos/ }).click();
    await expect(
      page.getByRole("dialog", { name: "Projetos no mapa" }),
    ).toBeVisible();
    const choice = page.getByRole("dialog").locator("li button").first();
    await choice.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("article", { name: "Projeto selecionado" }),
    ).toBeVisible();
    // Panning/zooming must survive leaving for a project's detail and going back.
    await expect
      .poll(
        async () =>
          JSON.parse(
            await page.evaluate(() =>
              sessionStorage.getItem("hub-map-camera:cv::"),
            ),
          )?.zoom,
      )
      .toBe(9);
    await page.locator(".leaflet-control-zoom-in").click();
    await expect
      .poll(
        async () =>
          JSON.parse(
            await page.evaluate(() =>
              sessionStorage.getItem("hub-map-camera:cv::"),
            ),
          )?.zoom,
      )
      .toBe(10);
    const camera = await page.evaluate(() =>
      sessionStorage.getItem("hub-map-camera:cv::"),
    );
    await page
      .getByRole("article", { name: "Projeto selecionado" })
      .getByRole("link", { name: "Ver projeto" })
      .click();
    await page.waitForURL(/\/projects\//);
    await page.goBack();
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(
      page.getByRole("article", { name: "Projeto selecionado" }),
    ).toBeVisible();
    assert.equal(
      await page.evaluate(() => sessionStorage.getItem("hub-map-camera:cv::")),
      camera,
    );
    await page.setViewportSize({ width: 320, height: 568 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({ path: resolve(artifacts, "map-small-phone.png") });
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(
      page.getByRole("complementary", { name: "Projetos no mapa" }),
    ).toBeHidden();
    await page.screenshot({ path: resolve(artifacts, "map-landscape.png") });
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(
      page.getByRole("complementary", { name: "Projetos no mapa" }),
    ).toBeVisible();
    await page.screenshot({ path: resolve(artifacts, "map-desktop.png") });
    console.log(
      "PASS: mobile map space, panels, selection, camera restoration, small phones, landscape and desktop",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("button", { name: "Procurar projetos", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Procurar projetos" }),
    ).toBeVisible();
    const select = async (name, option) => {
      await page.getByRole("combobox", { name, exact: true }).click();
      await page.getByRole("option", { name: option, exact: true }).click();
    };
    await select("Disponibilidade", "Beta público");
    await select("Fase do projeto", "Protótipo");
    await select("Procura ajuda com", "Marketing");
    await expect(page).toHaveURL(/availability=public_beta/);
    await expect(page).toHaveURL(/projectStage=prototype/);
    await expect(page).toHaveURL(/helpWanted=marketing/);
    await page.reload();
    await expect(
      page.getByRole("dialog", { name: "Procurar projetos" }),
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole("combobox", { name: "Disponibilidade", exact: true }),
    ).toContainText("Beta público");
    await page.screenshot({ path: resolve(artifacts, "discovery-mobile.png") });
    await page
      .getByRole("button", { name: "Limpar filtros", exact: true })
      .click();
    assert(!new URL(page.url()).searchParams.has("availability"));
    assert(!new URL(page.url()).searchParams.has("projectStage"));
    assert(!new URL(page.url()).searchParams.has("helpWanted"));
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    console.log(
      "PASS: filter controls, combined URL state, share/reload, clear and keyboard dismissal",
    );

    // Browser mocks isolate writes from the user's local catalogue. API tests
    // exercise the real authorization, persistence and invitation lifecycle.
    const catalogue = await (
      await fetch("http://localhost:3001/v1/projects?limit=1")
    ).json();
    const example = await (
      await fetch(`http://localhost:3001/v1/projects/${catalogue.data[0].slug}`)
    ).json();
    const published = {
      ...example.data,
      id: 9999,
      status: "published",
      helpWanted: ["marketing", "investment"],
      helpDescription: "Ajuda-nos a divulgar o projeto.",
      author: {
        id: "qa-owner",
        name: "QA Owner",
        handle: "qa-owner",
        image: null,
      },
    };
    let members = [];
    let savedBody;
    await page.route("**/v1/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      let data;
      if (path.endsWith("/auth/get-session")) {
        return route.fulfill({
          json: {
            user: {
              id: "qa-owner",
              name: "QA Owner",
              email: "qa@example.test",
              onboardedAt: new Date().toISOString(),
              emailVerified: true,
            },
            session: {
              id: "qa-session",
              userId: "qa-owner",
              token: "qa-token",
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
            },
          },
        });
      }
      if (path.endsWith("/settings/public"))
        data = { "submissions.open": true };
      else if (path.endsWith("/projects/mine"))
        return route.fulfill({
          json: { data: [published], meta: { total: 1, limit: 20, offset: 0 } },
        });
      else if (path === `/v1/projects/${published.slug}`) data = published;
      else if (path === "/v1/makers/ana-designer")
        data = {
          id: 123,
          name: "Ana Designer",
          handle: "ana-designer",
          image: null,
          bio: "Designer em Cabo Verde",
          projectCount: 1,
          totalUpvotes: 0,
          joinedAt: new Date().toISOString(),
          projects: [published],
          ownedProjects: [],
          collaborations: [{ ...published, contributionRole: "Designer" }],
        };
      else if (path.endsWith("/categories"))
        data = [{ id: 1, name: "Ferramentas", key: "tools" }];
      else if (path.endsWith("/members/search"))
        data = [
          {
            userId: "qa-maker",
            name: "Ana Designer",
            handle: "ana-designer",
            image: null,
          },
        ];
      else if (path.endsWith("/members") && request.method() === "POST") {
        const body = request.postDataJSON();
        members = [
          {
            id: 99,
            projectId: 9999,
            userId: "qa-maker",
            name: "Ana Designer",
            handle: body.handle,
            image: null,
            status: "pending",
            role: body.role,
          },
        ];
        data = members[0];
      } else if (/\/members\/99$/.test(path)) {
        if (request.method() === "DELETE") members = [];
        else members[0].role = request.postDataJSON().role;
        data = { id: 99 };
      } else if (path.endsWith("/members")) data = members;
      else if (path.endsWith("/check-links"))
        data = [
          {
            index: 0,
            message: "Este link já está associado a outro projeto.",
            project: { name: "Projeto existente", slug: "existing" },
          },
        ];
      else if (
        /\/projects(?:\/9999)?$/.test(path) &&
        ["POST", "PATCH"].includes(request.method())
      ) {
        savedBody = request.postDataJSON();
        data = { id: 9999, slug: "qa-draft" };
      } else data = [];
      return route.fulfill({ json: { data } });
    });
    await page.goto(`${origin}/dashboard/submit`);
    await expect(
      page.getByRole("heading", { name: "Partilha o que estás a construir" }),
    ).toBeVisible({ timeout: 30000 });
    await page.locator('input[name="name"]').fill("QA collaboration draft");
    await page
      .getByRole("button", { name: "Adicionar link", exact: true })
      .click();
    await page
      .locator('input[name="links.0.url"]')
      .fill("https://duplicate.example");
    await expect(
      page.getByRole("link", { name: "Ver Projeto existente" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Passo 4: Comunidade" }).click();
    await page
      .getByRole("checkbox", { name: "Marketing", exact: true })
      .check();
    await page
      .getByRole("checkbox", { name: "Investimento", exact: true })
      .check();
    await expect(
      page.getByRole("button", { name: "Adicionar colaborador" }),
    ).toBeEnabled({ timeout: 15000 });
    await page.getByRole("button", { name: "Adicionar colaborador" }).click();
    await page.getByLabel("Contribuição", { exact: true }).fill("Designer");
    await page
      .getByRole("textbox", { name: "Procurar por nome ou utilizador" })
      .fill("Ana");
    await page.getByRole("button", { name: "Convidar", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Convidar", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(page.getByText("À espera de aceitação")).toBeVisible();
    const roleInput = page.getByRole("textbox", {
      name: "Contribuição de Ana Designer",
    });
    await roleInput.fill("Cofundadora");
    await roleInput.press("Tab");
    await expect(roleInput).toHaveValue("Cofundadora");
    await page.screenshot({
      path: resolve(artifacts, "collaboration-review.png"),
    });
    await page.getByRole("button", { name: "Remover", exact: true }).click();
    await expect(page.getByText("À espera de aceitação")).toHaveCount(0);
    await page.getByRole("button", { name: "Rever projeto", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Revisão do projeto", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Passos de publicação" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Adicionar colaborador" })).toHaveCount(0);
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Publicar projeto", exact: true })).toBeVisible();
    await page.screenshot({ path: resolve(artifacts, "project-review.png") });
    await page.getByRole("button", { name: "Voltar à edição", exact: true }).click();
    await expect(page.getByRole("button", { name: "Passo 4: Comunidade" })).toHaveAttribute("aria-current", "step");
    await expect(page.getByRole("checkbox", { name: "Marketing", exact: true })).toBeChecked();
    assert(
      savedBody.helpWanted.includes("marketing") &&
        savedBody.helpWanted.includes("investment"),
    );
    console.log(
      "PASS: duplicate inline feedback, request persistence, collaborator search, invite, role editing and removal",
    );

    await page.goto(`${origin}/dashboard/releases`);
    await page.getByRole("button", { name: "Editar", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Editar projeto" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Adicionar colaborador" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("checkbox", { name: "Marketing", exact: true }),
    ).toBeChecked();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    members = [
      {
        id: 99,
        projectId: 9999,
        userId: "qa-maker",
        name: "Ana Designer",
        handle: "ana-designer",
        image: null,
        status: "accepted",
        role: "Designer",
      },
    ];
    await page.getByRole("link", { name: "Ver página", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Criadores e colaboradores" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Como podes ajudar", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Procura colaboradores", { exact: true }),
    ).toBeVisible();
    const positions = await page.evaluate(() => ({
      makers: document
        .querySelector("#project-team-title")
        .getBoundingClientRect().top,
      comments: document
        .querySelector("#comments-title")
        .getBoundingClientRect().top,
      requests: document
        .querySelector("#project-requests-title")
        .getBoundingClientRect().top,
    }));
    assert(
      positions.makers < positions.comments &&
        positions.requests > positions.comments,
    );
    await page.getByRole("link", { name: /Ana Designer/ }).click();
    await expect(
      page.getByRole("heading", { name: "Projetos próprios" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Colaborações", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Contribuição: Designer", { exact: true }),
    ).toBeVisible();
    console.log(
      "PASS: published-project editor, maker credits, request placement and separate profile sections",
    );
    assert.deepEqual(errors, [], `Browser errors: ${errors.join("; ")}`);
    console.log(`Screenshots: ${artifacts}`);
  } catch (error) {
    await page.screenshot({ path: resolve(artifacts, "failure.png"), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
