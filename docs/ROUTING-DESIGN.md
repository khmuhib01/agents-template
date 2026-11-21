# Routing design and verification (P7, Phase 1)

Status: **draft**. Sections 2 and 3 describe the state *before* the fixes in 1.17.1 (the audit commit changed no code); section 3 now marks what the fix commit resolved. Verified on `dev` at `VERSION 1.17.0` by running `lib/routing.mjs` against `core/skill-map.json` and by running `init.mjs` into temporary directories (outside the repo). The probe lists below are my own sample, not an exhaustive test.

## 1. How routing works [E: lib/routing.mjs, init.mjs]
1. Skills = `map.types[type]` + skills of every matching `stack` token + skills of every matching `domains` key, then `deps` expanded transitively (cycle-safe BFS), then filtered to skills that exist.
2. Stack token matching: lowercase, non-alphanumerics removed. A token matches key `k` if it equals `k`, or starts with `k` and the remainder is only digits or exactly `js`. So `react18`, `node.js`, `nuxt3` match; `nodejs20`, `tailwindcss`, `springboot` do not (below).
3. Domains are matched separately (case and punctuation insensitive). A domain name given as a stack token does not match.
4. `focused` (default) installs: `map.always` + routed skills + the git-workflow template skills. `all` installs everything. Unmatched tokens only produce a warning.

## 2. Verification results
| Claim | Result |
|---|---|
| Every skill name in the map exists, every core skill is reachable | **verified**: 0 unknown names, 0 unreachable skills |
| `deps` graph has no cycles | **verified** by DFS over all 12 entries: none. Cycle termination in `expandDeps` is also covered by `test.mjs` ("dependency cycles terminate") |
| Focused mode installs only routed skills | **verified** on 3 configs: installed set = `always` + routed + 4 template skills (`doc-sync`, `ship`, `merge-to-dev`, `merge-to-main`), none missing, none stray (laravel web 37, expo mobile + seo domain 43, unmatched-token web 33) |
| `/merge-to-*` and `/ship` skipped without an integration branch | **verified** (0 merge skills with `integration: ""`) |
| `init` never deletes skills already installed (README) | **verified**: switching a 75-skill `all` project to `focused` left 75 skills, 0 created, 9 updated files |
| Re-run is idempotent | **verified**: 0 created, 0 updated, 119 unchanged |
| Unknown token warns but still generates | **verified** ("matched no skill: tailwindcss, nodejs20, springboot") |
| README: "Every run prints the skill-description token overhead **and what focused would save**" | **partly wrong**: the overhead line prints every run; the saving line prints only in `skills_mode: all` (`init.mjs` L565-569) |
| Stack matrix test checks each token | **verified by reading test.mjs L228-252**: each of the 48 tokens installs its skills and no other stack's. Positive only |
| Negative/ambiguous token tests | **mostly missing**: only `cobol` (unknown) and `bogus` domain, plus unit checks for suffix matching. The defects below were not caught |

## 3. Defects found [E, reproduced]
| # | Input | Result | Impact | Proposed fix (not applied) |
|---|---|---|---|---|
| D1 (fixed 1.17.1) | stack `tailwindcss` | unmatched | the key is `tailwind`; the skill is named `tailwindcss-development` and users naturally write the product name | add alias key `tailwindcss` |
| D2 (fixed 1.17.1) | stack `nodejs20` | unmatched, while `node20` and `node.js` match | `nodejs` has no key; the `node`+`js` suffix rule only matches the exact remainder `js` | add key `nodejs` (suffix rule then handles versions) |
| D3 (fixed 1.17.1) | stack `springboot`, `spring-boot` | unmatched, `spring` matches | very common spelling | add alias `springboot` |
| D4 (fixed 1.17.1 with aliases `jetpackcompose`, `exporouter`, `aspnet`, `net`, `ts`; `c#` is not alias-able because `#` is stripped to an empty token) | `jetpack-compose`, `expo-router`, `aspnet`, `.NET`, `ts`, `c#` | unmatched | common spellings | add aliases where sensible (`jetpackcompose`, `exporouter`, `aspnet`, `net`, `ts`) |
| D5 (fixed 1.17.1) | stack `seo` | unmatched; warning says "check spelling, or map them in skill-map.json" | SEO is a *domain*, so the hint misleads | mention `domains` in the warning for tokens that equal a domain key |
| D6 (pinned by test, behavior kept) | `kotlin` only | routes `jvm-development` only | Android users must also add `android` or `compose` | documented ambiguity, add a negative/ambiguous test |
| D7 | `type: mobile` without a stack | routes `mobile-architecture` and `mobile-security` but not `mobile-release`/`mobile-quality` (those come via deps of a platform skill) | intended or oversight is unclear [U] | decide and document |
| D8 | tokens `redis`, `graphql`, `firebase`, `supabase`, `kubernetes`/`k8s`, `terraform`, `angular`, `svelte`, `kmp`, `pg` | unmatched | no skill exists for them; not a routing bug, a coverage gap | see INDUSTRY-SKILL-COVERAGE |
| D9 (fixed 1.17.1) | README "saves" sentence | inaccurate | see section 2 | edit README |

