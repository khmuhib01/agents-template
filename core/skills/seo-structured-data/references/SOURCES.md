# Sources

Official documentation this skill's guidance should be checked against. Rows are added only after the URL was fetched and the version noted. Pages marked "no version shown" print no date or version, so the Verified date is the fetch date, not a revision date. Anything under "Not yet verified" is still unverified against current docs; read the official docs for the installed version.

| Source | Publisher | URL | Version | Verified |
|---|---|---|---|---|
| Introduction to structured data markup in Google Search | Google Search Central | https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data | no version shown | 2026-11-21 |
| General structured data guidelines | Google Search Central | https://developers.google.com/search/docs/appearance/structured-data/sd-policies | no version shown | 2026-11-21 |
| Getting started with schema.org using Microdata | schema.org | https://schema.org/docs/gs.html | schema.org V30.1 (2026-09-16), page labelled development version | 2026-11-21 |

## Checked against the fetched pages
- Google recommends JSON-LD; Microdata and RDFa are also supported (intro page): matches `json-ld-basics.md`.
- Markup must represent visible content and does not guarantee a rich result (policies page): matches SKILL.md.

## Not yet verified
- Per-type rich result requirements (supported features gallery) were not fetched.
- Search Console rich result reports help was not fetched.
- The schema.org page fetched is labelled a development version; the stable version number was read from `schema.org/version/latest` (V30.1, 2026-09-16).
