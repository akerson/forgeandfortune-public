"use strict";

const $museumBuilding = $("#museumBuilding");
const $museumRecipeTypes = $("#museumRecipeTypes");
const $museumRecipeContributions = $("#museumRecipeContributions");
const $museumRewards = $("#museumRewards");
const $museumInv = $("#museumInv");
const $museumTop = $(".museumTop");

const Museum = {
    lvl : 1,
    tabView : null,
    itemInspect : null,
    createSave() {
        const save = {};
        return save;
    },
    loadSave(save) {
    },
    checkSubmit(container) {
        const item = recipeList.idToItem(container.id);
        return item.museum[container.rarity][container.sharp];
    },
    possibleInventoryDonations() {
        return Inventory.nonblank().filter(i => i.item.type !== "Trinkets").filter(i => !this.checkSubmit(i));
    },
    completeByType(type) {
        const museumData = recipeList.filterByType(type).map(r => r.museum);
        return museumData.flat().flat().filter(Boolean).length;
    },
    donationCount() {
        return recipeList.recipes.filter(r=>r.recipeType === "normal" && r.type !== "Trinkets").map(r => r.museum).flat().flat().filter(Boolean).length;
    },
    donationMax() {
        return recipeList.recipes.filter(r=>r.recipeType === "normal" && r.type !== "Trinkets").length*11*4;
    },
    museumData(itemID) {
        return recipeList.idToItem(itemID).museum;
    },
    isCompleted(itemID) {
        return Museum.museumData(itemID).every(rarity => rarity.every(turnin => turnin === true));
    },
    donate(containerID) {
        if (!Inventory.hasContainer(containerID)) return;
        const container = Inventory.containerToItem(containerID);
        Inventory.removeContainerFromInventory(containerID);
        recipeList.idToItem(container.id).museum[container.rarity][container.sharp] = true;
    },
    commonCount(recipeID) {
        const type = ItemType.includes(recipeID) ? recipeID : recipeList.idToItem(recipeID).type;
        const items = recipeList.filterByType(type);
        return flattenArray(items.map(i=>i.museum[0])).filter(i=>i).length;
    },
    goodCount(recipeID) {
        const type = ItemType.includes(recipeID) ? recipeID : recipeList.idToItem(recipeID).type;
        const items = recipeList.filterByType(type);
        return flattenArray(items.map(i=>i.museum[1])).filter(i=>i).length;
    },
    greatCount(recipeID) {
        const type = ItemType.includes(recipeID) ? recipeID : recipeList.idToItem(recipeID).type;
        const items = recipeList.filterByType(type);
        return flattenArray(items.map(i=>i.museum[2])).filter(i=>i).length;
    },
    epicCount(recipeID) {
        const type = ItemType.includes(recipeID) ? recipeID : recipeList.idToItem(recipeID).type;
        const items = recipeList.filterByType(type);
        return flattenArray(items.map(i=>i.museum[3])).filter(i=>i).length;
    },
    craftTime(recipeID) {
        const completes = Math.floor(this.commonCount(recipeID)/11);
        return 1-0.04*completes;
    },
    goodChance(recipeID) {
        const completes = Math.floor(this.goodCount(recipeID)/11);
        return 1+0.2*completes;
    },
    greatChance(recipeID) {
        const completes = Math.floor(this.greatCount(recipeID)/11);
        return 1+0.2*completes;
    },
    epicChance(recipeID) {
        const completes = Math.floor(this.epicCount(recipeID)/11);
        return 1+0.2*completes;
    },
}

function initiateMuseumBldg() {
    $museumBuilding.show();
    if (Museum.tabView === null) refreshMuseumTop();
    else showMuseumType(Museum.tabView);
    refreshMuseumInv();
}

