"use strict";

const $tinkerBuilding = $("#tinkerBuilding");
const $tinkerCommands = $("#tinkerCommands");
const $tinkerTopContainer = $("#tinkerTopContainer");

const $tinkerBottomContainer = $("#tinkerBottomContainer");
const $tinkerScreenRecipes = $("#tinkerScreenRecipes");

class tinkerCommand {
    constructor(props) {
        Object.assign(this, props);
        this.time = 0;
        this.progress = 0;
        this.progressMax = 1000;
        this.lvl = 0;
        this.enabled = false;
        this.paidGold = false;
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.time = this.time;
        save.progress = this.progress;
        save.lvl = this.lvl;
        save.enabled = this.enabled;
        save.paidGold = this.paygold;
        return save;
    }
    loadSave(save) {
        this.time = save.time;
        this.progress = save.progress;
        this.lvl = save.lvl;
        this.enabled = save.enabled;
        this.paidGold = save.paidGold;
    }
    addTime(ms) {
        if (!this.enabled) return;
        this.time += ms;
        let needRefresh = false;
        while (this.enabled && this.time >= this.getTime()) {
            this.attemptStart();
            if (!this.paidGold) {
                this.time = 0;
                this.enabled = false;
                refreshCommandToggle(this);
                ToastManager.renderToast("tinker_disable");
                return;
            }
            this.time -= this.getTime();
            this.act();
            needRefresh = true;
        }
        refreshTinkerProgressBar(this);
        if (needRefresh) {
            refreshTinkerLvLBar(this);
            refreshTrinketCompleteCost(this);
            refreshTrinketResearchCost(this);
        }
    }
    attemptStart() {
        if (this.paidGold) return;
        if (!ResourceManager.available("M001",this.paidGoldAmt())) return;
        ResourceManager.addMaterial("M001",-this.paidGoldAmt());
        this.paidGold = true;
    }
    act() {
        this.paidGold = false;
        this.progress += 1;
        if (this.progress === 1000) {
            const recipeID = this.recipeUnlock[this.lvl];
            recipeList.unlockTrinketRecipe(recipeID);
            this.lvl += 1;
            this.progress = 0;
            refreshTinkerRecipes();
        }
    }    
    toggle() {
        this.enabled = !this.enabled;
    }
    getTime() {
        return this.timeCost[this.lvl];
    }
    paidGoldAmt() {
        if (this.lvl === 10) return 0;
        return this.goldCost[this.lvl];
    }
    completeCost() {
        return 10*(this.progressMax-this.progress)*this.paidGoldAmt();
    }
    completeResearch() {
        if (!ResourceManager.available("M001",this.completeCost())) return ToastManager.renderToast("tinker_research");
        ResourceManager.addMaterial("M001",-this.completeCost());
        const recipeID = this.recipeUnlock[this.lvl];
        recipeList.unlockTrinketRecipe(recipeID);
        this.lvl += 1;
        this.progress = 0;
        this.time = 0;
        if (this.lvl === 10) {
            refreshTinkerCommands();
            return;
        }
        refreshTinkerProgressBar(this);
        refreshTinkerLvLBar(this);
        refreshTrinketCompleteCost(this);
        refreshTrinketResearchCost(this);
    }
}

const TinkerManager = {
    commands : [],
    lvl : 0,
    createSave() {
        const save = {};
        save.lvl = this.lvl;
        save.commands = [];
        this.commands.forEach(c => save.commands.push(c.createSave()));
        return save;
    },
    loadSave(save) {
        save.commands.forEach(c => {
            const command = this.idToCommand(c.id);
            command.loadSave(c);
        });
        this.lvl = save.lvl;
    },
    addTime(ms) {
        this.commands.forEach(command => command.addTime(ms));
    },
    idToCommand(id) {
        return this.commands.find(a => a.id === id);
    },
    addCommand(action) {
        this.commands.push(action);
    },
    toggle(commandID) {
        const command = this.idToCommand(commandID);
        command.toggle();
    },
    completeResearch(commandID) {
        const command = this.idToCommand(commandID);
        command.completeResearch();
    },
    unlocked() {
        return TownManager.idToBuilding("TB006").status === 2;
    },
    addLevel() {
        return;
    }
}

