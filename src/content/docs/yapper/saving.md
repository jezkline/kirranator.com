---
# Generated from Yapper's Documentation~/Saving.md by scripts/sync-yapper-docs.mjs. Edit the original, not this copy.
title: "Saving and state"
---

Yapper remembers four things in a `DecisionState`:

- **variables**
- **visited** lines and choices
- **completed** graphs
- **skill-check results**

It never writes to assets at runtime, so all of it has to be saved by your game. The state is small (IDs and values), and it serializes to a string.

## The short version

```csharp
// Saving
string yapperJson = DecisionManager.Main.SaveToJson();
mySaveData.dialogue = yapperJson;

// Loading: before any conversation starts
DecisionManager.Main.LoadFromJson(mySaveData.dialogue);
```

`LoadFromJson(null)` or `LoadFromJson("")` clears the state, which is what a new game needs.

## Fitting into your save system

**JSON string fields.** Most save systems can store a string. Store the JSON as-is, as above.

**Inside your own Unity-serialized data.** Use the snapshot object instead of a string. `DecisionState.Snapshot` is a `[Serializable]` class built for Unity serialization: `JsonUtility`, a `[SerializeField]` field on a ScriptableObject, and so on. **For other serializers (Newtonsoft, MessagePack, binary), store the JSON string from `SaveToJson()`.** The snapshot's values use private Unity-serialized fields that those serializers don't see.

```csharp
DecisionState.Snapshot snapshot = DecisionManager.Main.State.Capture();
// … serialize however you like …
DecisionManager.Main.State.Restore(snapshot);
```

**Component-based save systems** (each saveable component returns its own data). Put a small component next to the Decision Manager:

```csharp
// Example for a system that stores a JToken per component (Newtonsoft).
public class SaveableDialogue : MonoBehaviour, ISaveable
{
    DecisionManager manager;
    void Awake() => manager = GetComponent<DecisionManager>();

    public JToken CaptureState() => JToken.Parse(manager.SaveToJson());
    public void RestoreState(JToken state) => manager.LoadFromJson(state?.ToString(Formatting.None));
}
```

**PlayerPrefs** (prototypes only):
```csharp
PlayerPrefs.SetString("dialogue", DecisionManager.Main.SaveToJson());
DecisionManager.Main.LoadFromJson(PlayerPrefs.GetString("dialogue", ""));
```

## Things to know

- **Load before starting conversations.** A conversation in progress isn't saved, only what it has changed so far. Save between conversations, or accept that loading restarts the current one.
- **IDs are stable.** Graphs are identified by their asset GUID and nodes by an internal ID, so renaming or moving graph assets keeps their progress. **Duplicating** a graph gives the copy a new identity with no progress.
- **Graphs created in code at runtime** (like the Basic Demo's) get a random ID each session, so their progress can't be saved. Use assets for anything that should be remembered.
- **Variables are global.** Prefix keys to avoid clashes, e.g. `guard.metPlayer` or `tutorial.done`.
- **Game data stays in your systems.** Inventory, quests and reputation should be saved by your game; Yapper only needs to remember dialogue-specific things. See [Integration › quests](/yapper/integration/#recipe-quests).
- **Resetting:** `DecisionManager.Main.State.Clear()` forgets everything, for a new game or a debug reset.
- **Watching changes:** `State.Variables.Changed += (key, value) => …` fires on every variable change. Use it for auto-save triggers or debugging.
