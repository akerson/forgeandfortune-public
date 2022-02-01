"use strict";

const DungeonStatus = Object.freeze({EMPTY:0,ADVENTURING:1,SUCCESS:2,FAILURE:3});

class TurnOrder {
    constructor(heroes,mobs) {
        this.heroes = heroes;
        this.mobs = mobs;
        this.order = interlace(heroes,mobs);
        this.position = 0;
        this.nextNotDead();
    }
    nextNotDead() {
        while (this.order[this.position].dead()) this.position += 1;
    }
    getOrder() {
        return this.order;
    }
    nextTurn() {
        return this.order[this.position];
    }
    nextPosition() {
        this.position += 1;
        if (this.position === this.order.length) this.position = 0;
        if (this.order[this.position].dead()) this.nextPosition();
    }
    createSave() {
        const save = {};
        save.position = this.position;
        return save;
    }
    loadSave(save) {
        this.position = save.position;
    }
    getCurrentID() {
        return this.currentTurn().uniqueid;
    }
    currentTurn() {
        return this.order[this.position];
    }
    adjustOrder(heroes,mobs) {
        const uniqueid = this.getCurrentID();
        this.heroes = heroes;
        this.mobs = mobs;
        this.order = interlace(heroes,mobs);
        this.position = this.order.findIndex(m=>m.uniqueid === uniqueid);
    }
    positionInParty() {
        const uniqueid = this.order[this.position].uniqueid;
        const huid = this.heroes.map(h=>h.uniqueid);
        const muid = this.mobs.map(m=>m.uniqueid);
        if (huid.includes(uniqueid)) return huid.findIndex(h=>h === uniqueid);
        return muid.findIndex(m=>m === uniqueid);
    }
}

class Area {
    constructor(props) {
        Object.assign(this, props);
        this.dungeons = [];
        this.lastVisitedDungeon = null;
    }
    createSave() {
        const save = {};
        save.lastVisitedDungeon = this.lastVisitedDungeon;
        return save;
    }
    loadSave(save) {
        if (save.lastVisitedDungeon !== undefined) this.lastVisitedDungeon = save.lastVisitedDungeon;
        return;
    }
    unlocked() {
        return this.dungeons.some(d => d.unlocked());
    }
    addDungeon(dungeon) {
        dungeon.area = this.id;
        this.dungeons.push(dungeon);
        
    }
    status() {
        if (this.dungeons.some(d => d.status === DungeonStatus.ADVENTURING)) return DungeonStatus.ADVENTURING;
        if (this.dungeons.some(d => d.status === DungeonStatus.SUCCESS)) return DungeonStatus.SUCCESS;
        if (this.dungeons.some(d => d.status === DungeonStatus.FAILURE)) return DungeonStatus.FAILURE;
        return DungeonStatus.EMPTY;
    }
    activeParty() {
        const dungeon = this.dungeons.find(d => d.status === DungeonStatus.ADVENTURING || d.status === DungeonStatus.SUCCESS || d.status === DungeonStatus.FAILURE);
        return dungeon.party;
    }
    activeDungeonID() {
        const dungeon = this.activeDungeon();
        return dungeon ? dungeon.id : dungeon;
    }
    activeDungeon() {
        const dungeon = this.dungeons.find(d => d.status === DungeonStatus.ADVENTURING || d.status === DungeonStatus.SUCCESS || d.status === DungeonStatus.FAILURE);
        return dungeon ? dungeon : null;
    }
    activeDungeonName() {
        return this.activeDungeon().name;
    }
    lastOpen() {
        const dungeons = this.dungeons.filter(d => d.unlocked());
        return dungeons[dungeons.length-1];
    }
    setLastDungeon(dungeonID) {
        this.lastVisitedDungeon = dungeonID;
    }
    allBuffs() {
        return this.dungeons.map(a=>a.allBuffs());
    }
}

