"use strict";

const synthToggle = Object.freeze({DESYNTH:0,RESYNTH:1});

const $synthSide = $("#synthSide");

const SynthManager = {
    slot : null,
    setting : synthToggle.DESYNTH,
    lvl : 1,
    boostEnable : false,
    fuel : 0,
    fuelTime : 0,
    createSave() {
        const save = {};
        save.lvl = this.lvl;
        save.fuel = this.fuel;
        return save;
    },
    loadSave(save) {
        if (save.lvl !== undefined) this.lvl = save.lvl;
        if (save.fuel !== undefined) this.fuel = save.fuel;
    },
    addTime(ms) {
        if (!this.boostEnable) {
            this.fuelTime = 0;
            return;
        }
        this.fuelTime += ms;
        const needRefresh = this.fuelTime >= 1000;
        while (this.fuelTime > 1000) {
            this.fuelTime -= 1000;
            this.fuel -= 1;
        }
        if (this.fuel <= 0) {
            this.fuel = 0;
            refreshSynthBoost();
            this.boostEnable = false;
            toggleSynthBoost();
        }
        if (needRefresh) refreshSynthBoost();
    },
    canSynth() {
        return Shop.alreadyPurchased("AL3009");
    },
    toggleStatus(status) {
        if (status === synthToggle.DESYNTH && this.setting !== synthToggle.DESYNTH) {
            this.setting = synthToggle.DESYNTH;
            refreshDesynth();
        }
        if (status === synthToggle.RESYNTH && this.setting !== synthToggle.RESYNTH && this.canSynth()) {
            this.setting = synthToggle.RESYNTH;
            refreshResynth();
        }
        refreshSynthStage();
    },
    toggleBoost() {
        if (!this.boostEnable && this.fuel === 0) return;
        this.boostEnable = !this.boostEnable;
        toggleSynthBoost();
    },
    addSynth(containerID) {
        this.slot = Inventory.containerToItem(containerID);
        refreshSynthStage();
    },
    removeSynth() {
        this.slot = null;
        initiateSynthBldg();
    },
    stageButton(id) {
        if (this.slot !== null && this.setting === synthToggle.DESYNTH) this.desynth();
        if (this.slot !== null && this.setting === synthToggle.RESYNTH) this.resynth(id);
    },
    desynth() {
        if (this.slot === null) return;
        this.fuel += this.amt();
        ToastManager.renderToast("synth_collect",this.amt());
        this.slot.rarity -= 1;
        if (this.slot.rarity === 0) this.slot = null;
        refreshSynthBoost(true);
        refreshSynthStage();
        refreshSynthInventory();
    },
    resynth() {
        if (this.slot === null) return;
        if (this.fuel < this.amt()) {
            ToastManager.renderToast("insufficient_resynth_mats");
            return;
        }
        this.fuel -= this.amt();
        this.slot.transform();
        refreshSynthBoost(true);
        refreshResynth();
        refreshSynthInventory();
    },
    amt() {
        if (this.setting === synthToggle.DESYNTH) {
            if (this.slot === null || this.slot.rarity === 0) return 0;
            return Math.floor(this.slot.item.craftTime / 4000 * miscLoadedValues.fuelGainRate[this.slot.rarity-1]);
        }
        if (this.setting === synthToggle.RESYNTH) {
            if (this.slot === null) return 0;
            if (this.slot.rarity === 0) return Math.max(1,Math.floor(this.slot.item.craftTime / 4000 * 0.5));
            return Math.floor(this.slot.item.craftTime / 4000 * miscLoadedValues.fuelGainRate[this.slot.rarity-1]);
        }
    },
    fuelActive() {
        return this.boostEnable;
    },
    updateSynthTimeRemainingTooltip() {
        this.remainingTime = msToTime(this.fuel*1000);
    }
}

const $synthBuilding = $("#synthBuilding");
const $synthListHeader = $("#synthListHeader");
const $synthListContainer = $("#synthListContainer");
const $synthBoost = $("#synthBoost");

function initiateSynthBldg() {
    $synthBuilding.show();
    generateSynthStageActions();
    generateSynthHeader();
    generateSynthBoost();
    refreshSynthStage();
    refreshSynthInventory();
    refreshSynthButtons();
    SynthManager.slot = null;
    if (SynthManager.setting === synthToggle.DESYNTH) refreshDesynth();
    if (SynthManager.setting === synthToggle.RESYNTH) refreshResynth();
}

