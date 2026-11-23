---
# Generated from Yapper's Documentation~/GraphEditor.md by scripts/sync-yapper-docs.mjs. Edit the original, not this copy.
title: "Graph editor"
---

Open a graph by **double-clicking a Decision Graph asset**, with **Window > Yapper > Graph Editor**, or from the **Open Graph Editor** button in the graph's Inspector.

```
┌ toolbar ───────────────────────────────────────────────────────────────────────────┐
│ [Graph ▾] Frame  Auto Layout  Ping Asset  Repair   Shortcuts Return Links Minimap Sidebar │
├─────────────────────────────────────────────────────────────┬──────────────────────┤
│                                                             │ Inspector│Simulate│Issues │
│                      canvas                                 │                      │
│                                                             │  sidebar             │
└─────────────────────────────────────────────────────────────┴──────────────────────┘
```

## Toolbar
| Item | Does |
|---|---|
| Graph field | The graph being edited. Drag another graph in to switch. |
| **Frame** | Fits the whole graph, or centres the entry node if the graph is too big to read at that zoom. |
| **Auto Layout** | Arranges nodes left to right from the entry node. Undoable. |
| **Ping Asset** | Highlights the graph in the Project window. |
| **Repair** | Re-syncs the node list with the node sub-assets saved in the file. Use it after merge conflicts or manual file edits. |
| **Shortcuts** | Lists the keyboard shortcuts. |
| **Return Links** | Draws connections that loop back to an earlier node as a label (see [Return links](#return-links)). |
| **Minimap**, **Sidebar** | Show or hide those panels. |
| **More** | Appears in narrow windows. The buttons above move into this menu. |

## Moving around
| Action | How |
|---|---|
| Pan | Left-drag on empty canvas, middle-drag, or Alt+drag |
| Zoom | Scroll wheel |
| Select | Click a node. Right-drag on empty canvas to box-select (hold Shift or Ctrl/Cmd to add to the selection). Shift/Ctrl+left-drag also box-selects. |
| Focus a node | Double-click it, or select it and press **F** |
| Frame everything | **A** |
| Context menu | Right-click: create nodes, set entry, copy, paste, delete |

## Shortcuts
| Key | Action |
|---|---|
| Space | Create a node at the mouse (searchable list) |
| F | Focus the selected node (or frame the graph) |
| A | Frame the graph |
| L | Auto layout |
| E | Make the selected node the entry |
| N | Sticky note at the mouse |
| Ctrl/Cmd+G | Group the selected nodes |
| Ctrl/Cmd+C / V / D | Copy / paste / duplicate |
| Delete / Backspace | Delete the selection |
| Ctrl/Cmd+Z | Undo (all edits are undoable) |

## Nodes
Each node shows its type and number (**Line #3**), coloured by type. It also shows a one-line summary of its content and one output port per exit: choices, branch cases and random options each get their own port. The **entry** node has a badge. A red or yellow badge means the node has [issues](#issues).

- **Connect:** drag from an output port (right) to another node's input (left). Dragging from a connected port re-targets it.
- **An unconnected port ends the conversation.** You don't need End nodes everywhere; use them to make the ending explicit, or to control whether the graph counts as completed.
- **Details:** expand **Details** on a node to edit it in place. Choice, Branch and Random nodes list their entries; select one to edit its text, conditions and actions, and use **+** / **−** to add or remove entries. The node's own fields come next, then its **On Enter / On Exit** actions.
- **Hover a port** to see the full choice text, its conditions, repeat mode and actions.

The **sidebar Inspector** shows the same data for the selected node, or the graph settings when nothing is selected.

## Return links
Dialogue loops a lot: "ask another question" goes back to the choices. Drawn as wires, those connections curve backwards across the whole graph. With **Return Links** on (the default), any connection to the same node or to a node further left shows as a label on its port instead:

```
 Boss isn't seeing anyone tonig…  [↩ Choice #5] ●
```

- **Click** the label to jump to the target. **Right-click** for *Go To Target* or *Disconnect*.
- Whether a connection counts as a return depends on node positions, so it updates when you move nodes or run Auto Layout.
- Turn **Return Links** off to see every connection as a wire. The setting is saved per user.

## Groups and sticky notes
- **Ctrl/Cmd+G** groups the selected nodes in a titled box. Nodes moved in or out of the box join or leave the group.
- **N** adds a sticky note at the mouse, for notes to writers, TODOs and section headings.

Both are layout only and are ignored at runtime. Nodes also have a **Notes** field for longer comments.

## Simulate
The **Simulate** tab plays the graph inside the editor without entering Play mode:

- **Start**, **Start at Selected** (any node), **Stop**, **Reset State** (forget visited nodes, variables and check results).
- Lines and choices appear in the panel. Click choices to pick them. Each action is logged with *skipped* if it didn't run.
- **Options:**
  - **Game conditions:** *Assume True*, *Assume False* or *Evaluate*. Applies to conditions from your code. Yapper's own conditions (variables, visited, chance) always evaluate.
  - **Skill checks:** *Roll*, *Always Pass* or *Always Fail*.
  - **Game stat value:** the value used for stats from your code.
  - **Run game code:** off by default. Off means your actions are logged but not executed, and your stats use the value above. Turn it on only if your code works outside Play mode.
  - **Follow in graph:** keeps the current node centred.
- **Variables:** shows the sandbox variables as the simulation changes them.
- The simulator starts graphs even when their Availability fails, and says so.

## Issues
The **Issues** tab lists problems in the graph. Click one to jump to its node:

- **Errors:**
  - ports pointing at deleted nodes
  - missing condition or action types (usually a renamed class)
  - Choice nodes with no choices
  - jumps to missing nodes
  - loops made only of automatic nodes (would never stop)
- **Warnings:**
  - nodes unreachable from the entry
  - empty text
  - branches with no cases
- **Info:**
  - choices that might all be unavailable at once
  - nodes with no actions

**Tools > Yapper > Validate All Graphs** checks every graph in the project and logs the results to the Console. It's handy before a build or after renaming classes.

## Play mode
With a graph open while the game runs, the node currently playing is highlighted.
