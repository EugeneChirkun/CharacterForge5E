# Pre–Stage 4.0A stabilization: spell content, equipment, and currency

## Spell content

### Root cause and normalized model

The production registry constructor supplied every row with fabricated fallback casting parameters, a generic “primary effect,” template prose, and `full` completeness before overlaying the small set of verified rich records. Consequently an absent content field looked authoritative. `SpellDefinition` is now the single normalized content definition used by creation cards and Spellbook selectors. Casting time, range, duration, summary, and description are optional; the immutable definition retains structured components, attack/save, damage/healing, scaling, grants, and its `RuleSource`.

Presentation adapters use that definition. A compact card selects mechanics from the same adapter used for expanded creation details; Spellbook cards and the detail panel similarly receive one selector result. Missing casting parameters use the neutral `Not available in installed content` label. Missing prose is reported as unavailable rather than synthesized.

### Grants, rules sources, and description availability

Character access and bibliography are separate. `Granted by` uses resolved character grant labels (for example Druid, Circle of the Land, Chthonic Legacy, or Primal Order — Magician), while `Rules source` renders `PHB 2024` rather than an internal source ID. Description availability is explicitly `none`, `summary`, or `full`. Only records with actual authored prose are `full`; the UI does not claim full content merely because a field exists.

### Audit results and deferred content gaps

Verified rich bundled content remains available for `guidance`, `druidcraft`, `thorn-whip`, `produce-flame`, `call-lightning`, `cure-wounds`, `tree-stride`, `entangle`, `chill-touch`, and `goodberry`. All other supported registry rows are intentionally marked `none` until verified structured content is installed. In particular, `animal-friendship` and `shocking-grasp` are incomplete but truthful. Their missing fields are identified by `auditSpellContent`; no PHB mechanics were guessed in this patch. Adding those verified definitions is deferred content work, not Stage 4.0A work in this stabilization.

A production-data guard scans every spell definition for the confirmed placeholder markers and checks that `full` corresponds to actual prose.

## Equipment catalog

### Root cause and Druidic Focus status

The registry already models the verified quarterstaff as both a weapon and a spellcasting focus. The starting-shop UI filtered only on the item's primary `category`, so it discarded the quarterstaff for `spellcasting-focus`; the separate legacy `druidic-focus` compatibility record has no verified list price and is deliberately not purchasable. The result was an enabled, empty category.

`getEquipmentCatalogItems` is now the reusable immutable selector for registry, stable category ID, search, verification, and purchasability. It recognizes the quarterstaff's focus capability, applies search and category together, sorts deterministically, and is shared by both equipment React catalogs. The stable IDs remain `armor`, `shield`, `weapon`, `tool`, `adventuring-gear`, `container`, and `spellcasting-focus`.

Only categories with a purchasable production match appear in the starting-shop dropdown. A valid category with no result gets an announced empty message; search misses get a distinct search-and-category message. The general inventory catalog also renders an explicit empty state.

## Currency

### Root cause and denomination policy

`resolveStartingChoices` combined wallets by converting them to copper and calling a highest-denomination canonicalizer. That silently changed 50 GP to 5 PP. Cart totals and remaining change used the same PP-first routine.

Wallet addition is now field-by-field, preserving each grant denomination. Copper remains the exact integer comparison unit. Change derived from item prices is represented GP-first, then SP and CP, and never promotes GP to PP. Thus 50 GP and two 50 GP grants display as 50 GP and 100 GP. Existing mixed wallets retain their CP/SP/EP/GP/PP fields when combined; platinum is displayed only when explicitly present in the wallet.

## Tests and verification

Tests cover forbidden spell placeholders, truthful availability, neutral Animal Friendship and Shocking Grasp output, rich Thorn Whip mechanics, rules-source labeling, every production equipment category, focus capability plus search, selector immutability, 50/100 GP behavior, mixed denominations, and exact remaining funds. Existing creation, cart, package, proficiency, AC, persistence, and inventory tests provide regression coverage.

Manual scenarios were exercised through the same selectors and rendered component paths. Browser visual verification is deferred because no supplied screenshot asset was present in the repository; the patch does not redesign layout.
