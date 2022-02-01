"use strict";

let lastTab = null;

function openTab(tabName) {
    if (tabName === lastTab && tabName !== "dungeonsTab" && tabName !== "heroesTab") return;
    if (lastTab === tabName && tabName === "dungeonsTab" && AreaManager.areaView === null) return;
    if (lastTab === tabName && tabName === "heroesTab" && HeroManager.heroView === null) return;
    lastTab = tabName;
    // Declare all variables
    DungeonManager.dungeonView = null;
    if (tabName === "merchantTab") {
        merchantTabClick();
    }
    if (tabName === "heroesTab") {
        refreshHeroOverview();
        $("#heroTab").removeClass("hasEvent");
    }
    if (tabName === "dungeonsTab") {
        dungeonsTabClicked();
    }
    if (tabName === "townsTab") {
        refreshSideTown();
        refreshTownBuilding();
    }
    if (tabName === "inventoryTab") {
        $inventoryTabSpan.removeClass("hasEvent");
        if (TownManager.typeToBuilding('bank').status === BuildingState.built) $("#goToBank").show();
        else $("#goToBank").hide();
        refreshInventory();
    }
    if (tabName === "marketTab") {
        $marketTabSpan.removeClass("hasEvent");
        refreshShop();
    }
    if (tabName === "questsTab") {
        refreshQuestLocations();
        generateQuestSelectHeader();
    }
    $(".tabcontent").hide();
    $("#"+tabName).show();
}

function tabClick(e, name) {
    if (lastTab === name) return;
    openTab(name);
    if (name === "townsTab") name = "townTab"
    navTabHighlight(e,$('#'+name+'Link')[0]);
}

const $comptitle1 = $("#comptitle1");
const $comptitle2 = $("#comptitle2");
const $comptitle3 = $("#comptitle3");
const $comptitle4 = $("#comptitle4");

$comptitle1.click((e) => {
    e.preventDefault();
    if (!recipeList.idToItem("R13001").craftCount > 0) return;
    tabClick(e, "inventoryTab");
});

$comptitle2.click((e) => {
    e.preventDefault();
    tabClick(e, "recipesTab");
});

$comptitle3.click((e) => {
    e.preventDefault();
    if (!Shop.alreadyPurchased("AL1000")) return;
    tabClick(e, "guildTab");
});

$comptitle4.click((e) => {
    e.preventDefault();
    if (!AreaManager.idToArea("A01").unlocked()) return;
    tabClick(e, "dungeonsTab");
});

$(document).on('click', ".DungeonSideBarStatus", (e) => {
    e.preventDefault();
    tabClick(e, "dungeonsTab");
    const areaID = $(e.currentTarget).data("areaID");
    screenDirectDungeon(areaID);
});

$(document).on('click', "#goToBank", (e) => {
    e.preventDefault();
    tabClick(e, 'townsTab');
    TownManager.lastBldg = "bank";
    $(".buildingName").removeClass("selected");
    $("#bankBldg").addClass("selected");
    showBldg('bank');
    showBankStorage();
});

const $merchantTabLink = $("#merchantTabLink");
const $heroesTabLink = $("#heroesTabLink");
const $dungeonsTabLink = $("#dungeonsTabLink");
const $progressTabLink = $("#progressTabLink");
const $questsTabLink = $("#questsTabLink");
const $inventoryTabLink = $("#inventoryTabLink");
const $inventoryTabSpan = $("#inventoryTabSpan");
const $marketTabLink = $("#marketTabLink");
const $marketTabSpan = $("#marketTabSpan");
const $townTabLink = $("#townTabLink");

function tabHide() {
    if (Shop.alreadyPurchased("AL1000")) $merchantTabLink.show();
    else $merchantTabLink.hide();
    if (recipeList.idToItem("R13001").craftCount > 0) $inventoryTabLink.show();
    else $inventoryTabLink.hide();
    if (HeroManager.heroOwned("H203")) $heroesTabLink.show();
    else $heroesTabLink.hide();
    if (AreaManager.idToArea("A01").unlocked()) $dungeonsTabLink.show();
    else $dungeonsTabLink.hide();
    if (TownManager.buildingsOwned()) $townTabLink.show();
    else $townTabLink.hide();
    if (achievementStats.totalGoldEarned > 0) $marketTabLink.show();
    else $marketTabLink.hide();
}