function refreshMuseumTop() {
    Museum.tabView === null;
    $museumTop.hide();
    $museumRecipeTypes.empty().show();
    Museum.view = "main";
    const museumItemTypesHeader = $("<div/>").addClass(`contentHeader`).appendTo($museumRecipeTypes);
        const headingDetails = $("<div/>").addClass("headingDetails").appendTo(museumItemTypesHeader);
            $("<div/>").addClass("headingTitle").html(displayText("header_museum_item_types_title")).appendTo(headingDetails);
            $("<div/>").addClass("headingDescription").html(displayText("header_museum_item_types_desc")).appendTo(headingDetails);
    const museumItemTypesContainer = $("<div/>").addClass(`museumItemTypesContainer`).appendTo($museumRecipeTypes);
    ItemType.sort().forEach(type => {
        if (type === "Trinkets") return;
        const d = $("<div/>").addClass("museumTypeDiv").data("recipeType",type).appendTo(museumItemTypesContainer);
        $("<div/>").addClass("museumTypeName").html(displayText(`type_${type}`)).appendTo(d);
        const percent = (Museum.completeByType(type)/440*100).toFixed(1)+"%";
        $("<div/>").addClass("museumTypeComplete").html(percent).appendTo(d);
    });
};

function showMuseumType(type, skipAnimation) {
    Museum.tabView = type;
    $museumTop.hide();
    $museumRecipeContributions.empty().show();
    Museum.view = type;
    const museumContributionsActions = $("<div/>").addClass("museumContributionsActions").appendTo($museumRecipeContributions);
    const backButton = $("<div/>").addClass(`museumBackButton actionButton`).html(`<i class="fas fa-arrow-left"></i>`).appendTo(museumContributionsActions);
        $("<div/>").addClass(`backButtonText`).html(displayText("museum_item_types_back_button")).appendTo(backButton);
    const museumTypeCycle = $("<div/>").addClass("museumTypeCycleContainer").appendTo(museumContributionsActions);
        $("<div/>").addClass(`museumTypeCycle museumTypeCycleLeft`).html('<i class="fas fa-arrow-left"></i>').appendTo(museumTypeCycle);
        $("<div/>").addClass(`museumTypeCycleName`).html(type).appendTo(museumTypeCycle);
        $("<div/>").addClass(`museumTypeCycle museumTypeCycleRight`).data("cycle",true).html('<i class="fas fa-arrow-right"></i>').appendTo(museumTypeCycle);
    // Rewards Header
    const museumRewardsHeader = $("<div/>").addClass(`contentHeader`).appendTo($museumRecipeContributions);
    const museumRewardsHeadingDetails = $("<div/>").addClass("headingDetails").appendTo(museumRewardsHeader);
        $("<div/>").addClass("headingTitle").html(displayText("museum_reward_header").replace("{0}",type)).appendTo(museumRewardsHeadingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("museum_reward_description").replace("{0}",type)).appendTo(museumRewardsHeadingDetails);
    // Reward Box Containers
    const e = $("<div/>").addClass("museumRewards").appendTo($museumRecipeContributions)
    const e1 = $("<div/>").addClass("museumRewardDiv").appendTo(e);
        const e1a = $("<div/>").addClass("museumRewardDetails").appendTo(e1);
            $("<div/>").addClass("museumRewardName").html(displayText("museum_reward_craft_time_redux_title")).appendTo(e1a);
            $("<div/>").addClass("museumRewardDesc").html(`${Math.floor(Museum.craftTime(type)*100)}%`).appendTo(e1a);
        $("<div/>").addClass("museumRewardNext").html(displayText("museum_reward_next").replace("{0}",`${11-Museum.commonCount(type)%11}`)).appendTo(e1);
    const e2 = $("<div/>").addClass("museumRewardDiv").appendTo(e);
        const e2a = $("<div/>").addClass("museumRewardDetails").appendTo(e2);
        $("<div/>").addClass("museumRewardName").html(displayText("museum_reward_craft_good_rate_title")).appendTo(e2a);
        $("<div/>").addClass("museumRewardDesc").html(`${Math.floor(Museum.goodChance(type)*100)}%`).appendTo(e2a);
        $("<div/>").addClass("museumRewardNext").html(displayText("museum_reward_next").replace("{0}",`${11-Museum.goodCount(type)%11}`)).appendTo(e2);
    const e3 = $("<div/>").addClass("museumRewardDiv").appendTo(e);
        const e3a = $("<div/>").addClass("museumRewardDetails").appendTo(e3);
        $("<div/>").addClass("museumRewardName").html(displayText("museum_reward_craft_great_rate_title")).appendTo(e3a);
        $("<div/>").addClass("museumRewardDesc").html(`${Math.floor(Museum.greatChance(type)*100)}%`).appendTo(e3a);
        $("<div/>").addClass("museumRewardNext").html(displayText("museum_reward_next").replace("{0}",`${11-Museum.greatCount(type)%11}`)).appendTo(e3);
    const e4 = $("<div/>").addClass("museumRewardDiv").appendTo(e);
     const e4a = $("<div/>").addClass("museumRewardDetails").appendTo(e4);
        $("<div/>").addClass("museumRewardName").html(displayText("museum_reward_craft_epic_rate_title")).appendTo(e4a);
        $("<div/>").addClass("museumRewardDesc").html(`${Math.floor(Museum.epicChance(type)*100)}%`).appendTo(e4a);
        $("<div/>").addClass("museumRewardNext").html(displayText("museum_reward_next").replace("{0}",`${11-Museum.epicCount(type)%11}`)).appendTo(e4);
    // Contributions Header
    const museumContributionsHeader = $("<div/>").addClass(`contentHeader`).appendTo($museumRecipeContributions);
    const museumContributionsHeadingDetails = $("<div/>").addClass("headingDetails").appendTo(museumContributionsHeader);
        $("<div/>").addClass("headingTitle").html(displayText("header_museum_contributions_title")).appendTo(museumContributionsHeadingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("header_museum_contributions_desc")).appendTo(museumContributionsHeadingDetails);
    // Contribution Box Containers
    const museumContributionsList = $("<div/>").addClass("museumContributionsList").appendTo($museumRecipeContributions);
    recipeList.filterByType(type).forEach(recipe => {
        const d = $("<div/>").data("recipeID", recipe.id).addClass("museumRecipeSelection").prependTo(museumContributionsList)
        $("<div/>").addClass("museumRecipeImage").html(recipe.itemPicName()).appendTo(d);
        const total = flattenArray(recipe.museum).length;
        const current = flattenArray(recipe.museum).filter(r => r).length;
        const progress = $("<div/>").addClass("museumRecipeProgress").appendTo(d);
        if (current !== total) $("<div/>").addClass("museumRecipeProgressText").html(`${current} / ${total} Contributed`).appendTo(progress);
        else {
            progress.addClass("museumRecipeCompleted")
            $("<div/>").addClass("museumRecipeProgressIcon").html(miscIcons.checkmark).appendTo(progress);
            $("<div/>").addClass("museumRecipeProgressText").html(displayText("museum_contribution_completed_title")).appendTo(progress);
        }
    });
    if (skipAnimation)  {
        backButton.css("animation","none");
        museumTypeCycle.css("animation","none");
        museumRewardsHeader.css("animation","none");
        $(".museumRewardDiv").css("animation","none");
        museumContributionsHeader.css("animation","none");
    }
};

