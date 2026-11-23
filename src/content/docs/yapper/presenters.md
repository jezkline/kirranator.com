---
# Generated from Yapper's Documentation~/Presenters.md by scripts/sync-yapper-docs.mjs. Edit the original, not this copy.
title: "Custom UI (presenters)"
---

A **presenter** is whatever shows a decision to the player. Yapper includes the **Decision Debug Presenter**, a complete UI Toolkit interface that needs no assets. For your game's own look, implement `IDecisionPresenter` on your dialogue UI. It's five methods.

## How a decision flows

```
StartDecision(graph)
  └▶ presenter.Begin(runner, graph)          open your panel
       ├▶ presenter.ShowLine(line)           show text; when the player clicks: runner.Continue()
       ├▶ presenter.ShowChoices(choices)     show buttons; on click: runner.Choose(choice.Index)
       │   … repeats …
  └▶ presenter.End(reason)                   close your panel
```

The runner waits for you. Nothing advances until you call `Continue()` or `Choose()`, so typewriter effects, animations and voice-over can take as long as they like.

## A minimal uGUI presenter

```csharp
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using Yapper;

public class MyDialogueUI : MonoBehaviour, IDecisionPresenter
{
    [SerializeField] GameObject panel;
    [SerializeField] TMP_Text speakerName, lineText;
    [SerializeField] Button continueButton;
    [SerializeField] Transform choiceContainer;
    [SerializeField] Button choicePrefab;

    DecisionRunner runner;

    void Awake()
    {
        continueButton.onClick.AddListener(() => runner?.Continue());
        panel.SetActive(false);
    }

    void OnEnable()  => DecisionManager.Main?.RegisterPresenter(this);
    void OnDisable() => DecisionManager.Main?.UnregisterPresenter(this);

    // Which graphs this UI handles. Let another presenter take inner monologues, barks, ...
    public bool CanPresent(DecisionGraph graph) => graph.Presentation == DecisionGraph.Dialogue;

    public void Begin(DecisionRunner decisionRunner, DecisionGraph graph)
    {
        runner = decisionRunner;
        panel.SetActive(true);
    }

    public void ShowLine(LineView line)
    {
        ClearChoices();
        speakerName.text = line.Speaker ? line.Speaker.DisplayName : "";
        speakerName.color = line.Speaker ? line.Speaker.Color : Color.white;
        lineText.text = line.Text;

        // Show the options under the line straight away instead of waiting for "Continue".
        if (line.LeadsToChoices) { continueButton.gameObject.SetActive(false); runner.Continue(); return; }

        continueButton.gameObject.SetActive(true);
        continueButton.GetComponentInChildren<TMP_Text>().text = line.LeadsToEnd ? "Leave" : "Continue";
    }

    public void ShowChoices(IReadOnlyList<ChoiceView> choices)
    {
        ClearChoices();
        continueButton.gameObject.SetActive(false);
        foreach (var choice in choices)
        {
            var button = Instantiate(choicePrefab, choiceContainer);
            string label = choice.Text;
            if (choice.Check != null) label = $"[{choice.Check}] {label}";               // "[Persuasion 58%]"
            if (!choice.IsAvailable && !string.IsNullOrEmpty(choice.LockedReason))
                label += $"  <i>({choice.LockedReason})</i>";                           // "(Has 10 gold)"
            button.GetComponentInChildren<TMP_Text>().text = label;
            button.interactable = choice.IsAvailable;
            int index = choice.Index;
            button.onClick.AddListener(() => runner.Choose(index));
        }
    }

    public void End(EndReason reason)
    {
        ClearChoices();
        panel.SetActive(false);
        runner = null;
    }

    void ClearChoices()
    {
        foreach (Transform child in choiceContainer) Destroy(child.gameObject);
    }
}
```

Registering is optional. If no registered presenter accepts a graph, the Decision Manager searches the scene for an enabled one (**Find Presenters In Scene**). Presenters on the manager's own GameObject or its children are registered automatically.

## What you get to display

