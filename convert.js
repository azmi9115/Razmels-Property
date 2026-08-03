const fs = require('fs');

function htmlToJsx(html) {
  return html
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Self close img, br, hr, input
    .replace(/<img([^>]+[^\/])>/g, '<img$1 />')
    .replace(/<br([^>]+[^\/])?>/g, '<br$1 />')
    .replace(/<hr([^>]+[^\/])?>/g, '<hr$1 />')
    .replace(/<input([^>]+[^\/])>/g, '<input$1 />')
    .replace(/style="([^"]+)"/g, (match, p1) => {
        const rules = p1.split(';').filter(Boolean);
        const styleObj = rules.reduce((acc, rule) => {
            const parts = rule.split(':');
            if (parts.length < 2) return acc;
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            if(!key || !value) return acc;
            const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
            acc += `"${camelKey}": "${value}", `;
            return acc;
        }, '');
        return `style={{${styleObj}}}`;
    });
}

function processFile(inputFile, outputFile, componentName) {
  let content = fs.readFileSync(inputFile, 'utf8');
  
  // Extract body content
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    console.log('No body found in', inputFile);
    return;
  }
  
  let bodyHtml = bodyMatch[1];
  
  // Convert HTML to JSX
  let jsxContent = htmlToJsx(bodyHtml);
  
  const finalCode = `"use client";\n\nimport Link from "next/link";\nimport Image from "next/image";\n\nexport default function ${componentName}() {\n  return (\n    <>\n      ${jsxContent}\n    </>\n  );\n}\n`;
  
  fs.writeFileSync(outputFile, finalCode);
  console.log('Processed', inputFile, 'to', outputFile);
}

processFile('downloaded_landing.html', 'src/app/page.tsx', 'LandingPage');
processFile('downloaded_login.html', 'src/app/login/page.tsx', 'LoginPage');
