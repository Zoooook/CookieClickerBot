// don't pop shiny wrinklers after achievement
// guard against all percents = 0
// take into account all achievements, careful with already gotten from previous ascension
// buildings for achievements at 50 etc
// double buildings + 5
// sugar lumps
// minigames
// grandmapocalypse
// ascension
// math for auras and grandmas

document.getElementById("game").style.top=0

function willHave(upgrade, testUpgrade) {
    return Game.Has(upgrade) || testUpgrade == upgrade;
}

function amount(building, testBuy) {
    return building.amount + (testBuy == building.name);
}

function calculateTieredCpsMult(me, testBuy, testUpgrade){
    var mult=1;
    for (var i in me.tieredUpgrades) {
        if (!Game.Tiers[me.tieredUpgrades[i].tier].special && willHave(me.tieredUpgrades[i].name, testUpgrade)) mult*=2;
    }
    for (var i in me.synergies){
        var syn=me.synergies[i];
        if (willHave(syn.name, testUpgrade)){
            if (syn.buildingTie1.name==me.name) mult*=(1+0.05*amount(syn.buildingTie2, testBuy));
            else if (syn.buildingTie2.name==me.name) mult*=(1+0.001*amount(syn.buildingTie1, testBuy));
        }
    }
    if (me.fortune && willHave(me.fortune.name, testUpgrade)) mult*=1.07;
    if (me.grandma && willHave(me.grandma.name, testUpgrade)) mult*=(1+amount(Game.Objects['Grandma'], testBuy)*0.01*(1/(me.id-1)));
    return mult;
}

