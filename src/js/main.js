"use strict";

const player = {
    saveStart : Date.now(),
    lastTime : Date.now(),
    timeWarp : 1,
}

function afterLoad() {
    ga('send', 'event', 'Save', 'savegame', 'savegame');
    $("#versionNum").html(PatchManager.lastVersion());
    refreshPatchNotes();
    initializeRecipes();
    initializeMats();
    if (!loadGame()) {
        recipeList.idToItem("R13001").owned = true;
        Merchant.orders.push(new orderItem("R13001"));
        achievementStats.startTime = Date.now();
        pregearHeroes();
        HeroManager.heroes.forEach(hero => {
            PlaybookManager.idToPlaybook(hero.startingPlaybook).unlocked = true;
        })
    }
    //this is a bad workaround
    PlaybookManager.playbookDB.forEach(pb=>{if(pb.startUnlocked) pb.unlock()});
    //sorry for that
    tabHide();
    refreshInventory();
    refreshSideWorkers();
    refreshRecipeFilters();
    hardMatRefresh();
    refreshProgress();
    initializeSideBarDungeon();
    refreshSideTown();
    recipeList.recipes.forEach(r=>refreshCraftedCount(r));
    initializeMerchantSidebar();
    refreshInventoryPlaces();
    recipeList.canCraft();
    checkCraftableStatus();
    setInterval(mainLoop, 10);
    recipeList.recipeFilterType = "Knives";
    recipeList.recipeFilterString = "";
    recipeFilterList();
    refreshCraftTimes();
    refreshTutorial();
    preloader.contentLoaded();
    refreshBossProgress();
    setTimeout(() => {
        if (settings.opnotif === 1) setDialogOpen(DialogManager.findDialog("offline_stats"));
    }, 10);
    animationPreference();
    gpuEffectsPreference();
    refreshTownHasEvents();
}

loadMisc(); //the others are loaded in order
openTab("recipesTab");

let offlineStat = {};

let gaTrackTime = 0;
function gaTrack(ms) {
    gaTrackTime += ms;
    if (gaTrackTime < 600000) return;
    ga('send', 'event', 'Save', 'savegame', 'savegame');
    gaTrackTime = 0;
}

function mainLoop() {
    const log = (Date.now()-player.lastTime > 600000) ? true : false;
    settings.opnotif = 0;
    if (log) {
        offlineStat = {};
        offlineStat.time = timeSince(Math.max(Date.now()-259200000,player.lastTime));
        offlineStat.initialGold = ResourceManager.idToMaterial("M001").amt;
        offlineStat.initialInv = Inventory.nonblank().length;
        offlineStat.initialMat = ResourceManager.materials.filter(m=>m.type==="dungeon").map(m=>m.amt).reduce((a,b)=>a+b,0);
        settings.opnotif = 1;
        ResourceManager.uncapMats = true;
    }
    gaTrack(Date.now()-player.lastTime);
    let elapsedTime = (Date.now()-player.lastTime)*player.timeWarp;
    elapsedTime = Math.min(elapsedTime,259200000);
    achievementStats.setTimePlayed(elapsedTime);
    saveGame(Date.now()-player.lastTime);
    player.lastTime = Date.now();
    const fuelTime = SynthManager.fuelActive() ? Math.floor(elapsedTime * miscLoadedValues.fuelSpeed) : elapsedTime;
    DungeonManager.addTime(fuelTime);
    FusionManager.addTime(fuelTime);
    actionSlotManager.addTime(fuelTime);
    actionSlotVisualManager.updateSlots();
    PatchManager.patchTimer(elapsedTime);
    TinkerManager.addTime(fuelTime);
    ExpeditionManager.addTime(fuelTime);
    SynthManager.addTime(elapsedTime);
    if (log) {
        offlineStat.gold = ResourceManager.idToMaterial("M001").amt - offlineStat.initialGold;
        offlineStat.inv = Inventory.nonblank().length - offlineStat.initialInv;
        offlineStat.mat = ResourceManager.materials.filter(m=>m.type==="dungeon").map(m=>m.amt).reduce((a,b)=>a+b,0) - offlineStat.initialMat;
        ResourceManager.uncapMats = false;
        ResourceManager.capMats(); //we do this because we uncap mats so we don't fuck over action slots;
        refreshInventoryPlaces();
        refreshMaterial("M001");
    }
    Tutorial.monitor();
}

