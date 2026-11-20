# Mobile UI engineering principles

- **Platform conventions beat custom patterns:** system back, share sheets, pickers, permission prompts, haptics used sparingly.
- **Touch:** targets at least about 44-48 pt/dp with spacing; no hover-only affordances; gestures need visible alternatives.
- **Safe areas and insets:** notches, home indicators, keyboards (avoid covering inputs), system bars, foldable hinges.
- **Adaptive layout:** support small phones to tablets and landscape if the app allows rotation; use size classes/breakpoints, not device names.
- **Text:** support dynamic type / font scale up to large settings without clipping; no fixed-height text containers; localize strings, RTL, plural rules, date/number formats.
- **Theming:** light/dark from tokens; contrast meets WCAG guidance; do not rely on color alone.
- **States:** loading skeletons or spinners with timeouts, empty states with action, inline validation, error messages that say what to do, offline banner.
- **Perceived performance:** optimistic updates for safe actions, image placeholders and cached sizes, avoid layout jumps.
- **Motion:** purposeful, short, respects reduce-motion settings.
- **Forms:** correct keyboard types, autofill hints, one-handed reach for primary actions.
- Accessibility and performance review checklists live in the quality skill when it exists; until then follow the framework skill's accessibility reference.
