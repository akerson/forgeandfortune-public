"use strict";

const ExpeditionManager = {
    expeditions : [],
    quests : [],
    partyBuild : [],
    count : 0, //used just for uniqueid purposes
    addExpedition(party) {
        const expedition = new Expedition(this.count);
        this.count += 1;
        expedition.assignParty(party);
        this.expeditions.push(expedition);
    },
    lockParty() {
        this.addExpedition(this.partyBuild);
        this.partyBuild = [];
    },
    createSave() {
        const save = {};
        save.expeditions = [];
        this.expeditions.forEach(e=>{
            save.expeditions.push(e.createSave());
        });
        return save;
    },
    loadSave(save) {
        save.expeditions.forEach(expedition => {
            const e = new Expedition(this.count);
            this.count += 1;
            e.loadSave(expedition);
            this.expeditions.push(e);
        })
    },
    idToExpedition(eid) {
        return this.expeditions.find(e=>e.id === eid);
    },
    addTime(ms) {
        this.expeditions.forEach(expedition => {
            expedition.addTime(ms);
        })
        updateExpeditions();
    },
    collect(eid) {
        const expedition = this.idToExpedition(eid);
        expedition.collect();
        this.quests.forEach(quest => quest.playbookUnlock(expedition.party,expedition.goal));
        this.expeditions = this.expeditions.filter(e=>e.id !== eid);
        refreshTownHasEvents();
    },
    heroLocked(heroID) {
        return this.expeditions.map(e=>e.party).some(e=>e.includes(heroID));
    },
    addMember(heroID) {
        const hero = HeroManager.idToHero(heroID);
        if (hero.state() !== HeroState.IDLE) return;
        if (this.partyBuild.includes(heroID)) this.partyBuild = this.partyBuild.filter(h=>h !== heroID);
        else this.partyBuild.push(heroID);
    },
    clearMembers() {
        this.partyBuild = [];
    },
    partyPower() {
        return this.partyBuild.map(h=>HeroManager.idToHero(h)).map(p=>p.getPow(true)).reduce((a,b)=>a+b,0);
    },
    partyHP() {
        return this.partyBuild.map(h=>HeroManager.idToHero(h)).map(p=>p.maxHP(true)).reduce((a,b)=>a+b,0);
    },
    efficiency() {
        if (this.partyBuild.length === 0) return 0;
        return miscLoadedValues.expEff[this.partyBuild.length-1];
    },
    addQuest(quest) {
        this.quests.push(quest);
    },
    idToQuest(qid) {
        return this.quests.find(q=>q.id === qid);
    },
    questComplete(qid) {
        return this.idToQuest(qid).complete();
    },
    availableQuests() {
        return this.quests.filter(q=>q.unlocked() && !q.complete())
    },
    questTeam(qid) {
        //replaces your party with a team that can do the quest
        const quest = this.idToQuest(qid);
        const hero1 = HeroManager.idToHero(quest.hero1);
        if (hero1.state() !== HeroState.IDLE) return ToastManager.renderToast("quest_hero_not_available");
        const hero2 = HeroManager.idToHero(quest.hero2);
        if (hero2 !== undefined && hero2.state() !== HeroState.IDLE) return ToastManager.renderToast("quest_hero_not_available");
        const hero3 = HeroManager.idToHero(quest.hero3);
        if (hero3 !== undefined && hero3.state() !== HeroState.IDLE) return ToastManager.renderToast("quest_hero_not_available");
        const hero4 = HeroManager.idToHero(quest.hero4);
        if (hero4 !== undefined && hero4.state() !== HeroState.IDLE) return ToastManager.renderToast("quest_hero_not_available");
        this.partyBuild = [quest.hero1];
        if (hero2 !== undefined) this.partyBuild.push(quest.hero2);
        if (hero3 !== undefined) this.partyBuild.push(quest.hero3);
        if (hero4 !== undefined) this.partyBuild.push(quest.hero4);
        refreshExpeditionParty();
    }
}

