"use strict";

const $plBoss = $("#plBoss");
const $pbBoss = $("#pbBoss");

const $plRecipeMastery = $("#plRecipeMastery");
const $pbRecipe = $("#pbRecipe");

const $plPerk = $("#plPerk");
const $pbPerk = $("#pbPerk");

const $plMuseum = $("#plMuseum");
const $pbMuseum = $("#pbMuseum");
const $museumProgressTitle = $("#museumProgressTitle");
const $museumProgressDesc = $("#museumProgressDesc");

const $plOverall = $("#plOverall");
const $pbOverall = $("#pbOverall");

const $progresslist = $("#progresslist");

function initiateMilestoneBldg() {
    $("#milestoneBuilding").show();
    refreshProgress();
}

function refreshProgress() {
    //big progress boxes
    let count = 0;

    $plBoss.html(`${DungeonManager.bossCount()} / 10`);
    const bossPercent = (DungeonManager.bossCount() * 10).toFixed(2);
    $pbBoss.css('width', bossPercent+"%");
    if (DungeonManager.bossCount() === 10) $pbBoss.addClass("progressCompleted");
    count += DungeonManager.bossCount()/10;

    $plRecipeMastery.html(`${recipeList.masteryCount()} / ${recipeList.recipeCount()}`);
    const recipePercent = (recipeList.masteryCount()/recipeList.recipeCount()*100).toFixed(2);
    $pbRecipe.css('width', recipePercent+"%");
    if (recipeList.masteryCount() === recipeList.recipeCount()) $pbRecipe.addClass("progressCompleted");
    count += recipeList.masteryCount()/recipeList.recipeCount();
    
    $plPerk.html(`${Shop.perkCount()} / ${Shop.perkMaxCount()}`);
    const perkPercent = (Shop.perkCount()/Shop.perkMaxCount()*100).toFixed(2);
    $pbPerk.css('width', perkPercent+"%");
    if (Shop.perkCount() === Shop.perkMaxCount()) $pbPerk.addClass("progressCompleted");
    count += Shop.perkCount()/Shop.perkMaxCount();



    if (!Shop.alreadyPurchased("AL3015")) {
        $museumProgressTitle.html(`${miscIcons.locked}&nbsp;${displayText("universal_locked")}`);
        $museumProgressDesc.html(`Progress further to unlock this category.`);
        $plMuseum.html(`0 / 0`);
    }
    else {
        $museumProgressTitle.html(`Museum Donations`);
        $museumProgressDesc.html(`Your progress for donations to the Museum.`);
        $plMuseum.html(`${Museum.donationCount()} / ${Museum.donationMax()}`);
    }
    const museumPercent = (Museum.donationCount()/Museum.donationMax()*100).toFixed(2);
    $pbMuseum.css('width', museumPercent+"%");
    if (Museum.donationMax() === Museum.donationCount()) $pbMuseum.addClass("progressCompleted");
    count += Museum.donationCount()/Museum.donationMax();

    const overallPercent = count/4;
    if (overallPercent === 1 && achievementStats.endTime === -1) achievementStats.endTime = Date.now();
    $plOverall.html((overallPercent * 100).toFixed(2)+"%");
    $pbOverall.css('width', (overallPercent*100).toFixed(2)+"%");
    if (overallPercent === 1) $pbOverall.addClass("progressCompleted");
}

const $statMaxFloor = $("#statMaxFloor");
const $statFloors = $("#statFloors");
const $statTotalGoldEarned = $("#statTotalGoldEarned");
const $statTotalItems = $("#statTotalItems");
const $statCommons = $("#statCommons");
const $statGoods = $("#statGoods");
const $statGreats = $("#statGreats");
const $statEpics = $("#statEpics");
const $statTimePlayed = $("#statTimePlayed");

const $statMaxFloorD001 = $("#statMaxFloorD001");
const $statMaxFloorD002 = $("#statMaxFloorD002");
const $statMaxFloorD003 = $("#statMaxFloorD003");

