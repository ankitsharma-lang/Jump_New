import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from "@contentful/live-preview/react";
import LocaleSwitcher from "../components/LocaleSwitcher";
import PersonalizationNotice from "../components/PersonalizationNotice";
import PreviewToolbar from "../components/PreviewToolbar";
import siteLocales from "../config/locales";

const MainLayout = (props) => {
  const router = useRouter();
  const locale = router.locale || siteLocales.defaultLocale;
  const direction = siteLocales.rtlLocales.includes(locale) ? "rtl" : "ltr";
  const siteSettings = useContentfulLiveUpdates(props.siteSettings);
  const settings = siteSettings?.fields || {};
  const inspectorProps = useContentfulInspectorMode({ entryId: siteSettings?.sys?.id });
  const siteName = settings.siteName || "";
  const brandMark = siteName.trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950" dir={direction} lang={locale}>
      <Head>
        <title>{siteName}</title>
        <meta content={settings.defaultMetaDescription || ""} name="description" />
        <meta content="#071a3d" name="theme-color" />
      </Head>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071a3d]/95 text-white shadow-xl shadow-slate-950/10 backdrop-blur-xl">
        <div className="mx-auto flex h-[73px] max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link className="group flex items-center gap-3" href="/">
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-blue-950/30">
              <span className="absolute -left-2 top-2 h-6 w-6 rotate-45 rounded-sm bg-[#ff5a47]" />
              <span className="absolute -right-1 bottom-1 h-7 w-7 rotate-45 rounded-sm bg-[#4a5cff]" />
              <span className="relative text-sm font-black text-slate-950">{brandMark}</span>
            </span>
            <span>
              <span
                className="block text-sm font-black tracking-tight sm:text-base"
                {...inspectorProps({ fieldId: "siteName" })}
              >
                {siteName}
              </span>
              <span
                className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200 sm:block"
                {...inspectorProps({ fieldId: "siteTagline" })}
              >
                {settings.siteTagline}
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold text-blue-100 sm:flex">
            <Link className="transition hover:text-white" href="/">
              {settings.navigationLabel}
            </Link>
          </nav>

          <PersonalizationNotice
            baselineLabel={settings.baselineLabel}
            personalizedLabel={settings.personalizedLabel}
          />
          <LocaleSwitcher
            label={settings.languageSelectorLabel}
            localeOptions={props.localeOptions}
          />
        </div>
      </header>

      <PreviewToolbar status={props.previewStatus} workspace={props.previewWorkspace} />

      <main>{props.children}</main>

      <footer className="mt-20 border-t border-slate-800 bg-[#071a3d] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <p className="text-lg font-black" {...inspectorProps({ fieldId: "siteName" })}>
              {siteName}
            </p>
            <p
              className="mt-2 max-w-md text-sm leading-6 text-blue-100"
              {...inspectorProps({ fieldId: "footerDescription" })}
            >
              {settings.footerDescription}
            </p>
          </div>
          <div className="md:text-right">
            <a
              className="inline-flex rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold transition hover:bg-white/10"
              href={settings.documentationLinkUrl}
              rel="noreferrer"
              target="_blank"
            >
              {settings.documentationLinkLabel} ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
