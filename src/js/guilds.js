"use strict";

const Merchant = {
    tabView : "Order",
    orders : [],
    orderConfig : [],
    createSave() {
        const save = {};
        save.orders = [];
        this.orders.forEach(order => {
            save.orders.push(order.createSave());
        })
        return save;
    },
    loadSave(save) {
        save.orders.forEach(order => {
            const newOrder = new orderItem(order.id);
            newOrder.loadSave(order);
            Merchant.orders.push(newOrder);
        });
        return;
    },
    addOrderConfig(order) {
        this.orderConfig.push(order);
    },
    maxOrders() {
        return Shop.slotsPurchased();
    },
    emptyOrders() {
        return this.maxOrders()-this.orders.length;
    },
    canBuyRecipe() {
        return this.orders.length < this.maxOrders();
    },
    nextRecipes() {
        const recipes = recipeList.availablePurchase();
        if (!Shop.alreadyPurchased("AL1026")) return [recipes.sort((a,b)=>a.unlockOrder-b.unlockOrder)[0]];
        const r1List = recipes.filter(r=>r.orderGroup === 1).sort((a,b)=>a.unlockOrder-b.unlockOrder);
        const r2List = recipes.filter(r=>r.orderGroup === 2).sort((a,b)=>a.unlockOrder-b.unlockOrder);
        const r3List = recipes.filter(r=>r.orderGroup === 3).sort((a,b)=>a.unlockOrder-b.unlockOrder);
        return [r1List[0],r2List[0],r3List[0]];
    },
    gainRecipe(recipeID) {
        const recipe = recipeList.idToItem(recipeID);
        if (recipe.owned) return;
        recipe.owned = true;
        this.orders.push(new orderItem(recipeID));
    },
    submitItem(uniqueID) {
        this.orders.forEach(order => {
            order.submit(uniqueID);
        });
        if (this.orders.every(o=>!o.complete())) return;
        this.orders.forEach(o=>o.increasePart());
        this.orders = this.orders.filter(o=>o.part < o.totalParts());
        refreshShopOrder();
    },
    orderByUid(uid) {
        return this.orders.find(o=>o.uniqueID() === uid);
    },
    orderProp(lvl) {
        const count = recipeList.ownedByLvl(lvl);
        return this.orderConfig.find(o=>o.lvl === lvl && o.order === count);
    },
    canChooseRecipe() {
        return Shop.alreadyPurchased("AL1026");
    },
    toggleAC(uniqueID) {
        const order = this.orderByUid(uniqueID);
        const ac = order.toggleAC();
        if (ac) Inventory.cycleAC(uniqueID);
        return ac;
    },
    isAC(uniqueID) {
        const order = this.orderByUid(uniqueID);
        return order.autoContribute;
    },
    canContribute(container) {
        const fit = this.orders.find(o=>o.uniqueID() === container.uniqueID() && o.autoContribute && !o.complete());
        return fit !== undefined;
    },
    autoContribute(container) {
        const fit = this.orders.find(o=>o.uniqueID() === container.uniqueID() && o.autoContribute && !o.complete());
        if (fit === undefined) return;
        fit.autoSubmit();
        if (this.orders.some(o=>o.complete())) {
            this.orders.forEach(o=>o.increasePart());
            this.orders = this.orders.filter(o=>o.part < o.totalParts());
            refreshShopOrder();
        };
        if (lastTab === "merchantTab" && this.tabView === "Order") refreshOrderRemaining(container.uniqueID());
    },
    manualSubmit(cid) {
        const container = Inventory.containerToItem(cid);
        const order = this.orders.find(o=>o.id === container.id);
        order.submitContainer(cid);
        if (this.orders.every(o=>!o.complete())) return;
        this.orders.forEach(o=>o.increasePart());
        this.orders = this.orders.filter(o=>o.part < o.totalParts());
        closeManualOrderTab();
    },
    actualUID(uid) {
        //takes a higher rarity/sharp and returns the UID of the slot you'd use it with
        const props = uniqueIDProperties(uid);
        const order = this.orders.find(o=>o.id === props.id);
        return order.uniqueID();
    }
}

class Order{
    constructor (props) {
        Object.assign(this, props);
    }
}

