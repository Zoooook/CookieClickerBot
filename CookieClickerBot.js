// keep 2 overlapping click counts
// take into account all achievements, upgrade unlocks
// ascension -- maybe need to take into account longterm expected production, ignore buffs
// save scum sugar lump harvesting

// math for auras and grandmas
// minigames, level objects

document.getElementById("game").style.top=0

function upgradeSpecial(name) {
    if (name == 'santa') Game.UpgradeSanta();
    else if (name == 'dragon') Game.UpgradeDragon();
}

function willHave(upgrade, testUpgrade) {
    return Game.Has(upgrade) || testUpgrade == upgrade;
}

function amount(building, testBuy, testBuyCount) {
    return building.amount + (testBuy == building.name) * testBuyCount;
}

function calculateTieredCpsMult(me, testBuy, testBuyCount, testUpgrade) {
    let mult = 1;
    for (let i in me.tieredUpgrades) {
        if (!Game.Tiers[me.tieredUpgrades[i].tier].special && willHave(me.tieredUpgrades[i].name, testUpgrade)) mult *= 2;
    }
    for (let i in me.synergies) {
        const syn = me.synergies[i];
        if (willHave(syn.name, testUpgrade)){
            if      (syn.buildingTie1.name == me.name) mult *= (1 + 0.05  * amount(syn.buildingTie2, testBuy, testBuyCount));
            else if (syn.buildingTie2.name == me.name) mult *= (1 + 0.001 * amount(syn.buildingTie1, testBuy, testBuyCount));
        }
    }
    if (me.fortune && willHave(me.fortune.name, testUpgrade)) mult *= 1.07;
    if (me.grandma && willHave(me.grandma.name, testUpgrade)) mult *= (1 + amount(Game.Objects['Grandma'], testBuy, testBuyCount) * 0.01 * (1/(me.id-1)));
    return mult;
}

function calculateCursorCps(testBuy, testBuyCount, testUpgrade) {
    let add = 0;
    if (willHave(   'Thousand fingers', testUpgrade)) add += 0.1;
    if (willHave(    'Million fingers', testUpgrade)) add += 0.5;
    if (willHave(    'Billion fingers', testUpgrade)) add += 5;
    if (willHave(   'Trillion fingers', testUpgrade)) add += 50;
    if (willHave('Quadrillion fingers', testUpgrade)) add += 500;
    if (willHave('Quintillion fingers', testUpgrade)) add += 5000;
    if (willHave( 'Sextillion fingers', testUpgrade)) add += 50000;
    if (willHave( 'Septillion fingers', testUpgrade)) add += 500000;
    if (willHave(  'Octillion fingers', testUpgrade)) add += 5000000;

    let num = 0;
    for (let i in Game.Objects) {
        if (Game.Objects[i].name != 'Cursor') num += amount(Game.Objects[i], testBuy, testBuyCount);
    }
    add = add * num;

    let mult = 1;
    mult *= calculateTieredCpsMult(Game.Objects['Cursor'], testBuy, testBuyCount, testUpgrade);
    mult *= Game.eff('cursorCps');
    return Game.ComputeCps(
        0.1,
        willHave('Reinforced index finger', testUpgrade) + willHave('Carpal tunnel prevention cream', testUpgrade) + willHave('Ambidextrous', testUpgrade),
        add
    ) * mult;
}

function calculateGrandmaCps(testBuy, testBuyCount, testUpgrade) {
    let mult = 1;
    for (let i in Game.GrandmaSynergies) {
        if (willHave(Game.GrandmaSynergies[i], testUpgrade)) mult *= 2;
    }
    if (willHave('Bingo center/Research facility', testUpgrade)) mult *= 4;
    if (willHave('Ritual rolling pins',            testUpgrade)) mult *= 2;
    if (willHave('Naughty list',                   testUpgrade)) mult *= 2;
    if (willHave('Elderwort biscuits',             testUpgrade)) mult *= 1.02;

    mult *= Game.eff('grandmaCps');
    mult *= calculateTieredCpsMult(Game.Objects['Grandma'], testBuy, testBuyCount, testUpgrade);

    let add = 0;
    if (willHave('One mind',            testUpgrade)) add += amount(Game.Objects['Grandma'], testBuy, testBuyCount) * 0.02;
    if (willHave('Communal brainsweep', testUpgrade)) add += amount(Game.Objects['Grandma'], testBuy, testBuyCount) * 0.02;
    if (willHave('Elder Pact',          testUpgrade)) add += amount(Game.Objects['Portal'],  testBuy, testBuyCount) * 0.05;

    let num = 0;
    for (let i in Game.Objects) {
        if (Game.Objects[i].name!='Grandma') num += amount(Game.Objects[i], testBuy, testBuyCount);
    }

    mult *= 1 + Game.auraMult('Elder Battalion') * 0.01 * num;

    return (Game.Objects['Grandma'].baseCps + add) * mult;
}

function calculateBuildingCps(buildingName, testBuy, testBuyCount, testUpgrade) {
    if (buildingName == 'Cursor')  return calculateCursorCps( testBuy, testBuyCount, testUpgrade);
    if (buildingName == 'Grandma') return calculateGrandmaCps(testBuy, testBuyCount, testUpgrade);

    let mult = 1;
    mult *= calculateTieredCpsMult(Game.Objects[buildingName], testBuy, testBuyCount, testUpgrade);
    return Game.Objects[buildingName].baseCps * mult;
}

