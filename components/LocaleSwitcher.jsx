import { useRouter } from "next/router"
import siteLocales from "../config/locales"

export default function LocaleSwitcher({ label, localeOptions = [] }) {
  const router = useRouter()
  const activeLocale = router.locale || siteLocales.defaultLocale

  const changeLocale = async (event) => {
    const locale = event.target.value
    await router.push(router.asPath, router.asPath, { locale })
  }

  return (
    <label className="relative flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur">
      <span aria-hidden="true">◎</span>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="cursor-pointer appearance-none bg-transparent pr-5 font-semibold text-white outline-none"
        onChange={changeLocale}
        value={activeLocale}
      >
        {(localeOptions.length
          ? localeOptions
          : (router.locales || siteLocales.locales).map((locale) => ({
              code: locale,
              label: locale,
            }))
        ).map((option) => (
          <option className="text-slate-950" key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-3 text-xs">
        ▾
      </span>
    </label>
  )
}