const AreaManager = {
    areas : [],
    areaView : null,
    addArea(area) {
        this.areas.push(area);
    },
    idToArea(areaID) {
        return this.areas.find(a=>a.id === areaID);
    },
    createSave() {
        const save = {};
        save.areas = [];
        this.areas.forEach(area => save.areas.push(area.createSave()));
    },
    loadSave(save) {
        save.areas.forEach(areaSave => {
            const area = this.idToArea(areaSave.id);
            area.loadSave(areaSave);
        });
    },
    addDungeon(dungeon) {
        const area = this.idToArea(dungeon.area);
        area.addDungeon(dungeon);
    },
    allBuffs() {
        return this.areas.map(a=>a.allBuffs()).flat().flat().flat();
    }
}

class Dungeon {
    constructor(props) {
        Object.assign(this, props);
        this.party = null;
        this.mobs = [];
        this.setMobIDs();
        this.maxFloor = 0;
        this.floor = 1;
        this.floorClear = 0;
        this.order = null;
        this.status = DungeonStatus.EMPTY;
        this.lastParty = null;
        this.dungeonTime = 0;
        this.rewardTime = 0;
        this.rewardAmt = 0;
        this.rewardTimeRate = 0;
        this.rewardTimeRateRound = 0;
    }
    createSave() {
        const save = {};
        save.id = this.id;
        if (this.party !== null) save.party = this.party.createSave();
        else save.party = null;
        save.mobs = [];
        this.mobs.forEach(mob => {
            save.mobs.push(mob.createSave());
        });
        save.maxFloor = this.maxFloor;
        save.floor = this.floor;
        save.floorClear = this.floorClear;
        if (this.order !== null) save.order = this.order.createSave();
        else save.order = null;
        save.status = this.status;
        save.lastParty = this.lastParty;
        save.rewardAmt = this.rewardAmt;
        save.rewardTimeRate = this.rewardTimeRate;
        return save;
    }
    loadSave(save) {
        if (save.party) this.party = new Party(save.party.heroID);
        if (save.mobs) save.mobs.forEach(mobSave => {
            const mobTemplate = MobManager.idToMob(mobSave.id);
            const mob = new Mob(mobTemplate,0,0);
            mob.loadSave(mobSave);
            this.mobs.push(mob);
        });
        if (save.maxFloor !== undefined) this.maxFloor = save.maxFloor;
        if (save.floor !== undefined) this.floor = save.floor;
        if (save.floorClear !== undefined) this.floorClear = save.floorClear;
        if (save.order) {
            this.order = new TurnOrder(this.party.heroes,this.mobs);
            this.order.loadSave(save.order);
        }
        if (save.status) this.status = save.status;
        if (save.lastParty) this.lastParty = save.lastParty;
        if (save.rewardAmt) this.rewardAmt = save.rewardAmt;
        if (save.rewardTimeRate) this.rewardTimeRate = save.rewardTimeRate;
    }
    addTime(t) {
        //if there's enough time, grab the next guy and do some combat
        if (this.status !== DungeonStatus.ADVENTURING) return;
        this.dungeonTime += Math.min(t,3600000);
        const dungeonWaitTime = DungeonManager.speed;
        const refreshLater = this.dungeonTime >= DungeonManager.speed * 2;
        CombatManager.refreshLater = refreshLater;
        this.addDungeonReward(t,refreshLater);
        while (this.dungeonTime >= dungeonWaitTime) {
            this.dungeonTime -= dungeonWaitTime;
            //take a turn
            const attacker = this.order.nextTurn();
            attacker.buffTick("onMyTurn");
            this.buffTick("onTurn",refreshLater);
            this.passiveCheck("onTurn",refreshLater);
            if (this.mobs.every(m=>m.dead())) {
                this.nextFloor(refreshLater);
                return;
            }
            else if (this.party.isDead()) {
                this.previousFloor(refreshLater,true);
                return;
            }
            if (!refreshLater && DungeonManager.dungeonView === this.id) $(`#beatbarFill${this.order.getCurrentID()}`).css('width',"0%");
            if (attacker.alive()) CombatManager.executeTurn(this);
            if (!refreshLater && DungeonManager.dungeonView === this.id) refreshTurnOrder(this.id);
            //we repeat this because we need it early for passives, and late for combat
            if (this.mobs.every(m=>m.dead())) {
                this.nextFloor(refreshLater);
            }
            else if (this.party.isDead()) {
                this.previousFloor(refreshLater,true);
            }
            else {
                this.order.nextPosition();
            }   
        }
        if (refreshLater) {
            initiateDungeonFloor(this.id);
        }
        if (DungeonManager.dungeonView === this.id) refreshBeatBar(this.order.getCurrentID(),this.dungeonTime);
    }
    setMobIDs() {
        this.mobIDs = [];
        this.mobIDs.push(this.mob1);
        if (this.mob2 !== null) this.mobIDs.push(this.mob2);
        if (this.mob3 !== null) this.mobIDs.push(this.mob3);
        if (this.mob4 !== null) this.mobIDs.push(this.mob4);
    }
    addDungeonReward(time,skipAnimation) {
        if (this.type === "boss" || this.floorClear === 0) return;
        this.rewardTime += time;
        while (this.rewardTime > this.rewardTimeRate) {
            this.rewardTime -= this.rewardTimeRate;
            ResourceManager.addMaterial(this.mat,this.rewardAmt,skipAnimation)
        }
        if (!skipAnimation) refreshDungeonMatBar(this.id);
    }
    setRewardRate(floor) {
        this.floorClear = Math.max(floor,this.floorClear);
        this.rewardAmt = Math.ceil(floor/4);
        const rewardRate = Math.floor((floor-1))*0.25+1
        this.rewardTimeRate = this.rewardAmt*10000/rewardRate;
        this.rewardTimeRateRound = (this.rewardTimeRate/1000).toFixed(1);
    }
    initializeParty(party) {
        this.party = party;
        this.lastParty = party.heroID;
    }
    resetDungeon() {
        if (this.status !== DungeonStatus.ADVENTURING && this.status !== DungeonStatus.SUCCESS && this.status !== DungeonStatus.FAILURE) return;
        this.party.heroes.forEach(h=>{
            h.hp = h.maxHP()
            h.buffs = [];
        });
        if (DungeonManager.dungeonView === this.id) {
            openTab("dungeonsTab");
        }
        initializeSideBarDungeon();
        dungeonsTabClicked();
        this.status = DungeonStatus.EMPTY;
        this.party = null;
        this.order = null;
        this.mobs = [];
        this.setMobIDs();
        this.floor = 1;
        this.floorClear = 0;
        this.dungeonTime = 0;
        this.rewardAmt = 0;
        this.rewardTimeRate = 0;
        this.rewardTime = 0;
        return;
    }
    previousFloor(refreshLater) {
        if (this.type === "boss") return this.status = DungeonStatus.FAILURE;
        this.floor = Math.max(1,this.floor - 1);
        this.resetFloor(refreshLater);
    }
    nextFloor(refreshLater) {
        if (this.type === "boss") {
            this.maxFloor += 1;
            if (this.id === "D410" && this.maxFloor === 1) setDialogOpen(DialogManager.findDialog("end_commendation"));
            if (!refreshLater) {
                if (lastTab === "Merchant" && Merchant.tabView === "Order") refreshShopOrder();
            }
            this.status = DungeonStatus.SUCCESS;
            if (DungeonManager.dungeonView === this.id) initiateDungeonFloor(this.id,refreshLater);
            achievementStats.bossBeat(this.id);
            return;
        }
        this.setRewardRate(this.floor);
        this.maxFloor = Math.max(this.maxFloor,this.floor);
        this.floor += 1;        
        achievementStats.floorRecord(this.id, this.maxFloor);
        this.resetFloor(refreshLater);
    }
    resetFloor(refreshLater) {
        this.mobs = [];
        this.setMobIDs();
        this.mobIDs.forEach(mobID => {
            const mob = MobManager.generateMob(mobID,this);
            mob.dungeonid = this.id;
            this.mobs.push(mob);
        });
        this.party.reset();
        this.order = new TurnOrder(this.party.heroes,this.mobs);
        this.mobs.forEach(mob => mob.passiveCheck("initial",null,refreshLater));
        this.party.heroes.forEach(hero => hero.passiveCheck("initial",null,refreshLater));
        if (refreshLater) return;
        const text = this.floorClear === 0 ? `${this.name}` : `${this.name} - ${this.floorClear}`;
        $("#dsb"+this.id).html(text);
        refreshSidebarDungeonMats(this.id);
        if (DungeonManager.dungeonView === this.id) initiateDungeonFloor(this.id);
    }
    bossHPStyling() {
        if (this.type !== "boss") return "0 (0%)";
        const boss = this.mobs.find(m=>m.event === "boss")
        return `${formatToUnits(boss.hp,2)} (${Math.round(100*boss.hp/boss.maxHP())+"%"})`;
    }
    difficulty() {
        if (this.type === "regular") return 0;
        return this.maxFloor;
    }
    buffTick(type,refreshLater) {
        this.party.heroes.forEach(hero => {
            hero.buffTick(type,null,refreshLater);
        })
        this.mobs.forEach(enemy => {
            enemy.buffTick(type,null,refreshLater);
        })
    }
    passiveCheck(type,refreshLater) {
        this.party.heroes.forEach(hero => {
            hero.passiveCheck(type,null,refreshLater);
        })
        this.mobs.forEach(enemy => {
            enemy.passiveCheck(type,null,refreshLater);
        })
    }
    getRewards() {
        return new idAmt(this.mat,this.rewardAmt);
    }
    unlocked() {
        if (this.unlockedBy === null) return true;
        if (this.unlockedBy === 'locked') return false;
        if (this.unlockedBy.charAt(0) === "A") return Shop.alreadyPurchased(this.unlockedBy);
        if (!Shop.alreadyPurchased("AL20081")) return false;
        const bossDungeon = DungeonManager.dungeonByID(this.unlockedBy);
        return bossDungeon.beaten();
    }
    beaten() {
        return this.maxFloor > 0;
    }
    addMob(mobID,first,refreshLater = false) {
        const mob = MobManager.generateMob(mobID,this);
        mob.dungeonid = this.id;
        if (first) {
            this.mobs.unshift(mob);
            this.mobIDs.unshift(mobID);
        }
        else {
            this.mobs.push(mob);
            this.mobIDs.push(mobID);
        }
        this.order.adjustOrder(this.party.heroes,this.mobs);
        mob.passiveCheck("initial",null);
        if (!refreshLater && DungeonManager.dungeonView === this.id) initiateDungeonFloor(this.id);
    }
    removeMob(uniqueid,refreshLater = false) {
        this.mobs = this.mobs.filter(m=>m.uniqueid !== uniqueid);
        this.mobIDs = this.mobs.map(m=>m.id);
        this.order.adjustOrder(this.party.heroes,this.mobs);
        if (!refreshLater && DungeonManager.dungeonView === this.id) initiateDungeonFloor(this.id);
    }
    refreshDungeon() {
        if (DungeonManager.dungeonView === this.id) initiateDungeonFloor(this.id);
    }
    allBuffs() {
        if (!this.party) return [];
        return this.party.heroes.map(h=>h.buffs).concat(this.mobs.map(m=>m.buffs));
    }
    hasMember(heroID) {
        if (this.party === null) return false;
        return this.party.hasMember(heroID);
    }
}