function calculateClickCps(cookiesPs, testBuy, testUpgrade) {
    var add=0;
    if (willHave(   'Thousand fingers', testUpgrade)) add+=0.1;
    if (willHave(    'Million fingers', testUpgrade)) add+=0.5;
    if (willHave(    'Billion fingers', testUpgrade)) add+=5;
    if (willHave(   'Trillion fingers', testUpgrade)) add+=50;
    if (willHave('Quadrillion fingers', testUpgrade)) add+=500;
    if (willHave('Quintillion fingers', testUpgrade)) add+=5000;
    if (willHave( 'Sextillion fingers', testUpgrade)) add+=50000;
    if (willHave( 'Septillion fingers', testUpgrade)) add+=500000;
    if (willHave(  'Octillion fingers', testUpgrade)) add+=5000000;
    var num=0;
    for (var i in Game.Objects) {
        num+=amount(Game.Objects[i], testBuy);
    }
    num-=amount(Game.Objects['Cursor'], testBuy);
    add=add*num;

    if (willHave(      'Plastic mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave(         'Iron mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave(     'Titanium mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave(   'Adamantium mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave(  'Unobtainium mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave(      'Eludium mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave(    'Wishalloy mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave(   'Fantasteel mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave(   'Nevercrack mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave(    'Armythril mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave('Technobsidian mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave(   'Plasmarble mouse', testUpgrade)) add+=cookiesPs*0.01;
    if (willHave('Fortune #104',        testUpgrade)) add+=cookiesPs*0.01;

    var mult=1;
    if (willHave('Santa\'s helpers', testUpgrade)) mult*=1.1;
    if (willHave('Cookie egg',       testUpgrade)) mult*=1.1;
    if (willHave('Halo gloves',      testUpgrade)) mult*=1.1;
    mult*=Game.eff('click');

    if (Game.hasGod){
        var godLvl=Game.hasGod('labor');
        if (godLvl==1) mult*=1.15;
        else if (godLvl==2) mult*=1.1;
        else if (godLvl==3) mult*=1.05;
    }

    for (var i in Game.buffs){
        if (typeof Game.buffs[i].multClick != 'undefined') mult*=Game.buffs[i].multClick;
    }

    mult*=1+Game.auraMult('Dragon Cursor')*0.05;

    var out=mult*Game.ComputeCps(
        1,
        willHave('Reinforced index finger', testUpgrade) +
        willHave('Carpal tunnel prevention cream', testUpgrade) +
        willHave('Ambidextrous', testUpgrade),
        add
    );

    if (Game.hasBuff('Cursed finger')) out=Game.buffs['Cursed finger'].power;
    return out*clicksPerSecond;
}

function calculateCursorCps(testBuy, testUpgrade){
    var add=0;
    if (willHave(   'Thousand fingers', testUpgrade)) add+=0.1;
    if (willHave(    'Million fingers', testUpgrade)) add+=0.5;
    if (willHave(    'Billion fingers', testUpgrade)) add+=5;
    if (willHave(   'Trillion fingers', testUpgrade)) add+=50;
    if (willHave('Quadrillion fingers', testUpgrade)) add+=500;
    if (willHave('Quintillion fingers', testUpgrade)) add+=5000;
    if (willHave( 'Sextillion fingers', testUpgrade)) add+=50000;
    if (willHave( 'Septillion fingers', testUpgrade)) add+=500000;
    if (willHave(  'Octillion fingers', testUpgrade)) add+=5000000;

    var num=0;
    for (var i in Game.Objects) {
        if (Game.Objects[i].name!='Cursor') num+=amount(Game.Objects[i], testBuy);
    }
    add=add*num;

    var mult=1;
    mult*=calculateTieredCpsMult(Game.Objects['Cursor'], testBuy, testUpgrade);
    mult*=Game.eff('cursorCps');
    return Game.ComputeCps(
        0.1,
        willHave('Reinforced index finger', testUpgrade) + willHave('Carpal tunnel prevention cream', testUpgrade) + willHave('Ambidextrous', testUpgrade),
        add
    )*mult;
}

function calculateGrandmaCps(testBuy, testUpgrade){
    var mult=1;
    for (var i in Game.GrandmaSynergies){
        if (willHave(Game.GrandmaSynergies[i], testUpgrade)) mult*=2;
    }
    if (willHave('Bingo center/Research facility', testUpgrade)) mult*=4;
    if (willHave('Ritual rolling pins',            testUpgrade)) mult*=2;
    if (willHave('Naughty list',                   testUpgrade)) mult*=2;
    if (willHave('Elderwort biscuits',             testUpgrade)) mult*=1.02;

    mult*=Game.eff('grandmaCps');
    mult*=calculateTieredCpsMult(Game.Objects['Grandma'], testBuy, testUpgrade);

    var add=0;
    if (willHave('One mind',            testUpgrade)) add+=amount(Game.Objects['Grandma'], testBuy)*0.02;
    if (willHave('Communal brainsweep', testUpgrade)) add+=amount(Game.Objects['Grandma'], testBuy)*0.02;
    if (willHave('Elder Pact',          testUpgrade)) add+=amount(Game.Objects['Portal'], testBuy)*0.05;

    var num=0;
    for (var i in Game.Objects) {
        if (Game.Objects[i].name!='Grandma') num+=amount(Game.Objects[i], testBuy);
    }

    mult*=1+Game.auraMult('Elder Battalion')*0.01*num;

    return (Game.Objects['Grandma'].baseCps+add)*mult;
}

function calculateBuildingCps(buildingName, testBuy, testUpgrade){
    if (buildingName == 'Cursor') return calculateCursorCps(testBuy, testUpgrade);
    if (buildingName == 'Grandma') return calculateGrandmaCps(testBuy, testUpgrade);

    var mult=1;
    mult*=calculateTieredCpsMult(Game.Objects[buildingName], testBuy, testUpgrade);
    return Game.Objects[buildingName].baseCps*mult;
}

function calculateHeavenlyMultiplier(testUpgrade){
    var heavenlyMult=0;
    if (willHave('Heavenly chip secret',   testUpgrade)) heavenlyMult+=0.05;
    if (willHave('Heavenly cookie stand',  testUpgrade)) heavenlyMult+=0.20;
    if (willHave('Heavenly bakery',        testUpgrade)) heavenlyMult+=0.25;
    if (willHave('Heavenly confectionery', testUpgrade)) heavenlyMult+=0.25;
    if (willHave('Heavenly key',           testUpgrade)) heavenlyMult+=0.25;
    heavenlyMult*=1+Game.auraMult('Dragon God')*0.05;
    if (willHave('Lucky digit',  testUpgrade)) heavenlyMult*=1.01;
    if (willHave('Lucky number', testUpgrade)) heavenlyMult*=1.01;
    if (willHave('Lucky payout', testUpgrade)) heavenlyMult*=1.01;
    if (Game.hasGod){
        var godLvl=Game.hasGod('creation');
        if (godLvl==1) heavenlyMult*=0.7;
        else if (godLvl==2) heavenlyMult*=0.8;
        else if (godLvl==3) heavenlyMult*=0.9;
    }
    return heavenlyMult;
}

function calculateCps(testBuy, testBuyCount, testUpgrade, testAchievement, testSanta){
    var cookiesPs=0;
    var mult=1;
    //add up effect bonuses from building minigames
    var effs={};
    for (var i in Game.Objects){
        if (Game.Objects[i].minigameLoaded && Game.Objects[i].minigame.effs){
            var myEffs=Game.Objects[i].minigame.effs;
            for (var ii in myEffs){
                if (effs[ii]) effs[ii]*=myEffs[ii];
                else effs[ii]=myEffs[ii];
            }
        }
    }

    if (Game.ascensionMode!=1) mult+=parseFloat(Game.prestige)*0.01*Game.heavenlyPower*calculateHeavenlyMultiplier(testUpgrade);

    mult*=Game.eff('cps');

    if (willHave('Heralds', testUpgrade) && Game.ascensionMode!=1) mult*=1+0.01*Game.heralds;

    for (var i in Game.cookieUpgrades){
        var me=Game.cookieUpgrades[i];
        if (willHave(me.name, testUpgrade)){
            mult*=(1+(typeof(me.power)=='function'?me.power(me):me.power)*0.01);
        }
    }

    if (willHave('Specialized chocolate chips', testUpgrade)) mult*=1.01;
    if (willHave('Designer cocoa beans',        testUpgrade)) mult*=1.02;
    if (willHave('Underworld ovens',            testUpgrade)) mult*=1.03;
    if (willHave('Exotic nuts',                 testUpgrade)) mult*=1.04;
    if (willHave('Arcane sugar',                testUpgrade)) mult*=1.05;
    if (willHave('Increased merriness',         testUpgrade)) mult*=1.15;
    if (willHave('Improved jolliness',          testUpgrade)) mult*=1.15;
    if (willHave('A lump of coal',              testUpgrade)) mult*=1.01;
    if (willHave('An itchy sweater',            testUpgrade)) mult*=1.01;
    if (willHave('Santa\'s dominion',           testUpgrade)) mult*=1.2;
    if (willHave('Fortune #100',                testUpgrade)) mult*=1.01;
    if (willHave('Fortune #101',                testUpgrade)) mult*=1.07;

    var buildMult=1;
    if (Game.hasGod){
        var godLvl=Game.hasGod('asceticism');
        if (godLvl==1) mult*=1.15;
        else if (godLvl==2) mult*=1.1;
        else if (godLvl==3) mult*=1.05;

        var godLvl=Game.hasGod('ages');
        if (godLvl==1) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);
        else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);
        else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);

        var godLvl=Game.hasGod('decadence');
        if (godLvl==1) buildMult*=0.93;
        else if (godLvl==2) buildMult*=0.95;
        else if (godLvl==3) buildMult*=0.98;

        var godLvl=Game.hasGod('industry');
        if (godLvl==1) buildMult*=1.1;
        else if (godLvl==2) buildMult*=1.06;
        else if (godLvl==3) buildMult*=1.03;

        var godLvl=Game.hasGod('labor');
        if (godLvl==1) buildMult*=0.97;
        else if (godLvl==2) buildMult*=0.98;
        else if (godLvl==3) buildMult*=0.99;
    }

    if (willHave('Santa\'s legacy', testUpgrade)) mult*=1+(Game.santaLevel+1+testSanta)*0.03;

    for (var i in Game.Objects){
        var me=Game.Objects[i];
        var storedCps=calculateBuildingCps(me.name, testBuy, testUpgrade);
        if (Game.ascensionMode!=1) storedCps*=(1+me.level*0.01)*buildMult;
        var storedTotalCps=amount(me, testBuy)*storedCps;
        cookiesPs+=storedTotalCps;
    }

    if (willHave('"egg"', testUpgrade)) cookiesPs+=9;

    var milkProgress=(Game.AchievementsOwned + testAchievement)/25;
    var milkMult=1;
    if (willHave('Santa\'s milk and cookies', testUpgrade)) milkMult*=1.05;
    milkMult*=1+Game.auraMult('Breath of Milk')*0.05;
    if (Game.hasGod){
        var godLvl=Game.hasGod('mother');
        if (godLvl==1) milkMult*=1.1;
        else if (godLvl==2) milkMult*=1.05;
        else if (godLvl==3) milkMult*=1.03;
    }
    milkMult*=Game.eff('milk');

    var catMult=1;

    if (willHave('Kitten helpers',                            testUpgrade)) catMult*=(1+Game.milkProgress*0.1  *milkMult);
    if (willHave('Kitten workers',                            testUpgrade)) catMult*=(1+Game.milkProgress*0.125*milkMult);
    if (willHave('Kitten engineers',                          testUpgrade)) catMult*=(1+Game.milkProgress*0.15 *milkMult);
    if (willHave('Kitten overseers',                          testUpgrade)) catMult*=(1+Game.milkProgress*0.175*milkMult);
    if (willHave('Kitten managers',                           testUpgrade)) catMult*=(1+Game.milkProgress*0.2  *milkMult);
    if (willHave('Kitten accountants',                        testUpgrade)) catMult*=(1+Game.milkProgress*0.2  *milkMult);
    if (willHave('Kitten specialists',                        testUpgrade)) catMult*=(1+Game.milkProgress*0.2  *milkMult);
    if (willHave('Kitten experts',                            testUpgrade)) catMult*=(1+Game.milkProgress*0.2  *milkMult);
    if (willHave('Kitten consultants',                        testUpgrade)) catMult*=(1+Game.milkProgress*0.2  *milkMult);
    if (willHave('Kitten assistants to the regional manager', testUpgrade)) catMult*=(1+Game.milkProgress*0.175*milkMult);
    if (willHave('Kitten marketeers',                         testUpgrade)) catMult*=(1+Game.milkProgress*0.15 *milkMult);
    if (willHave('Kitten analysts',                           testUpgrade)) catMult*=(1+Game.milkProgress*0.125*milkMult);
    if (willHave('Kitten executives',                         testUpgrade)) catMult*=(1+Game.milkProgress*0.115*milkMult);
    if (willHave('Kitten angels',                             testUpgrade)) catMult*=(1+Game.milkProgress*0.1  *milkMult);
    if (willHave('Fortune #103',                              testUpgrade)) catMult*=(1+Game.milkProgress*0.05 *milkMult);

    mult*=catMult;

    var eggMult=1;
    if (willHave(  'Chicken egg', testUpgrade)) eggMult*=1.01;
    if (willHave(     'Duck egg', testUpgrade)) eggMult*=1.01;
    if (willHave(   'Turkey egg', testUpgrade)) eggMult*=1.01;
    if (willHave(    'Quail egg', testUpgrade)) eggMult*=1.01;
    if (willHave(    'Robin egg', testUpgrade)) eggMult*=1.01;
    if (willHave(  'Ostrich egg', testUpgrade)) eggMult*=1.01;
    if (willHave('Cassowary egg', testUpgrade)) eggMult*=1.01;
    if (willHave(   'Salmon roe', testUpgrade)) eggMult*=1.01;
    if (willHave(    'Frogspawn', testUpgrade)) eggMult*=1.01;
    if (willHave(    'Shark egg', testUpgrade)) eggMult*=1.01;
    if (willHave(   'Turtle egg', testUpgrade)) eggMult*=1.01;
    if (willHave(    'Ant larva', testUpgrade)) eggMult*=1.01;
    if (willHave(  'Century egg', testUpgrade)){
        //the boost increases a little every day, with diminishing returns up to +10% on the 100th day
        var day=Math.floor((Date.now()-Game.startDate)/1000/10)*10/60/60/24;
        day=Math.min(day,100);
        eggMult*=1+(1-Math.pow(1-day/100,3))*0.1;
    }

    mult*=eggMult;

    if (willHave('Sugar baking', testUpgrade)) mult*=(1+Math.min(100,Game.lumps)*0.01);

    mult*=1+Game.auraMult('Radiant Appetite');

    var n=Game.shimmerTypes['golden'].n;
    var auraMult=Game.auraMult('Dragon\'s Fortune');
    for (var i=0;i<n;i++){mult*=1+auraMult*1.23;}

    var rawCookiesPs=cookiesPs*mult;

    var sucking=0;
    for (var i in Game.wrinklers){
        if (Game.wrinklers[i].phase==2){
            sucking++;
        }
    }
    var suckRate=1/20;
    suckRate*=Game.eff('wrinklerEat');

    if (willHave('Elder Covenant', testUpgrade)) mult*=0.95;

    if (willHave('Golden switch [off]', testUpgrade)){
        var goldenSwitchMult=1.5;
        if (willHave('Residual luck', testUpgrade)){
            var upgrades=Game.goldenCookieUpgrades;
            for (var i in upgrades) {if (willHave(upgrades[i], testUpgrade)) goldenSwitchMult+=0.1;}
        }
        mult*=goldenSwitchMult;
    }
    if (willHave('Shimmering veil [off]', testUpgrade)){
        var veilMult=0.5;
        if (willHave('Reinforced membrane', testUpgrade)) veilMult+=0.1;
        mult*=1+veilMult;
    }
    if (willHave('Magic shenanigans', testUpgrade)) mult*=1000;
    if (willHave('Occult obstruction', testUpgrade)) mult*=0;

    for (var i in Game.buffs){
        if (typeof Game.buffs[i].multCpS != 'undefined') mult*=Game.buffs[i].multCpS;
    }

    cookiesPs*=mult

    return cookiesPs + calculateClickCps(cookiesPs, testBuy, testUpgrade);
}

function calculateBuildingPrice(buildingName, testBuy, testBuyCount, testUpgrade, testAchievement, testSanta){
    var building = Game.Objects[buildingName];
    var price = building.basePrice*Math.pow(Game.priceIncrease,Math.max(0,building.amount-building.free));

    if (willHave('Season savings',    testUpgrade)) price*=0.99;
    if (willHave('Santa\'s dominion', testUpgrade)) price*=0.99;
    if (willHave('Faberge egg',       testUpgrade)) price*=0.99;
    if (willHave('Divine discount',   testUpgrade)) price*=0.99;
    if (willHave('Fortune #100',      testUpgrade)) price*=0.99;

    price*=1-Game.auraMult('Fierce Hoarder')*0.02;
    if (Game.hasBuff('Everything must go')) price*=0.95;
    if (Game.hasBuff('Crafty pixies'))      price*=0.98;
    if (Game.hasBuff('Nasty goblins'))      price*=1.02;
    if (building.fortune && willHave(building.fortune.name, testUpgrade)) price*=0.93;
    price*=Game.eff('buildingCost');

    if (Game.hasGod){
        var godLvl=Game.hasGod('creation');
        if (godLvl==1) price*=0.93;
        else if (godLvl==2) price*=0.95;
        else if (godLvl==3) price*=0.98;
    }
    return Math.ceil(price);
}

function calculateUpgradePrice(upgradeName, testBuy, testBuyCount, testUpgrade, testAchievement, testSanta){
    var upgrade = Game.Upgrades[upgradeName];
    var price=upgrade.basePrice;

    if (upgrade.priceFunc) price=upgrade.priceFunc(this);
    if (price==0) return 0;

    if (upgrade.pool!='prestige'){
        if (willHave('Toy workshop', testUpgrade)) price*=0.95;
        if (willHave('Five-finger discount', testUpgrade)) price*=Math.pow(0.99,amount(Game.Objects['Cursor'], testBuy)/100);
        if (willHave('Santa\'s dominion',    testUpgrade)) price*=0.98;
        if (willHave('Faberge egg',          testUpgrade)) price*=0.99;
        if (willHave('Divine sales',         testUpgrade)) price*=0.99;
        if (willHave('Fortune #100',         testUpgrade)) price*=0.99;
        if (Game.hasBuff('Haggler\'s luck'))               price*=0.98;
        if (Game.hasBuff('Haggler\'s misery'))             price*=1.02;
        price*=1-Game.auraMult('Master of the Armory')*0.02;
        price*=Game.eff('upgradeCost');
        if (upgrade.pool=='cookie' && willHave('Divine bakeries', testUpgrade)) price/=5;
    }
    return Math.ceil(price);
}

function calculatePrice(type, name, testBuy, testBuyCount, testUpgrade, testAchievement, testSanta) {
    if (type == 'building') return calculateBuildingPrice(name, testBuy, testBuyCount, testUpgrade, testAchievement, testSanta);
    if (type == 'upgrade') return calculateUpgradePrice(name, testBuy, testBuyCount, testUpgrade, testAchievement, testSanta);
}

function clog(message, thing) {
    console.log(message + ' ' + thing.type + ': ' + thing.name + ', +' + thing.percent + '%, $' + thing.price + ', value: ' + thing.value);
}

function calculateBestThing(){
    if (['easter', 'halloween'].includes(Game.season)) {
        for (var i in Game.wrinklers) {
            var me = Game.wrinklers[i];
            if (me.phase > 0) {
                best = {type: 'wrinkler', name: i.toString(), percent: 0, price: 0, value: 0};
                clog('wrinkler', best);
                return;
            }
        }
    } else {
        var popWrinkler = 1;
        var bestWrinkler = 0;
        var bestWrinklerSucked = 0;

        for (var i=0; i<Game.getWrinklersMax(); ++i) {
            var me = Game.wrinklers[i];
            if (me.phase == 0 || me.hp <= .5) {
                popWrinkler = 0;
                break;
            }
            if (me.sucked > bestWrinklerSucked) {
                bestWrinkler = i;
                bestWrinklerSucked = me.sucked;
            }
        }

        if (popWrinkler) {
            best = {type: 'wrinkler', name: bestWrinkler.toString(), percent: 0, price: 0, value: 0};
            clog('wrinkler', best);
            return;
        }
    }

    var things = {};
    var args = {};
    var defaultArgs = ['', 0, '', 0, 0];
    var currentCps = calculateCps(...defaultArgs);

    var hasLovelyCookies = Game.Has('Pure heart biscuits') && Game.Has('Ardent heart biscuits') && Game.Has('Sour heart biscuits') && Game.Has('Weeping heart biscuits') && Game.Has('Golden heart biscuits') && Game.Has('Eternal heart biscuits');
    var hasSpookyCookies = Game.Has('Skull cookies') && Game.Has('Ghost cookies') && Game.Has('Bat cookies') && Game.Has('Slime cookies') && Game.Has('Pumpkin cookies') && Game.Has('Eyeball cookies') && Game.Has('Spider cookies');
    var eggs=0;
    for (var i in Game.easterEggs) {
        if (Game.HasUnlocked(Game.easterEggs[i])) eggs++;
    }

    for (var i in Game.UpgradesInStore) {
        var me = Game.UpgradesInStore[i];
        if (
            me.name ==  'Festive biscuit' && Game.season != 'christmas'                                                                           && Game.santaLevel  < 14 && Game.Has(  'Titanium mouse') ||
            me.name == 'Lovesick biscuit' && Game.season != 'valentines'                                   && !hasLovelyCookies && Game.santaLevel == 14 && Game.Has('Fantasteel mouse') ||
            me.name ==    'Bunny biscuit' && Game.season != 'easter'                         && eggs  < 20 &&  hasLovelyCookies && Game.santaLevel == 14                                 ||
            me.name ==  'Ghostly biscuit' && Game.season != 'halloween' && !hasSpookyCookies && eggs == 20 &&  hasLovelyCookies && Game.santaLevel == 14                                 ||
            me.name ==  'Festive biscuit' && Game.season != 'christmas' &&  hasSpookyCookies && eggs == 20 &&  hasLovelyCookies
        ) {
            best = {type: 'upgrade', name: me.name, percent: 0, value: 0};
            best.price = calculateUpgradePrice(me.name, ...defaultArgs);
            clog('season', best);
            return;
        }

        if (me.pool != 'toggle' && !me.isVaulted() && me.name != 'One mind') {
            args[me.name] = ['', 0, me.name, 0, 0];
            things[me.name] = {type: 'upgrade', name: me.name, cps: calculateCps(...args[me.name])};
            things[me.name].percent = (things[me.name].cps / currentCps - 1) * 100;
            things[me.name].price = calculateUpgradePrice(me.name, ...defaultArgs);
            things[me.name].value = things[me.name].percent / things[me.name].price;
        }
    }

    for (var i in Game.Objects) {
        var me = Game.Objects[i];
        args[me.name] = [me.name, 1, '', 0, 0];
        things[me.name] = {type: 'building', name: me.name, cps: calculateCps(...args[me.name])};
        things[me.name].percent = (things[me.name].cps / currentCps - 1) * 100;
        things[me.name].price = calculateBuildingPrice(me.name, ...defaultArgs);
        things[me.name].value = things[me.name].percent / things[me.name].price;
    }

    console.log(things);

    best = {value: 0};
    for (var i in things) {
        var thing = things[i];
        if (thing.value > best.value) best = thing;
    }

    if (best.name) {
        clog('best', best);

        var betterThings = [best.name];

        while (betterThings.length) {
            var better = {value: -1};
            for (var i=0; i<betterThings.length; ++i) {
                var thing = things[betterThings[i]];
                if (thing.value > better.value) better = thing;
            }

            if (best.name != better.name) {
                best = better;
                clog('better', best);
            }

            betterThings = [];
            for (var i in things) {
                var thing = things[i];
                if (thing.name != best.name && thing.price < best.price) {
                    var timeTillBothThingsIfFirst = thing.price/currentCps + calculatePrice(best.type, best.name, ...args[thing.name])/thing.cps;
                    var timeTillBothThingsIfSecond = best.price/currentCps + calculatePrice(thing.type, thing.name, ...args[best.name])/best.cps;
                    if (timeTillBothThingsIfFirst < timeTillBothThingsIfSecond) betterThings.push(thing.name);
                }
            }
        }
    }

    if (Game.Has('A festive hat') && Game.santaLevel<14 && !Game.santaDrops.includes(best.name)) {
        var santaPrice = Math.pow(Game.santaLevel+1,Game.santaLevel+1);

        var upgradeSanta = 1;
        for (var i in things) {
            var thing = things[i];
            if (Game.santaDrops.includes(thing.name)) {
                upgradeSanta = 0;
                if (thing.price + santaPrice < best.price) {
                    best = thing;
                    clog('santa', best);
                }
            }
        }

        if (upgradeSanta) {
            args.santa = ['', 0, '', 0, 1];
            if (Game.santaLevel == 5 || Game.santaLevel == 13) args.santa[3] = 1;
            things.santa = {type: 'santa', name: 'santa', cps: calculateCps(...args.santa)};
            things.santa.percent = (things.santa.cps / currentCps - 1) * 100;
            things.santa.price = santaPrice;
            things.santa.value = things.santa.percent / things.santa.price;

            if (things.santa.value > best.value || things.santa.price <= best.price) {
                best = things.santa;
                clog('santa', best);
            }
        }
    }

    if (Game.Has('A crumbly egg')) {
        if (Game.dragonLevel < 24) things.dragon = {type: 'dragon', name: 'dragon', percent: 0, price: 0, value: 0};

        if (Game.dragonLevel < 24) {
            if (Game.dragonLevels[Math.max(Game.dragonLevel,5)].cost()) {
                if (Game.dragonLevel < 22) {
                    things.dragon.price = Game.ObjectsById[Math.max(Game.dragonLevel-5,0)].price*20/3;
                    for(var i=Game.dragonLevel; i<5; ++i) things.dragon.price += 1000000*Math.pow(2, i);
                } else {
                    for (var i in Game.Objects) {
                        var me = Game.Objects[i];
                        things.dragon.price += me.price*20/3;
                    }
                }

                best = things.dragon;
                clog('dragon', best);
            }
        }

        if (Game.dragonLevel >= 14 && !Game.hasAura('Dragonflight')) {
            things.aura = {type: 'aura', name: 'Dragonflight', percent: 0, price: 0, value: 0};
            best = things.aura;
            clog('aura', best);
        } else if (Game.dragonLevel == 24 && !Game.hasAura('Radiant Appetite')) {
            things.aura = {type: 'aura', name: 'Radiant Appetite', percent: 0, price: 0, value: 0};
            best = things.aura;
            clog('aura', best);
        }
    }

    for (var i in things) {
        var thing = things[i];
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
            'A crumbly egg'
        ].includes(thing.name) && (!best.price || thing.price <= best.price)) {
            best = thing;
            clog('override', best);
        }
    }
}

function playTheGame(){
    if (best.name && buyThings && Game.cookies > best.price) {
        if (best.type == 'building'){
            if (best.price < Game.cookies/1000000) Game.Objects[best.name].buy(50);
            if (best.price < Game.cookies/1000) Game.Objects[best.name].buy(10);
            else Game.Objects[best.name].buy(1);
            if (!Game.HasAchiev('Just wrong')) Game.Objects['Grandma'].sell(1);
        } else if (best.type == 'upgrade') Game.Upgrades[best.name].buy();
        else if (best.type == 'santa') {
            Game.specialTab='santa';
            Game.ToggleSpecialMenu(1);
            Game.UpgradeSanta();
        } else if (best.type == 'dragon') {
            Game.specialTab='dragon';
            Game.ToggleSpecialMenu(1);
            Game.UpgradeDragon();
        } else if (best.type == 'aura') {
            Game.specialTab='dragon';
            Game.ToggleSpecialMenu(1);
            var highestBuilding={};
            for (var i in Game.Objects) {
                if (Game.Objects[i].amount>0) highestBuilding=Game.Objects[i];
            }
            if (highestBuilding.id) Game.ObjectsById[highestBuilding.id].sacrifice(1);
            if (best.name == 'Dragonflight') Game.dragonAura=10;
            else if (best.name == 'Radiant Appetite') Game.dragonAura2=15;
        } else if (best.type == 'wrinkler') Game.wrinklers[Number(best.name)].hp = -10;

        best = {};
    } else if(Game.shimmers.length && (Game.HasAchiev('Fading luck') || Game.shimmers[0].type != 'golden' || Game.shimmers[0].life<Game.fps)) Game.shimmers[0].pop();
    else if (!best.name) {
        if (restoreHeight && Game.HasAchiev('Cookie-dunker')) {
            Game.LeftBackground.canvas.height = restoreHeight;
            restoreHeight = 0;
        }
        calculateBestThing();
    }

    var now = new Date();
    var clickCountSeconds = now.getSeconds();
    if (clickCountFlag && !clickCountSeconds) {
        best = {};

        if (clickCountStarted) {
            if (!now.getMinutes()) {
                clickCountStart = new Date();
                clickCount = 0;
            } else {
                clicksPerSecond = clickCount*1000/(now-clickCountStart);
                console.log(clicksPerSecond + ' clicks per second');
            }
        } else {
            clickCountStarted = 1;
            clickCountStart = new Date();
            clickCount = 0;
        }
        clickCountFlag = 0;
    } else if (!clickCountFlag && clickCountSeconds) clickCountFlag = 1;
    ++clickCount;

    Game.ClickCookie();
}

function initialize(){
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

var botInterval;
var best;
var buyThings = 1;
var restoreHeight;
var clickCountFlag;
var clickCountStart;
var clickCountStarted;

var clicksPerSecond = 150;
var clickCount = 0;

function startBuying(){
    buyThings = 1;
}

function stopBuying(){
    buyThings = 0;
}

function start(){
    best = {};
    clickCountStarted = 0;
    clickCountFlag = 1;

    clearInterval(botInterval);
    botInterval = setInterval(playTheGame);
}

function stop(){
    clearInterval(botInterval);
}

initialize();
start();
