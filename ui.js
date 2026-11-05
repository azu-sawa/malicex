"use strict";

// ---------- LANGUAGE ----------
// ---------- BOOT ----------
function enterGame() {
    initAudio();
    updateTexts();
    document.getElementById('startup-screen').classList.add('hidden');
    if (introSeen) showMenu();
    else determineStoryStart();
}

function updateTexts() {
    const T = TEXT.en;
    document.getElementById('hud-label').innerText = T.hud_cash;
    refreshAudioButtons();
    if (document.getElementById('select-title')) document.getElementById('select-title').innerText = T
    .sel_title;
    if (document.getElementById('sel-thief-title')) document.getElementById('sel-thief-title').innerText = T
        .sel_thief_t;
    if (document.getElementById('sel-thief-desc')) document.getElementById('sel-thief-desc').innerText = T
        .sel_thief_d;
    if (document.getElementById('sel-killer-title')) document.getElementById('sel-killer-title').innerText = T
        .sel_kill_t;
    if (document.getElementById('sel-killer-desc')) document.getElementById('sel-killer-desc').innerText = T
        .sel_kill_d;
    if (document.getElementById('menu-btn-normal')) document.getElementById('menu-btn-normal').innerHTML = T
        .menu_norm +
        " <span class='text-xs text-gray-500 block'>" + ('Free | Standard Horror') + "</span>";
    if (document.getElementById('menu-btn-hard')) document.getElementById('menu-btn-hard').innerHTML = T
        .menu_hard +
        " <span class='text-xs text-gray-500 block'>" + ('$200 | Smart AI') + "</span>";
    if (document.getElementById('menu-btn-merc')) document.getElementById('menu-btn-merc').innerHTML = T
        .menu_merc +
        " <span class='text-xs text-gray-500 block'>" + ('$2,000 | Elite Guard') + "</span>";
    if (document.getElementById('menu-btn-boss')) document.getElementById('menu-btn-boss').innerHTML = T
        .menu_boss +
        " <span class='text-xs text-gray-500 block'>" + ('$5,000 | Final Boss') + "</span>";
    if (document.getElementById('menu-btn-ancient')) document.getElementById('menu-btn-ancient').innerHTML = (
            'THE ANCIENT') +
        " <span class='text-xs text-gray-500 block'>" + ('$8,000 | Elder Horror') + "</span>";
    if (document.getElementById('menu-btn-endless')) document.getElementById('menu-btn-endless').innerHTML = T
        .menu_endless +
        " <span class='text-xs text-gray-500 block'>" + ('$500 | Survival') + "</span>";
    if (document.getElementById('menu-btn-shop')) document.getElementById('menu-btn-shop').innerText = T
        .menu_shop;
    if (document.getElementById('menu-btn-ach')) document.getElementById('menu-btn-ach').innerText = T
        .menu_ach;
    if (document.getElementById('menu-btn-ledger')) document.getElementById('menu-btn-ledger').innerText = "GRIMOIRE";
    if (document.getElementById('menu-btn-wipe')) document.getElementById('menu-btn-wipe').innerText = T
        .menu_wipe;
    if (document.getElementById('shop-subtitle')) document.getElementById('shop-subtitle').innerText = T
        .shop_sub;
    if (document.getElementById('shop-balance-lbl')) document.getElementById('shop-balance-lbl').innerText =
        T.shop_bal;
    if (document.getElementById('shop-btn-back')) document.getElementById('shop-btn-back').innerText = T
        .shop_back;
    const achH1 = document.querySelector('#achievements-screen h1');
    if (achH1) achH1.innerText = T.ach_title;
    if (document.getElementById('ach-subtitle')) document.getElementById('ach-subtitle').innerText = T
        .ach_sub;
    if (document.getElementById('ach-btn-back')) document.getElementById('ach-btn-back').innerText = T
        .shop_back;
    if (document.getElementById('bj-bet-lbl')) document.getElementById('bj-bet-lbl').innerText = T.bj_bet;
    if (document.getElementById('bj-btn-deal')) document.getElementById('bj-btn-deal').innerText = T.bj_deal;
    if (document.getElementById('bj-btn-exit')) document.getElementById('bj-btn-exit').innerText = T.bj_back;
    if (document.getElementById('bj-you-lbl')) document.getElementById('bj-you-lbl').innerText = T.bj_you;
    if (document.getElementById('cup-title')) document.getElementById('cup-title').innerText = T.cup_title;
    if (document.getElementById('cup-subtitle')) document.getElementById('cup-subtitle').innerHTML = T
        .cup_sub;
    if (document.getElementById('cup-msg')) document.getElementById('cup-msg').innerText = T.cup_msg;
    if (document.getElementById('cup-bet-lbl')) document.getElementById('cup-bet-lbl').innerText = T.bj_bet;
    if (document.getElementById('cup-btn-exit')) document.getElementById('cup-btn-exit').innerText = T
        .shop_back;
    if (document.getElementById('slot-msg')) document.getElementById('slot-msg').innerText = T.cup_msg;
    if (document.getElementById('slot-btn-exit')) document.getElementById('slot-btn-exit').innerText = T
        .shop_back;
    if (document.getElementById('hp-label-player')) document.getElementById('hp-label-player').innerText = T
        .hp_you;
    if (document.getElementById('lbl-shoot-d')) document.getElementById('lbl-shoot-d').innerText = T
        .lbl_shoot_d;
    if (document.getElementById('lbl-shoot-s')) document.getElementById('lbl-shoot-s').innerText = T
        .lbl_shoot_s;
    if (document.getElementById('btn-start')) document.getElementById('btn-start').innerHTML = T.btn_start +
        " <span class='text-sm opacity-50 ml-2'>[SPACE]</span>";
    if (document.getElementById('btn-reveal')) document.getElementById('btn-reveal').innerHTML = T
        .btn_reveal + " <span class='text-sm opacity-50 ml-2'>[SPACE]</span>";
    if (document.getElementById('res-btn-back')) document.getElementById('res-btn-back').innerText = T
        .res_back;
}

