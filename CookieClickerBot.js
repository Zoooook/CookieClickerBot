// prioritize fortunes over corresponding building
// redraw cookie after dunk
// get more achievements
// take into account all achievements, upgrade unlocks
// estimate long term production
// calculate when season switcher is still worth it
// big upgrades switch dragon aura to master of the armory
// anticipate aura value before 200 yous

// ascension -- maybe need to take into account longterm expected production, ignore buffs, also upgrade unlocks
// save scum sugar lump harvesting
// minigames, level objects

// Object.keys(Game.Upgrades).filter(x => Game.Upgrades[x].bought && !['prestige', 'toggle'].includes(Game.Upgrades[x].pool)).sort((a,b) => Game.Upgrades[b].getPrice() - Game.Upgrades[a].getPrice()).slice(0,10).map(x => {return {price: Game.Upgrades[x].getPrice().toPrecision(4), name: x};});

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
        if (!Game.Tiers[me.tieredUpgrades[i].tier].special && willHave(me.tieredUpgrades[i].name, testUpgrade)) {
            let tierMult = 2;
            if (Game.ascensionMode != 1 &&
                willHave(me.unshackleUpgrade, testUpgrade) &&
                willHave(Game.Tiers[me.tieredUpgrades[i].tier].unshackleUpgrade, testUpgrade)
            ) tierMult += me.id == 1 ? 0.5 : (20 - me.id) * 0.1;
            mult *= tierMult;
        }
    }
    for (let i in me.synergies) {
        const syn = me.synergies[i];
        if (willHave(syn.name, testUpgrade)){
            if      (syn.buildingTie1.name == me.name) mult *= (1 + 0.05  * amount(syn.buildingTie2, testBuy, testBuyCount));
            else if (syn.buildingTie2.name == me.name) mult *= (1 + 0.001 * amount(syn.buildingTie1, testBuy, testBuyCount));
        }
    }
    if (me.fortune && willHave(me.fortune.name, testUpgrade)) mult *= 1.07;
    if (me.grandma && willHave(me.grandma.name, testUpgrade)) mult *= (1 + amount(Game.Objects['Grandma'], testBuy, testBuyCount) * 0.01 * (1 / (me.id - 1)));
    return mult;
}

function calculateCursorBaseCps(testUpgrade) {
    let add = 0;
    if (willHave(   'Thousand fingers', testUpgrade)) add += 0.1;
    if (willHave(    'Million fingers', testUpgrade)) add *= 5;
    if (willHave(    'Billion fingers', testUpgrade)) add *= 10;
    if (willHave(   'Trillion fingers', testUpgrade)) add *= 20;
    if (willHave('Quadrillion fingers', testUpgrade)) add *= 20;
    if (willHave('Quintillion fingers', testUpgrade)) add *= 20;
    if (willHave( 'Sextillion fingers', testUpgrade)) add *= 20;
    if (willHave( 'Septillion fingers', testUpgrade)) add *= 20;
    if (willHave(  'Octillion fingers', testUpgrade)) add *= 20;
    if (willHave(  'Nonillion fingers', testUpgrade)) add *= 20;
    if (willHave(  'Decillion fingers', testUpgrade)) add *= 20;
    if (willHave('Undecillion fingers', testUpgrade)) add *= 20;
    if (willHave( 'Unshackled cursors', testUpgrade)) add *= 25;
    return add;
}

function calculateCursorCps(testBuy, testBuyCount, testUpgrade) {
    let add = calculateCursorBaseCps(testUpgrade);
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
        add,
    ) * mult;
}

function calculateGrandmaCps(testBuy, testBuyCount, testUpgrade, testAura) {
    let mult = 1;
    for (let i in Game.GrandmaSynergies) {
        if (willHave(Game.GrandmaSynergies[i], testUpgrade)) mult *= 2;
    }
    if (willHave('Bingo center/Research facility', testUpgrade)) mult *= 4;
    if (willHave('Ritual rolling pins',            testUpgrade)) mult *= 2;
    if (willHave('Naughty list',                   testUpgrade)) mult *= 2;
    if (willHave('Elderwort biscuits',             testUpgrade)) mult *= 1.02;

    mult *= Game.eff('grandmaCps');
    if (Game.Has('Cat ladies')) {
        for (let i = 0; i < Game.UpgradesByPool['kitten'].length; ++i) {
            if (willHave(Game.UpgradesByPool['kitten'][i].name, testUpgrade)) mult *= 1.29;
        }
    }
    mult *= calculateTieredCpsMult(Game.Objects['Grandma'], testBuy, testBuyCount, testUpgrade);

    let add = 0;
    if (willHave('One mind',            testUpgrade)) add += amount(Game.Objects['Grandma'], testBuy, testBuyCount) * 0.02;
    if (willHave('Communal brainsweep', testUpgrade)) add += amount(Game.Objects['Grandma'], testBuy, testBuyCount) * 0.02;
    if (willHave('Elder Pact',          testUpgrade)) add += amount(Game.Objects['Portal'],  testBuy, testBuyCount) * 0.05;

    let num = 0;
    for (let i in Game.Objects) {
        if (Game.Objects[i].name!='Grandma') num += amount(Game.Objects[i], testBuy, testBuyCount);
    }

    mult *= 1 + testAuraMult('Elder Battalion', testAura) * 0.01 * num;

    return (Game.Objects['Grandma'].baseCps + add) * mult;
}

function calculateBuildingCps(buildingName, testBuy, testBuyCount, testUpgrade, testAura) {
    if (buildingName == 'Cursor') return calculateCursorCps(testBuy, testBuyCount, testUpgrade);
    if (buildingName == 'Grandma') return calculateGrandmaCps(testBuy, testBuyCount, testUpgrade, testAura);

    return Game.Objects[buildingName].baseCps * calculateTieredCpsMult(Game.Objects[buildingName], testBuy, testBuyCount, testUpgrade);
}

