/**
 * SWADE Containers
 */

Hooks.once('init', () => {
    console.log("SWADE Containers | Initializing...");
});

// 1. Scroll Restoration Logic
Hooks.on("preRenderApplicationV2", (app) => {
    if (app.document?.documentName !== "Actor") return;
    const html = app.element;
    if (!html) return;

    const scrollable = html.querySelector('.sheet-body.scrollable.active');
    if (scrollable) {
        app._swadeContainerScroll = scrollable.scrollTop;
    }
});

Hooks.on("renderApplicationV2", (app, html) => {
    const doc = app.document;
    const root = (html instanceof HTMLElement ? html : html[0]);

    if (doc?.documentName === "Item") {
        injectItemUI(doc, root);
    } else if (doc?.documentName === "Actor") {
        requestAnimationFrame(() => {
            handleActorUI(app, root);
            
            if (app._swadeContainerScroll !== undefined) {
                const scrollable = root.querySelector('.sheet-body.scrollable.active');
                if (scrollable) {
                    scrollable.scrollTop = app._swadeContainerScroll;
                    setTimeout(() => { scrollable.scrollTop = app._swadeContainerScroll; }, 1);
                    setTimeout(() => { scrollable.scrollTop = app._swadeContainerScroll; }, 50);
                }
            }
        });
    }
});

// 2. Item Sheet UI
function injectItemUI(item, element) {
    const canBeContainer = ["gear", "consumable"]; 
    if (!canBeContainer.includes(item.type)) return;
    
    if (element.querySelector('.swade-container-settings')) return;

    const isContainer = !!item.getFlag("swade-containers", "isContainer");
    const isBackpack = !!item.getFlag("swade-containers", "isBackpack");
    const parentId = item.getFlag("swade-containers", "containerId") || "";

    const div = document.createElement("div");
    div.classList.add("swade-container-settings");
    div.style.cssText = "margin-top: 10px; padding: 10px; border: 1px dashed #7a7971; border-radius: 5px; background: rgba(0,0,0,0.05);";

    let options = `<option value="">-- None --</option>`;
    if (item.actor) {
        item.actor.items.filter(i => canBeContainer.includes(i.type) && i.getFlag("swade-containers", "isContainer") && i.id !== item.id)
            .forEach(c => {
                options += `<option value="${c.id}" ${parentId === c.id ? "selected" : ""}>${c.name}</option>`;
            });
    }

    div.innerHTML = `
        <h4 class="form-header">Container Settings</h4>
        <div class="form-group">
            <label>Is a Container?</label>
            <input type="checkbox" name="flags.swade-containers.isContainer" ${isContainer ? "checked" : ""}>
        </div>
        <div class="form-group backpack-option" style="${isContainer ? '' : 'display:none;'}">
            <label><i class="fa fa-cube" style="color: #111;"></i>Backpack Rule (50% Weight inside)</label>
            <input type="checkbox" name="flags.swade-containers.isBackpack" ${isBackpack ? "checked" : ""}>
        </div>
        <div class="form-group">
            <label>Belongs to Container:</label>
            <select name="flags.swade-containers.containerId">${options}</select>
        </div>
    `;

    const target = element.querySelector('.item-grants')?.closest('section') || element.querySelector('section[data-tab*="prop"]') || element.querySelector('.sheet-body');
    if (target) target.appendChild(div);

    div.querySelector('input[name="flags.swade-containers.isContainer"]').addEventListener('change', e => {
        div.querySelector('.backpack-option').style.display = e.target.checked ? 'flex' : 'none';
    });
}