**`LineView`** (`ShowLine`)
| Member | |
|---|---|
| `Speaker` | Name, colour, portrait, is-player. Already falls back to the graph's default speaker. |
| `Text` | Already switched to the revisit text when applicable. |
| `IsRevisit` | The player has seen this line before (dim it, or speed up the typewriter). |
| `LeadsToChoices` / `LeadsToEnd` | For "Continue" vs "Leave", or showing choices with the line. |
| `Node`, `Graph` | For voice-over lookups, camera cuts and so on. |

**`ChoiceView`** (`ShowChoices`)
| Member | |
|---|---|
| `Index` | Pass this to `Choose`. |
| `Text`, `Speaker` | Speaker is set for inner-voice options. Show it as "[Empathy] …". |
| `IsAvailable`, `LockedReason` | Locked options are only included when the graph says **Show Disabled**. |
| `WasChosenBefore` | Grey out questions already asked. |
| `Check` | A `CheckPreview` when the option leads into a skill check: `StatName`, `Chance`, `Difficulty`, `DifficultyLabel`, `PreviousResult`, `CanAttempt`. `ToString()` gives a ready-made label. |
| `LeadsToEnd` | e.g. add an exit icon. |

## Skill check results
Checks resolve between your calls. Listen to the runner to show the roll:

```csharp
public void Begin(DecisionRunner decisionRunner, DecisionGraph graph)
{
    runner = decisionRunner;
    runner.CheckResolved += OnCheck;
    ...
}

void OnCheck(CheckResult r) =>
    ShowBanner($"{r.StatName}: {(r.Success ? "Success" : "Failure")}  ({string.Join("+", r.Dice)} + {r.StatValue + r.Modifier} vs {r.Difficulty})");
```

Unsubscribe in `End`. `CheckResult` also has `Critical`, `AppliedModifiers`, `Chance` and `Remembered` (the result was reused because the check can't be retried).

## Several presenters
Use **Presentation** tags to route graphs: `MyDialogueUI` takes **Dialogue**, a `ThoughtsUI` takes **Contemplation**, and a `BarkUI` takes your own `Bark` tag. When a Jump moves into a graph with a different presentation, the current presenter's `End(Stopped)` is called, and the right presenter's `Begin` follows.

Keep the **Decision Debug Presenter** in your test scenes. Set its **Presentation Tags** to a tag nothing else uses, or disable it in builds.

## The Decision Debug Presenter
| Setting | |
|---|---|
| Presentation Tags | Only present these tags. Empty = everything. |
| Layout | **Auto** (side column for Contemplation, bottom bar otherwise), **Bottom Bar** or **Side Column**. |
| Panel Settings | Optional UI Toolkit PanelSettings. Empty = Yapper's shared runtime panel. |
| Minimum Scale | The built-in panel scales with the screen (1920×1080 = 1) but never below this, so it stays readable in small windows. |
| Unlock Cursor While Open | Shows and unlocks the cursor during decisions, then restores it. |
| History, Log Choices | How many previous lines and choices stay visible. |
| Show Locked Choices, Show Debug Header, Show Variables | Debug information. Turn these off for a player-facing look. |
| Style | Colours and font size. |

## Building your own UI Toolkit panel in code
If you build UI Toolkit UI in code (no PanelSettings asset), you can use Yapper's shared panel. It scales the same way as the dialogue panel, and documents on it are ordered by `sortingOrder`:

```csharp
using UnityEngine;
using UnityEngine.UIElements;
using Yapper;

public class QuestTracker : MonoBehaviour
{
    void Start()
    {
        var document = gameObject.AddComponent<UIDocument>();
        document.panelSettings = RuntimePanels.Shared;
        document.sortingOrder = 50;   // the debug presenter uses 100
        document.rootVisualElement.pickingMode = PickingMode.Ignore;   // let clicks through empty areas
        // ... build your elements ...
    }

    // Follow window and Game view resizes. Cheap, and safe to call from several components.
    void Update() => RuntimePanels.UpdateShared();
}
```