class Quest {
    constructor(props) {
        Object.assign(this, props);
    }
    complete() {
        return PlaybookManager.playbookUnlocked(this.reward);
    }
    unlocked() {
        return Shop.alreadyPurchased(this.unlockReq);
    }
    playbookUnlock(party,landmark) {
        if (!this.unlocked() || this.complete()) return;
        if (landmark < this.landmark) return;
        const questParty = [this.hero1];
        if (this.hero2 !== null) questParty.push(this.hero2);
        if (this.hero3 !== null) questParty.push(this.hero3);
        if (this.hero4 !== null) questParty.push(this.hero4);
        if (party.length !== questParty.length) return;
        let sameparty = true;
        for (let i=0;i<party.length;i++) {
            if (party[i] !== questParty[i]) {
                sameparty = false;
                break;
            }
        }
        if (!sameparty) return;
        PlaybookManager.unlockPlaybook(this.reward);
        ToastManager.renderToast("playbook_unlock",this.heroName);
    }
}

class Expedition {
    constructor(count) {
        this.id = count;
        this.party = null;
        this.nextGoal = 0;
        this.distance = 0;
        this.goal = 0;
        this.time = 0;
        this.displayDistance = 0;
    }
    createSave() {
        const save = {};
        save.party = this.party;
        save.nextGoal = this.nextGoal;
        save.distance = this.distance;
        save.hp = this.hp;
        save.pow = this.pow;
        save.goal = this.goal;
        save.rate = this.rate;
        save.efficiency = this.efficiency;
        return save;
    }
    loadSave(save) {
        this.party = save.party;
        this.nextGoal = save.nextGoal;
        this.distance = save.distance;
        this.hp = save.hp;
        this.pow = save.pow;
        this.goal = save.goal;
        this.rate = save.rate;
        this.efficiency = save.efficiency;
        this.goalText = this.goal;
        this.landmarkName = displayText("expedition_name_"+(this.goal));
        this.goalText = this.goal+1;
        if (this.goal < 25) {
            this.nextLandmark = displayText("expedition_name_"+(this.goal+2));
            this.landmarkName = displayText("expedition_name_"+(this.goal+1));
            this.landmarkDesc = displayText("expedition_desc_"+(this.goal+1));
        }
        else {
            this.goalText = "25";
            this.nextLandmark = "None";
            this.landmarkName = displayText("expedition_name_25");
            this.landmarkDesc = displayText("expedition_desc_25");
        }
        if (this.goal === 24) this.nextLandmark = "None";
        this.powDiff = miscLoadedValues.expPow[this.goal];
        this.hpDiff = miscLoadedValues.expHP[this.goal];
    }
    heroes() {
        if (this.party === null) return [];
        return this.party.map(h=>HeroManager.idToHero(h));
    }
    assignParty(arrayOfHeroes) {
        this.party = arrayOfHeroes;
        this.hp = this.heroes().map(h=>h.maxHP(true)).reduce((a,b)=>a+b,0);
        this.pow = this.heroes().map(p=>p.getPow(true)).reduce((a,b)=>a+b,0);
        this.efficiency = miscLoadedValues.expEff[arrayOfHeroes.length-1];
        this.assignNextGoal();
    }
    assignNextGoal() {
        this.nextGoal = Math.ceil(miscLoadedValues.expHP[this.goal]**2/(this.hp*this.efficiency));
        this.hp = this.heroes().map(h=>h.maxHP(true)).reduce((a,b)=>a+b,0);
        this.pow = this.heroes().map(p=>p.getPow(true)).reduce((a,b)=>a+b,0);
        this.rate = Math.max(1,Math.ceil(this.pow*this.efficiency-Math.max(1,miscLoadedValues.expPow[this.goal])));
        this.goalText = this.goal+1;
        if (this.goal < 25) {
            this.nextLandmark = displayText("expedition_name_"+(this.goal+2));
            this.landmarkName = displayText("expedition_name_"+(this.goal+1));
            this.landmarkDesc = displayText("expedition_desc_"+(this.goal+1));
        }
        else {
            this.nextLandmark = "None";
            this.landmarkName = displayText("expedition_name_25");
            this.landmarkDesc = displayText("expedition_desc_25");
            refreshTownHasEvents();
        }
        if (this.goal === 24) this.nextLandmark = "None";
        this.landmarkDesc = displayText("expedition_desc_"+(this.goal+1));
        this.powDiff = miscLoadedValues.expPow[this.goal];
        this.hpDiff = miscLoadedValues.expHP[this.goal];
    }
    distanceRemaining() {
        return this.nextGoal - this.distance;
    }
    timeRemaining() {
        const timeRemaining = this.distanceRemaining() / this.rate * 1000;
        return msToTime(timeRemaining,true);
    }
    addTime(ms) {
        if (this.party === null || this.goal === 25) return;
        //this.time += ms;
        this.time += ms;
        this.displayDistance += ms;
        while (this.time > 1000) {
            this.time -= 1000;
            this.distance += this.rate;
            if (this.distance >= this.nextGoal) {
                this.distance = 0;
                this.displayDistance = 0;
                this.displayRate
                this.goal += 1;
                this.assignNextGoal();
            }
        }
    }
    goldReward(next) {
        if (next) return miscLoadedValues.expGold[this.goal];
        if (this.goal === 0) return 0;
        return miscLoadedValues.expGold[this.goal-1];
    }
    collect() {
        ResourceManager.addGold(this.goldReward());
    }
}

