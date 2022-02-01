"use strict";
//creates a party as outlined in DungeonManager. Initated with CreateParty();

const $dtsHeader = $("#dtsHeader");
const $dtsMobsCollection = $("#dtsMobsCollection");
const $dtsDungeons = $("#dtsDungeons");
const $dungeonTeamCollection = $("#dungeonTeamCollection");
const $dtsBottom = $("#dtsBottom");
const $mobsToggleButton = $("#mobsToggleButton")

class Party {
    constructor (heroID) {
        this.heroID = heroID;
        this.heroes = heroID.map(h => HeroManager.idToHero(h));
    }
    createSave() {
        const save = {};
        save.heroID = this.heroID;
        return save;
    }
    hasMember(heroID) {
        return this.heroID.includes(heroID);
    }
    size() {
        return this.heroes.length;
    }
    alive() {
        return this.heroes.some(hero => !hero.dead());
    }
    isDead() {
        return this.heroes.every(hero => hero.dead());
    }
    addTime(t) {
        this.heroes.forEach(h=> {
            h.addTime(t, dungeonID);
        })
    }
    reset() {
        this.heroes.forEach(hero => {
            hero.hp = hero.maxHP();
            hero.resetPlaybookPosition();
            hero.removeBuffs();
        });
    }
}

const PartyCreator = {
    heroes : [null,null,null,null],
    dungeonSelect : null,
    areaSelect : null,
    mobPartyHidden: true,
    removeMember(ID) {
        const indx = this.heroes.findIndex(h=>h === ID);
        this.heroes[indx] = null;
    },
    addMember(heroID) {
        const indx = this.heroes.findIndex(h=>h === null);
        if (indx === -1) return false;
        this.heroes[indx] = heroID;
    },
    clearMembers() {
        const dungeon = DungeonManager.dungeonByID(this.dungeonSelect);
        this.heroes = new Array(dungeon.partySize).fill(null);
    },
    validTeam() {
        if (this.heroes.filter(h=>h !== null).length === 0) return false;
        const heroesReal = this.heroes.filter(h=>h !== null).map(hid => HeroManager.idToHero(hid));
        return heroesReal.every(h => h.alive());
    },
    lockParty() {
        this.heroes.filter(h=>h !== null).map(hid => HeroManager.idToHero(hid)).forEach(h=>{
            h.hp = h.maxHP();
        });
        const party = new Party(this.heroes.filter(h=>h !== null));
        this.heroes = [];
        return party;
    },
    startingTeam(team) {
        if (team === null) return;
        const statuses = team.map(h=>HeroManager.idToHero(h).state())
        if (statuses.some(h=>h !== HeroState.IDLE)) return;
        team.forEach(h => this.addMember(h));
    },
    emptyPartySlots() {
        const dungeon = DungeonManager.dungeonByID(this.dungeonSelect);
        return dungeon.partySize - this.heroes.filter(h=>!h).length;
    },
    setDungeon(dungeonid) {
        this.dungeonSelect = dungeonid;
    }
}

