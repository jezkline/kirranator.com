---
# Generated from Yapper's Documentation~/ConditionsAndActions.md by scripts/sync-yapper-docs.mjs. Edit the original, not this copy.
title: "Conditions, actions and stats"
---

Conditions, actions and stat sources are small C# classes stored inside graphs (as `[SerializeReference]`). In the editor you pick a type from a dropdown, then fill in its fields. Yapper ships with the ones below; your game adds its own (see [Writing your own](#writing-your-own)).

## Built-in conditions
| Condition | Passes when |
|---|---|
| **Compare Variable** | A decision variable compares to a value (`gold >= 10`, `metGuard == true`). **Fallback** is used when the variable has never been set. |
| **Node Visited** | A line or node has been seen. Pick the node from a list; leave **Graph** empty for this graph. |
| **Graph Completed** | A graph has been completed (End node or unconnected port). Empty = this graph. |
| **Stat** | A stat (any `StatSource`) plus modifiers compares to a value. A passive threshold that never rolls: *"Strength ≥ 5"*. |
| **Chance** | Random, with the given probability. |
| **Condition Group** | **All** or **Any** of its inner conditions pass. Nest groups for complex logic. |
| **External Condition** | Your code answers a string key (see [key-based hooks](/yapper/integration/#key-based-hooks)). |

**Every condition has Invert.** "NOT has item", or "NOT visited", is the same condition with Invert ticked. A list of conditions passes only if **all** pass; use a Condition Group (Any) for "or".

## Built-in actions
| Action | Does |
|---|---|
| **Set Variable** | Sets a variable, or **Add**s to it (`gold += -10`, `visits += 1`). |
| **Raise Signal** | Raises a `DecisionSignal` asset, with optional text, number and object. Scene objects react through **Decision Signal Listener** UnityEvents, no code needed. See [Signals](/yapper/integration/#scene-reactions-without-code-signals). |
| **External Action** | Your code handles a string key. |
| **Log Message** | Writes to the Console. Handy while prototyping. |

## Built-in stat source
| Stat source | Reads |
|---|---|
| **Variable Stat** | A decision variable (e.g. `logic`). Works with no code. |

Add your own to read character stats, levels, reputation, and so on; see [Integration › stats](/yapper/integration/#recipe-character-stats-and-skill-checks).

---

## Writing your own

### A condition
```csharp
using System;
using UnityEngine;
using Yapper;

[Serializable]                                   // required
public class IsNight : Condition                  // parameterless constructor: required (the default is fine)
{
    [Tooltip("Hour the night starts.")]
    [Range(0, 23)] public int fromHour = 20;      // fields = what writers fill in

    protected override bool Evaluate(DecisionContext context) =>
        TimeOfDay.Instance != null && TimeOfDay.Instance.Hour >= fromHour;

    public override string Describe() => $"After {fromHour}:00";   // shown in the editor and on locked choices
}
```

### An action
```csharp
[Serializable]
public class PlaySound : DecisionAction
{
    public AudioClip clip;
    [Range(0f, 1f)] public float volume = 1f;

    public override void Execute(DecisionContext context)
    {
        if (clip != null) AudioSource.PlayClipAtPoint(clip, Camera.main.transform.position, volume);
    }

    public override string Describe() => clip ? $"Play {clip.name}" : "Play (no clip)";
}
```

### A stat source
```csharp
[Serializable]
public class PlayerLevel : StatSource
{
    public override float GetValue(DecisionContext context) => context.Get<PlayerStats>()?.Level ?? 0;
    public override string DisplayName => "Level";
}
```

That's all. Save the script and the new type appears in the dropdowns, grouped under its namespace.

### What's in the context
| Member | |
|---|---|
| `context.Get<T>()` | A participant passed to `StartDecision`, or a registered service. See [Reaching your game objects](/yapper/integration/#reaching-your-game-objects). |
| `context.Variables` | Decision variables: `Get`, `Set`, `TryGet`, `Has`, `Remove`. |
| `context.State` | Everything remembered: variables, visited, completed graphs, check results. |
| `context.Graph`, `context.Node` | The graph and node currently running. |
| `context.Runner` | The `DecisionRunner`: `Stop()`, events and so on. |
| `context.Random` | The runner's random generator. Use it instead of `UnityEngine.Random` so tests can seed it. |
| `context.Participants` | Everything passed to `StartDecision`. |

### Rules
- **No runtime state in fields.** One instance lives in the graph asset and is shared by every run. Store state in your game or in decision variables.
- **Fail closed.** Return `false` or do nothing when something's missing, with a warning if it helps. Don't throw.
- **Renaming a class or namespace breaks graphs that use it** (they store type names). Before renaming, add `[UnityEngine.Scripting.APIUpdating.MovedFrom(true, "Old.Namespace", "OldAssembly", "OldClassName")]`. Missing types show as errors in **Validate All Graphs**.
- **Object fields can reference assets** (items, quests, audio, signals), but **not scene objects**. Reach scene objects through the context, or use a signal.
- **Custom drawers work.** A `PropertyDrawer` for your field types, or a `[NodeId("graphField")]` string for a node picker, shows up in the graph editor too.
