"use strict";

const Tutorial = {
    lvl : 0,
    createSave() {
        const save = {};
        save.lvl = this.lvl;
        return save;
    },
    loadSave(save) {
        this.lvl = save.lvl;
    },
    complete() {
        return this.lvl >= 33;
    },
    monitor() {
        if (this.complete()) return;
        if (this.lvl === 0 && recipeList.idToItem("R13001").craftCount > 0) {
            this.lvl = 1;
            refreshTutorial();
        }
        if (this.lvl === 1 && achievementStats.totalGoldEarned > 0) {
            this.lvl = 2;
            refreshTutorial();
        }
        if (this.lvl === 2 && Shop.alreadyPurchased("AL2000")) {
            this.lvl = 3;
            refreshTutorial();
        }
        if (this.lvl === 3 && Shop.alreadyPurchased("AL2001")) {
            this.lvl = 4;
            refreshTutorial();
        }
        if (this.lvl === 4 && HeroManager.idToHero("H203").state() === HeroState.DUNGEON) {
            this.lvl = 5;
            refreshTutorial();
        }
        if (this.lvl === 5 && HeroManager.idToHero("H203").gearSlots[0].gear !== null) {
            this.lvl = 6;
            refreshTutorial();
        }
        if (this.lvl === 6 && Shop.alreadyPurchased("AL1000")) {
            this.lvl = 7;
            refreshTutorial();
        }
        if (this.lvl === 7 && (Merchant.orders.length === 0 || recipeList.idToItem("R2301").owned)) {
            this.lvl = 8;
            refreshTutorial();
        }
        if (this.lvl === 8 && recipeList.idToItem("R2301").owned) {
            this.lvl = 9;
            refreshTutorial();
        }
        if (this.lvl === 9 && DungeonManager.dungeonByID("D101").maxFloor >= 2) {
            this.lvl = 10;
            refreshTutorial();
        }
        if (this.lvl === 10 && (recipeList.idToItem("R4201").owned)) {
            this.lvl = 11;
            refreshTutorial();
        }
        if (this.lvl === 11 && Shop.alreadyPurchased("AL2002")) {
            this.lvl = 12;
            refreshTutorial();
        }
        if (this.lvl === 12 && recipeList.idToItem("R4201").craftCount > 0) {
            this.lvl = 13;
            refreshTutorial();
        }
        if (this.lvl === 13 && recipeList.idToItem("R12001").owned) {
            this.lvl = 14;
            refreshTutorial();
        }
        if (this.lvl === 14 && recipeList.idToItem("R12001").craftCount > 0) {
            this.lvl = 15;
            refreshTutorial();
        }
        if (this.lvl === 15 && Shop.alreadyPurchased("AL2003")) {
            this.lvl = 16;
            refreshTutorial();
        }
        if (this.lvl === 16 && recipeList.idToItem("R11001").owned) {
            this.lvl = 17;
            refreshTutorial();
        }
        if (this.lvl === 17 && recipeList.idToItem("R11001").craftCount > 0) {
            this.lvl = 18;
            refreshTutorial();
        }
        if (this.lvl === 18 && Shop.alreadyPurchased("AL2005")) {
            this.lvl = 19;
            refreshTutorial();
        }
        if (this.lvl === 19 && recipeList.idToItem("R4101").owned) {
            this.lvl = 20;
            refreshTutorial();
        }
        if (this.lvl === 19 && recipeList.idToItem("R4101").owned) {
            this.lvl = 20;
            refreshTutorial();
        }
        if (this.lvl === 20 && recipeList.idToItem("R4101").craftCount > 0) {
            this.lvl = 21;
            refreshTutorial();
        }
        if (this.lvl === 21 && Shop.alreadyPurchased("AL1003")) {
            this.lvl = 22;
            refreshTutorial();
        }
        if (this.lvl === 22 && actionSlotManager.anyAutoSell()) {
            this.lvl = 23;
            refreshTutorial();
        }
        if (this.lvl === 23 && recipeList.masteryCount() > 0) {
            this.lvl = 24;
            refreshTutorial();
        }
        if (this.lvl === 24 && recipeList.idToItem("R5501").owned) {
            this.lvl = 25;
            refreshTutorial();
        }
        if (this.lvl === 25 && recipeList.idToItem("R5501").craftCount > 0) {
            this.lvl = 26;
            refreshTutorial();
        }
        if (this.lvl === 26 && recipeList.idToItem("R6201").owned) {
            this.lvl = 27;
            refreshTutorial();
        }
        if (this.lvl === 27 && HeroManager.idToHero("H001").fullyEquipped() && HeroManager.idToHero("H102").fullyEquipped() && HeroManager.idToHero("H203").fullyEquipped()) {
            this.lvl = 28;
            refreshTutorial();
        }
        if (this.lvl === 28 && DungeonManager.bossCount() > 0) {
            this.lvl = 29;
            refreshTutorial();
        }
        if (this.lvl === 29 && Shop.alreadyPurchased("AL20081")) {
            this.lvl = 30;
            refreshTutorial();
        }
        if (this.lvl === 30 && DungeonManager.dungeonByID("D102").maxFloor > 0 || DungeonManager.dungeonByID("D202").maxFloor > 0 || DungeonManager.dungeonByID("D302").maxFloor > 0) {
            this.lvl = 31;
            refreshTutorial();
        }
        if (this.lvl === 31 && Shop.alreadyPurchased("AL1026")) {
            this.lvl = 32;
            refreshTutorial();
        }
        if (Merchant.orders.length >= 2 || DungeonManager.dungeonByID("D402").maxFloor >= 1) {
            this.lvl = 33;
            refreshTutorial();
        }
    }
}

const $tutorial = $("#tutorial");
const $tutorialHeader = $("#tutorialHeader");
const $tutorialDesc = $("#tutorialDesc");

function refreshTutorial() {
    if (Tutorial.complete()) return $tutorial.hide();
    $tutorial.addClass("tutorialPulse");
    $tutorialHeader.html(displayText("tutorial_header"));
    $tutorialDesc.html(displayText(`tutorial_desc_${Tutorial.lvl}`));
}

$(document).on('animationend', '.tutorial', () => {
    $tutorial.removeClass("tutorialPulse");
})