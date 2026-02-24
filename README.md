# SWADE Containers

A solution for inventory organization in Savage Worlds. Nest items inside backpacks, chests, and pouches directly within your character sheet to eliminate clutter.

### **Full Description:**

SWADE Containers enhances the standard SWADE actor sheet by allowing items to act as functional parents for other gear. Instead of a flat list of items, this module provides a hierarchical view that makes managing complex inventories simple and visual.

<img src="assets/screenshot.png" alt="Savage Containers Preview" width="700">

#### Key Features:

* **Integrated UI:** Adds a "Is a Container?" toggle and parent selector directly into the Item Sheet properties.
* **Visual Hierarchy:** Nested items are indented with a dashed guide, making it immediately clear what is stored where.
* **Collapsible Rows:** Click a container's name to fold or unfold its contents. State is saved per item, so your rucksack stays closed even after a sheet refresh.
* **Automatic Weight Summation:** * Calculates the total weight of all contained items automatically.
    * Displays the combined weight (Container + Contents) on the main sheet row.
    * Uses high-precision math to ensure small weights (like 0.25) are never lost to rounding.
* **Seamless Drag & Drop:** * **Pack:** Drag any item onto a container row to move it inside.
    * **Unpack:** Drag an item out of the container and drop it anywhere else on the sheet to "pop" it back to the main list.
* **State-Based Icons:** Dynamic chevrons (Angle Up/Down) indicate at a glance whether a container is open or closed.
* **System Optimized:** Built specifically for the SWADE system structure to ensure maximum performance and compatibility.

#### How it Works:

1.  **Create a Container:** Open any item (e.g., "Backpack"), go to **Properties**, and check **Is a Container?**.
2.  **Organize Gear:** Drag a weapon, piece of armor, or adventuring gear and drop it directly onto your Backpack's name.
3.  **Manage Space:** Click the Backpack's name to hide the contents when you don't need them.
4.  **Check Encumbrance:** Look at the weight column to see the total weight of the bag and everything inside it.



### **Installation:**

1.  Install the module using the Manifest URL below.
2.  Enable **SWADE Containers** in your world's module management settings.
3.  Open any Gear, Weapon, or Armor item to configure its container settings.

**Manifest URL:**
`https://raw.githubusercontent.com/ivan-hr/swade-containers/main/module.json`