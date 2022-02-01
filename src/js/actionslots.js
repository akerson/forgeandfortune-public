"use strict";

const slotState = Object.freeze({NEEDMATERIAL:0,CRAFTING:1});

$(document).on("click", ".ASCancel", (e) => {
    e.preventDefault();
    e.stopPropagation();
    destroyTooltip(e);
    const slot = parseInt($(e.target).parent().data("slotNum"));
    actionSlotManager.removeSlot(slot);
});

$(document).on("click", ".ASBuySlotButton", (e) => {
    e.preventDefault();
    actionSlotManager.upgradeSlot();
})

$(document).on("click", ".ASauto", (e) => {
    e.preventDefault();
    const slot = parseInt($(e.currentTarget).data("slotNum"));
    actionSlotManager.toggleAuto(slot);
    actionSlotVisualManager.updateAutoSell();
    destroyTooltip();
    generateTooltip(e);
});

class actionSlot {
    constructor(itemid,slotNum) {
        this.itemid = itemid;
        this.item = recipeList.idToItem(itemid);
        this.craftTime = 0;
        this.status = slotState.NEEDMATERIAL;
        this.slotNum = slotNum;
    }
    createSave() {
        const save = {};
        save.itemid = this.itemid;
        save.craftTime = this.craftTime;
        save.status = this.status;
        save.slotNum = this.slotNum;
        return save;
    }
    loadSave(save) {
        this.craftTime = save.craftTime;
        this.status = save.status;
        this.slotNum = save.slotNum;
    }
    itemPicName() {
        return this.item.itemPicName();
    }
    addTime(t,skipAnimation) {
        if (this.status === slotState.NEEDMATERIAL) this.attemptStart(skipAnimation);
        if (this.status !== slotState.CRAFTING) {
            this.craftTime = 0;
            return;
        }
        this.craftTime += t;
        while (this.craftTime > this.maxCraft()) {
            this.craftTime -= this.maxCraft();
            Inventory.craftToInventory(this.itemid,skipAnimation);
            if (this.itemid === "R13001" && recipeList.idToItem("R13001").craftCount === 1) {
                $inventoryTabSpan.addClass("hasEvent");
                tabHide();
            }
            if (!skipAnimation) refreshRecipeMasteryAmt(this.item);
            this.status = slotState.NEEDMATERIAL;
            this.attemptStart(skipAnimation);
        }
        if (!skipAnimation) this.progress = (this.craftTime/this.maxCraft()).toFixed(3)*100+"%";
    }
    maxCraft() {
        return Math.floor(this.item.craftTime * Museum.craftTime(this.item.id));
    }
    timeRemaining() {
        return this.maxCraft()-this.craftTime;
    }
    attemptStart(skipAnimation) {
        //attempts to consume requried material, if successful start crafting
        if (this.item.isMastered()) {
            this.status = slotState.CRAFTING;
            return;
        }
        if (!ResourceManager.canAffordMaterial(this.item)) return;
        ResourceManager.deductMaterial(this.item,skipAnimation);
        this.status = slotState.CRAFTING;
    }
    autoSellToggle() {
        return this.item.autoSellToggle();
    }
    autoSell() {
        return this.item.autoSell;
    }
    refundMaterial() {
        if (this.status !== slotState.CRAFTING || this.item.isMastered()) return;
        ResourceManager.refundMaterial(this.item);
    }
    isMastered() {
        return this.item.isMastered();
    }
    isBuildingMaterial() {
        return this.item.recipeType !== "normal"
    }
    resList() {
        return this.item.gcost;
    }
    matList() { 
        const array = [];
        if (!this.item.mcost) return array;
        for (const [key, value] of Object.entries(this.item.mcost)) {
            array.push({id: key, amt: value})
        }
        return array;
    }
}

let craftCount = 0;