function generateSynthHeader() {
    $synthListHeader.empty();
    const a = $("<div/>").addClass("contentHeader").appendTo($synthListHeader);
    const a1 = $("<div/>").addClass("contentHeading").appendTo(a);
        const a1a = $("<div/>").addClass("headingDetails").appendTo(a1);
        $("<div/>").addClass("headingTitle").html(displayText('header_synthesizer_desynth_title')).appendTo(a1a);
        $("<div/>").addClass("headingDescription").html(displayText('header_synthesizer_desynth_desc')).appendTo(a1a);
    const sortInventoryBtn = $("<div/>").addClass("actionButtonAnimDisabled actionButton tooltip").attr({id: "sortSynthInventory", "data-tooltip": "sort_inventory"}).html('<i class="fas fa-sort-size-up-alt"></i>').appendTo(a);
    $("<span/>").addClass("actionButtonTextRight").html(displayText("bank_sort_inventory_button")).appendTo(sortInventoryBtn);
}

function generateSynthStageActions() {
    $synthSide.empty();
    const synthSettings =  $("<div/>").addClass("synthSettingsContainer").appendTo($synthSide);
    const synthSettingOptions = $("<div/>").addClass("synthSettingsOptions").appendTo(synthSettings);
        $("<div/>").addClass("synthRewardHeader").html(displayText('synthesizer_settings_title')).appendTo(synthSettingOptions);
        $("<div/>").addClass("synthPowerSetting actionButton actionButtonAnimDisabled").attr({"id":"synthPowerDesynthesis"}).html(displayText('synthesizer_desynth_setting')).appendTo(synthSettingOptions);
        $("<div/>").addClass("synthPowerSetting synthPowerSettingLocked actionButton actionButtonAnimDisabled").attr({"id":"synthPowerResynthesis"}).html(`<i class='fas fa-lock-alt'></i>${displayText('universal_locked')}`).appendTo(synthSettingOptions);
    
    // Synth Slot
    $("<div/>").addClass("synthSlot").attr({"id":"synthSlot"}).appendTo($synthSide);

    //how it works
    const synthTutorial = $("<div/>").addClass("desynthRewards").appendTo($synthSide);
    $("<div/>").addClass("synthTutHeader").html(displayText("synthesizer_tutorial_head_title")).appendTo(synthTutorial);
    $("<div/>").addClass("synthTutDesc").attr("id","resynthTut").html(displayText("synthesizer_tutorial_resynth_desc")).appendTo(synthTutorial);
    $("<div/>").addClass("synthTutDesc").attr("id","desynthTut").html(displayText("synthesizer_tutorial_desynth_desc")).appendTo(synthTutorial);
}

function generateSynthBoost() {
    $synthBoost.empty();
    const header = $("<div/>").addClass("synthBoostHeaderContainer").appendTo($synthBoost);
        $("<div/>").addClass("synthBoostHeader").html(displayText("synthesizer_boost_header")).appendTo(header);
        $("<div/>").addClass("synthBoostHeaderIcon tooltip").attr({"data-tooltip": `synth_boost`}).html(miscIcons.question).appendTo(header);
    const actions = $("<div/>").addClass("synthBoostActionsContainer").appendTo($synthBoost);
        if (SynthManager.boostEnable) $("<div/>").addClass("synthBoostDesc synthBoostEnable").attr("id","synthBoostDesc").html(displayText("synthesizer_boost_disable")).appendTo(actions);
        else $("<div/>").addClass("synthBoostDesc synthBoostDisable").attr("id","synthBoostDesc").html(displayText("synthesizer_boost_enable")).appendTo(actions);
        $("<div/>").addClass("synthBoostCount tooltip").attr({"id":"synthBoostRemaining","data-tooltip":"synth_time_remaining","data-tooltip-value":"req"}).html(`${formatToUnits(SynthManager.fuel,2)} ${miscIcons.essence} Remaining`).appendTo(actions);
    SynthManager.updateSynthTimeRemainingTooltip();
}

