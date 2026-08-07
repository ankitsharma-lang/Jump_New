import _ from "lodash"
import siteLocales from "../config/locales"
import { getAllLocales, getLocalizedEntryByField } from "./helpers"

export async function getSiteContent({ locale, preview = false, timeline = null }) {
  const [settingsEntries, contentfulLocales] = await Promise.all([
    getLocalizedEntryByField(
      "siteSettings",
      "key",
      "main",
      preview,
      timeline,
      locale,
      siteLocales.defaultLocale
    ),
    getAllLocales(),
  ])

  const localeOptions = (contentfulLocales || [])
    .filter((item) => siteLocales.locales.includes(item.code))
    .map((item) => ({ code: item.code, label: item.name || item.code }))

  return {
    siteSettings: _.get(settingsEntries, "items[0]", {}),
    localeOptions,
  }
}
