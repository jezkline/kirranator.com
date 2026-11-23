---
# Generated from Yapper's Documentation~/Integration.md by scripts/sync-yapper-docs.mjs. Edit the original, not this copy.
title: "Connecting your game"
---

This page shows how to make conversations read and change your game: inventory, quests, stats, relationships, shops, cutscenes. Everything here is ordinary C#. Yapper never needs to know about your classes; you write small adapters that do.

> The examples come from a real RPG integration. Swap `PlayerInventory`, `QuestLog` and so on for your own types.

- [How it fits together](#how-it-fits-together)
- [Reaching your game objects](#reaching-your-game-objects)
- [Recipe: inventory](#recipe-inventory)
- [Recipe: character stats and skill checks](#recipe-character-stats-and-skill-checks)
- [Recipe: relationships, and "the NPC I'm talking to"](#recipe-relationships-and-the-npc-im-talking-to)
- [Recipe: quests](#recipe-quests)
- [Recipe: handing off to a shop, combat or cutscene](#recipe-handing-off-to-a-shop-combat-or-cutscene)
- [Scene reactions without code: signals](#scene-reactions-without-code-signals)
- [Key-based hooks (ExternalCondition / ExternalAction)](#key-based-hooks)
- [Starting conversations](#starting-conversations)
- [Reacting to the conversation: camera, animation, audio, input](#reacting-to-the-conversation)
- [Rules and tips for adapter classes](#rules-and-tips-for-adapter-classes)

---

## How it fits together

```
 Graph asset (authored)                 Your adapter (C#)                 Your game
 ───────────────────────                ──────────────────                ─────────
 Choice: "Buy the lantern"   ──uses──▶  HasItem : Condition        ──▶  PlayerInventory.Count(...)
   condition: Has 10 Gold               SpendGold : DecisionAction ──▶  PlayerInventory.Remove(...)
   on chosen: Spend 10 Gold
 Skill Check: Persuasion vs 9 ──uses─▶  CharacterStat : StatSource ──▶  CharacterStats.Get(...)
```

There are three extension points. All three are `[Serializable]` C# classes with a parameterless constructor:

| Base class | Used for | You implement |
|---|---|---|
| `Condition` | Choice requirements, branch cases, graph availability, check modifiers | `protected override bool Evaluate(DecisionContext context)` |
| `DecisionAction` | On Enter / On Exit of any node, On Chosen of a choice | `public override void Execute(DecisionContext context)` |
| `StatSource` | Skill Check nodes and the Stat condition | `public override float GetValue(DecisionContext context)` |

Put them anywhere in your project. Yapper finds every subclass with Unity's `TypeCache` and lists it in the graph editor's type picker, grouped by namespace. Public fields (or `[SerializeField]` fields) become the fields writers fill in.

---

## Reaching your game objects

Graphs are assets, so they can't hold references to scene objects. Conditions and actions reach the game at run time through the **`DecisionContext`** they're given. `context.Get<T>()` looks in two places, in order:

1. **Participants:** the objects you pass when starting a decision. Use these for things that change from conversation to conversation, like *the NPC being spoken to*.
   ```csharp
   DecisionManager.Main.StartDecision(graph, this /* the NPC */, player);
   ```
   Participants stay available for the whole decision, including after a Jump into another graph.

2. **Services:** objects registered once with the manager. Use these for things that are always there: the player, the quest log, the save system.
   ```csharp
   void Start() => DecisionManager.Main.Services.Register(player);
   ```
   Components on the Decision Manager's GameObject (or its children) that implement `IConditionProvider`, `IActionHandler` or `IDecisionPresenter` are registered automatically.

```csharp
protected override bool Evaluate(DecisionContext context)
{
    var player = context.Get<PlayerController>();   // participant or service
    var npc    = context.Get<NpcController>();      // null if none was passed
    ...
}
```

Singletons work too (`QuestLog.Instance`). Participants and services are just a way to avoid needing them.

**Tip:** wrap your lookups in extension methods, so every adapter reads the same way:

```csharp
public static class MyDecisionContext
{
    public static PlayerController GetPlayer(this DecisionContext c) =>
        c.Get<PlayerController>() ?? Object.FindAnyObjectByType<PlayerController>();

    /// The NPC this conversation was started with (passed as a participant).
    public static NpcController GetNpc(this DecisionContext c) => c.Get<NpcController>();
}
```

---

## Recipe: inventory

```csharp
using System;
using UnityEngine;
using Yapper;

[Serializable]
public class HasItem : Condition
{
    public ItemDefinition item;          // your item asset type
    [Min(1)] public int quantity = 1;

    protected override bool Evaluate(DecisionContext context)
    {
        var inventory = context.GetPlayer()?.Inventory;
        return item != null && inventory != null && inventory.Count(item) >= quantity;
    }

    // Shown in the graph editor next to the choice. Make it read like a sentence.
    public override string Describe() => quantity > 1 ? $"Has {quantity}x {item?.name}" : $"Has {item?.name}";
}

[Serializable]
public class GiveItem : DecisionAction
{
    public ItemDefinition item;
    [Min(1)] public int quantity = 1;

    public override void Execute(DecisionContext context) =>
        context.GetPlayer()?.Inventory.Add(item, quantity);

    public override string Describe() => $"Give {quantity}x {item?.name}";
}
```

Writers now see **Has Item** and **Give Item** in the pickers, with an item field and a quantity.

Every condition has an **Invert** toggle, so you don't need a separate "Doesn't Have Item".

---

## Recipe: character stats and skill checks

A `StatSource` turns any number in your game into something a **Skill Check** node or **Stat** condition can test. Offering a choice of *whose* stat makes one class cover the player, the NPC and specific characters:

```csharp
public enum StatTarget { Player, Conversant, Specific }

[Serializable]
public class CharacterStat : StatSource
{
    public StatType stat = StatType.Charisma;    // your enum
    public StatTarget target = StatTarget.Player;
    [Tooltip("Used when Target is Specific.")]
    public CharacterDefinition character;
    [Tooltip("Shown to players on checks. Defaults to the stat name.")]
    public string displayName;

    public override float GetValue(DecisionContext context)
    {
        var c = target switch
        {
            StatTarget.Player     => context.GetPlayer()?.Character,
            StatTarget.Conversant => context.GetNpc()?.Character,
            _                     => character,
        };
        return c != null ? c.GetStat(stat) : 0f;
    }

    public override string DisplayName => string.IsNullOrEmpty(displayName) ? stat.ToString() : displayName;
}
```

`DisplayName` is what players see on the choice, e.g. *"[Charisma 72%] Talk him down."*

Without any code, the built-in **Variable Stat** reads a decision variable instead. It's useful for prototyping, or for stats that only exist in dialogue.

**Situational bonuses** (+2 for wearing the uniform, −1 when injured) are **modifiers** on the Skill Check node: each one is a label, an amount and conditions. They use the same conditions you've already written. See [Nodes › Skill Check](/yapper/nodes/#skill-check).

---

## Recipe: relationships, and "the NPC I'm talking to"

A useful convention: **leave the character field empty to mean "the NPC this conversation is with."** One graph or condition then works for any NPC.

```csharp
[Serializable]
public class RelationshipAtLeast : Condition
{
    [Tooltip("Leave empty to use the NPC being spoken to.")]
    public CharacterDefinition character;
    public float points = 3f;

    protected override bool Evaluate(DecisionContext context)
    {
        var who = character != null ? character : context.GetNpc()?.Character;
        return who != null && Relationships.Instance.GetPoints(who) >= points;
    }

    public override string Describe() => $"{(character ? character.name : "Conversant")} relationship ≥ {points}";
}

[Serializable]
public class ChangeRelationship : DecisionAction
{
    [Range(-1f, 1f)] public float amount = 0.1f;
    public bool playReaction = true;

    public override void Execute(DecisionContext context)
    {
        var npc = context.GetNpc();
        if (npc == null) { Debug.LogWarning("ChangeRelationship needs the NPC as a participant."); return; }
        Relationships.Instance.Add(npc.Character, amount);
        if (playReaction) npc.PlayReaction(amount);   // nod, frown, ...
    }

    public override string Describe() => $"Relationship {amount:+0.##;-0.##}";
}
```

---

## Recipe: quests

Dialogue is usually where quests start, progress and end. Write a few conditions and actions against your quest system:

```csharp
[Serializable]
public class QuestStatusIs : Condition
{
    [Tooltip("Leave empty to use the quest of the NPC being spoken to.")]
    public QuestDefinition quest;
    public QuestState state = QuestState.Active;

    protected override bool Evaluate(DecisionContext context)
    {
        var q = quest != null ? quest : context.GetNpc()?.QuestGiver?.Quest;
        return q != null && QuestLog.Instance.GetState(q) == state;
    }

    public override string Describe() => $"{(quest ? quest.name : "NPC's quest")} is {state}";
}

[Serializable]
public class StartQuest : DecisionAction
{
    public QuestDefinition quest;
    public override void Execute(DecisionContext context) => QuestLog.Instance.Start(quest);
    public override string Describe() => $"Start {quest?.name}";
}

[Serializable]
public class CompleteObjective : DecisionAction
{
    public QuestDefinition quest;
    public string objectiveId;     // or a custom drawer that lists the quest's objectives
    public override void Execute(DecisionContext context) => QuestLog.Instance.CompleteObjective(quest, objectiveId);
}
```

Typical graph shape for a quest giver:

```
Branch ─┬─ [Quest is Available] ─▶ "I need help…" ─▶ Choice: Accept (Start Quest) / Decline
        ├─ [Quest is Active]    ─▶ Branch ─┬─ [Has the items] ─▶ "You found them!" (Complete Objective)
        │                                  └─ default         ─▶ "Any luck?"
        └─ default              ─▶ "Thanks again."
```

**Keep quest progress in your quest system, not in Yapper variables.** Variables suit dialogue-only memory, like "asked about the war" or "insulted the guard". Quests, inventory and reputation belong to the systems that already save them.

**If your quest system re-checks prerequisites on events** rather than every frame, refresh it when a conversation ends:

```csharp
DecisionManager.Main.Runner.Ended += (graph, reason) => QuestLog.Instance.RequestRefresh();
```

---

## Recipe: handing off to a shop, combat or cutscene

Some choices end the conversation and open something else. Do it in an action, then stop the decision so your dialogue UI closes:

```csharp
[Serializable]
public class OpenShop : DecisionAction
{
    public override void Execute(DecisionContext context)
    {
        var shop = context.GetNpc()?.Shop;
        if (shop == null) return;
        context.Runner.Stop();                   // close the conversation first
        ShopUI.Instance.Open(shop, context.GetPlayer());
    }

    public override string Describe() => "Open shop";
}
```

`Stop()` ends the decision with `EndReason.Stopped`. If your interaction system uses `Runner.Ended` to "finish talking" (unfreeze the player, restore the camera), check the reason, or set a flag before stopping, so the shop keeps control:

```csharp
bool handingOff;
public void HandOff() { handingOff = true; DecisionManager.Main.Stop(); }

void OnEnded(DecisionGraph graph, EndReason reason)
{
    if (handingOff) { handingOff = false; return; }   // the shop will finish the interaction
    player.EndInteraction();
}
```

---

## Scene reactions without code: signals

When a choice should make *something in the scene* happen (a door opens, music changes, a light turns on), you often don't need a custom action:

1. **Assets > Create > Yapper > Signal** (e.g. `Open Door`).
2. In the graph, add a **Raise Signal** action and pick the signal. You can also pass optional text, a number, an on/off flag or an object.
3. On the scene object, add **Decision Signal Listener**, assign the signal, and hook **On Raised** to any method in the Inspector (e.g. `WarehouseDoor.Open`).

The listener's other events pass the signal's arguments to your method: **On Raised Text** (string), **On Raised Number** (float), **On Raised Flag** (bool) and **On Raised Target** (object). In the method dropdown, pick the method from the **Dynamic** section so it receives the value.

One signal can switch something on and off. In the Warehouse Demo, the bouncer's lines raise **Bouncer Talk** in **On Enter** with **Flag** ticked, and in **On Exit** with it unticked. One listener's **On Raised Flag** calls `TalkIndicator.Talk(bool)` in the primitives scene, or `BouncerAnimationController.Talk(bool)` in the Synty Art scene, which sets an Animator parameter. Your own character scripts work the same way.

From code, subscribe to `signal.Raised += (signal, args, context) => …`.

The Warehouse Demo opens the warehouse door this way.

---

## Key-based hooks

**ExternalCondition** and **ExternalAction** are built in. They take a string key plus optional text, number and object, and ask *your* code to answer:

```csharp
public class GameHooks : MonoBehaviour, IConditionProvider, IActionHandler
{
    public bool TryEvaluate(string key, ExternalArgs args, DecisionContext context, out bool result)
    {
        switch (key)
        {
            case "IsNight": result = TimeOfDay.Instance.IsNight; return true;
            case "HasFlag": result = SaveData.Flags.Contains(args.text); return true;
        }
        result = false;
        return false;   // not my key: let another provider try
    }

    public bool TryExecute(string key, ExternalArgs args, DecisionContext context)
    {
        switch (key)
        {
            case "PlaySound": AudioManager.Play(args.text); return true;
            case "SetFlag":   SaveData.Flags.Add(args.text); return true;
        }
        return false;
    }
}
```

Put the component on the Decision Manager's GameObject (it registers itself), or call `Services.Register(hooks)`.

**Prefer typed classes** (the recipes above) for anything used often. They get proper fields, validation and readable summaries, and a typo can't silently break them. Keys are handy for prototyping, one-off hooks, or bridging to a scripting language. An unhandled key logs a warning once and evaluates as **false** (conditions) or does nothing (actions), so nothing passes by accident.

---

## Starting conversations

### From an NPC
Give each NPC a list of graphs, and let Yapper pick the highest-**Priority** one whose **Availability** conditions pass:

```csharp
public class Talkable : MonoBehaviour
{
    [SerializeField] List<DecisionGraph> conversations;

    public void Interact()   // called by your interaction system
    {
        var started = DecisionManager.Main.StartFirstAvailable(conversations, GetComponent<NpcController>());
        if (started == null) Debug.Log($"{name} has nothing to say right now.");
    }
}
```

Use graph **Availability** and **Repeat: Once** for "first meeting", "after the quest" and similar variants. For example, the intro conversation is `Repeat: Once` with priority 10, and the generic chat has priority 0.

**Matching graphs to NPCs automatically.** Instead of assigning lists, you can keep one list of all graphs and match each graph's **Default Speaker** to the NPC (by name or by an ID on your character asset).

### From an object (inner monologue)
Inspecting a statue, a letter or a corpse can start a **Contemplation** graph. Start it the same way, with no participants:
```csharp
DecisionManager.Main.StartDecision(thought);
```

### Checking before offering "Talk"
```csharp
bool hasSomethingToSay = conversations.Any(g => DecisionManager.Main.IsAvailable(g, npc));
```

---

## Reacting to the conversation

`DecisionManager.Main.Runner` raises events you can hook into for everything around the dialogue:

| Event | Typical use |
|---|---|
| `Started(graph)` | Freeze player movement, switch the camera, unlock the cursor. |
| `Ended(graph, reason)` | Undo the above. Finish the interaction. Refresh systems that depend on dialogue. |
| `LineShown(line)` | Voice-over: look up a clip by `line.Node.Id` or `line.Node.name`. Talk animations on `line.Speaker`. |
| `ChoiceMade(choice)` | Analytics, achievements ("chose the peaceful option"). |
| `CheckResolved(result)` | Dice animation, sound, a "[Persuasion: Success]" banner. |
| `NodeEntered(node)` | Camera cuts per node, debug tools, quest "talked to X" objectives. |
| `GraphChanged(from, to)` | A Jump moved into another graph (e.g. into an inner monologue). |
| `ActionRun(action, ran)` | Logging, simulation tools. |

```csharp
void OnEnable()
{
    var runner = DecisionManager.Main.Runner;
    runner.Started += _ => { playerInput.enabled = false; Cursor.lockState = CursorLockMode.None; };
    runner.Ended   += (_, __) => { playerInput.enabled = true; Cursor.lockState = CursorLockMode.Locked; };
}
```

The built-in debug presenter already unlocks the cursor while it's open (**Unlock Cursor While Open**).

---

## Rules and tips for adapter classes

- **`[Serializable]` and a parameterless constructor** are required, or the class won't appear in the picker.
- **Use fields for configuration only.** One instance lives in the graph asset and is shared by every run and every NPC. Keep runtime state in your systems or in decision variables, not in fields of the condition.
- **Fail closed.** If something's missing (no player, no NPC), return `false` from conditions and do nothing in actions, ideally with a warning. Never throw.
- **Override `Describe()`.** The graph editor, Simulate tab and Issues tab show it ("Has 3x Iron Ore"), and the debug presenter uses it for locked choices.
- **Use `[Tooltip]` and `[Min]`/`[Range]`** on fields. They show in the editor.
- **Namespaces group the picker.** Types outside `Yapper` appear under their namespace (e.g. `MyGame.Dialogue/Has Item`), so related adapters sit together.
- **Renaming a class or namespace breaks saved graphs.** Graph assets store type names. Add `[UnityEngine.Scripting.APIUpdating.MovedFrom(true, "Old.Namespace", "OldAssembly", "OldClassName")]` before renaming, or rename before writing much content.
- **Keep adapters in one folder or assembly** (e.g. `Scripts/Dialogue/Adapters`). If you use an `.asmdef`, reference `Yapper.Runtime`.
- **Test without playing.** The graph editor's **Simulate** tab plays a graph in edit mode against a sandbox state. Your game's conditions can be evaluated for real or assumed true or false, and game stats use a value you choose. Your actions are logged but skipped unless you turn on **Run game code**. That answers "what does the guard say if the quest is done?" without setting it up in the game. See [Graph editor › Simulate](/yapper/graph-editor/#simulate).
