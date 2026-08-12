# Emberfall Godot Project

This is the 3D successor to the browser prototype in the repository root. The
prototype remains the reference for content, balance, and gameplay behavior.

The main scene renders the exact authored `192 x 160` terrain from
`js/world.js`. Each legacy tile maps to a `1.5m x 1.5m` logical tile. Player
spawn `(174, 44)` and Guide Elowen `(171, 40)` keep their original coordinates.

After changing the browser map, regenerate the Godot data with:

```powershell
node tools/export_legacy_world.mjs
```

## Engine

- Godot 4.7.1
- GDScript
- Compatibility renderer for Windows and Web targets

## Run

Open `project.godot` in Godot and press F6/F5, or run:

```powershell
Godot_v4.7.1-stable_win64_console.exe --path godot --editor
```

The initial Greenrest blockout supports elevated camera tracking and
left-click-to-move navigation on a 24 x 20 logical grid.

## Logical Grid

- One logical tile is 1.5 world meters.
- `LogicalGrid` owns world/tile conversion, blocked occupancy, nearest-walkable
  targeting, and A* pathfinding.
- Movement is smooth between tile centers.
- Houses and the current tree block logical cells.
- Press `F3` to show or hide the logical grid overlay.

Buildings are independent `BuildingEntity` scene instances. Each entity owns an
ID, display name, footprint, and doorway direction. Building walls block graph
connections along tile edges; they do not consume the tiles on either side.
The doorway preserves one connection between the exterior and interior.

## Greenrest Region

The first authored region is a 48 x 40 logical-tile blockout containing:

- Greenrest Plaza and fountain at the main crossroads
- Alaric's General Store
- Murphy's Fishing Supplies
- Elowen's House
- Castle Bank and King Aldric's Hall
- The Long Docks, pond, and walkable dock
- Millrow Farms, crop plots, and farmhouse
- North/south and east/west roads leading toward later regions

## Interaction Ranges

- Talk, gather, and melee actions require a range of 1 tile.
- Ranged combat uses 5 tiles.
- Magic uses 6 tiles.
- Diagonal neighbors count as adjacent.
- `LogicalGrid.path_world_to_range()` finds the shortest reachable action tile
  around an occupied target instead of attempting to enter its tile.

## Current Interaction Demo

Guide Elowen occupies a logical tile near the player spawn. Click Elowen's
character model or name to:

1. Select her as the pending interaction.
2. Path to the nearest reachable adjacent tile.
3. Verify the player is within one tile.
4. Open her dialogue panel.

## Camera

- Middle-mouse drag orbits and tilts the camera.
- `Q` and `E` rotate the camera horizontally.
- The mouse wheel zooms between 10 and 34 world meters.
- Pitch is constrained to preserve the elevated RPG view.

## Project Structure

- `scenes/greenrest` - Greenrest vertical-slice world scenes
- `scenes/player` - player scenes
- `scripts/world` - region construction and world behavior
- `scripts/actors` - player, NPC, and enemy controllers
