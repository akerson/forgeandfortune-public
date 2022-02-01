/*Dungeons consist of three sets of screens:
Clicking on the "Adventures" tab will relocate to the area screen.
This screen JUST has a list of areas on it. You can see the status
of any areas (as well as which are available).

Clicking on a area WITHOUT a team there brings you to the party selection
screen, where you can select the dungeon and a party. Confirming
a party locks it in and begins the dungeon and brings you to third screen

Adventure screen! Get here by clicking on an area with a group or confirming
a group...
*/

//tabs
const $dungeonSelect = $("#dungeonSelect");
const $trophyAssign = $("#trophyAssign");
const $areaSelect = $("#areaSelect");
const $areaTeamSelect = $("#areaTeamSelect");
const $dungeonRun = $("#dungeonRun");

const $DungeonSideBarTeam = $("#DungeonSideBarTeam");

/*---------------------------
  -     AREA SELECT CODE    -
  ---------------------------*/

function dungeonsTabClicked() {
    DungeonManager.dungeonView = null;
    AreaManager.areaView = null;
    $dungeonSelect.show();
    $areaSelect.show();
    $areaTeamSelect.hide();
    $dungeonRun.hide();
    generateAreaSelect();
    refreshAreaSelect();
}

function generateAreaSelect() {
    $areaSelect.empty();
    // Area Header
    const adventureAreaHeaderContainer = $("<div/>").addClass(`adventureAreaHeader contentHeader`).prependTo($areaSelect);
    const adventureAreaHeader = $("<div/>").addClass(`contentHeading`).appendTo(adventureAreaHeaderContainer);
        $("<div/>").addClass("headingIcon").html('<i class="fas fa-swords"></i>').appendTo(adventureAreaHeader);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(adventureAreaHeader);
        $("<div/>").addClass("headingTitle").html(displayText("header_adventure_areas_title")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("header_adventure_areas_desc")).appendTo(headingDetails);
    $("<div/>").addClass("dungeonAbandonAll actionButton").attr({id: "dAbandonAll"}).html(displayText("adventure_dungeon_abandon_all")).appendTo(adventureAreaHeaderContainer);
    // Area Listings
    $("<div/>").addClass("areaListings").attr({id: "areaListings"}).appendTo($areaSelect);
}

function refreshAreaSelect() {
    $("#areaListings").empty();
    AreaManager.areas.forEach(area => {
        if (!area.unlocked()) return;
        createAreaBlock(area).appendTo($("#areaListings"));
    });
}

function createAreaBlock(area) {
    const statuses = ["adventure_area_status_idle","adventure_area_status_in_progress","adventure_area_status_success","adventure_area_status_failure"];
    const d = $("<div/>").addClass("areaContainer").data("areaID",area.id);
    const e = $("<div/>").addClass("areaHeader").html(area.name).appendTo(d);
    $("<div/>").addClass("dungeonBackground").css("background-image",`url(assets/images/dungeonpreviews/${area.id}.jpg)`).appendTo(d);
    const d1 = $("<div/>").addClass("areaStatus").html(displayText(statuses[area.status()])).appendTo(d);
    if (area.status() === DungeonStatus.EMPTY) return d;
    if (area.status() === DungeonStatus.ADVENTURING) d1.addClass("statusAdventuring");
    if (area.status() === DungeonStatus.SUCCESS) d1.addClass("statusSuccess");
    if (area.status() === DungeonStatus.FAILURE) d1.addClass("statusFailure");
    e.html(area.activeDungeonName());
    const d2 = $("<div/>").addClass("areaAdventurers").appendTo(d);
    area.activeParty().heroes.forEach(h=> {
        $("<div/>").addClass("areaHero").html(h.head).appendTo(d2);
    });
    return d;    
}

//click on a dungeon to start making a team!
$(document).on("click", ".areaContainer", (e) => {
    e.preventDefault();
    const areaID = $(e.currentTarget).data("areaID");
    AreaManager.areaView = areaID;
    screenDirectDungeon(areaID);
});

$(document).on("click", "#dAbandonAll", (e) => {
    e.preventDefault();
    DungeonManager.abandonAllDungeons();
    refreshAreaSelect()
});

