import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const assets = path.join(root, 'web/assets');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'scp-ad-'));
const W = 1600;
const H = 900;
const FPS = 24;
const SCENE_SECONDS = 5.2;
const FADE = 0.6;
const colors = { green: '#06291e', greenLight: '#0c3b2c', gold: '#d8b777', cream: '#f4ead6', burgundy: '#581010' };
const bridge = path.join(assets, 'puente-emblema-20oct.webp');
const portrait = path.join(assets, 'foto-original-lexpuente.png');
const frames = [];

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function text(lines, x, y, size, color, options = {}) {
  const { family = 'Arial,sans-serif', anchor = 'start', weight = 400, letterSpacing = 0, lineHeight = size * 1.22, italic = false } = options;
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}"${italic ? ' font-style="italic"' : ''}>${lines.map((line, i) => `<tspan x="${x}" dy="${i ? lineHeight : 0}">${escapeXml(line)}</tspan>`).join('')}</text>`;
}

function brandTag(x = 124, y = 102, anchor = 'start') {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${colors.gold}" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="4">SERVICIOS CANAL PUENTE <tspan fill="${colors.cream}">· SCP</tspan></text>`;
}

function base(color, output) {
  run('magick', ['-size', `${W}x${H}`, `xc:${color}`, output]);
}

let compositeCount = 0;
function composeImage(backgroundImage, overlayImage, output, geometry, resize = null) {
  let source = overlayImage;
  if (resize) {
    source = path.join(temp, `composite-${++compositeCount}.png`);
    run('magick', [overlayImage, '-resize', resize, source]);
  }
  run('magick', [backgroundImage, source, '-geometry', geometry, '-compose', 'over', '-composite', output]);
}

function cover(input, output) {
  run('magick', [input, '-resize', `${W}x${H}^`, '-gravity', 'center', '-extent', `${W}x${H}`, output]);
}

