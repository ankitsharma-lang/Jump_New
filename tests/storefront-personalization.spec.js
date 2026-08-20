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
      "x-vercel-ip-country": "GB",
      "x-vercel-ip-city": "London",
    },
  })
  const page = await context.newPage()

  await page.goto("/")

  await expect(page.getByRole("heading", { name: "UK Collection" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "All Users Collection" })).toHaveCount(0)
  await expect(page.getByText("Personalized for this visit", { exact: true })).toBeVisible()
  await context.close()
})

test("a clean non-UK request renders both collections", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: {
      "x-vercel-ip-country": "US",
      "x-vercel-ip-city": "New York",
    },
  })
  const page = await context.newPage()

  await page.goto("/")

  await expect(page.getByText("All Users Collection", { exact: true })).toBeVisible()
  await expect(page.getByText("UK Collection", { exact: true })).toBeVisible()
  await expect(page.getByText("Curated storefront", { exact: true })).toBeVisible()

  await context.close()
})

test("the troubleshooting lab is unavailable in production", async ({ page }) => {
  const response = await page.goto("/optimization-lab")
  expect(response.status()).toBe(404)
})
