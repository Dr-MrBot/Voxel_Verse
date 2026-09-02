# UPDATE / EXPANSION PROMPT — VOXEL SURVIVAL GAME

Modify the existing browser-based voxel game. Do NOT rebuild it as a static demo. Keep all currently working functionality and ADD the following systems as fully functional gameplay features.

The game must remain an original voxel sandbox game and must not copy Minecraft's proprietary assets, textures, sounds, characters, branding, or code.

---

## 1. PLAYER CHARACTER

Replace the invisible/simple player representation with a visible original 3D voxel-style character.

The character should have:

- Head
- Body
- Two arms
- Two legs
- Simple original voxel-style model
- Walking animation
- Running animation
- Jump animation
- Idle animation
- Mining/breaking animation
- Tool-holding animation
- Damage animation

The character must be visually distinct and original.

Use simple procedural/geometric models if external character assets are unavailable.

The first-person camera should still work normally.

If technically practical, add a third-person camera toggle:

- F5 = switch first-person / third-person

In third person, the player should see their own character.

---

# 2. MINING SYSTEM

Implement a proper mining system.

The player must be able to mine blocks using:

- Hand
- Pickaxe
- Axe
- Shovel
- Hoe where appropriate

Different blocks should require different amounts of time to break.

For example:

Stone:
- Slow with hand
- Faster with pickaxe

Wood:
- Faster with axe

Dirt:
- Faster with shovel

The exact values can be balanced appropriately.

Mining should include:

- Block targeting
- Block outline
- Mining progress indicator
- Breaking animation
- Tool animation
- Appropriate particles
- Sound effect
- Block removal
- Item drop
- Inventory collection

Do not instantly delete every block unless it is intentionally configured as an extremely weak block.

---

# 3. BLOCK COLLECTION

When a block is broken:

1. Remove the block from the world.
2. Determine its drop.
3. Create a dropped item entity.
4. Make the item visible in the world.
5. Allow the player to walk near it.
6. Automatically collect it when within pickup range.
7. Add it to the player's inventory.
8. Merge it with an existing stack when possible.
9. If the inventory is full, leave the item in the world.

Dropped items should have a simple floating/rotating animation.

---

# 4. RESOURCE COLLECTION

Make resource gathering fully functional.

The player should be able to collect:

- Dirt
- Stone
- Sand
- Gravel
- Wood
- Leaves
- Coal
- Copper
- Iron
- Gold
- Rare crystals
- Food
- Seeds
- Plant materials

Resources should have logical drops.

Example:

Breaking a tree trunk:
→ wood item

Mining coal ore:
→ coal item

Mining iron ore:
→ raw iron item

Mining stone:
→ stone item

---

# 5. TOOL DURABILITY

Every usable tool should have durability.

Display durability in the inventory/hotbar.

Mining should reduce durability.

When durability reaches zero:

- Tool becomes unusable
- Tool breaks
- Tool is removed from inventory
- Show a small notification

Creative Mode should optionally disable durability.

---

# 6. CHARACTER + TOOL VISUALS

When the player selects a tool, show that tool in the player's hand.

Examples:

- Pickaxe
- Axe
- Shovel
- Sword
- Hoe

The hand/tool should move appropriately during mining and attacking.

In third-person mode, the selected tool should also appear in the character's hand.

---

# 7. CREATIVE MODE

Add a completely functional Creative Mode.

Main menu / New World should have:

GAME MODE:

- Survival
- Creative

Creative Mode features:

- Unlimited blocks
- Unlimited items
- No hunger
- No fall damage
- No normal mob damage
- Very high/disabled health damage
- Instant block breaking
- Free block placement
- Ability to fly
- Ability to move vertically while flying
- No tool durability
- Access to every block
- Access to every item
- Large creative inventory

Creative flight controls:

Double-tap Space = Start/stop flying

While flying:

Space = Move upward

Shift = Move downward

WASD = Move horizontally

Mouse = Look

Allow configurable flight speed.

---

# 8. CREATIVE INVENTORY

Create a dedicated Creative Inventory.

It should contain all available:

- Blocks
- Building blocks
- Ores
- Tools
- Weapons
- Food
- Decorative objects
- Functional blocks
- Spawn items where implemented

Features:

- Categories
- Search box
- Click item to select
- Unlimited quantity
- Quick transfer to hotbar
- Scroll through items

Suggested categories:

BUILDING  
NATURE  
ORES  
TOOLS  
COMBAT  
FOOD  
DECORATION  
FUNCTIONAL

---

# 9. SURVIVAL / CREATIVE SWITCHING

Do not allow accidental mode switching during normal gameplay.

If a developer/debug mode is enabled, provide a developer-only command or setting to switch modes.

Example:

/gamemode survival

/gamemode creative

Do not make developer commands visible in normal gameplay unless explicitly enabled.

---

# 10. MORE WORLD OBJECTS

Add more interactive objects to make the world feel alive.

Include:

- Trees
- Plants
- Flowers
- Rocks
- Cacti-like plants
- Mushrooms
- Water
- Lava-like liquid
- Torches
- Lanterns
- Chests
- Furnaces
- Crafting stations
- Doors
- Beds
- Signs
- Fences
- Gates
- Ladders

All objects that are supposed to be interactive must actually work.

---

# 11. CREATURES / CHARACTERS

Add original NPC/creature characters.

Create at least:

PASSIVE CREATURES:

- Deer-like creature
- Small bird-like creature
- Sheep-like creature
- Pig-like creature

HOSTILE CREATURES:

- Cave creature
- Night creature
- Ranged creature

These must use original designs and names.

Each creature should have:

