const { expect, test } = require("@playwright/test")

test("customer homepage is request-rendered and private", async ({ page }) => {
  const response = await page.goto("/")

  expect(response.status()).toBe(200)
  expect(response.headers()["cache-control"]).toContain("private")
  expect(response.headers()["cache-control"]).toContain("no-store")
  await expect(page.locator("h1")).toBeVisible()
  await expect(page.locator("body")).not.toContainText("Application error")
})

test("a clean UK request is rendered with only the UK collection", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: {
      "x-forwarded-for": "81.2.69.142",
    },
  })
  const page = await context.newPage()

  await page.goto("/")

  await expect(page.getByRole("heading", { name: "UK Collection" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "All Users Collection" })).toHaveCount(0)
  await context.close()
})

test("the troubleshooting lab is unavailable in production", async ({ page }) => {
  const response = await page.goto("/optimization-lab")
  expect(response.status()).toBe(404)
})