const actionSlotManager = {
    maxSlots : 1,
    slots : [],
    minTime : 0,
    createSave() {
        const save = {};
        save.maxSlots = this.maxSlots;
        save.slots = [];
        this.slots.forEach(s => {
            save.slots.push(s.createSave());
        })
        save.minTime = this.minTime;
        return save;
    },
    loadSave(save) {
        this.maxSlots = save.maxSlots;
        save.slots.forEach(s => {
            const slot = new actionSlot(s.itemid)
            slot.loadSave(s);
            this.slots.push(slot);
        });
        this.minTime = save.minTime;
    },
    addSlot(itemid) {
        if (this.slots.length >= this.maxSlots) {
            ToastManager.renderToast('slots_full');
            return;
        }
        const item = recipeList.idToItem(itemid);
        if (item.recipeType !== "normal" && this.isAlreadySlotted(itemid)) return;
        if (!item.owned) return ToastManager.renderToast("recipe_not_owned");
        if (!item.canProduce) {
            ToastManager.renderToast("craft_warning");
            return;
        }
        this.slots.push(new actionSlot(itemid,this.slots.length));
        this.adjustMinTime();
        refreshSideWorkers();
        recipeList.canCraft();
        checkCraftableStatus();
    },
    adjustMinTime() {
        if (this.slots.length === 0) {
            this.minTime = 0;
            return;
        }
        this.minTime = Math.min(...this.slots.map(s => s.maxCraft()));
    },
    removeSlot(slot) {
        this.slots[slot].refundMaterial();
        this.slots.splice(slot,1);
        this.slots.forEach((s,i) => s.slotNum = i);
        this.adjustMinTime();
        refreshSideWorkers();
        recipeList.canCraft();
        checkCraftableStatus();
    },
    removeBldgSlots() {
        const remove = [];
        this.slots.forEach(slot => {
            if (slot.item.recipeType !== "normal" && TownManager.typeToBuilding(slot.item.type).status >= 0) {
                remove.push(slot.item.type);
            }
        })
        this.slots = this.slots.filter(s => !remove.includes(s.item.type));
        this.slots.forEach((s,i) => s.slotNum = i);
        this.adjustMinTime();
        refreshSideWorkers();
        recipeList.canCraft();
        checkCraftableStatus();
    },
    isAlreadySlotted(id) {
        return this.slots.map(s=>s.itemid).includes(id)
    },
    addTime(t) {
        if (this.slots.length === 0) return;
        const skipAnimation = t >= this.minTime;
        if (!skipAnimation) {
            this.slots.forEach(slot => {
                slot.addTime(t,false);
            });
            return;
        }
        let timeRemaining = t;
        while (timeRemaining > 0) {
            const timeChunk = Math.min(timeRemaining,this.minTime);
            this.slots.forEach(slot => {
                slot.addTime(timeChunk,true);
            });
            timeRemaining -= timeChunk;
        }
        refreshInventoryAndMaterialPlaces();
    },
    upgradeSlot() {
        if (this.maxSlots === 5) return;
        this.maxSlots += 1;
        recipeList.canCraft();
        checkCraftableStatus();
    },
    autoSell(i) {
        if (this.slots.length <= i) return "";
        return this.slots[i].autoSell();
    },
    toggleAuto(i) {
        return this.slots[i].autoSellToggle();
    },
    workersUsed(type) {
        const workers = this.slots.map(s=>s.item.gcost);
        const workerFlat = flattenArray(workers);
        return workerFlat.filter(w=>w === type).length;
    },
    materialUsage() {
        const mats = flattenArray(...([this.slots.map(s=>s.item.material())]))
        const uniqueMats = [...new Set(mats)];
        return uniqueMats;
    },
    freeSlots() {
        return this.maxSlots - this.slots.length;
    },
    purgeSlot(recipeID) {
        const slot = this.slots.findIndex(s=>s.itemid === recipeID);
        this.slots.splice(slot,1);
        this.slots.forEach((s,i) => s.slotNum = i);
        this.adjustMinTime();
        refreshSideWorkers();
        recipeList.canCraft();
        checkCraftableStatus();
    },
    showAutoSell() {
        this.slots.forEach(slot => {
            if (slot.item.recipeType === "normal") $(`#asAuto${slot.slotNum}`).show();
        })
    },
    anyAutoSell() {
        //we use this in the tutorial
        return this.slots.some(as=>as.autoSell() != "None");
    }
}

const $actionSlots = $("#actionSlots");

class actionSlotVisualSlotTracking {
    constructor(id,status,mastered) {
        this.id = id;
        this.status = status;
        this.mastered = mastered;
    }
    addReference(i) {
        this.timeRef = $(`#ASBar${i} .ASProgressBarTimer`);
        this.progressRef = $(`#ASBarFill${i}`);
    }
}