- 3D model
- Idle animation
- Walk animation
- Health
- Movement
- Basic AI
- Collision
- Sound/ambient behavior
- Drops where appropriate

---

# 12. CREATURE SPAWNING

Creatures should spawn according to:

- Biome
- Time
- Light level
- Distance
- Spawn limits

Examples:

Forest:
→ passive creatures

Desert:
→ desert creatures

Night:
→ hostile creatures

Caves:
→ underground hostile creatures

Do not spawn unlimited entities.

---

# 13. COMBAT

Implement simple original combat.

The player can use:

- Sword
- Tool where appropriate

Combat should include:

- Attack animation
- Hit detection
- Damage
- Knockback
- Mob health
- Damage feedback
- Mob death
- Item drops

Keep combat simple and suitable for a sandbox game.

---

# 14. INTERACTION SYSTEM

Right-click should intelligently determine what the player is interacting with.

Examples:

Chest → open storage

Furnace → open furnace UI

Crafting station → open crafting UI

Door → open/close

Bed → use bed

Food → eat

Block → place

Tool → perform appropriate action

---

# 15. INVENTORY IMPROVEMENTS

Make inventory completely functional.

Support:

- Drag and drop
- Stack splitting
- Stack merging
- Shift-click transfer
- Hotbar selection
- Item dropping
- Item pickup
- Item swapping

If the player presses Q while an item is selected:

→ Drop one item.

Allow configurable drop controls.

---

# 16. ITEM PICKUP UI

When collecting an item, show a small notification:

"+ Stone"

"+ Wood"

"+ Coal"

etc.

The notification should disappear automatically.

Avoid excessive UI spam by combining repeated pickups.

Example:

"+12 Stone"

---

# 17. MINING TARGET UI

When looking at a block, display its name in a small unobtrusive UI element.

Example:

Stone

Coal Ore

Iron Ore

Wood

Sand

This should disappear when the player looks away.

---

# 18. BLOCK BREAKING FEEDBACK

When mining:

- Show cracks/progress
- Play subtle sound
- Animate tool
- Spawn particles
- Shake/feedback slightly when appropriate

When finished:

- Block disappears
- Drop appears
- Nearby chunk mesh updates

---

# 19. CREATIVE BUILDING EXPERIENCE

Creative Mode should make building easy.

Add:

- Instant block placement
- Unlimited blocks
- Flight
- Creative inventory
- Fast movement
- Easy block selection

Optional:

- Block selection/search
- Copy selected block
- Quick-fill hotbar

---

# 20. GAME MODE UI

Show the current mode subtly in the pause/settings screen.

Example:

GAME MODE: SURVIVAL

or

GAME MODE: CREATIVE

Do not permanently cover the gameplay screen with unnecessary text.

---

# 21. DEVELOPER CREDIT

Add the following developer credit throughout the appropriate menus:

Developer:
MOHAMMAD FAHAD

Add it to:

- Main Menu
- About/Credits screen

Use exactly this name:

MOHAMMAD FAHAD

Create an "About" or "Credits" button on the main menu.

Credits screen:

VOXEL SANDBOX

Developed by
MOHAMMAD FAHAD

Add a simple professional presentation.

Do not falsely claim ownership of third-party libraries.

If libraries such as Three.js are used, acknowledge them separately where appropriate.

---

# 22. ORIGINAL GAME BRANDING

Create an original game title instead of using Minecraft branding.

Choose a suitable original name such as:

BLOCK REALMS

or another original voxel-game name.

Do NOT display the Minecraft logo or Minecraft branding.

---

# 23. SAVE THESE NEW FEATURES

Update the save system to persist:

- Game mode
- Creative/survival state
- Player position
- Player rotation
- Inventory
- Tools
- Durability
- Health
- Hunger
- XP
- Spawn point
- Modified blocks
- Chests
- Furnaces
- Crops
- World time
- World seed

When reopening the world, everything should be restored.

---

# 24. PERFORMANCE

Do not sacrifice performance for the new characters and objects.

Use:

- Instanced rendering
- Shared geometry
- Shared materials
- Chunk streaming
- Entity distance culling
- Animation optimization
- Object pooling

Do not create a separate expensive renderer for every block/item/entity.

---

# 25. FINAL GAMEPLAY TEST

After implementing the changes, test this exact sequence:

SURVIVAL:

1. Create Survival world.
2. Spawn character.
3. Move around.
4. Find a tree.
5. Mine/break wood.
6. Collect dropped wood.
7. Open inventory.
8. Craft basic tools.
9. Mine stone.
10. Mine ore.
11. Collect ore.
12. Craft better tools.
13. Build a shelter.
14. Encounter a creature.
15. Interact with the environment.
16. Save the world.
17. Reload the world.
18. Confirm everything persists.

CREATIVE:

1. Create Creative world.
2. Spawn character.
3. Open Creative Inventory.
4. Search/select a block.
5. Place unlimited blocks.
6. Break blocks instantly.
7. Fly.
8. Build vertically.
9. Select different tools/blocks.
10. Spawn/interact with available creatures if implemented.
11. Save.
12. Reload.
13. Confirm Creative Mode remains active.

---

# 26. CRITICAL REQUIREMENT

Do not simply add visual placeholders.

Every feature must be functional.

If an item appears in the inventory, it must have a purpose.

If a block can be mined, it must produce an appropriate drop.

If a tool appears, it must work.

If a creature appears, it must have basic movement/interaction.

If Creative Mode is selected, its mechanics must actually change.

If the developer name is displayed, it must appear in the actual UI.

Keep all existing working features from the previous version.

Fix bugs introduced by these modifications.

The final result should be a genuinely playable browser-based original voxel sandbox game with Survival and Creative modes.