function calculateHeavenlyMultiplier(testUpgrade) {
    let heavenlyMult = 0;
    if (willHave('Heavenly chip secret',   testUpgrade)) heavenlyMult += 0.05;
    if (willHave('Heavenly cookie stand',  testUpgrade)) heavenlyMult += 0.20;
    if (willHave('Heavenly bakery',        testUpgrade)) heavenlyMult += 0.25;
    if (willHave('Heavenly confectionery', testUpgrade)) heavenlyMult += 0.25;
    if (willHave('Heavenly key',           testUpgrade)) heavenlyMult += 0.25;
    heavenlyMult *= 1 + Game.auraMult('Dragon God') * 0.05;
    if (willHave('Lucky digit',  testUpgrade)) heavenlyMult *= 1.01;
    if (willHave('Lucky number', testUpgrade)) heavenlyMult *= 1.01;
    if (willHave('Lucky payout', testUpgrade)) heavenlyMult *= 1.01;
    if (Game.hasGod) {
        const    godLvl = Game.hasGod('creation');
        if      (godLvl == 1) heavenlyMult *= 0.7;
        else if (godLvl == 2) heavenlyMult *= 0.8;
        else if (godLvl == 3) heavenlyMult *= 0.9;
    }
    return heavenlyMult;
}

function auraMultRadiantAppetite(testAura) {
    if ([
        Game.dragonAuras[Game.dragonAura].name,
        Game.dragonAuras[Game.dragonAura2].name,
        testAura
    ].includes('Radiant Appetite')) return 1;
    return 0;
}

