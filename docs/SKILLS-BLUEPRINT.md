# agents-template — Skills Expansion Blueprint (Phase 1: audit + plan)

Status: **proposal, awaiting approval.** Nothing in `core/`, `templates/`, `lib/`, `init.mjs` or tests was changed by this phase.
Baseline audited: `VERSION 1.11.0`, branch `dev`, `node test.mjs` passes, `node evals/run.mjs` 70/70, `node bench.mjs` runs.

Conventions used below: **[E]** = evidence read in the repo, **[I]** = inference/recommendation, **[U]** = uncertainty to confirm before building.

---

## 0. Executive summary

1. The generator is sound and well tested. The weakness is **skill depth, not architecture**: 47 core skills total 863 lines / ~67 KB. 21 of them are 5–9 lines [E]. Only 3 skills have supporting files (`laravel-best-practices`, `testing-best-practices`, `infer-conventions`); `tailwindcss-development` is a single long file [E].
2. The three mobile skills (`flutter-development` 20 lines, `react-native-development` 21, `swift-development` 19) each carry about 8 rules against the 20+ topics requested. There is **no Android skill**: `kotlin` maps only to `jvm-development`, which covers Spring/JPA [E].
3. There is **no SEO skill, no PHP/WordPress token, no `android`/`compose`/`wordpress`/`seo` stack token** in `skill-map.json` [E]. A WordPress project today gets only generic skills and a `stack token(s) matched no skill` warning [E: `focusSkills` returns `unmatched`].
4. Three infrastructure gaps must be fixed **before** adding content, otherwise the new structure breaks or wastes tokens:
   - `init.mjs` copies **every file** under a routed `core/skills/<name>/` into the target project [E: `walk(base)` loop, ~L324]. The proposed `evals/` and `examples/` directories would ship into every user project. Needs an exclusion rule.
   - `skill-map.json` has no cross-skill dependency concept; routing is a flat union [E: `focusSkills`].
   - Evals are positive-only and lexical: `cases.json` fields are just `prompt` + `expect`; 2/70 cases expect more than one skill; no negative, multi-skill, version or implementation cases [E].
5. Recommendation on shape: **fewer, deeper skills with progressive-disclosure references** rather than 35+ new top-level skills. Every model-invocable skill costs always-loaded description tokens (today ~8.2K chars of descriptions across 47 skills [E]). The 10 mobile and 10 SEO names you proposed are kept, but as **5 mobile + 6 SEO skills, with the rest as reference files** (section 8, decision D1).

---

## 1. Existing skill inventory [E]

47 core skills (`core/skills/`), 7 git-workflow template skills (`templates/.claude/skills/`: commit, commit-push, push, ship, merge-to-dev, merge-to-main, doc-sync), 10 agents, 4 rules, 8 hooks, 2 global skills.

| Group | Skills (lines in SKILL.md) |
|---|---|
| Workflow/command wrappers | audit 5, code-review 5, test 5, deploy 6 (manual), pr 6 (manual), review 6 (manual), status 6 (manual), sync 6 (manual), build 18 (manual), framework-upgrade 15, safe-refactoring 15, project-intelligence 18, project-init 48 |
| Generic engineering (single paragraph) | api-engineering 9, database-engineering 9, devops-engineering 9, frontend-engineering 9, performance-engineering 9, system-design 9, technical-debt 9, technical-documentation 9, test-engineering 9, ui-ux-engineering 9, bug-investigation 9, dependency-management 9, security-audit 9 |
| Language/framework | typescript 27, react 32, nextjs 32, nodejs 32, python 32, vue 22, go 20, rust 20, ruby 19, dotnet 19, jvm 19, swift 19, flutter 20, react-native 21 |
| Database | mysql 19, postgresql 19 |
| Rich | laravel-best-practices 59 + 19 rule files (MIT, author: laravel), testing-best-practices 31 + 9 rule files, infer-conventions 20 + 3 references, tailwindcss-development 105 single file (MIT, author: laravel) |

Routing [E]: `types` (web, api, mobile, fullstack, cli, library, other) and `stack` tokens map to skills; `always` has 25 entries; `skills_mode: focused` (default) installs only routed skills; `all` installs everything. Eval infra: `evals/run.mjs` (offline lexical top-3, free) and `evals/live.mjs` (paid, asks a model which skills it would invoke).

---

## 2. Skill-by-skill quality audit

Rubric: the 12 criteria from the brief. Ratings are judgments from reading the files, not measurements. **No skill has measured evidence of effectiveness today** [E: README says use by others and live trigger rates are unverified].

Legend: EXC = EXCELLENT, GOOD, REWORK = NEEDS_REWORK, INC = INCOMPLETE.

