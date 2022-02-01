"use strict";

const $fuseBuilding = $("#fuseBuilding");

class fuse {
    constructor(uniqueID) {
        const props = uniqueIDProperties(uniqueID);
        Object.assign(this, props);
        this.recipe = recipeList.idToItem(this.id);
        this.fuseTime = 0;
        this.started = false;
        this.ready = false;
    }
    createSave() {
        const save = {};
        save.fuseTime = this.fuseTime;
        save.started = this.started;
        save.uniqueID = this.uniqueID;
        return save;
    }
    loadSave(save) {
        if (save.fuseTime !== undefined) this.fuseTime = save.fuseTime;
        if (save.started !== undefined) this.started = save.started;
    }
    addTime(ms) {
        this.fuseTime = Math.min(this.fuseTime+ms,this.getMaxFuse());
        if (this.fuseComplete() && !this.ready) {
            ToastManager.renderToast('fusion_completed', rarities[this.rarity].toLowerCase(), recipeList.idToItem(this.id).name);
            refreshTownHasEvents();
            this.ready = true;
        }
    }
    getMaxFuse() {
        return Math.floor(this.recipe.craftTime*this.rarity*Museum.craftTime(this.recipe.id));
    }
    timeRemaining() {
        return this.getMaxFuse() - this.fuseTime;
    }
    fuseComplete() {
        if (this.notStarted()) return false;
        return this.fuseTime === this.getMaxFuse();
    }
    increaseRarity() {
        this.rarity += 1;
        this.uniqueID = this.id+"_"+this.rarity+"_"+this.sharp;
    }
    notStarted() {
        return !this.started;
    }
}

const FusionManager = {
    slots : [],
    lvl : 1,
    fuseNum : 0,
    createSave() {
        const save = {};
        save.lvl = this.lvl;
        save.slots = [];
        this.slots.forEach(slot => {
            save.slots.push(slot.createSave());
        });
        return save;
    },
    loadSave(save) {
        save.slots.forEach(s => {
            const slot = new fuse(s.uniqueID);
            slot.loadSave(s);
            slot.fuseID = this.fuseNum;
            this.fuseNum += 1;
            this.slots.push(slot);
        });
        if (save.lvl !== undefined) this.lvl = save.lvl;
    },
    addFuse(uniqueid) {
        if (!Inventory.hasThree(uniqueid)) return;
        if (this.slots.length === this.maxSlots()) {
            ToastManager.renderToast("no_fuse_slots");
            return;
        }
        const fuseProps = uniqueIDProperties(uniqueid);
        if (ResourceManager.materialAvailable("M001") < this.getFuseCost(fuseProps,1)) {
            ToastManager.renderToast("cant_afford_fuse");
            return;
        }
        ResourceManager.deductMoney(this.getFuseCost(fuseProps,1));
        Inventory.removeFromInventoryUID(uniqueid,true);
        Inventory.removeFromInventoryUID(uniqueid,true);
        Inventory.removeFromInventoryUID(uniqueid,true);
        const newFuse = new fuse(uniqueid);
        newFuse.fuseID = this.fuseNum;
        this.fuseNum += 1;
        this.slots.push(newFuse);
        refreshFuseSlots();
        refreshPossibleFuse();
        return newFuse.fuseID;
    },
    fuseByID(fuseID) {
        return this.slots.find(f => f.fuseID === fuseID);
    },
    startFuse(fuseid) {
        const fuse = this.fuseByID(fuseid);
        fuse.increaseRarity();    
        fuse.started = true;
        refreshFuseSlots();
        refreshInventoryPlaces();
    },
    cancelFuse(fuseid) {
        const fuse = this.fuseByID(fuseid);
        if (fuse.notStarted()) {
            if (Inventory.full(3)) {
                ToastManager.renderToast("fuse_inv_full");
                return;
            }
            ResourceManager.addMaterial("M001",this.getFuseCost(fuse,1));
            Inventory.addFuseToInventory(fuse,true);
            Inventory.addFuseToInventory(fuse,true);
            Inventory.addFuseToInventory(fuse,true);
        }
        this.slots = this.slots.filter(f=>f.fuseID !== fuseid);
        refreshFuseSlots();
        refreshPossibleFuse();
    },
    addTime(ms) {
        this.slots.forEach(fuse => {
            if (fuse.started) fuse.addTime(ms);
        });
        if (lastTab === "townsTab" && TownManager.lastBldg === "fusion") refreshFuseBars();
    },
    getFuseCost(fuse,rarityBoost=0) {
        const item = recipeList.idToItem(fuse.id);;
        return 4*item.value*(fuse.rarity+rarityBoost);
    },
    aFuseIsDone() {
        return this.slots.some(f=>f.fuseComplete());
    },
    collectFuse(fuseID) {
        const slot = this.slots.find(f=>f.fuseID === fuseID);
        if (slot === undefined || !slot.fuseComplete()) return;
        if (Inventory.full()) {
            ToastManager.renderToast("fuse_inv_full");
            return;
        }
        Inventory.addFuseToInventory(slot);
        this.slots = this.slots.filter(f=>f.fuseID !== fuseID);
        refreshFuseSlots();
        refreshTownHasEvents();
    },
    maxSlots() {
        const firstUpgrade = Shop.alreadyPurchased("AL3006") ? 1 : 0;
        const secondUpgrade = Shop.alreadyPurchased("AL3012") ? 1 : 0;
        return 2+firstUpgrade+secondUpgrade;
    },
    addLevel() {
        this.lvl += 1;
        refreshFuseSlots();
    },
    getMaxFuse(uniqueIDProperties) {
        //this takes a uniqueIDProperties return (which is only from the fusion creation screen) to give fuse time
        const recipe = recipeList.idToItem(uniqueIDProperties.id);
        return recipe.craftTime*uniqueIDProperties.rarity*Museum.craftTime(recipe.id);
    }
}