class orderItem {
    constructor (id) {
        this.id = id;
        this.item = recipeList.idToItem(id);
        const props = Merchant.orderProp(this.item.lvl);
        this.amt = props.amt;
        this.rarity = props.rarity;
        this.sharp = props.sharp;
        this.fufilled = 0;
        this.part = 0;
        this.autoContribute = false;
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.rarity = this.rarity;
        save.sharp = this.sharp;
        save.amt = this.amt;
        save.fufilled = this.fufilled;
        save.part = this.part;
        save.autoContribute = this.autoContribute
        return save;
    }
    loadSave(save) {
        this.amt = save.amt;
        this.rarity = save.rarity;
        this.sharp = save.sharp;
        this.amt = save.amt;
        this.fufilled = save.fufilled;
        this.part = save.part;
        this.autoContribute = save.autoContribute;
    }
    complete() {
        return this.fufilled >= this.getAmt();
    }
    totalParts() {
        return this.amt.length;
    }
    left() {
        return this.getAmt() - this.fufilled;
    }
    generateName() {
        if (this.getSharp() > 0) return `<span><span class="item-prefix tooltip" data-tooltip="forge_level">${miscIcons.enhancement}${this.getSharp()}</span>${this.item.name}</span>`
        return `${this.item.name}`
    }
    uniqueID() {
        return this.id+"_"+this.getRarity()+"_"+this.getSharp();
    }
    submit(uniqueID) {
        if (this.uniqueID() !== uniqueID) return;
        if (!Inventory.hasItem(uniqueID)) return;
        Inventory.removeFromInventoryUID(this.uniqueID());
        ResourceManager.addMaterial("M001",this.goldValue());
        this.fufilled += 1;
    }
    submitContainer(containerID) {
        Inventory.removeContainerFromInventory(containerID);
        ResourceManager.addMaterial("M001",this.goldValue());
        this.fufilled += 1;
    }
    autoSubmit() {
        ResourceManager.addMaterial("M001",this.goldValue());
        this.fufilled += 1;
    }
    goldValue() {
        return Math.round(2 * this.item.value * (this.getRarity()+1) * (1+this.getSharp()*0.1)); //this is copy & pasted from item container goldValue();
    }
    increasePart() {
        if (!this.complete()) return;
        this.fufilled = 0;
        this.part += 1;
    }
    getAmt() {
        return this.amt[this.part];
    }
    getRarity() {
        return this.rarity[this.part];
    }
    getSharp() {
        return this.sharp[this.part];
    }
    getSynth() {
        return this.synth[this.part];
    }
    toggleAC() {
        this.autoContribute = !this.autoContribute;
        return this.autoContribute;
    }
}

const $merchantList = $("#merchantList");

function initializeMerchantSidebar() {
    //just run this once during loading
    $merchantList.empty();
    const d = $("<div/>").addClass("merchantSideTab selected").attr("id","merchantOrderTab").appendTo($merchantList);
        $("<span/>").addClass("merchantSidebarIcon").html(miscIcons.merchantOrder).appendTo(d);
        $("<span/>").addClass("merchantSidebarName").html(`Shop Order`).appendTo(d);
    const e = $("<div/>").addClass("merchantSideTab").attr("id","merchantMasteryTab").appendTo($merchantList);
        $("<span/>").addClass("merchantSidebarIcon").html(miscIcons.mastery).appendTo(e);
        $("<span/>").addClass("merchantSidebarName").html(`Mastery`).appendTo(e);
}

const $merchantOrderTabContent = $("#merchantOrderTabContent");
const $merchantMasteryTabContent = $("#merchantMasteryTabContent");
const $merchantOrders = $("#merchantOrders");
const $merchantMastery = $("#merchantMastery");

function merchantTabClick() {
    if (Merchant.tabView === "Order") {
        $merchantOrderTabContent.show();
        $merchantMasteryTabContent.hide();
        refreshShopOrder();
    }
    if (Merchant.tabView === "Mastery") {
        $merchantOrderTabContent.hide();
        $merchantMasteryTabContent.show();
        refreshRecipeMastery();
    }
    checkCraftableStatus();
}

function checkCraftableStatus() {
    //*rewrite this?**//
    // Check if item in guild order can be crafted
    const $orderCraft = $(".orderCraft");
    $orderCraft.removeClass("recipeCraftDisable");
    recipeList.recipes.forEach(recipe => {
        if (!recipe.canProduce || !recipe.owned || actionSlotManager.slots.length >= actionSlotManager.maxSlots) $("#"+recipe.id+".orderCraft").addClass("recipeCraftDisable");
    }) 
}