| Skill | Rating | Evidence / main gaps |
|---|---|---|
| laravel-best-practices | EXC | Consistency-first rule, 19 rule files, version check via docs tool, narrow-test-first. Gap: depends on a `search-docs` tool (Laravel Boost) with only a vague fallback; no explicit Laravel major-version matrix [U]. **Keep license/author metadata.** |
| testing-best-practices | EXC | 9 rule files, framework-aware. Gap: no mobile/E2E guidance (belongs in mobile-testing). |
| tailwindcss-development | EXC | v3 vs v4 detection, 105 lines. Keep attribution. |
| infer-conventions | GOOD | Checklists + 3 references; Laravel-heavy (`laravel-advanced.md`). |
| project-init | GOOD | 48 lines, procedural. |
| react-development | GOOD | React 18/19 gating is a model pattern to copy. Gaps: testing, a11y, perf profiling, security (XSS sinks), server components boundary. |
| nextjs-development | GOOD | Gaps: caching/revalidation model, metadata/SEO API, server-action security, middleware/auth, deployment targets. Version-sensitive: verify installed Next version [U on current major]. |
| nodejs-development | GOOD | Gaps: security hardening, observability, graceful shutdown, queues. |
| python-development | GOOD | Gaps: typing tooling, async pitfalls, packaging/uv, security. |
| typescript-development | GOOD | Gaps: tsconfig strictness migration, runtime validation boundary. |
| vue, go, rust, ruby, dotnet, jvm | GOOD (low end) | ~20 lines each; version detection present, depth thin. `jvm` mixes Java, Kotlin, Spring; Android absent. Targeted enrichment later, not in this program's critical path. |
| mysql-engineering, postgresql-engineering | GOOD | Version detection, no-prod-connect rule. Gaps: migration safety on big tables (partial in mysql), replication/partitioning, backup/restore. |
| **flutter-development** | **REWORK** | 8 rules vs requested 20+ topics. Missing: architecture, state-management trade-offs, offline/sync, platform channels depth, isolates, perf, a11y/l10n, security, test pyramid, CI/CD/signing, observability. Rule "ask before adding packages" conflicts with needing guidance for choosing Riverpod vs Bloc when none exists. |
| **react-native-development** | **REWORK** | Good detection (Expo vs bare, New Architecture). Missing: Expo Router depth, Fabric/TurboModules, offline sync, EAS workflows (only a "don't run without approval" rule), testing, observability, release. |
| **swift-development** | **REWORK** | Good rules. Missing: SwiftData/Core Data, Keychain/privacy manifests, background tasks, push, Instruments, UI automation, signing/App Store. |
| api-engineering | INC | One paragraph. No OpenAPI/contract-first, idempotency keys, rate limiting, pagination styles, webhook signing, error format (RFC 9457 problem+json is a standard to reference, verify wording), versioning patterns. |
| security-audit | INC | One paragraph; no checklist, no severity rubric, no OWASP mapping, no output template, no mobile/API-specific items. High value, high priority. |
| database-engineering | INC | No migration-safety, indexing method, multi-tenant, scaling. |
| devops-engineering | INC | No CI patterns, container hardening, IaC, observability, rollback. |
| performance-engineering | INC | No measure-first method, budgets, profiling tools per stack. |
| frontend-engineering, ui-ux-engineering | INC | Overlap with each other and react/nextjs/tailwind skills; no a11y checklist (WCAG named only). |
| system-design | INC | Overlaps `architect` agent; no ADR template, no distributed-systems patterns. |
| test-engineering | INC | Overlaps `testing-best-practices` and `test`. |
| bug-investigation, dependency-management, technical-debt, technical-documentation | INC | Single paragraph each. Acceptable as thin routers only if they point to references. |
| audit, code-review, test | GOOD (as workflow wrappers) | 5 lines by design. Add an output template and severity rubric (targeted). |
| review, status, sync, pr | GOOD | Manual-only commands (`disable-model-invocation`); deliberately thin. |
| deploy | GOOD, enrich | High-risk action in 6 lines; approval gate is right, but no pre-flight/rollback checklist. |
| build, framework-upgrade, safe-refactoring, project-intelligence | GOOD | Procedural; could gain verification checklists. |
| 7 git template skills | not audited in depth [U] | Out of scope for expertise expansion; only `ship` was read. |

### 2.1 Overlaps and duplicates [E unless marked]
- `review` and `code-review` have an **identical body**; `review` is manual-only. Intentional alias, document it, do not delete.
- Three-way test overlap: `test` (run commands), `test-engineering` (design tests), `testing-best-practices` (rules). Descriptions lack "do not use when" lines, so routing confusion is likely [I].
- `audit` / `security-audit` / `code-review` / `technical-debt`: overlapping triggers.
- `frontend-engineering` / `ui-ux-engineering` / `react-development` / `nextjs-development` / `tailwindcss-development`.
- `devops-engineering` / `deploy`; `system-design` / `architect` agent; `database-engineering` / `mysql-` / `postgresql-engineering`.
- Agents: all 10 are 5–8 lines except `git-manager` (39). No mobile, SEO or product specialist.

### 2.2 Routing defects [E]
- `type: mobile` routes only `ui-ux-engineering` + `api-engineering`; native mobile skills load only when a stack token matches.
- Missing tokens: `android`, `compose`, `jetpack`, `kmp`, `wordpress`, `php`, `seo`, `woocommerce`, `swiftui`, `expo-router`, `graphql`, `redis`, `firebase`, `supabase`, `kubernetes`, `terraform`. `kotlin` → `jvm-development` only.
- No dependency expansion: a Flutter project cannot automatically get mobile-security or mobile-testing.

### 2.3 Things that are working and must be preserved
Detect-first pattern, "follow existing conventions", narrowest-test-first, explicit approval gates for publishing/deploying, `disable-model-invocation` for commands, hand-edit protection hashes, zero dependencies, idempotent re-runs, focused mode.

---

## 3. Missing skill inventory (summary)

Detail per skill is in sections 4–7. Counts after the recommended consolidation (D1):

| Domain | New skills | Enriched existing |
|---|---|---|
| Mobile | `android-kotlin-development`, `mobile-architecture` (incl. offline-first), `mobile-quality` (testing + performance + accessibility), `mobile-security`, `mobile-release` (CI/CD + store + ASO + observability) | flutter, react-native, swift |
| SEO | `seo-technical`, `seo-on-page-content`, `seo-structured-data`, `seo-web-vitals`, `seo-international-ecommerce`, `seo-migration-monitoring` | nextjs, react, laravel, new `wordpress-development` (see 5) |
| Full-stack | `saas-multitenancy`, `payments-billing`, `realtime-systems`, `event-driven-architecture`, `search-engineering`, `wordpress-development`, `php-development` (token + skill) | api, database, devops, performance, security-audit, system-design, nodejs, python |
| Product | `product-discovery`, `prd-requirements`, `product-delivery` (feasibility → release plan), `production-readiness` | build, system-design, technical-documentation |

Total new: ~22 skills (vs ~35 if every proposed name became its own skill).

---

## 4. Mobile engineering roadmap (highest priority)

### 4.0 Design
- **Framework skills stay framework-specific** (how to do it in Flutter/RN/Swift/Android). **Shared mobile skills hold platform-agnostic principles and decision rules** and link to framework skills for syntax. Rule of thumb to avoid duplication: if the advice names a framework API, it lives in the framework skill; if it is a policy, checklist or trade-off, it lives in the shared skill.
- Each framework SKILL.md stays ≤ ~80 lines (detect → rules → "read X when…" index → verify) and loads `references/*.md` on demand, like `laravel-best-practices` does today.

