# Store submission and rollout

Check the current App Store Review Guidelines and Google Play policies for the submission at hand; they change and enforcement deadlines (target SDK/API levels, privacy manifests, data-safety declarations) vary by date.
- **Pre-submission checklist:** release build tested on real devices incl. oldest supported OS; permission strings/usage descriptions accurate; privacy disclosures (App Privacy details / Data safety) match actual SDK behavior; login demo account for reviewers; no debug or placeholder content; correct age rating; export/crypto declarations; screenshots for required device sizes; support and privacy-policy URLs live.
- **Common rejection causes (verify per current guidelines):** crashes, broken links, missing account deletion, inaccurate metadata, undeclared tracking, misuse of permissions or background modes, incomplete demo access.
- **Channels:** TestFlight / Play internal and closed tracks before production; beta feedback has a triage owner.
- **Staged rollout:** start small, watch crash-free users/sessions and key funnels, widen only on green; have a halt criterion defined in advance. Phased release (iOS) and staged percentage (Play) differ in controls.
- **Hotfix:** minimal change branch, full pipeline, expedited review request only when justified.
- **Rollback reality:** stores cannot recall a version on user devices; rollback = ship a higher version. Server-side feature flags / remote config and API backward compatibility are the real safety net; OTA updates (Expo EAS Update, CodePush-style) must obey store policy about not changing app purpose and need runtime-version discipline.
- **Force-upgrade:** a minimum-supported-version check from remote config for security/API-breaking changes.
- **Approval gates:** submission, rollout changes and OTA publishes need explicit user approval.
