

## Diagnosis

After reviewing the codebase, I found two distinct problems:

### Problem 1: Web Scraping (sites sem RSS) is disconnected from automation
- The `WebScrapingManager` component stores sources **only in local React state** (not persisted to the database)
- The `radar-automation` edge function **only processes `type: 'RSS'`** sources, ignoring WEB sources entirely
- The `web-scraper` edge function exists and works, but is only triggered manually per-source

### Problem 2: Newsletter search is fundamentally broken
- The `newsletter-search` edge function asks OpenAI to **fabricate fake newsletter data** (the system prompt literally says "crie newsletters plausíveis baseadas no termo de busca")
- It then validates results against the user's active NEWSLETTER sources by name/domain match
- Since AI-generated links/sources never match real configured sources, **all items are skipped** as "Fonte não permitida"
- Result: 0 newsletters collected every time

---

## Plan

### Fix 1: Integrate Web Scraping into the automation pipeline

**1a. Persist WEB sources to `radar_sources` table**
- Modify `WebScrapingManager` to save/load sources from `radar_sources` with `type: 'WEB'` instead of local state
- Add editoria to the source config JSON field

**1b. Extend `radar-automation` to process WEB sources**
- After processing RSS sources, query for `type: 'WEB'` active sources
- For each WEB source, call the `web-scraper` logic inline (extract HTML, analyze relevance, save items)
- This makes web scraping automatic alongside RSS collection

### Fix 2: Rebuild newsletter search to actually work

**2a. Replace fake OpenAI generation with real web search via Firecrawl**
- The project already has a `FIRECRAWL_API_KEY` configured
- Rewrite `newsletter-search` to use Firecrawl's search API to find real newsletter content
- Search query: user's search terms + "newsletter brasil"
- This returns real URLs, real titles, real content

**2b. Remove the broken source-matching filter**
- Currently blocks everything because AI-generated sources never match
- Instead, save all Firecrawl results directly (they are real web content)
- Keep tombstone and duplicate checks

**2c. Improve result processing**
- Use Firecrawl search results (real URLs, titles, descriptions)
- Use the AI gateway (already available) for relevance scoring instead of content generation
- Save with status "Coletado" to enter the normal curation flow

### Technical details

**Files to modify:**
- `src/components/sources/WebScrapingManager.tsx` -- persist to `radar_sources` with `type: 'WEB'`
- `supabase/functions/radar-automation/index.ts` -- add WEB source processing after RSS
- `supabase/functions/newsletter-search/index.ts` -- rewrite to use Firecrawl search API
- `src/components/sources/NewsletterSearchManager.tsx` -- minor: remove misleading "uses OpenAI" text

**No database changes needed** -- `radar_sources` already supports arbitrary `type` values and `config` JSON.

