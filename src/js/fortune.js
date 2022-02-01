"use strict";

const $fortuneBuilding = $("#fortuneBuilding");

let fortuneSlotid = 0;

class fortuneSlot {
    constructor(container) {
        this.container = container;
        this.name = container.item.name;
        this.type = container.item.type;
        this.rarity = container.rarity + 1;
        this.lvl = container.item.lvl;
        this.slotid = fortuneSlotid;
        fortuneSlotid += 1;
    }
    createSave() {
        const save = {};
        save.container = this.container.createSave();
        save.type = this.type;
        save.rarity = this.rarity;
        save.lvl = this.lvl;
        return save;
    }
    loadSave(save) {
        this.type = save.type;
        this.rarity = save.rarity;
        this.lvl = save.lvl;
        const newContainer = new itemContainer(save.container.id,save.container.rarity);
        newContainer.loadSave(save.container);
        this.container = newContainer;
    }
    picName() {
        return this.container.picName();
    }
    material() {
        return this.container.fortuneMaterial();
    }
    itemLevel() {
        return this.container.itemLevel();
    }
}

const FortuneManager = {
    slots : [],
    lvl : 1,
    stage : null,
    createSave() {
        const save = {};
        save.lvl = this.lvl;
        save.slots = [];
        this.slots.forEach(slot => {
            const saveSlot = slot.createSave();
            save.slots.push(saveSlot);
        });
        return save;
    },
    loadSave(save) {
        save.slots.forEach(slot => {
            const container = new itemContainer(slot.container.id,slot.container.rarity);
            container.loadSave(container);
            const saveSlot = new fortuneSlot(container);
            saveSlot.loadSave(slot);
            this.slots.push(saveSlot);
        });
        this.lvl = save.lvl;
    },
    stageItem(containerID) {
        if (this.slots.length >= this.maxSlot()) {
            ToastManager.renderToast("fortune_no_slot");
            return;
        }
        this.stage = containerID;
        refreshFortuneSlots();
    },
    fortuneByID(fortuneID) {
        return this.slots.find(f=>f.slotid == fortuneID);
    },
    removeFortune() {
        FortuneManager.stage = null;
        refreshFortuneGear();
        refreshFortuneSlots();
    },
    removeLockedFortune(fortuneID) {
        this.slots = this.slots.filter(f=>f.slotid !== fortuneID);
        refreshFortuneGear();
        refreshFortuneSlots();
    },
    lockFortune() {
        if (FortuneManager.stage === null) return;
        const container = Inventory.containerToItem(FortuneManager.stage);
        const cost = FortuneManager.getMaterialCost(container);
        if (!ResourceManager.available(cost.id,cost.amt)) return ToastManager.renderToast('fortune_cant_afford')
        ResourceManager.addMaterial(cost.id,-cost.amt);
        Inventory.removeContainerFromInventory(FortuneManager.stage);
        const newfortuneSlot = new fortuneSlot(container);
        this.slots.push(newfortuneSlot);
        FortuneManager.stage = null;
        refreshFortuneGear();
        refreshFortuneSlots();
    },
    emptySlotCount() {
        if (this.stage === null) return this.maxSlot() - this.slots.length;
        return this.maxSlot() - this.slots.length - 1;        
    },
    getMaterialCost(container) {
        if (container === null) return null;
        return {id:container.fortuneMaterial(),amt:20};
    },
    getProcModifier(line,tier) {
        const modifier = [1,1,1];
        const mods = this.slots.filter(s=>s.type === line && s.lvl === tier);
        mods.forEach(s => {
            modifier[s.rarity-1] = 2;
        });
        refreshFortuneSlots();
        return modifier;
    },
    maxSlot() {
        return this.lvl;
    },
    purgeDone(id,rarity,skipAnimation) {
        if (!skipAnimation && this.slots.some(f => f.container.id === id && f.rarity === rarity)) ToastManager.renderToast('fortune_expired',rarities[rarity].toLowerCase(),recipeList.idToItem(id).name);
        this.slots = this.slots.filter(f => f.container.id !== id || f.rarity !== rarity);
        if (!skipAnimation) {
            refreshFortuneSlots();
            refreshFortuneGear();
        }
    },
    addLevel() {
        this.lvl += 1;
        refreshFortuneSlots();
    },
    hasFortune(id,rarity) {
        let result = false;
        this.slots.forEach(slot => {
            if (slot.container.id === id && slot.rarity === (rarity+1)) {
                result = true;
            } 
        });
        return result;
    }
}