function startPartyCreation(partyStarted) {
    const area = PartyCreator.areaSelect;
    if (PartyCreator.dungeonSelect === null) {
        if (area.lastVisitedDungeon === null) PartyCreator.setDungeon(area.lastOpen().id);
        else PartyCreator.setDungeon(area.lastVisitedDungeon);
    }
    const dungeon = DungeonManager.dungeonByID(PartyCreator.dungeonSelect);
    if (!partyStarted) {
        PartyCreator.clearMembers();
        PartyCreator.startingTeam(dungeon.lastParty);
    }
    $areaTeamSelect.show();
    //Team Banner
    // Condition check needed to prevent animation from triggering on hero add/remove
    if (!partyStarted) {
        $dtsHeader.empty();
        $("<div/>").addClass(`dtsBackButton`).html(`<i class="fas fa-arrow-left"></i>`).appendTo($dtsHeader);
        $("<div/>").addClass(`dungeonAreaBanner`).css("background", `url(assets/images/dungeonpreviews/${area.id}.jpg)`).appendTo($dtsHeader);
        $("<div/>").addClass(`dungeonAreaTitle`).html(dungeon.name).appendTo($dtsHeader);
        const partyLaunch = $("<div/>").addClass(`partyLaunchButtonContainer`).appendTo($dtsHeader);
        if (dungeon.type === "boss" && !dungeon.beaten()) $("<div/>").attr("id", "dungeonTeamButtonBoss").addClass(`dungeonTeamButton actionButton`).html(displayText('adventure_launch_floor_boss')).appendTo(partyLaunch);
        else if (dungeon.type === "boss" && !DungeonManager.bossRefightUnlocked()) $("<div/>").addClass(`dungeonTeamButtonLocked tooltip`).attr({"data-tooltip":"boss_defeated"}).html(`${miscIcons.skull} ${displayText('adventure_launch_floor_boss_defeated')}`).appendTo(partyLaunch);
        else if (dungeon.type === "boss" && DungeonManager.bossRefightUnlocked()) {
            const button = $("<div/>").addClass(`dungeonTeamButton actionButton`).attr("id","dungeonTeamButtonBoss").html(displayText('adventure_launch_floor_boss_refight')).appendTo(partyLaunch);
                $("<div/>").addClass(`dungeonTeamButtonBossText tooltip`).attr({"data-tooltip":"boss_refight_count"}).html(`${miscIcons.skull} ${dungeon.maxFloor}`).appendTo(button);
        }
        else {
            $("<div/>").attr("id", "dungeonTeamButton").addClass(`dungeonTeamButton actionButton`).html(displayText('adventure_launch_floor')).appendTo(partyLaunch);
        }
    }
    // Needed to update dungeon title when previous code block does not trigger
    $(".dungeonAreaTitle").html(dungeon.name);
    //sorry richard i am using this space!!!
    $dtsMobsCollection.empty();
    dungeon.mobIDs.forEach(mobID => {
        mobCard(mobID).appendTo(dtsMobsCollection);
    });
    $mobsToggleButton.find(".actionButtonTextLeft").html(PartyCreator.mobPartyHidden ? displayText("enemy_party_show") : displayText("enemy_party_hide"));
    //Possible Dungeons
    $dtsDungeons.empty();
    area.dungeons.forEach(dungeon => {
        if (!dungeon.unlocked()) {
            const e = $("<div/>").addClass("dtsDungeon dtsLocked tooltip").attr({"data-tooltip":"dungeon_locked"}).appendTo(dtsDungeons);
            if (dungeon.type === "boss") e.attr({"data-tooltip":"dungeon_locked_boss"});
            $("<div/>").addClass("dtsMaterial").html(miscIcons.locked).appendTo(e);
            $("<div/>").addClass("dtsDungeonName").html(`${displayText("universal_locked")}`).appendTo(e);
            return;
        }
        const d = $("<div/>").addClass("dtsDungeon").data("dungeonID",dungeon.id).appendTo(dtsDungeons);
        if (PartyCreator.dungeonSelect === dungeon.id) d.addClass("dtsHighlight");
        if (dungeon.mat !== null) {
            const mat = ResourceManager.idToMaterial(dungeon.mat);
            const matBox = $("<div/>").addClass("dtsMaterial tooltip").attr({"data-tooltip":"material_desc","data-tooltip-value":dungeon.mat}).appendTo(d);
                $("<div/>").addClass("dtsMatIcon").html(mat.img).appendTo(matBox);
                $("<div/>").addClass("dtsMatAmt").html(mat.amt).appendTo(matBox);
        }
        $("<div/>").addClass("dtsDungeonName").html(dungeon.name).appendTo(d);
    });
    $dungeonTeamCollection.empty();
    //actual members
    PartyCreator.heroes.forEach((hero,i) => {
        if (i >= dungeon.partySize) return;
        const a = characterCard("dungeonTeam",i,hero).prependTo($dungeonTeamCollection);
        if (!hero) a.addClass("noHeroDungeonSelect");
    });
    const $dungeonTeamButton = $("#dungeonTeamButton");
    const $dungeonTeamButtonBoss = $("#dungeonTeamButtonBoss")
    if (PartyCreator.heroes.length === 0) {
        $dungeonTeamButton.addClass('dungeonStartNotAvailable');
        $dungeonTeamButtonBoss.addClass('dungeonStartNotAvailable');
    }
    else {
        $dungeonTeamButton.removeClass('dungeonStartNotAvailable');
        $dungeonTeamButtonBoss.removeClass('dungeonStartNotAvailable');
    }
    $dtsBottom.empty();
    //available heroes
    const d1bot = $("<div/>").addClass("dtsSelectHeader");
        const d1bota = $("<div/>").addClass("headingDetails").appendTo(d1bot);
        $("<div/>").addClass("headingTitle").html(displayText("header_party_heroes_title")).appendTo(d1bota);
        $("<div/>").addClass("headingDescription").html(displayText("header_party_heroes_desc")).appendTo(d1bota);
    $dtsBottom.append(d1bot);
    const d2 = $("<div/>").addClass("dungeonAvailableCollection");
    HeroManager.ownedHeroes().forEach(hero => {
        //if (dungeon.bannedHero.includes(hero.id)) characterCard("heroBanned dungeonNotAvailable",hero.uniqueid,hero.id, "Banned from Here").appendTo(d2);
        if (hero.state() === HeroState.DUNGEON) characterCard("dungeonNotAvailable",hero.uniqueid,hero.id,"in_dungeon").appendTo(d2);
        else if (hero.state() === HeroState.QUEST) characterCard("dungeonNotAvailable",hero.uniqueid,hero.id,"in_quest").appendTo(d2);
        else if (PartyCreator.heroes.includes(hero.id)) characterCard("partyHero dungeonNotAvailable",hero.uniqueid,hero.id,"in_party").appendTo(d2);
        else characterCard("dungeonAvailable",hero.uniqueid,hero.id,null).appendTo(d2);
    });
    $dtsBottom.append(d2);
}

