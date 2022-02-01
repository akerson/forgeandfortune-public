"use strict";

const Shop = {
    perks : [],
    addPerk(reward) {
        this.perks.push(reward);
    },
    createSave() {
        const save = {};
        save.perks = [];
        this.perks.forEach(p => save.perks.push(p.createSave()));
        return save;
    },
    loadSave(save) {
        if (save.perks === undefined) return;
        save.perks.forEach(perk => {
            const perka = this.idToPerk(perk.id);
            if (perka === undefined) return;
            perka.loadSave(perk);
        });
    },
    idToPerk(id) {
        return this.perks.find(r=>r.id === id);
    },
    buyPerk(id) {
        const perk = this.idToPerk(id);
        if (ResourceManager.materialAvailable("M001") < perk.goldCost) {
            ToastManager.renderToast("perk_cost");
            return;
        }
        ResourceManager.deductMoney(perk.goldCost);
        perk.purchase();
        refreshShop();
        refreshProgress();
        tabHide();
    },
    perkCount() {
        return this.perks.filter(p=>p.purchased).length;
    },
    perkMaxCount() {
        return this.perks.length;
    },
    perksByType(type) {
        return this.perks.filter(p=>p.category === type).sort((a,b) => a.order-b.order);
    },
    nextUnlocks(type) {
        const notPurchased = this.perks.filter(p=>p.category === type && !p.purchased).sort((a,b) => a.order-b.order);
        return {canPurchase:notPurchased[0],nextUp:notPurchased[1]};
    },
    boughtPerks() {
        return this.perks.filter(p=>p.purchased);
    },
    alreadyPurchased(perkID) {
        const perk = this.idToPerk(perkID);
        return perk.alreadyPurchased();
    },
    boughtPerkSubtype(subtype) {
        return this.perks.filter(p=>p.purchased && p.subtype === subtype);
    },
    slotsPurchased() {
        return 1+this.perks.filter(p=>p.purchased && p.type === "order").length;
    }
}

class Perk {
    constructor (props) {
        Object.assign(this, props);
        this.purchased = false;
    }
    canBuy() {
        return ResourceManager.materialAvailable("M001") >= this.goldCost;
    }
    purchase() {
        this.purchased = true;
        if (this.type === "hero") HeroManager.gainHero(this.subtype);
        if (this.type === "worker") {
            refreshSideWorkers();
            refreshRecipeFilters();
            recipeList.canCraft();
            refreshProgress();
        }
        if (this.type === "autosell") actionSlotManager.showAutoSell();
        if (this.type === "craft") actionSlotManager.upgradeSlot();
        if (this.type === "synth" && this.subtype === "open") TownManager.buildingPerk("synth");
        if (this.type === "bank" && this.subtype === "open") TownManager.buildingPerk("bank");
        if (this.type === "bank" && this.subtype === "level") BankManager.addLevel();
        if (this.type === "cauldron" && this.subtype === "open") TownManager.buildingPerk("fusion");
        if (this.type === "cauldron" && this.subtype === "level") FusionManager.addLevel();
        if (this.type === "forge" && this.subtype === "open") TownManager.buildingPerk("forge");
        if (this.type === "forge" && this.subtype === "level") bloopSmith.addLevel();
        if (this.type === "fortune" && this.subtype === "open") TownManager.buildingPerk("fortune");
        if (this.type === "fortune" && this.subtype === "level") FortuneManager.addLevel();
        if (this.type === "tinker" && this.subtype === "open") TownManager.buildingPerk("tinker");
        if (this.type === "tinker" && this.subtype === "level") TinkerManager.addLevel();
        if (this.type === "museum" && this.subtype === "open") TownManager.buildingPerk("museum");
        if (this.type === "milestone" && this.subtype === "open") TownManager.buildingPerk("milestone");
        if (this.type === "expedition" && this.subtype === "open") TownManager.buildingPerk("expedition");
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.purchased = this.purchased;
        return save;
    }
    loadSave(save) {
        this.purchased = save.purchased;
    }
    alreadyPurchased() {
        return this.purchased;
    }
    availableForPurchase() {
        if (this.unlockReq === null) return true;
        return DungeonManager.beaten(this.unlockReq);
    }
}

const $marketsTab = $("#marketsTab");
const $purchasePerks = $("#purchasePerks");
const $boughtPerks = $("#boughtPerks");
const $purchasedPerks = $("#purchasedPerks");

const shopDivs = [
    "Crafting",
    "Dungeon",
    "Town",
]