const $fortuneStage = $("#fortuneStage");
const $fortuneGear = $("#fortuneGear");
const $fortuneHeading = $("#fortuneHeading");

function initiateFortuneBldg() {
    FortuneManager.stage = null;
    $fortuneBuilding.show();
    refreshFortuneSlots();
    generateFortuneHeader();
    refreshFortuneGear();
}

function generateFortuneHeader() {
    $fortuneHeading.empty();
    const fortuneOfferingsHeader = $("<div/>").addClass(`contentHeader`).appendTo($fortuneHeading);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(fortuneOfferingsHeader);
        $("<div/>").addClass("headingTitle").html(displayText("header_fortune_possible_title")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("header_fortune_possible_desc")).appendTo(headingDetails);
}

function refreshFortuneSlots() {
    if (lastTab !== "townsTab") return;
    // Update fortune slot count on building tab
    const $fortuneCount = $("#fortuneBldg .buildingNameIndicator");
    $fortuneCount.html(FortuneManager.emptySlotCount());
    if (FortuneManager.emptySlotCount() > 0) $fortuneCount.addClass("available");
    else $fortuneCount.removeClass("available");
    if (TownManager.lastBldg !== "fortune") return;
    // Refresh fortune slots if on fortune building tab
    $fortuneStage.empty();
    FortuneManager.slots.forEach(slot => {
        $fortuneStage.append(createFortuneCardLocked(slot));
    });
    if (FortuneManager.stage !== null) $fortuneStage.append(createFortuneCard(FortuneManager.stage));
    for (let i=0;i<FortuneManager.emptySlotCount();i++) {
        $fortuneStage.append(createFortuneBlank());
    }
}

function refreshFortuneGear() {
    if (lastTab !== "townsTab" || TownManager.lastBldg !== "fortune") return;
    $fortuneGear.empty();
    let noInv = false;
    const fortuneCardsContainer = $("<div/>").addClass("fortuneCardsContainer").appendTo($fortuneGear);
    Inventory.fortuneTargets().forEach(container => {
        if (FortuneManager.hasFortune(container.id,container.rarity)) {
            return;
        }
        fortuneCardsContainer.append(createFortuneInv(container));
        noInv = true;
    });
    if (noInv) return;
    $("<div/>").addClass("emptyContentMessage").html(displayText("fortune_possible_empty")).appendTo($fortuneGear);
}

function createFortuneInv(item) {
    const itemdiv = $("<div/>").addClass("fortuneItem").addClass("R"+item.rarity).addClass("ctrlClickItem").data("rid",item.id);
    const itemName = $("<div/>").addClass("itemName").html(item.picName());
    const itemLevel = $("<div/>").addClass("itemLevel").html(item.itemLevel());
    const itemRarity = $("<div/>").addClass(`itemRarity RT${item.rarity} tooltip`).attr({"data-tooltip": `rarity_${rarities[item.rarity].toLowerCase()}`}).html(miscIcons.rarity);
    const fortuneButton = $("<div/>").addClass("actionButtonCard fortuneStage").attr("containerID",item.containerID).html(displayText('fortune_possible_assign_button'));
    return itemdiv.append(itemName,itemLevel,itemRarity,fortuneButton);
}

