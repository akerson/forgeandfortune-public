"use strict";

const ItemType = ["Armor", "Belts", "Cloaks", "Gauntlets", "Gloves", "Hats", "Helmets", "Knives", "Masks", "Pendants", 
                "Rings", "Shields", "Shoes", "Staves", "Swords", "Thrown", "Tomes", "Trinkets", "Vests"];

const $RecipeResults = $("#RecipeResults");

const MasteryFilter = Object.freeze({BOTH:0,MASTERED:1,UNMASTERED:2});

class Item{
    constructor (props) {
        Object.assign(this, props);
        this.craftCount = 0;
        this.mastered = false;
        this.autoSell = "None";
        this.owned = false;
        this.goldComma = this.itemValueCommas(this.value);
        this.museum = createArray(4,11);
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.craftCount = this.craftCount;
        save.autoSell = this.autoSell;
        save.owned = this.owned;
        save.mastered = this.mastered;
        save.museum = this.museum;
        return save;
    }
    loadSave(save) {
        this.craftCount = save.craftCount;
        this.autoSell = save.autoSell;
        this.owned = save.owned;
        if (save.mastered !== undefined) this.mastered = save.mastered;
        if (save.museum !== undefined) this.museum = save.museum;
    }
    itemDescription() {
        return this.description;
    }
    itemPicName() {
        return "<img src='assets/images/recipes/"+this.type+"/"+this.id+".png'>"+"<div class='item-name'>"+this.name+"</div>";
    }
    itemName() {
        return "<div class='item-name'>"+this.name+"</div>";
    }
    itemPic() {
        return "<img src='assets/images/recipes/"+this.type+"/"+this.id+".png'>";
    }
    itemLevel() {
        return `<div class="level_text">LVL</div><div class="level_integer">${this.lvl}</div>`;
    }
    itemValueCommas() {
        return formatWithCommas(this.value);
    }
    itemValueFormatted() {
        return formatToUnits(this.value,2);
    }
    itemValue() {
        return this.value;
    }
    visualizeResAndMat() {
        const d = $("<div/>").addClass("itemCost");
        this.gcost.forEach(type => {
            d.append($("<div/>").addClass("indvCost resCost tooltip").attr({"data-tooltip":`${type}_worker`}).html(miscIcons[type]));
        })
        if (this.mcost === null) return d;
        for (const [material, amt] of Object.entries(this.mcost)) {
            const mat = ResourceManager.idToMaterial(material);
            const d1 = $("<div/>").addClass("indvCost matCost tooltip").attr("id","vr"+this.id).attr({"data-tooltip":"material_desc","data-tooltip-value":mat.id}).html(ResourceManager.formatCost(material,amt));
            if (mat.id === "M001") d1.addClass("matGold").attr({"data-tooltip":"gold_value","data-tooltip-value":formatWithCommas(amt)});
            d.append(d1);
        }
        return d;
    }
    recipeListStats(isEpic) {
        const d = $("<div/>").addClass("recipeStatList");
        const pow = isEpic ? this.pow*this.pts*miscLoadedValues.rarityMod[3] : this.pow*this.pts;
        const hp = isEpic ? 9*this.hp*this.pts*miscLoadedValues.rarityMod[3] : 9*this.hp*this.pts;
        if (pow > 0) $("<div/>").addClass("recipeStat tooltip").attr("data-tooltip", "pow").html(`${miscIcons.pow}<span class="statValue">${pow}</span>`).appendTo(d);
        if (hp > 0) $("<div/>").addClass("recipeStat tooltip").attr("data-tooltip", "hp").html(`${miscIcons.hp}<span class="statValue">${hp}</span>`).appendTo(d);
        return d;
    }
    count() {
        return Math.min(this.craftCount,100);
    }
    addCount() {
        this.craftCount += 1;
    }
    attemptMastery() {
        if (this.isMastered()) return;
        const masteryCost = this.masteryCost();
        if (ResourceManager.materialAvailable(masteryCost.id) < masteryCost.amt) {
            ToastManager.renderToast("recipe_master_need_more");
            return;
        }
        ResourceManager.addMaterial(masteryCost.id,-masteryCost.amt);
        this.mastered = true;
        ToastManager.renderToast("master_recipe",this.name);
        refreshCraftedCount(this);
        destroyTooltip(); // Removes stuck tooltip after mastering item on recipe card
        refreshProgress();
        refreshRecipeMastery();
    }
    isMastered() {
        if (this.recipeType === "building" || this.recipeType === "Trinket") return false;
        return this.mastered;
    }
    autoSellToggle() {
        if (this.autoSell === "None") this.autoSell = "Common";
        else if (this.autoSell === "Common") this.autoSell = "Good";
        else if (this.autoSell === "Good") this.autoSell = "Great";
        else if (this.autoSell === "Great") this.autoSell = "Epic";
        else this.autoSell = "None";
        return this.autoSell;
    }
    setCanCraft(canProduceBucket) {
        const needBucket = groupArray(this.gcost);
        this.canProduce = true;
        for (const [type, amt] of Object.entries(needBucket)) {
            if (canProduceBucket[type] < amt) {
                this.canProduce = false;
            };
        }
    }
    material() {
        if (!this.mcost) return "M201";
        return Object.keys(this.mcost)[0]
    }
    reducedCraft() {
        return Math.floor(this.craftTime * Museum.craftTime(this.id));
    }
    canMaster() {
        return Math.max(0,this.minCraft-this.craftCount);
    }
    masteryCost() {
        const amt = Math.max(0,this.masteryTotal-this.masteryAmt*(this.craftCount-this.minCraft));
        const material = this.mcost ? Object.keys(this.mcost)[0] : "M201";
        return new idAmt(material,amt);
    }
}