// ---------- STORY & INTRO ----------
function determineStoryStart() {
    // the sin is chosen once and stays until the save is erased
    document.getElementById('selection-screen').classList.remove('hidden');
    activeGame = 'SELECTION';
}

function chooseStory(m) {
    storyMode = m;
    meta.sinChosen = true;
    document.getElementById('selection-screen').classList.add('hidden');
    playCutscene(STORY_LINES.en[m]);
}

function playCutscene(lines) {
    const s = document.getElementById('intro-screen');
    const c = document.getElementById('intro-content');
    const btn = document.getElementById('skip-intro');
    if (!s || !c || !btn) return;
    c.innerHTML = '';
    btn.classList.add('hidden');
    s.classList.remove('hidden');
    document.getElementById('main-menu').classList.add('hidden');
    activeGame = 'CUTSCENE';
    let d = 0;
    lines.forEach((l, i) => {
        setTimeout(() => {
            const p = document.createElement('p');
            p.className = 'intro-text text-xl font-vt323';
            p.innerHTML = l;
            c.appendChild(p);
            if (i === lines.length - 1) {
                btn.classList.remove('hidden');
                saveGame();
            }
        }, d);
        d += 2500;
    });
}

function endIntro() {
    document.getElementById('intro-screen').classList.add('hidden');
    showMenu();
}

function showMenu() {
    updateV8Menu();
    updateTexts();
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('story-mode-indicator').innerText = `SUBJECT: ${storyMode}`;
    activeGame = 'MENU';
    Music.setScene('menu');
    updateMoneyDisplay();
    checkDailyLogin();
    updateSanityUI();
    renderLobby();
    showLobbyTab(settings.lobbyTab || 'play');
    rotateWhisper();
    if (PSY.abandoned) { unlockAchievement('ABANDONED'); }
    askName();
}

// ---------- TOGGLES ----------


function resetSave() {
    if (confirm('Erase all progress, settings and trophies on this device? This cannot be undone.')) {
        [VERSION, PREV_VERSION, LEGACY_VERSION, SETTINGS_KEY, AUDIO_PREF_KEY].forEach(k => Store.remove(k));
        location.reload();
    }
}

// ---------- LEDGER ----------
function openLedger() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('ledger-screen').classList.remove('hidden');
    activeGame = 'LEDGER';
    renderLedger();
}

