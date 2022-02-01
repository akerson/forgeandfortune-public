"use strict";

class combatLog {
    constructor (heroID) {
        this.heroID = heroID;
        this.damageDealt = 0;
        this.damageTaken = 0;
        this.healing = 0;
    }
    createSave() {
        const save = {};
        save.heroID = this.heroID;
        save.damageDealt = this.damageDealt;
        save.damageTaken = this.damageTaken;
        save.healing = this.healing;
        return save;
    }
    loadSave(save) {
        this.damageDealt = save.damageDealt;
        this.damageTaken = save.damageTaken;
        this.healing = save.healing;
    }
    resetLog() {
        this.damageDealt = 0;
        this.damageTaken = 0;
        this.healing = 0;
    }
    addDamageDealt(num) {
        this.damageDealt += num;
    }
    addDamageTaken(num) {
        this.damageTaken += num;
    }
    addHealing(num) {
        this.healing += num;
    }
}

class combatLogDungeon {
    constructor (dungeonID) {
        this.dungeonID = dungeonID;
        this.dungeon = DungeonManager.dungeonByID(dungeonID);
        this.heroIDs = this.dungeon.party.heroes.map(h=>h.id);
        this.heroLogs = [];
        this.heroIDs.forEach(heroID => {
            this.heroLogs.push(new combatLog(heroID));
        });
    }
    createSave() {
        const save = {};
        save.dungeonID = this.dungeonID;
        save.heroLogs = [];
        this.heroLogs.forEach(hL => {
            save.heroLogs.push(hL.createSave());
        });
        return save;
    }
    loadSave(save) {
        save.heroLogs.forEach(hLsave => {
            const heroLog = this.heroLogs.find(hl => hl.heroID === hLsave.heroID);
            heroLog.loadSave(hLsave);
        });
    }
    addDamageDealt(heroID,num) {
        if (!this.heroIDs.includes(heroID)) return;
        const heroLog = this.heroLogs.find(log=>log.heroID === heroID);
        heroLog.addDamageDealt(num);
    }
    addDamageTaken(heroID,num) {
        if (!this.heroIDs.includes(heroID)) return;
        const heroLog = this.heroLogs.find(log=>log.heroID === heroID);
        heroLog.addDamageTaken(num);
    }
    addHealing(heroID,num) {
        if (!this.heroIDs.includes(heroID)) return;
        const heroLog = this.heroLogs.find(log=>log.heroID === heroID);
        heroLog.addHealing(num);
    }
    resetLog() {
        this.heroLogs.forEach(hL=>hL.resetLog());
    }
    maxDamageDealt() {
        return Math.max(...this.heroLogs.map(hL=hL.damageDealt));
    }
    maxDamageTaken() {
        return Math.max(...this.heroLogs.map(hL=hL.damageTaken));
    }
    maxHealing() {
        return Math.max(...this.heroLogs.map(hL=hL.healing));
    }
    hasHero(heroID) {
        return this.heroLogs.some(hL=>hL.heroID === heroID);
    }
    addDamageDealt(heroID,dmg) {
        this.heroLogs.find(hL => hL.heroID === heroID).addDamageDealt(dmg);
    }
    addDamageTaken(heroID,dmg) {
        this.heroLogs.find(hL => hL.heroID === heroID).addDamageTaken(dmg);
    }
    addHealing(heroID,dmg) {
        this.heroLogs.find(hL => hL.heroID === heroID).addHealing(dmg);
    }
}

const CombatLogManager = {
    dungeonLogs : [],
    createSave() {
        const save = {};
        save.dungeonLogs = [];
        this.dungeonLogs.forEach(dL => {
            save.dungeonLogs.push(dL.createSave());
        });
        return save;
    },
    loadSave(save) {
        save.dungeonLogs.forEach(dL => {
            const cL = new combatLog(dL.dungeonID);
            cL.loadSave(dL);
            this.dungeonLogs.push(cL);
        });
    },
    addLog(dungeonID) {
        this.dungeonLogs.push(new combatLogDungeon(dungeonID));
    },
    removeLog(dungeonID) {
        this.dungeonLogs.filter(dL => dL.dungeonID !== dungeonID);
    },
    resetLog(dungeonID) {
        this.dungeonLogs.find(d=>d.dungeonID === dungeonID).resetLog();
    },
    addDamageDealt(heroID,dmg) {
        this.dungeonLogs.find(dL => dL.hasHero(heroID)).addDamageDealt(heroID,dmg);
    },
    addDamageTaken(heroID,dmg) {
        this.dungeonLogs.find(dL => dL.hasHero(heroID)).addDamageTaken(heroID,dmg);
    },
    addHealing(heroID,dmg) {
        this.dungeonLogs.find(dL => dL.hasHero(heroID)).addHealing(heroID,dmg);
    }
}