function refreshShopOrder() {
    if (lastTab !== "merchantTab") return;
    $merchantOrders.empty();
    const contentHeader = $("<div/>").addClass(`contentHeader`).appendTo($merchantOrders);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(contentHeader);
        $("<div/>").addClass("headingTitle").html(displayText("merchant_recipe_orders_header_title")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("merchant_recipe_orders_header_desc")).appendTo(headingDetails);
    const merchantOrderContainer = $("<div/>").addClass("merchantOrderContainer").appendTo($merchantOrders);
    Merchant.orders.forEach(order => {
        createOrderCard(order).appendTo(merchantOrderContainer);
    });
    for (let i=0;i<Merchant.emptyOrders();i++) {
        createEmptyOrderCard().appendTo(merchantOrderContainer);
    }
    createRecipeBuy().appendTo($merchantOrders);
}

function refreshRecipeMastery() {
    $merchantMastery.empty();
    const recipes = recipeList.needMastery();
    const contentHeader = $("<div/>").addClass(`contentHeader`).appendTo($merchantMastery);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(contentHeader);
        $("<div/>").addClass("headingTitle").html(displayText("merchant_recipe_mastery_header_title")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("merchant_recipe_mastery_header_desc")).appendTo(headingDetails);
    $("<div/>").addClass("headingMoreInfoButton tooltip").attr({"data-tooltip": "more_info_mastery"}).html("More Info").appendTo(contentHeader);
    if (recipes.length === 0) {
        $("<div/>").addClass("noMasteryRecipes").html(displayText("merchant_recipe_mastery_none")).appendTo($merchantMastery);
        return;
    }
    const merchantOrderContainer = $("<div/>").addClass("merchantOrderContainer").appendTo($merchantMastery);
    recipes.filter(r=>r.canBuy).forEach(recipe => {
        createRecipeMasteryCard(recipe).appendTo(merchantOrderContainer);
    });
}

function createOrderCard(item,manual) {
    const d1 = $("<div/>").addClass(`orderCard R${item.getRarity()}`).data("uid",item.uniqueID());
    $("<div/>").addClass("orderIcon").html(ResourceManager.materialIcon(item.id)).appendTo(d1);
    $("<div/>").addClass("orderName itemName").html(item.generateName()).appendTo(d1);
    $("<div/>").addClass("itemLevel").html(item.item.itemLevel()).appendTo(d1);
    $("<div/>").addClass(`itemRarity RT${item.getRarity()} tooltip`).attr({"data-tooltip": `rarity_${rarities[item.getRarity()].toLowerCase()}`}).html(miscIcons.rarity).appendTo(d1);
    $("<div/>").addClass("itemToSac tooltip").attr({"data-tooltip":"recipe_desc","data-tooltip-value":item.id}).appendTo(d1);
    const d2 = $("<div/>").addClass("orderMaterials").appendTo(d1);
    item.item.gcost.forEach(g => {
        $("<div/>").addClass("orderWorker tooltip").attr({"data-tooltip":`${g}_worker`}).html(miscIcons[g]).appendTo(d2);
    });
    if (item.item.mcost) {
        Object.keys(item.item.mcost).forEach((mat,i) => {
            const matBox = $("<div/>").addClass("orderGuildMat tooltip").attr({"data-tooltip":"material_desc","data-tooltip-value":mat}).appendTo(d2);
            $("<div/>").addClass("matIcon").html(ResourceManager.idToMaterial(mat).img).appendTo(matBox);
            $("<div/>").addClass("matAmt").html(Object.values(item.item.mcost)[i]).appendTo(matBox);
            if (item.item.isMastered()) matBox.addClass("isMastered");
        });
    }
    $("<div/>").addClass("itemToSacReq").attr("id","itsr"+item.uniqueID()).html(`${formatToUnits(item.left(),2)} Left`).appendTo(d1);

    const d3 = $("<div/>").addClass("guildItemSubmit").appendTo(d1);
    $("<div/>").addClass("guildItemSubmitHeading").html(`Rewards`).appendTo(d3);
        const d3a = $("<div/>").addClass("guildOrderRewards").appendTo(d3);
        const goldReward = $("<div/>").addClass("guildOrderReward tooltip").attr({"data-tooltip": "gold_value", "data-tooltip-value": formatWithCommas(item.goldValue())}).appendTo(d3a);
            $("<div/>").addClass("rewardIcon").html(miscIcons.gold).appendTo(goldReward);
            $("<div/>").addClass("rewardValue").html(formatToUnits(item.goldValue(),2)).appendTo(goldReward);
    if (manual) return d1;
    //these are buttons that only exist for the actual screen
    const orderActions = $("<div/>").addClass("orderActions").appendTo(d1);
        $("<div/>").addClass("orderManual tooltip").attr({"data-tooltip":"manual_contribute"}).data("uid",item.uniqueID()).html(miscIcons.manualSubmit).appendTo(orderActions);
        $("<div/>").attr("id",item.id).addClass("orderCraft").data("uid",item.uniqueID()).html(`<i class="fas fa-hammer"></i> Craft`).appendTo(orderActions);

    const d4 = $("<div/>").addClass("orderAC orderACToggle tooltip").attr({"data-tooltip":"auto_contribute"}).data("uid",item.uniqueID()).appendTo(d1);
    if (item.autoContribute) {
        d4.addClass("acEnable")
        $("<div/>").html(miscIcons.toggleOn).appendTo(d4);
    }
    else $("<div/>").html(miscIcons.toggleOff).appendTo(d4);
    $("<span/>").addClass("orderACtext").html(displayText("merchant_order_auto_contribute")).appendTo(d4);

    const orderExtras = $("<div/>").addClass("orderExtras").appendTo(d1);
        $("<div/>").addClass("orderPart tooltip").attr({"data-tooltip":"order_part"}).html(`${item.part+1}/${item.totalParts()}`).appendTo(orderExtras);
        const invCount = $("<div/>").addClass("orderInv tooltip").attr("data-tooltip","in_inventory").data("uid",item.uniqueID()).html(`<i class="fas fa-cube"></i> ${Inventory.itemCountSpecific(item.uniqueID())}`).appendTo(orderExtras);
    if (Inventory.itemCountSpecific(item.uniqueID()) > 0) invCount.addClass("canContribute");
    return d1;
};

