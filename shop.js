"use strict";

// ---------- SHOP ----------
function toggleShop(show) {
    document.getElementById('shop-menu')?.classList.toggle('hidden', !show);
    document.getElementById('main-menu')?.classList.toggle('hidden', show);
    if (show) renderShop();
}

let shopTab = 'cash';
function shopPrice(item) { return Math.round(item.price * (meta.blackCard ? 0.85 : 1)); }
function setShopTab(t) { shopTab = t; SFX.click(); renderShop(); }

function shopCard(o) {
    const card = document.createElement('div');
    card.className = `shop-card ${o.sold ? 'sold-out' : ''}`;
    card.innerHTML = `
        <div class="shop-top"><div class="shop-icon ${o.color}">${o.icon}</div>
        <div class="shop-txt"><h3 class="font-bold ${o.color}">${o.name}</h3><p class="text-xs text-gray-500">${o.desc}</p></div></div>
        <div class="shop-foot"><span class="shop-price ${o.mark ? 'text-cyan-300' : 'text-yellow-500'}">${o.priceText}</span>
        <button class="btn-retro shop-buy" ${o.sold || o.locked ? 'disabled' : ''}>${o.sold ? 'OWNED' : (o.btn || TEXT.en.shop_buy)}</button></div>`;
    if (!o.sold) card.querySelector('button').addEventListener('click', o.onBuy);
    return card;
}

function renderShop() {
    const grid = document.getElementById('shop-grid-container');
    if (!grid) return;
    grid.innerHTML = '';
    document.querySelectorAll('#shop-tabs .shop-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === shopTab));
    const mk = document.getElementById('shop-marks-display'); if (mk) mk.textContent = meta.marks || 0;
    const sub = document.getElementById('shop-subtitle');
    if (sub) sub.textContent = shopTab === 'cash' ? '"Everything here has a price. Not all of it is money."' : '"Marks are what the house keeps of you. Spend them before it does."';
    if (shopTab === 'marks') {
        MARKS_CATALOG.forEach(m => {
            const own = !m.repeat && (m.id === 'nightTuner' ? meta.nightTuner : m.id === 'brassKey' ? meta.brassKey : meta.blackCard);
            const afford = (meta.marks || 0) >= m.cost;
            grid.appendChild(shopCard({ name: m.n, desc: m.d, color: m.color, icon: m.icon, mark: true, sold: !!own,
                priceText: m.cost + ' MARKS', locked: !afford, onBuy: () => buyMarksItem(m) }));
        });
        return;
    }
    SHOP_CATALOG.forEach(item => {
        let soldOut = false;
        if (item.isCrate || item.grant || item.id === 'sedativePack' || item.id === 'tarotDeck') soldOut = false;
        else if (upgrades[item.id]) soldOut = true;
        grid.appendChild(shopCard({ name: item.en_n, desc: item.en_d, color: item.color, icon: item.icon, sold: soldOut,
            priceText: '$' + shopPrice(item), onBuy: () => (item.isCrate ? buyCrate() : buyItem(item)) }));
    });
}

function buyMarksItem(m) {
    if ((meta.marks || 0) < m.cost) { SFX.empty(); shakeElement(document.getElementById('shop-marks-display')); return; }
    if (m.id === 'sealedCard') {
        const a = (meta.arcana = meta.arcana || { owned: {}, seen: {}, played: {} });
        const left = Object.keys(ARCANA).filter(k => !a.owned[k]);
        if (!left.length) { SFX.empty(); setShopMsg('You already own every card.'); return; }
        const k = left[Math.floor(rnd() * left.length)]; a.owned[k] = 1; a.seen[k] = 1;
        setShopMsg('You break the seal: ' + ARCANA[k].name + '.');
    } else if (m.id === 'carePkg') { nextRunItems.push(randomItemKey(), randomItemKey()); setShopMsg('Two items wait for your next run.');
    } else if (m.id === 'deadDrop') { globalMoney += 1000; totalStats.moneyEarned += 1000; updateMoneyDisplay(true);
    } else if (m.id === 'nightTuner') { meta.nightTuner = 1; setShopMsg('The radio picks up three more tracks.');
    } else if (m.id === 'brassKey') { meta.brassKey = 1; setShopMsg('A cellar door in THE HOUSE has a lock now. You have the key.');
    } else if (m.id === 'blackCard') { meta.blackCard = 1; setShopMsg('Cash prices drop 15%.'); }
    meta.marks -= m.cost;
    SFX.buy(); SFX.win(); flashScreen('green'); saveGame(); renderShop();
    if (typeof renderMarksBox === 'function') renderMarksBox();
}
function setShopMsg(t) { const e = document.getElementById('shop-msg'); if (e) e.textContent = t; }

function buyCrate() {
    if (globalMoney < shopPrice({ price: 100 })) { shakeElement(document.getElementById('shop-money-display'));
        SFX.empty(); return; }
    globalMoney -= shopPrice({ price: 100 });
    const keys = Object.keys(ITEMS).filter(k => k !== 'PHANTOM');
    nextRunItems.push(keys[Math.floor(rnd() * keys.length)]);
    SFX.win();
    updateMoneyDisplay(true);
    renderShop();
    flashScreen('green');
    saveGame();
}

function buyItem(item) {
    if (globalMoney < shopPrice(item)) { shakeElement(document.getElementById('shop-money-display'));
        SFX.empty(); return; }
    globalMoney -= shopPrice(item);
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
    if (globalMoney >= 25000) unlockAchievement('TYCOON');
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