const $expeditionList = $("#expeditionList");
const $expeditionParty = $("#expeditionParty");
const $expeditionBuilding = $("#expeditionBuilding");

function initiateExpeditionBldg() {
    $expeditionBuilding.show();
    $expeditionList.show();
    $expeditionParty.hide();
    refreshExpeditionList();
}

function refreshExpeditionList() {
    $expeditionList.empty();
    const contentHeader = $("<div/>").addClass(`contentHeader`).appendTo($expeditionList);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(contentHeader);
        $("<div/>").addClass("headingTitle").html(displayText("expedition_header_name")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("expedition_header_desc")).appendTo(headingDetails);
    $("<div/>").addClass("headingMoreInfoButton tooltip").attr({"data-tooltip": "more_info_expedition"}).html(displayText("button_more_info")).appendTo(contentHeader);
    const body = $("<div/>").addClass("expeditionBody").appendTo($expeditionList);
    createNewExpeditionListing().appendTo(body);
    ExpeditionManager.expeditions.forEach(expedition => {
        createNewExpeditionListing(expedition).appendTo(body);
    });
}

function refreshExpeditionParty() {
    $expeditionList.hide();
    $expeditionParty.show();
    $expeditionParty.empty();
    const contentHeader = $("<div/>").addClass(`contentHeader`).appendTo($expeditionParty);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(contentHeader);
        $("<div/>").addClass("headingTitle").html(displayText("expedition_party_heading")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("expedition_party_desc")).appendTo(headingDetails);
    $("<div/>").addClass("headingMoreInfoButton tooltip").attr({"data-tooltip": "more_info_expedition_party"}).html(displayText("button_more_info")).appendTo(contentHeader);
    const expeditionEmbark = $("<div/>").addClass("expeditionEmbarkContainer").appendTo($expeditionParty);
        $("<div/>").addClass("expeditionPartyStats").attr("id","expeditionPartyStats").appendTo(expeditionEmbark);
        refreshExpeditionPartyStats();
        $("<div/>").addClass("expeditionEmbark actionButton").html(displayText("expedition_embark")).appendTo(expeditionEmbark);
    const q = $("<div/>").addClass("expeditionQuests").appendTo($expeditionParty);
        const questContentHeader = $("<div/>").addClass(`contentHeader`).appendTo(q);
        const questHeadingDetails = $("<div/>").addClass("headingDetails").appendTo(questContentHeader);
            $("<div/>").addClass("headingTitle").html(displayText("expedition_party_quest_heading")).appendTo(questHeadingDetails);
            $("<div/>").addClass("headingDescription").html(displayText("expedition_party_quest_desc")).appendTo(questHeadingDetails);
        $("<div/>").addClass("headingMoreInfoButton tooltip").attr({"data-tooltip": "more_info_expedition_quest"}).html(displayText("button_more_info")).appendTo(questContentHeader);
        if (ExpeditionManager.availableQuests().length === 0) $("<div/>").addClass("emptyContentMessage").html(displayText("expedition_party_quest_none")).appendTo(q);
        else {
            const expeditionQuests = $("<div/>").addClass("expeditionQuestsContainer").appendTo(q);
            ExpeditionManager.availableQuests().forEach(quest => {
                createExpeditionPartyQuest(quest).appendTo(expeditionQuests);
            });
        }
    const p = $("<div/>").addClass("expeditionParty").appendTo($expeditionParty);
        const partyContentHeader = $("<div/>").addClass(`contentHeader`).appendTo(p);
        const partyHeadingDetails = $("<div/>").addClass("headingDetails").appendTo(partyContentHeader);
            $("<div/>").addClass("headingTitle").html(displayText("expedition_party_creation_heading")).appendTo(partyHeadingDetails);
            $("<div/>").addClass("headingDescription").html(displayText("expedition_party_creation_desc")).appendTo(partyHeadingDetails);
        const heroesExpeditionContainer = $("<div/>").addClass(`heroesExpeditionContainer`).appendTo(p);
        HeroManager.ownedHeroes().forEach(hero => {
            createHeroExpeditionCard(hero).appendTo(heroesExpeditionContainer);
        })
}