function refreshSynthBoost(manual) {
    if (!SynthManager.boostEnable && !manual) return;
    if (lastTab !== "townsTab" && TownManager.lastBldg !== "synth") return;
    $("#synthBoostRemaining").html(`${formatToUnits(SynthManager.fuel,2)} ${miscIcons.essence} Remaining`);
    SynthManager.updateSynthTimeRemainingTooltip();
}

function toggleSynthBoost() {
    if (SynthManager.boostEnable) $("#synthBoostDesc").removeClass("synthBoostDisable").addClass("synthBoostEnable").html(displayText("synthesizer_boost_disable"));
    else $("#synthBoostDesc").removeClass("synthBoostEnable").addClass("synthBoostDisable").html(displayText("synthesizer_boost_enable"));
}

function refreshSynthInventory() {
    $synthListContainer.empty();
    const d1 = $("<div/>").addClass('synthListCardsContainer').appendTo($synthListContainer);
    if (Inventory.higherRarity().length === 0) $("<div/>").addClass("emptyContentMessage").html(displayText('synthesizer_inventory_empty')).appendTo($synthListContainer)
    Inventory.higherRarity().forEach(container => {
        if (container.item.type === "Trinkets" || container === SynthManager.slot) return;
        createSynthCard(container,false).appendTo(d1);
    });
};

function refreshSynthStage() {
    $("#synthSlot").empty();
    if (SynthManager.slot === null) {
        const itemdiv = $("<div/>").addClass("synthItem synthSlotEmpty");
        const d = $("<div/>").addClass("synthSlotEmpty itemName").appendTo(itemdiv);
            $("<div/>").addClass("synthSlotEmptyIcon").html(miscIcons.emptySlot).appendTo(d);
            $("<div/>").addClass("synthSlotEmptyTitle").html("Empty Slot").appendTo(d);
        $("<div/>").addClass("itemLevel").appendTo(itemdiv);
        $("<div/>").addClass("itemRarity").appendTo(itemdiv);
        $("<div/>").addClass("gearStat").html("<span/>").appendTo(itemdiv);
        $("<div/>").addClass("synthSlotEmptyButton").appendTo(itemdiv);
        $("#synthSlot").append(itemdiv);
        return;
    }
    createSynthStageCard(SynthManager.slot).appendTo($("#synthSlot"));
}

function refreshDesynth() {
    $("#desynthTut").show();
    $("#resynthTut").hide();
    if (SynthManager.setting === synthToggle.DESYNTH) {
        $(".synthPowerSetting").removeClass("synthPowerEnabled");
        $("#synthPowerDesynthesis").addClass("synthPowerEnabled");
    }
    refreshSynthStage();
}

function refreshResynth() {
    $("#desynthTut").hide();
    $("#resynthTut").show();
    if (SynthManager.setting === synthToggle.RESYNTH) {
        $(".synthPowerSetting").removeClass("synthPowerEnabled");
        $("#synthPowerResynthesis").addClass("synthPowerEnabled");
    }
    refreshSynthStage();
}

function refreshSynthButtons() {
    if (SynthManager.canSynth()) $("#synthPowerResynthesis").removeClass("synthPowerSettingLocked").html(displayText('synthesizer_synth_setting'));
}
    
//click synth on item in inventory
$(document).on('click', '.synthButton', (e) => {
    e.preventDefault();
    const id = parseInt($(e.currentTarget).data("containerID"));
    SynthManager.addSynth(id);
    if (e.shiftKey) {
        SynthManager.stageButton(id);
        SynthManager.removeSynth();
    }
    refreshSynthInventory();
});

//click deynth close button
$(document).on('click', '#synthRemove', (e) => {
    e.preventDefault();
    SynthManager.removeSynth();
    refreshSynthStage();
})

//click synth start button
$(document).on('click', '.synthSlotAction', (e) => {
    e.preventDefault();
    const id = $(e.currentTarget).data("mid");
    SynthManager.stageButton(id);
});

//change to Desynthesis
$(document).on('click', '#synthPowerDesynthesis', (e) => {
    e.preventDefault();
    SynthManager.toggleStatus(synthToggle.DESYNTH);
    refreshSynthInventory();
});

//change to Resynthesis
$(document).on('click', '#synthPowerResynthesis', (e) => {
    e.preventDefault();
    if (!SynthManager.canSynth()) return;
    SynthManager.toggleStatus(synthToggle.RESYNTH);
    refreshSynthInventory();
});

