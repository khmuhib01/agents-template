# Programmatic and template landing pages

Programmatic pages (city pages, comparison pages, integration directories, product-attribute pages) can serve real needs, but pages created mainly to match query variations risk being classed as low-quality, doorway or scaled content under search engine spam policies (verify current wording). Do not promise traffic.
- **Decide with data first:** confirm demand and distinct intent per page type (query data, site search); estimate how many pages truly offer unique value.
- **Quality gate per page [Practice]:** unique, useful data or functionality for that entity (real inventory, prices, reviews, local facts, tools), not only a swapped keyword in boilerplate; minimum content/data thresholds before a page is indexable; pages failing the gate are `noindex` (and not in sitemaps) or not generated.
- **Template design:** unique title/H1/intro from entity data, structured sections fed by real fields, internal links between related entities and from hubs, breadcrumbs, canonical self-reference, JSON-LD where applicable, human-written editorial elements for key pages.
- **Duplicate and near-duplicate control:** similarity checks across pages; merge entities that produce the same page; canonical or redirect duplicates.
- **Crawl and indexing control:** sitemaps by segment, pagination and hub structure so every page is reachable via links, rate of publishing staged (batches), watch Search Console indexing and crawl stats; stop or noindex a segment when quality or indexing signals deteriorate.
- **Freshness and maintenance:** data pipelines with update dates, removal of dead entities (404/410 or redirect), no stale prices or listings.
- **Technical:** server-rendered or prerendered, fast, Core Web Vitals OK, no infinite URL spaces (calendar, combinations).
- **Governance:** log template changes, require review before launching a new page type, keep an experiment plan (small cohort first), measure impressions, indexed rate, clicks and conversions per cohort against a baseline.
- **Ethics and policy:** no cloaking, no hidden text, no auto-generated gibberish, disclose AI assistance where required by policy or law, and ensure factual accuracy through validation against the data source.
- **Testing:** unit tests for generators (uniqueness, required fields, URL format), crawl tests of samples, regression checks (`seo-migration-monitoring`).
