/**
 * SWADE Containers
 */

Hooks.once('init', () => {
    console.log("SWADE Containers | Initializing...");
});

// 1. Item Sheet: Dropdown UI
Hooks.on("renderItemSheet", (app, html, data) => {
    const supportedTypes = ["gear", "weapon", "armor", "shield"];
    if (!supportedTypes.includes(app.item.type)) return;

    const item = app.item;
    const actor = item.actor;
    const isContainer = item.getFlag("swade-containers", "isContainer") || false;
    const currentParentId = item.getFlag("swade-containers", "containerId") || "";

    let containerSection = `
        <hr>
        <div class="form-group">
            <label>Is a Container?</label>
            <input type="checkbox" name="flags.swade-containers.isContainer" ${isContainer ? "checked" : ""}>
        </div>
    `;

    if (actor) {
        const availableContainers = actor.items.filter(i => 
            i.getFlag("swade-containers", "isContainer") && i.id !== item.id
        );

        let options = `<option value="">-- None --</option>`;
        for (let c of availableContainers) {
            const isSelected = (currentParentId === c.id || currentParentId.endsWith(c.id)) ? "selected" : "";
            options += `<option value="${c.id}" ${isSelected}>${c.name}</option>`;
        }

        containerSection += `
            <div class="form-group">
                <label>Belongs to Container:</label>
                <select name="flags.swade-containers.containerId">
                    ${options}
                </select>
            </div>
        `;
    }
    html.find(".tab[data-tab='properties']").append(containerSection);
});

// 2. Actor Sheet: Nesting & Weight
Hooks.on("renderActorSheet", (app, html, data) => {
    const actor = app.actor;
    const itemRows = html.find('li.item[data-item-id]');
    const weightTotals = {};

    itemRows.each((index, element) => {
        const itemId = element.dataset.itemId;
        const item = actor.items.get(itemId);
        if (!item) return;

        // Container Icons
        if (item.getFlag("swade-containers", "isContainer")) {
            const isCollapsed = item.getFlag("swade-containers", "isCollapsed");
            const nameLink = $(element).find('.item-name');
            if (nameLink.find('.container-indicator').length === 0) {
                const iconClass = isCollapsed ? 'fa-angle-down' : 'fa-angle-up';
                nameLink.append(` <i class="fas ${iconClass} container-indicator"></i>`);
            }
        }

        // Child Logic
        let parentId = item.getFlag("swade-containers", "containerId")?.trim();
        if (parentId) {
            if (parentId.includes('.')) parentId = parentId.split('.').pop();
            const parentRow = html.find(`li.item[data-item-id="${parentId}"]`);

            if (parentRow.length > 0) {
                $(element).insertAfter(parentRow);
                const parentItem = actor.items.get(parentId);
                const isCollapsed = parentItem?.getFlag("swade-containers", "isCollapsed");

                // Toggle visibility and add CSS class
                element.classList.add("swade-item-child");
                isCollapsed ? $(element).hide() : $(element).show();

                // Weight Math
                const itemWeight = (Number(item.system.weight) || 0) * (Number(item.system.quantity) || 1);
                weightTotals[parentId] = (weightTotals[parentId] || 0) + itemWeight;
            }
        }
    });

    // Weight Update UI
    for (const [containerId, total] of Object.entries(weightTotals)) {
        const parentRow = html.find(`li.item[data-item-id="${containerId}"]`);
        const weightSpan = parentRow.find('.weight'); 
        if (weightSpan.length > 0) {
            const originalWeight = Number(actor.items.get(containerId).system.weight) || 0;
            const combinedWeight = parseFloat((originalWeight + total).toFixed(2));
            const contentWeight = parseFloat(total.toFixed(2));
            weightSpan.html(`${combinedWeight} <small style="opacity:0.6">(${contentWeight})</small>`);
        }
    }

    // Toggle Click Listener
    html.find('.item-name').off('click.swade-containers').on('click.swade-containers', async (event) => {
        const li = $(event.currentTarget).closest('li.item');
        const item = actor.items.get(li.data('item-id'));

        if (item?.getFlag("swade-containers", "isContainer")) {
            event.preventDefault();
            event.stopPropagation();
            const currentState = !!item.getFlag("swade-containers", "isCollapsed");
            await item.setFlag("swade-containers", "isCollapsed", !currentState);
        }
    });
});

// 4. Drag and Drop Interaction
Hooks.on("dropActorSheetData", (actor, sheet, data) => {
    if (data.type !== "Item") return true;

    const event = window.event;
    const targetRow = $(event.target).closest('li.item[data-item-id]');
    
    if (data.uuid) {
        const droppedItem = fromUuidSync(data.uuid);
        if (droppedItem && droppedItem.parent?.id === actor.id) {
            if (targetRow.length > 0) {
                const targetItemId = targetRow.data('item-id');
                const targetItem = actor.items.get(targetItemId);

                if (targetItem?.getFlag("swade-containers", "isContainer") && droppedItem.id !== targetItemId) {
                    droppedItem.setFlag("swade-containers", "containerId", targetItemId);
                    return false; 
                }
            } else {
                // If dropped on the sheet but not on a container, remove from current container
                if (droppedItem.getFlag("swade-containers", "containerId")) {
                    droppedItem.setFlag("swade-containers", "containerId", "");
                    return false;
                }
            }
        }
    }
    return true;
});