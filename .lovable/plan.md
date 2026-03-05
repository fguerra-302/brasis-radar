

## Analysis & Strategic Review

### Understanding from the Brasis Credentials PDF

Brasis operates **3 distinct content products** (newsletters/communities), each with its own audience, editorial focus, and sources:

1. **Radar Brasis** -- Culture, behavior, Brazilian trends for brands. The "core" curation product.
2. **Clube da Gloria** -- Women 35+, wellness, entertainment, Brazilian female perspective. 92K followers, 400K views/month.
3. **VIEWS** -- Creator economy newsletter. Curating the influencer market for creators, brands, agencies. 1500 subscribers in 6 editions.

Additionally: **Gigantes de Nazare** (extreme sports entertainment platform, 2.1M followers).

### Bug: Delete count not updating

**Root cause**: `useRadarBrasis` has `.limit(100)` on the query (line 23). The stats in `useRadarBrasisStats` are computed from this limited dataset. When items are deleted via `handleBulkDelete`, `refetch()` is called but the stats recalculate from whatever 100 items come back -- the total appears unchanged because new items fill the slots of deleted ones, or the cache isn't properly invalidated.

Additionally, `handleBulkDelete` calls `refetch()` but doesn't `invalidateQueries`, so the React Query cache may serve stale data.

**Fix**: Remove the `.limit(100)` (or increase significantly), and use `queryClient.invalidateQueries` instead of just `refetch()` after bulk delete.

### Missing: Pre-configured groups for Brasis products

Currently, groups are fully manual. The system should ship with the 3 core Brasis product groups pre-created.

---

## Plan

### 1. Fix bulk delete not updating stats

- In `RadarMain.tsx` `handleBulkDelete`: replace `refetch()` with `queryClient.invalidateQueries({ queryKey: ['radar-brasis'] })` to force fresh data
- Same fix for `handleDeleteItem`
- In `useRadarBrasis`: remove `.limit(100)` -- it silently hides data and makes stats inaccurate

### 2. Auto-create the 3 Brasis product groups

- Create a new hook `useInitializeDefaultGroups.ts` that checks if the user has any content groups, and if not, seeds:
  - **Radar Brasis** -- "Cultura, comportamento e tendencias brasileiras para marcas"
  - **Clube da Gloria** -- "Consumo feminino 35+, bem-estar, entretenimento e vivencia brasileira"
  - **VIEWS** -- "Creator economy, influenciadores, marcas e plataformas"
- Call this hook in `RadarMain.tsx` alongside the existing `useInitializeDefaultSources` and `useInitializeDefaultKeywords`

### 3. Add group filter to the Radar view

- Add a group selector dropdown in `ContentFilters.tsx` so users can filter the radar by product/newsletter group
- Wire `group_id` through the query chain: `useRadarBrasis` already has `group_id` in the DB schema but doesn't query or filter by it
- When assigning items (approving), allow selecting which group the item belongs to

### Files to modify
- `src/hooks/useRadarBrasis.ts` -- remove limit(100), use invalidateQueries
- `src/components/radar/RadarMain.tsx` -- fix delete handlers, add group initialization
- `src/hooks/useInitializeDefaultGroups.ts` -- new file, auto-seed 3 groups
- `src/components/content/ContentFilters.tsx` -- add group filter dropdown