function initiateFusionBldg() {
    $fuseBuilding.show();
    refreshFuseSlots();
    generateFusionHeader();
    refreshPossibleFuse();
}

function createFuseBar(fuse) {
    const fusePercent = fuse.fuseTime/fuse.getMaxFuse();
    const fuseAmt = msToTime(fuse.getMaxFuse()-fuse.fuseTime);
    const fuseWidth = (fusePercent*100).toFixed(1)+"%";
    const d1 = $("<div/>").addClass("fuseBarDiv").attr("id","fuseBarDiv"+fuse.fuseID);
    const d1a = $("<div/>").addClass("fuseBar").attr("data-label",fuseAmt).attr("id","fuseBar"+fuse.fuseID);
    const s1 = $("<span/>").addClass("fuseBarFill").attr("id","fuseFill"+fuse.fuseID).css('width', fuseWidth);
    return d1.append(d1a,s1);
}

function refreshFuseBars() {
    FusionManager.slots.forEach(fuse => {
        if (fuse.fbv === undefined) fuse.fbv = $("#fuseBarDiv"+fuse.fuseID);
        if (fuse.fsc === undefined) fuse.fsc = $("#fuseSlotCollect"+fuse.fuseID);
        if (fuse.fb  === undefined) fuse.fb  = $("#fuseBar"+fuse.fuseID);
        if (fuse.ff  === undefined) fuse.ff  = $("#fuseFill"+fuse.fuseID);
        if (fuse.fuseComplete()) {
            fuse.fbv.hide();
            fuse.fsc.show();
            return;
        }
        if (fuse.notStarted()) return;
        const fusePercent = fuse.fuseTime/fuse.getMaxFuse();
        const fuseAmt = msToTime(fuse.getMaxFuse()-fuse.fuseTime);
        const fuseWidth = (fusePercent*100).toFixed(1)+"%";
        fuse.fb.attr("data-label",fuseAmt);
        fuse.ff.css('width', fuseWidth);
    });
}

const $fuseSlots = $("#fuseSlots");
const $fuseHeader = $("#fuseHeader");
const $fuseList = $("#fuseList");

