"use strict";

const HotKeys = {
    keys : [],
    assigning : null,
    enabled : 1,
    createSave() {
        const save = {};
        save.keys = [];
        this.keys.forEach(key => {
            save.keys.push(key.createSave());
        })
        save.enabled = this.enabled;
        return save;
    },
    loadSave(save) {
        save.keys.forEach(key => {
            const keyid = this.keys.find(k=>k.id === key.id);
            if (!keyid) return;
            keyid.loadSave(key);
        })
        this.enabled = save.enabled;
    },
    addKey(key) {
        this.keys.push(key);
    },
    setEnabled() {
        this.enabled = 1;
    },
    setDisabled() {
        this.enabled = 0;
    },
    allDefault() {
        this.keys.forEach(key=>key.reset());
    },
    unassignKey(kid) {
        const akey = this.keys.find(k=>k.id === kid);
        akey.unassign();
    },
    defaultKey(kid) {
        const akey = this.keys.find(k=>k.id === kid);
        akey.reset();
    },
    assignKey(code) {
        this.keys.forEach(k=>k.unassignIf(code));
        const akey = this.keys.find(k=>k.id === this.assigning);
        akey.assign(code);
        this.assigning = null;
    },
    startAssign(kid) {
        this.assigning = kid;
    },
    testKey(keyCode) {
        if (HotKeys.assigning !== null) {
            this.assignKey(keyCode);
            showHotkey();
            return;
        }
        if (settings.dialogStatus === 1) return;
        if (!this.enabled) return;
        const key = this.keys.find(k=>k.key === keyCode);
        if (!key || !key.canSee()) return;
        $(".tablinks").removeClass("tab-selected");
        $(`#${key.bigTab}`).addClass("tab-selected");
        if (key.type === "Inventory" && key.subtype === "Sort") Inventory.sortInventory();
        if (lastTab !== key.tabName) openTab(key.tabName);
        //dea
        if (key.type === "Merchant") {
            if (lastTab !== key.tabName) {
                Merchant.lastTab = key.subtype;
                return;
            }
            if (key.subtype === "Order" && Merchant.lastTab !== "Order") clickOrder();
            if (key.subtype === "Mastery" && Merchant.lastTab !== "Mastery") clickMastery();            
        }
        if (key.type === "Recipes") openTab(key.tabName);
        if (key.type === "Heroes") {
            if (lastTab === key.tabName && key.subtype === "Overview" && HeroManager.heroView === null) return;
            if (lastTab === key.tabName && key.subtype === HeroManager.heroView) return;
            if (lastTab !== key.tabName) {
                openTab(key.tabName);
            }
            if (key.subtype === "Overview") refreshHeroOverview();
            else showHero(key.subtype);
        }
        if (key.type === "Adventure") {
            if (lastTab !== key.tabName) openTab(key.tabName);
            if (key.subtype === "Overview" && DungeonManager.areaView !== null) {
                dungeonsTabClicked();
                return;
            }
            if (AreaManager.areaView !== key.subtype) {
                AreaManager.areaView = key.subtype;
                screenDirectDungeon(key.subtype);
            }
        }
        if (key.type === "Town") {
            $(".buildingName").removeClass("selected");
            $(`#${key.subtype}Bldg`).addClass("selected");
            triggerBuilding(false,key.subtype);
        }
    }
}

class Hotkey {
    constructor (props) {
        Object.assign(this, props);
        this.ogkey = this.key;
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.key = this.key;
        return save;
    }
    loadSave(save) {
        this.key = save.key;
    }
    reset() {
        this.key = this.ogkey;
    }
    unassign() {
        this.key = "Not Assigned"
    }
    assign(code) {
        this.key = code;
    }
    unassignIf(code) {
        if (this.key === code) this.unassign();
    }
    canSee() {
        if (this.openedBy === null) return true;
        return Shop.alreadyPurchased(this.openedBy);
    }
}

$(document).on("keypress", (e) => {
    HotKeys.testKey(e.key);
});

function showHotkey(skipAnimation) {
    $("#hotkeyAllDefault").empty().html(displayText("hotkey_all_default"));
    $("#hotkeyList").empty();
    HotKeys.keys.forEach(key => {
        if (!key.canSee()) return;
        const d = $("<div/>").addClass("hotkeyRow").appendTo($("#hotkeyList"))
        $("<div/>").addClass("hotkeyDesc").html(key.desc).appendTo(d);
        const keyText = typeof(key.key) === "string" ? key.key.toUpperCase() : key.key;
        const d1 = $("<div/>").addClass("hotkeyKey").data("kid",key.id).html(keyText).appendTo(d);
        if (HotKeys.assigning === key.id) d1.addClass("hotkeyKeyAssigning");
        const buttonsContianer = $("<div/>").addClass("hotkeyButtonsContainer").appendTo(d);
            const unassignBtn = $("<div/>").addClass("actionButton hotkeyUnassign").data("kid",key.id).html(displayText("hotkey_unassign")).appendTo(buttonsContianer);
            const resetBtn = $("<div/>").addClass("actionButton hotkeyDefault").data("kid",key.id).html(displayText("hotkey_default")).appendTo(buttonsContianer);
        if (skipAnimation) {
            unassignBtn.addClass("actionButtonAnimDisabled");
            resetBtn.addClass("actionButtonAnimDisabled");
        }
    });
}

// Hotkey Setting

$(document).on("change", ".hotkeyPrefSelection", (e) => {
    $(e.target).attr("checked", "checked")
    HotKeys.enabled = parseInt($(e.target).val())
});

//reset all to default
$(document).on('click', "#hotkeyAllDefault", (e) => {
    e.preventDefault();
    HotKeys.allDefault();
    showHotkey(true);
});

//unassign a key
$(document).on('click', ".hotkeyUnassign", (e) => {
    e.preventDefault();
    const kid = $(e.currentTarget).data("kid");
    HotKeys.unassignKey(kid);
    showHotkey(true);
});

//default a key
$(document).on('click', ".hotkeyDefault", (e) => {
    e.preventDefault();
    const kid = $(e.currentTarget).data("kid");
    HotKeys.defaultKey(kid);
    showHotkey(true);
});

//click to assign a key
$(document).on('click', ".hotkeyKey", (e) => {
    e.preventDefault();
    const kid = $(e.currentTarget).data("kid");
    HotKeys.startAssign(kid);
    showHotkey(true);
});