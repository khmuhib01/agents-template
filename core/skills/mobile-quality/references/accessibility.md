# Mobile accessibility

Target the accessibility guidance the project or organization names (commonly WCAG-aligned); check the current version of the standard rather than quoting criteria from memory.
- **Screen readers:** every interactive or informative element has an accessible name, role and state; decorative images are hidden; group related elements; announce dynamic changes (errors, loading, toasts) appropriately; reading and focus order follow the visual order.
- **Touch targets:** at least about 44x44 pt (iOS) / 48x48 dp (Android) with adequate spacing; no gesture-only actions without an accessible alternative.
- **Text:** supports system font scaling to large sizes without clipping or overlap; no fixed-height text containers; line length reasonable; localized text expands.
- **Contrast and color:** text/icon contrast meets the target ratio in light and dark themes; information is never conveyed by color alone; focus indicators visible.
- **Motion and time:** respect reduce-motion; no auto-advancing content without controls; adequate time limits.
- **Input:** correct keyboard types, labels (not placeholders only), error messages tied to fields, autofill support; support external keyboards and switch control where feasible.
- **Orientation and layout:** do not lock orientation without reason; support display zoom and large screens.
- **Manual audit:** (1) turn on TalkBack/VoiceOver and complete the main flows eyes-closed; (2) max font scale; (3) high contrast/dark mode; (4) reduce motion; (5) external keyboard navigation. Use the platform inspectors (Accessibility Scanner, Accessibility Inspector) and framework semantics tools as supplements.
- **Regression:** add semantic assertions to UI tests (labels present, roles correct) and lint rules where available.
- Automated tools find only a fraction of issues; state clearly what was manually verified.
