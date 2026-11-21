# Industry skill coverage (P7, Phase 1)

Status: **draft**. Coverage means "a skill exists and is routed"; it says nothing about quality, which is unmeasured (see `docs/SKILL-AUDIT.md`). Only skills present in `core/skills` as of `VERSION 1.17.0` are marked implemented. The strategy report was not available, so the P8-P11 areas below follow the brief's names and are **proposed, not planned**.

| Area | Implemented | Depth | Gap |
|---|---|---|---|
| Languages/frameworks | typescript, react, nextjs, nodejs, python, vue, go, rust, ruby, dotnet, jvm, php, wordpress, laravel, tailwind | 19-59 lines; references only for laravel, nextjs, php, wordpress | no references for most; no Angular, Svelte, Django/Rails specifics, Kotlin backend split |
| Mobile | flutter, react-native, swift, android-kotlin, mobile-architecture/security/quality/release | references, SOURCES unverified | KMP deferred; store policy claims unverified |
| SEO | 6 `seo-*` skills | references, SOURCES unverified | no live check against Search Central |
| Full-stack/product | saas-multitenancy, payments-billing, realtime, events, search, product-* (4) | references, opt-in domains | pilot shows no measured benefit |
| Data stores | mysql, postgresql, database-engineering, search | MySQL/PostgreSQL 19 lines, no refs | no Redis, MongoDB, migrations-at-scale |
| Quality/process | test*, code-review, audit, bug-investigation, safe-refactoring, technical-debt, dependency-management | 5-31 lines | thin and overlapping (audit 2.3) |
| Security | security-audit, mobile-security | security-audit has references | no IAM/identity, threat modeling skill |
| **P8 Cloud/production** | devops-engineering, production-readiness (partial) | generic | no Kubernetes, Terraform/IaC, observability, cloud provider skills |
| **P9 Backend/identity/distributed** | api-engineering, event-driven-architecture (partial) | generic | no auth/identity, caching, queues, consistency skills |
| **P10 AI application engineering** | none (global `claude-api` skill is outside this repo) | - | not covered |
| **P11 Enterprise/specialized** | none | - | demand-based, not started |

## Decision rule
Do not add P8-P11 skills until P7 evidence exists: per-skill context cost, discriminating scenarios, and verified sources. Prefer deepening or merging existing skills over adding new top-level ones.
