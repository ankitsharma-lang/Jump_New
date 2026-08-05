const { expect, test } = require("@playwright/test")

test("existing storefront still renders", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("h1")).toBeVisible()
  await expect(page.locator("body")).not.toContainText("Application error")
})

test("optimization lab exposes the troubleshooting controls", async ({ page }) => {
  await page.goto("/optimization-lab")

  await expect(page.getByRole("heading", { name: "Optimization troubleshooting lab" })).toBeVisible()
  await expect(page.getByTestId("ssr-status")).toContainText("SSR generated")
  await expect(page.getByTestId("consent-state")).toBeVisible()
  await expect(page.getByTestId("merge-tag-output")).toContainText("Hello")
  await expect(page.getByTestId("flag-output")).toContainText("Baseline flag")
  await expect(
    page
      .getByTestId("client-experiment-grid")
      .locator('article[data-testid^="optimization-card-"]')
  ).toHaveCount(3)
})

test("identity, consent, and event controls are interactive", async ({ page }) => {
  await page.goto("/optimization-lab")

  await page.getByTestId("identify-user").click()
  await expect(page.getByTestId("lab-status")).toContainText("Identify completed")

  await page.getByRole("button", { name: "Deny and purge queue" }).click()
  await expect(page.getByTestId("consent-state")).toContainText("false")

  await page.getByRole("button", { name: "Accept events + persistence" }).click()
  await expect(page.getByTestId("consent-state")).toContainText("true")
})

test("conversion control remains available on every resolved card", async ({ page }) => {
  await page.goto("/optimization-lab")
  const conversionButtons = page
    .getByTestId("client-experiment-grid")
    .getByTestId("optimization-card-conversion")
  await expect(conversionButtons).toHaveCount(3)
  await conversionButtons.first().click()
  await expect(page.getByTestId("lab-status")).toContainText("Conversion completed")
})
