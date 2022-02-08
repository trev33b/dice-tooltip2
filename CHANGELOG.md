# 2.2.0
* Now render both normal & versatile damage in one tooltip
* Verified compatibility with FoundryVTT 9

Bug Fixes:
* Fixed ability save rendering.  It had been displaying "d20 - NaN"
* Updated module.json to include Portuguese locale listing.  Not sure if using that locale was broken before, but this should help
* Fixed corner case for constant folding where you could end up with a "+ 0" in the expression. It's now properly removed
* Remove damage types injected in the middle of formulas using "[type]" notation.  We add a label at the end of the roll, so it doesn't need to be in the middle.

# 2.1.1
* Minor fixes
* Updated README to convey recent improvements
* Added pictures to the README

# 2.1.0
* Simplified dice expression display using redundant operator removal and constant folding
* Implemented ability to show tooltips on Tidy5e favorites
* (internal) fixed spelling errors within the source code

# 2.0.1

* Removed "2" from all titling to keep original "dice-tooltip" package name.
* Renamed module: dice-tooltip2 -> dice-tooltip as part of that

# 2.0.0

* Forked from https://github.com/SteffanPoulsen/dice-tooltip to https://github.com/trev33b/dice-tooltip2
* Renamed module: dice-tooltip -> dice-tooltip2
* Fixed compatibility with Foundry 0.8 & Tidy5eSheets
* Improved the tooltip presentation (tightened padding, inverted coloring to match other tooltips, add transparency)
* Fixed dice formula presentation to not show extra +'s
* Changed Short Rest tooltip to show remaining hit dice that can be used
* Removed unnecessary special handling for Tidy5e (Player & NPC) and Sky's Alt 5e sheets 
* Lots of code cleanup (warnings & patterns) and wrapped with WebStorm project
* Added localization support and provided translations for English

# 1.0.8

* Added support for "Tidy5e Sheet" NPCs (https://github.com/sdenec/tidy5e-sheet)

# 1.0.7

* Added support for "Tidy5e Sheet" (https://github.com/sdenec/tidy5e-sheet)
* Fixed an issue where supported sheet modules would have doubled events (performance improvement)

# 1.0.6

* Redid the hit-dice tooltip code, now works for multi-classing as well. 

# 1.0.5

* Fixed an issue when having multiple character/npc sheets open at the same time.

# 1.0.4

* Fixed a breaking bug that caused the tooltip to malfunction on various overlays
* The code is now less rigid in regard to how actor sheets handle their id structuring.

# 1.0.3

* Now works with "PopOut!"

# 1.0.2

* Now works with "Sky's Alternate 5th Edition Dungeons & Dragons Sheet"

# 1.0.1

* Added compatibility for FoundryVTT 0.6.0
* Added compatibility for D&D5E System 0.91

# 1.0.0

* Released to FoundryVTT
