"use strict";

// =====================================================================
// PIXEL ART ICONS - replaces every emoji in the game.
// Each sprite is an 8x8 grid. One character = one pixel, '.' = transparent.
// Sprites are rasterised once to tiny PNG data-URIs, shown with
// `image-rendering: pixelated`, and sized in `em` so they scale like text.
//
//   px('eye')            -> '<i class="px px-eye"></i>'   (use inside innerHTML)
//   suitPx('♠')          -> sprite for a card suit
//
// To add an icon: add a row block to PX_SPRITES, then call px('name').
// =====================================================================
const PX_PALETTE = {
    // muted, slightly green-tinted palette so icons sit inside the CRT phosphor look
    k: '#050805', w: '#d8e4cf', g: '#7f8f7a', d: '#3a463a',
    r: '#d11f2a', R: '#6e0f14', o: '#d9731c', y: '#cfae2e', Y: '#7d5a12',
    l: '#8fd13a', G: '#1f9d4a', c: '#3ad6b4', b: '#3a74c9', B: '#173a73',
    p: '#9a4fd6', P: '#55208a', m: '#e0508f', M: '#8f1f55', n: '#7a3f14',
    f: '#e8c8a4', t: '#1f9d8a'
};

const PX_SPRITES = {
    disk: ['kkkkkkk.', 'kwwwwwkk', 'kwggggwk', 'kwwwwwwk', 'kddddddk', 'kdwwwwdk', 'kdwkwwdk', '.kkkkkk.'],
    eye: ['........', '..kkkk..', '.kwwwwk.', 'kwwbbwwk', 'kwwbkwwk', '.kwwwwk.', '..kkkk..', '........'],
    skull: ['..wwww..', '.wwwwww.', 'wwkwwkww', 'wwkwwkww', '.wwwwww.', '..wkkw..', '..wwww..', '..k.k.k.'],
    cherry: ['.....GG.', '....G.G.', '...G..G.', '.rr..rr.', 'rrrr.rrr', 'rwrr.rwr', 'rrrr.rrr', '.rr..rr.'],
    lemon: ['........', '..GG....', '.yyyyyy.', 'yyyyyyyy', 'yywyyyyy', 'yyyyyyyy', '.yyyyyyY', '..yyyY..'],
    bell: ['...yy...', '..yyyy..', '.yyyyyy.', '.ywyyyy.', '.yyyyyy.', 'yyyyyyyy', 'YYYYYYYY', '...kk...'],
    gem: ['........', '..cccc..', '.cwcccb.', 'cwccccbb', '.cccbbb.', '..cbbb..', '...bb...', '........'],
    seven: ['rrrrrrrr', 'rrrrrrrr', '.....rr.', '....rr..', '...rr...', '..rr....', '..rr....', '..rr....'],
    demon: ['r......r', 'rr....rr', '.rrrrrr.', 'rrwrrwrr', 'rrkrrkrr', '.rrrrrr.', '.rwwwwr.', '..rrrr..'],
    shield: ['cccccccc', 'cwccccbc', 'cwccccbc', 'cwccccbc', '.cccccb.', '.cccccb.', '..ccbb..', '...bb...'],
    magnifier: ['..kkkk..', '.kcccck.', 'kcwcccck', 'kcccccck', 'kcccccck', '.kcccck.', '..kkkkkn', '.......n'],
    card: ['kkkkkkkk', 'kwwwwwwk', 'kwwrrwwk', 'kwrrrrwk', 'kwrrrrwk', 'kwwrrwwk', 'kwwwwwwk', 'kkkkkkkk'],
    speaker: ['...w....', '..ww..w.', 'wwww.w.w', 'wwww.w.w', 'wwww.w.w', '..ww..w.', '...w....', '........'],
    speakerLow: ['...w....', '..ww....', 'wwww.w..', 'wwww.w..', 'wwww.w..', '..ww....', '...w....', '........'],
    speakerOff: ['...w....', '..ww.r.r', 'wwww..r.', 'wwww.r.r', 'wwww....', '..ww....', '...w....', '........'],
    trophy: ['yyyyyyyy', 'y.yyyy.y', 'y.yyyy.y', '.yyyyyy.', '..yyyy..', '...yy...', '..YYYY..', '.YYYYYY.'],
    brain: ['..mmmm..', '.mmMmmm.', 'mmmmMmmm', 'mMmmmmMm', 'mmmMmmmm', '.mmmmmm.', '..mmmm..', '...mm...'],
    knife: ['.......w', '......ww', '.....wg.', '....wg..', '...wg...', '.nnw....', 'nnn.....', 'nn......'],
    cigarette: ['.....g..', '......g.', '.....g..', '........', 'rrYwwwww', 'rrYwwwww', 'rrYwwwww', '........'],
    bolt: ['....yy..', '...yy...', '..yy....', '.yyyyyy.', '....yy..', '...yy...', '..yy....', '..y.....'],
    pill: ['........', '.bbbwww.', 'bbbbwwww', 'bwbbwwww', 'bbbbwwww', '.bbbwww.', '........', '........'],
    voodoo: ['..ffff..', '.fkffkf.', '.ffffff.', '..frrf..', '.pppppp.', 'pppppppp', '.pppppp.', '..p..p..'],
    drop: ['...r....', '...rr...', '..rrrr..', '.rrrrrr.', '.rwrrrr.', '.rrrrrr.', '..rrrr..', '........'],
    moon: ['..dddd..', '.dkkkkd.', 'dkkkkkkd', 'dkkkkkkd', 'dkkkkkrd', 'dkkkkkrd', '.dkkkkd.', '..dddd..'],
    fog: ['..ggg...', '.ggggg..', 'ggggggg.', '........', '.ggggg..', 'ggggggg.', '.gggggg.', '........'],
    sparkle: ['...y....', '...y....', '..yyy...', 'yyyyyyy.', '..yyy...', '...y....', '...y....', '........'],
    chain: ['.ggg....', 'g...g...', 'g..gggg.', '.ggg...g', '...g...g', '...g..g.', '....ggg.', '........'],
    dove: ['.....ww.', '...wwwwo', '..wwwww.', '.wwwww..', 'wwwwww..', '.ww.ww..', '........', '........'],
    ear: ['..ffff..', '.ffffff.', 'ff..fff.', 'ff.ff.ff', 'ff.f..ff', '.ff..ff.', '..ff.f..', '...fff..'],
    beer: ['.wwwww..', 'wwwwwww.', 'yyyyyyyy', 'yyyyyy.y', 'yyyyyy.y', 'yyyyyyyy', 'yYyYyYy.', 'YYYYYYY.'],
    clover: ['.GG..GG.', 'GGGGGGGG', '.GGGGGG.', '..GGGG..', '.GGGGGG.', 'GGGGGGGG', '.GG..GG.', '...G....'],
    mask: ['wwwwwwww', 'wkkwwkkw', 'wkkwwkkw', 'wwwwwwww', '.wwwwww.', '..wrrw..', '...ww...', '........'],
    phone: ['.kkkkk..', 'kgggggk.', 'kgkkkgk.', 'kgggggk.', 'kgkgkgk.', 'kgggggk.', '.kkkkk..', '........'],
    ghost: ['..wwww..', '.wwwwww.', 'wwkwwkww', 'wwkwwkww', 'wwwwwwww', 'wwwwwwww', 'wwwwwwww', 'w.ww.ww.'],
    crate: ['nnnnnnnn', 'nYnnnnYn', 'nnYnnYnn', 'nnnYYnnn', 'nnnYYnnn', 'nnYnnYnn', 'nYnnnnYn', 'nnnnnnnn'],
    bone: ['........', 'ww....ww', 'wwwwwwww', 'wwwwwwww', 'ww....ww', '........', '........', '........'],
    lock: ['..gggg..', '.g....g.', '.g....g.', 'yyyyyyyy', 'yyykkyyy', 'yyykkyyy', 'yyyyyyyy', 'YYYYYYYY'],
    lungs: ['...kk...', '..mkkm..', '.mmkkmm.', 'mmmkkmmm', 'mmmkkmmm', 'mmmkkmmm', '.mmkkmm.', '........'],
    nut: ['.nnnnnn.', 'nnYYYYnn', 'nY....Yn', 'nY....Yn', 'nnYYYYnn', '.nnnnnn.', '........', '........'],
    backpack: ['..nnnn..', '.nnnnnn.', 'nnnnnnnn', 'nnYYYYnn', 'nnYYYYnn', 'nnnnnnnn', 'nnnnnnnn', '.nnnnnn.'],
    heart: ['.rr..rr.', 'rrrrrrrr', 'rwrrrrrr', 'rwrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...', '........'],
    coin: ['..yyyy..', '.yyyyyy.', 'yyyYYyyy', 'yyYyyYyy', 'yyYyyYyy', 'yyyYYyyy', '.yyyyyy.', '..yyyy..'],
    moneybag: ['..nnnn..', '...nn...', '.GGGGGG.', 'GGGyyGGG', 'GGyGGGGG', 'GGGyyGGG', 'GGGGGyGG', '.GGGGGG.'],
    burst: ['y..r..y.', '.y.r.y..', '..yrry..', 'rrrooorr', '..yrry..', '.y.r.y..', 'y..r..y.', '........'],
    hole: ['.gggggg.', 'gddddddg', 'gdkkkkdg', 'gdkkkkdg', 'gdkkkkdg', 'gdkkkkdg', 'gddddddg', '.gggggg.'],
    ice: ['cccccccc', 'cwwcccbc', 'cwcccccb', 'cccccccb', 'cccccccb', 'cccccbbb', 'cbbbbbbb', 'bbbbbbbb'],
    cross: ['r......r', 'rr....rr', '.rr..rr.', '..rrrr..', '..rrrr..', '.rr..rr.', 'rr....rr', 'r......r'],
    bed: ['n.......', 'n.......', 'nwwbbbbb', 'nwwbbbbb', 'nnnnnnnn', 'n......n', 'n......n', '........'],
    candle: ['...y....', '..yoy...', '..yoy...', '...w....', '..www...', '..www...', '..www...', '..www...'],
    dice: ['kkkkkkkk', 'kwwwwwwk', 'kwkwwkwk', 'kwwwwwwk', 'kwwwwwwk', 'kwkwwkwk', 'kwwwwwwk', 'kkkkkkkk'],
    hand: ['.f.f.f..', '.f.f.fff', '.ffffff.', '.ffffff.', '.ffffff.', '..ffff..', '..ffff..', '........'],
    gift: ['.rr..rr.', '..rrrr..', 'oooroooo', 'oooroooo', 'rrrrrrrr', 'oooroooo', 'oooroooo', 'oooroooo'],
    bandage: ['........', '.ffffff.', 'ffwkwkff', 'ffkwkwff', '.ffffff.', '........', '........', '........'],
    door: ['.nnnnnn.', 'nnYYYYnn', 'nYnnnnYn', 'nYnnnnYn', 'nYnnnyYn', 'nYnnnnYn', 'nYnnnnYn', 'nnnnnnnn'],
    timer: ['...ww...', '.wwwwww.', 'wwwwwkww', 'wwwwkwww', 'wwwkkwww', 'wwwwwwww', '.wwwwww.', '........'],
    spade: ['...kk...', '..kkkk..', '.kkkkkk.', 'kkkkkkkk', 'kkkkkkkk', '.kkkkkk.', '...kk...', '..kkkk..'],
    club: ['..kkkk..', '..kkkk..', '.kkkkkk.', 'kk.kk.kk', 'kkkkkkkk', 'kkkkkkkk', '...kk...', '..kkkk..'],
    suitHeart: ['.rr..rr.', 'rrrrrrrr', 'rrrrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...', '........'],
    diamond: ['...rr...', '..rrrr..', '.rrrrrr.', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...', '........']
};

// names that reuse another sprite
const PX_ALIAS = { skull2: 'skull', heartSuit: 'heart', chain2: 'chain' };
// suits are alpha masks painted with the card's own colour (green phosphor, red for hearts/diamonds)
const PX_MASK = ['spade', 'club', 'diamond', 'suitHeart'];
const PX_SUIT = { '♠': 'spade', '♣': 'club', '♥': 'suitHeart', '♦': 'diamond' };

function pxRasterize(rows, scale) {
    scale = scale || 1;
    const c = document.createElement('canvas');
    c.width = 8 * scale; c.height = 8 * scale;
    const ctx = c.getContext('2d');
    rows.forEach((row, y) => {
        for (let x = 0; x < 8; x++) {
            const col = PX_PALETTE[row[x]];
            if (col) { ctx.fillStyle = col; ctx.fillRect(x * scale, y * scale, scale, scale); }
        }
    });
    return c.toDataURL('image/png');
}

function installPixelStyles() {
    const css = ['.px{display:inline-block;width:1em;height:1em;background-size:100% 100%;background-repeat:no-repeat;' +
        'image-rendering:pixelated;image-rendering:crisp-edges;vertical-align:-0.14em;font-style:normal;flex-shrink:0;' +
        'filter:saturate(.9) drop-shadow(0 0 1px rgba(90,255,130,.35))}',
        '.px-lg{width:1.5em;height:1.5em}', '.px-xl{width:2em;height:2em}'];
    Object.keys(PX_SPRITES).forEach(name => {
        if (PX_MASK.includes(name)) {
            const u = pxRasterize(PX_SPRITES[name], 8);
            css.push(`.px-${name}{background:currentColor;-webkit-mask:url(${u}) center/100% 100% no-repeat;mask:url(${u}) center/100% 100% no-repeat;filter:none}`);
        } else css.push(`.px-${name}{background-image:url(${pxRasterize(PX_SPRITES[name])})}`);
    });
    Object.keys(PX_ALIAS).forEach(a => {
        css.push(`.px-${a}{background-image:url(${pxRasterize(PX_SPRITES[PX_ALIAS[a]])})}`);
    });
    const st = document.createElement('style');
    st.id = 'pixel-icons';
    st.textContent = css.join('\n');
    document.head.appendChild(st);
}

function px(name, extra) {
    return `<i class="px px-${name}${extra ? ' ' + extra : ''}" aria-hidden="true"></i>`;
}
function suitPx(suit) { return px(PX_SUIT[suit] || 'spade'); }

installPixelStyles();
