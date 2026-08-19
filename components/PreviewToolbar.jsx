import { useMemo, useState } from "react"
import Link from "next/link"
import siteLocales from "../config/locales"
import { formatTimelineTimestamp } from "../lib/contentful-preview.mjs"

const MODE_LABELS = {
  current: "Current drafts",
  release: "Selected release",
  timeline: "Selected date",
}

function normalizeImageUrl(value) {
  if (typeof value !== "string") return null
  return value.startsWith("//") ? `https:${value}` : value
}

function Value({ row }) {
  if (!row) return <span className="text-slate-400">Not present</span>

  if (row.kind === "image" && normalizeImageUrl(row.value)) {
    return (
      <div className="flex items-center gap-3">
        {/* A raw image is intentional here: this diagnostic displays the exact API asset URL. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Contentful asset comparison"
          className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-contain"
          src={normalizeImageUrl(row.value)}
        />
        <span className="break-all text-xs text-slate-600">{row.referenceId}</span>
      </div>
    )
  }

  return <span className="whitespace-pre-wrap break-words">{row.value}</span>
}

function Comparison({ comparison }) {
  const [changedOnly, setChangedOnly] = useState(true)
  const rows = useMemo(() => {
    const states = [comparison?.published || [], comparison?.current || [], comparison?.selected || []]
    const keys = [...new Set(states.flatMap((items) => items.map((item) => item.key)))]

    return keys
      .map((key) => {
        const values = states.map((items) => items.find((item) => item.key === key) || null)
        const serialized = values.map((value) => JSON.stringify(value?.value ?? null))
        return {
          key,
          label: values.find(Boolean)?.path || key,
          values,
          changed: new Set(serialized).size > 1,
        }
      })
      .filter((row) => !changedOnly || row.changed)
  }, [changedOnly, comparison])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-950">Content comparison</h3>
          <p className="text-sm text-slate-600">
            Published delivery, latest draft, and the selected Timeline state.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            checked={changedOnly}
            onChange={(event) => setChangedOnly(event.target.checked)}
            type="checkbox"
          />
          Differences only
        </label>
      </div>

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[860px] table-fixed text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="w-1/5 px-4 py-3">Field</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Current draft</th>
                <th className="px-4 py-3">Selected state</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.slice(0, 120).map((row) => (
                <tr className={row.changed ? "bg-amber-50/70" : "bg-white"} key={row.key}>
                  <th className="px-4 py-3 align-top font-mono text-xs text-slate-600">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td className="px-4 py-3 align-top text-slate-800" key={index}>
                      <Value row={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          No differences were found between these three content states.
        </div>
      )}
    </div>
  )
}

function RelationshipNode({ node, depth = 0 }) {
  if (!node) return null

  return (
    <li className={depth ? "ml-5 border-l border-slate-200 pl-4" : ""}>
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <span className="rounded bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700">
          {node.field}
        </span>
        <strong className="text-sm text-slate-950">{node.label}</strong>
        <span className="text-xs text-slate-500">{node.type}</span>
        <span
          className={`ml-auto rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${
            node.status === "published"
              ? "bg-emerald-100 text-emerald-800"
              : node.status === "changed"
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-800"
          }`}
        >
          {node.circular ? "circular link" : node.status}
        </span>
        <code className="w-full truncate text-[11px] text-slate-400">{node.id}</code>
      </div>
      {node.children?.length ? (
        <ul>
          {node.children.map((child, index) => (
            <RelationshipNode depth={depth + 1} key={`${child.id}-${child.field}-${index}`} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function Relationships({ tree }) {
  return (
    <div>
      <h3 className="font-bold text-slate-950">Content relationships</h3>
      <p className="mb-4 text-sm text-slate-600">
        Follow the references Contentful resolved for this page, including entries and assets.
      </p>
      {tree ? (
        <ul>
          <RelationshipNode node={tree} />
        </ul>
      ) : (
        <p className="rounded-xl bg-slate-100 p-4 text-sm">No relationship data is available.</p>
      )}
    </div>
  )
}

function Locales({ rows }) {
  return (
    <div>
      <h3 className="font-bold text-slate-950">Localization coverage</h3>
      <p className="mb-4 text-sm text-slate-600">
        A check means the field has an authored value in that locale. Fallback values are not counted as translations.
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[620px] w-full text-left text-sm">
          <thead className="bg-slate-950 text-white">
            <tr>
              <th className="px-4 py-3">Content field</th>
              {siteLocales.locales.map((locale) => (
                <th className="px-4 py-3 text-center" key={locale}>
                  {locale}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {(rows || []).slice(0, 120).map((row) => (
              <tr key={row.key}>
                <th className="px-4 py-3 font-medium text-slate-700">{row.label}</th>
                {siteLocales.locales.map((locale) => (
                  <td className="px-4 py-3 text-center" key={locale}>
                    <span
                      className={
                        row.availability?.[locale]
                          ? "text-lg font-bold text-emerald-600"
                          : "text-lg text-slate-300"
                      }
                    >
                      {row.availability?.[locale] ? "✓" : "—"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PreviewToolbar({ status, workspace }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("compare")

  if (!status?.enabled) return null

  const modeLabel = MODE_LABELS[status.mode] || "Preview"
  const formattedTimestamp = formatTimelineTimestamp(status.timestamp)

  return (
    <section className="sticky top-[73px] z-30 border-y border-blue-300/40 bg-blue-950 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <span className="flex items-center gap-2 font-bold">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
          Contentful Preview
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{modeLabel}</span>
        <span className="text-xs text-blue-100">Locale: {status.locale}</span>
        <span className="text-xs text-blue-100">Environment: {status.environment}</span>
        {status.releaseId ? (
          <span className="max-w-52 truncate text-xs text-blue-100">Release: {status.releaseId}</span>
        ) : null}
        {formattedTimestamp ? (
          <span className="text-xs text-blue-100">At: {formattedTimestamp}</span>
        ) : null}
        <div className="ml-auto flex gap-2">
          <button
            className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-bold text-blue-950 transition hover:bg-cyan-200"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? "Close preview tools" : "Open preview tools"}
          </button>
          <Link
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-bold transition hover:bg-white/10"
            href="/api/disable-preview"
          >
            Exit preview
          </Link>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-slate-50 text-slate-900">
          <div className="mx-auto max-h-[62vh] max-w-7xl overflow-auto px-4 py-5 sm:px-6 lg:px-8">
            <div className="mb-5 flex flex-wrap gap-2">
              {[
                ["compare", "Compare content"],
                ["relationships", "Relationships"],
                ["locales", "Locales"],
              ].map(([value, label]) => (
                <button
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    tab === value
                      ? "bg-blue-700 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                  }`}
                  key={value}
                  onClick={() => setTab(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "compare" ? <Comparison comparison={workspace?.comparison} /> : null}
            {tab === "relationships" ? <Relationships tree={workspace?.relationships} /> : null}
            {tab === "locales" ? <Locales rows={workspace?.locales} /> : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
