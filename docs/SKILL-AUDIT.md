# Skill audit (P7, Phase 1)

Status: **draft for review**. Read-only audit, no change to `core/`, `templates/`, `lib/`, `init.mjs` or tests.
Baseline: branch `dev` (clean at start), `VERSION 1.17.0`, 68 core skills, 10 agents, 4 rules. `node test.mjs` passes, `node evals/run.mjs` 149/149, `node bench.mjs` runs (laravel focused: 37 skills, 3439 est. tokens always-loaded).
Method: columns below were computed by script from `core/skills/*/SKILL.md`, `core/skill-map.json`, `evals/cases.json` and `evals/triggers/*.json` (79 trigger cases + 70 legacy). Findings marked **[E]** are evidence from those files, **[I]** are judgment, **[U]** are unverified.
Limit: the strategy report `AGENTS-TEMPLATE-INDUSTRY-ENGINEERING-STRATEGY.md` is not in the repo and was not available, so P7 scope here follows the brief only.

## 1. Inventory
Columns: lines = SKILL.md length; desc = description chars; man = manual-only (`disable-model-invocation`); refs = files in references/rules/checklists; src = SOURCES.md present (all are unverified, see 3); NF = description has a literal "Not for"; +/- = at least one positive / negative eval case names the skill.

| Skill | lines | desc | man | refs | src | NF | + | - | Routed by |
|---|---|---|---|---|---|---|---|---|---|
| android-kotlin-development | 37 | 224 | - | 10 | y | - | y | y | stack:android,stack:compose,stack:jetpack |
| api-engineering | 18 | 217 | - | 4 | y | y | y | y | dep-of:payments-billing,dep-of:product-delivery,dep-of:realt |
| audit | 5 | 244 | - | 0 | - | y | y | y | always |
| bug-investigation | 9 | 187 | - | 0 | - | - | y | - | always |
| build | 20 | 141 | y | 0 | - | - | - | - | always |
| code-review | 5 | 175 | - | 0 | - | - | y | y | always |
| database-engineering | 18 | 222 | - | 4 | y | - | y | - | dep-of:payments-billing,dep-of:saas-multitenancy,dep-of:sear |
| dependency-management | 9 | 159 | - | 0 | - | - | y | - | always |
| deploy | 6 | 176 | y | 0 | - | - | - | - | always |
| devops-engineering | 18 | 205 | - | 4 | y | - | y | y | dep-of:production-readiness,stack:docker,type:api,type:cli,t |
| dotnet-development | 19 | 221 | - | 0 | - | - | y | - | stack:csharp,stack:dotnet |
| event-driven-architecture | 24 | 234 | - | 3 | y | - | y | y | domain:events |
| flutter-development | 31 | 246 | - | 6 | y | y | y | y | stack:dart,stack:flutter |
| framework-upgrade | 15 | 222 | - | 0 | - | - | y | - | always |
| frontend-engineering | 9 | 258 | - | 0 | - | - | - | - | stack:blade,stack:inertia,stack:livewire,type:fullstack,type |
| go-development | 20 | 191 | - | 0 | - | - | y | - | stack:go,stack:golang |
| infer-conventions | 20 | 186 | y | 3 | - | - | - | - | stack:laravel |
| jvm-development | 19 | 227 | - | 0 | - | y | y | - | stack:java,stack:kotlin,stack:spring |
| laravel-best-practices | 59 | 212 | - | 19 | - | - | y | y | stack:laravel |
| mobile-architecture | 30 | 228 | - | 5 | y | - | y | y | dep-of:android-kotlin-development,dep-of:flutter-development |
| mobile-quality | 27 | 222 | - | 4 | y | - | y | y | dep-of:android-kotlin-development,dep-of:flutter-development |
| mobile-release | 27 | 252 | - | 5 | y | - | y | y | dep-of:android-kotlin-development,dep-of:flutter-development |
| mobile-security | 26 | 256 | - | 4 | y | - | y | y | dep-of:android-kotlin-development,dep-of:flutter-development |
| mysql-engineering | 19 | 190 | - | 0 | - | - | y | - | stack:mariadb,stack:mysql |
| nextjs-development | 40 | 222 | - | 3 | y | - | y | - | stack:nextjs |
| nodejs-development | 32 | 215 | - | 0 | - | - | y | - | stack:express,stack:fastify,stack:nest,stack:node |
| payments-billing | 27 | 252 | - | 3 | y | - | y | y | domain:payments |
| performance-engineering | 15 | 218 | - | 3 | y | - | y | - | always,dep-of:production-readiness |
| php-development | 27 | 230 | - | 3 | y | - | y | y | dep-of:wordpress-development,stack:php,stack:woocommerce,sta |
| postgresql-engineering | 19 | 194 | - | 0 | - | - | y | - | stack:postgres,stack:postgresql |
| pr | 6 | 107 | y | 0 | - | - | - | - | always |
| prd-requirements | 27 | 222 | - | 3 | y | - | y | y | domain:product |
| product-delivery | 24 | 239 | - | 3 | y | - | y | - | domain:product |
| product-discovery | 26 | 221 | - | 3 | y | - | y | y | domain:product |
| production-readiness | 22 | 239 | - | 3 | y | - | y | y | domain:product |
| project-init | 48 | 154 | y | 0 | - | - | - | - | always |
| project-intelligence | 18 | 161 | - | 0 | - | - | y | - | always |
| python-development | 32 | 197 | - | 0 | - | - | y | - | stack:django,stack:fastapi,stack:flask,stack:python |
| react-development | 32 | 195 | - | 0 | - | - | y | y | stack:nextjs,stack:react |
| react-native-development | 31 | 229 | - | 5 | y | - | y | y | stack:expo,stack:reactnative |
| realtime-systems | 23 | 260 | - | 3 | y | - | y | y | domain:realtime |
| review | 6 | 146 | y | 0 | - | - | - | - | always |
| ruby-development | 19 | 172 | - | 0 | - | - | y | - | stack:rails,stack:ruby |
| rust-development | 20 | 212 | - | 0 | - | - | y | - | stack:rust |
| saas-multitenancy | 24 | 254 | - | 3 | y | - | y | y | domain:saas |
| safe-refactoring | 15 | 160 | - | 0 | - | - | y | - | always |
| search-engineering | 23 | 251 | - | 3 | y | - | y | y | domain:search |
| security-audit | 19 | 237 | - | 5 | y | - | y | - | always,dep-of:production-readiness |
| seo-international-ecommerce | 26 | 237 | - | 4 | y | - | y | y | domain:seo |
| seo-migration-monitoring | 24 | 261 | - | 3 | y | - | y | y | domain:seo |
| seo-on-page-content | 27 | 243 | - | 4 | y | - | y | y | domain:seo |
| seo-structured-data | 27 | 255 | - | 4 | y | - | y | y | domain:seo |
| seo-technical | 31 | 249 | - | 5 | y | - | y | y | domain:seo |
| seo-web-vitals | 26 | 237 | - | 4 | y | - | y | y | domain:seo |
| status | 6 | 113 | y | 0 | - | - | - | - | always |
| swift-development | 29 | 215 | - | 5 | y | - | y | y | stack:ios,stack:swift,stack:swiftui |
| sync | 6 | 126 | y | 0 | - | - | - | - | always |
| system-design | 9 | 173 | - | 0 | - | - | y | - | always,dep-of:event-driven-architecture,dep-of:product-deliv |
| tailwindcss-development | 105 | 193 | - | 0 | - | - | y | - | stack:tailwind |
| technical-debt | 9 | 212 | - | 0 | - | - | y | y | always |
| technical-documentation | 9 | 139 | - | 0 | - | - | y | - | always |
| test | 5 | 146 | - | 0 | - | - | y | - | always |
| test-engineering | 9 | 225 | - | 0 | - | - | y | - | always,dep-of:product-delivery |
| testing-best-practices | 31 | 178 | - | 9 | - | - | y | - | always |
| typescript-development | 27 | 185 | - | 0 | - | - | y | - | stack:expo,stack:nest,stack:nextjs,stack:node,stack:react,st |
| ui-ux-engineering | 9 | 244 | - | 0 | - | - | y | - | type:fullstack,type:mobile,type:web |
| vue-development | 22 | 175 | - | 0 | - | - | y | - | stack:nuxt,stack:vue |
| wordpress-development | 29 | 235 | - | 5 | y | - | y | y | stack:woocommerce,stack:wordpress |

