import { useEffect, useMemo, useState } from "react"
import {
  useConsentState,
  useEventStreamState,
  useOptimization,
  useOptimizationActions,
  useProfileState,
  useSelectedOptimizationsState,
} from "@contentful/optimization-nextjs/client"
import { OptimizedEntry } from "../../lib/optimization"
import MergeTagDemo from "./MergeTagDemo"
import OptimizationTestCard from "./OptimizationTestCard"
import PreviewPanelLoader from "./PreviewPanelLoader"

function json(value) {
  return JSON.stringify(value ?? null, null, 2)
}

function eventSummary(event) {
  if (!event) return null
  return {
    type: event.type || event.event || event.name || "event",
    messageId: event.messageId,
    timestamp: event.timestamp,
    experienceId: event.experienceId || event.optimization?.selectedOptimization?.experienceId,
    variantIndex: event.variantIndex ?? event.optimization?.selectedOptimization?.variantIndex,
    entryId: event.componentId || event.entryId,
  }
}

function profileSummary(profile) {
  if (!profile) return null
  return {
    id: profile.id,
    traits: profile.traits,
    location: profile.location,
    audiences: profile.audiences,
  }
}

export default function OptimizationLab({
  audiences,
  cards,
  experiences,
  mergeTags,
  serverOptimization,
  serverRenderedAt,
}) {
  const optimization = useOptimization()
  const consent = useConsentState()
  const profile = useProfileState()
  const selectedOptimizations = useSelectedOptimizationsState()
  const latestEvent = useEventStreamState()
  const {
    flushEvents,
    identifyUser,
    resetUser,
    setConsent,
    trackEvent,
    trackPageView,
    trackScreen,
  } = useOptimizationActions()
  const [userId, setUserId] = useState("support-tester")
  const [firstName, setFirstName] = useState("Alex")
  const [plan, setPlan] = useState("enterprise")
  const [countryCode, setCountryCode] = useState("DE")
  const [city, setCity] = useState("Berlin")
  const [status, setStatus] = useState("Ready")
  const [forwardToDataLayer, setForwardToDataLayer] = useState(false)
  const [forwardedEvents, setForwardedEvents] = useState([])
  const [resolvedEntries, setResolvedEntries] = useState({})

  const flagValue = useMemo(() => {
    profile
    selectedOptimizations
    return optimization.getFlag("support-banner-style") || {
      label: "Baseline flag",
      tone: "slate",
      showBadge: false,
    }
  }, [optimization, profile, selectedOptimizations])

  const summarizedEvent = useMemo(() => eventSummary(latestEvent), [latestEvent])

  useEffect(() => {
    if (!forwardToDataLayer || !summarizedEvent?.messageId) return

    window.dataLayer = window.dataLayer || []
    const forwarded = {
      event: "contentful_optimization_event",
      contentful_event_type: summarizedEvent.type,
      contentful_experience_id: summarizedEvent.experienceId,
      contentful_variant_index: summarizedEvent.variantIndex,
      contentful_entry_id: summarizedEvent.entryId,
      contentful_message_id: summarizedEvent.messageId,
    }
    window.dataLayer.push(forwarded)
    setForwardedEvents((current) => [forwarded, ...current].slice(0, 5))
  }, [forwardToDataLayer, summarizedEvent])

  useEffect(() => {
    const subscription = optimization.states.blockedEventStream.subscribe((event) => {
      if (event) setStatus(`Blocked event: ${event.method || event.type || "unknown"}`)
    })
    return () => subscription.unsubscribe()
  }, [optimization])

  async function run(label, action) {
    setStatus(`${label}…`)
    try {
      await action()
      setStatus(`${label} completed`)
    } catch (error) {
      setStatus(`${label} failed: ${error.message}`)
    }
  }

  const identify = () =>
    run("Identify", () =>
      identifyUser({
        userId,
        traits: {
          firstName,
          plan,
          supportTester: true,
        },
        location: {
          countryCode,
          city,
        },
      })
    )

  const trackConversion = (entry, metadata) =>
    run("Conversion", () =>
      trackEvent({
        event: "jacket_click",
        properties: {
          source: "optimization-lab",
          entryId: entry?.sys?.id,
          baselineEntryId: metadata?.baselineEntryId,
        },
      })
    )

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-xl bg-slate-950 p-7 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            Internal support route
          </p>
          <h1 className="mt-2 text-3xl font-bold">Optimization troubleshooting lab</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Test profiles, consent, events, variants, merge tags, flags, preview overrides,
            interaction analytics, and server-to-browser personalization without changing the
            storefront routes.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
            <span data-testid="ssr-status">SSR generated: {serverRenderedAt}</span>
            <PreviewPanelLoader audiences={audiences} experiences={experiences} />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">1. Identity and audience simulator</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["User ID", userId, setUserId],
                ["First name", firstName, setFirstName],
                ["Plan", plan, setPlan],
                ["Country code", countryCode, setCountryCode],
                ["City", city, setCity],
              ].map(([label, value, setter]) => (
                <label className="text-sm font-medium" key={label}>
                  {label}
                  <input
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                    onChange={(event) => setter(event.target.value)}
                    value={value}
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="lab-button" data-testid="identify-user" onClick={identify} type="button">
                Identify visitor
              </button>
              <button
                className="lab-button"
                onClick={() => run("Lab audience event", () => trackEvent({ event: "support_lab_entered" }))}
                type="button"
              >
                Enter lab audience
              </button>
              <button
                className="lab-button-secondary"
                onClick={() => {
                  resetUser()
                  setStatus("Visitor reset completed")
                }}
                type="button"
              >
                Reset visitor
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">2. Consent controls</h2>
            <p className="mt-2 text-sm text-slate-600">
              Current event consent: <strong data-testid="consent-state">{String(consent)}</strong>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="lab-button" onClick={() => setConsent(true)} type="button">
                Accept events + persistence
              </button>
              <button
                className="lab-button-secondary"
                onClick={() => setConsent({ events: true, persistence: false })}
                type="button"
              >
                Events only
              </button>
              <button className="lab-button-danger" onClick={() => setConsent(false)} type="button">
                Deny and purge queue
              </button>
            </div>
            <p className="mt-4 rounded bg-slate-100 p-3 text-sm" data-testid="lab-status">
              {status}
            </p>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">3. Page, screen, and business events</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="lab-button"
              onClick={() => run("Page event", () => trackPageView({ properties: { route: "/optimization-lab/manual" } }))}
              type="button"
            >
              Send page event
            </button>
            <button
              className="lab-button"
              onClick={() => run("Screen event", () => trackScreen({ name: "Optimization Lab" }))}
              type="button"
            >
              Send screen event
            </button>
            {['signup', 'add_to_cart', 'purchase', 'jacket_click'].map((event) => (
              <button
                className="lab-button-secondary"
                key={event}
                onClick={() => run(event, () => trackEvent({ event, properties: { source: "optimization-lab" } }))}
                type="button"
              >
                {event}
              </button>
            ))}
            <button className="lab-button-secondary" onClick={() => run("Flush", flushEvents)} type="button">
              Flush queue
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">4. Entry experiments and interaction tracking</h2>
            <p className="text-sm text-slate-600">
              Cards track views, clicks, hovers, and duration updates. Use the preview panel to force variants.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3" data-testid="client-experiment-grid">
            {cards.map((card) => (
              <OptimizedEntry
                baselineEntry={card}
                clickable
                hoverDurationUpdateIntervalMs={1000}
                key={card.sys.id}
                liveUpdates
                onEntryResolved={(metadata) =>
                  setResolvedEntries((current) => ({ ...current, [card.sys.id]: metadata }))
                }
                trackClicks
                trackHovers
                trackViews
                viewDurationUpdateIntervalMs={1000}
              >
                {(resolvedEntry, metadata) => (
                  <OptimizationTestCard
                    entry={resolvedEntry}
                    metadata={metadata}
                    onConvert={trackConversion}
                  />
                )}
              </OptimizedEntry>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">Server-rendered personalization result</h2>
          <p className="mt-2 text-sm text-slate-600">
            The Node runtime evaluated this request before HTML was generated. Accepted:{" "}
            <strong>{String(serverOptimization.accepted)}</strong>
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {serverOptimization.resolvedCards.map((entry) => (
              <OptimizationTestCard entry={entry} key={entry.sys.id} />
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <MergeTagDemo mergeTags={mergeTags} />
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="font-bold">Custom Flag output</h3>
            <pre className="mt-3 overflow-auto rounded bg-slate-950 p-4 text-xs text-emerald-300" data-testid="flag-output">
              {json(flagValue)}
            </pre>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-5 shadow">
            <h3 className="font-bold">Profile</h3>
            <pre className="mt-3 max-h-80 overflow-auto rounded bg-slate-950 p-3 text-xs text-blue-200">
              {json(profileSummary(profile))}
            </pre>
          </div>
          <div className="rounded-lg bg-white p-5 shadow">
            <h3 className="font-bold">Selected optimizations</h3>
            <pre className="mt-3 max-h-80 overflow-auto rounded bg-slate-950 p-3 text-xs text-purple-200">
              {json(selectedOptimizations)}
            </pre>
          </div>
          <div className="rounded-lg bg-white p-5 shadow">
            <h3 className="font-bold">Resolved entry metadata</h3>
            <pre className="mt-3 max-h-80 overflow-auto rounded bg-slate-950 p-3 text-xs text-orange-200">
              {json(resolvedEntries)}
            </pre>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">5. Event stream and analytics forwarding</h2>
          <label className="mt-3 flex items-center gap-2 text-sm font-medium">
            <input
              checked={forwardToDataLayer}
              onChange={(event) => setForwardToDataLayer(event.target.checked)}
              type="checkbox"
            />
            Mirror approved primitive fields to window.dataLayer
          </label>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold">Latest SDK event</h3>
              <pre className="mt-2 overflow-auto rounded bg-slate-950 p-3 text-xs text-emerald-200">
                {json(summarizedEvent)}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-bold">Forwarded dataLayer events</h3>
              <pre className="mt-2 overflow-auto rounded bg-slate-950 p-3 text-xs text-emerald-200">
                {json(forwardedEvents)}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
