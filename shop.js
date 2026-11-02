"use strict";

// ---------- SHOP ----------
function toggleShop(show) {
    document.getElementById('shop-menu')?.classList.toggle('hidden', !show);
    document.getElementById('main-menu')?.classList.toggle('hidden', show);
    if (show) renderShop();
}

function renderShop() {
    const grid = document.getElementById('shop-grid-container');
    if (!grid) return;
    grid.innerHTML = '';
    SHOP_CATALOG.forEach(item => {
        let soldOut = false;
        if (item.id === 'crate') soldOut = false;
        else if (item.id === 'sedativePack') soldOut = false;
        else if (item.id === 'tarotDeck') soldOut = false;
        else if (item.grant) soldOut = false;
        else if (upgrades[item.id]) soldOut = true;
        const name = item.en_n;
        const desc = item.en_d;
        const btnText = TEXT.en.shop_buy;
        const card = document.createElement('div');
        card.className = `shop-card ${soldOut?'sold-out':''}`;
        card.innerHTML = `
                <div class="shop-icon ${item.color}">${item.icon}</div>
                <div><h3 class="font-bold ${item.color}">${name}</h3><p class="text-xs text-gray-500">${desc}</p></div>
                <div class="flex justify-between items-end mt-2">
                    <span class="text-yellow-500 text-lg">$${item.price}</span>
                    <button class="btn-retro text-xs py-1 px-2" ${soldOut?'disabled':''}>${btnText}</button>
                </div>
            `;
        const btn = card.querySelector('button');
        if (!soldOut) {
            if (item.isCrate) btn.addEventListener('click', buyCrate);
            else btn.addEventListener('click', () => buyItem(item));
        }
        grid.appendChild(card);
    });
}

function buyCrate() {
    if (globalMoney < 100) { shakeElement(document.getElementById('shop-money-display'));
        SFX.empty(); return; }
    globalMoney -= 100;
    const keys = Object.keys(ITEMS).filter(k => k !== 'PHANTOM');
    nextRunItems.push(keys[Math.floor(rnd() * keys.length)]);
    SFX.win();
    updateMoneyDisplay(true);
    renderShop();
    flashScreen('green');
    saveGame();
}

function buyItem(item) {
    if (globalMoney < item.price) { shakeElement(document.getElementById('shop-money-display'));
        SFX.empty(); return; }
    globalMoney -= item.price;
    SFX.buy();
    if (item.id === 'sedativePack') { for (let i = 0; i < 3; i++) nextRunItems.push('SEDATIVE'); } else if (
        item.id === 'tarotDeck') {
        nextRunItems.push('TAROT');
    } else {
        if (item.grant) { item.grant.forEach(k => nextRunItems.push(k)); } else { upgrades[item.id] = true; }
    }
    SFX.win();
    updateMoneyDisplay(true);
    renderShop();
    flashScreen('green');
    saveGame();
}

// ---------- MONEY ----------
function updateMoneyDisplay(gained) {
    const md = document.getElementById('money-display');
    if (md) { md.innerText = globalMoney; if (gained) { md.classList.remove('money-gain');
            void md.offsetWidth;
            md.classList.add('money-gain'); } }
    const smd = document.getElementById('shop-money-display');
    if (smd) smd.innerText = globalMoney;
    const bossBtn = document.getElementById('menu-btn-boss');
    if (bossBtn) bossBtn.classList.toggle('hidden', globalMoney < 5000);
    const ancientBtn = document.getElementById('menu-btn-ancient');
    if (ancientBtn) ancientBtn.classList.toggle('hidden', globalMoney < 8000);
    const endlessBtn = document.getElementById('menu-btn-endless');
    if (endlessBtn) endlessBtn.classList.toggle('hidden', globalMoney < 500);
    const mercBtn = document.getElementById('menu-btn-merc');
    if (mercBtn) mercBtn.disabled = globalMoney < 2000;
    const hardBtn = document.getElementById('menu-btn-hard');
    if (hardBtn) hardBtn.disabled = globalMoney < 200;
    if (globalMoney >= 5000) unlockAchievement('RICH_KID');
}

// ---------- DAILY LOGIN ----------
function checkDailyLogin() {
    const now = new Date();
    const today = now.toDateString();
    const last = new Date(lastLogin).toDateString();
    if (today !== last) {
        document.getElementById('btn-daily-login').classList.remove('hidden');
    }
}

function claimDailyReward() {
    globalMoney += 500;
    totalStats.moneyEarned += 500;
    lastLogin = new Date().getTime();
    saveGame();
    updateMoneyDisplay(true);
    flashScreen('green');
    SFX.win();
    document.getElementById('btn-daily-login').classList.add('hidden');
}