function refreshShop() {
    $purchasePerks.empty();
    // Perks Available Header
    const perksAvailableHeader = $("<div/>").addClass(`contentHeader`).appendTo($purchasePerks);
    const perksAvailableHeadingDetails = $("<div/>").addClass("headingDetails").appendTo(perksAvailableHeader);
        $("<div/>").addClass("headingTitle").html(displayText("header_market_perks_available_title")).appendTo(perksAvailableHeadingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("header_market_perks_available_desc")).appendTo(perksAvailableHeadingDetails);
    // Perks Available Cards
    const perksAvailableCardsContainer = $("<div/>").addClass(`perksAvailableCardsContainer`).appendTo($purchasePerks);
    shopDivs.forEach(type => {
        const perks = Shop.nextUnlocks(type);
        if (perks.canPurchase === undefined) return;
        perksAvailableCardsContainer.append(createALperk(perks.canPurchase,type));
    })
    const boughtPerks = Shop.boughtPerks();
    if (boughtPerks.length > 0) {
        $purchasedPerks.show();
        $boughtPerks.empty();
        // Perks Purchased Header
        const perksPurchasedHeader = $("<div/>").addClass(`contentHeader`).appendTo($boughtPerks);
        const perksPurchasedHeadingDetails = $("<div/>").addClass("headingDetails").appendTo(perksPurchasedHeader);
            $("<div/>").addClass("headingTitle").html(displayText("header_market_perks_purchased_title")).appendTo(perksPurchasedHeadingDetails);
            $("<div/>").addClass("headingDescription").html(displayText("header_market_perks_purchased_desc")).appendTo(perksPurchasedHeadingDetails);
        // Perks Purchased Cards
        const perksPurchasedCardsContainer = $("<div/>").addClass(`perksPurchasedCardsContainer`).appendTo($boughtPerks);
        boughtPerks.forEach(perk => {
            createPurchasedperk(perk).appendTo(perksPurchasedCardsContainer);
        });
    }
    else $purchasedPerks.hide();
}

function createALperk(perk,name) {
    const perkCount =  Shop.perksByType(name).length - Shop.perksByType(name).filter(perk => perk.purchased).length;
    const d1 = $("<div/>").addClass("alPerk");
    $("<div/>").addClass("alTitle").html(perk.title).appendTo(d1);
    $("<div/>").addClass("alSection").html(`${name} Perk`).appendTo(d1);
    const perkImage = $("<div/>").addClass("alImage").html(perk.icon).appendTo(d1);
    if (perkCount > 1) $("<div/>").addClass("alPerkCount tooltip").attr({"data-tooltip": "perks_remaining"}).html(`+${perkCount - 1}`).appendTo(perkImage);
    $("<div/>").addClass("alDesc").html(perk.description).appendTo(d1);
    if (perk.purchased) {
        return d1.addClass("perkPurchased");
    }
    if (!perk.availableForPurchase()) {
        $("<div/>").addClass("alBossBeat").html("Beat next boss to unlock!").appendTo(d1);
        return d1;
    }
    const d5 = $("<div/>").addClass("alPerkBuy actionButtonCardCost").data("pid",perk.id).appendTo(d1);
        if (!perk.canBuy()) d5.addClass("cannotAfford");
        else d5.removeClass("cannotAfford");
        $("<div/>").addClass("actionButtonCardText").html(displayText('market_perk_purchase_button')).appendTo(d5);
        $("<div/>").addClass("actionButtonCardValue tooltip").attr({"data-tooltip": "gold_value", "data-tooltip-value": formatWithCommas(perk.goldCost)}).html(`${miscIcons.gold} ${formatToUnits(perk.goldCost,2)}`).appendTo(d5);
    return d1;
}

function createPurchasedperk(perk) {
    const d1 = $("<div/>").addClass("alPurchasedPerk tooltip").attr({"data-tooltip": "perk_desc", "data-tooltip-value": perk.id});
    $("<div/>").addClass("purchasedPerkTitle").html(perk.title).appendTo(d1);
    $("<div/>").addClass("alSection").html(`${perk.category} Perk`).appendTo(d1);
    $("<div/>").addClass("purchasedPerkImage").html(perk.icon).appendTo(d1);
    return d1;
}

//buy a perk
$(document).on("click",".alPerkBuy", (e) => {
    e.preventDefault();
    destroyTooltip();
    const perkid = $(e.currentTarget).data("pid");
    Shop.buyPerk(perkid);
});