function generateContributionsList(recipe, skipAnimation) {
    $museumRecipeContributions.empty();
    Museum.view = "itemInspect";
    Museum.itemInspect = recipe;
    const museumContributionsActions = $("<div/>").addClass("museumContributionsActions").appendTo($museumRecipeContributions);
    const backButton = $("<div/>").addClass(`museumRecipeBackButton actionButton`).html(`<i class="fas fa-arrow-left"></i>`).appendTo(museumContributionsActions);
        $("<div/>").addClass(`backButtonText`).html(`Back to ${recipe.type}`).appendTo(backButton);
    const museumTypeCycle = $("<div/>").addClass("museumTypeCycleContainer").appendTo(museumContributionsActions);
        $("<div/>").addClass(`museumTypeCycle museumRecipeCycleLeft`).html('<i class="fas fa-arrow-left"></i>').appendTo(museumTypeCycle);
        $("<div/>").addClass(`museumTypeCycleName`).html(recipe.name).appendTo(museumTypeCycle);
        $("<div/>").addClass(`museumTypeCycle museumRecipeCycleRight`).data("cycle",true).html('<i class="fas fa-arrow-right"></i>').appendTo(museumTypeCycle)
        
    const museumContributionsList = $("<div/>").addClass("museumContributionsListRecipe").appendTo($museumRecipeContributions);
    const d = $("<div/>").addClass("museumRecipeDiv").addClass("ctrlClickItem").data("rid",recipe.id).appendTo(museumContributionsList);
    if (skipAnimation) d.css("animation","none");
    $("<div/>").addClass("museumRecipeImage").html(recipe.itemPicName()).appendTo(d);
    const d1 = $("<div/>").addClass("museumRecipeCon").appendTo(d);
    recipe.museum.forEach((rarity,j) => {
        const d1a = $("<div/>").addClass("museumRecipeConItem").appendTo(d1);
        $("<div/>").addClass(`museumRecipeRarity RT${j} tooltip`).attr({"data-tooltip":`museum_rarity_${rarities[j].toLowerCase()}`}).html(miscIcons.rarity).appendTo(d1a);
        rarity.forEach((sharp,i) => {
            const d2 = $("<div/>").addClass(`museumRecipe R${j}`).appendTo(d1a);
            if (sharp) d2.addClass("museumRecipeEntryComplete").html(miscIcons.checkmark);
            else d2.html(`<span>${miscIcons.enhancement}</span> ${i}`);
        });
    });
    if (skipAnimation)  {
        backButton.css("animation","none");
        museumTypeCycle.css("animation","none");
    }
}

