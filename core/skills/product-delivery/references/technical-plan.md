# Technical plan

- **Feasibility:** for each Must requirement, mark feasible / feasible with changes / unknown / not feasible, with the evidence (file references, existing capability, third-party limits). Unknowns become time-boxed spikes with a question, method and exit criterion. Note build-vs-buy options when relevant, with cost, risk and lock-in.
- **Architecture fit:** where the change lives (modules/services), data flow, new components, external integrations, security and privacy implications (data classification, authn/authz, audit), performance and scalability expectations from the NFRs. Record significant decisions as ADRs if the project uses them (see `system-design`).
- **Data model:** entities, relationships, constraints, indexes, migrations (expand/contract plan: `database-engineering`), data volume, retention and deletion, backfill needs, multi-tenancy (`saas-multitenancy`) when applicable. Show an ER sketch or table list.
- **API contract:** endpoints/events with request/response shapes, errors, auth, pagination, idempotency, versioning and compatibility (`api-engineering`); write an OpenAPI or equivalent draft when the project uses it; agree the contract with consumers before implementation.
- **UI flows:** screens and states (loading, empty, error, success, permission), navigation, copy needs, accessibility requirements, responsive behavior; link to designs; use the project's design system (`ui-ux-engineering`, `frontend-engineering`).
- **Background/async work:** jobs, queues, schedules, retries (`event-driven-architecture`), external callbacks (`payments-billing` for money flows).
- **Task breakdown:** ordered vertical slices; each task names requirement IDs, files/modules touched, tests that prove it, risk level, and whether it needs security review; dependencies and parallelizable work; estimates only if the user wants them and labelled as estimates.
- **Risks and mitigations:** technical, schedule, data, security, operational; fallback plan.
- **Open decisions** for the user with options and a recommendation.
