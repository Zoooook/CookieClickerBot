This add-on plays Cookie Clicker. Copy the contents of CookieClickerBot.js into the console in your browser (F12) and press Enter. Do not do this twice without refreshing the page, or the add-on will not behave as you expect. The Firefox console is extremely laggy and badly formatted, use Chrome.

By default all it does is calculate the best thing to buy and print it in the console. It also has auto-buy and auto-click functionality, which you can toggle individually by typing startBuying(), stopBuying(), startClicking(), or stopClicking() into the console.

By default the game caps autoclickers at 50 clicks per second. The function startExtraClicking(n) modifies the game's code to remove this limitation, and adds n extra autoclickers, if the autoclicker is active. This can be considered a higher degree of cheating than just using the autoclicker. The function stopExtraClicking() turns this off. Pushing n very high will start to have diminishing returns at some point as your browser caps the page's resources, and will decrease the efficiency of the add-on's other functions, such as buying things quickly and getting all the cookie storm cookies.

The start() function also takes arguments for these. To turn on only the autobuyer, type start(1,0,0). To turn on only the autoclicker, type start(0,1,0). To turn on both, type start(1,1,0). To turn on both with 99 extra autoclickers, type start(1,1,99). To stop the add-on entirely, type stop(). This disables the other functions except for start().

The autobuyer buys buildings and upgrades, including Krumblor and Santa upgrades.

The autoclicker clicks the cookie, golden cookies, reindeer, sugar lumps, etc., and gets various other achievements. It also changes the season to get drops. If boosted, it clicks fastest if you close the dev tools and make the window as small as possible.

Dragon auras will only be set if the autoclicker and autobuyer are both active.

buy('thingName') will set a user override to buy the thing you specify before most other buildings or upgrades. It activates the autobuyer, but reverts to its previous state after your override is bought. You can use this function multiple times to queue up multiple buys. You can see this list in the userBuy variable. stopBuying() clears this override.

This add-on does not do ascensions or play mini-games.