function closeLedger() {
    document.getElementById('ledger-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    activeGame = 'MENU';
}

function renderLedger() {
    const stats = document.getElementById('stat-list');
    if (stats) {
        stats.innerHTML = `
                <div class="stat-row"><span>Total Kills:</span> <span class="stat-val text-red-500">${totalStats.kills}</span></div>
                <div class="stat-row"><span>Total Deaths:</span> <span class="stat-val text-red-700">${deathCount}</span></div>
                <div class="stat-row"><span>Total Earnings:</span> <span class="stat-val text-yellow-500">$${totalStats.moneyEarned}</span></div>
                <div class="stat-row"><span>Items Used:</span> <span class="stat-val text-blue-400">${totalStats.itemsUsed}</span></div>
                <div class="stat-row"><span>Minigames Played:</span> <span class="stat-val text-purple-400">${totalStats.minigamesPlayed}</span></div>
                <div class="stat-row"><span>Sanity Lost:</span> <span class="stat-val text-pink-500">${totalStats.sanityLoss}</span></div>
                <div class="stat-row"><span>Sanity Gained:</span> <span class="stat-val text-green-500">${totalStats.sanityGain}</span></div>
                <div class="stat-row"><span>Gauntlet Best:</span> <span class="stat-val text-amber-400">${meta.gauntletBest || 0}</span></div>
                <div class="stat-row"><span>Endings Found:</span> <span class="stat-val text-purple-400">${(meta.endings || []).length}/4</span></div>
                <div class="stat-row"><span>Ascension:</span> <span class="stat-val text-red-400">${meta.ascension || 0}/5</span></div>
                <div class="stat-row"><span>Matches Won:</span> <span class="stat-val text-green-400">${meta.wins}</span></div>
                <div class="stat-row"><span>Runs Started:</span> <span class="stat-val text-gray-300">${meta.runs}</span></div>
                <div class="stat-row"><span>Best Hi-Lo Streak:</span> <span class="stat-val text-cyan-400">${meta.bestHiLo}</span></div>
                <div class="stat-row"><span>Endless Record:</span> <span class="stat-val text-purple-500">${endlessHighScore} Rounds</span></div>
            `;
    }
    const guide = document.getElementById('sanity-guide');
    if (guide) {
        guide.innerHTML = SANITY_TIERS.map((t, i) => {
            const hi = i === 0 ? 100 : SANITY_TIERS[i - 1].min - 1;
            return `<div class="sanity-grimoire" style="border-color:${t.color}"><span style="color:${t.color}">${t.id} ${t.min}-${hi}</span><div class="text-gray-400">${t.hint}</div></div>`;
        }).join('');
    }
    const items = document.getElementById('item-list-ledger');
    if (items) {
        items.innerHTML = '';
        Object.keys(ITEMS).filter(k => k !== 'PHANTOM').forEach(k => {
            const item = ITEMS[k];
            const name = item.en.n;
            const desc = item.en.d;
            const div = document.createElement('div');
            div.className = 'ledger-item';
            div.innerHTML = `
                    <div class="text-3xl">${item.icon}</div>
                    <div><div class="font-bold ${item.color}">${name}${(meta.codex && meta.codex[k]) ? '' : ' <span class="codex-new">NOT USED YET</span>'}</div><div class="text-xs text-gray-400">${desc}${item.sanityCost ? ' (-' + item.sanityCost + ' Sanity)' : ''}${item.sanityGain ? ' (+' + item.sanityGain + ' Sanity)' : ''}</div></div>
                `;
            items.appendChild(div);
        });
    }
    const loreList = document.getElementById('lore-list-ledger');
    if (loreList) {
        const lh = loreList.previousElementSibling;
        if (lh) lh.textContent = `LORE PAGES ${unlockedLore.length}/${LORE_ENTRIES.length}`;
        loreList.innerHTML = '';
        LORE_ENTRIES.forEach(entry => {
            const isUnlocked = unlockedLore.includes(entry.id);
            const div = document.createElement('div');
            div.className = `lore-entry ${isUnlocked ? '' : 'locked'}`;
            div.innerHTML = isUnlocked ? entry.text : "[ PAGE MISSING ]";
            loreList.appendChild(div);
        });
    }
}
