"use strict";

class buffTemplate {
    constructor (props) {
        Object.assign(this, props);
    }
}

class Buff {
    constructor (buffTemplate,target,power,power2) {
        Object.assign(this, buffTemplate);
        this.stacks = this.stackCast;
        this.target = target;
        this.power = power;
        this.power2 = power2;
    }
    addCast() {
        if (this.onCast === "refresh") {
            this.stacks = this.stackCast;
        }
        else if (this.onCast === "stack") {
            this.stacks = Math.min(this.stacks+this.stackCast,this.maxStack);
        }
    }
    createSave() {
        const save = {};
        save.stacks = this.stacks;
        save.power = this.power;
        save.power2 = this.power2;
        save.id = this.id;
        return save;
    }
    loadSave(save) {
        this.stacks = save.stacks;
    }
    buffTick(type,attack,refreshLater) {
        if (type === "onMyTurn") this.onTick();
        if (type === "onHit") this.onHit(attack);
        if (type === "onHitting") this.onHitting();
        if (type !== this.decrease) return;
        this.stacks -= 1;
        if (this.stacks <= 0) {
            this.expire();
            if (!refreshLater) BuffRefreshManager.removeBuff(this, this.target);
        }
        else if (!refreshLater) BuffRefreshManager.updateBuffCount(this, this.target);
    }
    expired() {
        return this.stacks <= 0;
    }
    onTick() { return; }
    onHit() { return; }
    onHitting() { return; }
    getPow() { return 0; }
    getPowPercent() { return 0; }
    isChilled() { return false; }
    isWilt() { return false; }
    isLifeTapped() { return false; }
    getProtection() { return 0; }
    getVulnerability() { return 0; }
    maxHP() { return 0; }
    maxHPPercent() { return 0; }
    mark() { return false; }
    phase() { return false; }
    debuffImmune() { return false; }
    thorns() { return 0; }
    parry() { return 0; }
    beornTank() { return 0; }
    expire() { return; }
    confusion() { return false; }
    reverse() { return false; }
}

const BuffManager = {
    buffDB : [],
    uniqueid : 0,
    addBuffTemplate(buff) {
        this.buffDB.push(buff);
    },
    idToBuff(buffID) {
        return this.buffDB.find(b => b.id === buffID);
    },
    generateBuff(buffID,target,power=0,power2=0) {
        if (target === undefined) return;
        if (target.debuffImmune()) return;
        if (target.hasBuff(buffID)) {
            const buff = target.getBuff(buffID);
            buff.addCast();
            BuffRefreshManager.updateBuffCount(buff,target);
            return;
        }
        const buffTemplate = this.idToBuff(buffID);
        const buff = new BuffLookup[buffID](buffTemplate,target,power,power2);
        buff.uniqueid = "BI"+this.uniqueid;
        this.uniqueid += 1;
        target.addBuff(buff);
        BuffRefreshManager.addBuff(buff,target);
    },
    removeBuff(buffID,target) {
        if (!target.hasBuff(buffID)) return;
        const buff = target.getBuff(buffID);
        target.removeBuff(buffID);
        BuffRefreshManager.removeBuff(buff,target);
    },
    clearBuffs(target) {
        target.buffs.forEach(buff => {
            this.removeBuff(buff.id,target);
        })
    },
    clearDebuffs(target) {
        target.buffs.forEach(buff => {
            if (buff.type !== "debuff") return;
            this.removeBuff(buff.id,target);
        });
    },
    generateSaveBuff(buffID,target,power,power2=0) {
        const buffTemplate = this.idToBuff(buffID);
        const buff = new BuffLookup[buffID](buffTemplate,target,power,power2);
        buff.uniqueid = "BI"+this.uniqueid;
        this.uniqueid += 1;
        return buff;
    },
    maxStack(buffID) {
        const buff = this.idToBuff(buffID);
        return buff.maxStack;
    },
    findBuff(uniqueid) {
        return AreaManager.allBuffs().find(b=>b.uniqueid === uniqueid);
    }
}

const BuffRefreshManager = {
    //this is responsible for tracking and updating buffs so we don't have to!
    hardRefreshBuff() {
        //populate the divs as they're supposed to be!
        const dungeon = DungeonManager.dungeonByID(DungeonManager.dungeonView);
        dungeon.party.heroes.forEach(ally => {
            const $heroDiv = $("#buffList"+ally.uniqueid);
            $heroDiv.empty();
            ally.buffs.forEach(buff => {
                this.makeBuffContainer(buff,ally.uniqueid).appendTo($heroDiv);
            });
        });
        dungeon.mobs.forEach(enemy => {
            const $enemyDiv = $("#buffList"+enemy.uniqueid);
            $enemyDiv.empty();
            enemy.buffs.forEach(buff => {
                this.makeBuffContainer(buff,enemy.uniqueid).appendTo($enemyDiv);
            });
        })
    },
    makeBuffContainer(buff,uniqueid) {
        const d1 = $("<div/>").addClass("buffContainer tooltip").attr("id","bc"+uniqueid+buff.id).attr({"data-tooltip": "buff_desc", "data-tooltip-value": buff.uniqueid});
            $("<div/>").addClass("buffContainerIcon").html(buff.icon).appendTo(d1);
            $("<div/>").addClass("buffContainerCount").attr("id","bcount"+uniqueid+buff.id).html(buff.stacks).appendTo(d1);
        return d1;
    },
    addBuff(buff,combatant) {
        const buffList = $("#buffList"+combatant.uniqueid);
        buffList.append(this.makeBuffContainer(buff,combatant.uniqueid));
    },
    updateBuffCount(buff,combatant) {
        $("#bcount"+combatant.uniqueid+buff.id).html(buff.stacks);
    },
    removeBuff(buff,combatant) {
        $("#bc"+combatant.uniqueid+buff.id).remove();
    }
}