function createFortuneCard(containerID) {
    const container = Inventory.containerToItem(containerID);
    const rarity = ["Common","Good","Great","Epic"];
    const itemdiv = $("<div/>").addClass("fortuneSlot").addClass("R"+(container.rarity+1)).addClass("ctrlClickItem").data("rid",container.id);
        $("<div/>").addClass("itemName").html(container.picName()).appendTo(itemdiv);
        $("<div/>").addClass("itemLevel").html(container.itemLevel()).appendTo(itemdiv);
        $("<div/>").addClass(`itemRarity RT${container.rarity+1} tooltip`).attr({"data-tooltip": `rarity_${rarities[container.rarity+1].toLowerCase()}`}).html(miscIcons.rarity).appendTo(itemdiv);
    const rarityBonus = displayText('fortune_slot_rarity_chance').replace('{0}', '100%').replace('{1}', rarity[container.rarity+1]);
    $("<div/>").addClass("fortuneItemDesc").html(rarityBonus).appendTo(itemdiv);
    const cost = FortuneManager.getMaterialCost(container);
    const sacContainer = $("<div/>").addClass("actionButtonCardCost fortuneItemSac").data("fortuneID",containerID).appendTo(itemdiv);
        $("<div/>").addClass("actionButtonCardText").html(displayText('fortune_slot_confirm_button')).appendTo(sacContainer);
        $("<div/>").addClass("actionButtonCardValue tooltip").attr({"data-tooltip":"material_desc","data-tooltip-value":cost.id}).html(`${ResourceManager.idToMaterial(cost.id).img} ${cost.amt}`).appendTo(sacContainer);
    $('<div/>').addClass("fortuneItemClose tooltip").attr({"data-tooltip": "offering_remove"}).data("fortuneID",containerID).html(`<i class="fas fa-times"></i>`).appendTo(itemdiv);
    return itemdiv;
}

function createFortuneCardLocked(slot) {
    const rarity = ["Common","Good","Great","Epic"];
    const itemdiv = $("<div/>").addClass("fortuneSlot").addClass("R"+(slot.rarity));
        $("<div/>").addClass("itemName").html(slot.picName()).appendTo(itemdiv);
        $("<div/>").addClass("itemLevel").html(slot.itemLevel()).appendTo(itemdiv);
        $("<div/>").addClass(`itemRarity RT${slot.rarity} tooltip`).attr({"data-tooltip": `rarity_${rarities[slot.rarity].toLowerCase()}`}).html(miscIcons.rarity).appendTo(itemdiv);
    const rarityBonus = displayText('fortune_slot_rarity_chance').replace('{0}', '100%').replace('{1}', rarity[slot.rarity]);
    $("<div/>").addClass("fortuneItemDesc").html(rarityBonus).appendTo(itemdiv);
    $("<div/>").addClass("fortuneItemAmt").html(displayText('fortune_slot_fortune_remaining').replace('{0}',rarity[slot.rarity]).replace('{1}',slot.name)).appendTo(itemdiv);
    $('<div/>').addClass("fortuneItemSetClose tooltip").attr({"data-tooltip": "fortune_remove"}).data("fortuneID",slot.slotid).html(`<i class="fas fa-times"></i>`).appendTo(itemdiv);
    return itemdiv;
}

function createFortuneBlank() {
    const itemdiv = $("<div/>").addClass("fortuneSlot fortuneSlotEmpty");
        const itemName = $("<div/>").addClass("itemName").appendTo(itemdiv);
            $("<div/>").addClass("fortuneSlotNameIcon").html(miscIcons.emptySlot).appendTo(itemName)
            $("<div/>").addClass("fortuneSlotNameTitle").html(displayText("fortune_slot_empty")).appendTo(itemName)
        $("<div/>").addClass("itemLevel").appendTo(itemdiv);
        $("<div/>").addClass(`itemRarity`).appendTo(itemdiv);
    const actionButton = $("<div/>").addClass("actionButtonCardCost").appendTo(itemdiv);
        $("<div/>").addClass("actionButtonCardText").appendTo(actionButton);
        $("<div/>").addClass("actionButtonCardValue").appendTo(actionButton);
    return itemdiv;
}

$(document).on('click', '.fortuneStage', (e) => {
    e.preventDefault();
    const containerID = parseInt($(e.currentTarget).attr("containerID"));
    FortuneManager.stageItem(containerID);
    if (e.shiftKey) FortuneManager.lockFortune();
    refreshFortuneSlots();
});

$(document).on('click', '.fortuneItemSac', (e) => {
    e.preventDefault();
    destroyTooltip();
    FortuneManager.lockFortune();
    refreshFortuneSlots();
})

$(document).on('click', '.fortuneItemClose', (e) => {
    e.preventDefault();
    FortuneManager.removeFortune();
    refreshFortuneSlots();
    destroyTooltip();
});

$(document).on('click', '.fortuneItemSetClose', (e) => {
    e.preventDefault();
    const fortuneID = parseInt($(e.currentTarget).data("fortuneID"));
    FortuneManager.removeLockedFortune(fortuneID);
    refreshFortuneSlots();
    destroyTooltip();
});