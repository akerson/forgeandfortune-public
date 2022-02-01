"use strict";

const $bankInvSlots = $("#bankInvSlots");
const $bankBankSlots = $("#bankBankSlots");
const $bankBuilding = $("#bankBuilding");
const $bankNavigation = $("#bankNavigation");

const BankManager = {
    slots : [],
    lvl : 1,
    tab : "inv",
    createSave() {
        const save = {};
        save.lvl = this.lvl;
        save.slots = [];
        this.slots.forEach(slot => {
            save.slots.push(slot.createSave());
        });
        return save;
    },
    loadSave(save) {
        save.slots.forEach(item => {
            const container = new itemContainer(item.id,item.rarity);
            container.loadSave(item);
            this.slots.push(container);
        });
        if (save.lvl !== undefined) this.lvl = save.lvl;
    },
    maxSlots() {
        return this.lvl*5+10;
    },
    full() {
        return this.slots.length === this.maxSlots();
    },
    containerToItem(containerID) {
        return this.slots.find(s=>s.containerID === containerID)
    },
    addFromInventory(containerID) {
        if (this.full()) return;
        const container = Inventory.containerToItem(containerID);
        Inventory.removeContainerFromInventory(containerID);
        this.addContainer(container);
        refreshBankCounts();
    },
    removeContainer(containerID) {
        this.slots = this.slots.filter(c=>c.containerID !== containerID);
        refreshBankBank();
    },
    sortBank() {
        this.slots.sort((a,b) => inventorySort(a,b));
        refreshBankBank();
    },
    addContainer(container) {
        this.slots.push(container);
    },
    removeFromBank(containerID) {
        if (Inventory.full()) return;
        const container = this.containerToItem(containerID);
        this.removeContainer(containerID);
        Inventory.addToInventory(container,false);
        refreshBankCounts();
    },
    addLevel() {
        this.lvl += 1;
        refreshBankBank();
        refreshBankInventory();
    }
}

function initiateBankBldg() {
    $bankBuilding.show();
    $bankNavigation.empty();
    const invTab = $("<div/>").addClass("bankTabNavigation").attr({id: "bankNavInventory"}).html(displayText("bank_nav_inventory")).appendTo($bankNavigation);
    const bankTab = $("<div/>").addClass("bankTabNavigation").attr({id: "bankNavStorage"}).html(displayText("bank_nav_storage")).appendTo($bankNavigation);
        $("<div/>").addClass("bankTabCount").attr({"id":"bankNavInvCount"}).html(`(${Inventory.nonblank().length}/${Inventory.invMax})`).appendTo(invTab);
        $("<div/>").addClass("bankTabCount").attr({"id":"bankNavStorageCount"}).html(`(${BankManager.slots.length}/${BankManager.maxSlots()})`).appendTo(bankTab);
    $("#bankNavStorage").removeClass("selected");
    $("#bankNavInventory").addClass("selected");
    BankManager.tab = "inv";
    refreshBankInventory();
}

function refreshBankCounts() {
    $("#bankNavInvCount").html(`(${Inventory.nonblank().length}/${Inventory.invMax})`);
    $("#bankNavStorageCount").html(`(${BankManager.slots.length}/${BankManager.maxSlots()})`);
}

function refreshBankInventory() {
    if (BankManager.tab !== "inv") return;
    $bankBankSlots.hide();
    $bankInvSlots.empty().show();
    // Bank Inventory Header
    const bankInventoryHeaderContainer = $("<div/>").addClass(`bankInventoryHeaderContainer`).appendTo($bankInvSlots);
    const bankInventoryHeader = $("<div/>").addClass(`bankInventoryHeader`).appendTo(bankInventoryHeaderContainer);
    const bankInventoryHeadingDetails = $("<div/>").addClass("headingDetails").appendTo(bankInventoryHeader);
        $("<div/>").addClass("headingTitle").html(displayText("header_bank_inventory_title")).appendTo(bankInventoryHeadingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("header_bank_inventory_desc")).appendTo(bankInventoryHeadingDetails);
    const sortInventoryBtn = $("<div/>").addClass("actionButtonAnimDisabled actionButton tooltip").attr({id: "sortInventoryBank", "data-tooltip": "sort_inventory"}).html('<i class="fas fa-sort-size-up-alt"></i>').appendTo(bankInventoryHeaderContainer);
        $("<span/>").addClass("actionButtonTextRight").html(displayText("bank_sort_inventory_button")).appendTo(sortInventoryBtn);
    // Bank Inventory Cards
    const bankInventoryCardsContainer = $("<div/>").addClass(`bankInventoryCardsContainer`).attr({id: "bankInventoryCardsContainer"}).appendTo($bankInvSlots);
    if (Inventory.nonblank().length === 0) $("<div/>").addClass(`emptyContentMessage`).html(displayText("bank_inventory_empty")).appendTo($bankInvSlots);
    Inventory.nonblank().forEach(item => {
        bankInventoryCardsContainer.append(itemCard(item,false));
    });
    refreshBankCounts();
}

