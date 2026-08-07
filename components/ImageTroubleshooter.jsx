import { useMemo, useState } from "react"
import {
  buildContentfulImageUrl,
  IMAGE_FITS,
  IMAGE_FOCUS_AREAS,
  IMAGE_FORMATS,
} from "../lib/contentful-image"

function Select({ label, onChange, options, value }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-500 transition focus:ring-2"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function ImageTroubleshooter({ image, settings = {} }) {
  const [fit, setFit] = useState("scale")
  const [focus, setFocus] = useState("center")
  const [format, setFormat] = useState("webp")
  const [quality, setQuality] = useState(85)
  const [copied, setCopied] = useState(false)
  const file = image?.fields?.file
  const dimensions = file?.details?.image
  const sourceUrl = file?.url
  const imageUrl = useMemo(
    () =>
      buildContentfulImageUrl(sourceUrl, {
        width: 900,
        height: 620,
        fit,
        focus,
        format,
        quality,
      }),
    [fit, focus, format, quality, sourceUrl]
  )

  if (!imageUrl) return null

  const copyUrl = async () => {
    await navigator.clipboard.writeText(imageUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
      <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
        <div className="flex min-h-[360px] items-center justify-center bg-[linear-gradient(135deg,#eef2ff_0%,#ecfeff_100%)] p-6">
          {/* This intentionally displays the exact Contentful Images API URL produced by the controls. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={image.fields?.description || image.fields?.title || settings.productImageAltFallback}
            className="h-[320px] w-full rounded-2xl border border-white/80 bg-white/70 shadow-inner"
            src={imageUrl}
            style={{ objectFit: fit === "fill" || fit === "crop" || fit === "thumb" ? "cover" : "contain" }}
          />
        </div>

        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
            {settings.imageToolEyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            {settings.imageToolTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {settings.imageToolDescription}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Select label={settings.imageToolFitLabel} onChange={setFit} options={IMAGE_FITS} value={fit} />
            <Select label={settings.imageToolFocusLabel} onChange={setFocus} options={IMAGE_FOCUS_AREAS} value={focus} />
            <Select label={settings.imageToolFormatLabel} onChange={setFormat} options={IMAGE_FORMATS} value={format} />
            <label className="text-sm font-semibold text-slate-700">
              {settings.imageToolQualityLabel}: {quality}
              <input
                className="mt-3 w-full accent-blue-600"
                max="100"
                min="20"
                onChange={(event) => setQuality(Number(event.target.value))}
                type="range"
                value={quality}
              />
            </label>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
            <div>
              <dt className="text-slate-500">{settings.imageToolOriginalSizeLabel}</dt>
              <dd className="font-bold text-slate-900">
                {dimensions ? `${dimensions.width} × ${dimensions.height}` : settings.unknownValueLabel}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{settings.imageToolOriginalFileLabel}</dt>
              <dd className="truncate font-bold text-slate-900">{file?.fileName || settings.unknownValueLabel}</dd>
            </div>
          </dl>

          <button
            className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            onClick={copyUrl}
            type="button"
          >
            {copied ? `${settings.imageToolCopyLabel} ✓` : settings.imageToolCopyLabel}
          </button>
        </div>
      </div>
    </section>
  )
}