const recipeList = {
    recipes : [],
    recipeFilterScope: "itemType",
    recipeFilterType : "Knives",
    recipeFilterString : "",
    recipeSortType : "default",
    masteryFilter : MasteryFilter.BOTH,
    addItem(item) {
        this.recipes.push(item);
    },
    createSave() {
        const save = [];
        this.recipes.forEach(r=> {
            save.push(r.createSave());
        });
        return save;
    },
    loadSave(save) {
        save.forEach(i => {
            const rec = this.idToItem(i.id);
            if (rec !== undefined) rec.loadSave(i);
        });
    },
    filteredRecipeList() {
        const cleanString = this.recipeFilterString.toLowerCase();
        if (this.recipeFilterType === "default") return this.recipes.filter(r => r.owned && r.name.toLowerCase().includes(cleanString) && r.type !== "Trinkets");
        // filter by levels
        if (this.masteryFilter === MasteryFilter.BOTH && this.recipeFilterScope === "level") return this.recipes.filter(r => r.owned && r.recipeType === "normal" && r.lvl === this.recipeFilterType && r.type !== "Trinkets");
        if (this.masteryFilter === MasteryFilter.UNMASTERED && this.recipeFilterScope === "level") return this.recipes.filter(r => r.owned && !r.mastered && r.recipeType === "normal" && r.lvl === this.recipeFilterType && r.type !== "Trinkets");
        if (this.masteryFilter === MasteryFilter.MASTERED && this.recipeFilterScope === "level") return this.recipes.filter(r => r.owned && r.mastered && r.recipeType === "normal" && r.lvl === this.recipeFilterType && r.type !== "Trinkets");
        // filter by recipe types
        if (this.masteryFilter === MasteryFilter.BOTH && this.recipeFilterScope === "itemType") return this.recipes.filter(r => r.owned && r.type === this.recipeFilterType && r.type !== "Trinkets");
        if (this.masteryFilter === MasteryFilter.UNMASTERED && this.recipeFilterScope === "itemType") return this.recipes.filter(r => r.owned && !r.mastered && r.type === this.recipeFilterType && r.type !== "Trinkets");
        if (this.masteryFilter === MasteryFilter.MASTERED && this.recipeFilterScope === "itemType") return this.recipes.filter(r => r.owned && r.mastered && r.type === this.recipeFilterType && r.type !== "Trinkets");
    },
    buyRecipe(recipeID) {
        const recipe = this.idToItem(recipeID);
        if (ResourceManager.materialAvailable("M001") < recipe.goldCost) {
            ToastManager.renderToast("recipe_gold_req");
            return;
        }
        ResourceManager.deductMoney(recipe.goldCost);
        recipe.owned = true;
        ToastManager.renderToast("buy_recipe",recipe.name);
        refreshRecipeMastery(GuildManager.idToGuild(recipe.guildUnlock));
        recipeFilterList();
        refreshRecipeFilters();
        checkCraftableStatus();
    },
    unlockTrinketRecipe(recipeID) {
        const recipe = this.idToItem(recipeID);
        recipeList.recipes.filter(r=>r.name===recipe.name).forEach(r => {
            r.owned = false;
        })
        recipe.owned = true;
        recipeFilterList();
        refreshRecipeFilters();
        checkCraftableStatus();
    },
    idToItem(id) {
        return this.recipes.find(recipe => recipe.id === id);
    },
    ownAtLeastOne(type) {
        return this.recipes.some(r=>r.type === type && r.owned);
    },
    masteryCount() {
        return this.recipes.filter(r=>r.isMastered() && r.recipeType==="normal").length;
    },
    recipeCount() {
        return this.recipes.filter(r=>r.recipeType==="normal" && r.type !== "Trinkets").length;
    },
    filterByType(type) {
        return this.recipes.filter(r =>r.type === type);
    },
    canCraft() {
        const canProduce = WorkerManager.freeWorkers();
        this.recipes.forEach(recipe => {
            recipe.setCanCraft(canProduce);
        });
        recipeCanCraft();
    },
    attemptMastery(recipeID) {
        this.idToItem(recipeID).attemptMastery();
    },
    needMastery() {
        return this.recipes.filter(r=>r.owned && !r.mastered);
    },
    availablePurchase() {
        const maxTier = DungeonManager.bossCount()+1;
        return this.recipes.filter(r=>!r.owned && r.lvl <= maxTier && r.canBuy);
    },
    ownedByLvl(lvl) {
        return this.recipes.filter(r=>r.owned && r.canBuy && r.lvl === lvl).length;
    }

}