### 4.1 `flutter-development` (enrich, existing)
- **Purpose:** production-grade Flutter/Dart implementation. **Trigger (keep + extend):** Flutter/Dart code, widgets, state, navigation, platform channels, pubspec, build_runner, flutter test, Flutter build/signing errors. Add negative: not for generic mobile architecture decisions → `mobile-architecture`.
- **Scope/topics → reference files:** `architecture.md` (feature-first, clean architecture layers, modularization via packages/melos [U: verify tooling in project]), `state-management.md` (Riverpod vs Bloc vs Provider decision table, detect-and-follow rule), `data-layer.md` (repository, DI with get_it/riverpod/injectable, REST/GraphQL, WebSockets), `offline-local-db.md` (Drift, Isar, sqflite, migrations; Isar maintenance status must be **verified at build time** [U]), `firebase-push-deeplinks.md` (FCM, APNs setup, go_router deep/universal links), `platform-channels-isolates.md` (MethodChannel/Pigeon/FFI, `Isolate.run`, compute), `performance.md` (rebuild scope, `const`, DevTools, jank, image cache, memory leaks), `a11y-l10n.md` (Semantics, text scaling, `intl`/ARB), `security.md` (flutter_secure_storage, pinning caveats, obfuscation flags), `testing.md` (unit/widget/integration/golden, golden tolerance across OS), `release.md` (flavors, signing, Fastlane/CI, store specifics).
- **Dependencies:** `mobile-architecture`, `mobile-quality`, `mobile-security`, `mobile-release`, `typescript` not needed.
- **Evals:** (a) add a feature in a Riverpod project without adding Bloc; (b) deep link handling with auth redirect; (c) offline write queue with conflict; (d) golden test stability; (e) negative: Dart CLI package, no Flutter → should not load mobile-release.
- **Priority:** P0.

