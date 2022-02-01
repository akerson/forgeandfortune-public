"use strict";

class Material{
    constructor (props) {
        Object.assign(this, props);
        this.amt = 0;
        this.img = `<img src='assets/images/resources/${this.id}.png' alt='${this.name}'>`;
        this.seen = false;
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.amt = this.amt;
        save.seen = this.seen;
        return save;
    }
    loadSave(save) {
        this.amt = save.amt;
        this.seen = save.seen;
    }
}

const $goldSidebar = $("#goldSidebar");
const $goldSidebarAmt = $("#goldSidebarAmt");

const ResourceManager = {
    materials : [],
    uncapMats : false,
    createSave() {
        const save = [];
        this.materials.forEach(m=> {
            save.push(m.createSave());
        });
        return save;
    },
    loadSave(save) {
        save.forEach(m=> {
            const mat = this.idToMaterial(m.id);
            if (mat === undefined) return;
            mat.loadSave(m);
        });
    },
    addNewMaterial(material) {
        this.materials.push(material);
    },
    addMaterial(res,amt,skipAnimation) {
        const mat = this.materials.find(mat => mat.id === res);
        mat.amt += amt;
        if (mat.id !== "M001" && !this.uncapMats) mat.amt = Math.min(mat.amt,this.materialCap());
        mat.seen = true;
        if (skipAnimation) return;
        refreshMaterial(res);
    },
    capMats() {
        this.materials.forEach(mat => {
            if (mat.id === "M001") return;
            mat.amt = Math.min(mat.amt,this.materialCap());
        })
    },
    materialCap() {
        let total = 1000;
        if (Shop.alreadyPurchased("AL1030")) total += 500;
        if (Shop.alreadyPurchased("AL1031")) total += 500;
        if (Shop.alreadyPurchased("AL1032")) total += 1000;
        if (Shop.alreadyPurchased("AL1033")) total += 1000;
        return total;
    },
    canAffordMaterial(item) {
        if (item.mcost === null) return true;
        for (const [material, amt] of Object.entries(item.mcost)) {
            if (amt > this.materialAvailable(material)) return false;
        }
        return true;
    },
    deductMoney(amt) {
        this.addMaterial("M001",-amt);
    },
    addGold(amt) {
        this.addMaterial("M001",amt);
    },
    deductMaterial(item,skipAnimation) {
        if (item.mcost === null) return;
        for (const [resource, amt] of Object.entries(item.mcost)) {
            this.addMaterial(resource,-amt,skipAnimation);
        }
    },
    refundMaterial(item) {
        if (item.mcost === null) return;
        for (const [resource,amt] of Object.entries(item.mcost)) {
            this.addMaterial(resource,amt);
        }
    },
    materialIcon(type) {
        if (type[0] === "R") return recipeList.idToItem(type).itemPic();
        if (type[0] === "G") return GuildManager.idToGuild(type).icon;
        return `<img src="assets/images/resources/${type}.png" alt="${type}">`
    },
    formatCost(res,amt) {
        return `<div class="matIcon">${this.materialIcon(res)}</div> <span class="matAmt">${formatToUnits(amt,2)}</span>`;
    },
    sidebarMaterial(resID) {
        const res = this.materials.find(resource => resource.id == resID)
        return `${this.materialIcon(resID)}&nbsp;&nbsp${res.amt}`
    },
    available(res,amt) {
        const item = recipeList.idToItem(res);
        if (item === undefined) {
            return this.idToMaterial(res).amt >= amt;
        }
        return Inventory.itemCount(res,0) >= amt;
    },
    materialAvailable(matID) {
        if (matID.charAt(0) === "R") {
            return Inventory.itemCount(matID,0);
        }
        return this.materials.find(mat => mat.id === matID).amt;
    },
    materialsSeen() {
        return ResourceManager.materials.filter(mat => mat.id !== "M001").some(mat => mat.seen)
    },
    nameForWorkerSac(mat) {
        const item = recipeList.idToItem(mat);
        if (item === undefined) return this.idToMaterial(mat).name;
        return item.name;
    },
    idToMaterial(matID) {
        return this.materials.find(m=>m.id === matID);
    },
    isAMaterial(matID) {
        return this.materials.some(m=>m.id === matID);
    },
    reOrderMats() {
        this.materials.sort((a,b) => a.tier - b.tier);
    },
    fortuneResource(lvl) {
        const resources = this.materials.filter(r=>r.fortuneLvl===lvl);
        const week = currentWeek();
        const good = resources[week%resources.length].id;
        const great = resources[(week+1)%resources.length].id;
        const epic = resources[(week+2)%resources.length].id;
        return [good,great,epic];
    },
    materialSeenDungeon(dungeonID) {
        //returns a list of materials you've seen
        if (dungeonID === "D004") return [];
        const matids = MobManager.allMobDropsByDungeon(dungeonID);
        const materials = matids.map(m => this.idToMaterial(m));
        return materials.filter(m => m.seen);
    },
}

const $materials = $("#materials");

function initializeMats() {
    ResourceManager.reOrderMats();
    ResourceManager.materials.forEach(mat => {
        if (mat.id != "M001") {
            const d = $("<div/>").addClass("material tooltip").attr({"data-tooltip":"material_desc","data-tooltip-value":mat.id}).attr("id",mat.id);
            const d1 = $("<div/>").addClass("materialName").html(mat.img);
            const d2 = $("<div/>").addClass("materialAmt").attr("id","amt"+mat.id).html(formatToUnits(mat.amt,2));
            d.append(d1,d2);
            d.hide();
            $materials.append(d);
        }
    })
}

const $noMaterialDiv = $("#noMaterialDiv");

function hardMatRefresh() {
    //used when we first load in
    if (!ResourceManager.materialsSeen()) $noMaterialDiv.show();
    else $noMaterialDiv.hide();
    ResourceManager.materials.forEach(mat=> {
        if (!mat.seen) $("#"+mat.id).hide();
        else $("#"+mat.id).show();
        $("#amt"+mat.id).html(formatToUnits(mat.amt,2));
        if (mat.id === "M001") {
            $goldSidebarAmt.html(formatToUnits(mat.amt,2));
            $goldSidebar.addClass("tooltip").attr({"data-tooltip": "gold_value", "data-tooltip-value": formatWithCommas(mat.amt)})
        }
    })
}

function refreshMaterial(matID) {
    const mat = ResourceManager.idToMaterial(matID);
    if (!ResourceManager.materialsSeen()) $noMaterialDiv.show();
    else $noMaterialDiv.hide();
    if (!mat.seen) $("#"+matID).hide();
    else $("#"+matID).show();
    $("#amt"+matID).html(formatToUnits(mat.amt,2));
    if (mat.type === "dungeon") {
        const dungeonid = DungeonManager.dungeonByMat(matID).id;
        $("#dsbr"+dungeonid).html(mat.amt);
        return;
    }
    if (mat.type !== "gold") return;
    $goldSidebarAmt.html(formatToUnits(mat.amt,2));
    $goldSidebar.addClass("tooltip").attr({"data-tooltip": "gold_value", "data-tooltip-value": formatWithCommas(mat.amt)});
}