const $recipeActionButton = $(".recipeActionButton");

function refreshRecipeFilters() {
    //hide recipe buttons if we don't know know a recipe and also can't learn one...
    $recipeFilter.empty();
    // type recipe filters
    if (recipeList.recipeFilterScope === "itemType") {
        ItemType.forEach(itemtype => {
            if (itemtype !== "Trinkets" && recipeList.ownAtLeastOne(itemtype)) {
                const recipeSelect = $("<div/>").addClass("recipeSelect").attr({"id":`rf${itemtype}`}).data("itemType",itemtype).appendTo($recipeFilter);
                if (itemtype === recipeList.recipeFilterType) recipeSelect.addClass("selectedRecipeFilter");
                $("<div/>").addClass("recipeSelectIcon").html(`<img src="assets/images/recipeFilter/${itemtype}32.png" />`).appendTo(recipeSelect);
                $("<div/>").addClass("recipeSelectName").html(itemtype).appendTo(recipeSelect);
            }
        })
    }
    // level recipe filters
    if (recipeList.recipeFilterScope === "level") {
        const lvls = [];
        recipeList.recipes.filter(r=>r.type !== "Trinkets").forEach(recipe => {
            if (!lvls.includes(recipe.lvl) && recipe.owned) lvls.push(recipe.lvl);
        })
        for (let i = 1; i <= lvls.length; i++) {
            const recipeSelect = $("<div/>").addClass("recipeSelect").data("level",i).appendTo($recipeFilter);
                if (i === recipeList.recipeFilterType) recipeSelect.addClass("selectedRecipeFilter");
                $("<div/>").addClass("recipeSelectIcon").html(`<i class="fas fa-sort-numeric-up-alt"></i>`).appendTo(recipeSelect);
                $("<div/>").addClass("recipeSelectName").html("Level "+ i).appendTo(recipeSelect);
        }
    }
}

const $recipeContents = $("#recipeContents");
const $recipeFilter = $("#recipeFilter");
const $recipeFilterScope = $("#recipeFilterScope");

const sortOrder = {
    defaultAsc : [],
    recipeDivDict : {},
    recipeDivs : null,
}

function initializeRecipes() { //this is run once at the beginning to load ALL the recipes
    $("#recipeFilterScope").empty();
    $("<div/>").addClass("recipeScopeName selectedRecipeScope").attr("id","rs-itemType").html("Type").data("recipeScope","itemType").appendTo($recipeFilterScope);
    $("<div/>").addClass("recipeScopeName").attr("id","rs-Level").html("Level").data("recipeScope","level").appendTo($recipeFilterScope);
    recipeList.recipes.filter(r=>r.recipeType === "normal" && r.type !== "Trinkets").forEach(recipe => {
        const recipeCardInfo = $('<div/>').addClass('recipeCardInfo').append(recipeCardFront(recipe));
        const recipeCardContainer = $('<div/>').addClass('recipeCardContainer').data("recipeID",recipe.id).attr("id","rr"+recipe.id).append(recipeCardInfo).hide();
        $recipeContents.prepend(recipeCardContainer);
        sortOrder.recipeDivDict[recipe.id] = recipeCardContainer;
    });
    const tempList = recipeList.recipes.filter(r=>r.recipeType === "normal");
    sortOrder.defaultAsc = tempList.sort((a, b) => b.id.localeCompare(a.id)).map(r => r.id);
    sortOrder.recipeDivs = $(".recipeCardContainer");
}

