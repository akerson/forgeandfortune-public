// Tab Selection for Recipes List

$(".recipeSelect").on("click", tabHighlight);

function tabHighlight(e) {
    $(".recipeSelect").removeClass("selected");
    $(e.currentTarget).addClass("selected");
}

// Tab Selection for Navigation

$(".tablinks").on("click", navTabHighlight);

function navTabHighlight(e, tab = null) {
    $(".tablinks").removeClass("tab-selected");
    if (tab) $(tab).addClass("tab-selected");
    else $(e.currentTarget).addClass("tab-selected");
}

// Back To Top Button

const $backToTopButton = $(".back-to-top");

if ($backToTopButton) $(window).scroll(() => {
    if ($("body").scrollTop() || $(document).scrollTop() > 200) $backToTopButton.addClass("show-button");
    else $backToTopButton.removeClass("show-button");
});

// Tooltip Setting

$(document).on("change", ".tooltipPrefSelection", (e) => {
    $(e.target).attr("checked", "checked")
    settings.tpref = parseInt($(e.target).val());
    saveSettings();
});

// Animation Setting

$(document).on("change", ".animPrefSelection", (e) => {
    $(e.target).attr("checked", "checked")
    settings.animations = parseInt($(e.target).val());
    animationPreference();
    saveSettings();
});

function animationPreference() {
    if (!settings.animations) {
        $('<style>').addClass("animDisabled").html('*{animation: none!important;}').appendTo('head');
        $('.guildSummary').addClass('animDisabled');
        $('.buildingContent').addClass('animDisabled');
    }
    else {
        $('head').find(".animDisabled").remove();
        $('.guildSummary').removeClass('animDisabled');
        $('.buildingContent').removeClass('animDisabled');
    }
}

// GPU Effects Setting

$(document).on("change", ".gpuEffectsPrefSelection", (e) => {
    $(e.target).attr("checked", "checked")
    settings.gpuEffects = parseInt($(e.target).val());
    gpuEffectsPreference();
    saveSettings();
});

function gpuEffectsPreference() {
    if (!settings.gpuEffects) {
        $('<style>').addClass("gpuEffectsDisabled").html('*{backdrop-filter: none!important;}').appendTo('head');
    }
    else {
        $('head').find(".gpuEffectsDisabled").remove();
    }
}

// Toast Setting

$(document).on("change", ".toastPrefSelection", (e) => {
    $(e.target).attr("checked", "checked")
    settings.toasts = parseInt($(e.target).val());
    saveSettings();
});

// Toast Size Setting

$(document).on("change", ".toastSizeSelection", (e) => {
    $(e.target).attr("checked", "checked")
    settings.toastSize = parseInt($(e.target).val());
    saveSettings();
});

// Toast Duration Setting

$(document).on("change", ".toastDurationSelection", (e) => {
    $(e.target).attr("checked", "checked")
    settings.toastDuration = parseInt($(e.target).val());
    ToastManager.toastDuration = settings.toastDuration;
    saveSettings();
});

// Toast Position Setting

$(document).on("change", ".toastPositionSelection", (e) => {
    $(e.target).attr("checked", "checked")
    settings.toastPosition = $(e.target).val();
    ToastManager.toastLocation = settings.toastPosition;
    ToastManager.toastPosition();
    saveSettings();
});

// Leave Site Setting

$(document).on("change", ".leaveSiteSelection", (e) => {
    $(e.target).attr("checked", "checked")
    settings.leavesite = parseInt($(e.target).val());
    saveSettings();
});

// Event Functions

function disableEventLayers() {
    $(".bgContainer .layer").removeClass("christmasEvent"); // Add event classes to be removed
}

function enableChristmasLayers() {
    $(".bgContainer .layer").addClass("christmasEvent");
}

// Trigger More Resources Footer List

$(document).on("click", ".footer_more-btn", (e) => {
    $(e.currentTarget).toggleClass('selected');
});

//

const $dbpanel = $("#db-panel");
let dbi = 0;