function refreshFuseSlots() {
    $fuseSlots.empty();
    // Fusion Slots Cards
    const fusionCardsContainer = $("<div/>").addClass(`fusionCardsContainer`).appendTo($fuseSlots);
    FusionManager.slots.forEach(slot => {
        slot.fbv = undefined;
        slot.fsc = undefined;
        slot.fb  = undefined;
        slot.ff  = undefined;
        const d1 = $("<div/>").addClass("fuseSlot").addClass("R"+slot.rarity).addClass("ctrlClickItem").data("rid",slot.id);
        const d2 = $("<div/>").addClass("fuseSlotName itemName").html(slot.name);
        const d3 = $("<div/>").addClass("itemLevel").html(recipeList.idToItem(slot.id).itemLevel());
        const d4 = createFuseBar(slot);
        const d5 = $("<div/>").addClass("fuseSlotCollect actionButtonCard").attr("id","fuseSlotCollect"+slot.fuseID).attr("fuseid",slot.fuseID).html(displayText("fusion_slot_collect_fuse_button")).hide();
        const d6 = $("<div/>").addClass("fuseSlotStart actionButtonCard").attr("id","fuseSlotStart"+slot.fuseID).attr("fuseid",slot.fuseID).html(displayText("fusion_slot_start_fuse_button")).hide();
        const d7 = $('<div/>').addClass("fuseCloseContainer");
            const d7a = $('<div/>').addClass("fuseClose tooltip").attr({"data-tooltip": "fusion_remove", "fuseid": slot.fuseID}).html(`<i class="fas fa-times"></i>`).appendTo(d7);
        const d8 = $('<div/>').addClass("fuseRarityContainer");
            $("<div/>").addClass(`fuseRarity RT${slot.rarity} tooltip`).attr({"data-tooltip": `rarity_${rarities[slot.rarity].toLowerCase()}`}).html(miscIcons.rarity).appendTo(d8);
        if (slot.fuseComplete()) {
            d4.hide();
            d5.show();
            d7.hide();
        }
        if (!slot.notStarted()) d7a.attr({"data-tooltip": "fusion_active_remove"});
        if (slot.notStarted()) {
            d4.hide();
            d6.show();
            $("<div/>").addClass("fuseRaritySeparator").html('<i class="fas fa-arrow-right"></i>').appendTo(d8);
            $("<div/>").addClass(`fuseRarity RT${slot.rarity + 1} tooltip`).attr({"data-tooltip": `rarity_${rarities[slot.rarity + 1].toLowerCase()}`}).html(miscIcons.rarity).appendTo(d8);
        }
        d1.append(d2,d3,d8,d4,d5,d6,d7);
        fusionCardsContainer.append(d1);
    });
    for (let i=0;i<FusionManager.maxSlots()-FusionManager.slots.length;i++) {
        const d4 = $("<div/>").addClass("fuseSlot fuseSlotEmpty");
        const d5 = $("<div/>").addClass("itemLevel");
        const d6 = $("<div/>").addClass("fuseSlotName itemName");
            $("<div/>").addClass("fuseSlotNameIcon").html(miscIcons.emptySlot).appendTo(d6)
            $("<div/>").addClass("fuseSlotNameTitle").html(displayText("fusion_slot_empty")).appendTo(d6)
        const d7 = $("<div/>").addClass("fuseRarityContainer");
            $("<div/>").addClass("fuseRarity").appendTo(d7);
            $("<div/>").addClass("fuseRaritySeparator").html('<i class="fas fa-arrow-right"></i>').appendTo(d7);
            $("<div/>").addClass("fuseRarity").appendTo(d7);
        const d8 = $("<div/>").addClass("fuseSlotButton");
        d4.append(d5,d6,d7,d8);
        fusionCardsContainer.append(d4);
    }
}