function refreshExpeditionPartyStats() {
    const s = $("#expeditionPartyStats");
    s.empty();
    const stats = $("<div/>").addClass("heroStats").appendTo(s);
    const powStat = $("<div/>").addClass("heroStat").appendTo(stats);
        $("<div/>").addClass("pow_img").html(miscIcons.pow).appendTo(powStat);
        $("<div/>").addClass("pow_integer statValue").attr("id","expeditionPow").html(ExpeditionManager.partyPower()).appendTo(powStat);
    const hptat = $("<div/>").addClass("heroStat").appendTo(stats);
        $("<div/>").addClass("hp_img").html(miscIcons.hp).appendTo(hptat);
        $("<div/>").addClass("hp_integer statValue").attr("id","expeditionHP").html(ExpeditionManager.partyHP()).appendTo(hptat);
    $("<div/>").addClass("expEfficiency heroStat").html(`${(ExpeditionManager.efficiency()*100).toFixed(0)}% Efficiency`).appendTo(stats);
}

function createHeroExpeditionCard(hero) {
    const d = $("<div/>").addClass("heroExpedition").data("hid",hero.id);
    generateSlotClass(hero.type).appendTo(d);
    $("<div/>").addClass("heroExpeditionImage").html(hero.portrait).appendTo(d);
    $("<div/>").addClass("heroExpeditionName").html(hero.name).appendTo(d);
    const d2 = $("<div/>").addClass("expeditionStats").appendTo(d);
    const hpStat = $("<div/>").addClass(`heroStat expeditionHP tooltip`).attr("data-tooltip","hp").html(`${miscIcons.hp}`).appendTo(d2);
        $("<div/>").addClass('statValue').html(`${hero.maxHP(true)}`).appendTo(hpStat);
    const powStat = $("<div/>").addClass(`heroStat expeditionPow tooltip`).attr("data-tooltip","pow").html(`${miscIcons.pow}`).appendTo(d2);
        $("<div/>").addClass('statValue').html(`${hero.getPow(true)}`).appendTo(powStat);
    if (hero.state() === HeroState.DUNGEON) $("<div/>").addClass("heroStatus tooltip statusDungeon").attr({"data-tooltip": "hero_in_combat"}).html(`<i class="fas fa-swords"></i>`).appendTo(d);
    else if (hero.state() === HeroState.QUEST) $("<div/>").addClass("heroStatus tooltip statusQuest").attr({"data-tooltip": "hero_in_quest"}).html(`${miscIcons.quest}`).appendTo(d);
    const d3 = $("<div/>").attr("id","exph"+hero.id).addClass("heroStatus tooltip statusParty").attr({"data-tooltip": "hero_in_party"}).html(`<i class="fas fa-check"></i>`).appendTo(d).hide();
    if (ExpeditionManager.partyBuild.includes(hero.id)) d3.show();
    return d;
}

