"use strict";

let stopSave = false;


function ClearSave() {
    localStorage.removeItem("ffgs1");
    location.reload();
}

function ExportSave() {
    const saveFile = createSaveExport();
    $("#exportSaveText").val(saveFile);
}

function ImportSaveButton() {
    stopSave = true;
    const unpako = atob($('#importSaveText').val());
    const saveFile = JSON.parse(pako.ungzip(unpako,{ to: 'string' }));
    localStorage.setItem('ffgs1', saveFile);
    location.reload();
}

function forceSaveChange(string) {
    localStorage.setItem('ffgs1', string);
    location.reload();
}

let saveTime = 0;

function saveGame(ms) {
    saveTime += ms;
    if (saveTime < 5000) return;
    saveTime = 0;
    if (stopSave) return;
    localStorage.setItem('ffgs1', createSave());
}

function forceSave() {
    localStorage.setItem('ffgs1', createSave());
}

function forceDownload() {
    const saveFile = localStorage.getItem("ffgs1");

    const b = new Blob([saveFile],{type:"text/plain;charset=utf-8"});
    saveAs(b, "ForgeAndFortuneSave.txt");
}

function createSave() {
    const saveFile = {}
    saveFile["ver"] = 1;
    saveFile["ho2"] = HotKeys.createSave();
    saveFile["as"] = actionSlotManager.createSave();
    saveFile["d"] = DungeonManager.createSave();
    saveFile["h"] = HeroManager.createSave();
    saveFile["i"] = Inventory.createSave();
    saveFile["r"] = recipeList.createSave();
    saveFile["rs"] = ResourceManager.createSave();
    saveFile["ac"] = achievementStats.createSave();
    saveFile["ds"] = SynthManager.createSave();
    saveFile["fb"] = FusionManager.createSave();
    saveFile["bb"] = BankManager.createSave();
    saveFile["bs"] = bloopSmith.createSave();
    saveFile["fo"] = FortuneManager.createSave();
    saveFile["tm"] = TownManager.createSave();
    saveFile["sh"] = Shop.createSave();
    saveFile["t"] = TinkerManager.createSave();
    saveFile["m"] = Museum.createSave();
    saveFile["me"] = Merchant.createSave();
    saveFile["e"] = ExpeditionManager.createSave();
    saveFile["pb"] = PlaybookManager.createSave();
    saveFile["tu"] = Tutorial.createSave();
    saveFile["saveTime"] = Date.now();
    return JSON.stringify(saveFile);
}

function createSaveExport() {
    const save = createSave();
    const pakoSave = pako.gzip(JSON.stringify(save),{ to: 'string' });
    return btoa(pakoSave);
}

function loadGame() {
    //populate itemCount with blueprints as a base
    let loadGame = JSON.parse(localStorage.getItem("ffgs1"));
    if (loadGame === null) return false;
    //aka there IS a file
    loadGame = saveUpdate(loadGame);
    if (typeof loadGame["ho2"] !== "undefined") HotKeys.loadSave(loadGame["ho2"]);
    if (typeof loadGame["as"] !== "undefined") actionSlotManager.loadSave(loadGame["as"]);
    if (typeof loadGame["d"] !== "undefined") DungeonManager.loadSave(loadGame["d"]);
    if (typeof loadGame["h"] !== "undefined") HeroManager.loadSave(loadGame["h"]);
    if (typeof loadGame["i"] !== "undefined") Inventory.loadSave(loadGame["i"]);
    if (typeof loadGame["r"] !== "undefined") recipeList.loadSave(loadGame["r"]);
    if (typeof loadGame["rs"] !== "undefined") ResourceManager.loadSave(loadGame["rs"]);
    if (typeof loadGame["ac"] !== "undefined") achievementStats.loadSave(loadGame["ac"]);
    if (typeof loadGame["ds"] !== "undefined") SynthManager.loadSave(loadGame["ds"]);
    if (typeof loadGame["fb"] !== "undefined") FusionManager.loadSave(loadGame["fb"]);
    if (typeof loadGame["bb"] !== "undefined") BankManager.loadSave(loadGame["bb"]);
    if (typeof loadGame["bs"] !== "undefined") bloopSmith.loadSave(loadGame["bs"]);
    if (typeof loadGame["fo"] !== "undefined") FortuneManager.loadSave(loadGame["fo"]);
    if (typeof loadGame["tm"] !== "undefined") TownManager.loadSave(loadGame["tm"]);
    if (typeof loadGame["sh"] !== "undefined") Shop.loadSave(loadGame["sh"]);
    if (typeof loadGame["t"] !== "undefined") TinkerManager.loadSave(loadGame["t"]);
    if (typeof loadGame["m"] !== "undefined") Museum.loadSave(loadGame["m"]);
    if (typeof loadGame["pb"] !== "undefined") PlaybookManager.loadSave(loadGame["pb"]);
    if (typeof loadGame["me"] !== "undefined") Merchant.loadSave(loadGame["me"]);
    if (typeof loadGame["e"] !== "undefined") ExpeditionManager.loadSave(loadGame["e"]);
    if (typeof loadGame['tu'] !== "undefined") Tutorial.loadSave(loadGame["tu"]);
    if (typeof loadGame["saveTime"] !== "undefined") player.lastTime = loadGame["saveTime"];
    return true;
}

function saveUpdate(loadGame) {
    if (loadGame["ver"] === 0) {
        loadGame["ver"] = 1;
        loadGame["ds"].fuel = loadGame["rs"].find(r=>r.id==="M700").amt + 5*loadGame["rs"].find(r=>r.id==="M701").amt + 20*loadGame["rs"].find(r=>r.id==="M702").amt;
    }
    return loadGame;
}

//UI Stuff
$(document).on('click', '#deleteSaveButton', (e) => {
    e.preventDefault();
    ClearSave();
});

$(document).on('click', '#declineSaveButton', (e) => {
    e.preventDefault();
    setDialogClose();
});

$(document).on('click', '#exportSave', () => {
    ExportSave();
});

$(document).on('click', '#importSaveButton', (e) => {
    e.preventDefault();
    ImportSaveButton();
});

$(document).on('click', '#exportSaveCopy', (e) => {
    e.preventDefault();
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($("#exportSaveText").val()).select();
    document.execCommand("copy");
    $temp.remove();
    $("#exportStatus").html('Copied to Clipboard.');
    setTimeout(() => {$("#exportStatus").empty()}, 3500);
})

$(document).on('click', '#exportSaveLocal', (e) => {
    e.preventDefault();
    downloadSave();
});

function downloadSave() {
    const saveFile = createSaveExport();
    const b = new Blob([saveFile],{type:"text/plain;charset=utf-8"});
    saveAs(b, "ForgeAndFortuneSave.txt");
}

function downloadBorkedSave() {
    saveAs(new Blob([btoa(pako.gzip(JSON.stringify(localStorage.getItem("ffgs1")),{ to: 'string' }))],{type:"text/plain;charset=utf-8"}), "savefix.txt");
}

//used for diagnostics
function unPackSave(file) {
    const unpako = atob(file);
    const saveFile = JSON.parse(JSON.parse(pako.ungzip(unpako,{ to: 'string' })));
    return saveFile;
}