function recipeFilterList() {
    //uses two recipeLists to cycle through all the items and display as appropriate
    Object.values(sortOrder.recipeDivDict).forEach(div => div.hide());
    recipeList.filteredRecipeList().map(r=>r.id).forEach(recipe => {
        sortOrder.recipeDivDict[recipe].show();
    })
};

function recipeCardFront(recipe,isTrinket) {
    const td1 = $('<div/>').addClass('recipeName').append(recipe.itemPicName());
    const td2 = $('<div/>').addClass('recipeDescription tooltip').attr({"data-tooltip": "recipe_desc", "data-tooltip-value": recipe.id}).html("<i class='fas fa-info-circle'></i>");
    const td3 = $('<div/>').addClass('itemLevel').html(recipe.itemLevel());
    if (recipe.recipeType !== "normal") td3.hide();
    const td4 = $('<div/>').addClass('recipecostdiv').attr("id","rcd"+recipe.id);
        if (recipe.isMastered()) td4.addClass("isMastered");
        const td4a = $('<div/>').addClass('reciperesdiv').html(recipe.visualizeResAndMat());
        if (recipe.isMastered()) td4a.addClass('isMastered');
    td4.append(td4a);

    const recipeStats = $('<div/>').addClass('recipeStatsContainer');
        const gearStat = $('<div/>').addClass('recipeStats').html(recipe.recipeListStats(isTrinket));
        const goldStat = $("<div/>").addClass(`recipeStat tooltip`).attr({"data-tooltip": "recipe_gold", "data-tooltip-value": recipe.id}).html(miscIcons.gold);
            $("<div/>").addClass('statValue').html(recipe.itemValueFormatted()).appendTo(goldStat);
        const timeStat = $('<div/>').addClass('recipeStat recipeTime tooltip').attr("data-tooltip", "crafting_time").html(`<i class="fas fa-clock"></i>`);
            $('<div/>').addClass('statValue').attr("id",`rt${recipe.id}`).html(msToTime(recipe.reducedCraft())).appendTo(timeStat);
        const invStat = $('<div/>').addClass('recipeStat tooltip').attr("data-tooltip", "in_inventory").html(`<i class="fas fa-cube"></i>`);
            $('<div/>').addClass('statValue').attr("id","ra"+recipe.id).html(`${Inventory.itemCountAll(recipe.id)}`).appendTo(invStat);
        if (recipe.recipeType !== "normal") recipeStats.append(timeStat);
        else recipeStats.append(gearStat,goldStat,timeStat);

    const td6 = $('<div/>').addClass('recipeCountAndCraft');
        const td6a = $('<div/>').addClass('recipeMasteredStatus').attr("id","rms"+recipe.id).html(displayText('recipes_card_mastery_recipe_unmastered'));
        if (recipe.isMastered()) td6a.addClass('isMastered').html(`<i class="fas fa-star-christmas"></i> ${displayText('recipes_card_mastery_recipe_mastered')}`);
        if (recipe.recipeType !== "normal" || recipe.type === "Trinkets") td6a.hide();
        const td6b = $('<div/>').addClass(`recipeCraft rr${recipe.id}`).attr("id",recipe.id).html(`<i class="fas fa-hammer"></i><span>Craft</span>`);
        recipe.recipeDiv = td6b;
    td6.append(td6a,td6b);
    const e = $('<div/>').addClass('recipeCardFront').append(td1,td2,td3,td4,recipeStats,td6);
    if (isTrinket) {
        e.addClass("recipeCardTrinket");
        const rarityStat = $('<div/>').addClass('recipeStat rarityStat RT3 tooltip').attr("data-tooltip", "recipe_rarity").html(miscIcons.rarity).appendTo(recipeStats);
            $('<div/>').addClass('statValue').html("Epic").appendTo(rarityStat);
    };
    return e;
}

function refreshCraftTimes() {
    recipeList.recipes.forEach(recipe => {
        $(`#rt${recipe.id}`).html(msToTime(recipe.reducedCraft()));
    });
}

function refreshCraftedCount(recipe) {
    //TODO: only run if on recipe tab?
    if (!recipe.rbd) recipe.rbd = $("#rbd"+recipe.id);
    if (!recipe.rms) recipe.rms = $("#rms"+recipe.id);
    if (!recipe.rcd) recipe.rcd = $("#rcd"+recipe.id);
    const material = (recipe.mcost) ? Object.keys(recipe.mcost)[0] : "M201";
    const masteryCost = recipe.masteryCost();
    $('<div/>').addClass("actionButtonCardText").html(displayText('recipes_card_mastery_master_button')).appendTo(recipe.rcc);
    $('<div/>').addClass("actionButtonCardValue tooltip").attr({"data-tooltip":"material_desc","data-tooltip-value": masteryCost.id}).html(`${ResourceManager.idToMaterial(masteryCost.id).img} ${masteryCost.amt}`).appendTo(recipe.rcc);
    if (recipe.isMastered()) {
        recipe.rbd.addClass("isMastered").html(displayText('recipes_card_mastery_attained_notice'));
        recipe.rms.addClass("isMastered").html(`<i class="fas fa-star-christmas"></i> ${displayText('recipes_card_mastery_recipe_mastered')}`);
        recipe.rcd.find(".matCost").attr({"data-tooltip":"material_desc_mastered","data-tooltip-value":material.id}).addClass("isMastered");
    }
    if (lastTab === "Merchant" && Merchant.tabView === "Mastery") refreshRecipeMasteryAmt(recipe);
}
 