function createEmptyOrderCard() {
    const d1 = $("<div/>").addClass("orderCardEmpty");
    $("<div/>").addClass('orderCardText').html(displayText("merchant_order_empty")).appendTo(d1);
    return d1;
};

function createRecipeBuy() {
    const d = $("<div/>").addClass('orderRecipeBuy').appendTo($merchantMastery);
    const contentHeader = $("<div/>").addClass(`contentHeader`).appendTo(d);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(contentHeader);
        $("<div/>").addClass("headingTitle").html(displayText("merchant_recipe_buy_header_title")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("merchant_recipe_buy_header_desc")).appendTo(headingDetails);
    $("<div/>").addClass("headingMoreInfoButton tooltip").attr({"data-tooltip": "more_info_shop_recipes"}).html("More Info").appendTo(contentHeader);
    if (Merchant.emptyOrders() === 0) {
        $("<div/>").addClass("orderRecipeNoBuy emptyContentMessage").html(displayText("merchant_recipe_no_buy")).appendTo(d);
        return d;
    }
    const rList = Merchant.nextRecipes();
    const recipeBuyContainer = $("<div/>").addClass('orderRecipesBuyContainer').appendTo(d);
    rList.forEach(recipe => {
        if (recipe === undefined) {
            $("<div/>").addClass('orderRecipeNone').html(displayText("merchant_recipe_orders_none")).appendTo(recipeBuyContainer);
            return;
        }
        const recipeBuy = $("<div/>").attr("id","orderRecipeBuyChoice").addClass('orderRecipeBuyChoice').data("rid",recipe.id).appendTo(recipeBuyContainer);
        $('<div/>').addClass('recipeDescription tooltip').attr({"data-tooltip": "recipe_desc", "data-tooltip-value": recipe.id}).html("<i class='fas fa-info-circle'></i>").appendTo(recipeBuy);
        $("<div/>").addClass('itemName').html(recipe.itemPicName()).appendTo(recipeBuy);
        $("<div/>").addClass("itemLevel").html(recipe.itemLevel()).appendTo(recipeBuy);
        $("<div/>").addClass('itemMaterial tooltip').attr({"data-tooltip":"material_desc","data-tooltip-value":recipe.material()}).html(ResourceManager.idToMaterial(recipe.material()).img).appendTo(recipeBuy);
        const itemWorkers = $("<div/>").addClass('itemWorkers').appendTo(recipeBuy);
        recipe.gcost.forEach(type => {
            $("<div/>").addClass("indvCost tooltip").attr({"data-tooltip":`${type}_worker`}).html(miscIcons[type]).appendTo(itemWorkers);
        })
        const d2 = $("<div/>").addClass('itemType').appendTo(recipeBuy);
            $("<div/>").addClass('recipeHeroTypeHeader').html("Hero Type").appendTo(d2);
            const d2a = $("<div/>").addClass('itemTypeText').html(recipe.usedBy).appendTo(d2);
            if (recipe.usedBy === "MIGHT") d2a.addClass("classMight");
            if (recipe.usedBy === "MIND") d2a.addClass("classMind");
            if (recipe.usedBy === "MOXIE") d2a.addClass("classMoxie");
    });
    return d;
}