function screenDirectDungeon(areaID) {
    $areaSelect.hide();
    $areaTeamSelect.hide();
    $dungeonRun.hide();
    const area = AreaManager.idToArea(areaID);
    if (area.status() === DungeonStatus.EMPTY) {
        PartyCreator.areaSelect = area;
        PartyCreator.dungeonSelect = null;
        startPartyCreation(false);
    }
    else {
        showDungeon(area.activeDungeonID());
    }
}

/*-----------------------------------------
/*-   DUNGEON RUNNING CODE
/*-----------------------------------------*/

function showDungeon(dungeonID) {
    DungeonManager.dungeonView = dungeonID;
    $dungeonRun.show();
    initiateDungeonFloor(dungeonID);
}

$(document).on("click", ".dungeonAbandon", (e) => {
    e.preventDefault();
    DungeonManager.abandonCurrentDungeon();
})


const $floorID = $("#floorID");
const $dungeonHeroList = $("#dungeonHeroList");
const $dungeonMobList = $("#dungeonMobList");
const $drTurnOrder = $("#drTurnOrder");
const $combatBackgroundContainer = $("#combatBackgroundContainer");
const $combatFloorExit = $("#combatFloorExit");
const $combatFloorStatus = $("#combatFloorStatus");
const $combatFloorHelp = $("#combatFloorHelp");

function initiateDungeonFloor(dungeonID) {
    if (DungeonManager.dungeonView !== dungeonID) return;
    const dungeon = DungeonManager.dungeonByID(DungeonManager.dungeonView);
    $dungeonRun.removeClass().addClass(dungeon.id);
    $combatBackgroundContainer.css({backgroundImage: `url(assets/images/dungeonBackgrounds/${dungeon.area}.jpg)`});
    if (dungeon.type === "boss") {
        $dungeonRun.addClass("DBoss");
        $floorID.hide();
    }
    else {
        $floorID.show().html("Floor "+dungeon.floor);
    }
    if (dungeon.status === DungeonStatus.ADVENTURING) {
        $combatFloorExit.hide();
    }
    else if (dungeon.status === DungeonStatus.SUCCESS) {
        $combatFloorExit.show();
        $combatFloorStatus.html(displayText("adventure_area_status_success")).addClass("combatFloorSuccess").removeClass("combatFloorFailure");
        $combatFloorHelp.html(displayText("adventure_area_desc_success"));
    }
    else if (dungeon.status === DungeonStatus.FAILURE) {
        $combatFloorExit.show();
        $combatFloorStatus.html(displayText("adventure_area_status_failure")).removeClass("combatFloorSuccess").addClass("combatFloorFailure");
        $combatFloorHelp.html(displayText("adventure_area_desc_failure"));
    }
    $dungeonHeroList.empty();
    $dungeonMobList.empty();
    dungeon.party.heroes.forEach(hero => {
        const d1 = $("<div/>").addClass("dfc").attr("id","dfc"+hero.uniqueid);
        const d2 = $("<div/>").addClass("buffListContent").attr("id","buffList"+hero.uniqueid);
        const d3 = $("<div/>").addClass("dfcName").html(hero.name);
        const d4 = $("<div/>").addClass("dfcImage").html(hero.image);
        d1.append(d2,d3,d4);
        if (hero.hp === 0) d1.addClass("heroDead");
        $dungeonHeroList.prepend(d1);
    });
    dungeon.mobs.forEach((mob) => {
        const d6 = $("<div/>").addClass("dfm").attr("id","dfm"+mob.uniqueid);
        const d7 = $("<div/>").addClass("buffListContent").attr("id","buffList"+mob.uniqueid);
        const d8 = $("<div/>").addClass("dfmName").html(mob.name);
        const d9 = $("<div/>").addClass("dfmImage").attr("id","mobImage"+mob.uniqueid).html(mob.image);
        if (mob.event === 'boss') d6.addClass("dfmBoss");
        d6.append(d7,d8,d9);
        if (mob.hp === 0) d6.addClass("mobDead");
        $dungeonMobList.append(d6);
    });
    generateTurnOrder(dungeonID);
    BuffRefreshManager.hardRefreshBuff();
}