function recipeCanCraft() {
    //loops through recipes, adds class if disabled
    recipeList.recipes.forEach(recipe => {
        if (recipe.recipeDiv === undefined) return;
        if (recipe.canProduce && actionSlotManager.slots.length < actionSlotManager.maxSlots) recipe.recipeDiv.removeClass("recipeCraftDisable");
        else recipe.recipeDiv.addClass("recipeCraftDisable");
    });
}

const $blueprintUnlock = $("#BlueprintUnlock");
let cacheBlueprintType = null;

$(document).on('click', '.recipeCraft', (e) => {
    //click on a recipe to slot it
    e.preventDefault();
    const itemID = $(e.currentTarget).attr("id");
    actionSlotManager.addSlot(itemID);
});

const $recipeSortInput = $("#recipeSortInput");

function invokeSearch(string) {
    recipeList.recipeFilterString = string;
    recipeList.recipeFilterType = "default";
    $(".recipeSelect").removeClass("selectedRecipeFilter");
    recipeFilterList();
}

//clicking button runs search
$(document).on('click','.recipeSortButton', (e) => {
    e.preventDefault();
    const searchString = $recipeSortInput.val();
    if (searchString.length < 2) return ToastManager.renderToast("search_length_invalid");
    invokeSearch(searchString);
});

//enter key searches if you're in sort input
$(document).on('keydown','.recipeSortInput', (e) => {
    if (e.keyCode !== 13) return;
    e.preventDefault();
    const searchString = $recipeSortInput.val();
    if (searchString.length < 2) return ToastManager.renderToast("search_length_invalid");
    invokeSearch(searchString);
});

// Prevent hotkey input when search bar focused
$(document).on('focus','.recipeSortInput', (e) => {
    settings.dialogStatus = 1;
    saveSettings();
});

$(document).on('blur','.recipeSortInput', (e) => {
    settings.dialogStatus = 0;
    saveSettings();
});

//click on a category to filter by it
$(document).on('click','.recipeSelect', (e) => {
    e.preventDefault();
    if (recipeList.recipeFilterType === $(e.currentTarget).data("itemType") || recipeList.recipeFilterType === $(e.currentTarget).data("level")) return;
    recipeList.recipeFilterType = $(e.currentTarget).data(recipeList.recipeFilterScope);
    $(".recipeSelect").removeClass("selectedRecipeFilter");
    $(e.currentTarget).addClass("selectedRecipeFilter");
    recipeFilterList();
});

// Click on a recipe scope, generate filters list and auto-select default filter
$(document).on('click', '.recipeScopeName', (e) => {
    e.preventDefault();
    if (recipeList.recipeFilterScope === $(e.currentTarget).data("recipeScope")) return;
    recipeList.recipeFilterScope = $(e.currentTarget).data("recipeScope");
    if (recipeList.recipeFilterScope === "level") recipeList.recipeFilterType = 1;
    else if (recipeList.recipeFilterScope === "itemType") recipeList.recipeFilterType = "Knives";
    $(".recipeScopeName").removeClass("selectedRecipeScope");
    $(e.currentTarget).addClass("selectedRecipeScope");
    refreshRecipeFilters();
    recipeFilterList();
});

//change mastery sorting
$(document).on('click',".recipeMasterySort", (e) => {
    e.preventDefault();
    const currentType = $(e.currentTarget).html();
    if (currentType === "All Recipes") {
        $(e.currentTarget).html("Unmastered Only");
        recipeList.masteryFilter = MasteryFilter.UNMASTERED;
    }
    if (currentType === "Unmastered Only") {
        $(e.currentTarget).html("Mastered Only");
        recipeList.masteryFilter = MasteryFilter.MASTERED;
    }
    if (currentType === "Mastered Only") {
        $(e.currentTarget).html("All Recipes");
        recipeList.masteryFilter = MasteryFilter.BOTH;
    }
    recipeFilterList();
});