import fs from 'node:fs';import path from 'node:path';
const legalFooter=fs.readFileSync('components/legal-footer.html','utf8').trim();
const shared=fs.readFileSync('components/header.html','utf8').trim();
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(file.endsWith('.html')){let html=fs.readFileSync(file,'utf8');if(/http-equiv="refresh"/i.test(html))continue;
html=html.replace(/<!--lp-header:start-->[\s\S]*?<!--lp-header:end-->/g,'');
html=html.replace(/<header\b[\s\S]*?<\/header>/gi,'').replace(/<nav\b[^>]*class="[^"]*lex-multipage-nav[^"]*"[^>]*>[\s\S]*?<\/nav>/gi,'');
html=html.replace(/<body\b[^>]*>/i,match=>match+'<!--lp-header:start-->'+shared+'<!--lp-header:end-->');
html=html.replace(/<link\b[^>]*href="\/assets\/lexpuente-header\.css(?:\?[^"]*)?"[^>]*>/g,'').replace(/<script\b[^>]*src="\/assets\/lexpuente-header.js"[^>]*><\/script>/g,'');
html=html.replace(/<link\b[^>]*href="\/assets\/scp-prueba-b\.css(?:\?[^"]*)?"[^>]*>/g,'');
html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/assets/lexpuente-header.css?v=20261120-logo-profesor"><link rel="stylesheet" href="/assets/scp-prueba-b.css?v=20261120"></head>').replace(/<\/body>/i,'<script src="/assets/lexpuente-header.js" defer></script></body>');
html=html.replace(/<article\b[^>]*class="[^"]*\blp-v([12])\b[^>]*>/g,(match,code)=>match+'<span class="lp-service-code lp-service-code-'+code+'" aria-label="Referencia LP-0'+code+'">LP‑0'+code+'</span>');
// Re-running the synchronizer must not duplicate a card reference.
html=html.replace(/(<span class="lp-service-code[^>]*>[\s\S]*?<\/span>)(?:<span class="lp-service-code[^>]*>[\s\S]*?<\/span>)+/g,'$1');
html=html.replace(/<nav\b[^>]*class="lp-legal-footer"[^>]*>[\s\S]*?<\/nav>/g,'');if(!/<footer\b/i.test(html))html=html.replace(/<\/body>/i,'<footer></footer></body>');html=html.replace(/<\/footer>/i,legalFooter+'</footer>');
fs.writeFileSync(file,html)}}}
walk('web');