function generateTurnOrder(dungeonID) {
    if (DungeonManager.dungeonView !== dungeonID) return;
    $drTurnOrder.empty();
    const dungeon = DungeonManager.dungeonByID(DungeonManager.dungeonView);
    const mobs = [dungeon.mob1, dungeon.mob2, dungeon.mob3, dungeon.mob4];
    dungeon.order.getOrder().forEach((unit,i) => {
        const d1 = $("<div/>").addClass("orderUnit").appendTo($drTurnOrder);
        if (mobs.includes(unit.id)) {
            d1.addClass("mobUnit");
            $("<div/>").addClass("mobUnitTag").html("Enemy").appendTo(d1);
        }
        $("<div/>").addClass("orderUnitHeadImg").html(unit.head).appendTo(d1);
        $("<div/>").addClass("orderUnitHead").html(unit.name).appendTo(d1);
        $("<div/>").addClass("orderUnitHP").html(createHPBar(unit,"turnOrder")).appendTo(d1);
        const d1a = $("<div/>").attr("id","orderSkills"+unit.uniqueid).addClass("orderSkills").appendTo(d1);
        generateSkillIcons(unit).appendTo(d1a);
        generatePassiveSkill(unit).appendTo(d1a);
        const d2 = $("<div/>").addClass("beatBarDiv").appendTo(d1);
        $("<span/>").addClass("beatBarFill").attr("id","beatbarFill"+unit.uniqueid).css('width', "0%").appendTo(d2);
    });
    refreshTurnOrder(dungeonID);
}

function refreshSkillUnit(target) {
    const d = $("#orderSkills"+target.uniqueid).empty();
    generateSkillIcons(target).appendTo(d);
    generatePassiveSkill(target).appendTo(d);
}

function refreshTurnOrder(dungeonID) {
    if (DungeonManager.dungeonView !== dungeonID) return;
    const dungeon = DungeonManager.dungeonByID(DungeonManager.dungeonView);
    const uniqueid = dungeon.order.getCurrentID();
    $(".orderUnit").removeClass("orderUnitActive");
    $("#orderUnit"+uniqueid).addClass("orderUnitActive");
    $(".orderUnitSkill").removeClass("orderUnitActiveSkill");
    dungeon.order.getOrder().forEach(unit => {
        const skillNum = unit.getActiveSkill();
        $("#oUS"+unit.uniqueid+skillNum).addClass("orderUnitActiveSkill")
    });
}

function generateSkillIcons(unit) {
    const d1 = $("<div/>").addClass("orderUnitSkills");
    const skillIDs = unit.getSkillIDs();
    unit.getSkillIcons().forEach((icon,i) => {
        $("<div/>").addClass("orderUnitSkill tooltip").attr({"id":"oUS"+unit.uniqueid+i,"data-tooltip":"skill_desc","data-tooltip-value":skillIDs[i]}).html(icon).appendTo(d1);
    });
    return d1;
}

function generatePassiveSkill(unit) {
    const d1 = $("<div/>").addClass("orderUnitPassiveSkill");
    const passiveID = unit.passiveSkill;
    if (passiveID) $("<div/>").addClass("orderUnitPassive tooltip").attr({"id":"oUP"+unit.id,"data-tooltip":"skill_desc","data-tooltip-value":passiveID}).html(SkillManager.idToSkill(passiveID).icon).appendTo(d1);
    return d1;
}

const $dungeonTab = $("#dungeonTab");