function refreshTinkerCommands() {
    $tinkerCommands.empty();
    const tinkerCommandsContainer = $("<div/>").addClass("tinkerCommandsContainer").appendTo($tinkerCommands);
    const commands = TinkerManager.commands.filter(command => command.lvl !== 10);
    if (commands.length === 0) return $("<div/>").addClass("emptyContentMessage").html(displayText('tinker_command_research_empty')).appendTo($tinkerCommands);
    commands.forEach(command => createTinkerCommand(command).appendTo(tinkerCommandsContainer));
}

function generateTinkerHeader() {
    $tinkerTopContainer.empty();
    const tinkerHeader = $("<div/>").addClass(`contentHeader tinkerHeader`).appendTo($tinkerTopContainer);
        const headingDetails = $("<div/>").addClass("headingDetails").appendTo(tinkerHeader);
            $("<div/>").addClass("headingTitle").html(displayText("header_tinker_research_title")).appendTo(headingDetails);
            $("<div/>").addClass("headingDescription").html(displayText("header_tinker_research_desc")).appendTo(headingDetails);
}

function createTinkerCommand(command) {
    const d = $("<div/>").addClass("tinkerCommand");
    $("<div/>").addClass("tinkerCommandName").html(command.name).appendTo(d);
    const tinkerBars=  $("<div/>").addClass("tinkerBarsContainer").appendTo(d);
        createTinkerProgressBar(command).appendTo(tinkerBars);
        createTinkerLvlBar(command).appendTo(tinkerBars);
    const d1 = $("<div/>").addClass("tinkerCommandInline").data("cid",command.id).appendTo(d);
        if (command.enabled) {
            const toggle = $("<div/>").addClass("tinkerCommandToggle toggleEnabled").attr("id","ct"+command.id).html(`${miscIcons.toggleOn}`).appendTo(d1);
            $("<span/>").html(displayText('tinker_command_enabled')).appendTo(toggle);
        }
        else {
            const toggle = $("<div/>").addClass("tinkerCommandToggle toggleDisabled").attr("id","ct"+command.id).html(`${miscIcons.toggleOff}`).appendTo(d1);
            $("<span/>").html(displayText('tinker_command_disabled')).appendTo(toggle);
        }
    const d2 = $("<div/>").addClass("tinkerCommandCostContainer").appendTo(d);
        const researchCost = $("<div/>").addClass("tinkerCommandResearchCost").attr("id","tcrc"+command.id).appendTo(d2);
            $("<div/>").addClass("researchCostHeader").html(displayText('tinker_command_research_cost')).appendTo(researchCost);
            $("<div/>").addClass("researchCostValue actionButtonCardValue tooltip").attr({"data-tooltip": "gold_value", "data-tooltip-value": formatWithCommas(command.paidGoldAmt())}).html(`${miscIcons.gold} ${formatToUnits(command.paidGoldAmt(),2)}`).appendTo(researchCost);
        const completeButton = $("<div/>").addClass("completeCommand actionButtonCardCost").attr("id","tcc"+command.id).data("cid",command.id).appendTo(d2);
            $("<div/>").addClass("actionButtonCardText").html(displayText('tinker_command_research_complete')).appendTo(completeButton);
            $("<div/>").addClass("actionButtonCardValue tooltip").attr({"data-tooltip": "gold_value", "data-tooltip-value": formatWithCommas(command.completeCost())}).html(`${miscIcons.gold} ${formatToUnits(command.completeCost(),2)}`).appendTo(completeButton);
    return d;
}

function refreshTrinketCompleteCost(command) {
    const completeButton = $("#tcc"+command.id).empty();
        $("<div/>").addClass("actionButtonCardText").html(displayText('tinker_command_research_complete')).appendTo(completeButton);
        $("<div/>").addClass("actionButtonCardValue tooltip").attr({"data-tooltip": "gold_value", "data-tooltip-value": formatWithCommas(command.completeCost())}).html(`${miscIcons.gold} ${formatToUnits(command.completeCost(),2)}`).appendTo(completeButton);
}

function refreshTrinketResearchCost(command) {
    const researchCost = $("#tcrc"+command.id).empty();
        $("<div/>").addClass("researchCostHeader").html(displayText('tinker_command_research_cost')).appendTo(researchCost);
        $("<div/>").addClass("researchCostValue actionButtonCardValue tooltip").attr({"data-tooltip": "gold_value", "data-tooltip-value": formatWithCommas(command.paidGoldAmt())}).html(`${miscIcons.gold} ${formatToUnits(command.paidGoldAmt(),2)}`).appendTo(researchCost);
}