function calculateHeavenlyMultiplier(testUpgrade, testAura) {
    let heavenlyMult = 0;
    if (willHave('Heavenly chip secret',   testUpgrade)) heavenlyMult += 0.05;
    if (willHave('Heavenly cookie stand',  testUpgrade)) heavenlyMult += 0.20;
    if (willHave('Heavenly bakery',        testUpgrade)) heavenlyMult += 0.25;
    if (willHave('Heavenly confectionery', testUpgrade)) heavenlyMult += 0.25;
    if (willHave('Heavenly key',           testUpgrade)) heavenlyMult += 0.25;
    heavenlyMult *= 1 + testAuraMult('Dragon God', testAura) * 0.05;
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

function testAuraMult(aura, testAura) {
    if ([
        testAura || Game.dragonAuras[Game.dragonAura].name,
        testAura || Game.dragonAuras[Game.dragonAura2].name,
    ].includes(aura)) return 1;
    return 0;
}

function calculateUnbuffedBaseCps(testBuy, testBuyCount, testUpgrade, testAchievement, testSanta, testAura) {
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

    if (Game.ascensionMode != 1) mult += parseFloat(Game.prestige) * 0.01 * Game.heavenlyPower * calculateHeavenlyMultiplier(testUpgrade, testAura);

    if (effs.cps) mult *= effs.cps;

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
    if (willHave('Dragon scale',                testUpgrade)) mult *= 1.03;

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

    const milkProgress = (Game.AchievementsOwned + testAchievement) / 25;
    let milkMult = 1;
    if (willHave('Santa\'s milk and cookies', testUpgrade)) milkMult *= 1.05;
    milkMult *= 1 + testAuraMult('Breath of Milk', testAura) * 0.05;
    if (Game.hasGod) {
        const    godLvl = Game.hasGod('mother');
        if      (godLvl == 1) milkMult *= 1.1;
        else if (godLvl == 2) milkMult *= 1.05;
        else if (godLvl == 3) milkMult *= 1.03;
    }
    if (effs.milk) milkMult *= effs.milk;

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
    if (willHave('Kitten admins',                             testUpgrade)) catMult *= (1 + milkProgress * 0.11  * milkMult);
    if (willHave('Kitten strategists',                        testUpgrade)) catMult *= (1 + milkProgress * 0.105 * milkMult);
    if (willHave('Kitten angels',                             testUpgrade)) catMult *= (1 + milkProgress * 0.1   * milkMult);
    if (willHave('Fortune #103',                              testUpgrade)) catMult *= (1 + milkProgress * 0.05  * milkMult);

    mult *= catMult;

    for (let i in Game.Objects) {
        const building = Game.Objects[i];
        let storedCps = calculateBuildingCps(building.name, testBuy, testBuyCount, testUpgrade, testAura);
        if (Game.ascensionMode != 1) storedCps *= (1 + building.level * 0.01) * buildMult;
        if (building.id == 1 && willHave('Milkhelp&reg; lactose intolerance relief tablets', testUpgrade)) storedCps *= 1 + 0.05 * milkProgress * milkMult;
        const storedTotalCps = amount(building, testBuy, testBuyCount) * storedCps;
        cookiesPs += storedTotalCps;
    }

    if (willHave('"egg"', testUpgrade)) cookiesPs += 9;

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

    mult *= 1 + testAuraMult('Radiant Appetite', testAura);

    let auraMult = testAuraMult('Dragon\'s Fortune', testAura);
    for (let i = 0; i < Game.shimmerTypes['golden'].n; ++i) {
        mult *= 1 + auraMult * 1.23;
    }

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
        if (willHave('Delicate touch',      testUpgrade)) veilMult += 0.05;
        if (willHave('Steadfast murmur',    testUpgrade)) veilMult += 0.05;
        if (willHave('Glittering edge',     testUpgrade)) veilMult += 0.05;
        mult *= 1 + veilMult;
    }
    if (willHave('Magic shenanigans',  testUpgrade)) mult *= 1000;
    if (willHave('Occult obstruction', testUpgrade)) mult *= 0;

    return cookiesPs * mult;
}

function calculateBaseCps(testBuy, testBuyCount, testUpgrade, testAchievement, testSanta, testAura) {
    if (Game.hasBuff('Cursed finger')) return 0;

    let cookiesPs = calculateUnbuffedBaseCps(testBuy, testBuyCount, testUpgrade, testAchievement, testSanta, testAura);
    for (let i in Game.buffs) {
        if (typeof Game.buffs[i].multCpS != 'undefined') cookiesPs *= Game.buffs[i].multCpS;
    }
    return cookiesPs;
}

