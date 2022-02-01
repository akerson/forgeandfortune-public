"use strict";

const $cauldronBuilding = $("#cauldronBuilding");

class fuse {
    constructor(uniqueID) {
        const props = uniqueIDProperties(uniqueID);
        Object.assign(this, props);
        this.recipe = recipeList.idToItem(this.id);
        this.fuseTime = 0;
        this.started = false;
        this.ready = false;
    }
    createSave() {
        const save = {};
        save.fuseTime = this.fuseTime;
        save.started = this.started;
        save.uniqueID = this.uniqueID;
        return save;
    }
    loadSave(save) {
        if (save.fuseTime !== undefined) this.fuseTime = save.fuseTime;
        if (save.started !== undefined) this.started = save.started;
    }
    addTime(ms) {
        this.fuseTime = Math.min(this.fuseTime+ms,this.getMaxFuse());
        if (this.fuseComplete() && !this.ready) {
            this.ready = true;
            ToastManager.renderToast('fusion_completed', rarities[this.rarity].toLowerCase(), recipeList.idToItem(this.id).name);
        }
    }
    getMaxFuse() {
        return Math.floor(this.recipe.craftTime*this.rarity*Museum.craftTime(this.recipe.id));
    }
    timeRemaining() {
        return this.getMaxFuse() - this.fuseTime;
    }
    fuseComplete() {
        if (this.notStarted()) return false;
        return this.fuseTime === this.getMaxFuse();
    }
    increaseRarity() {
        this.rarity += 1;
        this.uniqueID = this.id+"_"+this.rarity+"_"+this.sharp;
    }
    notStarted() {
        return !this.started;
    }
}