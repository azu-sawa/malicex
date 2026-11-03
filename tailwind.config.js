// Static Tailwind build (replaces the CDN script). Rebuild with:  npm run build:css
// Palette is remapped to a soft CRT phosphor look: navy-black, cyan phosphor, amber, desaturated red.
const sky = { 200: '#bae6fd', 300: '#7dd3fc', 400: '#4cc3f9', 500: '#38bdf8', 600: '#2493cf', 700: '#1a72a3', 800: '#134f73', 900: '#0c3550', 950: '#071e2e' };
const amber = { 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d4880a', 700: '#a16207', 800: '#78490a', 900: '#4a2d08', 950: '#2a1a05' };
const red = { 200: '#fecaca', 300: '#f9a8a8', 400: '#f87171', 500: '#ef4444', 600: '#d64545', 700: '#b03a3a', 800: '#7f2d2d', 900: '#4a1f1f', 950: '#2a1212' };
module.exports = {
    content: ['./index.html', './js/**/*.js'],
    theme: {
        extend: {
            colors: {
                black: '#090a0f',
                green: sky,      // "green" in the markup now means cyan phosphor
                yellow: amber,
                red
            }
        }
    },
    corePlugins: {},
};