function calculateClickCookies(cookiesPs, testBuy, testBuyCount, testUpgrade) {
    if (Game.hasBuff('Cursed finger')) return Game.buffs['Cursed finger'].power;

    let add = 0;
    if (willHave(   'Thousand fingers', testUpgrade)) add += 0.1;
    if (willHave(    'Million fingers', testUpgrade)) add += 0.5;
    if (willHave(    'Billion fingers', testUpgrade)) add += 5;
    if (willHave(   'Trillion fingers', testUpgrade)) add += 50;
    if (willHave('Quadrillion fingers', testUpgrade)) add += 500;
    if (willHave('Quintillion fingers', testUpgrade)) add += 5000;
    if (willHave( 'Sextillion fingers', testUpgrade)) add += 50000;
    if (willHave( 'Septillion fingers', testUpgrade)) add += 500000;
    if (willHave(  'Octillion fingers', testUpgrade)) add += 5000000;
    let num = 0;
    for (let i in Game.Objects) {
        num += amount(Game.Objects[i], testBuy, testBuyCount);
    }
    num -= amount(Game.Objects['Cursor'], testBuy, testBuyCount);
    add = add * num;

    if (willHave(      'Plastic mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(         'Iron mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(     'Titanium mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(   'Adamantium mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(  'Unobtainium mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(      'Eludium mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(    'Wishalloy mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(   'Fantasteel mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(   'Nevercrack mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(    'Armythril mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave('Technobsidian mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(   'Plasmarble mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave('Fortune #104',        testUpgrade)) add += cookiesPs*0.01;

    let mult = 1;
    if (willHave('Santa\'s helpers', testUpgrade)) mult *= 1.1;
    if (willHave('Cookie egg',       testUpgrade)) mult *= 1.1;
    if (willHave('Halo gloves',      testUpgrade)) mult *= 1.1;
    mult *= Game.eff('click');

    if (Game.hasGod) {
        const    godLvl = Game.hasGod('labor');
        if      (godLvl == 1) mult *= 1.15;
        else if (godLvl == 2) mult *= 1.1;
        else if (godLvl == 3) mult *= 1.05;
    }

    for (let i in Game.buffs) {
        if (typeof Game.buffs[i].multClick != 'undefined') mult *= Game.buffs[i].multClick;
    }

    mult *= 1 + Game.auraMult('Dragon Cursor') * 0.05;

    return mult * Game.ComputeCps(
        1,
        willHave('Reinforced index finger', testUpgrade) +
        willHave('Carpal tunnel prevention cream', testUpgrade) +
        willHave('Ambidextrous', testUpgrade),
        add
    );
}

function calculateBaseCps(testBuy, testBuyCount, testUpgrade, testAchievement, testSanta, testAura) {
    let cookiesPs = 0;
    let mult = 1;
    //add up effect bonuses from building minigames
    let effs = {};
    for (let i in Game.Objects) {
        if (Game.Objects[i].minigameLoaded && Game.Objects[i].minigame.effs) {
            const myEffs = Game.Objects[i].minigame.effs;
            for (let ii in myEffs){
                if (effs[ii]) effs[ii] *= myEffs[ii];
                else effs[ii] = myEffs[ii];
            }
        }
    }

    if (Game.ascensionMode != 1) mult += parseFloat(Game.prestige) * 0.01 * Game.heavenlyPower * calculateHeavenlyMultiplier(testUpgrade);

    mult *= Game.eff('cps');

    if (willHave('Heralds', testUpgrade) && Game.ascensionMode != 1) mult *= 1 + 0.01 * Game.heralds;

    for (let i in Game.cookieUpgrades) {
        const upgrade = Game.cookieUpgrades[i];
        if (willHave(upgrade.name, testUpgrade)) mult *= (1 + (typeof(upgrade.power) == 'function' ? upgrade.power(upgrade) : upgrade.power) * 0.01);
    }

    if (willHave('Specialized chocolate chips', testUpgrade)) mult *= 1.01;
    if (willHave('Designer cocoa beans',        testUpgrade)) mult *= 1.02;
    if (willHave('Underworld ovens',            testUpgrade)) mult *= 1.03;
    if (willHave('Exotic nuts',                 testUpgrade)) mult *= 1.04;
    if (willHave('Arcane sugar',                testUpgrade)) mult *= 1.05;
    if (willHave('Increased merriness',         testUpgrade)) mult *= 1.15;
    if (willHave('Improved jolliness',          testUpgrade)) mult *= 1.15;
    if (willHave('A lump of coal',              testUpgrade)) mult *= 1.01;
    if (willHave('An itchy sweater',            testUpgrade)) mult *= 1.01;
    if (willHave('Santa\'s dominion',           testUpgrade)) mult *= 1.2;
    if (willHave('Fortune #100',                testUpgrade)) mult *= 1.01;
    if (willHave('Fortune #101',                testUpgrade)) mult *= 1.07;

    let buildMult = 1;
    if (Game.hasGod) {
        let      godLvl = Game.hasGod('asceticism');
        if      (godLvl == 1) mult *= 1.15;
        else if (godLvl == 2) mult *= 1.1;
        else if (godLvl == 3) mult *= 1.05;

        godLvl = Game.hasGod('ages');
        if      (godLvl == 1) mult *= 1 + 0.15 * Math.sin((Date.now() / 1000 / (60*60*3))  * Math.PI*2);
        else if (godLvl == 2) mult *= 1 + 0.15 * Math.sin((Date.now() / 1000 / (60*60*12)) * Math.PI*2);
        else if (godLvl == 3) mult *= 1 + 0.15 * Math.sin((Date.now() / 1000 / (60*60*24)) * Math.PI*2);

        godLvl = Game.hasGod('decadence');
        if      (godLvl == 1) buildMult *= 0.93;
        else if (godLvl == 2) buildMult *= 0.95;
        else if (godLvl == 3) buildMult *= 0.98;

        godLvl = Game.hasGod('industry');
        if      (godLvl == 1) buildMult *= 1.1;
        else if (godLvl == 2) buildMult *= 1.06;
        else if (godLvl == 3) buildMult *= 1.03;

        godLvl = Game.hasGod('labor');
        if      (godLvl == 1) buildMult *= 0.97;
        else if (godLvl == 2) buildMult *= 0.98;
        else if (godLvl == 3) buildMult *= 0.99;
    }

    if (willHave('Santa\'s legacy', testUpgrade)) mult *= 1 + (Game.santaLevel + 1 + testSanta) * 0.03;

    for (let i in Game.Objects) {
        const building = Game.Objects[i];
        let storedCps = calculateBuildingCps(building.name, testBuy, testBuyCount, testUpgrade);
        if (Game.ascensionMode != 1) storedCps *= (1 + building.level * 0.01) * buildMult;
        const storedTotalCps = amount(building, testBuy, testBuyCount) * storedCps;
        cookiesPs += storedTotalCps;
    }

    if (willHave('"egg"', testUpgrade)) cookiesPs += 9;

    const milkProgress = (Game.AchievementsOwned + testAchievement)/25;
    let milkMult = 1;
    if (willHave('Santa\'s milk and cookies', testUpgrade)) milkMult *= 1.05;
    milkMult *= 1 + Game.auraMult('Breath of Milk') * 0.05;
    if (Game.hasGod) {
        const    godLvl = Game.hasGod('mother');
        if      (godLvl == 1) milkMult *= 1.1;
        else if (godLvl == 2) milkMult *= 1.05;
        else if (godLvl == 3) milkMult *= 1.03;
    }
    milkMult *= Game.eff('milk');

    let catMult = 1;

    if (willHave('Kitten helpers',                            testUpgrade)) catMult *= (1 + milkProgress * 0.1   * milkMult);
    if (willHave('Kitten workers',                            testUpgrade)) catMult *= (1 + milkProgress * 0.125 * milkMult);
    if (willHave('Kitten engineers',                          testUpgrade)) catMult *= (1 + milkProgress * 0.15  * milkMult);
    if (willHave('Kitten overseers',                          testUpgrade)) catMult *= (1 + milkProgress * 0.175 * milkMult);
    if (willHave('Kitten managers',                           testUpgrade)) catMult *= (1 + milkProgress * 0.2   * milkMult);
    if (willHave('Kitten accountants',                        testUpgrade)) catMult *= (1 + milkProgress * 0.2   * milkMult);
    if (willHave('Kitten specialists',                        testUpgrade)) catMult *= (1 + milkProgress * 0.2   * milkMult);
    if (willHave('Kitten experts',                            testUpgrade)) catMult *= (1 + milkProgress * 0.2   * milkMult);
    if (willHave('Kitten consultants',                        testUpgrade)) catMult *= (1 + milkProgress * 0.2   * milkMult);
    if (willHave('Kitten assistants to the regional manager', testUpgrade)) catMult *= (1 + milkProgress * 0.175 * milkMult);
    if (willHave('Kitten marketeers',                         testUpgrade)) catMult *= (1 + milkProgress * 0.15  * milkMult);
    if (willHave('Kitten analysts',                           testUpgrade)) catMult *= (1 + milkProgress * 0.125 * milkMult);
    if (willHave('Kitten executives',                         testUpgrade)) catMult *= (1 + milkProgress * 0.115 * milkMult);
    if (willHave('Kitten angels',                             testUpgrade)) catMult *= (1 + milkProgress * 0.1   * milkMult);
    if (willHave('Fortune #103',                              testUpgrade)) catMult *= (1 + milkProgress * 0.05  * milkMult);

    mult *= catMult;

    let eggMult = 1;
    if (willHave(  'Chicken egg', testUpgrade)) eggMult *= 1.01;
    if (willHave(     'Duck egg', testUpgrade)) eggMult *= 1.01;
    if (willHave(   'Turkey egg', testUpgrade)) eggMult *= 1.01;
    if (willHave(    'Quail egg', testUpgrade)) eggMult *= 1.01;
    if (willHave(    'Robin egg', testUpgrade)) eggMult *= 1.01;
    if (willHave(  'Ostrich egg', testUpgrade)) eggMult *= 1.01;
    if (willHave('Cassowary egg', testUpgrade)) eggMult *= 1.01;
    if (willHave(   'Salmon roe', testUpgrade)) eggMult *= 1.01;
    if (willHave(    'Frogspawn', testUpgrade)) eggMult *= 1.01;
    if (willHave(    'Shark egg', testUpgrade)) eggMult *= 1.01;
    if (willHave(   'Turtle egg', testUpgrade)) eggMult *= 1.01;
    if (willHave(    'Ant larva', testUpgrade)) eggMult *= 1.01;
    if (willHave(  'Century egg', testUpgrade)) {
        //the boost increases a little every day, with diminishing returns up to +10% on the 100th day
        const day = Math.min(Math.floor((Date.now() - Game.startDate) / 1000 / 10) * 10 / 60 / 60 / 24, 100);
        eggMult *= 1 + (1 - Math.pow(1 - day/100, 3)) * 0.1;
    }

    mult *= eggMult;

    if (willHave('Sugar baking', testUpgrade)) mult *= (1 + Math.min(100, Game.lumps) * 0.01);

    mult *= 1 + auraMultRadiantAppetite(testAura);

    let auraMult = Game.auraMult('Dragon\'s Fortune');
    for (let i=0; i<Game.shimmerTypes['golden'].n; ++i) {
        mult *= 1 + auraMult * 1.23;
    }

    let sucking = 0;
    for (let i in Game.wrinklers) {
        if (Game.wrinklers[i].phase == 2) {
            sucking++;
        }
    }
    let suckRate = 1/20;
    suckRate *= Game.eff('wrinklerEat');

    if (willHave('Elder Covenant', testUpgrade)) mult *= 0.95;

    if (willHave('Golden switch [off]', testUpgrade)) {
        let goldenSwitchMult = 1.5;
        if (willHave('Residual luck', testUpgrade)) {
            const upgrades = Game.goldenCookieUpgrades;
            for (let i in upgrades) {
                if (willHave(upgrades[i], testUpgrade)) goldenSwitchMult += 0.1;
            }
        }
        mult *= goldenSwitchMult;
    }
    if (willHave('Shimmering veil [off]', testUpgrade)) {
        let veilMult = 0.5;
        if (willHave('Reinforced membrane', testUpgrade)) veilMult += 0.1;
        mult *= 1 + veilMult;
    }
    if (willHave('Magic shenanigans',  testUpgrade)) mult *= 1000;
    if (willHave('Occult obstruction', testUpgrade)) mult *= 0;

    for (let i in Game.buffs) {
        if (typeof Game.buffs[i].multCpS != 'undefined') mult *= Game.buffs[i].multCpS;
    }

    return cookiesPs * mult;
}

function calculateClickCps(cookiesPs, testBuy, testBuyCount, testUpgrade) {
    return clicksPerSecond * calculateClickCookies(cookiesPs, testBuy, testBuyCount, testUpgrade);
}

function calculateTotalCps(isDefault, args) {
    if (isDefault && trueClicksPerSecond) {
        now = new Date();
        clicksPerSecond = clickCount*1000/(now-clickCountStart);
        console.log('\n');
        console.log(clicksPerSecond.toFixed(1) + ' clicks/second at ' + formatTime(now) + ' since ' + formatTime(clickCountStart));
    }

    const baseCps = calculateBaseCps(...args);
    const clickCps = calculateClickCps(baseCps, ...args);
    const totalCps = baseCps + clickCps;

    if (isDefault && trueClicksPerSecond) {
        console.log(totalCps.toPrecision(4) + ' cookies/second');
        console.log((100*clickCps/totalCps).toFixed(1) + '% of cookie production is due to autoclicker');
    }

    return totalCps;
}

function formatSeconds(rawSeconds) {
    let temp = Math.floor(rawSeconds);
    const seconds = temp%60;
    let timeString = seconds.toString();

    temp = Math.floor(temp/60);
    if (temp) {
        if (seconds < 10) timeString = '0' + timeString;
        const minutes = temp%60;
        timeString = minutes + ':' + timeString;

        temp = Math.floor(temp/60);
        if (temp) {
            if (minutes < 10) timeString = '0' + timeString;
            const hours = temp%24;
            timeString = hours + ':' + timeString;

            const days = Math.floor(temp/24);
            if (days) {
                if (hours < 10) timeString = '0' + timeString;
                timeString = days + ':' + timeString;
            }
        }
    }

    return timeString;
}

function clog(thing, message) {
    if (message) message += ' ';
    else message = '';
    message += thing.type + ': ' + thing.name;
    if (thing.buyCount) message += ' x' + thing.buyCount;
    if (thing.percent) message += ', +' + thing.percent.toPrecision(4) + '%';
    if (thing.price) message += ', $' + thing.price.toPrecision(4);
    if (thing.value) message += ', value: ' + thing.value.toPrecision(4);
    if (trueClicksPerSecond && thing.price && Game.cookies < thing.price) message += ', T-' + formatSeconds((thing.price - Game.cookies) / currentCps);
    console.log(message);
}

function calculateBuildingPrice(buildingName, testBuy, testBuyCount, testUpgrade, testAchievement, testSanta, testAura) {
    const building = Game.Objects[buildingName];
    let price = building.basePrice * Math.pow(Game.priceIncrease, Math.max(0, building.amount - building.free));

    if (willHave('Season savings',    testUpgrade)) price *= 0.99;
    if (willHave('Santa\'s dominion', testUpgrade)) price *= 0.99;
    if (willHave('Faberge egg',       testUpgrade)) price *= 0.99;
    if (willHave('Divine discount',   testUpgrade)) price *= 0.99;
    if (willHave('Fortune #100',      testUpgrade)) price *= 0.99;

    price *= 1 - Game.auraMult('Fierce Hoarder') * 0.02;
    if (Game.hasBuff('Everything must go')) price *= 0.95;
    if (Game.hasBuff('Crafty pixies'))      price *= 0.98;
    if (Game.hasBuff('Nasty goblins'))      price *= 1.02;
    if (building.fortune && willHave(building.fortune.name, testUpgrade)) price *= 0.93;
    price *= Game.eff('buildingCost');

    if (Game.hasGod) {
        const    godLvl = Game.hasGod('creation');
        if      (godLvl == 1) price *= 0.93;
        else if (godLvl == 2) price *= 0.95;
        else if (godLvl == 3) price *= 0.98;
    }
    return Math.ceil(price);
}

function calculateUpgradePrice(upgradeName, testBuy, testBuyCount, testUpgrade, testAchievement, testSanta, testAura) {
    const upgrade = Game.Upgrades[upgradeName];
    let price = upgrade.basePrice;

    if (upgrade.priceFunc) price = upgrade.priceFunc(upgrade);
    if (price == 0) return 0;

    if (upgrade.pool != 'prestige') {
        if (willHave('Toy workshop',         testUpgrade)) price *= 0.95;
        if (willHave('Five-finger discount', testUpgrade)) price *= Math.pow(0.99, amount(Game.Objects['Cursor'], testBuy, testBuyCount) / 100);
        if (willHave('Santa\'s dominion',    testUpgrade)) price *= 0.98;
        if (willHave('Faberge egg',          testUpgrade)) price *= 0.99;
        if (willHave('Divine sales',         testUpgrade)) price *= 0.99;
        if (willHave('Fortune #100',         testUpgrade)) price *= 0.99;
        if (Game.hasBuff('Haggler\'s luck'))               price *= 0.98;
        if (Game.hasBuff('Haggler\'s misery'))             price *= 1.02;
        price *= 1 - Game.auraMult('Master of the Armory') * 0.02;
        price *= Game.eff('upgradeCost');
        if (upgrade.pool == 'cookie' && willHave('Divine bakeries', testUpgrade)) price /= 5;
    }
    return Math.ceil(price);
}

function calculateBuildingPriceMultiplier(buyCount) {
    let mult = 0;
    let add = 1;
    for (let i=0; i<buyCount; ++i) {
        mult += add;
        add *= 1.15;
    }
    return mult;
}

function calculateTotalBuildingCost(args) {
    let cost = 0;
    for (let i in Game.Objects) {
        cost += calculateBuildingPrice(Game.Objects[i].name, ...args) * 20/3;
    }
    return cost;
}

function calculatePrice(type, name, buyCount, args) {
    if (type == 'building') return calculateBuildingPrice(name, ...args) * calculateBuildingPriceMultiplier(buyCount);
    if (type == 'upgrade') {
        if (name == 'santa') return Math.pow(Game.santaLevel+1,Game.santaLevel+1);

        if (name == 'dragon') {
            let price = 0;
            if (Game.dragonLevel < 22) {
                // overloading buyCount as buildingIndex for dragon, bad practice but whatever
                price = Game.ObjectsById[buyCount].price * 20/3;
                for(let i=Game.dragonLevel; i<5; ++i) price += 1000000*Math.pow(2, i);
            } else {
                price = calculateTotalBuildingCost(args);
                if (Game.dragonLevel == 22) price += calculateUpgradePrice(Game.Upgrades['Dragon cookie'].name, ...args);
            }

            return price;
        }

        return calculateUpgradePrice(name, ...args);
    }
}

function createMultiBuildingThing(args) {
    let thing = {
        type: 'building',
        name: args[0],
        buyCount: args[1],
        cps: calculateTotalCps(0, args),
        basePrice: calculateBuildingPrice(args[0], ...defaultArgs),
    };
    thing.percent = (thing.cps / currentCps - 1) * 100;
    thing.price = thing.basePrice * calculateBuildingPriceMultiplier(args[1]);
    thing.value = thing.percent / thing.price;

    return thing;
}

function doOrCalculateBestThing(){
    // Click fortunes
    if (Game.TickerEffect.type=='fortune') Game.tickerL.click();

    // Harvest any ripe sugar lumps
    if (Date.now() - Game.lumpT >= Game.lumpRipeAge) {
        console.log('\n');
        clog({type: 'sugar', name: 'lump'});
        Game.clickLump();
    }

    // Pop phase 2 wrinklers for drops
    if (['easter', 'halloween'].includes(Game.season)) {
        for (let i in Game.wrinklers) {
            const wrinkler = Game.wrinklers[i];
            if (wrinkler.phase == 2 && (!wrinkler.type || !Game.HasAchiev('Last Chance to See'))) wrinkler.hp = -10;
        }
    }
    // Pop wrinklers for achievements
    else if (!Game.HasAchiev('Moistburster') || !Game.HasAchiev('Last Chance to See')) {
        for (let i in Game.wrinklers) {
            const wrinkler = Game.wrinklers[i];
            if (wrinkler.phase && (!wrinkler.type || !Game.HasAchiev('Last Chance to See'))) wrinkler.hp = -10;
        }
    }

    // Set aura (sacrifice a building) before any more buildings are built
    if (Game.Has('A crumbly egg')) {
        if (Game.dragonLevel >= 14 && !Game.hasAura('Dragonflight')) {
            best = {type: 'aura', name: 'Dragonflight', price: 0};
            console.log('\n');
            clog(best);
            return;
        } else if (Game.dragonLevel == 24 && !Game.hasAura('Radiant Appetite')) {
            best = {type: 'aura', name: 'Radiant Appetite', price: 0};
            console.log('\n');
            clog(best);
            return;
        }
    }

    // Start best purchase calculation
    let things = {};
    let args = {};
    currentCps = calculateTotalCps(1, defaultArgs);
    console.log('\n');

    const hasLovelyCookies = Game.Has(   'Pure heart biscuits') &&
                             Game.Has( 'Ardent heart biscuits') &&
                             Game.Has(   'Sour heart biscuits') &&
                             Game.Has('Weeping heart biscuits') &&
                             Game.Has( 'Golden heart biscuits') &&
                             Game.Has('Eternal heart biscuits');
    const hasSpookyCookies = Game.Has(  'Skull cookies') &&
                             Game.Has(  'Ghost cookies') &&
                             Game.Has(    'Bat cookies') &&
                             Game.Has(  'Slime cookies') &&
                             Game.Has('Pumpkin cookies') &&
                             Game.Has('Eyeball cookies') &&
                             Game.Has( 'Spider cookies');
    let eggs = 0;
    for (let i in Game.easterEggs) {
        if (Game.HasUnlocked(Game.easterEggs[i])) eggs++;
    }

    for (let i in Game.UpgradesInStore) {
        const upgrade = Game.UpgradesInStore[i];

        if (upgrade.name == 'Chocolate egg' && !upgrade.isVaulted()) upgrade.vault();

        // Activate optimal season
        else if (
            upgrade.name ==  'Festive biscuit' && Game.season != 'christmas'                                                                           && Game.santaLevel  < 14 && Game.Has(  'Titanium mouse') ||
            upgrade.name == 'Lovesick biscuit' && Game.season != 'valentines'                                   && !hasLovelyCookies && Game.santaLevel == 14 && Game.Has('Fantasteel mouse') ||
            upgrade.name ==    'Bunny biscuit' && Game.season != 'easter'                         && eggs  < 20 &&  hasLovelyCookies && Game.santaLevel == 14                                 ||
            upgrade.name ==  'Ghostly biscuit' && Game.season != 'halloween' && !hasSpookyCookies && eggs == 20 &&  hasLovelyCookies && Game.santaLevel == 14                                 ||
            upgrade.name ==  'Festive biscuit' && Game.season != 'christmas' &&  hasSpookyCookies && eggs == 20 &&  hasLovelyCookies
        ) {
            best = {type: 'upgrade', name: upgrade.name, percent: 0, value: 0};
            best.price = calculateUpgradePrice(upgrade.name, ...defaultArgs);
            clog(best, 'season');
            return;
        }

        else if (
            upgrade.pool != 'toggle' && !upgrade.isVaulted() &&
            (!upgrade.name == 'Communal brainsweep' || !Game.HasAchiev('Elder slumber') || !Game.HasAchiev('Elder calm') || !Game.HasAchiev('Last Chance to See'))
        ) {
            const upgradePrice = calculateUpgradePrice(upgrade.name, ...defaultArgs);

            // Buy cheap upgrades, don't waste time calculating
            if (upgradePrice < Game.cookies/1000000) {
                best = {type: 'upgrade', name: upgrade.name, price: upgradePrice}
                clog(best, 'cheap');
                return;
            } else {
                args[upgrade.name] = ['', 0, upgrade.name, 0, 0, ''];
                things[upgrade.name] = {type: 'upgrade', name: upgrade.name, cps: calculateTotalCps(0, args[upgrade.name]), price: upgradePrice};
                things[upgrade.name].percent = (things[upgrade.name].cps / currentCps - 1) * 100;
                things[upgrade.name].value = things[upgrade.name].percent / things[upgrade.name].price;
            }
        }

        else if (
            upgrade.name == 'Elder Pledge'   && !Game.HasAchiev('Elder slumber') ||
            upgrade.name == 'Elder Covenant' && Game.Upgrades['Elder Pledge'].unlocked==0 ||
            upgrade.name == 'Revoke Elder Covenant'
        ) things[upgrade.name] = {type: 'upgrade', name: upgrade.name, price: calculateUpgradePrice(upgrade.name, ...defaultArgs), ignore: 1};

    }

    for (let i in Game.Objects) {
        const building = Game.Objects[i];
        args[building.name] = [building.name, 1, '', 0, 0, ''];
        things[building.name] = {
            type: 'building',
            name: building.name,
            cps: calculateTotalCps(0, args[building.name]),
            price: calculateBuildingPrice(building.name, ...defaultArgs),
        };
        things[building.name].percent = (things[building.name].cps / currentCps - 1) * 100;
        things[building.name].value = things[building.name].percent / things[building.name].price;

        // Check tiered achievements
        for (let j in building.tieredAchievs) {
            if (Game.Tiers[j].achievUnlock > building.amount) {
                if (!Game.HasAchiev(building.tieredAchievs[j].name)) {
                    const buyCount = Game.Tiers[j].achievUnlock - building.amount;
                    const thingKey = building.name + ' Tier';
                    args[thingKey] = [building.name, buyCount, '', 1, 0, 0];
                    things[thingKey] = createMultiBuildingThing(args[thingKey]);
                }

                break;
            }
        }

        // Cursor doesn't use tiered achievements :(
        if (building.name == 'Cursor') {
            const cursorAchievements = [
                {achievUnlock: 1,   name: 'Click'},
                {achievUnlock: 2,   name: 'Double-click'},
                {achievUnlock: 50,  name: 'Mouse wheel'},
                {achievUnlock: 100, name: 'Of Mice and Men'},
                {achievUnlock: 200, name: 'The Digital'},
                {achievUnlock: 300, name: 'Extreme polydactyly'},
                {achievUnlock: 400, name: 'Dr. T'},
                {achievUnlock: 500, name: 'Thumbs, phalanges, metacarpals'},
                {achievUnlock: 600, name: 'With her finger and her thumb'},
            ];

            for (let j in cursorAchievements) {
                if (cursorAchievements[j].achievUnlock > building.amount) {
                    if (!Game.HasAchiev(cursorAchievements[j].name)) {
                        const buyCount = cursorAchievements[j].achievUnlock - building.amount;
                        args['Cursor Tier'] = [building.name, buyCount, '', 1, 0, 0];
                        things['Cursor Tier'] = createMultiBuildingThing(args['Cursor Tier']);
                    }

                    break;
                }
            }
        }
    }

    console.log(things);

    // Find best value purchase
    best = {value: 0};
    for (let i in things) {
        const thing = things[i];
        if (thing.value > best.value) best = thing;
    }

    // Find better purchases for speed (sometimes by lowering prices)
    if (best.name) {
        clog(best, 'best');

        let betterThings = [best.name];

        while (betterThings.length) {
            let better = {value: -1};
            for (let i=0; i<betterThings.length; ++i) {
                const thing = things[betterThings[i]];
                if (thing.value > better.value) better = thing;
            }

            if (best.name != better.name) {
                best = better;
                clog(best, 'better');
            }

            betterThings = [];
            for (let i in things) {
                const thing = things[i];
                if (thing.name != best.name && thing.price < best.price && !thing.ignore) {
                    // These are slightly inaccurate for bulk building purchases, it might be a problem
                    const timeTillBothThingsIfFirst = thing.price/currentCps + calculatePrice(best.type, best.name, best.buyCount || 1, args[thing.name])/thing.cps;
                    const timeTillBothThingsIfSecond = best.price/currentCps + calculatePrice(thing.type, thing.name, thing.buyCount || 1, args[best.name])/best.cps;
                    if (timeTillBothThingsIfFirst < timeTillBothThingsIfSecond) betterThings.push(thing.name);
                }
            }
        }
    }

    // Override best purchase with Christmas upgrades
    if (Game.Has('A festive hat') && Game.santaLevel<14 && (!best.name || !Game.santaDrops.includes(best.name))) {
        const santaPrice = calculatePrice('upgrade', 'santa');

        let upgradeSanta = 1;
        for (let i in things) {
            const thing = things[i];
            if (Game.santaDrops.includes(thing.name)) {
                upgradeSanta = 0;
                // Santa unlocks take priority to continue unlocking them
                if (!best.name || thing.price + santaPrice < best.price) {
                    best = thing;
                    clog(best, 'santa');
                }
            }
        }

        // Don't upgrade Santa while Santa unlocks are in the store, because their price will jump
        if (upgradeSanta) {
            args.santa = ['', 0, '', 0, 1, ''];
            if (
                Game.santaLevel == 5  && !Game.HasAchiev('Coming to town') ||
                Game.santaLevel == 13 && !Game.HasAchiev('All hail Santa')
            ) args.santa[3] = 1;

            things.santa = {
                type: 'upgrade',
                name: 'santa',
                cps: calculateTotalCps(0, args.santa),
                price: santaPrice,
            };
            things.santa.percent = (things.santa.cps / currentCps - 1) * 100;
            things.santa.value = things.santa.percent / things.santa.price;

            // Override best purchase if Santa is cheaper or faster
            if (!best.name || things.santa.price <= best.price) {
                best = things.santa;
                clog(best);
            } else if (things.santa.value > best.value) {
                const timeTillBothThingsIfFirst = things.santa.price/currentCps + calculatePrice(best.type, best.name, best.buyCount || 1, args.santa)/things.santa.cps;
                const timeTillBothThingsIfSecond = best.price/currentCps + santaPrice/best.cps;
                if (timeTillBothThingsIfFirst < timeTillBothThingsIfSecond) {
                    best = things.santa;
                    clog(best, 'better');
                }
            }
        }
    }

    // Override best purchase with dragon upgrades
    if (Game.Has('A crumbly egg') && Game.dragonLevel < 24 && Game.dragonLevels[Math.max(Game.dragonLevel,5)].cost()) {
        things.dragon = {type: 'upgrade', name: 'dragon'};

        const buildingIndex = Math.max(Game.dragonLevel-5,0);
        things.dragon.price = calculatePrice('upgrade', 'dragon', buildingIndex, defaultArgs);

        if (!best.name) {
            best = things.dragon;
            clog(best, 'best');
        // Sacrifice buildings before buying any more of them
        } else if (Game.dragonLevel < 21) {
            if (Game.dragonLevel == 13 || best.type == 'building' && (
                best.name == Game.ObjectsById[buildingIndex].name ||
                best.name == Game.ObjectsById[buildingIndex+1].name && Game.ObjectsById[buildingIndex+1].amount >= 100
            )) {
                best = things.dragon;
                clog(best, 'override');
            }
        } else {
            if (best.type == 'building') {
                best = things.dragon;
                clog(best, 'override');
            // Override upgrade purchases if dragon is better
            } else if (Game.dragonLevel > 21) {
                args.dragon = ['', 0, '', 0, 0, ''];
                if      (Game.dragonLevel == 22) args.dragon[2] = 'Dragon cookie';
                else if (Game.dragonLevel == 23) args.dragon[5] = 'Radiant Appetite';

                things.dragon.cps = calculateTotalCps(0, args.dragon);
                things.dragon.percent = (things.dragon.cps / currentCps - 1) * 100;
                things.dragon.value = things.dragon.percent / things.dragon.price;

                if (things.dragon.value > best.value && things.dragon.price < best.price) {
                    best = things.dragon;
                    clog(best, 'best');
                } else if (things.dragon.value > best.value || things.dragon.price < best.price) {
                    const timeTillBothThingsIfFirst = things.dragon.price/currentCps + calculatePrice(best.type, best.name, best.buyCount || 1, args.dragon)/things.dragon.cps;
                    const timeTillBothThingsIfSecond = best.price/currentCps + calculatePrice('upgrade', 'dragon', buildingIndex, args[best.name])/best.cps;
                    if (timeTillBothThingsIfFirst < timeTillBothThingsIfSecond) {
                        best = things.dragon;
                        clog(best, 'better');
                    }
                }
            }
        }
    }

    // Override best purchase with specific upgrades if cheaper
    for (let i in things) {
        const thing = things[i];
        if ([
            'Lucky day',
            'Serendipity',
            'Get lucky',
            'Sacrificial rolling pins',
            'A festive hat',
            'Reindeer baking grounds',
            'Ho ho ho-flavored frosting',
            'Santa\'s bottomless bag',
            'Golden goose egg',
            'Wrinklerspawn',
            'Omelette',
            '"egg"',
            'A crumbly egg',
            'Elder Pledge',
            'Elder Covenant',
            'Revoke Elder Covenant',
        ].includes(thing.name) && (!best.name || thing.price <= best.price)) {
            best = thing;
            clog(best, 'override');
        }
    }

    // Pop biggest wrinkler if best purchase is more than an hour out at base Cps, and wrinklers will get there
    if (!Game.buffs.length) {
        let bestWrinkler = -1;
        let bestWrinklerSucked = 0;
        let totalSucked = 0;

        let toSuck = 1.1;
        if (Game.Has('Sacrilegious corruption')) toSuck *= 1.05;
        if (Game.Has('Wrinklerspawn')) toSuck *= 1.05;
        if (Game.hasGod) {
            const    godLvl = Game.hasGod('scorn');
            if      (godLvl == 1) toSuck *= 1.15;
            else if (godLvl == 2) toSuck *= 1.1;
            else if (godLvl == 3) toSuck *= 1.05;
        }

        for (let i=0; i<Game.getWrinklersMax(); ++i) {
            const wrinkler = Game.wrinklers[i];
            if (!wrinkler.type) {
                totalSucked += wrinkler.sucked;
                if (wrinkler.sucked > bestWrinklerSucked) {
                    bestWrinkler = i;
                    bestWrinklerSucked = wrinkler.sucked;
                }
            }
        }

        const cookieDiff = best.price - Game.cookies;
        if (totalSucked*toSuck >= cookieDiff && cookieDiff > currentCps * 60 * 60) {
            best = {type: 'wrinkler', name: bestWrinkler.toString(), price: 0};
            clog(best);
        }
    }

    // Set price for first building of multi building purchase
    if (best.basePrice) best.price = best.basePrice;

    // Do nothing and make it really expensive, to stop spamming recalculate and focus on clicking
    // This should only happen during Cursed finger buff
    if (!best.name) {
        best = {type: 'nothing', name: 'nothing', price: (Game.cookiesEarned+Game.cookiesReset)*1000000000};
        clog(best);
    }
}

function formatTime(date) {
    return (date.getHours()-1)%12+1 + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
}

function playTheGame() {
    if (best.name && buyThings && Game.cookies > best.price) {
        if (best.type == 'building'){
            if (best.price < Game.cookies/1000000) Game.Objects[best.name].buy(50);
            else if (best.price < Game.cookies/1000) Game.Objects[best.name].buy(10);
            else Game.Objects[best.name].buy(1);

            if (!Game.HasAchiev('Just wrong')) Game.Objects['Grandma'].sell(1);
        } else if (best.type == 'upgrade') {
            if (['santa', 'dragon'].includes(best.name)) {
                Game.specialTab = best.name;
                Game.ToggleSpecialMenu(1);
                upgradeSpecial(best.name);
            } else Game.Upgrades[best.name].buy(1);
        } else if (best.type == 'aura') {
            Game.specialTab = 'dragon';
            Game.ToggleSpecialMenu(1);

            let highestBuilding={};
            for (let i in Game.Objects) {
                if (Game.Objects[i].amount>0) highestBuilding = Game.Objects[i];
            }
            if (highestBuilding.id) Game.ObjectsById[highestBuilding.id].sacrifice(1);

            if      (best.name == 'Dragonflight')     Game.dragonAura=10;
            else if (best.name == 'Radiant Appetite') Game.dragonAura2=15;
        } else if (best.type == 'wrinkler') Game.wrinklers[Number(best.name)].hp = -10;

        best = {};
    } else if(Game.shimmers.length && (Game.HasAchiev('Fading luck') || Game.shimmers[0].type != 'golden' || Game.shimmers[0].life<Game.fps)) Game.shimmers[0].pop();
    else if (!best.name) {
        if (restoreHeight && Game.HasAchiev('Cookie-dunker')) {
            Game.LeftBackground.canvas.height = restoreHeight;
            restoreHeight = 0;
        }

        doOrCalculateBestThing();
    }

    now = new Date();
    while (now - Game.lastClick < 4) now = new Date();
    ++clickCount;
    Game.ClickCookie();

    const nowSeconds = now.getSeconds();
    if (clickCountFlag && !(nowSeconds%10)) {
        best = {};

        if (clickCountStarted) {
            clicksPerSecond = clickCount*1000/(now-clickCountStart);
            trueClicksPerSecond = 1;

            if (!now.getMinutes() && !nowSeconds) {
                clickCountStart = now;
                clickCount = 0;
            }
        } else {
            clickCountStarted = 1;
            clickCountStart = now;
            clickCount = 0;
        }

        clickCountFlag = 0;
    } else if (!clickCountFlag && nowSeconds%10) clickCountFlag = 1;
}

let botInterval;
let best;
let buyThings = 1;
let restoreHeight;
let now;
let clickCountFlag;
let clickCountStart;
let clickCountStarted;
let clicksPerSecond = 150;
let trueClicksPerSecond;
let clickCount = 0;
const defaultArgs = ['', 0, '', 0, 0, ''];
let currentCps;

function initialize() {
    Game.Win('Cheated cookies taste awful');
    Game.Win('Third-party');
    Game.ClickTinyCookie();
    Game.bakeryNameSet('orteil');
    Game.bakeryNameSet('Zookbot');
    Game.Win('What\'s in a name');
    Game.Achievements['Here you go'].click();
    while (!Game.HasAchiev('Tabloid addiction')) Game.tickerL.click();
    if (!Game.HasAchiev('Cookie-dunker')) {
        restoreHeight = Game.LeftBackground.canvas.height;
        Game.LeftBackground.canvas.height = 0;
    }
}

function start() {
    best = {};
    clickCountStarted = 0;
    clickCountFlag = 1;
    trueClicksPerSecond = 0;

    stop();
    botInterval = setInterval(playTheGame);
}

function startBuying() {
    buyThings = 1;
}

function stopBuying() {
    buyThings = 0;
}

function stop() {
    clearInterval(botInterval);
}

initialize();
start();
