# Sources

Official documentation this skill's guidance should be checked against. Rows are added only after the URL was fetched and the version noted. Pages marked "no version shown" print no date or version, so the Verified date is the fetch date, not a revision date. Anything under "Not yet verified" is still unverified against current docs; read the official docs for the installed version.

| Source | Publisher | URL | Version | Verified |
|---|---|---|---|---|
| How to move a site | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes | no version shown | 2026-11-21 |
| Change of Address tool | Google (Search Console Help) | https://support.google.com/webmasters/answer/9370220 | no version shown | 2026-11-21 |

## Checked against the fetched pages
- Site move page describes changing URLs (HTTP to HTTPS, domain, path) while limiting search impact: consistent with `migration.md` scope.
- Change of Address tool: for moving a site from one domain or subdomain to another, used after the move and redirects are in place; needs ownership of both domain-level properties; it is not for HTTP to HTTPS or www to non-www moves within a domain; redirects should stay at least 180 days (longer while traffic still arrives) and Google suggests keeping the old domain for a year. `migration.md` names no specific conditions and `SKILL.md` tells the agent to verify them, so nothing needed correcting; these facts can be cited when a domain move is planned.

## Not yet verified
- Search Console API documentation was not fetched.