function calculateUnbuffedClickCookies(cookiesPs, testBuy, testBuyCount, testUpgrade, testAura) {
    let add = calculateCursorBaseCps(testUpgrade);
    let num = 0;
    for (let i in Game.Objects) {
        num += amount(Game.Objects[i], testBuy, testBuyCount);
    }
    num -= amount(Game.Objects['Cursor'], testBuy, testBuyCount);
    add *= num;

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
    if (willHave(   'Miraculite mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(    'Aetherice mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave(    'Omniplast mouse', testUpgrade)) add += cookiesPs*0.01;
    if (willHave('Fortune #104',        testUpgrade)) add += cookiesPs*0.01;

    let mult = 1;
    if (willHave('Santa\'s helpers', testUpgrade)) mult *= 1.1;
    if (willHave('Cookie egg',       testUpgrade)) mult *= 1.1;
    if (willHave('Halo gloves',      testUpgrade)) mult *= 1.1;
    if (willHave('Dragon claw',      testUpgrade)) mult *= 1.03;
    if (willHave('Aura gloves',      testUpgrade)) mult *= 1 + 0.05 * Math.min(Game.Objects['Cursor'].level, willHave('Luminous gloves', testUpgrade) ? 20 : 10);
    mult *= Game.eff('click');

    if (Game.hasGod) {
        const    godLvl = Game.hasGod('labor');
        if      (godLvl == 1) mult *= 1.15;
        else if (godLvl == 2) mult *= 1.1;
        else if (godLvl == 3) mult *= 1.05;
    }

    mult *= 1 + testAuraMult('Dragon Cursor', testAura) * 0.05;

    return mult * Game.ComputeCps(
        1,
        willHave('Reinforced index finger', testUpgrade) + willHave('Carpal tunnel prevention cream', testUpgrade) + willHave('Ambidextrous', testUpgrade),
        add,
    );
}

function calculateClickCookies(cookiesPs, testBuy, testBuyCount, testUpgrade, testAura) {
    if (Game.hasBuff('Cursed finger')) return Game.buffs['Cursed finger'].power;

    let clickCookies = calculateUnbuffedClickCookies(cookiesPs, testBuy, testBuyCount, testUpgrade, testAura);
    for (let i in Game.buffs) {
        if (typeof Game.buffs[i].multClick != 'undefined') clickCookies *= Game.buffs[i].multClick;
    }
    return clickCookies;
}

function calculateUnbuffedClickCps(cookiesPs, testBuy, testBuyCount, testUpgrade, testAchievement, testSanta, testAura) {
    return clicksPerSecond * calculateUnbuffedClickCookies(cookiesPs, testBuy, testBuyCount, testUpgrade, testAura);
}

function calculateClickCps(cookiesPs, testBuy, testBuyCount, testUpgrade, testAchievement, testSanta, testAura) {
    return clicksPerSecond * calculateClickCookies(cookiesPs, testBuy, testBuyCount, testUpgrade, testAura);
}

function countWrinklers() {
    let count = 0;
    for (let i = 0; i < Game.getWrinklersMax(); ++i) {
        if (Game.wrinklers[i].phase == 2) ++count;
    }
    return count;
}

function calculateWrinklerBoostMultiplier(testAura) {
    const witheredProportion = countWrinklers() * Game.eff('wrinklerEat') / 20;

    let suckMult = witheredProportion * 1.1;
    if (Game.Has('Sacrilegious corruption')) suckMult *= 1.05;
    if (Game.Has('Wrinklerspawn'))           suckMult *= 1.05;
    if (Game.auraMult('Dragon Guts'))        suckMult *= 1.2;
    if (Game.hasGod) {
        const godLvl = Game.hasGod('scorn');
        if      (godLvl == 1) suckMult *= 1.15;
        else if (godLvl == 2) suckMult *= 1.1;
        else if (godLvl == 3) suckMult *= 1.05;
    }

    let boost = 1;
    for (let i = 0; i < Game.getWrinklersMax(); ++i) {
        const wrinkler = Game.wrinklers[i];
        if (wrinkler.phase == 2) {
            boost -= .05;
            if (wrinkler.type==1) boost += 3 * suckMult;
            else boost += suckMult;
        }
    }
    return boost;
}

function calculateTotalCps(calculateCps, unbuffed, args) {
    if (trueClicksPerSecond && calculateCps) {
        clicksPerSecond = clickCount * 1000 / (now - clickCountStart);
        console.log('\n');
        if (Object.keys(Game.buffs).length) console.log('   ', Object.keys(Game.buffs).join(', '));
        clicksPerSecondShort = clickCountShort * 1000 / (now - clickCountShortStart);
        console.log('    ' + clicksPerSecondShort.toFixed(1) + ' clicks/second from ' + formatTime(clickCountShortStart) + ' to ' + formatTime(now));
        console.log('    ' + clicksPerSecond.toFixed(1) + ' clicks/second from ' + formatTime(clickCountStart) + ' to ' + formatTime(now));
    }

    let baseCps;
    let clickCps;
    if (unbuffed) {
        baseCps = calculateUnbuffedBaseCps(...args);
        clickCps = calculateUnbuffedClickCps(baseCps, ...args);
    } else {
        baseCps = calculateBaseCps(...args);
        clickCps = calculateClickCps(baseCps, ...args);
    }
    const totalCps = baseCps + clickCps;

    const numWrinklers = countWrinklers()

    if (numWrinklers) {
        const witheredMultiplier = 1 - numWrinklers * Game.eff('wrinklerEat') * (1 + testAuraMult('Dragon Guts', args[5]) * 0.2) / 20;
        const apparentPassiveCps = baseCps * witheredMultiplier;
        const apparentTotalCps = apparentPassiveCps + clickCps;

        if (calculateCps && trueClicksPerSecond) {
            const boostedMultiplier = calculateWrinklerBoostMultiplier(args[5]);
            const actualPassiveCps = baseCps * boostedMultiplier;
            const actualTotalCps = actualPassiveCps + clickCps;

            const string1 = '    ' + apparentTotalCps.toPrecision(4) + ' / ' + actualTotalCps.toPrecision(4)
            let   string2 = '        ' + (100 * (apparentTotalCps / totalCps - 1)).toFixed(1) + '% / ' + (100 * (actualTotalCps / totalCps - 1)).toFixed(1) + '%';
            let   string3 = '        ' + (100 * clickCps / apparentTotalCps).toFixed(1) + '% / ' + (100 * clickCps / actualTotalCps).toFixed(1) + '%';
            for (let i = string2.length; i < string1.length; ++i) string2 += ' ';
            for (let i = string3.length; i < string1.length-3; ++i) string3 += ' ';

            console.log(string1 + ' apparent / actual cookies/second');
            console.log(string2 + ' apparent / actual wrinkler boost');
            console.log(string3 + ' of apparent / actual cookie production due to autoclicker');
        }

        return apparentTotalCps;
    } else {
        if (calculateCps && trueClicksPerSecond) {
            console.log('    ' + totalCps.toPrecision(4) + ' cookies/second');
            console.log('    ' + (100 * clickCps / totalCps).toFixed(1) + '% of cookie production is due to autoclicker');
        }

        return totalCps;
    }
}

function formatSeconds(rawSeconds) {
    let temp = Math.floor(rawSeconds);
    const seconds = temp % 60;
    let timeString = seconds.toString();

    temp = Math.floor(temp / 60);
    if (temp) {
        if (seconds < 10) timeString = '0' + timeString;
        const minutes = temp % 60;
        timeString = minutes + ':' + timeString;

        temp = Math.floor(temp / 60);
        if (temp) {
            if (minutes < 10) timeString = '0' + timeString;
            const hours = temp % 24;
            timeString = hours + ':' + timeString;

            const days = Math.floor(temp / 24);
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
    if (thing.percent) message += ', +' + thing.percent.toFixed(4) + '%';
    if (thing.price) message += ', $' + thing.price.toPrecision(5);
    if (thing.value) message += ', value: ' + thing.value.toPrecision(5);
    if (thing.price && Game.cookies < thing.price) message += ', T-' + formatSeconds((thing.price - Game.cookies) / currentCps);
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

    price *= 1 - testAuraMult('Fierce Hoarder', testAura) * 0.02;
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
        if (upgrade.kitten && willHave('Kitten wages', testUpgrade)) price*=0.9;
        if (Game.hasBuff('Haggler\'s luck'))               price *= 0.98;
        if (Game.hasBuff('Haggler\'s misery'))             price *= 1.02;
        price *= 1 - testAuraMult('Master of the Armory', testAura) * 0.02;
        price *= Game.eff('upgradeCost');
        if (upgrade.pool == 'cookie' && willHave('Divine bakeries', testUpgrade)) price /= 5;
    }
    return Math.ceil(price);
}

function calculateBuildingPriceMultiplier(buyCount) {
    let mult = 0;
    let add = 1;
    for (let i = 0; i < buyCount; ++i) {
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
            if (Game.dragonLevel < Game.dragonLevels.length - 3) {
                // overloading buyCount as buildingIndex for dragon, bad practice but whatever
                price = Game.ObjectsById[buyCount].price * 20/3;
                for (let i = Game.dragonLevel; i < 5; ++i) price += 1000000 * Math.pow(2, i);
            } else {
                price = calculateTotalBuildingCost(args);
                if (Game.dragonLevel == Game.dragonLevels.length - 3) price += calculateUpgradePrice('Dragon cookie', ...args);
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
        cps: calculateTotalCps(0, 0, args),
        basePrice: calculateBuildingPrice(args[0], ...defaultArgs),
    };
    thing.percent = (thing.cps / currentCps - 1) * 100;
    thing.price = thing.basePrice * calculateBuildingPriceMultiplier(args[1]);
    thing.value = thing.percent / thing.price;

    return thing;
}

function findBestAura(testBuy, testBuyCount) {
    const dragonArgs = [testBuy, testBuyCount, '', 0, 0];
    const auras = [
        {level: 5, name: 'Breath of Milk'},
        {level: 7, name: 'Elder Battalion'},
        {level: 19, name: 'Radiant Appetite'},
    ];
    let bestAura = {cps: 0};

    for (let i = 0; i < auras.length; ++i) {
        const aura = auras[i];
        if (Game.dragonLevel < aura.level) break;
        aura.cps = calculateTotalCps(0, 0, dragonArgs.concat(aura.name));
        if (aura.cps > bestAura.cps) bestAura = aura;
    }
    return bestAura;
}

function getHighestBuilding() {
    let highestBuilding={};
    for (let i in Game.Objects) {
        if (Game.Objects[i].amount>0) highestBuilding = Game.Objects[i];
    }
    return highestBuilding;
}

function doOrCalculateBestThing(){
    // Click fortunes
    if (autoClicker && Game.TickerEffect.type=='fortune') {
        Game.tickerL.click();
        console.log('Clicked a fortune');
    }

    if (Game.hasBuff('Cursed finger')) {
        // Do nothing and make it really expensive, to stop spamming recalculate and focus on clicking
        best = {type: 'nothing', name: 'Cursed finger', price: (Game.cookiesEarned + Game.cookiesReset) * 1000000000};
        clog(best);
        return;
    }

    currentCps = calculateTotalCps(1, 0, defaultArgs);

    if (autoClicker) {
        // Harvest any ripe sugar lumps
        if (Date.now() - Game.lumpT >= Game.lumpRipeAge) {
            console.log('\n');
            clog({type: 'sugar', name: 'lump'});
            Game.clickLump();
        }

        // Pop phase 2 wrinklers for drops
        if (['easter', 'halloween'].includes(Game.season)) {
            for (let i = 0; i < Game.getWrinklersMax(); ++i) {
                const wrinkler = Game.wrinklers[i];
                if (wrinkler.phase == 2 && (!wrinkler.type || !Game.HasAchiev('Last Chance to See'))) {
                    wrinkler.hp = -10;
                    console.log(`Popped a wrinkler for ${Game.season} drops`);
                }
            }
        }
        // Pop wrinklers for achievements
        else if (!Game.HasAchiev('Moistburster') || !Game.HasAchiev('Last Chance to See')) {
            for (let i = 0; i < Game.getWrinklersMax(); ++i) {
                const wrinkler = Game.wrinklers[i];
                if (wrinkler.phase && (!wrinkler.type || !Game.HasAchiev('Last Chance to See'))) {
                    wrinkler.hp = -10;
                    console.log('Popped a wrinkler for achievements');
                }
            }
        }

        // Pet the dragon
        let drops = ['Dragon scale', 'Dragon claw', 'Dragon fang', 'Dragon teddy bear'];
        if (Game.Has('Pet the dragon') && Game.dragonLevel >= 8 && (
            !Game.HasUnlocked(drops[0]) ||
            !Game.HasUnlocked(drops[1]) ||
            !Game.HasUnlocked(drops[2]) ||
            !Game.HasUnlocked(drops[3])
        )) {
            Math.seedrandom(Game.seed+'/dragonTime');
            drops = shuffle(drops);
            const drop = drops[Math.floor((new Date().getMinutes() / 60) * drops.length)];
            if (!Game.HasUnlocked(drop)) {
                Game.specialTab='dragon';
                Game.ToggleSpecialMenu(1);
                while (!Game.HasUnlocked(drop)) {
                    Game.ClickSpecialPic();
                    console.log('Pet the dragon');
                }
            }
        }

        // Set aura (sacrifice a building) before any more buildings are built
        if (autoBuyer && Game.Has('A crumbly egg')) {
            if (Game.dragonLevel >= 14 && !Game.hasAura('Dragonflight')) {
                best = {type: 'aura', name: 'Dragonflight', price: 0};
                console.log('\n');
                clog(best);
                return;
            } else if (Game.dragonLevel >= 5 && Game.dragonLevel < 14 || Game.dragonLevel == Game.dragonLevels.length - 1 && bulkBuy == 1) {
                const bestAura = findBestAura(getHighestBuilding().name || '', -1);
                if (bestAura.name && !Game.hasAura(bestAura.name)) {
                    best = {type: 'aura', name: bestAura.name, cps: bestAura.cps, price: 0, percent: (bestAura.cps / currentCps - 1) * 100};
                    console.log('\n');
                    clog(best);
                    return;
                }
            }
        }
    }

    // Wait to sell grandma until we can buy her back
    if (!Game.HasAchiev('Just wrong') && Game.Objects['Grandma'].amount) {
        best = {type: 'sell', name: 'Grandma', price: Math.ceil(Game.Objects['Grandma'].price*15/23)}
        clog(best);
        return;
    }

    // Start best purchase calculation
    let things = {};
    let args = {};
    console.log('\n');

    const hasChristmasCookies = Game.Has('Christmas tree biscuits') &&
                                Game.Has(     'Snowflake biscuits') &&
                                Game.Has(       'Snowman biscuits') &&
                                Game.Has(         'Holly biscuits') &&
                                Game.Has(    'Candy cane biscuits') &&
                                Game.Has(          'Bell biscuits') &&
                                Game.Has(       'Present biscuits');
    const hasValentineCookies = Game.Has(    'Pure heart biscuits') &&
                                Game.Has(  'Ardent heart biscuits') &&
                                Game.Has(    'Sour heart biscuits') &&
                                Game.Has( 'Weeping heart biscuits') &&
                                Game.Has(  'Golden heart biscuits') &&
                                Game.Has( 'Eternal heart biscuits') &&
                                Game.Has(   'Prism heart biscuits');
    const hasHalloweenCookies = Game.Has(  'Skull cookies') &&
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

    let boughtCheap = 0;
    for (let i in Game.UpgradesInStore) {
        const upgrade = Game.UpgradesInStore[i];

        if (upgrade.bought > 0) continue;

        if (upgrade.name == 'Chocolate egg' && !upgrade.isVaulted()) upgrade.vault();

        // Activate optimal season
        else if (autoClicker && (
            upgrade.name ==  'Festive biscuit' && Game.season != 'christmas'                                                               && (!hasChristmasCookies || Game.santaLevel <  14) && Game.Has(  'Titanium mouse') ||
            upgrade.name == 'Lovesick biscuit' && Game.season != 'valentines'                                      && !hasValentineCookies &&   hasChristmasCookies && Game.santaLevel == 14  && Game.Has('Fantasteel mouse') ||
            upgrade.name ==    'Bunny biscuit' && Game.season != 'easter'                            && eggs  < 20 &&  hasValentineCookies &&   hasChristmasCookies && Game.santaLevel == 14                                  ||
            upgrade.name ==  'Ghostly biscuit' && Game.season != 'halloween' && !hasHalloweenCookies && eggs == 20 &&  hasValentineCookies &&   hasChristmasCookies && Game.santaLevel == 14                                  ||
            upgrade.name ==  'Festive biscuit' && Game.season != 'christmas' &&  hasHalloweenCookies && eggs == 20 &&  hasValentineCookies
        )) {
            best = {type: 'upgrade', name: upgrade.name, percent: 0, value: 0};
            best.price = calculateUpgradePrice(upgrade.name, ...defaultArgs);
            clog(best, 'season');
            if (Game.cookies >= best.price) {
                Game.Upgrades[best.name].buy(1);
                best = {};
            }
            return;
        }

        else if (
            upgrade.pool != 'toggle' && !upgrade.isVaulted() &&
            (upgrade.name != 'Communal brainsweep' || !Game.HasAchiev('Elder slumber') || !Game.HasAchiev('Elder calm') || !Game.HasAchiev('Last Chance to See'))
        ) {
            const upgradePrice = calculateUpgradePrice(upgrade.name, ...defaultArgs);

            // Buy cheap upgrades, don't waste time calculating
            if (upgradePrice < Game.cookies / 1000000) {
                clog({type: 'upgrade', name: upgrade.name, price: upgradePrice}, 'cheap');
                if (autoBuyer) {
                    upgrade.buy(1);
                    boughtCheap = 1;
                }
            } else {
                args[upgrade.name] = ['', 0, upgrade.name, 0, 0, ''];
                things[upgrade.name] = {type: 'upgrade', name: upgrade.name, cps: calculateTotalCps(0, 0, args[upgrade.name]), price: upgradePrice};
                things[upgrade.name].percent = (things[upgrade.name].cps / currentCps - 1) * 100;
                things[upgrade.name].value = things[upgrade.name].percent / things[upgrade.name].price;
            }
        }

        else if (
            upgrade.name == 'Elder Pledge' && !Game.HasAchiev('Elder slumber') ||
            upgrade.name == 'Elder Covenant' && Game.Upgrades['Elder Pledge'].unlocked==0 ||
            upgrade.name == 'Revoke Elder Covenant'
        ) things[upgrade.name] = {type: 'upgrade', name: upgrade.name, price: calculateUpgradePrice(upgrade.name, ...defaultArgs), ignore: 1};
    }
    if (boughtCheap) return;

    for (let i in Game.Objects) {
        const building = Game.Objects[i];
        args[building.name] = [building.name, 1, '', 0, 0, ''];
        things[building.name] = {
            type: 'building',
            name: building.name,
            cps: calculateTotalCps(0, 0, args[building.name]),
            price: calculateBuildingPrice(building.name, ...defaultArgs),
        };
        things[building.name].percent = (things[building.name].cps / currentCps - 1) * 100;
        things[building.name].value = things[building.name].percent / things[building.name].price;

        // Check tiered achievements
        for (let j in building.tieredAchievs) {
            if (!Game.HasAchiev(building.tieredAchievs[j].name)) {
                const buyCount = Game.Tiers[j].achievUnlock - building.amount;
                const thingKey = building.name + ' Tier';
                args[thingKey] = [building.name, buyCount, '', 1, 0, 0];
                things[thingKey] = createMultiBuildingThing(args[thingKey]);
                break;
            }
        }

        // Cursor doesn't use tiered achievements :(
        if (building.name == 'Cursor') {
            const cursorAchievements = [
                {achievUnlock:    1, name: 'Click'},
                {achievUnlock:    2, name: 'Double-click'},
                {achievUnlock:   50, name: 'Mouse wheel'},
                {achievUnlock:  100, name: 'Of Mice and Men'},
                {achievUnlock:  200, name: 'The Digital'},
                {achievUnlock:  300, name: 'Extreme polydactyly'},
                {achievUnlock:  400, name: 'Dr. T'},
                {achievUnlock:  500, name: 'Thumbs, phalanges, metacarpals'},
                {achievUnlock:  600, name: 'With her finger and her thumb'},
                {achievUnlock:  700, name: 'Gotta hand it to you'},
                {achievUnlock:  800, name: 'The devil\'s workshop'},
                {achievUnlock:  900, name: 'All on deck'},
                {achievUnlock: 1000, name: 'A round of applause'},
            ];

            for (let j in cursorAchievements) {
                if (!Game.HasAchiev(cursorAchievements[j].name)) {
                    const buyCount = cursorAchievements[j].achievUnlock - building.amount;
                    args['Cursor Tier'] = [building.name, buyCount, '', 1, 0, 0];
                    things['Cursor Tier'] = createMultiBuildingThing(args['Cursor Tier']);
                    break;
                }
            }
        }
    }

    const values = Object.entries(things).sort((a, b) => {
        return (b[1].value || 0) - (a[1].value || 0);
    }).map(thing => {
        return {
            value: thing[1].value.toPrecision(5),
            percent: thing[1].percent.toFixed(4),
            price: thing[1].price.toPrecision(5),
            name: thing[0],
        };
    });
    console.log('Upgrades by value: ', values);
    console.log('Upgrades by name: ', things);

    best = things[values[0].name];
    clog(best, 'best');

    // Find better purchases for speed (sometimes by lowering prices)
    for (let i = 1; i < values.length; ++i) {
        const thing = things[values[i].name];
        if (thing.price < best.price && !thing.ignore) {
            // These are slightly inaccurate for bulk building purchases, it should be good enough though
            const timeTillBothThingsIfFirst = thing.price/currentCps + calculatePrice(best.type, best.name, best.buyCount || 1, args[thing.name])/thing.cps;
            const timeTillBothThingsIfSecond = best.price/currentCps + calculatePrice(thing.type, thing.name, thing.buyCount || 1, args[best.name])/best.cps;
            if (timeTillBothThingsIfFirst < timeTillBothThingsIfSecond) {
                best = thing;
                clog(best, 'better');
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
                cps: calculateTotalCps(0, 0, args.santa),
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
    if (Game.Has('A crumbly egg') && Game.dragonLevel < Game.dragonLevels.length - 1 && Game.dragonLevels[Math.max(Game.dragonLevel,5)].cost()) { // cost() tests if you can afford it
        things.dragon = {type: 'upgrade', name: 'dragon'};

        const buildingIndex = Math.max(Game.dragonLevel - 5, 0);
        things.dragon.price = calculatePrice('upgrade', 'dragon', buildingIndex, defaultArgs);

        if (!best.name) {
            best = things.dragon;
            clog(best, 'best');
        // Sacrifice buildings before buying any more of them, or train dragonflight
        } else if (Game.dragonLevel < Game.dragonLevels.length - 4) {
            if (best.type == 'building' && Game.Objects[best.name].id >= Game.dragonLevel - 5 && Game.Objects[best.name].amount >= 100 || Game.dragonLevel == 13) {
                best = things.dragon;
                clog(best, 'override');
            }
        } else {
            // if level == length - 4, sacrifice 100 of top building
            if (best.type == 'building') {
                best = things.dragon;
                clog(best, 'override');
            // Override upgrade purchases if dragon is better
            } else if (Game.dragonLevel > Game.dragonLevels.length - 4) {
                // ignore dragon cookie, radiant appetite is always way better
                const bestAura = findBestAura('', 0);
                things.dragon.cps = bestAura.cps;

                things.dragon.percent = (things.dragon.cps / currentCps - 1) * 100;
                things.dragon.value = things.dragon.percent / things.dragon.price;
                // have to buy back buildings twice, leave cost alone so we go ahead and level up once
                if (Game.dragonLevel == Game.dragonLevels.length - 3) things.dragon.value /= 2;

                if (things.dragon.value > best.value) {
                    best = things.dragon;
                    clog(best, 'better');
                }
            }
        }
    }

    // Override best purchase with specific upgrades if cheaper
    for (let i in things) {
        const thing = things[i];
        if ((!best.name || thing.price <= best.price) && (
            ['Dragon fang', 'Dragon teddy bear'].includes(thing.name) && best.name != 'dragon' ||
            [
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
            ].includes(thing.name)
        )) {
            best = thing;
            clog(best, 'override');
        }
    }

    // Override best purchase with user defined priority
    if (buyList.length) {
        best = things[buyList[0]];
        if (best) clog(best, 'user');
        else {
            best = {type: 'invalid', name: buyList[0]};
            clog(best);
            buyList.shift();
            if (!buyList.length) autoBuyer = autoBuyerAfterBuyList;
            return;
        }
    }

    // Set price for first building of multi building purchase
    if (best.basePrice) best.price = best.basePrice;

    // Pop the n biggest wrinklers if we're unbuffed and more than n hours away from buying and have all wrinklers, and this will get us there
    if (!autoClicker || !autoBuyer || Object.keys(Game.buffs).length || Game.shimmerTypes['golden'].chain) return;

    const wrinklers = [];
    for (let i = 0; i < Game.getWrinklersMax(); ++i) {
        const wrinkler = Game.wrinklers[i];
        if (wrinkler.phase < 2) return;
        if (!wrinkler.type) wrinklers.push(wrinkler);
    }
    wrinklers.sort((a,b) => { return b.sucked - a.sucked; });

    const wrinklerThreshold = currentCps * 60 * 60;

    let suckMult = 1.1;
    if (Game.Has('Sacrilegious corruption')) suckMult *= 1.05;
    if (Game.Has('Wrinklerspawn'))           suckMult *= 1.05;
    if (Game.auraMult('Dragon Guts'))        suckMult *= 1.2;
    if (Game.hasGod) {
        const godLvl = Game.hasGod('scorn');
        if      (godLvl == 1) suckMult *= 1.15;
        else if (godLvl == 2) suckMult *= 1.1;
        else if (godLvl == 3) suckMult *= 1.05;
    }

    let sucked = 0;
    for (let i = 0; i < wrinklers.length; ++i) {
        if (Game.cookies + wrinklerThreshold * (i + 1) >= best.price) return;
        const wrinkler = wrinklers[i];
        sucked += wrinkler.sucked * suckMult;
        if (Game.cookies + sucked >= best.price) {
            for (let j = 0; j <= i; ++j) {
                wrinklers[j].hp = -10;
                console.log(`Popped a wrinkler for ${(wrinklers[j].sucked * suckMult).toPrecision(4)} cookies`);
            }
            return;
        }
    }
}

function formatTime(date) {
    return (date.getHours() - 1) % 12 + 1 + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
}

function playTheGame() {
    if (autoBuyer && best.name && Game.cookies >= best.price && best.type != 'nothing') {
        if (buyList.length) {
            if(best.name == buyList[0].replace(' Tier', '') && ['building', 'upgrade'].includes(best.type)) {
                if      (best.type == 'building') Game.Objects[best.name].buy(1);
                else if (best.type == 'upgrade') Game.Upgrades[best.name].buy(1);
                if (!best.buyCount || best.buyCount == 1) {
                    buyList.shift();
                    if (!buyList.length) autoBuyer = autoBuyerAfterBuyList;
                }
            }
        } else if (best.type == 'building'){
            if (best.price < Game.cookies / 1000000) bulkBuy = 50;
            else if (best.price < Game.cookies / 10000) bulkBuy = 10;
            else bulkBuy = 1;
            Game.Objects[best.name].buy(bulkBuy);
            if (bulkBuy > 1) console.log(`Bought ${bulkBuy} ${best.name}`);
        } else if (best.type == 'upgrade') {
            if (['santa', 'dragon'].includes(best.name)) {
                Game.specialTab = best.name;
                Game.ToggleSpecialMenu(1);
                upgradeSpecial(best.name);
            } else Game.Upgrades[best.name].buy(1);
        } else if (best.type == 'aura') {
            Game.specialTab = 'dragon';
            Game.ToggleSpecialMenu(1);

            const highestBuilding = getHighestBuilding();
            if (highestBuilding.id) {
                Game.ObjectsById[highestBuilding.id].sacrifice(1);
                console.log(`Sacrificed a ${highestBuilding.name}`);
            }

            const dragonAura = Object.values(Game.dragonAuras).find(aura => {return aura.name == best.name}).id;
            if (Game.dragonLevel == Game.dragonLevels.length - 1 && best.name != 'Dragonflight') Game.dragonAura2 = dragonAura;
            else Game.dragonAura = dragonAura;
        } else if (best.type == 'wrinkler') Game.wrinklers[Number(best.name)].hp = -10;
        else if (best.type == 'sell') Game.Objects[best.name].sell(1);

        best = {};
    } else if (autoClicker && Game.shimmers.length && (!Game.HasAchiev('Early bird') || Game.HasAchiev('Fading luck') || Game.shimmers[0].type != 'golden' || Game.shimmers[0].life<Game.fps)) {
        while (Game.shimmers.length) {
            console.log(`Popped a ${Game.shimmers[0].type.replace('golden', 'cookie')}`);
            Game.shimmers[0].pop();
        }
    } else if (!best.name) {
        if (restoreHeight && Game.HasAchiev('Cookie-dunker')) {
            Game.LeftBackground.canvas.height = restoreHeight;
            restoreHeight = 0;
        }

        doOrCalculateBestThing();
    }

    now = new Date();
    if (!removedRateLimiter) {
        while (now - Game.lastClick < 20) now = new Date();
    }

    const nowSeconds = now.getSeconds();

    if (recalculate && !(nowSeconds % 10)) {
        best = {};
        recalculate = 0;
    } else if (!recalculate && nowSeconds % 10) recalculate = 1;

    if (autoClicker) {
        Game.ClickCookie();
        ++clickCount;
        ++clickCountShort;

        if (clickCountFlag && !(nowSeconds % 10)) {
            if (clickCountStarted) {
                trueClicksPerSecond = 1;

                if (!(now.getMinutes() % 30) && !nowSeconds) {
                    clickCountStart = clickCountMark;
                    clickCountMark = now;
                    clickCount -= clickCountSaved;
                    clickCountSaved = clickCount;
                }

                clickCountShortStart = clickCountShortMark;
                clickCountShortMark = now;
                clickCountShort -= clickCountShortSaved;
                clickCountShortSaved = clickCountShort;

            } else resetClickCount();

            clickCountFlag = 0;
        } else if (!clickCountFlag && nowSeconds % 10) clickCountFlag = 1;
    }
}

let gameAscend = Game.Ascend;
let gameReincarnate = Game.Reincarnate;
let gameClickCookie = Game.ClickCookie;
let insertedAscendHooks;
let botInterval;
let clickIntervals = [];
let best;
let autoBuyer;
let buyList = [];
let autoBuyerAfterBuyList;
let bulkBuy = 1;
let restoreHeight;
let now;
let autoClicker;
let extraClicker;
let removedRateLimiter;
let recalculate;
let clickCountFlag;
let clickCountStart;
let clickCountMark;
let clickCountStarted;
let clicksPerSecond;
let trueClicksPerSecond;
let clickCount;
let clickCountSaved;
let clickCountShortStart;
let clickCountShortMark;
let clickCountShort;
let clickCountShortSaved;
const defaultArgs = ['', 0, '', 0, 0, ''];
let currentCps;

function initializeAutoClicker() {
    Game.volume = 0;
    Game.prefs.fancy = 0;
    Game.prefs.filters = 0;
    Game.prefs.particles = 0;
    Game.prefs.numbers = 0;
    Game.prefs.milk = 0;
    Game.prefs.cursors = 0;
    Game.prefs.wobbly = 0;
    Game.prefs.monospace = 1;
    Game.prefs.format = 0;
    Game.prefs.notScary = 1;

    Game.Win('Cheated cookies taste awful');
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

function removeRateLimiter() {
    Game.ClickCookie = new Function(
        'e',
        'amount',
        Game.ClickCookie.toString()
            .replace(/^function( anonymous)?\(e,amount\n?\)(\n\t\t)? ?\{\n/, '')
            .replace(' || now-Game.lastClick<1000/((e?e.detail:1)===0?3:50)', '')
            .replace(/\n?\}$/,''),
    );
    removedRateLimiter = 1;
}

function extraClick() {
    if (autoClicker) {
        Game.ClickCookie();
        ++clickCount;
        ++clickCountShort;
    }
}

function stopExtraClicking() {
    Game.ClickCookie = gameClickCookie;
    removedRateLimiter = 0;
    for (let i = 0; i < extraClicker; ++i) clearInterval(clickIntervals[i])
}

function startExtraClicking(power) {
    extraClicker = Math.max(extraClicker, power);
    stopExtraClicking();
    extraClicker = power;
    removeRateLimiter();
    for (let i = 0; i < extraClicker; ++i) clickIntervals[i] = setInterval(extraClick);
}

function resetClickCount() {
    now = new Date();
    clickCountStarted = 1;

    clickCountStart = now;
    clickCountMark = now;
    clickCount = 0;
    clickCountSaved = 0;

    clickCountShortStart = now;
    clickCountShortMark = now;
    clickCountShort = 0;
    clickCountShortSaved = 0;
}

function start(autoBuy, autoClick, extraClicks) {
    Game.Win('Third-party');

    if (!insertedAscendHooks) {
        Game.Ascend = function(bypass) {
            if (bypass) {
                pause();
                console.log('\nAscending, bot paused');
            }
            gameAscend(bypass);
        }
        Game.Reincarnate = function(bypass) {
            gameReincarnate(bypass);
            if (bypass) {
                console.log('\nReincarnating, bot started');
                start(autoBuyer, autoClicker, extraClicker);
            }
        }
        insertedAscendHooks = 1
    }

    best = {};
    recalculate = 1;
    clickCountStarted = 0;
    clickCountFlag = 1;

    pause();
    if (autoBuy) startBuying();
    else stopBuying();
    if (autoClick) startClicking();
    else stopClicking();
    botInterval = setInterval(playTheGame);
    if (extraClicks) startExtraClicking(extraClicks);
    else stopExtraClicking();
}

function pause() {
    clearInterval(botInterval);
    stopExtraClicking();
}

function buy(userOverride) {
    if (!buyList.length) autoBuyerAfterBuyList = autoBuyer;
    buyList.push(userOverride);
    autoBuyer = 1;
}

function startClicking() {
    autoClicker = 1;
    clicksPerSecond = 200;
    trueClicksPerSecond = 0;
    resetClickCount();
    initializeAutoClicker();
}

function stopClicking() {
    autoClicker = 0;
    clicksPerSecond = 0;
    trueClicksPerSecond = 0;
}

function startBuying() {
    autoBuyer = 1;
    if (buyList.length) autoBuyerAfterBuyList = 1;
}

function stopBuying() {
    autoBuyer = 0;
    autoBuyerAfterBuyList = 0;
    buyList = [];
}

function stop() {
    stopClicking();
    stopBuying();
    Game.Ascend = gameAscend;
    Game.Reincarnate = gameReincarnate;
    insertedAscendHooks = 0;
    pause();
}

start(0,0,0);