$(document).on("click",".museumRecipeSelection",(e) => {
    const id = $(e.currentTarget).data("recipeID");
    const recipe = recipeList.idToItem(id);
    generateContributionsList(recipe);
});

function museumRecipeCycleLeft() {
    const recipe = Museum.itemInspect;
    const type = recipe.type;
    const items = recipeList.recipes.filter(recipe => recipe.type === type);
    const currentIndex = items.findIndex(r => r === Museum.itemInspect);
    let newIndex = 0;
    if (currentIndex > 0) newIndex = currentIndex - 1;
    else newIndex = items.length - 1
    Museum.itemInspect = items[newIndex];
}

function museumRecipeCycleRight() {
    const recipe = Museum.itemInspect;
    const type = recipe.type;
    const items = recipeList.recipes.filter(recipe => recipe.type === type);
    const currentIndex = items.findIndex(r => r === Museum.itemInspect);
    let newIndex = 0;
    if (currentIndex < items.length - 1) newIndex = currentIndex + 1
    Museum.itemInspect = items[newIndex];
}

$(document).on("click",".museumRecipeCycleLeft",(e) => {
    museumRecipeCycleLeft();
    generateContributionsList(Museum.itemInspect, true);
});

$(document).on("click",".museumRecipeCycleRight",(e) => {
    museumRecipeCycleRight();
    generateContributionsList(Museum.itemInspect, true);
});

// Cycle left on Museum recipe lines and show previous item type
function museumTypeCycleLeft() {
    const ItemTypes = ItemType.filter(type => type !== "Trinkets");
    const currentIndex = ItemTypes.findIndex(type => type === Museum.view);
    let newIndex = 0;
    if (currentIndex > 0) newIndex = currentIndex - 1;
    else newIndex = ItemTypes.length - 1
    Museum.view = ItemTypes[newIndex];
}