function initializeSideBarDungeon() {
    $DungeonSideBarTeam.empty();
    AreaManager.areas.forEach(area => {
        if (area.type === "boss" || !area.unlocked()) return;
        const d = $("<div/>").addClass("dungeonGroup").appendTo($DungeonSideBarTeam);
        const d1 = $("<div/>").addClass("DungeonSideBarStatus").data("areaID",area.id).appendTo(d);
        if (area.status() === DungeonStatus.ADVENTURING) {
            d1.addClass("DungeonSideBarAdventuring");
            const dungeon = area.activeDungeon();
            const text = dungeon.floorClear === 0 ? `${dungeon.name}` : `${dungeon.name} - ${dungeon.floorClear}`;
            $("<div/>").addClass("dungeonSidebarFloor").attr("id","dsb"+dungeon.id).html(text).appendTo(d1);
            $("<div/>").addClass("dungeonSidebarReward").html(createDungeonSidebarReward(dungeon)).appendTo(d);
        }
        else {
            d1.html(area.name);
            $("<div/>").addClass("dungeonSidebarReward").html("&nbsp;").appendTo(d);
        }
    });
};

function refreshSidebarDungeonMats(dungeonID) {
    const dungeon = DungeonManager.dungeonByID(dungeonID);
    if (dungeon.type === "boss") return;
    const rewards = dungeon.getRewards();
    $(`#dRR${dungeonID} .dungeonRewardRateIcon`).html(ResourceManager.materialIcon(rewards.id));
    $(`#dRR${dungeonID} .dungeonRewardRateAmt`).html(`+${rewards.amt}`);
}

function refreshDungeonMatBar(dungeonid) {
    const dungeon = DungeonManager.dungeonByID(dungeonid);
    const matWidth = dungeon.rewardTimeRate === 0 ? "0%" : (dungeon.rewardTime/dungeon.rewardTimeRate*100).toFixed(1)+"%";
    $("#dsbrf"+dungeonid).css('width',matWidth);
    $("#dsbr"+dungeonid).html(ResourceManager.materialAvailable(dungeon.mat));
}

function createHPBar(hero,tag) {
    const hpPercent = hero.hp/hero.maxHP();
    const hpBarText = hero.hp+" / "+hero.maxHP();
    const hpWidth = (hpPercent*100).toFixed(1)+"%";
    const options = {
        prefix: "hp",
        tooltip: "hp",
        icon: miscIcons.hp,
        text: hpBarText,
        textID: "hp"+tag+hero.uniqueid,
        width: hpWidth,
        fill: "hpFill"+tag+hero.uniqueid
    }
    return generateProgressBar(options);
}

function refreshBeatBar(uniqueid,dungeonTime) {
    const beatWidth = (dungeonTime/DungeonManager.speed*100).toFixed(1)+"%";
    $("#beatbarFill"+uniqueid).css('width',beatWidth);
}

function refreshHPBar(hero) {
    if (lastTab !== "dungeonsTab") return;
    const hpPercent = hero.hp/hero.maxHP();
    const hpBarText = hero.hp+" / "+hero.maxHP();
    const hpWidth = (hpPercent*100).toFixed(1)+"%";
    $(`#hpturnOrder${hero.uniqueid}`).html(hpBarText);
    $(`#hpFillturnOrder${hero.uniqueid}`).css('width', hpWidth);
}

function createDungeonSidebarReward(dungeon) {
    const matWidth = dungeon.rewardTimeRate === 0 ? "0%" : (dungeon.rewardTime/dungeon.rewardTimeRate).toFixed(1)+"%";
    const d = $("<div/>").addClass("dungeonRewardDiv tooltip").attr({"data-tooltip":"dungeon_material_gain_rate","data-tooltip-value":dungeon.id});
        const t1 = $("<div/>").addClass("dungeonRewardRate").attr("id","dRR"+dungeon.id).appendTo(d);
            $("<div/>").addClass("dungeonRewardRateIcon").html(`${ResourceManager.materialIcon(dungeon.mat)}`).appendTo(t1);
            $("<div/>").addClass("dungeonRewardRateAmt").attr("id","dRA"+dungeon.id).html(`+${dungeon.rewardAmt}`).appendTo(t1);
    const options = {
        prefix: "dungeonReward",
        text: ResourceManager.materialAvailable(dungeon.mat).toString(),
        textID: "dsbr"+dungeon.id, 
        width: matWidth,
        fill: "dsbrf"+dungeon.id
    }
    return d.append(generateProgressBar(options));
}


//Go back to dungeon select screen
$(document).on('click', ".dungeonBackButton", (e) => {
    e.preventDefault();
    dungeonsTabClicked();
});