function refreshOrderInvCount() {
    //rewrite this?
    $(".orderInv").each(function() {
        const $this = $(this);
        const uniqueID = $this.data("uid");
        const invCount = Inventory.itemCountSpecific(uniqueID);
        if (invCount > 0) $this.addClass("canContribute").html(`<i class="fas fa-cube"></i> ${invCount}`);
        else $this.removeClass("canContribute").html(`<i class="fas fa-cube"></i> ${invCount}`);
    });
}

function createRecipeMasteryCard(recipe) {
    const d1 = $("<div/>").addClass("recipeMasteryGuildCard").addClass("ctrlClickItem").data("rid",recipe.id);
        $("<div/>").addClass("itemName").html(recipe.itemPicName()).appendTo(d1);
        $("<div/>").addClass("itemLevel").html(recipe.itemLevel()).appendTo(d1);
        $("<div/>").addClass("recipeMasteryViewButton actionButton tooltip").attr({"data-tooltip": "guild_mastery_recipe"}).data("rid",recipe.id).html('<i class="fas fa-book"></i>').appendTo(d1);
        const d2 = $("<div/>").addClass("recipeMasteryRemaining").attr("id","rmr"+recipe.id).html(displayText("merchant_recipe_mastery_craft_remaining").replace('{0}',recipe.canMaster())).appendTo(d1);
        if (recipe.canMaster() === 0) d2.hide();
    const masteryCost = recipe.masteryCost();
    const masteryButton = $("<div/>").attr("id","rmb"+recipe.id).addClass("recipeMasteryGuildButton actionButtonCardCost").data("rid",recipe.id).appendTo(d1);
        $("<div/>").addClass("actionButtonCardText").html("Master Recipe").appendTo(masteryButton);
        $("<div/>").addClass("actionButtonCardValue tooltip").attr({"id":"rmr2"+recipe.id,"data-tooltip":"material_desc","data-tooltip-value":masteryCost.id}).html(`${ResourceManager.materialIcon(masteryCost.id)} ${masteryCost.amt}`).appendTo(masteryButton);
        if (recipe.canMaster() > 0) masteryButton.hide();
    return d1;
}

function refreshRecipeMasteryAmt(recipe) {
    if (recipe.canMaster() === 0) {
        const masteryCost = recipe.masteryCost();
        $("#rmb"+recipe.id).show();
        $("#rmr"+recipe.id).hide();
        $("#rmr2"+recipe.id).html(`${ResourceManager.materialIcon(masteryCost.id)} ${masteryCost.amt}`);
        return;
    }
    $("#rmb"+recipe.id).hide();
    $("#rmr"+recipe.id).html(displayText("merchant_recipe_mastery_craft_remaining").replace('{0}',recipe.canMaster()));
}

const $moType = $("#moType");
const $moOptions = $("#moOptions");
const $manualOrderTab = $("#manualOrderTab");

function manualOrder(uniqueID) {
    const order = Merchant.orderByUid(uniqueID);
    if (!order) return;
    $moType.empty().html(createOrderCard(order,true));
    $moOptions.empty();
    Inventory.betterThan(uniqueID).forEach(item => {
        createManualTurnin(item).appendTo($moOptions);
    })
    $(".tabcontent").hide();
    $manualOrderTab.show();
}