const DungeonManager = {
    dungeons : [],
    trophies : [],
    dungeonView : null,
    speed : 1500,
    createSave() {
        const save = {};
        save.dungeons = [];
        this.dungeons.forEach(d => {
            save.dungeons.push(d.createSave());
        });
        return save;
    },
    addDungeon(dungeon) {
        this.dungeons.push(dungeon);
        AreaManager.addDungeon(dungeon);
    },
    addTrophy(trophy) {
        this.trophies.push(trophy);
    },
    idToTrophy(trophyID) {
        return this.trophies.find(t=>t.id === trophyID);
    },
    loadSave(save) {
        save.dungeons.forEach(d => {
            const dungeon = DungeonManager.dungeonByID(d.id);
            dungeon.loadSave(d);
        });
    },
    addTime(t) {
        this.dungeons.forEach(dungeon => {
            dungeon.addTime(t);
        });
    },
    dungeonStatus(dungeonID) {
        return this.dungeons.find(d=>d.id===dungeonID).status;
    },
    createDungeon(dungeonID,floorSkip) {
        const party = PartyCreator.lockParty();
        const dungeon = this.dungeonByID(dungeonID);
        dungeon.floor = floorSkip ? Math.max(1,dungeon.maxFloor) : 1;
        dungeon.status = DungeonStatus.ADVENTURING;
        this.dungeonView = dungeonID;
        const area = AreaManager.idToArea(dungeon.area);
        area.setLastDungeon(dungeonID);
        dungeon.initializeParty(party);
        dungeon.resetFloor();
        initializeSideBarDungeon();
    },
    dungeonByID(dungeonID) {
        return this.dungeons.find(d => d.id === dungeonID);
    },
    dungeonByMat(matID) {
        return this.dungeons.find(d => d.mat === matID);
    },
    abandonCurrentDungeon() {
        const dungeon = this.dungeonByID(this.dungeonView);
        dungeon.resetDungeon();
        initializeSideBarDungeon();
        refreshAreaSelect();
    },
    abandonAllDungeons() {
        this.dungeons.forEach(dungeon => {
            dungeon.resetDungeon();
        });
        initializeSideBarDungeon();
        refreshAreaSelect();
    },
    bossCount() {
        const bossDung = this.dungeons.filter(d => d.type === "boss");
        return bossDung.filter(d => d.maxFloor > 0).length;
    },
    availableUpgrades() {
        const bossDung = this.dungeons.filter(d => d.type === "boss").map(d => d.maxFloor);
        return bossDung.reduce((a,b) => a + b);
    },
    beaten(dungeonID) {
        const dungeon = this.dungeonByID(dungeonID);
        return dungeon.beaten();
    },
    bossRefightUnlocked() {
        return Shop.alreadyPurchased("AL3007");
    },
    heroLocked(heroID) {
        return this.dungeons.some(d=>d.hasMember(heroID));
    }
};