class B0010 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return this.power;
    }
}

class B0011 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    parry() {
        return this.power;
    }
    getProtection() {
        return 1;
    }
}

class B0012 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return this.power;
    }
    beornTank() {
        return 1-this.power;
    }
}

class B0020 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    maxHP() {
        return this.power*this.stacks;
    }
}

class B0021 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    mark() {
        return true;
    }
}

class B0022 extends Buff {
    constructor (buffTemplate,target,power,power2) {
        super(buffTemplate,target,power);
        this.power2 = power2;
    }
    maxHPPercent() {
        return -this.power*this.stacks;
    }
    getPowPercent() {
        return this.power2*this.stacks;
    }
}

class B0041 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
}

class B0042 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getPow() {
        return this.power*this.stacks;
    }
}

class B1010 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    onHitting() {
        this.target.takeDamage(this.power);
    }
}

class B1012 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
}

class B1020 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    isChilled() {
        return true;
    }
}

class B1022 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return 1.0;
    }
}

class B1030 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    onTick() {
        this.target.takeDamage(this.power*this.stacks);
    }
    isLifeTapped() {
        return true;
    }
}

class B1042 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    onTick() {
        this.target.heal(this.power);
    }
}

class B2010 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    maxHP() {
        return this.power*this.stacks;
    }
}

class B2011 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getPow() {
        return this.power*this.stacks;
    }
}

class B2012 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getVulnerability() {
        return 1;
    }
}

class B2040 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    mark() {
        return true;
    }
}

class BM102 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    isWilt() {
        return true;
    }
}

class BM200 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return 1;
    }
}

class BM205 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return 1;
    }
}

class BM208 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return 1;
    }
}

class BM304 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getPow() {
        return this.power*this.stacks;
    }
}

class BM305 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return 0.25;
    }
}

class BM902 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    thorns() {
        return this.power;
    }
}

class BM904A extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return 1;
    }
    debuffImmune() {
        return true;
    }
}

class BM905A extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getVulnerability(attacker) {
        if (attacker.type === "Might") return 1;
        return 0;
    }
}

class BM905B extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getVulnerability(attacker) {
        if (attacker.type === "Mind") return 1;
        return 0;
    }
}

class BM905C extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getVulnerability(attacker) {
        if (attacker.type === "Moxie") return 1;
        return 0;
    }
}

class BM905D extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return this.stacks * 0.1
    }
}

class BM905E extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
}

class BM905F extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getVulnerability() {
        return this.stacks * 0.2;
    }
}

class BM906 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    onHitting() {
        this.target.takeDamage(this.power*this.stacks);
    }
}

class BM906A extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return 0.75;
    }
}

class BM906B extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    maxHP() {
        return -Math.floor(this.target.hpmax/10)*this.stacks;
    }
}

class BM907 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
}

class BM907A extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return 1;
    }
    onHit() {
        this.target.takeDamage(1,true);
    }
}

class BM907B extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
}

class BM907C extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return 1;
    }
    expire() {
        this.target.passiveCheck("treeBuffGone");
    }
}

class BM908A extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    confusion() {
        return true;
    }
}

class BM908B extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getProtection() {
        return 1;
    }
    onHit(attack) {
        this.target.heal(Math.floor(attack.power*this.power));
    }
}

class BM909 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
}

class BM909A1 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    parry() {
        if (this.stacks === 1) {
            return this.power;
        }
        return 0;
    }
    getProtection() {
        if (this.stacks === 1) {
            return 1;
        }
        return 0;
    }
    onHit() {
        if (this.stacks === 1) {
            BuffManager.generateBuff("BM909A1",this.target,1);
        }        
    }
}

class BM909B1 extends Buff {
    constructor (buffTemplate,target,power,power2) {
        super(buffTemplate,target,power,power2);
    }
    onTick() {
        this.target.healPercent(this.power2);
    }
}

class BM909C1 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
}

class BM909A2 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    mark(type) {
        return type === "Might";
    }
    phase(type) {
        return type !== "Might";
    }
}

class BM909B2 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    mark(type) {
        return type === "Mind";
    }
    phase(type) {
        return type !== "Mind";
    }
}

class BM909C2 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    mark(type) {
        return type === "Moxie";
    }
    phase(type) {
        return type !== "Moxie";
    }
}

class BM909C3 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    getVulnerability() {
        return 1;
    }
}

class BM910 extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
}

class BM910A extends Buff {
    constructor (buffTemplate,target,power) {
        super(buffTemplate,target,power);
    }
    reverse() {
        return true;
    }
}

const BuffLookup = {
    B0010,
    B0011,
    B0012,
    B0020,
    B0021,
    B0022,
    B0041,
    B0042,
    B1010,
    B1012,
    B1020,
    B1022,
    B1030,
    B1042,
    B2010,
    B2011,
    B2012,
    B2040,
    BM102,
    BM200,
    BM205,
    BM208,
    BM304,
    BM305,
    BM902,
    BM904A,
    BM905A,
    BM905B,
    BM905C,
    BM905D,
    BM905E,
    BM905F,
    BM906,
    BM906A,
    BM906B,
    BM907,
    BM907A,
    BM907B,
    BM907C,
    BM908A,
    BM908B,
    BM909,
    BM909A1,
    BM909B1,
    BM909C1,
    BM909A2,
    BM909B2,
    BM909C2,
    BM909C3,
    BM910,
    BM910A,
}