function createTinkerProgressBar(command) {
    const commandBarPercent = command.time/command.getTime();
    const commandBarText = msToTime(command.getTime()-command.time);
    const commandBarWidth = (commandBarPercent*100).toFixed(1)+"%";
    const options = {
        prefix: "commandTime",
        tooltip: "research_time",
        icon: miscIcons.commandTime,
        text: commandBarText,
        textID: "cb"+command.id,
        width: commandBarWidth,
        fill: "cbf"+command.id,
    }
    return generateProgressBar(options);
}

function refreshTinkerProgressBar(command) {
    const commandBarPercent = command.time/command.getTime();
    const commandBarText = msToTime(command.getTime()-command.time);
    const commandBarWidth = (commandBarPercent*100).toFixed(1)+"%";
    $(`#cb${command.id}`).html(commandBarText);
    $(`#cbf${command.id}`).css('width', commandBarWidth);
}

function createTinkerLvlBar(command) {
    const commandBarPercent = command.progress/1000;
    const commandBarWidth = (commandBarPercent*100).toFixed(1)+"%";
    const commandBarText = `Level ${command.lvl} (${commandBarWidth})`;
    const options = {
        prefix: "commandProgress",
        tooltip: "research_level",
        icon: miscIcons.commandProgress,
        text: commandBarText,
        textID: "cbp"+command.id,
        width: commandBarWidth,
        fill: "cbpf"+command.id,
    }
    return generateProgressBar(options);
}

function refreshTinkerLvLBar(command) {
    const commandBarPercent = command.progress/1000;
    const commandBarWidth = (commandBarPercent*100).toFixed(1)+"%";
    const commandBarText = `Level ${command.lvl} (${commandBarWidth})`;
    $(`#cbp${command.id}`).html(commandBarText);
    $(`#cbpf${command.id}`).css('width', commandBarWidth);
}

function initiateTinkerBldg () {
    $tinkerBuilding.show();
    generateTinkerHeader();
    refreshTinkerCommands();
    refreshTinkerRecipes();
}

//toggle command
$(document).on('click','.tinkerCommandInline', (e) => {
    e.preventDefault();
    const commandID = $(e.currentTarget).data("cid");
    TinkerManager.toggle(commandID);
    const command = TinkerManager.idToCommand(commandID);
    refreshCommandToggle(command);
});

//purchase advancement
$(document).on('click','.completeCommand', (e) => {
    e.preventDefault();
    const commandID = $(e.currentTarget).data("cid");
    TinkerManager.completeResearch(commandID);
    refreshTinkerRecipes();
});

function refreshCommandToggle(command) {
    if (command.enabled) {
        const toggle = $("#ct"+command.id).removeClass("toggleDisabled").addClass("toggleEnabled").html(`${miscIcons.toggleOn}`);
        $("<span/>").html(displayText('tinker_command_enabled')).appendTo(toggle);
    }
    else {
        const toggle = $("#ct"+command.id).removeClass("toggleEnabled").addClass("toggleDisabled").html(`${miscIcons.toggleOff}`);
        $("<span/>").html(displayText('tinker_command_disabled')).appendTo(toggle);
    }
}

function refreshTinkerRecipes() {
    $tinkerBottomContainer.empty();
    const tinkerHeader = $("<div/>").addClass(`contentHeader tinkerHeader`).appendTo($tinkerBottomContainer);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(tinkerHeader);
        $("<div/>").addClass("headingTitle").html(displayText("header_tinker_recipe_title")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("header_tinker_recipe_desc")).appendTo(headingDetails);
    $tinkerScreenRecipes.empty();
    const trinkets = recipeList.recipes.filter(r=>r.type === "Trinkets" && r.owned);
    trinkets.forEach(trinket => {
        const recipeCardInfo = $('<div/>').addClass('recipeCardInfo').append(recipeCardFront(trinket,true));
        const recipeCardContainer = $('<div/>').addClass('recipeCardContainer').data("recipeID",trinket.id).attr("id","rr"+trinket.id).append(recipeCardInfo)
        $tinkerScreenRecipes.prepend(recipeCardContainer);
    })
}