"use strict";

const WorkerType = Object.freeze({COG:"COG",WEAPON:"WEAPON",ARMOR:"ARMOR",JEWEL:"JEWEL"});

const WorkerManager = {
    canProduceBucket : {},
    workersUnlocked(type) {
        const extra = type === WorkerType.COG ? 1 : 0;
        return Shop.boughtPerkSubtype(type).length+extra;
    },
    workersFree(type) {
        const usage = actionSlotManager.workersUsed(type);
        return this.workersUnlocked(type) - usage;
    },
    couldCraft(item) {
        const needBucket = groupArray(item.gcost);
        for (const [type, amt] of Object.entries(needBucket)) {
            if (this.workersUnlocked(type) < amt) return false;
        }
        return true;
    },
    canCurrentlyCraft(item) {
        const needBucket = groupArray(item.gcost);
        for (const [type, amt] of Object.entries(needBucket)) {
            if (this.workersFree(type) < amt) return false;
        }
        return true;
    },
    freeWorkers() {
        return {
            COG : this.workersFree(WorkerType.COG),
            JEWEL : this.workersFree(WorkerType.JEWEL),
            ARMOR : this.workersFree(WorkerType.ARMOR),
            WEAPON : this.workersFree(WorkerType.WEAPON),
        }
    }
}

const $CogWorkerFree = $("#CogWorkerFree");
const $WeaponWorkerFree = $("#WeaponWorkerFree");
const $ArmorWorkerFree = $("#ArmorWorkerFree");
const $JewelWorkerFree = $("#JewelWorkerFree");
const $CogWorkersSide = $("#CogWorkersSide");
const $WeaponWorkersSide = $("#WeaponWorkersSide");
const $ArmorWorkersSide = $("#ArmorWorkersSide");
const $JewelWorkersSide = $("#JewelWorkersSide");

function refreshSideWorkers() {
    const cogFree = WorkerManager.workersFree(WorkerType.COG);
    const weaponFree = WorkerManager.workersFree(WorkerType.WEAPON);
    const armorFree = WorkerManager.workersFree(WorkerType.ARMOR);
    const jewelFree = WorkerManager.workersFree(WorkerType.JEWEL);
    $CogWorkerFree.html(cogFree);
    $WeaponWorkerFree.html(weaponFree);
    $ArmorWorkerFree.html(armorFree);
    $JewelWorkerFree.html(jewelFree);
    if (cogFree > 0) $CogWorkersSide.removeClass("noWorkersAvailable");
    else $CogWorkersSide.addClass("noWorkersAvailable");
    if (weaponFree > 0) $WeaponWorkersSide.removeClass("noWorkersAvailable");
    else $WeaponWorkersSide.addClass("noWorkersAvailable");
    if (armorFree > 0) $ArmorWorkersSide.removeClass("noWorkersAvailable");
    else $ArmorWorkersSide.addClass("noWorkersAvailable");
    if (jewelFree > 0) $JewelWorkersSide.removeClass("noWorkersAvailable");
    else $JewelWorkersSide.addClass("noWorkersAvailable");
    if (WorkerManager.workersUnlocked(WorkerType.COG) > 0) $CogWorkersSide.show();
    else $CogWorkersSide.hide();
    if (WorkerManager.workersUnlocked(WorkerType.WEAPON) > 0) $WeaponWorkersSide.show();
    else $WeaponWorkersSide.hide();
    if (WorkerManager.workersUnlocked(WorkerType.ARMOR) > 0) $ArmorWorkersSide.show();
    else $ArmorWorkersSide.hide();
    if (WorkerManager.workersUnlocked(WorkerType.JEWEL) > 0) $JewelWorkersSide.show();
    else $JewelWorkersSide.hide();
};