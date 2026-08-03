const fs = require('fs');
const config = require('./temp_config.js');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

const colors = config.theme.extend.colors;
const fontFamilies = config.theme.extend.fontFamily || {};

// Add a landing-page class wrapper to isolate CSS
if (!page.includes('<div className="landing-page">')) {
    page = page.replace('<>', '<div className="landing-page">');
    page = page.replace('</>', '</div>');
}

// Replace bg-COLOR
for (const [key, value] of Object.entries(colors)) {
    const regex = new RegExp('(\\s|["\'])bg-' + key + '(?=[\\s"\'\/])', 'g');
    page = page.replace(regex, '$1bg-[' + value + ']');
}
// Replace text-COLOR
for (const [key, value] of Object.entries(colors)) {
    const regex = new RegExp('(\\s|["\'])text-' + key + '(?=[\\s"\'\/])', 'g');
    page = page.replace(regex, '$1text-[' + value + ']');
}
// Replace border-COLOR
for (const [key, value] of Object.entries(colors)) {
    const regex = new RegExp('(\\s|["\'])border-' + key + '(?=[\\s"\'\/])', 'g');
    page = page.replace(regex, '$1border-[' + value + ']');
}

// Replace font-FAMILY
for (const [key, val] of Object.entries(fontFamilies)) {
    const family = val[0].replace(/ /g, '_'); 
    const regex = new RegExp('(\\s|["\'])font-' + key + '(?=[\\s"\'\/])', 'g');
    page = page.replace(regex, '$1font-[\'' + family + '\']');
}

// Ensure landing.css is imported
if (!page.includes('import "./landing.css";')) {
    page = page.replace('"use client";', '"use client";\nimport "./landing.css";');
}

// Save back
fs.writeFileSync('src/app/page.tsx', page);

// Generate landing.css
let styles = fs.readFileSync('landing_styles.css', 'utf8');
let landingCss = `
.landing-page {
    background-color: #0F1115;
    color: #e2e2e9;
    min-height: 100vh;
}
${styles}
`;
fs.writeFileSync('src/app/landing.css', landingCss);