function refreshBankBank() {
    if (BankManager.tab !== "bank") return;
    $bankInvSlots.hide();
    $bankBankSlots.empty().show();
    // Bank Storage Header
    const bankStorageHeaderContainer = $("<div/>").addClass(`bankStorageHeaderContainer`).appendTo($bankBankSlots);
    const bankStorageHeader = $("<div/>").addClass(`bankStorageHeader`).appendTo(bankStorageHeaderContainer);
    const bankStorageHeadingDetails = $("<div/>").addClass("headingDetails").appendTo(bankStorageHeader);
        $("<div/>").addClass("headingTitle").html(displayText("header_bank_storage_title")).appendTo(bankStorageHeadingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("header_bank_storage_desc")).appendTo(bankStorageHeadingDetails);
    const sortBankBtn = $("<div/>").addClass("actionButtonAnimDisabled actionButton tooltip").attr({id: "sortBank", "data-tooltip": "sort_bank"}).html('<i class="fas fa-sort-size-up-alt"></i>').appendTo(bankStorageHeaderContainer);
        $("<span/>").addClass("actionButtonTextRight").html(displayText("bank_sort_bank_button")).appendTo(sortBankBtn);
    // Bank Storage Cards
    const bankStorageCardsContainer = $("<div/>").addClass(`bankStorageCardsContainer`).attr({id: "bankStorageCardsContainer"}).appendTo($bankBankSlots);
    if (BankManager.slots.length === 0) $("<div/>").addClass(`emptyContentMessage`).html(displayText("bank_storage_empty")).appendTo($bankBankSlots);
    BankManager.slots.forEach(item => {
        bankStorageCardsContainer.append(itemCard(item,true));
    });
    refreshBankCounts();
}

function itemCard(item,inBank) {
    const itemdiv = $("<div/>").addClass("bankItem").addClass("R"+item.rarity).addClass("ctrlClickItem").data("rid",item.id);
    const itemName = $("<div/>").addClass("itemName").html(item.picName());
    const itemLevel = $("<div/>").addClass("itemLevel").html(item.itemLevel());
    const itemRarity = $("<div/>").addClass("itemRarity").addClass(`RT${item.rarity} tooltip`).attr({"data-tooltip": `rarity_${rarities[item.rarity].toLowerCase()}`}).html(miscIcons.rarity);
    if (item.item.recipeType === "building") itemLevel.hide();
    const equipStats = $("<div/>").addClass("equipStats");
    for (const [stat, val] of Object.entries(item.itemStat(false))) {
        if (val === 0) continue;
        const ed = $("<div/>").addClass('gearStat tooltip').attr({"data-tooltip": stat}).appendTo(equipStats);
            $("<div/>").addClass(`${stat}_img`).html(miscIcons[stat]).appendTo(ed);
            $("<div/>").addClass(`${stat}_integer statValue`).html(val).appendTo(ed);
    }
    const bankActionButtons = $("<div/>").addClass("bankActionsButtons");
        const locationButton = $("<div/>").attr("containerID",item.containerID).appendTo(bankActionButtons);
        if (inBank) locationButton.addClass('actionButtonCard bankTake').html(displayText("bank_remove_item_button"));
        else locationButton.addClass('actionButtonCard bankStow').html(displayText("bank_stow_item_button"));
    return itemdiv.append(itemName,itemLevel,itemRarity,equipStats,bankActionButtons);
}

function refreshBankPage() {
    if (BankManager.tab === "inv") refreshBankInventory();
    if (BankManager.tab === "bank") refreshBankBank();
}

$(document).on("click",".bankTake",(e) => {
    e.preventDefault();
    const containerID = parseInt($(e.target).attr("containerID"));
    BankManager.removeFromBank(containerID);
});

$(document).on("click",".bankStow",(e) => {
    e.preventDefault();
    const containerID = parseInt($(e.target).attr("containerID"));
    BankManager.addFromInventory(containerID);
});

$(document).on("click","#sortBank",(e) => {
    e.preventDefault();
    BankManager.sortBank();
});

$(document).on("click","#sortInventoryBank",(e) => {
    e.preventDefault();
    Inventory.sortInventory();
});

$(document).on("click","#bankNavInventory",(e) => {
    //click inventory
    BankManager.tab = "inv";
    e.preventDefault();
    $("#bankNavStorage").removeClass("selected");
    $("#bankNavInventory").addClass("selected");
    refreshBankInventory();
});

$(document).on("click","#bankNavStorage",(e) => {
    //click bank
    e.preventDefault();
    showBankStorage();
});

function showBankStorage() {
    BankManager.tab = "bank";
    $("#bankNavInventory").removeClass("selected");
    $("#bankNavStorage").addClass("selected");
    refreshBankBank();
}