"Routed by" is truncated to 60 characters by the script; the full routing is in `core/skill-map.json`.

## 2. Findings

### 2.1 Depth and shape [E]
- 34 of 68 skills have supporting files; 27 non-manual skills have none.
- 16 skills are 9 lines or fewer. 11 of them are model-invocable and thin: `audit`, `code-review`, `test` (5 lines), and `bug-investigation`, `dependency-management`, `frontend-engineering`, `system-design`, `technical-debt`, `technical-documentation`, `test-engineering`, `ui-ux-engineering` (9 lines). The other 5 are manual commands (`pr`, `status`, `sync`, `review`, `deploy`), where short is fine.
- `tailwindcss-development` is a single 105-line file with no references, above the 150-line limit's spirit for progressive disclosure [I].
- Language skills (`dotnet`, `go`, `jvm`, `python`, `ruby`, `rust`, `vue`, `typescript`, `react`, `nodejs`, `mysql`, `postgresql`) have no references and no negative eval cases.

### 2.2 Descriptions and context cost [E]
- Description text across all 68 skills is 14,123 characters (about 3.5K tokens at ~4 chars/token).
- Only 4 SKILL.md files contain the literal "Not for", 9 contain "not for" or "do not use" in any form. The authoring guide asks for a "Not for" clause where skills overlap, so the overlap groups in 2.3 are mostly unguarded.
- `always` routes 25 entries (22 core skills plus `commit`, `commit-push`, `push`) into every project, including `system-design`, `performance-engineering`, `security-audit` and `technical-debt`, whatever the task. This is the main static-context cost and is unmeasured per skill [I].