function generateFusionHeader() {
    $fuseHeader.empty();
    // Possible Fusions Header
    const possibleFusionHeaderContainer = $("<div/>").addClass(`possibleFusionHeaderContainer`).prependTo($fuseHeader);
    const possibleFusionHeader = $("<div/>").addClass(`possibleFusionHeader`).appendTo(possibleFusionHeaderContainer);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(possibleFusionHeader);
        $("<div/>").addClass("headingTitle").html(displayText("header_fusion_possible_fuse_title")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("header_fusion_possible_fuse_desc")).appendTo(headingDetails);
}

function refreshPossibleFuse() {
    $fuseList.empty();
    // Possible Fusions Cards
    const d2 = $("<div/>").addClass('possibleFuseHolder');
    const rarities = ["rarity_common","rarity_good","rarity_great","rarity_epic"];
    if(Inventory.getFusePossibilities().length === 0) $("<div/>").addClass("emptyContentMessage").html(displayText("fusion_possible_empty")).appendTo($fuseList);
    if(Inventory.getFusePossibilities().length > 0) {
        Inventory.getFusePossibilities().forEach(f => {
            const d3 = $("<div/>").addClass("possibleFusegroup");
            //Fuse Select Header
            const fuseRarity = displayText("fusion_possible_fuse_rarity").replace("{0}",displayText(`${rarities[f.rarity]}`));
            const d4 = $("<div/>").addClass("possibleFusegroupHeader").addClass("possibleFuseRarity"+f.rarity).html(fuseRarity).appendTo(d3);
            // Fuse Select Item Content
            const fuseSelect = $("<div/>").addClass(`fuseSelect R${f.rarity-1}`).addClass("ctrlClickItem").data("rid",f.id).appendTo(d3);
                const d5 = $("<div/>").addClass("possibleFuse itemName").html(recipeList.idToItem(f.id).itemPicName());
                const d6 = $("<div/>").addClass("possibleFuse itemLevel").html(recipeList.idToItem(f.id).itemLevel());
                const d6a = $("<div/>").addClass("possibleFuse itemRarity").addClass(`RT${f.rarity-1} tooltip`).attr({"data-tooltip": `${rarities[f.rarity-1].toLowerCase()}`}).html(miscIcons.rarity);
                const d7 = $("<div/>").addClass("gearStat tooltip").attr("data-tooltip","fuse_time").html(`<i class="fas fa-clock"></i>`);
                    $("<div/>").addClass("statValue").html(msToTime(FusionManager.getMaxFuse(f))).appendTo(d7);
                const d8 = $("<div/>").addClass("fuseStart actionButtonCardCost").attr("uniqueid",f.uniqueID);
                    $("<div/>").addClass("actionButtonCardText").html(displayText("fusion_possible_assign_button")).appendTo(d8);
                    $("<div/>").addClass("actionButtonCardValue tooltip").attr({"data-tooltip": "gold_value", "data-tooltip-value": formatWithCommas(FusionManager.getFuseCost(f,0))}).html(`${ResourceManager.materialIcon("M001")}${formatToUnits(FusionManager.getFuseCost(f),2)}`).appendTo(d8);
            fuseSelect.append(d5,d6,d6a,d7,d8)
            d2.append(d3);
        });
    }
    $fuseList.append(d2);
}
    
$(document).on('click', '.fuseStart', (e) => {
    e.preventDefault();
    destroyTooltip();
    const uniqueid = $(e.currentTarget).attr("uniqueid");
    const fuseid = FusionManager.addFuse(uniqueid); //this stages fuse too, we just return fuseid for this
    if (e.shiftKey) FusionManager.startFuse(fuseid);
});

$(document).on('click', '.fuseClose', (e) => {
    e.preventDefault();
    const fuseid = parseInt($(e.currentTarget).attr("fuseid"));
    FusionManager.cancelFuse(fuseid);
    destroyTooltip();
})

$(document).on('click', '.fuseSlotStart', (e) => {
    e.preventDefault();
    const fuseid = parseInt($(e.currentTarget).attr("fuseid"));
    FusionManager.startFuse(fuseid);
});

$(document).on('click', '.fuseSlotCollect', (e) => {
    e.preventDefault();
    const id = parseInt($(e.currentTarget).attr("fuseid"));
    FusionManager.collectFuse(id);
});