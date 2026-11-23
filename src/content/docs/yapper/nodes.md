---
# Generated from Yapper's Documentation~/Nodes.md by scripts/sync-yapper-docs.mjs. Edit the original, not this copy.
title: "Nodes and graph settings"
---

- [Graph settings](#graph-settings)
- [Speakers](#speakers)
- [Line](#line) · [Choice](#choice) · [Branch](#branch) · [Random](#random) · [Skill Check](#skill-check) · [Action](#action) · [Jump](#jump) · [End](#end)
- [On Enter / On Exit](#on-enter--on-exit)
- [What Yapper remembers](#what-yapper-remembers)

---

## Graph settings
Select the graph asset, or click empty canvas with the sidebar's Inspector tab open:

| Setting | Meaning |
|---|---|
| **Title** | Display name (the asset name if empty). |
| **Presentation** | Which UI shows this graph. Built in: **Dialogue** (a conversation, bottom bar in the debug presenter) and **Contemplation** (inner monologue, side column). Any other string works too, e.g. `Bark`, `Terminal`, `Letter`, and presenters choose what they show with `CanPresent`. |
| **Default Speaker** | Used by Line nodes with no speaker. Usually the NPC this conversation belongs to, which also makes it easy to [match graphs to NPCs](/yapper/integration/#starting-conversations). |
| **Priority** | When starting "the first available" of several graphs, the highest priority wins. |
| **Repeat** | **Always**, or **Once**: unavailable after it has been completed once. Good for first meetings. |
| **Availability** | Conditions that must all pass for the graph to start. |

## Speakers
A **Speaker** asset (**Assets > Create > Yapper > Speaker**) is anyone with a voice: the player, an NPC, a narrator, or an inner voice like *Logic* or *Empathy*. It has a display name, a colour, an optional portrait, and an **Is Player** flag.

Lines use a speaker. Choices normally belong to the player, but a single choice can have its own speaker. An *Empathy* option appears in Empathy's name and colour, which is how inner voices offer choices in a conversation.

---

## Line
Someone says something. The player continues to the next node.

| Field | |
|---|---|
| Speaker | Who's talking. Empty uses the graph's Default Speaker. |
| Text | What they say. |
| Revisit Text | Optional. Shown instead of Text when the player has already seen this line, e.g. *"You again."* |

If the next node is a Choice, presenters can show the line and the choices together (`LineView.LeadsToChoices`).

## Choice
The player picks one option. Each option has its own port.

| Option field | |
|---|---|
| Text | What the player says or thinks. |
| Revisit Text | Shown instead once this option has been picked before, e.g. *"Tell me again who you are."* |
| Speaker | Optional: the voice offering this option (inner voices). |
| Conditions | All must pass for the option to be available. |
| When Locked | **Hide** the option, or **Show Disabled**: visible but greyed, with the reason (e.g. *"Has 10 gold"*). Showing locked options tells players that more is possible. |
| Repeat | **Always**; **Once Per Conversation** (hidden after picking until the decision restarts); **Once Ever** (gone for good and saved, which suits explored thoughts and one-time questions). |
| On Chosen | Actions that run when it's picked. |

If no option is available, the decision ends with `EndReason.NoAvailableChoices`. The Issues tab warns when that's possible.

**An option that leads straight into a Skill Check** shows the check's odds (e.g. *"[Persuasion 58%]"*). It's locked automatically if the check can't be retried yet.

## Branch
An invisible fork. **Cases** are tested top to bottom; the first case whose conditions all pass is taken, otherwise **Default**. Give cases labels; they become the port names.

Typical uses: "if the quest is done, say thanks; otherwise ask about it", and "first time here?".

## Random
Picks one option at random by **weight**. Options can have conditions; failing ones are left out. If none are left, the decision ends. Use it for idle chatter variety, coin flips and gambling.

## Skill Check
Tests a stat against a difficulty and continues through **Success** or **Failure**.

| Field | |
|---|---|
| Stat | Where the number comes from: a decision **Variable Stat**, or your own `StatSource` (see [Integration](/yapper/integration/#recipe-character-stats-and-skill-checks)). |
| Difficulty, Difficulty Label | The target number, and an optional label shown to players ("Challenging"). |
| Mode | **Roll**: dice + stat + modifiers ≥ difficulty. **Passive**: stat + modifiers ≥ difficulty, with no randomness. |
| Dice Count, Dice Sides | e.g. 2d6. |
| Criticals | All dice at maximum always succeeds; all ones always fails. |
| Retry | **Always**: roll fresh each time. **When Stat Improves**: after a failure, locked until the total (stat + modifiers) is higher than last time, a "white" check; successes are remembered. **Never**: one attempt, result remembered, a "red" check. |
| Modifiers | Situational bonuses or penalties: a label, an amount, and conditions (*"+2 Read his mood"*). Players see the applied ones. |

Success chance is calculated exactly from the dice (shown on choices, and available as `CheckPreview.Chance`). Results are reported through `DecisionRunner.CheckResolved` for UI and effects.

## Action
Runs its **On Enter** actions and continues. Use it to group effects (open the gate, set a flag, give a reward) at one point that several paths lead to.

## Jump
Continues somewhere else, in this graph or another.

| Field | |
|---|---|
| Target Graph | Empty = this graph. |
| Target Node | Empty = the target graph's entry. |
| Complete Current Graph | Marks the graph you're leaving as completed. Turn it off when jumping into a side conversation that will jump back. |

Jumping into a graph with a different **Presentation** switches UI: the presenter ends and the right one begins (e.g. dialogue to inner monologue and back). Participants stay available.

## End
Ends the decision. **Mark Completed** (on by default) records the graph as completed, for the **Graph Completed** condition and **Repeat: Once**.

You only need End nodes when you want that control or an explicit ending. **Any unconnected port also ends the decision**, and counts as completed.

---

## On Enter / On Exit
Every node has **On Enter** and **On Exit** action lists, under *Node actions* in the node's Details. They're good for effects tied to a line being shown, e.g. a relationship change when the NPC says something cutting.

## What Yapper remembers
Yapper keeps this in `DecisionState`, which is saved with your game (see [Saving](/yapper/saving/)):

- **Variables:** any key → bool, int, float or string. Set them with **Set Variable**, test them with **Compare Variable**, and use them as stats with **Variable Stat**.
- **Visited:** every line and choice seen or picked. This drives revisit text, **Once Ever** choices and the **Node Visited** condition.
- **Completed graphs:** for **Graph Completed** and **Repeat: Once**.
- **Check results:** for **When Stat Improves** and **Never** retries.

Everything is keyed by stable IDs (graph asset GUIDs plus node IDs), so renaming or moving assets is safe. **Duplicating** a graph creates a new graph with its own memory.
