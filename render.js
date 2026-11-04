"use strict";

// ---------- RENDER FUNCTIONS ----------
function renderUI() {
    renderHP();
    renderAmmo();
    const r = document.getElementById('player-items-row');
    if (!r) return;
    r.innerHTML = '';
    r.classList.toggle('no-items', !state.playerItems.length);
    const h = ['Q', 'W', 'E', 'R', 'T'];
    for (let i = 0; i < 5; i++) {
        const k = state.playerItems[i];
        if (k) {
            const d = ITEMS[k === 'PHANTOM' ? (state.phantomDisguise || 'GLASS') : k];
            const iName = d.en.n;
            const iDesc = d.en.d;
            const b = document.createElement('button');
            b.className = `item-btn relative border ${d.border} ${d.color} px-3 py-2 text-lg hover:bg-gray-800 flex items-center gap-2 ${state.isProcessing?'is-busy':''} font-vt323`;
            b.innerHTML = `<span class="key-hint border-gray-600 text-gray-400">${h[i]}</span> ${d.icon} <span class="item-name">${iName}</span>`;
            b.setAttribute('aria-label', iName + '. ' + iDesc);
            b.onclick = () => itemTap(i, k, b);
            b.onmouseenter = () => { if (!coarsePointer()) showItemInfo(k, false); };
            b.onfocus = () => { if (!coarsePointer()) showItemInfo(k, false); };
            b.onmouseleave = () => { if (!coarsePointer() && itemSel.i < 0) showItemInfo(null); };
            if (itemSel.i === i && itemSel.key === k) b.classList.add('sel');
            r.appendChild(b);
        } else {
            const emptySlot = document.createElement('div');
            emptySlot.className =
                'item-empty';
            emptySlot.innerHTML = '';
            r.appendChild(emptySlot);
        }
    }
    const dealerItemsEl = document.getElementById('dealer-items');
    if (dealerItemsEl) {
        dealerItemsEl.innerHTML = state.dealerItems.map(i => {
            const it = ITEMS[i];
            if (!it) return '';
            return `<span class="dealer-item ${it.color}" title="${it.en.n}">${it.icon}</span>`;
        }).join('');
    }
    const cur = state.playerItems[itemSel.i];
    if (itemSel.i >= 0 && cur === itemSel.key) showItemInfo(cur, true);
    else { itemSel = { i: -1, key: '' }; showItemInfo(null); }
}

function renderHP() {
    Music.setVitals(state.playerHp, state.maxPlayerHp, state.dealerHp, state.maxDealerHp);
    const hpFX = (hp, max) => {
        let h = '';
        for (let i = 0; i < max; i++) h += `<div class="hp-segment ${i<hp?'filled':'lost'}"></div>`;
        return h;
    };
    const ph = document.getElementById('player-hp');
    if (ph) ph.innerHTML = hpFX(state.playerHp, state.maxPlayerHp);
    const dh = document.getElementById('dealer-hp');
    if (dh) dh.innerHTML = hpFX(state.dealerHp, state.maxDealerHp);
    const vig = document.getElementById('vignette-fx');
    if (vig) {
        if (state.playerHp <= 1) vig.classList.add('pulse-danger');
        else vig.classList.remove('pulse-danger');
    }
}

function renderAmmo() {
    const cd = document.getElementById('chamber-display');
    if (cd && !HUD.loading) cd.innerHTML = state.chamber.map((l, i) => {
        let c = 'unknown';
        if (i === 0 && state.shellRevealed) c = (l !== !!state.shellLie) ? 'live' : 'blank';
        else if (state.phoneMark && state.phoneMark.i === i) c = state.phoneMark.live ? 'live' : 'blank';
        return `<div class="shell ${c}"></div>`;
    }).join('');
    if (!HUD.loading) {
        const lt = document.getElementById('live-txt');
        if (lt) lt.innerText = state.fog ? '?' : state.liveCount;
        const bt = document.getElementById('blank-txt');
        if (bt) bt.innerText = state.fog ? '?' : state.blankCount;
    }
    const dmg = document.getElementById('dmg-indicator');
    if (dmg) dmg.classList.toggle('hidden', state.damageMultiplier === 1);
    const cuff = document.getElementById('handcuff-indicator');
    if (cuff) cuff.classList.toggle('hidden', !state.handcuffed);
    const si = document.getElementById('shield-indicator');
    if (si) si.classList.toggle('hidden', !state.shieldPlayer);
    const dsi = document.getElementById('dshield-indicator');
    if (dsi) dsi.classList.toggle('hidden', !state.shieldDealer);
}

function renderCards(rev) {
    const ph = document.getElementById('player-hand');
    if (ph) { ph.innerHTML = '';
        state.playerHand.forEach(c => ph.appendChild(createCardEl(c, false))); }
    const dh = document.getElementById('dealer-hand');
    if (dh) { dh.innerHTML = '';
        state.dealerHand.forEach(c => dh.appendChild(createCardEl(c, !(rev || state.coldRead)))); }
    const ch = document.getElementById('community-cards');
    if (ch) { ch.innerHTML = '';
        state.communityCards.forEach(c => ch.appendChild(createCardEl(c, false))); }
}

function createCardEl(c, h) {
    const d = document.createElement('div');
    d.innerHTML = (h || !c) ? '' : `<span>${c.rank}</span><span class="text-3xl">${suitPx(c.suit)}</span>`;
    d.className = `card ${h?'hidden-card':''} ${c&&['♥','♦'].includes(c.suit)?'red':''}`;
    return d;
}

function toggleGunControls(e) {
    const c = document.getElementById('controls');
    if (!c) return;
    const s1 = c.querySelector('#btn-shoot-dealer');
    const s2 = c.querySelector('#btn-shoot-self');
    if (e && !state.isProcessing && state.turn === 'player') {
        if (s1) s1.classList.remove('hidden');
        if (s2) s2.classList.remove('hidden');
    } else {
        if (s1) s1.classList.add('hidden');
        if (s2) s2.classList.add('hidden');
    }
}
