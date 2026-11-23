---
# Site-only page: edit it here. (The other Yapper pages are generated from the package's Documentation~ folder.)
title: Roadmap
description: What's planned for Yapper and the add-ons built to work with it.
---

Here's where Yapper is heading. Plans can change, and there are no dates yet. If something here matters to your project, or you'd like something that isn't listed, email [contact@kirranator.com](mailto:contact@kirranator.com).

Plans come in two kinds:

- **Yapper updates** are new features in Yapper itself. You get them in an update to the package you already own.
- **Add-ons** are separate products. Each works on its own, and plugs into Yapper's conversations when you have both.

## Yapper updates

### Relationships and reputation

*Planned*

Yapper will track how characters feel about the player, so it doesn't have to be built for each project:

- Relationship and reputation values for each NPC, saved with the rest of Yapper's state.
- Conditions and actions for the graph editor, such as "the bartender trusts you at least 3" or "+1 respect with the bouncer". Lines and choices can open up or close off as a relationship changes.
- A simple way to link Yapper to a relationship or faction system you already have, so you don't have to change it to fit.

Until then, the [relationships recipe](/yapper/integration/#recipe-relationships-and-the-npc-im-talking-to) shows how to connect your own system.

### Character attributes

*Planned*

Skill checks and inner monologue rely on character stats such as Perception, Empathy and Luck. Today you supply those from your own code. This update adds a stats system to Yapper that you can use out of the box:

- Attributes and traits you define, which skill checks roll against.
- Experience and a level-up tree, so stats can grow over the course of a game.
- Values that can come entirely from Yapper, partly from your existing character stats, or entirely from your own system, as now.

Until then, the [character stats recipe](/yapper/integration/#recipe-character-stats-and-skill-checks) shows how to connect your own stats.

## Add-ons

Add-on names are working titles.

### Gopher: quests

*Planned*

A quest system built to work with Yapper:

- Pick up and turn in quests through conversation, with nodes for giving, advancing and completing them.
- Tipsters: characters who point the player to quests and react to their progress.
- Objectives that track items picked up, delivered or turned in, using Hoarder or your own inventory.
- Quest conditions in the graph editor, so dialogue can respond to what the player has started, finished or failed.

Until then, the [quests recipe](/yapper/integration/#recipe-quests) shows how to connect your own quest system.

### Hoarder: items, inventory and trading

*Planned*

A modular item, inventory and trading system that fits into an existing project:

- Item definitions and inventories that you can adapt without restructuring your game.
- Quest item pickups and turn-ins. Picking up a quest item can start or advance a quest line in Gopher.
- Buying, selling and bartering with traders, including haggling over prices.
- Item conditions and actions for Yapper, such as "has 3 keys" or "give the letter", plus starting a trade from a conversation.

Until then, the [inventory recipe](/yapper/integration/#recipe-inventory) shows how to connect your own inventory, and the [hand-off recipe](/yapper/integration/#recipe-handing-off-to-a-shop-combat-or-cutscene) shows how to open your own shop from a conversation.
