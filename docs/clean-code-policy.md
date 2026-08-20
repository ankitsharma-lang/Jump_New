# Clean code policy

This storefront uses supported, documented product interfaces. Changes must satisfy
all of the following rules before they are deployed.

## Product boundaries

- Use public Contentful SDK and API contracts. Do not depend on private package
  internals or undocumented response fields.
- Use hosting-provider request data only through documented platform headers and pass
  it through the SDK's documented request context.
- Keep the public storefront, preview tooling, and troubleshooting labs isolated.
  Labs must use separate Contentful and Optimization environments and remain disabled
  on the production storefront.
- Keep audience definitions, experiences, variants, and editorial baselines in
  Contentful. Keep request handling, security, rendering, and cache behavior in code.

## Implementation quality

- Prefer small, single-purpose functions with explicit inputs and safe fallbacks.
- Never log tokens, cookies, profile identifiers, IP addresses, or precise visitor
  location data.
- Model the baseline and variants from an explicitly documented business rule. For the
  storefront homepage, the baseline shows both collections to non-UK visitors and the
  UK-targeted variant intentionally narrows the page to the UK collection only.
- Avoid shared HTML caching on request-personalized routes. Preserve the server's
  selection during browser hydration.
- Document any temporary compatibility workaround with its cause and removal condition.

## Required verification

- Add regression coverage for the changed behavior, including baseline and targeted
  cases.
- Run lint, feature tests, a production build, and relevant browser tests.
- Review the final diff for unrelated changes and secrets before committing.
- Verify the deployed response, cache headers, server-rendered result, and browser
  hydration before declaring the change complete.