function svgOverlay(markup, output) {
  const source = path.join(temp, path.basename(output, '.png') + '.svg');
  fs.writeFileSync(source, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a8854d"/><stop offset=".5" stop-color="#f2d795"/><stop offset="1" stop-color="#a8854d"/></linearGradient>
      <linearGradient id="photoShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colors.green}" stop-opacity=".97"/><stop offset=".44" stop-color="${colors.green}" stop-opacity=".89"/><stop offset=".68" stop-color="${colors.green}" stop-opacity=".32"/><stop offset="1" stop-color="${colors.green}" stop-opacity=".08"/></linearGradient>
      <linearGradient id="photoBottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colors.green}" stop-opacity="0"/><stop offset="1" stop-color="${colors.green}" stop-opacity=".72"/></linearGradient>
      <linearGradient id="loopColor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colors.burgundy}"/><stop offset=".47" stop-color="#81233a"/><stop offset=".53" stop-color="#1b6846"/><stop offset="1" stop-color="${colors.greenLight}"/></linearGradient>
    </defs>${markup}</svg>`);
  run('inkscape', [source, '--export-type=png', `--export-filename=${output}`, `--export-width=${W}`, `--export-height=${H}`]);
}

function makeFrame(number, bgPath, markup) {
  const overlay = path.join(temp, `overlay-${number}.png`);
  const frame = path.join(temp, `frame-${number}.png`);
  svgOverlay(markup, overlay);
  run('magick', [bgPath, overlay, '-compose', 'over', '-composite', frame]);
  frames.push(frame);
}

function frameBorder() {
  return `<rect x="50" y="42" width="1500" height="816" rx="27" fill="none" stroke="url(#goldLine)" stroke-width="2" opacity=".86"/>`;
}

// 1 · Introduce the brand and its role over the approved bridge image.
const b1 = path.join(temp, 'background-01.png');
base(colors.green, b1);
composeImage(b1, bridge, b1, '+0+275', '1600x900');
makeFrame('01', b1, `<rect width="1600" height="900" fill="${colors.green}" fill-opacity=".08"/>${frameBorder()}
  ${brandTag(126, 112)}<path d="M126 138 H1474" stroke="url(#goldLine)" stroke-width="1.5" opacity=".72"/>
  ${text(['Un canal de confianza para', 'encontrar el servicio adecuado'], 800, 206, 52, colors.cream, { family: 'Georgia,serif', anchor: 'middle', weight: 500, lineHeight: 64 })}
  <rect x="275" y="744" width="1050" height="83" rx="41" fill="${colors.green}" fill-opacity=".88" stroke="#d8b777" stroke-opacity=".72"/>
  ${text(['Conectamos Usuarios Titulares con Usuarios Especialistas de distintos sectores.'], 800, 795, 25, colors.cream, { anchor: 'middle', weight: 500 })}`);

// 2 · Human, personal orientation with the founder photo already approved for the site.
const b2 = path.join(temp, 'background-02.png');
cover(portrait, b2);
makeFrame('02', b2, `<rect width="1600" height="900" fill="url(#photoShade)"/><rect width="1600" height="900" fill="url(#photoBottom)"/>${frameBorder()}
  <text x="126" y="180" fill="${colors.gold}" font-family="Arial,sans-serif" font-size="19" font-weight="700" letter-spacing="4">ORIENTACIÓN HUMANA, PASO A PASO</text>
  ${text(['Te escuchamos.', 'Te acompañamos.'], 126, 302, 72, colors.cream, { family: 'Georgia,serif', weight: 500, lineHeight: 82 })}
  <path d="M126 496 H430" stroke="url(#goldLine)" stroke-width="3"/>
  ${text(['Entendemos lo que necesitas y te ayudamos', 'a valorar opciones claras para avanzar.'], 126, 560, 29, colors.cream, { lineHeight: 43 })}`);

// 3 · Explain the simple connection between both communities through services.
const b3 = path.join(temp, 'background-03.png');
base(colors.green, b3);
makeFrame('03', b3, `${frameBorder()}<text x="800" y="149" text-anchor="middle" fill="${colors.gold}" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="4">UN PUNTO DE ENCUENTRO</text>
  ${text(['Conectamos lo que buscas', 'con quien puede ayudarte.'], 800, 245, 65, colors.cream, { family: 'Georgia,serif', anchor: 'middle', weight: 500, lineHeight: 76 })}
  <rect x="98" y="450" width="440" height="176" rx="24" fill="#103c2d" stroke="${colors.gold}" stroke-width="2"/>
  <circle cx="170" cy="538" r="34" fill="none" stroke="${colors.gold}" stroke-width="3"/><circle cx="170" cy="528" r="10" fill="${colors.gold}"/><path d="M148 565 Q170 539 192 565" fill="none" stroke="${colors.gold}" stroke-width="4" stroke-linecap="round"/>
  <text x="230" y="523" fill="${colors.gold}" font-family="Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="2">QUIEN BUSCA</text><text x="230" y="568" fill="${colors.cream}" font-family="Georgia,serif" font-size="28">Usuarios Titulares</text>
  <path d="M560 538 H665" stroke="url(#goldLine)" stroke-width="4"/><path d="m649 522 21 16-21 16" fill="none" stroke="${colors.gold}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="686" y="450" width="228" height="176" rx="24" fill="${colors.gold}"/><text x="800" y="522" text-anchor="middle" fill="${colors.green}" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="3">SERVICIOS</text><text x="800" y="566" text-anchor="middle" fill="${colors.green}" font-family="Georgia,serif" font-size="21">distintos sectores</text>
  <path d="M935 538 H1040" stroke="url(#goldLine)" stroke-width="4"/><path d="m1024 522 21 16-21 16" fill="none" stroke="${colors.gold}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="1062" y="450" width="440" height="176" rx="24" fill="#35111d" stroke="${colors.gold}" stroke-width="2"/>
  <circle cx="1134" cy="538" r="34" fill="none" stroke="${colors.gold}" stroke-width="3"/><path d="M1111 551 Q1134 523 1157 551 M1118 525 Q1134 508 1150 525" fill="none" stroke="${colors.gold}" stroke-width="4" stroke-linecap="round"/>
  <text x="1193" y="523" fill="${colors.gold}" font-family="Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="2">QUIEN OFRECE</text><text x="1193" y="568" fill="${colors.cream}" font-family="Georgia,serif" font-size="28">Usuarios Especialistas</text>
  ${text(['Un canal para acercar necesidades, servicios y profesionales.'], 800, 716, 26, colors.cream, { anchor: 'middle' })}`);

// 4 · Make the breadth of sectors easy to understand at a glance.
const b4 = path.join(temp, 'background-04.png');
base(colors.green, b4);
let sectorCards = '';
const sectors = ['TRÁMITES Y DOCUMENTACIÓN', 'SALUD Y ODONTOLOGÍA', 'VIVIENDA', 'ACADEMIA', 'BIENESTAR', 'OTROS ÁMBITOS'];
sectors.forEach((label, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 100 + col * 490;
  const y = 350 + row * 220;
  sectorCards += `<rect x="${x}" y="${y}" width="450" height="166" rx="22" fill="${i === 4 ? '#35111d' : '#0c3b2c'}" stroke="${colors.gold}" stroke-opacity=".78" stroke-width="2"/><circle cx="${x + 76}" cy="${y + 83}" r="35" fill="none" stroke="${colors.gold}" stroke-width="2.6"/><text x="${x + 76}" y="${y + 91}" text-anchor="middle" fill="${colors.gold}" font-family="Georgia,serif" font-size="24" font-weight="700">0${i + 1}</text><text x="${x + 136}" y="${y + 92}" fill="${colors.cream}" font-family="Arial,sans-serif" font-size="${i === 0 ? 20 : 24}" font-weight="700" letter-spacing=".5">${escapeXml(label)}</text>`;
});
makeFrame('04', b4, `${frameBorder()}<text x="800" y="151" text-anchor="middle" fill="${colors.gold}" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="4">UN CANAL, MÚLTIPLES SECTORES</text>
  ${text(['Distintos ámbitos.', 'Un mismo punto de partida.'], 800, 254, 65, colors.cream, { family: 'Georgia,serif', anchor: 'middle', weight: 500, lineHeight: 76 })}${sectorCards}
  <text x="800" y="822" text-anchor="middle" fill="${colors.gold}" font-family="Arial,sans-serif" font-size="18" letter-spacing="2">Y OTROS SERVICIOS QUE PUEDAN SUMARSE</text>`);

// 5 · A refined double-infinity motif, retaining the six exact value pillars.
const b5 = path.join(temp, 'background-05.png');
base(colors.green, b5);
const loop = `<path d="M240 490 C290 250 520 220 800 470 C1080 720 1310 690 1360 450 C1310 210 1080 240 800 470 C520 700 290 670 240 490" fill="none" stroke="#010d09" stroke-opacity=".28" stroke-width="124" stroke-linecap="round"/><path d="M240 490 C290 250 520 220 800 470 C1080 720 1310 690 1360 450 C1310 210 1080 240 800 470 C520 700 290 670 240 490" fill="none" stroke="url(#loopColor)" stroke-width="82" stroke-linecap="round"/><path d="M240 490 C290 250 520 220 800 470 C1080 720 1310 690 1360 450 C1310 210 1080 240 800 470 C520 700 290 670 240 490" fill="none" stroke="url(#goldLine)" stroke-opacity=".82" stroke-width="2"/>`;
const topLabels = ['01  CONECTAR', '02  ACOMPAÑAR', '03  GARANTIZAR'];
const bottomLabels = ['04  VISIBILIZAR', '05  FACILITAR', '06  GESTIONAR'];
let pillarCards = '';
topLabels.forEach((label, i) => {
  const x = [330, 800, 1270][i];
  pillarCards += `<rect x="${x - 190}" y="328" width="380" height="76" rx="38" fill="#35111d" stroke="${colors.gold}" stroke-width="2"/><text x="${x}" y="376" text-anchor="middle" fill="${colors.cream}" font-family="Arial,sans-serif" font-size="21" font-weight="700" letter-spacing="1">${label}</text>`;
});
bottomLabels.forEach((label, i) => {
  const x = [330, 800, 1270][i];
  pillarCards += `<rect x="${x - 190}" y="574" width="380" height="76" rx="38" fill="#0c3b2c" stroke="${colors.gold}" stroke-width="2"/><text x="${x}" y="622" text-anchor="middle" fill="${colors.cream}" font-family="Arial,sans-serif" font-size="21" font-weight="700" letter-spacing="1">${label}</text>`;
});
makeFrame('05', b5, `${frameBorder()}<text x="800" y="132" text-anchor="middle" fill="${colors.gold}" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="4">EL CIRCUITO DE SCP</text>${text(['Seis pilares. Una forma de avanzar.'], 800, 222, 59, colors.cream, { family: 'Georgia,serif', anchor: 'middle', weight: 500 })}${loop}${pillarCards}<circle cx="800" cy="486" r="84" fill="${colors.green}" stroke="url(#goldLine)" stroke-width="4"/><text x="800" y="481" text-anchor="middle" fill="${colors.burgundy}" font-family="Georgia,serif" font-size="40" font-weight="700">SCP</text><path d="M757 510 Q800 478 843 510 M755 516 H845" fill="none" stroke="${colors.gold}" stroke-width="3" stroke-linecap="round"/>`);

// 6 · Close with a clear next step and the same brand palette.
const b6 = path.join(temp, 'background-06.png');
base(colors.green, b6);
composeImage(b6, bridge, b6, '+0+220', '1600x900');
makeFrame('06', b6, `<rect width="1600" height="900" fill="${colors.green}" fill-opacity=".13"/>${frameBorder()}${brandTag(800, 124, 'middle')}
  <rect x="250" y="274" width="1100" height="395" rx="28" fill="${colors.green}" fill-opacity=".91" stroke="url(#goldLine)" stroke-width="3"/>
  <text x="800" y="374" text-anchor="middle" fill="${colors.gold}" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="4">TU SIGUIENTE PASO EMPIEZA AQUÍ</text>
  ${text(['Cuéntanos qué necesitas.', 'Empezamos contigo.'], 800, 468, 60, colors.cream, { family: 'Georgia,serif', anchor: 'middle', weight: 500, lineHeight: 74 })}
  <path d="M570 592 H1030" stroke="url(#goldLine)" stroke-width="2"/>
  <text x="800" y="632" text-anchor="middle" fill="${colors.gold}" font-family="Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="2">BUSCA TU SERVICIO EN SCP</text>`);

const poster = path.join(assets, 'scp-publicidad-poster.jpg');
run('magick', [frames[0], '-quality', '88', poster]);

const video = path.join(assets, 'scp-publicidad-portada.mp4');
const inputs = [];
for (const frame of frames) inputs.push('-loop', '1', '-framerate', String(FPS), '-i', frame);
const filters = [];
for (let i = 0; i < frames.length; i++) {
  filters.push(`[${i}:v]trim=duration=${SCENE_SECONDS},setpts=PTS-STARTPTS,scale=${W}:${H},zoompan=z='min(1.035,1+0.00018*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS},setsar=1,format=yuv420p[v${i}]`);
}
filters.push(`${frames.map((_, i) => `[v${i}]`).join('')}concat=n=${frames.length}:v=1:a=0,format=yuv420p[out]`);
const duration = SCENE_SECONDS * frames.length;
run('ffmpeg', ['-y', ...inputs, '-filter_complex', filters.join(';'), '-map', '[out]', '-t', String(duration), '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-metadata', 'title=Servicios Canal Puente SCP | Presentación', '-metadata', 'comment=Vídeo corporativo de presentación; textos integrados; sin audio', '-r', String(FPS), video]);

console.log(JSON.stringify({ video: path.relative(root, video), poster: path.relative(root, poster), scenes: frames.length, durationSeconds: duration, bytes: fs.statSync(video).size }));
fs.rmSync(temp, { recursive: true, force: true });