// 3. Actor Sheet: Nesting & Weight
function handleActorUI(app, element) {
    const actor = app.document;
    const $html = $(element);
    const weightTotals = {};
    const itemRows = $html.find('[data-item-id]');
    const supported = ["gear", "consumable", "weapon", "armor", "shield"];
    
    itemRows.each((i, el) => {
        const item = actor.items.get(el.dataset.itemId);
        if (!item || !supported.includes(item.type)) return;

        if (item.getFlag("swade-containers", "isContainer")) {
            const isCollapsed = !!item.getFlag("swade-containers", "isCollapsed");
            const isBackpack = !!item.getFlag("swade-containers", "isBackpack");
            const nameLink = $(el).find('.item-name, .name-link').first();
            
            if (nameLink.length && !nameLink.find('.container-indicator').length) {
                if (isBackpack) {
                    nameLink.append(`<i class="fa fa-cube backpack-indicator" title="Weight Reduction Container" style="margin-left:8px; color: #111; opacity:0.8; font-size:0.8em;"></i>`);
                }
                const iconClass = isCollapsed ? 'fa-angle-down' : 'fa-angle-up';
                nameLink.append(`<i class="fas ${iconClass} container-indicator" style="margin-left:8px; cursor:pointer; opacity: 0.7;"></i>`);
            }
        }

        const pId = item.getFlag("swade-containers", "containerId");
        if (pId) {
            const w = (Number(item.system.weight) || 0) * (Number(item.system.quantity) || 1);
            weightTotals[pId] = (weightTotals[pId] || 0) + w;
        }
    });

    itemRows.each((i, el) => {
        const item = actor.items.get(el.dataset.itemId);
        if (!item || !supported.includes(item.type)) return;

        const pId = item.getFlag("swade-containers", "containerId");
        if (pId) {
            const parentRow = $html.find(`[data-item-id="${pId}"]`).first();
            if (parentRow.length) {
                $(el).insertAfter(parentRow);
                const isCollapsed = !!actor.items.get(pId)?.getFlag("swade-containers", "isCollapsed");
                $(el).addClass("swade-item-child").css({
                    "padding-left": "20px", "border-left": "2px solid #777",
                    "display": isCollapsed ? "none" : "flex"
                });
            }
        }
    });

    for (const [id, total] of Object.entries(weightTotals)) {
        const span = $html.find(`[data-item-id="${id}"] .weight, [data-item-id="${id}"] .item-weight`).first();
        if (span.length) {
            const containerItem = actor.items.get(id);
            const self = (Number(containerItem.system.weight) || 0) * (Number(containerItem.system.quantity) || 1);
            span.html(`${(self + total).toFixed(2)} <small style="opacity:0.7">(${total.toFixed(2)})</small>`);
        }
    }

    $html.find('.item-name, .name-link').off('click.swadeContainers').on('click.swadeContainers', async (ev) => {
        const row = $(ev.currentTarget).closest('[data-item-id]');
        const item = actor.items.get(row.data('item-id'));
        if (item?.getFlag("swade-containers", "isContainer")) {
            ev.preventDefault(); ev.stopPropagation(); 
            const scrollable = element.querySelector('.sheet-body.scrollable.active');
            if (scrollable) app._swadeContainerScroll = scrollable.scrollTop;
            await item.setFlag("swade-containers", "isCollapsed", !item.getFlag("swade-containers", "isCollapsed"));
        }
    });
}

// 4. Drag and Drop Interaction
Hooks.on("dropActorSheetData", async (actor, sheet, data) => {
    if (data.type !== "Item" || !data.uuid) return true;

    const droppedItem = fromUuidSync(data.uuid);
    
    // 1. Items that can be NESTED
    const isSupported = ["gear", "consumable", "weapon", "armor", "shield"];
    // 2. Items that can ACT as a container
    const canBeContainer = ["gear", "consumable"];
    
    if (droppedItem && isSupported.includes(droppedItem.type) && droppedItem.parent?.id === actor.id) {
        
        const ev = window.event;
        if (ev && typeof ev.stopPropagation === "function") {
            ev.preventDefault();
            ev.stopPropagation();
        }

        const targetEl = document.elementFromPoint(window.event.clientX, window.event.clientY);
        const targetRow = targetEl?.closest('[data-item-id]');
        
        let newId = "";
        let original = droppedItem.getFlag("swade-containers", "originalWeight") ?? Number(droppedItem.system.weight);
        let targetWeight = original;

        if (targetRow) {
            const tId = targetRow.dataset.itemId;
            const targetItem = actor.items.get(tId);
            
            // FIX: Check if the target is in the 'canBeContainer' list
            if (targetItem && 
                canBeContainer.includes(targetItem.type) && 
                targetItem.getFlag("swade-containers", "isContainer") && 
                droppedItem.id !== tId) {
                
                newId = tId;
                if (targetItem.getFlag("swade-containers", "isBackpack")) targetWeight = original * 0.5;
            }
        }

        await droppedItem.update({
            "system.weight": targetWeight,
            "flags.swade-containers.containerId": newId,
            "flags.swade-containers.originalWeight": original
        });

        sheet.render(true);
        return false; 
    }
    return true;
});

// 5. Backpack Sync
Hooks.on("updateItem", async (item, changes, options, userId) => {
    if (game.user.id !== userId || !foundry.utils.hasProperty(changes, "flags.swade-containers.isBackpack")) return;
    const isNowBackpack = changes.flags["swade-containers"].isBackpack;
    const children = item.parent?.items.filter(i => i.getFlag("swade-containers", "containerId") === item.id);
    if (!children) return;

    for (let child of children) {
        let original = child.getFlag("swade-containers", "originalWeight") ?? Number(child.system.weight);
        await child.update({ 
            "system.weight": isNowBackpack ? original * 0.5 : original, 
            "flags.swade-containers.originalWeight": original 
        });
    }
});

// 6. Equip Status Sync
Hooks.on("updateItem", async (item, changes, options, userId) => {
    if (game.user.id !== userId || !foundry.utils.hasProperty(changes, "system.equipStatus")) return;

    const newStatus = changes.system.equipStatus;
    const isContainer = item.getFlag("swade-containers", "isContainer");

    if (isContainer) {
        const children = item.parent?.items.filter(i => i.getFlag("swade-containers", "containerId") === item.id);
        if (!children || children.length === 0) return;

        const updates = children.map(child => ({
            _id: child.id,
            "system.equipStatus": newStatus
        }));

        if (updates.length > 0) {
            await item.parent.updateEmbeddedDocuments("Item", updates);
        }
    }
});