const { defineConfig } = require("@playwright/test")
const dotenv = require("dotenv")

dotenv.config()

const labSecret =
  process.env.OPTIMIZATION_LAB_SECRET

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:9019",
    extraHTTPHeaders: labSecret
      ? { "x-optimization-lab-secret": labSecret }
      : undefined,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:9019",
    reuseExistingServer: true,
    timeout: 120000,
  },
})