### 4.2 `react-native-development` (enrich, existing)
- **Trigger:** keep; add Expo Router, EAS, TurboModule, Fabric, Reanimated, FlashList, Hermes terms.
- **References:** `workflows.md` (managed/prebuild/bare, config plugins, when to eject-or-prebuild), `navigation.md` (Expo Router file-based vs React Navigation, typed routes, deep links), `new-architecture.md` (Fabric, TurboModules, Codegen, library compatibility check; **current default/legacy-removal status differs by RN version — [U] must be read from the installed version's changelog**), `native-modules.md`, `state-and-data.md` (TanStack Query, Zustand/Redux, persistence), `animation-gestures-lists.md` (Reanimated worklets, Gesture Handler, FlashList sizing/recycling), `offline-sync.md`, `security.md` (SecureStore/Keychain, no secrets in bundle, cert pinning trade-offs), `build-release.md` (EAS Build/Submit/Update, channels, runtime versions, rollback; keep "approval before spending/publishing"), `testing-observability.md` (Jest + RNTL, Maestro/Detox E2E, Sentry-class crash reporting).
- **Dependencies:** `typescript-development`, `mobile-*`. **Evals:** list perf regression fix, add native module in managed project (must use config plugin), OTA update safety (runtime version mismatch), negative: web React app. **Priority:** P0.

### 4.3 `android-kotlin-development` (NEW)
- **Purpose:** native Android with Kotlin + Compose. **Trigger:** "Use for native Android apps: Kotlin, Jetpack Compose, Material 3, ViewModel/Flow, Room, DataStore, Hilt, WorkManager, Navigation, Gradle/AGP, Play release. Detects AGP, Kotlin, Compose, minSdk/targetSdk first. Not for Spring/server Kotlin → `jvm-development`; not for Flutter/RN."
- **Detect first:** AGP + Gradle + Kotlin versions, version catalog (`libs.versions.toml`), Compose BOM, minSdk/targetSdk/compileSdk, XML Views vs Compose vs mixed, DI (Hilt/Koin), modules, KSP vs kapt, lint/detekt/ktlint.
- **References:** `kotlin-coroutines-flow.md` (structured concurrency, dispatcher injection, `StateFlow`/`SharedFlow`, lifecycle-aware collection), `compose-material3.md` (state hoisting, recomposition/stability, side-effect APIs, previews, theming, adaptive layouts), `architecture.md` (MVVM/MVI, UDF, domain layer when justified, modularization, convention plugins), `data.md` (Room migrations + schema export, DataStore vs SharedPreferences, repository, Retrofit/Ktor), `hilt-workmanager-navigation.md`, `lifecycle-permissions.md` (process death, `SavedStateHandle`, runtime permissions, foreground service types, background limits), `security.md` (Keystore, EncryptedSharedPreferences status [U], network security config, R8/ProGuard, Play Integrity), `performance.md` (Macrobenchmark, Baseline Profiles, Perfetto, Compose compiler reports, strict mode), `testing.md` (JUnit, Turbine, MockK, Compose UI tests, Hilt test, Espresso, Robolectric trade-offs), `gradle-build.md` (version catalogs, build cache, configuration cache, KSP, module graph), `play-release.md` (AAB, signing/Play App Signing, tracks, staged rollout, data safety form, target API deadlines **[U: verify current policy deadlines]**).
- **Dependencies:** `mobile-architecture`, `mobile-quality`, `mobile-security`, `mobile-release`. **Routing:** tokens `android`, `kotlin-android`, `compose`, `jetpack`; `kotlin` alone keeps `jvm-development` and adds android skill only if `build.gradle*` contains the Android plugin (detect in skill, not router).
- **Evals:** add a Compose screen with ViewModel + Flow without GlobalScope/LiveData mixing; Room migration with exported schema; WorkManager periodic sync with constraints; negative: Ktor server. **Priority:** P0.

### 4.4 `swift-development` (enrich, existing)
- **References:** `swiftui-uikit.md` (observation: `@Observable` vs `ObservableObject` by deployment target; interop), `concurrency.md` (actors, `Sendable`, strict concurrency migration, `@MainActor`), `architecture.md` (MVVM, modular SPM packages, TCA only if detected), `persistence.md` (SwiftData vs Core Data by minimum OS, migrations, CloudKit caveats), `networking.md` (URLSession async, retry, background sessions), `keychain-privacy.md` (Keychain, privacy manifests/required-reason APIs, ATT, permissions strings), `push-background.md` (APNs, `BGTaskScheduler`, silent push limits), `accessibility.md` (VoiceOver, Dynamic Type), `instruments.md` (Time Profiler, Allocations, Hangs), `testing.md` (XCTest, Swift Testing, XCUITest), `build-release.md` (xcconfig, SPM caching, signing, TestFlight, App Store Connect, review guidelines pitfalls).
- Keep: macOS/server Swift remains in the same skill; add negative for non-Apple Swift only when relevant. **Dependencies:** `mobile-*`. **Priority:** P0.

### 4.5 Shared mobile skills (recommended 5, covering all 10 requested)

| Skill | Absorbs requested | Trigger (draft) | Core content |
|---|---|---|---|
| `mobile-architecture` | mobile-architecture, mobile-offline-first, mobile-ui-engineering | "Use for mobile app structure and cross-platform decisions: layering, state, navigation, offline-first sync, caching, conflict resolution, background work, adaptive UI." | Layer/decision matrices, sync strategies (last-write-wins vs field merge vs CRDT trade-offs), outbox pattern, idempotent writes, retry/backoff, connectivity states, schema migrations on device, UI engineering principles (touch targets, safe areas, adaptive layouts, platform conventions) |
| `mobile-quality` | mobile-testing, mobile-performance, mobile-accessibility | "Use for mobile test strategy, performance profiling and accessibility review." | Test pyramid per platform, device matrix, flaky UI test policy, startup/jank/memory/battery budgets, a11y checklist (screen readers, text scaling, contrast, focus), measure-first method |
| `mobile-security` | mobile-security | "Use for mobile app security: secure storage, auth tokens, deep-link validation, transport, reverse-engineering resistance, privacy." | Aligned to OWASP MASVS/MASTG concepts (**check current versions and wording before citing [U]**), token storage, biometric gating, deep link/intent/URL scheme hijack, WebView hardening, logging PII, backups, root/jailbreak as signal not control |
| `mobile-release` | mobile-cicd, mobile-observability, mobile-app-store-optimization | "Use for mobile CI/CD, code signing, store submission, staged rollout, crash reporting and store listing." | Signing key custody, fastlane/EAS/Gradle Play Publisher/Xcode Cloud trade-offs, release checklists per store, staged rollout + kill switch, crash/ANR reporting, release health, ASO as *recommendations* (no ranking promises), store-policy compliance |
| `mobile-engineering` (index, optional) | — | Not needed if routing handles deps. Skip. | — |

All `mobile-release` publishing steps keep the existing rule: **never submit, publish or spend CI/EAS credits without explicit approval**.

- **Evals (shared):** multi-skill scenario "add offline note editing to a Flutter app" must load flutter + mobile-architecture; "prepare Play release" loads android + mobile-release and does **not** run a submit; negative: backend-only API in a repo that also has a mobile folder.
- **Priority:** P0 (architecture, security, release), P1 (quality).

---

## 5. SEO engineering roadmap (highest priority)

### 5.0 Design principles
- Every claim is tagged in the references as **[Requirement]** (documented by the search engine as required/eligible), **[Guideline]** (documented recommendation), or **[Practice]** (industry heuristic, not search-engine guaranteed). The skill must never promise rankings or rich results; rich result eligibility is "may be eligible, not guaranteed".
- Detect first: framework and rendering mode (SSG/SSR/CSR/ISR), hosting/CDN, existing meta/sitemap/robots/structured data, i18n setup, analytics, CMS.
- Skills **audit and implement**, but never edit production robots/redirects/DNS without approval. Anything touching `robots.txt`, canonical, `noindex`, or redirect maps is flagged high-risk (a mistake can de-index a site).
- Search engine docs change; the skill requires checking the current official documentation (Google Search Central, Bing Webmaster) for any rule that has a date/version attached. **No URL is hardcoded from memory**; `references/SOURCES.md` lists doc *names* and the maintainer fills in URLs after fetching them (section 12).

### 5.1 Recommended set (6 skills, covering all 10 requested)

| Skill | Absorbs | Trigger (draft) |
|---|---|---|
| `seo-technical` | seo-technical-audit, part of seo-monitoring | "Use for crawlability and indexability: robots.txt, XML sitemaps, canonicals, status codes, redirects, rendering/JavaScript SEO, internal linking, pagination, faceted navigation, crawl budget on large sites. Audit first; read-only unless asked to implement." |
| `seo-on-page-content` | seo-on-page, seo-content-strategy | "Use for titles, meta descriptions, headings, search intent, content briefs, internal linking and content structure. Does not promise rankings." |
| `seo-structured-data` | seo-schema-structured-data | "Use for JSON-LD/schema.org markup: choosing types, generating valid markup from real page data, validating. Eligibility for rich results is not guaranteed." |
| `seo-web-vitals` | seo-core-web-vitals | "Use for LCP, INP and CLS measurement and fixes, field vs lab data, framework-specific loading patterns." Overlaps `performance-engineering`: this one owns the CWV metrics and SEO context, the other owns general profiling. |
| `seo-international-ecommerce` | seo-international, seo-ecommerce, seo-programmatic | "Use for hreflang and locale URL structure, product/category indexing, variants, faceted URLs, and programmatic/template landing pages at scale including thin/duplicate content risk." |
| `seo-migration-monitoring` | seo-migration, seo-monitoring | "Use for site migrations, redirect maps, domain/URL changes, replatforming, plus Search Console/analytics monitoring and automated SEO regression tests." |

Detailed topics per skill (all become `references/*.md`):
- **technical:** crawl/index/serve model, `robots.txt` semantics (it blocks crawling, not indexing; do not use to hide content), sitemap limits and `lastmod` honesty [verify current limits [U]], canonical vs redirect vs `noindex`, soft 404s, 4xx/5xx/410 semantics, JS rendering pitfalls (content only after hydration, lazy-loaded links, fragment URLs), pagination, parameter handling, log-file analysis, hreflang basics pointer, security headers interplay (X-Robots-Tag).
- **on-page:** intent classification, title/description patterns (length figures are display heuristics, not rules), heading structure, image alt/filenames, internal link audits (orphans, depth, anchor text), E-E-A-T as a *quality-evaluation concept*, not a ranking factor checklist, content brief template, duplicate/cannibalization analysis.
- **structured-data:** types by page kind (Organization, WebSite, Breadcrumb, Article, Product, Offer, Review/AggregateRating restrictions, FAQ/HowTo/other types whose eligibility has been restricted or removed in the past — **verify current status before implementing [U]**), generating JSON-LD server-side from the same data as visible content, mismatch = guideline violation, validation workflow, framework snippets.
- **web-vitals:** thresholds are defined by Google's current guidance, **read at build time [U]**; INP replaced FID, so reject advice that still cites FID as current; LCP element discovery, image priority/preload, font loading, third-party scripts, layout-shift sources, RUM collection (`web-vitals` library concept) vs CrUX vs lab Lighthouse.
- **international-ecommerce:** hreflang rules (reciprocal, self-reference, x-default, language/region codes), locale URL strategy trade-offs (subdirectory/subdomain/ccTLD), no auto-redirect by IP, product/variant canonicalization, out-of-stock handling, faceted navigation controls, Product + Merchant-style feeds as separate from SEO [U], programmatic SEO quality gate (unique value per page, index only pages meeting criteria, avoid doorway patterns).
- **migration-monitoring:** pre-migration inventory (crawl + analytics + backlinks), 1:1 redirect mapping, staging `noindex` hygiene (and removing it at launch), launch checklist, post-launch monitoring, Search Console property verification, API quotas, regression test ideas (CI check for `noindex` on prod build, sitemap URL status codes, canonical self-consistency, JSON-LD validity, redirect map snapshot).
- **Framework implementation references (per skill, loaded only on match):** `frameworks/nextjs.md` (metadata API, `sitemap`/`robots` conventions, caching and rendering mode effects, `generateMetadata` pitfalls; **verify against installed Next version**), `frameworks/react-spa.md` (prerender/SSR need, head management), `frameworks/laravel.md` (route/canonical middleware, sitemap packages as optional, Blade meta partials), `frameworks/wordpress.md` (core sitemaps, SEO plugins' roles, don't double-output meta, multisite/WPML pitfalls).
- **Dependencies:** `nextjs-development`, `react-development`, `laravel-best-practices`, new `wordpress-development`, `performance-engineering`, `technical-documentation`. **Agent:** new `seo-specialist` (read-only by default).
- **Routing:** new config-level opt-in, not auto-loaded for every web project (token budget): stack token `seo`, or `domains: [seo]` (see 9). Rationale: most web projects are apps behind login where SEO is irrelevant [I].
- **Evals:** (a) "pages dropped from index after deploy" → find `noindex`/robots/canonical regression, propose, do not edit robots on prod; (b) generate Product JSON-LD that matches visible data and flags missing required fields instead of fabricating `aggregateRating`; (c) migration redirect map with chains/loops detection; (d) hreflang reciprocity check; (e) negative: authenticated dashboard → no seo skill; (f) must refuse/avoid "guarantee first page".
- **Priority:** P0 for technical, structured-data, migration-monitoring; P1 for the rest.

---

## 6. Full-stack engineering roadmap

Principle: **extend before adding.** Mapping of requested capabilities:

| Capability | Where it goes | Action |
|---|---|---|
| Enterprise auth, RBAC, API security | `security-audit` (rework) + `api-engineering` (rework) with `references/authn-authz.md` | enrich, no new skill |
| SaaS, multi-tenant | **new** `saas-multitenancy` | tenancy models (row-level, schema, db-per-tenant), isolation tests, tenant-aware caching/queues, data export/delete, noisy neighbour; RLS only where Postgres detected |
| Payments, subscriptions, billing | **new** `payments-billing` | provider-agnostic: idempotency keys, webhook signature + replay handling, state machine for subscriptions, proration/tax caveats (jurisdiction-dependent [U]), PCI scope minimization (never touch raw card data), reconciliation, test-mode only by default, never charge live without approval |
| Real-time, WebSockets | **new** `realtime-systems` | transport choice (WS/SSE/polling), auth on connect, backpressure, reconnection/resume, fan-out scaling, presence, ordering; shares with `mobile-architecture` for client side |
| Event-driven, distributed systems | **new** `event-driven-architecture` (+ `system-design` rework) | outbox, idempotent consumers, at-least-once, DLQ, sagas, schema evolution, ordering/partitioning, observability of async flows |
| Search engineering | **new** `search-engineering` | engine choice (Postgres FTS vs Meilisearch/Elasticsearch-class), indexing pipeline, relevance eval, reindex without downtime |
| Background processing | extend `laravel-best-practices/rules/queue-jobs.md` (exists) and add to `nodejs-development`, `python-development`; cross-stack content in `event-driven-architecture` | enrich |
| Cloud infra, observability, reliability | `devops-engineering` (rework) with `references/` (ci-cd, containers, iac, observability, slo-incident, backups) | enrich; hand off to existing `engineering:*` marketplace skills is out of scope |
| Database scalability | `database-engineering` (rework) + mysql/postgres | indexing method, migration safety, replicas, partitioning, backup/restore verification |
| PHP/WordPress | **new** `php-development` (token `php`), **new** `wordpress-development` (token `wordpress`) | WordPress: plugin/theme architecture, hooks, escaping/nonces/capabilities, `$wpdb->prepare`, WP-CLI, updates/security, performance/caching, multisite. Laravel remains separate |

Per-skill detail follows the same template as section 4 (purpose/trigger/scope/deps/refs/evals); full text is deferred to the implementation PR for each skill to keep this document reviewable. Priorities: security-audit, api-engineering, database-engineering, devops-engineering, performance-engineering reworks = **P1**; `wordpress-development`, `php-development` = **P1** (needed by SEO WordPress guidance); `saas-multitenancy`, `payments-billing` = P2; `realtime-systems`, `event-driven-architecture`, `search-engineering` = P2/P3.

---

## 7. Product engineering roadmap

Goal: idea → production through verifiable stages. Existing `build` (manual `/build`) and `planner` agent already cover plan → implement → review. Product skills sit **before** and **after** that.

| Skill | Purpose | Trigger (draft) | Key content | Gate artifact |
|---|---|---|---|---|
| `product-discovery` | clarify problem, users, scope | "Use when the request is an idea or vague feature, before any PRD or code" | question framework, assumptions list, success metrics, non-goals, risk list | `docs/product/discovery.md` |
| `prd-requirements` | PRD + requirements + user journeys | "Use to write or review a PRD, requirements, acceptance criteria, user stories or journey maps" | PRD template, testable acceptance criteria (Given/When/Then), journey map, traceability IDs | PRD with requirement IDs |
| `product-delivery` | feasibility, data model, API contract, UI plan, test strategy, release plan | "Use after an approved PRD to produce a technical plan: feasibility, data model, API contract, UI flows, test plan and release plan" | feasibility spikes, ER model checklist, contract-first (OpenAPI) handoff to `api-engineering`, test strategy via `test-engineering`, release plan with rollback | tech plan + test matrix |
| `production-readiness` | go/no-go review | "Use before launch: security, performance, observability, backups, rollback, docs, legal/privacy items" | PRR checklist, SLO sketch, runbook stub, load-test expectations, data privacy/consent items (flag legal questions, do not give legal advice) | readiness report |

- **Controlled workflow:** extend `build` to optionally reference these stages (as a "full lifecycle" mode) rather than a new orchestration skill. Each stage ends with a written artifact and a **human approval** before the next (existing pattern in `build`: plan → approval).
- **Verifiability:** requirement IDs flow PRD → tests → release notes; a `checklists/traceability.md` and a deterministic eval that checks every acceptance criterion maps to a test name.
- **Agents:** extend `planner`; add `product-manager` (read-only).
- **Routing:** type-independent, opt-in via token `product` or `domains: [product]`; `build` stays always-available.
- **Priority:** P2. **[U]** whether maintainers want this scope in a code-agent template at all; flagged as decision D3.

---

## 8. Recommended directory structure

```
core/skills/<skill-name>/
  SKILL.md            # <= ~80 lines; detect-first, rules, "load X when Y" index, verify. Hard cap enforced by test.
  references/         # deep guidance, one topic per file, each starts with "Applies to / verified against" header
    SOURCES.md        # official doc names + maintainer-verified URLs + date + version
    frameworks/       # only where the skill spans frameworks (seo-*)
  checklists/         # short, tickable verification lists (release, audit, PR)
  examples/           # SOURCE-ONLY: minimal real patterns (not shipped to projects, see below)
```

Eval material is **not** inside skills (changes vs the brief, decision D2):

```
evals/
  cases.json                 # existing: kept as-is (backward compatible)
  triggers/<domain>.json     # positive, negative, multi-skill, version cases
  scenarios/<id>/            # task + fixture repo + deterministic graders (see 13)
  run.mjs / live.mjs         # existing; extended, flags unchanged
```

Why: `init.mjs` copies every file under a skill directory [E], so `evals/` or large `examples/` inside a skill would be installed into every user's `.claude/skills/`, wasting disk and, worse, being discoverable as context. **Required engine change (small, tested):** skip `evals/` and `examples/` when copying skills, or alternatively keep them out of `core/skills` entirely (preferred, zero engine risk). References and checklists continue to ship.

Naming: lowercase-kebab; one domain prefix (`mobile-`, `seo-`); frontmatter `name` equals the folder; `description` ≤ ~250 chars, always includes "Detects … first" when version-sensitive and a short "Not for …" clause.

---

## 9. Skill dependency and routing matrix

### 9.1 Engine changes (all backward compatible, all optional keys)
1. `skill-map.json` gains `"deps": { "flutter-development": ["mobile-architecture","mobile-quality","mobile-security","mobile-release"], ... }`; `focusSkills()` expands transitively with cycle protection. Missing key → current behavior.
2. New stack tokens: `android`, `compose`, `jetpack`, `kmp`[U], `swiftui`, `php`, `wordpress`, `woocommerce`, `seo`, `product`, `firebase`, `supabase`, `graphql`, `redis`, `kubernetes`, `terraform`.
3. Optional config key `domains: [seo, product, payments, ...]` (schema, README, `project.config.example.yml` and a test per the CLAUDE.md rule), mapped in `skill-map.json` under `"domains"`. Chosen over overloading `stack` because SEO/product are concerns, not tech stacks.
4. `types.mobile` adds `mobile-architecture`, `mobile-security` (small descriptions) so a mobile project with an unmapped stack still gets shared guidance. Check token impact with `bench.mjs` [I].
5. Agents: add `mobile-engineer`, `seo-specialist`, `product-manager`. Currently all agents are always copied [E] → make agent copying follow the same routed set (new optional `agents` map), default unchanged.

### 9.2 Matrix (proposed)

| Trigger (type / stack / domain) | Loads | Via deps |
|---|---|---|
| stack `flutter`/`dart` | flutter-development | mobile-architecture, mobile-quality, mobile-security, mobile-release |
| stack `reactnative`/`expo` | react-native-development, typescript-development | same four |
| stack `swift`/`ios`/`swiftui` | swift-development | same four |
| stack `android`/`compose`/`jetpack` (+ `kotlin` w/ Android plugin) | android-kotlin-development | same four |
| type `mobile` only, no stack | ui-ux, api, + mobile-architecture, mobile-security | — |
| domain `seo` | seo-technical, seo-on-page-content, seo-structured-data | seo-web-vitals if type web/fullstack; others on demand |
| domain `seo` + stack nextjs/laravel/wordpress | + framework reference loaded *inside* the skill by detection | nextjs-/laravel-/wordpress-development |
| stack `wordpress` | wordpress-development, php-development | security-audit (always) |
| domain `payments` / `saas` / `realtime` / `events` / `search` | the matching new skill | api-engineering, database-engineering |
| domain `product` | product-discovery, prd-requirements, product-delivery, production-readiness | build, system-design |

### 9.3 Token efficiency
Focused mode remains default. Budget rule for the program: **adding all new skills must not raise `bench.mjs` always-loaded context for the existing `laravel` and `expo mobile` sample projects by more than the routed additions** (expo mobile will legitimately grow by the mobile skills' descriptions, about 4–5 short descriptions). Measure before/after in each PR and put the numbers in the PR body. All depth sits in references, which cost tokens only when read.

---

## 10. Existing skill enrichment list (ordered)

| # | Skill | Change | Priority |
|---|---|---|---|
| 1 | flutter-development | references per 4.1 | P0 |
| 2 | react-native-development | references per 4.2 | P0 |
| 3 | swift-development | references per 4.4 | P0 |
| 4 | security-audit | severity rubric, output template, OWASP-aligned checklist split web/API/mobile, authn/authz reference; keep non-destructive rule | P1 |
| 5 | api-engineering | contract-first, error format, idempotency, pagination, webhooks, versioning refs | P1 |
| 6 | nextjs-development | metadata/SEO links, caching model, server-action security | P1 |
| 7 | database-engineering | migration safety, indexing method, scaling, backup/restore | P1 |
| 8 | devops-engineering | CI/CD, containers, IaC, observability, rollback refs | P1 |
| 9 | performance-engineering | measure-first method, budgets, per-stack tool pointers; split ownership with seo-web-vitals | P1 |
| 10 | descriptions of the overlap groups in 2.1 | add "Not for …" clauses only (no body change) | P1, cheap |
| 11 | deploy | pre-flight and rollback checklist, keep approval gate | P2 |
| 12 | system-design | ADR template, distributed-systems refs | P2 |
| 13 | frontend-engineering / ui-ux-engineering | a11y checklist, deduplicate against react/tailwind | P2 |
| 14 | react, nodejs, python, typescript | targeted refs (testing, security, observability) | P2 |
| 15 | jvm-development | clarify Spring vs Android boundary pointer | P1 (with Android) |
| 16 | code-review, audit, test | output templates | P2 |

No existing skill is removed or renamed. `review` stays as alias of `code-review`.

## 11. New skill creation list (with priority)

P0: `android-kotlin-development`, `mobile-architecture`, `mobile-security`, `mobile-release`, `seo-technical`, `seo-structured-data`, `seo-migration-monitoring`.
P1: `mobile-quality`, `seo-on-page-content`, `seo-web-vitals`, `seo-international-ecommerce`, `php-development`, `wordpress-development`.
P2: `saas-multitenancy`, `payments-billing`, `product-discovery`, `prd-requirements`, `product-delivery`, `production-readiness`.
P3: `realtime-systems`, `event-driven-architecture`, `search-engineering`.

Full per-skill specs (name, purpose, trigger, scope, topics, deps, refs, evals, priority) for mobile are in section 4, SEO in 5, full-stack in 6, product in 7. Skills in 6 are specified at table granularity; each gets a full spec **inside its own implementation PR** and is reviewed there.

---

## 12. Reference documentation strategy

1. **Source of truth = official documentation, linked not copied.** References carry original, summarized engineering guidance in our words; no wholesale copying. Where text is adapted from a licensed source (e.g. Laravel's MIT-licensed skills) keep the `license`/`metadata.author` frontmatter and a LICENSE note.
2. **No invented URLs.** Each skill has `references/SOURCES.md` with columns: doc name, publisher, URL, version covered, date verified, verified-by. URLs enter the file only after being fetched during that PR. CI check `tools/check-sources.mjs` (opt-in, network) re-verifies links; the offline test only checks the file's format and that no reference links to an un-listed source.
3. **Version gating.** Each reference starts with `Applies to:` (e.g. "Compose BOM ≥ x [fill from docs]"). SKILL.md says: read the installed version, then the matching docs; if docs are unavailable, say so and use conservative APIs. Never hardcode "latest" claims.
4. **Universal vs framework-specific** stay in separate files (`mobile-*`, `seo-*` hold principles; framework skills hold APIs). A lint rule flags framework API names inside shared skills [I].
5. **Reference granularity:** one topic per file, ≤ ~150 lines, loaded via an index table in SKILL.md ("Concern → Read"), the same pattern as `laravel-best-practices`.
6. **Shared references:** things used by many skills (error-format, a11y checklist, security headers, release checklist) live once in the owning skill and are linked, not duplicated.
7. **Examples** are short, compile-checked where cheap (a CI job may build a tiny fixture for Flutter/Kotlin only if the toolchain is present; otherwise marked `unverified`).

---

## 13. Evaluation and benchmark strategy

Principle: **no "world-class" claim without published numbers**. README keeps its current honesty about what is unverified.

### 13.1 Tiers
| Tier | Cost | Runs in CI | What it measures |
|---|---|---|---|
| T0 Static lint | free | yes | frontmatter valid, name=folder, description length, SKILL.md line cap, every `references/x.md` link resolves, no orphan references, no `{{}}`, SOURCES.md format, forbidden claims grep ("guarantee", "will rank", "#1") in SEO skills, no unverified URLs |
| T1 Offline trigger eval | free | yes | lexical ranking (existing `run.mjs`) extended with negatives (expected skill must **not** be in top-3), multi-skill (all expected in top-N), and per-skill precision/recall table. Remains a description-quality guard, **not** a model measurement (documented in file header already) |
| T2 Routing/integration | free | yes | for fixture configs (flutter app, expo app, android app, next+seo, wordpress, laravel+payments) the generated project contains exactly the expected skills, deps expand, evals/examples not shipped, re-run idempotent, token budget within bound |
| T3 Live trigger eval | paid, opt-in | no | `live.mjs` extended with the same positive/negative/multi cases; report precision, recall, per-skill confusion; N repeats to show variance |
| T4 Live task scenarios | paid, opt-in | no | headless `claude -p` (as `bench-cost.mjs` already does) on `evals/scenarios/<id>`: a fixture repo + task; run with skill set A (generated) vs B (baseline: no skills or old version) |

### 13.2 Scenario grading (T4), mostly deterministic
- **Implementation correctness:** fixture's hidden tests pass (`flutter test`/`gradlew test`/`jest` where toolchain exists; otherwise static graders).
- **Test quality:** new tests fail against a mutated implementation (cheap mutation check) and cover the edge cases listed in the task.
- **Security compliance:** grep/AST graders for banned patterns (tokens in AsyncStorage/SharedPreferences, `innerHTML` with input, `GlobalScope`, hardcoded keys) and presence of required controls (nonce/capability check in WP, webhook signature verify).
- **Performance awareness:** presence of the stated measure step (profile/benchmark command run) and absence of known anti-patterns (ScrollView+map for long lists).
- **Version compatibility:** fixtures pinned to an older and a newer version (e.g. React 18 vs 19, RN legacy vs New Architecture, Next older vs newer); grader fails use of APIs absent in the pinned version.
- **Documentation accuracy:** references-check grader: any API named in the answer must appear in the fixture's installed package types/docs or be flagged as unverified; no fabricated URLs (grader checks every URL against SOURCES.md).
- **Trigger precision/recall:** from T3 logs of which skills the transcript actually invoked.
- LLM-judge graders are allowed only as a secondary, clearly labelled score, with the judge prompt and rubric committed.

### 13.3 Case categories per domain (minimum)
Positive ≥ 10, negative ≥ 6 (hard negatives: adjacent-domain prompts), multi-skill ≥ 4, regression (one case per fixed bug), version-specific ≥ 3, implementation scenarios ≥ 3 (mobile/SEO first). Existing 70 cases are migrated unchanged into `triggers/legacy.json`.

### 13.4 Reporting
`evals/REPORT.md` generated per release: per-skill precision/recall, scenario pass rates with run counts and cost, baseline comparison. A skill earns the label "evaluated" only with ≥ N scenario runs recorded. Until then, README says "unevaluated".

---

## 14. Testing and backward compatibility strategy

- **Compatibility contract:** no rename/removal of existing skills/agents/rules/config keys; new config keys optional; default output for an unchanged `project.config.yml` differs only by (a) routed additions for newly mapped tokens and (b) version bump. Any projects whose output changes are listed in the CHANGELOG.
- **Generator tests added to `test.mjs`** (keeping zero-dependency, existing style): deps expansion + cycles, `domains` key, evals/examples exclusion, references link integrity across `core/`, SKILL.md line cap, `SOURCES.md` format, idempotency re-run `0 created, 0 updated` for each new fixture, Windows path handling (`rel.split(path.sep)` pattern already used), CRLF safety.
- **Migration:** existing projects regenerate via `init.mjs`; hash-based hand-edit protection already preserves local edits; new skills appear as "created", enriched skills as "updated" with backups [E]. Because SKILL.md files are rewritten, document in CHANGELOG that customized copies of enriched skills are kept and the new version saved beside them [E behavior].
- **Plugin/global skills:** `skills/` and `.claude-plugin/` are generated from `global-skills/` only [E]; unaffected unless we choose to publish domain skills globally (decision D4). Run `node build-plugin.mjs` anyway; CI fails if stale.
- **Cross-agent:** content stays plain markdown so Codex/Antigravity (supported via `AGENTS.md` and global install per README) can use references; avoid Claude-only frontmatter in new skills except `disable-model-invocation` where already used.
- **Release:** each phase = one PR to `dev` (branch protection: PR only, `source-must-be-dev`), `VERSION` minor bump (1.12.0 …) so projects see `old → new`, update `README.md`, `project.config.example.yml`, schema.
- **Rollback:** each phase is additive and revertable as a single PR.

---

## 15. Prioritized implementation phases

| Phase | Content | Exit criteria |
|---|---|---|
| **P1.0 Foundation** (no new knowledge) | evals/examples exclusion decision; `deps` + `domains` + new tokens in skill-map/init/schema/README/example; agent routing (optional); T0 lint + T2 routing tests; eval case schema v2 + T1 negatives/multi; `SOURCES.md` format + template | all tests green on Node 18/22 × 3 OS; bench numbers unchanged for existing sample projects |
| **P2 Mobile A** | `android-kotlin-development`, `mobile-architecture`, `mobile-security`, `mobile-release`; flutter, react-native, swift references | T0–T2 pass; ≥ 10 positive, 6 negative, 4 multi cases per skill; scenarios authored |
| **P3 Mobile B + SEO A** | `mobile-quality`; `seo-technical`, `seo-structured-data`, `seo-migration-monitoring`; `php-development`, `wordpress-development` | same; SEO forbidden-claims lint active |
| **P4 SEO B + cross-cutting reworks** | remaining SEO skills; security-audit, api, db, devops, performance, nextjs enrichment; overlap-description fixes | ditto |
| **P5 Live evaluation** | T3 + T4 on mobile and SEO, publish `evals/REPORT.md`; iterate skills on failures | report committed; claims in README limited to measured results |
| **P6 Full-stack + Product** | SaaS, payments, realtime, events, search; product family; extended `build` lifecycle | ditto |

Each phase ends with a PR, a measured token delta, and your approval before the next.

---

## 16. Decisions needed from you (before Phase P1.0)

- **D1 Consolidation:** accept 5 mobile + 6 SEO skills (with the other requested names as reference topics) instead of 10 + 10 standalone skills? Recommended: yes (token cost, routing precision, less duplication). If you want all 20 standalone, the references plan is unchanged and only the router layer grows.
- **D2 Eval location:** keep evals outside `core/skills` (recommended, zero engine risk) vs the brief's `core/skills/<name>/evals/` plus an exclusion rule in `init.mjs`.
- **D3 Product family:** in scope for this template or a separate repo? Recommended: in scope but last (P6), opt-in.
- **D4 Distribution:** should domain skills also be offered through the global/plugin channel, or stay project-installed only? Recommended: project-installed only for now.
- **D5 Android + Kotlin Multiplatform:** include KMP guidance? [U] not in the brief; recommended deferred.

## 17. Uncertainties and things I deliberately did not assert

- Current stable versions and defaults of Flutter, Dart, Expo SDK, React Native (New Architecture default/legacy removal), Next.js, AGP, Compose, Swift/Xcode as of today. Skills must read the installed version; the references will cite versions only after being verified against the docs during their PR.
- Which Google rich-result types are currently supported or restricted, exact CWV thresholds and sitemap limits: to be confirmed from current Search Central docs in the SEO PRs.
- Play Store and App Store policy deadlines (target API level, privacy manifests, data-safety forms): same.
- Maintenance status of specific packages (e.g. Isar, EncryptedSharedPreferences): verify at build time; skills should say "check maintenance status" rather than recommend blindly.
- The 7 git template skills, the 8 hooks' internals and `bench-cost.mjs` were not read in depth.
- Effectiveness of any current skill is unmeasured; the audit ratings are reviewer judgment, not benchmark results.
- I did not browse external documentation in this phase, so **no external URL appears in this document**.