function newActionSlot(slot) {
    const d = $("<div/>").addClass("ASBlock");
    $("<div/>").addClass("ASName").attr("id","asSlotName"+slot.slotNum).html(slot.itemPicName()).appendTo(d);
    const d2 = $("<div/>").addClass("ASCancel").data("slotNum",slot.slotNum).appendTo(d);
    $("<div/>").addClass("ASCancelText tooltip").attr({"data-tooltip": "cancel_craft"}).data("slotNum",slot.slotNum).html(`${miscIcons.cancelSlot}`).appendTo(d2);
    const d3 = $("<div/>").addClass("ASProgressBar").attr("id","ASBar"+slot.slotNum).appendTo(d);
        const d3a = $("<div/>").addClass("ASProgressBarTimer tooltip").appendTo(d3);
        if (slot.status === slotState.NEEDMATERIAL) d3a.addClass("matsNeeded").attr({"data-tooltip": "materials_needed"}).html(miscIcons.alert);
    const s3 = $("<span/>").addClass("ProgressBarFill").attr("id","ASBarFill"+slot.slotNum).appendTo(d3);
    if (slot.isMastered()) s3.addClass("ProgressBarFillMaster");
    const d4 = $("<div/>").addClass("ASauto tooltip").attr("data-tooltip", `autosell_${slot.autoSell().toLowerCase()}`).attr("id","asAuto"+slot.slotNum).data("slotNum",slot.slotNum).html(miscIcons.autoSell).appendTo(d);
    if (slot.autoSell() !== "None") d4.addClass("ASautoEnabled"+slot.autoSell());
    if (slot.isBuildingMaterial() || !Shop.alreadyPurchased("AL3000")) d4.hide();
    if (!slot.resList) return d;
    const d5 = $("<div/>").addClass("asRes").attr("id","asRes"+slot.slotNum).appendTo(d);
    slot.resList().forEach(type => {
        $("<div/>").addClass("asResIcon tooltip").attr({"data-tooltip":`${type}_worker`}).html(miscIcons[type]).appendTo(d5);
    });
    if (slot.item.recipeType === "normal") {
        slot.matList().forEach(m => {
            const matIcon = $("<div/>").addClass("asResIcon asMatIcon tooltip").attr({"id":"asMat"+slot.slotNum,"data-tooltip":"material_desc","data-tooltip-value":m.id}).html(ResourceManager.materialIcon(m.id)).appendTo(d5);
            if (m.id === "M001") matIcon.attr({"data-tooltip":"gold_value","data-tooltip-value":formatWithCommas(m.amt)});
            if (slot.isMastered()) matIcon.hide();
        });
    }
    return d;
}

function newEmptyActionSlot() {
    const d = $("<div/>").addClass("ASBlock");
    const d1 = $("<div/>").addClass("ASName ASEmpty").appendTo(d);
        $("<div/>").addClass("ASEmptyIcon").html(`${miscIcons.emptySlot}`).appendTo(d1);
        $("<div/>").addClass("ASEmptyText").html(`Empty Slot`).appendTo(d1);
    return d;
}

const actionSlotVisualManager = {
    slots : [],
    slotCount : 0,
    disableRefresh : false,
    updateSlots() {
        if (this.disableRefresh) return;
        //slots changed, just redraw everything
        if (this.slots.length !== actionSlotManager.slots.length || this.slotCount !== actionSlotManager.maxSlots) {
            this.slotCount = actionSlotManager.maxSlots;
            this.slots = [];
            $actionSlots.empty();
            actionSlotManager.slots.forEach((slot,i) => {
                const newSlot = new actionSlotVisualSlotTracking(slot.item.id,slot.status,slot.isMastered());
                $actionSlots.append(newActionSlot(slot));
                newSlot.addReference(i);
                this.slots.push(newSlot);
            });
            for (let i=0;i<actionSlotManager.freeSlots();i++) {
                $actionSlots.append(newEmptyActionSlot());
            }
            return;
        }
        //otherwise let's just update what we have....
        actionSlotManager.slots.forEach((slot,i) => {
            const compareSlot = this.slots[i];
            if (compareSlot.status === slotState.NEEDMATERIAL && slot.status === slotState.CRAFTING) {
                //update for time format
                compareSlot.timeRef.removeClass("matsNeeded").attr({"data-tooltip": "remaining_time"}).html(miscIcons.time + msToTime(slot.timeRemaining()));
                compareSlot.status = slotState.CRAFTING;
            }
            else if (compareSlot.status === slotState.CRAFTING && slot.status === slotState.NEEDMATERIAL) {
                compareSlot.timeRef.addClass("matsNeeded").attr({"data-tooltip": "materials_needed"}).html(miscIcons.alert);
                compareSlot.progressRef.css('width', '0%');
                compareSlot.status = slotState.NEEDMATERIAL;
            }
            if (compareSlot.status === slotState.CRAFTING) {
                compareSlot.progressRef.css('width', slot.progress);
                compareSlot.timeRef.attr({"data-tooltip": "remaining_time"}).html(miscIcons.time + msToTime(slot.timeRemaining()));
            }
            if (slot.isMastered() && !compareSlot.mastered) {
                compareSlot.mastered = true;
                $("#ASBarFill"+slot.slotNum).addClass("ProgressBarFillMaster");
                $("#asMat"+slot.slotNum).hide();
            } 
        });
    },
    updateAutoSell() {
        $(".ASauto").removeClass("ASautoEnabledCommon ASautoEnabledGood ASautoEnabledGreat ASautoEnabledEpic")
        actionSlotManager.slots.forEach(slot => {
            const rarity = slot.autoSell();
            $("#asAuto"+slot.slotNum).addClass("ASautoEnabled"+rarity).attr("data-tooltip",`autosell_${rarity.toLowerCase()}`);
        });
    }
}

function refreshInventoryAndMaterialPlaces() {
    refreshInventoryPlaces();
    //grab ALL the materials we might have consumed and just update where they might show up
    actionSlotManager.materialUsage().forEach(matID => {
        refreshMaterial(matID);
    });
}