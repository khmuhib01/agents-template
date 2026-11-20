# Fixing LCP, INP and CLS

## LCP
1. Find the LCP element per template (DevTools, RUM attribution). 2. Break LCP into parts: server response (TTFB), resource load delay, resource load duration, element render delay. 3. Fix the largest part.
- **TTFB:** caching (CDN/page cache), faster origin, fewer blocking backend calls, edge/static rendering, HTTP/2+ and compression.
- **Discovery delay:** the LCP image must be in the initial HTML (not injected by JS, not CSS background without preload), `fetchpriority="high"` (verify support) and/or `<link rel="preload">` for it; never lazy-load the LCP image.
- **Load duration:** right-sized responsive images (`srcset`/`sizes`), modern formats (AVIF/WebP), compression, CDN, avoid huge hero videos or use poster images.
- **Render delay:** reduce render-blocking CSS/JS, inline critical CSS carefully, defer non-critical scripts, avoid client-side-only rendering of main content, web font blocking (see fonts below).
## INP
1. Reproduce slow interactions (DevTools interactions track, RUM attribution for the target element and phase). 2. Reduce main-thread work: split long tasks, yield to the main thread (`scheduler.yield()` where available or `setTimeout` chunking), defer heavy work with `requestIdleCallback`, move computation to Web Workers.
- Reduce JS: remove unused code and third-party tags, code-split, lazy-load below-fold widgets, avoid hydrating everything (islands, partial hydration, server components where the framework supports it).
- Avoid layout thrash (batch reads/writes), expensive event handlers, huge DOMs (hundreds of nodes per component trees), synchronous storage or heavy re-renders on input; debounce non-urgent work; use `content-visibility` carefully.
- Framework specifics: memoize and virtualize lists, avoid state updates that re-render large trees, use transitions for non-urgent updates where supported.
## CLS
- Reserve space: `width`/`height` or `aspect-ratio` on images/video/iframes, fixed slots for ads/embeds/banners/consent dialogs, skeletons of final size.
- Fonts: `font-display` strategy, preload critical fonts, size-adjusted fallbacks (`size-adjust` and related descriptors) to reduce swap shift.
- Dynamic content: insert below the viewport or after user interaction, not above existing content; animate with `transform`/`opacity`, not layout properties.
- bfcache eligibility improves repeat navigation experience (avoid `unload` handlers, check blockers).
## General
Third parties (tag managers, chat, A/B tools) often dominate; load after interaction, use facades, audit regularly, remove unused ones. Measure after each change.