function createExpeditionPartyQuest(quest) {
    const d = $("<div/>").data("qid",quest.id).addClass("expeditionPartyQuest");
    $("<div/>").addClass("expeditionPartyQuestName").html(quest.name).appendTo(d);
    const d1 = $("<div/>").addClass("expeditionpartyQuestMembers").appendTo(d);
        const hero1 = HeroManager.idToHero(quest.hero1).head;
        $("<div/>").addClass("expeditionpartyQuestMemberHead").html(hero1).appendTo(d1);
        if (quest.hero2 !== null) {
            const hero2 = HeroManager.idToHero(quest.hero2).head;
            $("<div/>").addClass("expeditionpartyQuestMemberHead").html(hero2).appendTo(d1);
        }
        if (quest.hero3 !== null) {
            const hero3 = HeroManager.idToHero(quest.hero3).head;
            $("<div/>").addClass("expeditionpartyQuestMemberHead").html(hero3).appendTo(d1);
        }
        if (quest.hero4 !== null) {
            const hero4 = HeroManager.idToHero(quest.hero4).head;
            $("<div/>").addClass("expeditionpartyQuestMemberHead").html(hero4).appendTo(d1);
        }
    $("<div/>").addClass("expeditionPartyQuestDesc").html(quest.description).appendTo(d);
    $("<div/>").addClass("expeditionPartyQuestLandmark").html("Must pass: "+displayText("expedition_name_"+quest.landmark)).appendTo(d);
    return d;
}

function createNewExpeditionListing(expedition) {
    const d = $("<div/>").addClass('expeditionDiv');
    if (expedition === undefined || expedition === null) {
        d.addClass('newExpedition').attr("id","newExpedition");
        $("<div/>").addClass("expeditionIcon").html("+").appendTo(d);
        $("<div/>").addClass("expeditionText").html(displayText("expedition_start")).appendTo(d);
        return d;
    }
    const landmarkName = $("<div/>").addClass("expeditionLandmark").appendTo(d);
        $("<div/>").addClass("expeditionLandmarkText").attr("id","expeditionName"+expedition.id).html(expedition.landmarkName).appendTo(landmarkName);
        $("<div/>").addClass("expeditionLandmarkSubtext").attr("id","expeditionLandmarkSubtext"+expedition.id).html(`Landmark ${expedition.goalText}`).appendTo(d);
        $("<div/>").addClass("expeditionInfo tooltip").html(miscIcons.info).attr({"data-tooltip": "landmark_desc", "data-tooltip-value": expedition.id}).appendTo(landmarkName);
    const heroes = $("<div/>").addClass('expeditionHeroes').appendTo(d);
    expedition.heroes().forEach(hero => {
        $("<div/>").addClass('expeditionHeroPortrait').html(hero.head).appendTo(heroes);
    });
    createAdventureBar(expedition).appendTo(d);
    $("<div/>").addClass("expeditionReward").attr("id","expreward"+expedition.id).html(`Next Reward: ${miscIcons.gold} ${expedition.goldReward(true)}`).appendTo(d);
    $("<div/>").addClass("expeditionCollect").attr("id","expcollectreward"+expedition.id).data("eid",expedition.id).html(`Retrieve Now for ${miscIcons.gold} ${expedition.goldReward()}`).appendTo(d);
    return d;
}