### 2.3 Overlap register
| Group | Skills | Risk | Proposed action (not applied) |
|---|---|---|---|
| Review | `review` (manual), `code-review`, `audit`, `security-audit`, `technical-debt` | triggers overlap; `review` duplicates `code-review` body [E, from blueprint] | add "Not for" clauses; document `review` as alias |
| Testing | `test`, `test-engineering`, `testing-best-practices` | three-way confusion | add "Not for" clauses; add negative cases |
| Frontend | `frontend-engineering`, `ui-ux-engineering`, `react-development`, `nextjs-development`, `tailwindcss-development`, `seo-web-vitals` | generic vs framework vs SEO performance | clarify boundaries; `frontend-engineering` has zero eval cases |
| Ops | `devops-engineering`, `deploy`, `production-readiness`, `mobile-release` | release/deploy overlap | define who owns approval gate wording |
| Design | `system-design`, `architect` agent, `event-driven-architecture`, `mobile-architecture` | generic vs specific | keep generic skill thin, specific ones deeper |
| DB | `database-engineering`, `mysql-engineering`, `postgresql-engineering`, `search-engineering` | engine vs generic | ok if deps stay explicit |

### 2.4 Eval coverage [E]
- Non-manual skills with no positive case: `frontend-engineering` (only one).
- Manual skills with no case: `build`, `deploy`, `pr`, `status`, `sync`, `project-init`, `review`, `infer-conventions` (expected, since they are not model-invoked, but routing of them is untested).
- 29 non-manual skills have no negative case (all `always` generics and most language skills).
- Only 5 task scenarios exist (mobile token storage, React 18 APIs, SEO noindex, structured data, WordPress plugin security). All were run once per arm.

