# Contentful Optimization troubleshooting lab

This project now has a protected support page at `/optimization-lab`. It is deliberately separate from the shop pages, uses `noindex,nofollow`, disables shared caching, and does not change the existing home-page or product experiences.

## Opening the lab

Set `OPTIMIZATION_LAB_SECRET` in Vercel for the environments where the lab should be available. If it is not set, the route safely falls back to the existing `PREVIEW_SECRET` or `NEXT_PUBLIC_PREVIEW_SECRET`.

For the first visit, open:

```text
https://YOUR-DOMAIN/optimization-lab?secret=YOUR_SECRET
```

The server verifies the secret, stores only a one-way hash in a secure, HTTP-only cookie, and redirects to the clean `/optimization-lab` URL. The cookie lasts eight hours. An invalid or missing secret returns a normal 404 so the support page is not advertised publicly.

For local use:

```bash
http://localhost:9019npm start
```

Then open `http://localhost:9019/optimization-lab?secret=YOUR_SECRET`.

## Features that were missing and are now available

### Visitor identity and profile traits

**Definition:** Identity tells Optimization that the current anonymous browser represents a known test visitor. Traits such as `firstName` and `plan`, plus location such as country and city, can be used by audience rules and merge tags.

**Implementation:** The lab calls `identifyUser` and displays the sanitized profile so a support engineer can immediately see what the SDK received.

### Audience targeting

**Definition:** An audience is a group of visitors who match rules. A deterministic personalization shows the targeted variant when the visitor belongs to that audience.

**Implementation:** The Contentful audience `Optimization Support Lab Visitors` matches after the custom event `support_lab_entered`. The lab also reuses the existing German audience to test country targeting.

### A/B experiment

**Definition:** An A/B experiment divides eligible traffic between a baseline and one alternative, then compares results using a metric.

**Implementation:** `Support Lab 50/50 Entry + Flag Experiment` provides a 50/50 Contentful entry replacement and a Custom Flag value.

### Multivariate experiment

**Definition:** A multivariate experiment has more than one alternative. It is useful for checking allocation and rendering beyond a simple two-option test.

**Implementation:** `Support Lab Three-Way Experiment` contains the baseline plus two alternatives.

### Experience priority

**Definition:** More than one experience can be attached to the same baseline. Their link order controls which matching experience wins first.

**Implementation:** The priority card links the German deterministic personalization before a general experiment. A German visitor therefore receives the German variant first.

### Consent and persistence

**Definition:** Event consent controls whether analytics may be sent. Persistence consent controls whether Optimization may remember visitor state between page loads.

**Implementation:** The lab can allow both, allow events without persistence, or deny consent and purge the queued events. Defaults can also be controlled with `NEXT_PUBLIC_OPTIMIZATION_DEFAULT_CONSENT` and `NEXT_PUBLIC_OPTIMIZATION_DEFAULT_PERSISTENCE_CONSENT`.

### Page, screen, and business events

**Definition:** Page and screen events describe navigation. Business events such as `signup`, `add_to_cart`, `purchase`, and `jacket_click` can act as audience signals or conversion metrics.

**Implementation:** Each event has a dedicated test button, plus a manual queue flush control. The global `OptimizationRoot` now emits route-aware page events without double-counting the same route.

### Entry interaction analytics

**Definition:** Interaction analytics measures when a personalized entry is viewed, clicked, hovered, and how long it remains visible. This is separate from a custom conversion event.

**Implementation:** Every client-side test card enables view, click, hover, and duration tracking and displays the resolved-entry metadata.

### Merge tags

**Definition:** A merge tag inserts one small visitor value inside otherwise shared content, for example a first name or city, instead of replacing a complete entry.

**Implementation:** Published Contentful merge-tag entries resolve `traits.firstName` and `location.city`, with friendly fallback text when the visitor is anonymous.

### Custom Flags

**Definition:** A Custom Flag is structured experiment output for code behavior rather than a Contentful entry replacement. It can control UI settings such as a label, tone, or boolean switch.

**Implementation:** The A/B fixture defines `support-banner-style`. The lab displays the selected JSON value and uses a safe baseline value when no flag variant is selected.

### Preview panel and forced variants

**Definition:** The preview panel lets a support engineer override audiences or selected variants in the browser without waiting for natural allocation.

**Implementation:** The panel is dynamically loaded only on the protected lab. It waits for the live browser SDK before attaching; attaching it to the initial server snapshot was the cause of the earlier `bridge support` error.

### Server-rendered personalization

**Definition:** Server-side personalization resolves a visitor before HTML is generated. This avoids showing baseline content first and swapping it after JavaScript loads.

**Implementation:** `getServerSideProps` calls the Optimization Node SDK for the incoming request, forwards useful request context, maintains the anonymous profile cookie, and renders a separate server result for all three fixtures.

### Analytics forwarding

**Definition:** Analytics forwarding mirrors approved Optimization event fields to another analytics or tag-management layer.

**Implementation:** The lab has an opt-in switch that sends only a small set of primitive fields to `window.dataLayer`; it does not forward the complete visitor profile.

### Automated regression tests

**Definition:** Regression tests protect working behavior while the SDK or content model changes.

**Implementation:** Playwright checks the existing storefront, protected lab controls, three experiment cards, identity, consent, and conversion tracking. `npm run test:e2e` builds the production app first and runs it on port 9019, avoiding development file-watcher noise.

## Contentful fixtures

Run `npm run setup:optimization-lab` to idempotently create or repair only the support fixtures. It creates the `optimizationTestCard` content type, baselines, variants, audience, merge tags, and four experiences. It publishes in the safe order: variants, audience and merge tags, experiences, then baselines.

The script does not delete or edit the existing shop experiences. The primary metric can be overridden with `OPTIMIZATION_LAB_PRIMARY_METRIC_ID`.

## Optimization Doctor note

The current Doctor executable requires Node.js 24 or newer. Running it with Node 22 stops before it checks the project. With Node 24, both Experience API v2 and v3 connectivity checks pass.

The Doctor version used here also reports linked experiences as unresolved when it inspects the single-entry CDA endpoint with `include`. Contentful expands linked entries on the collection query. The equivalent collection request with `sys.id` and `include=10` resolves both priority experiences, their audience, and their variants, and the live lab renders those resolved entries. Treat that Doctor content warning as a tooling false positive for this fixture, not as an unpublished-content problem.

## Official documentation

- [Personalization core concepts](https://www.contentful.com/developers/docs/personalization/core-concepts/)
- [Next.js Pages Router Optimization SDK integration](https://www.contentful.com/developers/docs/personalization/optimization-sdk/integrate-the-optimization-sdk-in-a-nextjs-pages-router-app/)
- [Consent management](https://www.contentful.com/developers/docs/personalization/optimization-sdk/consent-management-in-the-optimization-sdk-suite/)
- [Entry personalization and variant resolution](https://www.contentful.com/developers/docs/personalization/optimization-sdk/entry-personalization-and-variant-resolution/)
- [Interaction tracking](https://www.contentful.com/developers/docs/personalization/optimization-sdk/interaction-tracking-in-web-sdks/)
- [Forwarding to analytics and tag managers](https://www.contentful.com/developers/docs/personalization/optimization-sdk/forwarding-optimization-sdk-context-to-analytics-and-tag-management-tools/)
- [Node SDK integration](https://www.contentful.com/developers/docs/personalization/optimization-sdk/integrate-the-node-sdk-into-a-node-app/)
- [Custom Flags announcement](https://www.contentful.com/developers/changelog/custom-flags-available-in-contentful-personalization/)
