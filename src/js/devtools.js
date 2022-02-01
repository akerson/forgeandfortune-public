const devtools = {
    godmode() {
        recipeList.idToItem("R13001").craftCount = 1;
        achievementStats.totalGoldEarned = 1;
        this.materials();
        this.addGold(10000000000000);
        this.allPerks();
        this.forceTown(); //second one builds?
        this.forceTown();
        this.dungeonUnlock();
    },
    designmode() {
        this.tutorialSkip();
        this.materials();
        this.forceTown();
        this.addGold(100000000);
        // Unlock all recipes and mastered some
        recipeList.recipes.forEach(recipe => recipe.owned = true);
        recipeList.recipes.map((recipe, i) => {
            if (i < 50) recipe.mastered = true
        });
        recipeList.recipes.forEach(r=>refreshCraftedCount(r));
        // Buy 13 perks from each perk line
        const perkCatergories = ['Crafting','Dungeon','Town'];
        perkCatergories.forEach(pCat => {
            Shop.perks.filter(perk => perk.category === pCat).forEach((perk, i) => {
                if (i < 13) Shop.buyPerk(perk.id);
            });
        });
        // Add some different state items to inventory
        for (let i = 0; i < 3; i++) {
            devtools.addItem();
            devtools.addItem("R11001", 1);
            devtools.addItem("R11001", 2);
            devtools.addItem("R11001", 3);
        }
        devtools.addItem("R5505", 3, 10);
        Inventory.sortInventory();
    },
    tutorialSkip() {
        recipeList.idToItem("R13001").craftCount = 1;
        achievementStats.totalGoldEarned = 1;
        devtools.addGold(100000);
        Shop.buyPerk("AL1000");
        Shop.buyPerk("AL2000");

        Shop.buyPerk("AL2001");
        ResourceManager.addMaterial("M001",-ResourceManager.idToMaterial("M001").amt);
    },
    materials() {
        ResourceManager.materials.forEach(material => {
            ResourceManager.addMaterial(material.id,10000);
        })
    },
    addGold(amt) {
        ResourceManager.addMaterial("M001",amt);
    },
    speed(amt) {
        player.timeWarp = amt;
    },
    addItem(itemID="R13001",rarity=0,sharp=0) {
        const container = new itemContainer(itemID,rarity);
        container.sharp = sharp;
        Inventory.addToInventory(container,false);
    },
    gearHeroes(lvl=1,rarity=0,sharp=0) {
        const recipes = recipeList.recipes.filter(r => r.lvl === lvl);
        HeroManager.heroes.forEach(hero => {
            const slots = hero.gearSlots.map(g=>g.type);
            slots.forEach(slotType => {
                if (slotType === "Trinkets") return;
                const item = recipes.find(r => r.type === slotType);
                const container = new itemContainer(item.id,rarity);
                container.sharp = sharp;
                hero.equip(container);
            })
        })
    },
    forceTown() {
        this.tutorialSkip();
        TownManager.buildings.forEach(building => {
            recipeList.idToItem(building.recipeID).owned = true;
            if (building.getStatus() === BuildingState.seen) building.setStatus(BuildingState.built);
            else if (building.getStatus() !== BuildingState.built) building.setStatus(BuildingState.seen);
        })
        refreshSideTown();
    },
    dungeonUnlock() {
        this.tutorialSkip();
        DungeonManager.dungeons.forEach(dungeon => {
            if (dungeon.type === "boss") dungeon.maxFloor = 1;
        });
        Shop.idToPerk("AL2001").purchase();
        Shop.idToPerk("AL2002").purchase();
        Shop.idToPerk("AL2004").purchase();
    },
    heroUnlock() {
        this.tutorialSkip();
        HeroManager.heroes.forEach(h => {
            h.owned = true
            h.playbooks.forEach(playbookID => {
                PlaybookManager.idToPlaybook(playbookID).unlocked = true;
            });
        });
        initializeHeroList();
    },
    allPerks() {
        this.tutorialSkip();
        this.addGold(1000000000000000);
        Shop.perks.forEach(p=>Shop.buyPerk(p.id));
    },
    timeWarp() {
        player.lastTime -= 600000;
    },
    clearBossBeats() {
        DungeonManager.dungeons.forEach(dungeon=>dungeon.maxFloor = 0);
        this.unlockBosses = true;
    },
    craftTest(id,trials) {
        const results = {
            common : 0,
            good : 0,
            great : 0,
            epic : 0,
        }
        const item = recipeList.idToItem(id);
        for (let i=0;i<trials;i++) {
            let roll = Math.floor(Math.random() * 10000);
            const procRate = Inventory.craftChance(item);
            if (roll < procRate.epic) results.epic += 1;
            else if (roll < (procRate.epic+procRate.great)) results.great += 1;
            else if (roll < (procRate.epic+procRate.great+procRate.good)) results.good += 1;
            else results.common += 1;
        }
        console.log(`Commons: ${results.common} (${(results.common/trials).toFixed(3)*100})%`)  
        console.log(`Goods: ${results.good} (${(results.good/trials).toFixed(3)*100})%`)  
        console.log(`Greats: ${results.great} (${(results.great/trials).toFixed(3)*100})%`)  
        console.log(`Epic: ${results.epic} (${(results.epic/trials).toFixed(3)*100})%`)  
    },
}