Suffix-rule negatives that behave correctly: `gorm` and `kotlinx` do not match `go`/`kotlin`; `next` does not match `nextjs`; singular domain `payment` does not match `payments`.

## 4. Routing matrix
### 4.1 Types (skills added on top of the `always` set)
| type | skills |
|---|---|
| web | frontend-engineering, ui-ux-engineering, api-engineering, devops-engineering |
| api | api-engineering, database-engineering, devops-engineering |
| mobile | ui-ux-engineering, api-engineering, mobile-architecture, mobile-security |
| fullstack | frontend-engineering, ui-ux-engineering, api-engineering, database-engineering, devops-engineering |
| cli | devops-engineering |
| library | (none) |
| other | devops-engineering |

### 4.2 Domains
| domain | skills (incl. deps) |
|---|---|
| seo | seo-technical, seo-on-page-content, seo-structured-data, seo-web-vitals, seo-international-ecommerce, seo-migration-monitoring |
| saas | saas-multitenancy, database-engineering, api-engineering |
| payments | payments-billing, api-engineering, database-engineering |
| realtime | realtime-systems, api-engineering |
| events | event-driven-architecture |
| search | search-engineering, database-engineering |
| product | product-discovery, prd-requirements, product-delivery, production-readiness, api-engineering, devops-engineering |

### 4.3 Stack tokens (skills added on top of the `always` set, incl. deps; every token resolves with 0 unmatched)
| token | skills |
|---|---|
| laravel | laravel-best-practices, infer-conventions, database-engineering |
| blade | frontend-engineering |
| livewire | frontend-engineering |
| inertia | frontend-engineering |
| tailwind | tailwindcss-development |
| react | react-development, typescript-development |
| nextjs | nextjs-development, react-development, typescript-development |
| vue | vue-development |
| nuxt | vue-development |
| typescript | typescript-development |
| node | nodejs-development, typescript-development |
| express | nodejs-development |
| nest | nodejs-development, typescript-development |
| fastify | nodejs-development |
| python | python-development |
| django | python-development |
| fastapi | python-development |
| flask | python-development |
| reactnative | react-native-development, typescript-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| expo | react-native-development, typescript-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| mysql | mysql-engineering, database-engineering |
| mariadb | mysql-engineering, database-engineering |
| postgres | postgresql-engineering, database-engineering |
| postgresql | postgresql-engineering, database-engineering |
| sqlite | database-engineering |
| mongodb | database-engineering |
| docker | devops-engineering |
| go | go-development |
| rust | rust-development |
| ruby | ruby-development |
| rails | ruby-development, database-engineering |
| java | jvm-development |
| kotlin | jvm-development |
| dotnet | dotnet-development |
| flutter | flutter-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| golang | go-development |
| spring | jvm-development |
| csharp | dotnet-development |
| dart | flutter-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| swift | swift-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| ios | swift-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| android | android-kotlin-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| compose | android-kotlin-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| jetpack | android-kotlin-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| swiftui | swift-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| php | php-development |
| wordpress | wordpress-development, php-development |
| woocommerce | wordpress-development, php-development |