function dbEnable() {
    $dbpanel.empty();
    dbi = 0;

    const d = $("<button/>").addClass("dbClose").html(`<i class="fas fa-times"></i>`);

    const d1 = $("<div/>").addClass("singleActionContainer");
        $("<button/>").addClass("dbActionButton").data("devToolType","tutorialSkip").html("Skip Tutorial").appendTo(d1);
        $("<button/>").addClass("dbActionButton").data("devToolType","godMode").html("God Mode").appendTo(d1);
        $("<button/>").addClass("dbActionButton").data("devToolType","addMaterial").html("Add Materials").appendTo(d1);
        $("<button/>").addClass("dbActionButton").data("devToolType","uiux").html("UI / UX Mode").appendTo(d1);
        $("<button/>").addClass("dbActionButton").data("devToolType","townUnlock").html("Unlock Town").appendTo(d1);
        $("<button/>").addClass("dbActionButton").data("devToolType","dungeonUnlock").html("Unlock Dungeons").appendTo(d1);
        $("<button/>").addClass("dbActionButton").data("devToolType","unlockHeroes").html("Unlock Heroes").appendTo(d1);
        $("<button/>").addClass("dbActionButton").data("devToolType","unlockPerks").html("Unlock Perks").appendTo(d1);
        $("<button/>").addClass("dbActionButton").data("devToolType","timeWarp").html("Time Warp").appendTo(d1);
        $("<button/>").addClass("dbActionButton").data("devToolType","clearBossBeats").html("Reset Bosses").appendTo(d1);

    const d4 = $("<div/>").addClass("addItemContainer dbActionContainer");
        const d4a = $("<div/>").addClass("addItemTitle").html("Add Item to Inventory");
        const d4b = $("<input/>").addClass("addItemName").attr("placeholder", "Item ID");
        const d4c = $("<input/>").addClass("addItemRarity").attr("placeholder", "Item Rarity");
        const d4d = $("<input/>").addClass("addItemSharp").attr("placeholder", "Item Sharp");
        const d4e = $("<button/>").addClass("addItemBtn dbActionButton").html("Add");
    d4.append(d4a,d4b,d4c,d4d,d4e);

    const d5 = $("<div/>").addClass("gearHeroesContainer dbActionContainer");
        const d5a = $("<div/>").addClass("gearHeroesTitle").html("Add Gear to Heroes");
        const d5b = $("<input/>").addClass("gearHeroesLevel").attr("placeholder", "Gear Level");
        const d5c = $("<input/>").addClass("gearHeroesRarity").attr("placeholder", "Gear Rarity");
        const d5d = $("<input/>").addClass("gearHeroesSharp").attr("placeholder", "Gear Sharp");
        const d5e = $("<button/>").addClass("gearHeroesBtn dbActionButton").html("Gear");
    d5.append(d5a,d5b,d5c,d5d,d5e);

    const d6 = $("<div/>").addClass("addGoldContainer dbActionContainer");
        const d6a = $("<div/>").addClass("addGoldTitle").html("Add Gold");
        const d6b = $("<input/>").addClass("addGoldInput").attr("placeholder", "0");
        const d6c = $("<button/>").addClass("addGoldBtn dbActionButton").html("Add");
    d6.append(d6a,d6b,d6c);

    const d7 = $("<div/>").addClass("adjustSpeedContainer dbActionContainer");
        const d7a = $("<div/>").addClass("adjustSpeedTitle").html("Adjust Speed");
        const d7b = $("<input/>").addClass("adjustSpeedInput").attr("placeholder", "0.0");
        const d7c = $("<button/>").addClass("adjustSpeedBtn dbActionButton").html("Adjust");
    d7.append(d7a,d7b,d7c);

    $dbpanel.append(d,d1,d4,d5,d6,d7);
    $dbpanel.css("display", "block");

    settings.db = 1;
    saveSettings();
    checkDB();
}

function addButtonDB() {
    let dbButton = $("#debug");
    if (!dbButton.length) {
        dbButton = $("<a/>").attr("id", "debug").addClass("isDialog tooltip").attr("data-tooltip", "debug").html(`<i class="fas fa-bug"></i><div class="footerButtonText">Debug</div>`)
        $("#bottom-left").append(dbButton);
    }
}

function checkDB() {
    if (settings.db === 1) addButtonDB();
}

checkDB();

$(document).on('click', '.dbActionButton', (e) => {
    const type = $(e.currentTarget).data("devToolType");
    if (type === "tutorialSkip") devtools.tutorialSkip();
    if (type === "godMode") devtools.godmode();
    if (type === "uiux") devtools.designmode();
    if (type === "addMaterial") devtools.materials();
    if (type === "townUnlock") devtools.forceTown();
    if (type === "dungeonUnlock") devtools.dungeonUnlock();
    if (type === "unlockHeroes") devtools.heroUnlock();
    if (type === "unlockPerks") devtools.allPerks();
    if (type === "timeWarp") devtools.timeWarp();
    if (type === "clearBossBeats") devtools.clearBossBeats();
});

$(document).on('click', '.addGoldBtn', (e) => {
    const goldAmount = parseInt(document.querySelector(".addGoldInput").value);
    devtools.addGold(goldAmount);
});

$(document).on('click', '.adjustSpeedBtn', (e) => {
    const speedAmount = parseFloat(document.querySelector(".adjustSpeedInput").value).toFixed(2);
    devtools.speed(speedAmount);
});

$(document).on('click', '.gearHeroesBtn', (e) => {
    let itemLevel = Math.min(10,parseInt(document.querySelector(".gearHeroesLevel").value));
    if (itemLevel === undefined) itemLevel = 1;
    let itemRarity = Math.min(3,parseInt(document.querySelector(".gearHeroesRarity").value));
    if (itemRarity === undefined) itemRarity = 3;
    let itemSharp = Math.min(10,parseInt(document.querySelector(".gearHeroesSharp").value));
    if (itemSharp === undefined) itemSharp = 0;
    devtools.gearHeroes(itemLevel,itemRarity,itemSharp);
});

$(document).on('click', '.addItemBtn', (e) => {
    let itemName = (document.querySelector(".addItemName").value).toString();
    let itemRarity = parseInt(document.querySelector(".addItemRarity").value);
    let itemSharp = parseInt(document.querySelector(".addItemSharp").value);
    devtools.addItem(itemName,itemRarity,itemSharp);
});


$(document).on('click', '.dbClose', (e) => {
    setDialogClose();
    settings.dialogStatus = 0;
    $dbpanel.css("display", "none");
});

$(document).on('click', '#debug', (e) => {
    settings.dialogStatus = 1;
    dbEnable();
});

$(document).on('click', '.recipeCraft', (e) => {
    const $button = $(e.currentTarget);
    $(".recipeCraft").removeClass('btn-press');
    $button.addClass('btn-press');
    resetBtnPressAnimation();
});

// Animation for Craft button clicks

function resetBtnPressAnimation() {
    const btns = document.getElementsByClassName('btn-press');
    Array.prototype.forEach.call(btns, (btn) => {
        btn.style.animation = 'none';
        btn.offsetHeight;
        btn.style.animation = null; 
    });
}

// Clear Settings

$(document).on('click', '#clearSettings', (e) => {
    e.preventDefault();
    clearSettings();
});