function toggleMobsPreview() {
    if ($dtsMobsCollection.hasClass("collapsedMobsCollection")) {
        $dtsMobsCollection.removeClass("collapsedMobsCollection hideMobsCollection").addClass("showMobsCollection");
        $mobsToggleButton.addClass("toggledOn");
        $mobsToggleButton.find(".actionButtonTextLeft").html(displayText("enemy_party_hide"));
        PartyCreator.mobPartyHidden = false;
    }
    else {
        $dtsMobsCollection.addClass("hideMobsCollection").removeClass("showMobsCollection");
        $mobsToggleButton.removeClass("toggledOn");
        $mobsToggleButton.find(".actionButtonTextLeft").html(displayText("enemy_party_show"));
        setTimeout(() => {
            $dtsMobsCollection.addClass("collapsedMobsCollection")
        }, 200);
        PartyCreator.mobPartyHidden = true;
    }
}

$(document).on('click', "#mobsToggleButton", (e) => {
    e.preventDefault();
    toggleMobsPreview();
});

//change dungeon selection
$(document).on('click', ".dtsDungeon", (e) => {
    e.preventDefault();
    const dungeonid = $(e.currentTarget).data("dungeonID");
    if (!dungeonid || PartyCreator.dungeonSelect === dungeonid) return;
    PartyCreator.setDungeon(dungeonid);
    startPartyCreation(false);
});

//Go back to dungeon select screen
$(document).on('click', ".dtsBackButton", (e) => {
    e.preventDefault();
    dungeonsTabClicked();
});

//clicking a hero to remove them from your party
$(document).on('click', "div.dungeonTeamCardClick", (e) => {
    e.preventDefault();
    const heroID = $(e.currentTarget).attr("heroID");
    PartyCreator.removeMember(heroID);
    startPartyCreation(true);
    destroyTooltip();
});

//clicking a hero to add them to your party
$(document).on('click', "div.dungeonAvailableCardClick", (e) => {
    e.preventDefault();
    const ID = $(e.currentTarget).attr("heroid");
    PartyCreator.addMember(ID);
    startPartyCreation(true);
});

//potentially remove a hero in the party
$(document).on('click', "div.dungeonNotAvailableCardClick", (e) => {
    e.preventDefault();
    const ID = $(e.currentTarget).attr("heroid");
    const hero = HeroManager.idToHero(ID);
    if (!PartyCreator.heroes.includes(ID)) return;
    PartyCreator.removeMember(ID);
    startPartyCreation(true);
});

//locking in a team to start a dungeon
$(document).on('click', "#dungeonTeamButton", (e) => {
    e.preventDefault();
    if (PartyCreator.validTeam()) {
        DungeonManager.createDungeon(PartyCreator.dungeonSelect,false);
        initializeSideBarDungeon();
        $areaTeamSelect.hide();
        $dungeonRun.show();
    }
    else {
        ToastManager.renderToast("no_party_selected");
    }
});

$(document).on('click', "#dungeonTeamButtonBoss", (e) => {
    e.preventDefault();
    if (PartyCreator.validTeam()) {
        DungeonManager.createDungeon(PartyCreator.dungeonSelect,true);
        initializeSideBarDungeon();
        $areaTeamSelect.hide();
        $dungeonRun.show();
    }
    else {
        ToastManager.renderToast("no_party_selected");
    }
});

