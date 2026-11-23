---
# Generated from Yapper's Documentation~/Yapper.md by scripts/sync-yapper-docs.mjs. Edit the original, not this copy.
title: "Yapper"
head:
  - tag: title
    content: "Yapper | Documentation"
---

Yapper is a branching dialogue and inner-monologue system for Unity. You write conversations as node graphs in an editor window. Your game decides who speaks, what the player can choose, and what happens as a result, using small C# classes that Yapper discovers automatically.

- **One graph type for every kind of decision.** Conversations, inner voices, barks, terminals and signs are all graphs. A *presentation* tag (Dialogue, Contemplation or your own) decides which UI shows a graph.
- **Typed conditions and actions.** "Has 5 gold", "quest is active", "give item" and so on are plain C# classes. They appear in the editor's type picker, with their own fields, the moment you write them.
- **Skill checks** against your game's stats, with dice, modifiers, retry rules and a success-chance preview on the choice.
- **Built-in memory:** variables, visited lines and choices, completed graphs and check results. All of it saves through your existing save system.
- **Your UI, or ours.** Implement `IDecisionPresenter` on your own UI, or start with the built-in UI Toolkit presenter, which needs no assets.

Requires **Unity 2022.3** or newer. No third-party dependencies.

---

## Contents

| Page | Read it when |
|---|---|
| [Getting started](#getting-started) | You want to see something working in five minutes. |
| [Adding Yapper to an existing project](#adding-yapper-to-an-existing-project) | Your game already has an inventory, quests, stats, saves and UI. |
| [Graph editor](/yapper/graph-editor/) | You're writing conversations. |
| [Nodes and graph settings](/yapper/nodes/) | You want to know what each node and option does. |
| [Conditions, actions and stats](/yapper/conditions-and-actions/) | You want the built-in list, or to write your own. |
| [Connecting your game](/yapper/integration/) | You want conversations to read and change your game's systems. **Start here for integration.** |
| [Custom UI (presenters)](/yapper/presenters/) | You're replacing the debug presenter with your own UI. |
| [Saving and state](/yapper/saving/) | You're hooking Yapper into your save system. |
| [API reference](/yapper/api/) | You want the classes, events and methods at a glance. |
| [Troubleshooting](/yapper/troubleshooting/) | Something doesn't start, show or save. |

---

## Getting started

### 1. Try a sample
Open **Window > Package Manager**, select **Yapper**, open the **Samples** tab and import one of these:

- **Warehouse Demo.** Talk your way past a warehouse bouncer: a conversation with a skill check, a bribe and a coin-toss bet, an inner monologue, a signal that opens the door, and a signal that shows when the bouncer is talking. It's built from primitives, so it needs nothing else. Its `WarehouseDemoIntegration.cs` is a complete, short example of connecting your own game.
- **Warehouse Demo (Synty Art).** Optional. The same demo with free Asset Store art and an animated bouncer. Requires the Warehouse Demo sample and the art packages listed in its README.
- **Basic Demo.** Builds two graphs in code and plays them. Use it to see the runtime API without the editor.

Open the sample's scene and press Play.

### 2. Make a graph
1. **Assets > Create > Yapper > Decision Graph.** Double-click the asset to open the graph editor.
2. Press **Space** on the canvas to add nodes. Start with a **Line** (someone says something), then a **Choice** (the player answers).
3. Drag from a node's output port (right) to another node's input (left) to connect them.
4. Create **Speakers** (**Assets > Create > Yapper > Speaker**) for the people and inner voices in your game, and assign them to lines and choices.

### 3. Play it
1. Add a GameObject with **Decision Manager** and **Decision Debug Presenter** (**Add Component > Yapper**).
2. Start the graph from any script:

```csharp
using Yapper;
using UnityEngine;

public class TalkOnStart : MonoBehaviour
{
    [SerializeField] DecisionGraph conversation;

    void Start() => DecisionManager.Main.StartDecision(conversation);
}
```

The debug presenter shows lines and choices, the variables they change, and the odds on skill checks.

### 4. Test without playing
In the graph editor, open **Simulate** in the sidebar. You can play through the graph, make your game's conditions and skill checks pass or fail, and see every action it would run, all without entering Play mode.

---

## Adding Yapper to an existing project

Yapper is built to drop into a project that's already in development:

- **Everything is isolated.** All code is in the `Yapper` namespace and its own assemblies (`Yapper.Runtime`, `Yapper.Editor`). It adds no global types, no tags or layers, and changes no project settings.
- **No input or render-pipeline assumptions.** The debug presenter uses UI Toolkit with a panel created at runtime. It works with the Input System or the Input Manager, in the Built-in Render Pipeline, URP and HDRP.
- **No singletons are required.** `DecisionManager.Main` is a convenience. You can hold a reference to your own `DecisionManager`, or use `DecisionRunner` directly with no MonoBehaviour at all.
- **Your systems stay yours.** Yapper never reaches into your code. *You* write small adapter classes (a condition, an action, a stat source) that call your systems, and Yapper calls those.

A typical integration, in order:

1. **One Decision Manager** in a persistent scene or prefab, alongside your other managers.
2. **Register your player and services** so conditions and actions can find them. See [Integration › Reaching your game objects](/yapper/integration/#reaching-your-game-objects).
3. **Write adapters** for the systems your writers need: inventory, quests, relationships, stats. See [Integration](/yapper/integration/). Each one is about 15 lines.
4. **Start conversations from your interaction system.** For example, your NPC's "Talk" interaction calls `StartDecision(graph, this)`. See [Integration › Starting conversations](/yapper/integration/#starting-conversations).
5. **Save and load** `DecisionManager.SaveToJson()` / `LoadFromJson()` with the rest of your game. See [Saving](/yapper/saving/).
6. **Replace the UI** when you're ready, by implementing `IDecisionPresenter` on your dialogue panel. See [Presenters](/yapper/presenters/). Keep the debug presenter around for testing; presenters can coexist.

---

## Support

Questions, bug reports and feature requests:

- Email: [contact@kirranator.com](mailto:contact@kirranator.com)
- Website: [kirranator.com](https://kirranator.com)

When reporting a bug, please include your Unity version, the Yapper version (**Window > Package Manager**), any Console errors and, if you can, the graph asset involved. Check [Troubleshooting](/yapper/troubleshooting/) first; most problems are covered there.