function updateExpeditions() {
    if (lastTab !== "townsTab" && TownManager.lastBldg !== "expedition") return;
    ExpeditionManager.expeditions.forEach(expedition => {
        refreshExpeditionStatus(expedition);
    });
}

function refreshExpeditionStatus(expedition) {
    if (expedition.goal === 25) {
        $("#expedition"+expedition.id).html("Last Landmark Reached");
        $("#expeditionFill"+expedition.id).css('width', "100%");
        $("#expeditionName"+expedition.id).html(expedition.landmarkName[25]);
        $("#expreward"+expedition.id).hide();
        $("#expcollectreward"+expedition.id).html(`Retrieve Now for ${miscIcons.gold} ${formatToUnits(expedition.goldReward(),2)}`);
        return;
    }
    const percent = expedition.displayDistance/1000*expedition.rate/expedition.nextGoal;
    const width = (percent*100).toFixed(1)+"%";
    const barText = `${formatToUnits(expedition.distance,1)}/${formatToUnits(expedition.nextGoal,1)} (${expedition.timeRemaining()} left)`;
    $("#expedition"+expedition.id).html(barText);
    $("#expeditionFill"+expedition.id).css('width', width);
    $("#expeditionName"+expedition.id).html(expedition.landmarkName);
    $("#expeditionLandmarkSubtext"+expedition.id).html(`Landmark ${expedition.goalText}`);
    $("#expreward"+expedition.id).html(`Next Reward: ${miscIcons.gold} ${formatToUnits(expedition.goldReward(true),2)}`);
    $("#expcollectreward"+expedition.id).html(`Retrieve Now for ${miscIcons.gold} ${formatToUnits(expedition.goldReward(),2)}`);
}

function createAdventureBar(expedition) {
    //maybe look like this:    (100%) 1.5k/15.4M (40:13:45 left) 
    const percent = expedition.distance/expedition.nextGoal;
    const width = (percent*100).toFixed(1)+"%";
    const barText = `${formatToUnits(expedition.distance,1)}/${formatToUnits(expedition.nextGoal,1)} (${expedition.timeRemaining()} left)`;
    const options = {
        prefix: "expBar",
        tooltip: "expedition",
        icon: miscIcons.quest,
        text: barText,
        textID: "expedition"+expedition.id,
        width: width,
        fill: "expeditionFill"+expedition.id,
    }
    return generateProgressBar(options);
}

function generateSlotClass(type) {
    const hero = HeroManager.idToHero(type);
    const slotClass =  $("<div/>").addClass("slotClass");
    const slotText = $("<div/>").addClass("slotClassText").appendTo(slotClass);
    if (hero !== undefined) {
        slotClass.addClass('classHero');
        slotText.html(hero.name);
    }
    else {
        slotClass.addClass(`class${type}`)
        slotText.html(type);
    }
    return slotClass;
}

$(document).on('click', ".expeditionCollect", (e) => {
    e.preventDefault();
    const eid = parseInt($(e.currentTarget).data("eid"));
    ExpeditionManager.collect(eid);
    refreshExpeditionList();
});

$(document).on('click', "#newExpedition", (e) => {
    e.preventDefault();
    ExpeditionManager.partyBuild = [];
    refreshExpeditionParty();
});

//add a hero the expedition party
$(document).on('click', ".heroExpedition", (e) => {
    e.preventDefault();
    const hid = $(e.currentTarget).data("hid");
    ExpeditionManager.addMember(hid);
    refreshExpeditionPartyStats();
    if (ExpeditionManager.partyBuild.includes(hid)) $("#exph"+hid).show();
    else $("#exph"+hid).hide();
});

$(document).on('click', '.expeditionEmbark', (e) => {
    e.preventDefault();
    if (ExpeditionManager.partyBuild.length === 0) return;
    ExpeditionManager.lockParty();
    initiateExpeditionBldg();
});

$(document).on('click', '.expeditionPartyQuest', (e) => {
    e.preventDefault();
    const qid = $(e.currentTarget).data("qid");
    ExpeditionManager.questTeam(qid);
})