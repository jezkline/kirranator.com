---
# Generated from Yapper's Documentation~/Troubleshooting.md by scripts/sync-yapper-docs.mjs. Edit the original, not this copy.
title: "Troubleshooting"
---

**Turn on Log Events** on the Decision Manager first. It logs every start, line, choice, jump and end to the Console.

### Nothing appears when I start a graph
- **Console: "No presenter accepts 'X'."** Add a **Decision Debug Presenter**, or check your presenter's `CanPresent` against the graph's **Presentation**. A presenter with **Presentation Tags** set only shows those tags.
- **`StartDecision` returned false.** The graph isn't available: an **Availability** condition failed, or it's **Repeat: Once** and already completed. Try it in the editor's **Simulate** tab, which starts it anyway and tells you why it wouldn't normally.
- **The reference is empty.** A graph field on your component, or a list entry, is None.

### A choice is missing
- Its **conditions** fail and **When Locked** is *Hide*. Switch to *Show Disabled* to see the reason on the choice.
- It's **Once Per Conversation** or **Once Ever** and was already picked.
- It leads into a **Skill Check** that can't be retried yet (**When Stat Improves** or **Never**).

### My condition is always false, or my action does nothing
- `context.Get<T>()` returns null. Pass the object as a **participant** (`StartDecision(graph, npc)`) or **register** it (`DecisionManager.Main.Services.Register(player)`). See [Reaching your game objects](/yapper/integration/#reaching-your-game-objects).
- **External Condition / External Action:** "No IConditionProvider handled key 'X'" means no registered provider returned `true` from `TryEvaluate` for that key. Check the spelling, and that the provider is registered.
- **In the Simulate tab,** game conditions are assumed true or false and game actions are skipped unless you change the **Options**.

### My condition or action type isn't in the dropdown
It needs `[Serializable]`, a parameterless constructor, and to not be abstract or generic. Check the Console for compile errors.

### Graphs show "missing type" errors after renaming a class
Graphs store the class and namespace names of conditions and actions. Rename it back, or add `[UnityEngine.Scripting.APIUpdating.MovedFrom(true, "Old.Namespace", "OldAssembly", "OldName")]` to the renamed class. Then run **Tools > Yapper > Validate All Graphs**.

### Progress isn't saved
- Call `SaveToJson()` / `LoadFromJson()` from your save system; see [Saving](/yapper/saving/).
- Graphs made in code at runtime can't be saved (their ID changes every session). Use graph assets.
- Did you **duplicate** a graph? The copy has its own identity and no progress.

### The debug presenter is tiny in the Game view
Raise **Minimum Scale** on the Decision Debug Presenter (default 0.8), or assign your own **Panel Settings**.

### Clicks don't work at all
Yapper's UI Toolkit panels don't need an Event System (tested on 2022.3 and Unity 6). If buttons still don't respond, check that nothing else covers the screen, such as a full-screen uGUI image or another UI Toolkit panel with a higher sort order. If your project mixes uGUI and UI Toolkit, add **GameObject > UI > Event System** so both receive input; Unity sets up the right input module for your project.

### The graph editor looks wrong after a merge or manual file edit
Press **Repair** in the graph editor toolbar. It re-attaches node sub-assets and removes broken entries.

### Something else
Run **Tools > Yapper > Validate All Graphs** and check the **Issues** tab of the graph in question. Most authoring mistakes show up there.
