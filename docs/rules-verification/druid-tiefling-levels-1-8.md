# Iteration 2B rules verification

Only compact mechanics are recorded. `phb-2024-private` refers to the privately available 2024 _Player's Handbook_; its text is not distributed.

## Druid progression and spellcasting

| Rule ID              | Rule         | Mechanic                                                      | Source / section                  |  Page | Status   | Implementation                         | Tests                          | Notes                  |
| -------------------- | ------------ | ------------------------------------------------------------- | --------------------------------- | ----: | -------- | -------------------------------------- | ------------------------------ | ---------------------- |
| `druid`              | Druid 1–8    | d8 Hit Die; Wisdom spellcasting; saves, training, level table | phb-2024-private / Druid          | 80–86 | Verified | `src/domain/rules/registry.ts`         | `src/test/iteration2b.test.ts` | Single-class only      |
| `druid-spellcasting` | Spellcasting | Cantrips, prepared counts, and full-caster slots              | phb-2024-private / Druid Features | 80–81 | Verified | `src/domain/spells/prepared-spells.ts` | `src/test/iteration2b.test.ts` | Spell effects excluded |

### Verified Druid cantrip registry audit

The supported rules subset was audited without expanding it with unverified or 2014 rules. Thorn Whip was the missing verified entry; grant-only subclass and species cantrips remain outside the Druid class list.

| Internal ID     | Spell level | Class access | Source ID        | Status   | Implementation                 | Tests                              |
| --------------- | ----------: | ------------ | ---------------- | -------- | ------------------------------ | ---------------------------------- |
| `druidcraft`    |           0 | Druid        | phb-2024-private | Verified | `src/domain/rules/registry.ts` | `src/test/spell-selection.test.ts` |
| `guidance`      |           0 | Druid        | phb-2024-private | Verified | `src/domain/rules/registry.ts` | `src/test/spell-selection.test.ts` |
| `produce-flame` |           0 | Druid        | phb-2024-private | Verified | `src/domain/rules/registry.ts` | `src/test/spell-selection.test.ts` |
| `thorn-whip`    |           0 | Druid        | phb-2024-private | Verified | `src/domain/rules/registry.ts` | `src/test/spell-selection.test.ts` |

## Druid features

| Rule IDs                                                    | Mechanic                                     | Source                   | Status   | Implementation                 | Tests                          |
| ----------------------------------------------------------- | -------------------------------------------- | ------------------------ | -------- | ------------------------------ | ------------------------------ |
| `druid-druidic` through `druid-ability-score-improvement-8` | Features activate at their Druid table level | phb-2024-private / Druid | Verified | `src/domain/rules/registry.ts` | `src/test/iteration2b.test.ts` |

## Wild Shape

| Rule ID      | Mechanic                                                                               | Source / section              | Status   | Implementation                                              | Tests                          | Limitation              |
| ------------ | -------------------------------------------------------------------------------------- | ----------------------------- | -------- | ----------------------------------------------------------- | ------------------------------ | ----------------------- |
| `wild-shape` | Available at 2; 2 uses through 5, 3 through 8; one use on Short Rest, all on Long Rest | phb-2024-private / Wild Shape | Verified | `src/domain/resources/index.ts`, `src/domain/rest/index.ts` | `src/test/iteration2b.test.ts` | No forms or stat blocks |

## Circle of the Land and Circle spells

| Rule ID              | Mechanic                                                                         | Source / section                      | Status   | Implementation                 | Tests                          |
| -------------------- | -------------------------------------------------------------------------------- | ------------------------------------- | -------- | ------------------------------ | ------------------------------ |
| `circle-of-the-land` | Unlocks at Druid 3; Circle Spells, Land's Aid; Natural Recovery at 6             | phb-2024-private / Circle of the Land | Verified | `src/domain/rules/registry.ts` | `src/test/iteration2b.test.ts` |
| `land-arid-*`        | Fire Bolt, Burning Hands, Blur; Fireball at 5; Blight at 7                       | phb-2024-private / Circle Spells      | Verified | `src/domain/rules/registry.ts` | `src/test/iteration2b.test.ts` |
| `land-polar-*`       | Ray of Frost, Fog Cloud, Hold Person; Sleet Storm at 5; Ice Storm at 7           | same                                  | Verified | same                           | same                           |
| `land-temperate-*`   | Shocking Grasp, Sleep, Misty Step; Lightning Bolt at 5; Freedom of Movement at 7 | same                                  | Verified | same                           | same                           |
| `land-tropical-*`    | Acid Splash, Ray of Sickness, Web; Stinking Cloud at 5; Polymorph at 7           | same                                  | Verified | same                           | same                           |

## Tiefling and Chthonic Legacy

| Rule ID          | Mechanic                                                                           | Source / section                   | Status   | Implementation                                              | Tests                          |
| ---------------- | ---------------------------------------------------------------------------------- | ---------------------------------- | -------- | ----------------------------------------------------------- | ------------------------------ |
| `tiefling`       | Humanoid, Medium, Speed 30, Darkvision, Otherworldly Presence                      | phb-2024-private / Tiefling        | Verified | `src/domain/rules/registry.ts`                              | `src/test/iteration2b.test.ts` |
| `chthonic`       | Necrotic resistance; Chill Touch; False Life at 3; Ray of Enfeeblement at 5        | phb-2024-private / Fiendish Legacy | Verified | `src/domain/rules/registry.ts`                              | `src/test/iteration2b.test.ts` |
| `chthonic-*-use` | Each leveled spell has one free use, restored by Long Rest; slots can also cast it | same                               | Verified | `src/domain/resources/index.ts`, `src/domain/rest/index.ts` | `src/test/iteration2b.test.ts` |

## Farmer and Tough

| Rule ID  | Mechanic                                                                                | Source / section                | Status   | Implementation                             | Tests                          |
| -------- | --------------------------------------------------------------------------------------- | ------------------------------- | -------- | ------------------------------------------ | ------------------------------ |
| `farmer` | Strength/Constitution/Wisdom options; Animal Handling, Nature; Carpenter's Tools; Tough | phb-2024-private / Backgrounds  | Verified | `src/domain/rules/registry.ts`             | `src/test/iteration2b.test.ts` |
| `tough`  | Maximum HP increases by 2 per character level                                           | phb-2024-private / Origin Feats | Verified | `src/domain/character/computeCharacter.ts` | `src/test/domain.test.ts`      | Applied once through typed effect |

## Rest recovery

| Rule ID      | Mechanic                                                                           | Source / section                            | Status   | Implementation             | Tests                          | Limitation                                                            |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------- | -------- | -------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `short-rest` | Apply explicit resource recoveries only                                            | phb-2024-private / Short Rest               | Verified | `src/domain/rest/index.ts` | `src/test/iteration2b.test.ts` | Hit Dice spending deferred                                            |
| `long-rest`  | Restore HP, slots, eligible resources and species free uses; permit Land selection | phb-2024-private / Long Rest, Circle Spells | Verified | `src/domain/rest/index.ts` | `src/test/iteration2b.test.ts` | Hit Dice recovery not automated because session lacks individual dice |

## Druid level 9 extension (Iteration 3.6)

Verified 2024 progression: proficiency bonus +4; Wild Shape maximum 3; normal Druid cantrips 3; prepared class spells 14; spell slots 4/3/3/3/1; maximum spell level 5; no new base class feature. Magician's additional cantrip remains outside the normal allowance.

Circle of the Land's level-9 always-prepared grants are Arid — Wall of Stone, Polar — Cone of Cold, Temperate — Tree Stride, and Tropical — Insect Plague. These derived subclass grants do not count against prepared class spells.