// Cycle right on Museum recipe lines and show previous item type
function museumTypeCycleRight() {
    const ItemTypes = ItemType.filter(type => type !== "Trinkets");
    const currentIndex = ItemTypes.findIndex(type => type === Museum.view);
    let newIndex = 0;
    if (currentIndex < ItemTypes.length - 1) newIndex = currentIndex + 1
    Museum.view = ItemTypes[newIndex];
}

$(document).on("click",".museumTypeCycleLeft",(e) => {
    museumTypeCycleLeft();
    showMuseumType(Museum.view, true)
});

$(document).on("click",".museumTypeCycleRight",(e) => {
    museumTypeCycleRight();
    showMuseumType(Museum.view, true)
});

function refreshMuseumInv() {
    $museumInv.empty();
    const donations = Museum.possibleInventoryDonations();
    const museumDonationsHeader = $("<div/>").addClass(`contentHeader`).appendTo($museumInv);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(museumDonationsHeader);
        $("<div/>").addClass("headingTitle").html(displayText("header_museum_donations_title")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("header_museum_donations_desc")).appendTo(headingDetails);
    const museumDonationCardsContainer = $("<div/>").addClass(`museumDonationCardsContainer`).appendTo($museumInv);
    if (donations.length === 0) {
        $("<div/>").addClass("emptyContentMessage").html(displayText("museum_no_donations_message")).appendTo($museumInv);
        return;
    }
    Museum.possibleInventoryDonations().forEach(container => {
        createMuseumCard(container).appendTo(museumDonationCardsContainer);
    });
}

function createMuseumCard(container) {
    const d = $("<div/>").addClass("museumItem").addClass("R"+container.rarity);
    $("<div/>").addClass("itemName").html(container.picName()).appendTo(d);
    $("<div/>").addClass(`itemRarity RT${container.rarity} tooltip`).attr({"data-tooltip": `rarity_${rarities[container.rarity].toLowerCase()}`}).html(miscIcons.rarity).appendTo(d);
    $("<div/>").addClass("itemLevel").html(container.itemLevel()).appendTo(d);
    const itemProps = $("<div/>").addClass("equipStats").appendTo(d);
    for (const [stat, val] of Object.entries(container.itemStat(false))) {
        if (val === 0) continue;
        $("<div/>").addClass("gearStat tooltip").attr("data-tooltip", stat).html(`${miscIcons[stat]} <span class="statValue">${val}</span>`).appendTo(itemProps);
    };
    const actionBtns = $("<div/>").addClass("museumButtons").appendTo(d);
    $("<div/>").addClass('actionButtonCard museumDonate').data("containerid",container.containerID).html(displayText("museum_donations_donate_button")).appendTo(actionBtns);
    return d;
}

$(document).on("click",".museumTypeDiv",(e) => {
    e.preventDefault();
    const type = $(e.currentTarget).data("recipeType");
    showMuseumType(type);
});

$(document).on("click",".museumBackButton",(e) => {
    e.preventDefault();
    Museum.tabView = null;
    refreshMuseumTop();
})

$(document).on("click",".museumRecipeBackButton",(e) => {
    e.preventDefault();
    const recipe = Museum.itemInspect;
    Museum.tabView = recipe.type;
    showMuseumType(Museum.tabView);
})

//click on an item to donate to museum
$(document).on("click",".museumDonate",(e) => {
    const containerid = parseInt($(e.target).data("containerid"));
    Museum.donate(containerid);
    if (Museum.view === "main") refreshMuseumTop();
    else if (Museum.view === "rewards") showMuseumRewards();
    else if (Museum.view === "itemInspect") generateContributionsList(Museum.itemInspect, true);
    else showMuseumType(Museum.view);
    refreshMuseumInv();
});