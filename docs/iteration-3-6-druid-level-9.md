# Iteration 3.6 — Druid level 9

## Scope and verified progression

This iteration installs Druid level 9 only. The verified progression is proficiency bonus +4, three normal Druid cantrips, fourteen prepared class spells, three Wild Shape uses, slots 4/3/3/3/1, and maximum spell level 5. Level 9 grants no new base Druid feature.

Circle of the Land adds one always-prepared level-9 grant for the active land: Arid — Wall of Stone; Polar — Cone of Cold; Temperate — Tree Stride; Tropical — Insect Plague. Circle and species grants remain derived, source-labelled, and excluded from the class preparation allowance.

## Creation and level-up

The target-level-driven builder accepts levels 1–9 and continues to require all choices from earlier levels. The generic one-level transition accepts 8→9, requires the fixed Druid HP advancement, and derives Constitution and Tough contributions through the existing HP engine. It rejects skipped, repeated, and level-10 transitions.

Level-up is not a Long Rest. Current and temporary HP, conditions, concentration, active character state, Wild Shape expenditure, and existing spell-slot expenditure are preserved. Because slot state stores expenditure, the increased level-4 capacity and new level-5 capacity begin unspent automatically.

## Spellcasting and persistence

The registry now contains verified structured level-5 Druid spell metadata. Generic availability, grouping, filtering, preparation, spellbook, summary, and calculation selectors consume the new progression row without level-specific UI calculations. Level-9 records use the existing persisted shape and schema version; no migration is necessary, and levels 1–8 load unchanged.

## Verification and deferrals

Automated coverage checks progression, proficiency-derived spell statistics, HP, spell access, Circle grants, creation, level-up/session preservation, spellbook behavior, and persistence compatibility. Manual verification follows the level-up, Long Rest land-change, refresh, import/export, and direct-creation paths.

Level 10, Nature's Ward, a fourth normal cantrip, level-6 spells and slots, multiclassing, other classes/subclasses, and spell-effect automation remain deferred.
