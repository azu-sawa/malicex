"use strict";

// ---------- HORROR / MEMORY ----------
function randomHorrorEvent() {
    if (Math.random() < 0.28) {
        const sub = document.getElementById('subliminal');
        if (!sub) return;
        const poolChooser = Math.random();
        if (poolChooser < 0.85) sub.innerText = HORROR_WORDS[Math.floor(Math.random() * HORROR_WORDS
            .length)];
        else sub.innerText = DISTURBING_WORDS[Math.floor(Math.random() * DISTURBING_WORDS.length)]
            .toUpperCase();
        sub.style.opacity = 0.22;
        sub.style.transform = `translate(-50%, -50%) scale(${1 + (Math.random()*0.08)})`;
        setTimeout(() => { sub.style.opacity = 0;
            sub.style.transform = `translate(-50%, -50%) scale(1)`; }, 1800);
    }
    if (Math.random() < 0.08) { document.body.classList.add('flash-red');
        setTimeout(() => document.body.classList.remove('flash-red'), 100); }
}

function triggerMemory() {
    const el = document.getElementById('memory-flash');
    if (!el) return;
    let pool = [];
    if (DIALOGUE.en && DIALOGUE.en[storyMode]) {
        const role = DIALOGUE.en[storyMode];
        pool = (role.getHit || []).concat(role.start || []).concat(role.useItem || []);
    }
    if (!pool || pool.length === 0) pool = (DIALOGUE.en && DIALOGUE.en.dealer &&
        DIALOGUE.en.dealer.normal) ? DIALOGUE.en.dealer.normal : ["..."];
    el.innerText = pool[Math.floor(Math.random() * pool.length)];
    el.style.opacity = 1;
    setTimeout(() => el.style.opacity = 0, 3000);
}

function showDisturbingOverlay(text) {
    const el = document.getElementById('disturbing-overlay');
    if (!el) return;
    el.innerText = text;
    el.style.opacity = '1';
    el.classList.remove('disturb-flash');
    void el.offsetWidth;
    el.classList.add('disturb-flash');
    el.style.transform = 'translate(-50%,-50%) scale(1.02)';
    SFX.glitch();
    setTimeout(() => { el.style.transform = 'translate(-50%,-50%) scale(1)'; }, 700);
    setTimeout(() => { el.style.opacity = '0';
        el.classList.remove('disturb-flash'); }, 4200);
}

// ---------- GLITCH EFFECTS ----------
function randomMenuGlitch() {
    if (activeGame !== 'MENU') return;
    if (Math.random() > 0.4) return;
    const buttons = document.querySelectorAll('#main-menu .btn-retro');
    if (buttons.length === 0) return;
    const target = buttons[Math.floor(Math.random() * buttons.length)];
    target.classList.add('menu-item-glitch');
    const originalText = target.innerHTML;
    if (Math.random() < 0.2) {
        target.innerText = "DIE";
        target.style.borderColor = "red";
        target.style.color = "red";
        SFX.glitch();
    }
    setTimeout(() => {
        target.classList.remove('menu-item-glitch');
        target.innerHTML = originalText;
        target.style.borderColor = "";
        target.style.color = "";
    }, 200);
}

function randomScreenGlitch() {
    if (Math.random() < 0.7) return;
    const b = document.body;
    const originalFilter = b.style.filter;
    b.style.filter = "invert(1) hue-rotate(90deg)";
    b.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px)`;
    setTimeout(() => {
        b.style.filter = originalFilter;
        b.style.transform = "none";
    }, 50);
    SFX.glitch();
}