function createManualTurnin(container) {
    const d = $("<div/>").addClass("merchantManualItem").addClass("R"+container.rarity);
    $("<div/>").addClass("itemName").html(container.picName()).appendTo(d);
    $("<div/>").addClass(`itemRarity RT${container.rarity} tooltip`).attr({"data-tooltip": `rarity_${rarities[container.rarity].toLowerCase()}`}).html(miscIcons.rarity).appendTo(d);
    $("<div/>").addClass("itemLevel").html(container.itemLevel()).appendTo(d);
    const d1 = $("<div/>").addClass("manualOrderButtons").appendTo(d);
    $("<div/>").addClass('manualOrderSubmit actionButtonCard').data("cid",container.containerID).html("Submit").appendTo(d1);
    return d;
}

//back button
$(document).on("click","#closeShopOrder",(e) => {
    e.preventDefault();
    closeManualOrderTab();
})

function closeManualOrderTab() {
    refreshShopOrder();
    $(".tabcontent").hide();
    $("#merchantTab").show();
}

//click manual order button
$(document).on("click",".orderManual",(e) => {
    e.preventDefault();
    e.stopPropagation();
    const uid = $(e.currentTarget).data("uid");
    manualOrder(uid);
});

//submit a manual order
$(document).on("click",".manualOrderSubmit",(e) => {
    e.preventDefault();
    const cid = $(e.currentTarget).data("cid");
    const uid = Inventory.containerToItem(cid).uniqueID();
    const realuid = Merchant.actualUID(uid);
    Merchant.manualSubmit(cid);
    manualOrder(realuid);
});

//click on shop order tab
$(document).on("click","#merchantOrderTab",(e) => {
    e.preventDefault();
    clickOrder();
});

function clickOrder() {
    Merchant.tabView = "Order";
    $(".merchantSideTab").removeClass("selected");
    $("#merchantOrderTab").addClass("selected");
    merchantTabClick();
}

//click on mastery tab
$(document).on("click","#merchantMasteryTab",(e) => {
    e.preventDefault();
    clickMastery();
});

function clickMastery() {
    Merchant.tabView = "Mastery";
    $(".merchantSideTab").removeClass("selected");
    $("#merchantMasteryTab").addClass("selected");
    merchantTabClick();
}

//gain a recipe
$(document).on("click",".orderRecipeBuyChoice",(e) => {
    e.preventDefault();
    const ID = $(e.currentTarget).data("rid");
    Merchant.gainRecipe(ID);
    refreshShopOrder();
    refreshRecipeFilters();
});

//go to recipe screen for a recipe in mastery
$(document).on("click",".recipeMasteryViewButton",(e) => {
    e.preventDefault();
    const ID = $(e.currentTarget).data("rid");
    const recipe = recipeList.recipes.filter(r => r.id === ID)[0];
    const searchString = recipe.name;
    tabClick(e, "recipesTab");
    invokeSearch(searchString);
});

//attempt a mastery
$(document).on("click",".recipeMasteryGuildButton",(e) => {
    e.preventDefault();
    const rid = $(e.currentTarget).data("rid");
    recipeList.attemptMastery(rid);
});

//submit an item to guild order
$(document).on("click",".orderCard",(e) => {
    e.preventDefault();
    destroyTooltip();
    const uid = $(e.currentTarget).data("uid");
    Merchant.submitItem(uid);
    refreshOrderRemaining(uid);
});

function refreshOrderRemaining(uid) {
    const order = Merchant.orderByUid(uid);
    if (order === undefined) return;
    $("#itsr"+uid).html(`${formatToUnits(order.left(),2)} Left`);
}

//Craft from Order Card
$(document).on('click', '.orderCraft', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const itemID = $(e.currentTarget).attr("id");
    const uid = $(e.currentTarget).data("uid");
    if (!Merchant.isAC(uid)) recipeList.idToItem(itemID).autoSell = "None";
    actionSlotManager.addSlot(itemID);
});

//toggle auto craft
$(document).on('click', '.orderACToggle', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const uniqueID = $(e.currentTarget).data("uid");
    const toggle = Merchant.toggleAC(uniqueID);
    if (toggle) $(e.currentTarget).addClass("acEnable").html(miscIcons.toggleOn);
    else $(e.currentTarget).removeClass("acEnable").html(miscIcons.toggleOff);
    $("<span/>").addClass("orderACtext").html(displayText("merchant_order_auto_contribute")).appendTo($(e.currentTarget));
    refreshOrderInvCount();
    refreshInventoryPlaces();
})