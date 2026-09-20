import { test, expect } from "@playwright/test";
test("sign-in offers simple Google account creation", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(
    page.getByRole("heading", { name: "Create your account or sign in." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(page.getByText("Invitation-only pilot")).toHaveCount(0);
});
test("desktop preview: chat, journal and explicit memory controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/preview");
  await expect(
    page.getByRole("textbox", { name: "Your message" }),
  ).toBeVisible();
  await expect(page.getByText("Owner dashboard", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("textbox", { name: "Your message" })
    .fill("School mornings are difficult");
  await page.screenshot({ path: "docs/preview-chat.png", fullPage: true });
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByText("School mornings are difficult", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Journal", exact: true })
    .click();
  await page.getByRole("button", { name: "Add a note", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox")
    .fill("A quieter breakfast helped.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save note", exact: true })
    .click();
  await expect(
    page.getByText("A quieter breakfast helped.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /What we remember/ })
    .first()
    .click();
  await expect(page.getByText(/Nothing added silently/)).toBeVisible();
  await page.screenshot({ path: "docs/preview-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("mobile preview: no horizontal overflow and usable navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview");
  await expect(
    page.getByRole("textbox", { name: "Your message" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const footer = await page.locator(".composer-footer").boundingBox();
  const nav = await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(nav!.y);
  await page.screenshot({ path: "docs/preview-mobile.png", fullPage: true });
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "My child" })
    .click();
  await expect(
    page.getByRole("heading", { name: /A little understanding/ }),
  ).toBeVisible();
});
test("unconfigured services fail closed; jobs cannot run anonymously", async ({
  request,
}) => {
  const data = await request.get("/api/data");
  expect(data.status()).toBe(503);
  expect((await data.json()).error).not.toContain("SUPABASE");
  const job = await request.get("/api/jobs");
  expect(job.status()).toBe(401);
  const chat = await request.post("/api/chat", { data: { message: "test" } });
  expect(chat.status()).toBe(503);
  expect(chat.headers()["cache-control"]).toContain("no-store");
});