function pregearHeroes() {
    const Alok = HeroManager.idToHero("H201");
    Alok.equip(new itemContainer("R13001",1));
    Alok.equip(new itemContainer("R2301",1));
    Alok.equip(new itemContainer("R3301",1));
    Alok.equip(new itemContainer("R4301",1));
    Alok.equip(new itemContainer("R5301",1));
    Alok.equip(new itemContainer("R6301",1));

    const Cedric = HeroManager.idToHero("H002");
    Cedric.equip(new itemContainer("R12001",1));
    Cedric.equip(new itemContainer("R2101",1));
    Cedric.equip(new itemContainer("R3101",1));
    Cedric.equip(new itemContainer("R4101",1));
    Cedric.equip(new itemContainer("R5101",1));
    Cedric.equip(new itemContainer("R6501",1));

    const Zoe = HeroManager.idToHero("H101");
    Zoe.equip(new itemContainer("R11001",1));
    Zoe.equip(new itemContainer("R2201",1));
    Zoe.equip(new itemContainer("R3201",1));
    Zoe.equip(new itemContainer("R4201",1));
    Zoe.equip(new itemContainer("R5501",1));
    Zoe.equip(new itemContainer("R6201",1));

    const Grogmar = HeroManager.idToHero("H202");
    Grogmar.equip(new itemContainer("R13002",1));
    Grogmar.equip(new itemContainer("R2302",1));
    Grogmar.equip(new itemContainer("R3302",1));
    Grogmar.equip(new itemContainer("R4302",1));
    Grogmar.equip(new itemContainer("R5302",1));
    Grogmar.equip(new itemContainer("R6302",1));

    const Grim = HeroManager.idToHero("H003");
    Grim.equip(new itemContainer("R12002",1));
    Grim.equip(new itemContainer("R2102",1));
    Grim.equip(new itemContainer("R3102",1));
    Grim.equip(new itemContainer("R4102",1));
    Grim.equip(new itemContainer("R5102",1));
    Grim.equip(new itemContainer("R6502",1));

    const Troy = HeroManager.idToHero("H104");
    Troy.equip(new itemContainer("R11002",1));
    Troy.equip(new itemContainer("R2202",1));
    Troy.equip(new itemContainer("R3202",1));
    Troy.equip(new itemContainer("R4202",1));
    Troy.equip(new itemContainer("R5502",1));
    Troy.equip(new itemContainer("R6202",1));

    const Caeda = HeroManager.idToHero("H204");
    Caeda.equip(new itemContainer("R13003",2));
    Caeda.equip(new itemContainer("R2303",2));
    Caeda.equip(new itemContainer("R3303",2));
    Caeda.equip(new itemContainer("R4303",2));
    Caeda.equip(new itemContainer("R5303",2));
    Caeda.equip(new itemContainer("R6303",2));

    const Lambug = HeroManager.idToHero("H004");
    Lambug.equip(new itemContainer("R12003",2));
    Lambug.equip(new itemContainer("R2103",2));
    Lambug.equip(new itemContainer("R3103",2));
    Lambug.equip(new itemContainer("R4103",2));
    Lambug.equip(new itemContainer("R5103",2));
    Lambug.equip(new itemContainer("R6503",2));

    const Titus = HeroManager.idToHero("H103");
    Titus.equip(new itemContainer("R11003",2));
    Titus.equip(new itemContainer("R2203",2));
    Titus.equip(new itemContainer("R3203",2));
    Titus.equip(new itemContainer("R4203",2));
    Titus.equip(new itemContainer("R5503",2));
    Titus.equip(new itemContainer("R6203",2));
}