const achievementStats = {
    startTime : 0,
    endTime : -1,
    maxFloor : 0,
    timePlayed : 0,
    totalGoldEarned : 0,
    epicsCrafted : 0,
    greatsCrafted : 0,
    goodsCrafted : 0,
    commonsCrafted : 0,
    totalItemsCrafted : 0,
    totalFloorsBeaten : 0,
    bossesBeat : [0,0,0,0,0,0,0,0,0,0],
    setTimePlayed(ms) {
        this.timePlayed += ms;
        $statTimePlayed.html(timeSince(this.startTime,Date.now()));
    },
    floorRecord() {
        if (this.totalFloorsBeaten === undefined) this.totalFloorsBeaten = 1;
        this.totalFloorsBeaten += 1;
        $statFloors.html(this.totalFloorsBeaten);
    },
    craftedItem(rarity,skipAnimation) {
        this.totalItemsCrafted += 1;
        if (rarity === "Common") this.commonsCrafted += 1;
        if (rarity === "Good") this.goodsCrafted += 1;
        if (rarity === "Great") this.greatsCrafted += 1;
        if (rarity === "Epic") this.epicsCrafted += 1;
        if (skipAnimation) return;
        $statTotalItems.html(formatToUnits(this.totalItemsCrafted,2));
        $statCommons.html(formatToUnits(this.commonsCrafted,2));
        $statGoods.html(formatToUnits(this.goodsCrafted,2));
        $statGreats.html(formatToUnits(this.greatsCrafted,2));
        $statEpics.html(formatToUnits(this.epicsCrafted,2));
    },
    gold(g,skipAnimation) {
        this.totalGoldEarned += g;
        if (!skipAnimation) $statTotalGoldEarned.html(formatToUnits(this.totalGoldEarned,2));
    },
    createSave() {
        const save = {};
        save.startTime = this.startTime;
        save.endTime = this.endTime;
        save.timePlayed = this.timePlayed;
        save.totalGoldEarned = this.totalGoldEarned;
        save.epicsCrafted = this.epicsCrafted;
        save.greatsCrafted = this.greatsCrafted;
        save.goodsCrafted = this.goodsCrafted;
        save.commonsCrafted = this.commonsCrafted;
        save.totalItemsCrafted = this.totalItemsCrafted;
        save.totalFloorsBeaten = this.totalFloorsBeaten;
        save.bossesBeat = this.bossesBeat;
        return save;
    },
    loadSave(save) {
        this.startTime = save.startTime;
        this.endTime = save.endTime;
        this.maxFloor = save.maxFloor;
        this.timePlayed = save.timePlayed;
        this.totalGoldEarned = save.totalGoldEarned;
        this.epicsCrafted = save.epicsCrafted;
        this.greatsCrafted = save.greatsCrafted;
        this.goodsCrafted = save.goodsCrafted;
        this.commonsCrafted = save.commonsCrafted;
        this.totalItemsCrafted = save.totalItemsCrafted;
        this.totalFloorsBeaten = save.totalFloorsBeaten;
        if (save.bossesBeat !== undefined) this.bossesBeat = save.bossesBeat;
        $statTotalGoldEarned.html(formatToUnits(this.totalGoldEarned,2));
        if (save.totalFloorsBeaten !== undefined) $statFloors.html(this.totalFloorsBeaten);
        $statTimePlayed.html(timeSince(0,this.timePlayed));
        $statTotalItems.html(this.totalItemsCrafted);
        $statCommons.html(this.commonsCrafted);
        $statGoods.html(this.goodsCrafted);
        $statGreats.html(this.greatsCrafted);
        $statEpics.html(this.epicsCrafted);
    },
    bossBeat(dungeonID) {
        const bosses = ["D401","D402","D403","D404","D405","D406","D407","D408","D409","D410"];
        const idx = bosses.findIndex(b=>b === dungeonID);
        if (this.bossesBeat[idx] === 0) this.bossesBeat[idx] = Date.now();
        refreshBossProgress();
    }
}

const $bossProgressContainer = $("#bossProgressContainer");

function refreshBossProgress() { 
    $bossProgressContainer.empty();
    achievementStats.bossesBeat.forEach((boss,i) => {
        const d = $("<div/>").addClass("statBox").appendTo($bossProgressContainer);
        $("<div/>").addClass("statHeading").html(`Boss ${i+1} Defeated`).appendTo(d);
        const d1 = $("<div/>").addClass("statNormal").appendTo(d);
        if (boss === 0) d1.html("Not defeated yet.");
        else d1.html(`${timeSince(achievementStats.startTime,boss)}`);
    });
}

const $achieve1 = $("#achieve1");
const $achieve2 = $("#achieve2");
const $achieve3 = $("#achieve3");
const $achieve4 = $("#achieve4");
const $achieve5 = $("#achieve5");
const $achieve6 = $("#achieve6");
const $achieve7 = $("#achieve7");
const $achieve8 = $("#achieve8");
const $achieve9 = $("#achieve9");
const $achieve10 = $("#achieve10");