### 2.5 Source verification [E]
Started on the 6 SEO skills (branch `docs/p7-sources-seo`, 2026-11-21): 17 official pages fetched and recorded in their `SOURCES.md` (Google Search Central, web.dev, Chrome CrUX, RFC 9309, schema.org). The Core Web Vitals thresholds, INP replacing FID, JSON-LD recommendation, hreflang self-reference/reciprocity and "blocked URLs can still appear" claims matched the fetched pages. Not confirmed: the "dynamic rendering is a workaround" wording in `rendering-js.md` (the JS SEO page does not mention it), sitemap size limits, Bing guidelines (page returned no content), Change of Address tool (wrong page fetched, not recorded).
Mobile skills (branch `docs/p7-sources-mobile`): 7 of 8 skills now have verified rows (android-kotlin, flutter, react-native, mobile-architecture, mobile-security, mobile-quality, mobile-release; 34 distinct pages). `swift-development` has **none**: Apple Developer Documentation is JavaScript-rendered and the fetch returned only titles, so Apple-side guidance (privacy manifests, Keychain, BackgroundTasks, SwiftData) stays unverified for every skill that cites it. Also unconfirmed: the "current" MASVS version (page prints none), FlutterFire (redirected, target not fetched), Play staged-rollout and data-safety help (wrong or 404 URLs, not recorded). Facts found: Play target API 36 (printed deadline 2026-08-31), React Native New Architecture default since 0.76 (latest 0.88), Expo SDK 58, WCAG 2.2.
Remaining skills (branch `docs/p7-sources-rest`): 14 more skills got verified rows (api, realtime, security-audit, php, wordpress, devops, nextjs, performance, database, saas, search, event-driven, payments, production-readiness; 44 distinct pages). Total with verified rows: 27 of 31 `SOURCES.md` files. The three product skills (`product-discovery`, `prd-requirements`, `product-delivery`) have no external documentation to verify; their files now say so. `swift-development` stays unverified (see above).
Not confirmed: Kafka docs (redirect stub), PCI SAQ documents (list did not load), OWASP Top 10 edition text (only a redirect to a 2025 edition was read), current CWE version (page conflicts), current Kubernetes release. Matches found: RFC 9457 obsoletes 7807, `str_contains` is PHP 8, Stripe webhook signature and duplicate-event guidance. Most rows prove only that the official page exists and is current; version-specific claims inside the references were mostly not compared line by line, so "verified" here means source located, not every sentence checked.

### 2.6 Routing and dependencies [E]
- `skill-map.json`: 7 types, 48 stack tokens, 7 domains, 12 deps entries. Full matrix and defects: `docs/ROUTING-DESIGN.md`.
- Every skill is routed somewhere (the catalog test enforces reachability).
- `deps` are expanded transitively; the existing test suite covers this. Dependency graph is shallow (mobile and domain skills only); a DFS shows no cycles and `test.mjs` checks that expansion terminates on a cycle.
- `type: library` routes no skills; `cli` and `other` route only `devops-engineering`.
- `frontend-engineering` is routed by `web`, `fullstack` and three PHP tokens, yet has no eval case.

### 2.7 Agents [E]
10 agents: 6 to 10 lines each except `git-manager` (53). None declares input/output schema, tools, budget or stop conditions. They are role prompts, not contracts. No agent routing exists yet (deferred in the blueprint).

### 2.8 Effectiveness [E from evals/REPORT.md]
Pilot of 5 scenarios x 2 arms x 1 run (Sonnet): every scenario passed in both arms; skills arm cost more in the recorded cells ($0.224 vs $0.094, $0.093 vs $0.062, $0.080 vs $0.058, $0.146 vs $0.106, $0.116 vs $0.090). With one run per cell this is noise, and it shows no skill benefit. Trigger accuracy against a live model is not measured.

## 3. Smallest changes that reduce context cost (proposals, not applied)
1. Measure per-skill description tokens and move rarely useful `always` skills (`technical-debt`, `performance-engineering`, `system-design`, `audit`) to type/stack routing, then check with `bench.mjs` and the 149 trigger cases. Needs evidence first.
2. Add "Not for" clauses to the groups in 2.3.
3. Add negative and ambiguous cases for the 29 skills lacking them.
4. Add `frontend-engineering` positive cases.
5. Harder scenarios that discriminate between arms before claiming any benefit.

## 4. Acceptance check against the brief's Phase 1
| Criterion | Status |
|---|---|
| Every skill has assessed purpose and trigger boundary | partly: inventory and boundary flags done, per-skill purpose review only for the overlap groups |
| Every routing token has positive, negative, ambiguous tests | **audited, not yet tested**: all 48 tokens, 7 domains and 7 types resolved and probed (`docs/ROUTING-DESIGN.md`); defects D1-D7 found; D1-D6 and D9 fixed in 1.17.1 with table-driven positive/negative/ambiguous tests |
| Dependency resolution deterministic and cycle-safe | met: DFS shows no cycles, `expandDeps` terminates on cycles (existing test) |
| Focused mode accurately described and tested | met with one README correction (D9): behavior verified on 3 configs; the "saves" line prints only in `all` mode |
| Proposed vs implemented separated | met |
| Cost/context metrics included | partly: static only, no live metrics |
| No unsupported quality claims | met |

## 5. Next steps
Routing fixes and tests are done (1.17.1). Open: D7 decision, then source verification PRs. See `docs/INDUSTRY-SKILL-COVERAGE.md` for coverage gaps.