### 4.4 Probe set (ambiguous and negative spellings)
| input | result |
|---|---|
| react18 | react-development, typescript-development |
| React | react-development, typescript-development |
| Next.js | nextjs-development, react-development, typescript-development |
| next | UNMATCHED |
| node.js | nodejs-development, typescript-development |
| nodejs20 | UNMATCHED |
| node20 | nodejs-development, typescript-development |
| vuejs | vue-development |
| vue3 | vue-development |
| nuxt3 | vue-development |
| springboot | UNMATCHED |
| spring-boot | UNMATCHED |
| golang | go-development |
| go1 | go-development |
| gorm | UNMATCHED |
| kotlinx | UNMATCHED |
| kotlin | jvm-development |
| php8 | php-development |
| wordpress6 | wordpress-development, php-development |
| laravel8 | laravel-best-practices, infer-conventions, database-engineering |
| laravel-11 | laravel-best-practices, infer-conventions, database-engineering |
| Laravel_11 | laravel-best-practices, infer-conventions, database-engineering |
| django4 | python-development |
| rails7 | ruby-development, database-engineering |
| ruby3 | ruby-development |
| dotnet8 | dotnet-development |
| .NET | UNMATCHED |
| csharp | dotnet-development |
| aspnet | UNMATCHED |
| react-native | react-native-development, typescript-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| reactnative | react-native-development, typescript-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| expo | react-native-development, typescript-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| expo-router | UNMATCHED |
| flutter3 | flutter-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| dart3 | flutter-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| swiftui | swift-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| ios | swift-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| android | android-kotlin-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| compose | android-kotlin-development, mobile-architecture, mobile-security, mobile-release, mobile-quality |
| jetpack-compose | UNMATCHED |
| kmp | UNMATCHED |
| mysql8 | mysql-engineering, database-engineering |
| mariadb | mysql-engineering, database-engineering |
| postgres16 | postgresql-engineering, database-engineering |
| postgresql | postgresql-engineering, database-engineering |
| pg | UNMATCHED |
| redis | UNMATCHED |
| mongodb | database-engineering |
| graphql | UNMATCHED |
| firebase | UNMATCHED |
| supabase | UNMATCHED |
| kubernetes | UNMATCHED |
| k8s | UNMATCHED |
| terraform | UNMATCHED |
| docker | devops-engineering |
| tailwind3 | tailwindcss-development |
| tailwindcss | UNMATCHED |
| shopify | UNMATCHED |
| angular | UNMATCHED |
| svelte | UNMATCHED |
| seo | UNMATCHED |
| wordpress | wordpress-development, php-development |
| woocommerce | wordpress-development, php-development |
| nest | nodejs-development, typescript-development |
| nestjs | nodejs-development, typescript-development |
| fastapi | python-development |
| flask | python-development |
| ts | UNMATCHED |
| typescript | typescript-development |
| rust | rust-development |
| java | jvm-development |
| c# | UNMATCHED |
| domain:SEO | seo-technical, seo-on-page-content, seo-structured-data, seo-web-vitals, seo-international-ecommerce, seo-migration-monitoring |
| domain:Seo | seo-technical, seo-on-page-content, seo-structured-data, seo-web-vitals, seo-international-ecommerce, seo-migration-monitoring |
| domain:payment | UNMATCHED |
| domain:payments | payments-billing, api-engineering, database-engineering |
| domain:saas | saas-multitenancy, database-engineering, api-engineering |
| domain:multitenancy | UNMATCHED |
| domain:search | search-engineering, database-engineering |
| domain:events | event-driven-architecture |
| domain:realtime | realtime-systems, api-engineering |
| domain:product | product-discovery, prd-requirements, product-delivery, production-readiness, api-engineering, devops-engineering |
| domain:mobile | UNMATCHED |

## 5. What is still not done
- D1-D6 and D9 are now pinned by tests in `test.mjs` (`[routing lib]`, `[stack matrix]`). D7 (`type: mobile` and `mobile-release`/`mobile-quality`) is an open decision, not changed.
- Type routing has no negative tests.
- Live trigger accuracy (does a real model pick the right skill from the description) is unmeasured; only the offline lexical eval (149 cases) and a paid `evals/live.mjs` exist.
- The fixes were released as `1.17.1` because they change which skills existing projects get; revert the bump if you disagree.