//toggle speed boost
$(document).on('click', '#synthBoostDesc', (e) => {
    e.preventDefault();
    SynthManager.toggleBoost();
});

function createSynthCard(container) {
    const itemdiv = $("<div/>").addClass("synthItem").addClass("R"+container.rarity).addClass("ctrlClickItem").data("rid",container.id);
    const itemName = $("<div/>").addClass("itemName").attr({"id": container.id, "r": container.rarity}).html(container.picName());
    const itemRarity = $("<div/>").addClass(`itemRarity RT${container.rarity} tooltip`).attr({"data-tooltip": `rarity_${rarities[container.rarity].toLowerCase()}`}).html(miscIcons.rarity);
    const itemLevel = $("<div/>").addClass("itemLevel").html(container.itemLevel());
    const itemProps = $("<div/>").addClass("equipStats");
    for (const [stat, val] of Object.entries(container.itemStat(0))) {
        if (val === 0) continue;
        const ed = $("<div/>").addClass("gearStat tooltip").attr("data-tooltip", stat).appendTo(itemProps);
            $("<div/>").addClass(`${stat}_img`).html(miscIcons[stat]).appendTo(ed);
            $("<div/>").addClass(`${stat}_integer statValue`).html(val).appendTo(ed);
    };
    const synthActions = $("<div/>").addClass("synthActions");
        $("<div/>").addClass("synthButton actionButtonCard").data("containerID",container.containerID).html(displayText('synthesizer_assign_button')).appendTo(synthActions);
    if (container.item.type === "Trinkets") {
        synthActions.empty();
        $("<div/>").addClass("synthNotAvailable").html(displayText('synthesizer_synth_unavailable')).appendTo(synthActions);
    }
    return itemdiv.append(itemName,itemRarity,itemLevel,itemProps,synthActions);
}

function createSynthStageCard(container) {
    const itemdiv = $("<div/>").addClass("synthItem").addClass("R"+container.rarity).addClass("ctrlClickItem").data("rid",container.id);
    const itemName = $("<div/>").addClass("itemName").attr({"id": container.id, "r": container.rarity}).html(container.picName());
    const itemLevel = $("<div/>").addClass("itemLevel").html(container.itemLevel());
    const itemRarity = $("<div/>").addClass(`itemRarity RT${container.rarity} tooltip`).attr({"data-tooltip": `rarity_${rarities[container.rarity].toLowerCase()}`}).html(miscIcons.rarity);
    const itemProps = $("<div/>").addClass("equipStats");
    const stageRemove = $('<div/>').addClass("synthRemove").attr("id","synthRemove").html(`<i class="fas fa-times"></i>`);
    for (const [stat, val] of Object.entries(container.itemStat(false))) {
        if (val === 0) continue;
            const ed = $("<div/>").addClass("gearStat tooltip").attr("data-tooltip", stat).appendTo(itemProps);
                $("<div/>").addClass(`${stat}_img`).html(miscIcons[stat]).appendTo(ed);
                $("<div/>").addClass(`${stat}_integer statValue`).html(val).appendTo(ed);
    };
    const synthButton = $("<div/>").addClass("synthSlotAction");
    if (SynthManager.setting === synthToggle.RESYNTH) { 
        synthButton.addClass('actionButtonCardCost');
        $("<div/>").addClass('actionButtonCardText').html(displayText('synthesizer_synth_assign_button')).appendTo(synthButton);
        $("<div/>").addClass('actionButtonCardValue tooltip').attr({"data-tooltip":"synth_essence"}).html(`${miscIcons.essence} ${SynthManager.amt()}`).appendTo(synthButton);
    }
    if (SynthManager.setting === synthToggle.DESYNTH) {
        synthButton.addClass('actionButtonCardCost');
        $("<div/>").addClass('actionButtonCardText').html(displayText('synthesizer_desynth_assign_button')).appendTo(synthButton);
        $("<div/>").addClass('actionButtonCardValue tooltip').attr({"data-tooltip":"synth_essence"}).html(`${miscIcons.essence} ${SynthManager.amt()}`).appendTo(synthButton);
    }
    return itemdiv.append(itemName,itemLevel,itemRarity,itemProps,stageRemove,synthButton);
};

$(document).on("click","#sortSynthInventory",(e) => {
    e.preventDefault();
    Inventory.sortInventory();
});