function characterCard(prefix,dv,ID,status) {
    const d = $("<div/>").addClass(prefix+"Card").attr("data-value",dv);
    // Create empty stats container for empty party slots
    const heroStatsContainer = $("<div/>").addClass(`heroStatsContainer emptyPartySlot`);
        const hpStat= $("<div/>").addClass(`heroStat`).appendTo(heroStatsContainer);
            const hpStatValue = $("<div/>").addClass('statValue').appendTo(hpStat);
        const powStat = $("<div/>").addClass(`heroStat`).appendTo(heroStatsContainer);
            const powStatValue = $("<div/>").addClass('statValue').appendTo(powStat);
    // Return empty party slot    
    if (!ID) {
        $("<div/>").addClass(prefix+"Image").html('<i class="fas fa-question-circle"></i>').appendTo(d);
        $("<div/>").addClass(prefix+"Name").html(displayText("slot_party_empty")).appendTo(d);
        heroStatsContainer.appendTo(d)
        return d;
    }
    // Return hero cards with stats
    const dclick = $("<div/>").addClass(prefix+"CardClick").attr("heroID",ID).appendTo(d);
    const hero = HeroManager.idToHero(ID);
    generateSlotClass(hero.type).appendTo(d);
    $("<div/>").addClass(prefix+"Image").html(hero.image).appendTo(dclick);
    $("<div/>").addClass(prefix+"Name").html(hero.name).appendTo(dclick);
    const playbookButton = $("<div/>").addClass(`${prefix}Playbook heroPlaybook tooltip`).data("heroID",ID).attr({"data-tooltip": "playbooks_view", "data-tooltip-value": hero.playbook.id, "data-dialog-id": "playbook"}).html(SkillManager.idToSkill(hero.playbook.playbookIcon).icon).appendTo(dclick);
    $("<div/>").addClass("heroPlaybookTier").html('<i class="fas fa-book"></i>').appendTo(playbookButton);
    const d3 = $("<div/>").addClass(prefix+"Stats").appendTo(dclick);
        hpStat.addClass(`${prefix}HP tooltip`).attr("data-tooltip","hp").html(`${miscIcons.hp}`).appendTo(d3);
            hpStatValue.html(`${hero.maxHP()}`).appendTo(hpStat);
        powStat.addClass(`${prefix}Pow tooltip`).attr("data-tooltip","pow").html(`${miscIcons.pow}`).appendTo(d3);
            powStatValue.html(`${hero.getPow()}`).appendTo(powStat);
    heroStatsContainer.appendTo(d3);
    // Add status to hero cards with character statuses present (e.g. In Combat, In Party)
    if (status !== null && status !== undefined) {
        if (status === "in_dungeon") $("<div/>").addClass("heroStatus tooltip statusDungeon").attr({"data-tooltip": "hero_in_combat"}).html(`<i class="fas fa-swords"></i>`).appendTo(dclick);
        if (status === "in_party") $("<div/>").addClass("heroStatus tooltip statusParty").attr({"data-tooltip": "hero_in_party"}).html(`<i class="fas fa-check"></i>`).appendTo(dclick);
        if (status === "in_quest") $("<div/>").addClass("heroStatus tooltip statusQuest").attr({"data-tooltip": "hero_in_quest"}).html(`${miscIcons.quest}`).appendTo(dclick);
    }
    return d;
}

function renderHeroDialogActions(hero) {
    const playbooksContainer = $("<div/>").addClass('examinePartyPlaybooksContainer');
    generateHeroPlaybooks(hero).appendTo(playbooksContainer);
    return playbooksContainer;
}

function setHeroDialogOpen(heroID) {
    const hero = HeroManager.idToHero(heroID);
    // Dialog Parent Containers
    const dialogContainer = $("<div/>").attr({id: 'dialogContainer'}).addClass('dialogContainer').appendTo(document.body);
    const dialogBoxContainer = $("<div/>").addClass('heroPlaybookDialog dialogContent dialogOpening').appendTo(dialogContainer);
    // Dialog Upper Content
    const dialogClose = $("<div/>").attr({role: "button", tabindex: 1, 'aria-label': "Close Dialog"}).addClass('dialogClose').html('<i class="fas fa-times"></i>').appendTo(dialogBoxContainer);
    const dialogTitle = $("<div/>").addClass('dialogTitle').appendTo(dialogBoxContainer);
      $("<div/>").addClass('dialogTitleIcon heroPlayBookDialogPortrait').html(hero.portrait).appendTo(dialogTitle);
      $("<div/>").addClass('dialogTitleText').html(`${hero.name}'s Playbooks`).appendTo(dialogTitle);
    const dialogContentContainer = $("<div/>").addClass('dialogContentContainer').appendTo(dialogBoxContainer);
    if (hero.description) $("<div/>").addClass('dialogDescription').html(hero.description).appendTo(dialogContentContainer);
    const dialogActions = renderHeroDialogActions(hero);
    dialogActions.appendTo(dialogContentContainer);
    // Settings update
    settings.dialogStatus = 1;
    saveSettings();
  }

$(document).on('click', '.heroPlaybook', (e) => {
    e.stopPropagation();
    const id = $(e.currentTarget).attr("data-dialog-id");
    const heroID = $(e.currentTarget).data("heroID");
    if (settings.dialogStatus === 0 && id) setHeroDialogOpen(heroID);
  });

function mobCard(mobID) {
    const mob = MobManager.idToMob(mobID);
    const d = $("<div/>").addClass("dtsMobDiv");
    $("<div/>").addClass("dtsMobPic").html(mob.image).appendTo(d);
    $("<div/>").addClass("dtsMobName").html(mob.name).appendTo(d);
    generateSkillIcons(mob).appendTo(d);
    generatePassiveSkill(mob).appendTo(d);
    return d;
}