function refreshDungeonDead(uniqueid) {
    if (!DungeonManager.dungeonView) return;
    const dungeon = DungeonManager.dungeonByID(DungeonManager.dungeonView);
    if (dungeon.mobs.map(m=>m.uniqueid).includes(uniqueid)) $("#dfm"+uniqueid).addClass("mobDead");
    if (dungeon.party.heroes.map(h=>h.uniqueid).includes(uniqueid)) $("#dfc"+uniqueid).addClass("heroDead");
}

class Trophy {
    constructor (props) {
        Object.assign(this,props);
        this.image = "<img src='assets/images/recipes/Trophies/"+this.id+".png'>";
        this.dungeonRef = DungeonManager.dungeonByID(this.dungeon);
    }
    lvl() {
        return this.dungeonRef.maxFloor;
    }
    locked() {
        return this.dungeonRef.maxFloor === 0;
    }
    updateTooltipValues() {
        this.levelText = this.lvl().toString();
        this.trophyTooltip = displayText("trophy_desc_"+this.id);
        this.trophyTooltip = this.trophyTooltip.replace("{pow}",this.pow());
        this.trophyTooltip = this.trophyTooltip.replace("{hp}",this.hp());
        this.trophyTooltip = this.trophyTooltip.replace("{n}",this.normal());
        this.trophyTooltip = this.trophyTooltip.replace("{s}",this.special());
        this.trophyTooltip = this.trophyTooltip.replace("{powIcon}",miscIcons.pow).replace("{powIcon}",miscIcons.pow);
        this.trophyTooltip = this.trophyTooltip.replace("{hpIcon}",miscIcons.hp);    
    }
    pow() {
        if (this.powScale === null) return 0;
        return Math.floor(this.powScale*this.powMod*Math.pow(1.3,this.lvl()));
    }
    powSkill(skillID) {
        if (skillID === undefined) return this.pow();
        if (skillID === "S0000") return this.pow() + this.normal();
        return this.pow() + this.special();
    }
    hp() {
        if (this.hpScale === null) return 0;
        return Math.floor(this.hpScale*this.hpMod*Math.pow(1.3,this.lvl()));
    }
    normal() {
        if (this.norScale === null) return 0;
        return Math.floor(this.norScale*this.norMod*Math.pow(1.3,this.lvl()));
    }
    special() {
        if (this.speScale === null) return 0;
        return Math.floor(this.speScale*this.speMod*Math.pow(1.3,this.lvl()));
    }
}