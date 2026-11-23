---
# Generated from Yapper's Documentation~/API.md by scripts/sync-yapper-docs.mjs. Edit the original, not this copy.
title: "API reference"
---

Everything is in the `Yapper` namespace (`Yapper.Runtime` assembly). Editor types are in `Yapper.Authoring` (`Yapper.Editor`).

## DecisionManager *(component)*
Owns a `DecisionRunner`, routes it to presenters, and exposes saving.

| Member | |
|---|---|
| `static DecisionManager Main` | The first enabled manager (a convenience). |
| `DecisionRunner Runner` | The runner: events, `Context`, current graph and node. |
| `DecisionState State` | Variables, visited, completed, checks. |
| `DecisionServices Services` | Register game objects for `context.Get<T>()`. |
| `bool IsRunning` | A decision is in progress. |
| `bool StartDecision(graph, params object[] participants)` | Starts a graph. False if it isn't available (Availability or Repeat). |
| `DecisionGraph StartFirstAvailable(graphs, params object[] participants)` | Starts the highest-priority available graph and returns it, or null. |
| `bool IsAvailable(graph, params object[] participants)` | Would it start? |
| `bool Continue()` / `bool Choose(int index)` / `void Stop()` | Drive the decision (presenters call these). |
| `string SaveToJson()` / `void LoadFromJson(string)` | Save and load the state. |
| `RegisterPresenter` / `UnregisterPresenter` | Presenters are also found automatically. |

Inspector: **Register Child Components**, **Find Presenters In Scene**, **Log Events**.

## DecisionRunner
The engine. Usable without the manager: `new DecisionRunner(state, services)`.

| Member | |
|---|---|
| `Start(graph, participants…)`, `StartAt(graph, node, participants…)` | `StartAt` starts at a specific node (debugging, "resume"). |
| `Continue()`, `Choose(index)`, `Stop()` | |
| `CurrentGraph`, `CurrentNode`, `Status`, `IsRunning`, `CurrentLine`, `CurrentChoices` | |
| `State`, `Services`, `Context`, `Random` | `Random` can be replaced with a seeded `System.Random`. |
| **Events:** `Started`, `NodeEntered`, `LineShown`, `ChoicesShown`, `ChoiceMade`, `CheckResolved`, `GraphChanged`, `Ended(graph, EndReason)`, `ActionRun(action, ran)` | See [Reacting to the conversation](/yapper/integration/#reacting-to-the-conversation). |
| **Testing hooks:** `ConditionOverride`, `StatOverride`, `CheckOverride`, `ActionFilter`, `IgnoreAvailability` | Force results in tests and tools. The Simulate tab uses these. |

`EndReason`: `Completed`, `Stopped`, `NoAvailableChoices`, `Error`.

## DecisionContext
Passed to every condition, action and stat source.

| Member | |
|---|---|
| `T Get<T>()` | A participant of type T, else a registered service. |
| `Participants` | The objects passed to Start. |
| `Variables`, `State`, `Services`, `Runner`, `Graph`, `Node`, `Random` | |

## DecisionState
| Member | |
|---|---|
| `Variables` | `VariableStore`: `Get(key, fallback)`, `TryGet`, `Set`, `Has`, `Remove`, `Clear`, `All`, event `Changed(key, value)`. |
| `IsVisited(graph, id)`, `MarkVisited`, `IsCompleted(graph)`, `MarkCompleted` | |
| `GetCheck`, `SetCheck`, `ClearCheck` | Skill check memory (e.g. let the player retry after a level-up). |
| `Capture()` / `Restore(snapshot)`, `ToJson()` / `FromJson(json)`, `Clear()` | See [Saving](/yapper/saving/). |

`DecisionValue`: a bool, int, float or string, with implicit conversions (`state.Variables.Set("gold", 10)`), plus `AsBool`, `AsInt`, `AsFloat`, `AsString`, `Compare`, `Add`.

## Assets
| Type | |
|---|---|
| `DecisionGraph` | `Title`, `Presentation` (`DecisionGraph.Dialogue`, `.Contemplation`, or any string), `DefaultSpeaker`, `Priority`, `Repeat`, `Availability`, `Nodes`, `EntryNode`, `GetNode(id)`. |
| `Speaker` | `DisplayName`, `Color`, `Portrait`, `IsPlayer`. |
| `DecisionSignal` | `Raise(args, context)`, event `Raised`. |
| Nodes | `LineNode`, `ChoiceNode` (`DecisionChoice`), `BranchNode`, `RandomNode`, `SkillCheckNode`, `ActionNode`, `JumpNode`, `EndNode`. All derive from `DecisionNode` (`Id`, `OnEnter`, `OnExit`, `Notes`). |

## Extension points
| Type | Implement |
|---|---|
| `Condition` | `protected bool Evaluate(DecisionContext)`, optional `Describe()` |
| `DecisionAction` | `void Execute(DecisionContext)`, optional `Describe()` |
| `StatSource` | `float GetValue(DecisionContext)`, optional `DisplayName` |
| `IDecisionPresenter` | `CanPresent`, `Begin`, `ShowLine`, `ShowChoices`, `End` |
| `IConditionProvider` | `bool TryEvaluate(key, args, context, out bool result)` for External Condition |
| `IActionHandler` | `bool TryExecute(key, args, context)` for External Action |

## Views (what presenters receive)
- `LineView`: `Speaker`, `Text`, `IsRevisit`, `LeadsToChoices`, `LeadsToEnd`, `Node`, `Graph`.
- `ChoiceView`: `Index`, `Text`, `Speaker`, `IsAvailable`, `LockedReason`, `WasChosenBefore`, `Check` (`CheckPreview`), `LeadsToEnd`, `Choice`.
- `CheckPreview`: `StatName`, `StatValue`, `Modifier`, `Difficulty`, `DifficultyLabel`, `Chance`, `Mode`, `Retry`, `PreviousResult`, `CanAttempt`, `BlockedReason`.
- `CheckResult`: `Success`, `Critical`, `Dice`, `Total`, `StatValue`, `Modifier`, `AppliedModifiers`, `Difficulty`, `Chance`, `Remembered`.

## Utilities
- `SkillChecks.Preview(node, context)`, `SkillChecks.Resolve(node, context)`, `SkillChecks.RollChance(dice, sides, bonus, difficulty, criticals)`.
- `RuntimePanels.Shared`, `RuntimePanels.UpdateShared()`, `RuntimePanels.SharedMinimumScale`: the shared UI Toolkit panel for code-built UI.
- Editor: `Yapper.Authoring.DecisionGraphEditorUtility` (`CreateGraphAsset`, `CreateNode`, `Connect`, `SetEntry`, `DeleteNode`, `Repair`) builds graphs from editor scripts or importers, with Undo support.
