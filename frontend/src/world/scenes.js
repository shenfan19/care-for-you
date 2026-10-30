/* 房间背景：用代码画的场景，客厅、卧室、厨房、草坪、阳台。颜色随昼夜变化，窗外和天空也跟着变。
   画布 800 乘 420，地平线在 300 附近，角色站在前景，所以家具靠两边放，中间留给角色。 */
(function (CY) {
  const PH = {
    day: { wall: '#f1e3cf', wall2: '#e7d3b6', floor: '#cfa77c', floor2: '#bd9468', sky: '#bfe6f5', sky2: '#e9f6fb', sun: '#ffd25a', lamp: 0, ink: '#8a6a4a' },
    dawn: { wall: '#efd9c0', wall2: '#e2c4a2', floor: '#c49a72', floor2: '#b28860', sky: '#f6d3b0', sky2: '#fbe9d6', sun: '#ffb75a', lamp: 0.2, ink: '#85654a' },
    dusk: { wall: '#e6c6a2', wall2: '#d6ab84', floor: '#b48762', floor2: '#a27853', sky: '#f2a977', sky2: '#f7cfa4', sun: '#ff9a4a', lamp: 0.55, ink: '#7a5a42' },
    night: { wall: '#4a4963', wall2: '#3e3d55', floor: '#58494a', floor2: '#4a3c3d', sky: '#1f2748', sky2: '#2d3a66', sun: '#f4efc8', lamp: 1, ink: '#2e2b3f' },
  };
  const phaseOf = h => (h >= 21 || h < 5.5 ? 'night' : h < 8 ? 'dawn' : h < 17.5 ? 'day' : 'dusk');

  const star = (x, y) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".8"/>`;
  const skyBody = (c, x, y) => (c === PH.night ? `<circle cx="${x}" cy="${y}" r="16" fill="${c.sun}"/><circle cx="${x + 7}" cy="${y - 4}" r="14" fill="${c.sky2}"/>${[[x - 50, y - 8], [x + 40, y + 14], [x - 20, y + 28], [x + 24, y - 24]].map(p => star(...p)).join('')}` : `<circle cx="${x}" cy="${y}" r="${c === PH.day ? 18 : 24}" fill="${c.sun}" opacity=".95"/>`);
  const cloud = (x, y, c) => `<g opacity="${c === PH.night ? 0.25 : 0.9}" fill="#fff"><ellipse cx="${x}" cy="${y}" rx="30" ry="9"/><ellipse cx="${x + 18}" cy="${y - 7}" rx="18" ry="9"/><ellipse cx="${x - 16}" cy="${y - 5}" rx="14" ry="7"/></g>`;
  const glow = (x, y, r, c) => (c.lamp > 0 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd98a" opacity="${0.35 * c.lamp}"/><circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="#ffe9b8" opacity="${0.45 * c.lamp}"/>` : '');
  const floorPlanks = (c, y0 = 300) => `<rect x="0" y="${y0}" width="800" height="${420 - y0}" fill="${c.floor}"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `<path d="M${i * 80 - 20} ${y0} L${i * 100 - 120} 420" stroke="${c.floor2}" stroke-width="2" opacity=".6"/>`).join('') + `<rect x="0" y="${y0 - 6}" width="800" height="7" fill="${c.floor2}"/>`;
  const windowFrame = (x, y, w, h, c, body) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${c.sky}"/><clipPath id="wc${x}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/></clipPath><g clip-path="url(#wc${x})"><rect x="${x}" y="${y + h * 0.55}" width="${w}" height="${h * 0.45}" fill="${c === PH.night ? '#232a47' : '#9fd09a'}"/>${body}</g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="none" stroke="#f7f1e6" stroke-width="7"/><path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="#f7f1e6" stroke-width="5"/></g>`;

  const S = {};

  S.living = c => `<rect width="800" height="420" fill="${c.wall}"/><rect y="230" width="800" height="76" fill="${c.wall2}" opacity=".6"/>
    ${windowFrame(300, 46, 200, 150, c, skyBody(c, 400, 100) + cloud(340, 80, c))}
    <path d="M286 40 Q310 120 292 200 L330 200 L330 40Z" fill="#c9706a" opacity=".9"/><path d="M514 40 Q490 120 508 200 L470 200 L470 40Z" fill="#c9706a" opacity=".9"/>
    <rect x="40" y="60" width="90" height="70" rx="3" fill="#f7f1e6" stroke="${c.ink}" stroke-width="3"/><path d="M52 118 L74 90 L92 108 L104 96 L120 118Z" fill="#8fbf9f"/><circle cx="100" cy="78" r="7" fill="#f4c46a"/>
    <rect x="660" y="70" width="70" height="90" rx="3" fill="#f7f1e6" stroke="${c.ink}" stroke-width="3"/><circle cx="695" cy="115" r="22" fill="#e6a0a0"/><circle cx="695" cy="115" r="9" fill="#f7e8c4"/>
    ${floorPlanks(c)}
    <ellipse cx="400" cy="372" rx="190" ry="26" fill="#b5607a" opacity=".55"/><ellipse cx="400" cy="372" rx="150" ry="19" fill="#d98a9c" opacity=".55"/>
    <g><rect x="22" y="222" width="230" height="86" rx="20" fill="#8fa3b8"/><rect x="22" y="196" width="230" height="46" rx="16" fill="#9fb3c8"/><rect x="40" y="244" width="194" height="46" rx="10" fill="#a8bccf"/><rect x="14" y="214" width="34" height="92" rx="14" fill="#7d92a8"/><rect x="226" y="214" width="34" height="92" rx="14" fill="#7d92a8"/></g>
    <g><rect x="640" y="150" width="130" height="156" rx="4" fill="#a67c52"/>${[0, 1, 2].map(i => `<rect x="648" y="${158 + i * 48}" width="114" height="40" fill="#8a6440" opacity=".55"/>`).join('')}${[0, 1, 2].map(i => [0, 1, 2, 3, 4].map(j => `<rect x="${652 + j * 22}" y="${166 + i * 48}" width="14" height="${24 + (j % 2) * 6}" fill="${['#c9706a', '#6a9fc9', '#e0b062', '#8fbf9f', '#b58aa5'][(i + j) % 5]}"/>`).join('')).join('')}</g>
    <g><rect x="272" y="196" width="6" height="110" fill="#6e5a46"/><path d="M262 196 L290 196 L284 164 L268 164Z" fill="#f7e6bd"/></g>${glow(275, 180, 90, c)}`;

  S.bedroom = c => `<rect width="800" height="420" fill="${c.wall}"/><rect y="236" width="800" height="70" fill="${c.wall2}" opacity=".6"/>
    ${windowFrame(110, 52, 180, 140, c, skyBody(c, 200, 100) + cloud(150, 86, c))}
    <path d="M96 46 Q118 120 102 196 L132 196 L132 46Z" fill="#8fa6c9" opacity=".9"/><path d="M304 46 Q282 120 298 196 L268 196 L268 46Z" fill="#8fa6c9" opacity=".9"/>
    <rect x="360" y="68" width="80" height="60" rx="3" fill="#f7f1e6" stroke="${c.ink}" stroke-width="3"/><path d="M370 118 L392 92 L410 108 L422 98 L434 118Z" fill="#c9b08f"/>
    ${floorPlanks(c)}
    <ellipse cx="300" cy="378" rx="170" ry="22" fill="#6a9fa9" opacity=".5"/>
    <g><rect x="520" y="180" width="270" height="130" rx="10" fill="#8a6440"/><rect x="530" y="214" width="250" height="92" rx="8" fill="#e9e1d2"/><rect x="530" y="244" width="250" height="62" rx="8" fill="#7f9fc9"/><rect x="540" y="206" width="84" height="40" rx="14" fill="#f9f5ec"/><rect x="520" y="150" width="14" height="160" rx="4" fill="#6e4d30"/></g>
    <g><rect x="440" y="238" width="62" height="68" rx="4" fill="#a67c52"/><rect x="448" y="248" width="46" height="22" fill="#8a6440" opacity=".5"/><rect x="468" y="206" width="6" height="34" fill="#6e5a46"/><path d="M455 206 L488 206 L482 180 L461 180Z" fill="#f7e6bd"/></g>${glow(471, 192, 90, c)}
    <g><rect x="30" y="200" width="100" height="106" rx="4" fill="#a67c52"/><rect x="38" y="208" width="84" height="40" fill="#8a6440" opacity=".5"/><rect x="38" y="256" width="84" height="40" fill="#8a6440" opacity=".5"/><circle cx="80" cy="228" r="3" fill="#e9d6a0"/><circle cx="80" cy="276" r="3" fill="#e9d6a0"/></g>`;

  S.kitchen = c => `<rect width="800" height="420" fill="${c.wall}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => [0, 1, 2, 3].map(j => `<rect x="${i * 50}" y="${122 + j * 40}" width="48" height="38" fill="${c.wall2}" opacity=".55"/>`).join('')).join('')}
    <rect x="30" y="20" width="740" height="92" rx="6" fill="#c9a272"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${42 + i * 120}" y="30" width="108" height="72" rx="4" fill="#b78d5e"/><circle cx="${140 + i * 120}" cy="${66}" r="3.5" fill="#f3e3b8"/>`).join('')}
    ${windowFrame(330, 126, 140, 110, c, skyBody(c, 400, 168))}
    <rect y="236" width="800" height="70" fill="#d7c6a8"/><rect y="236" width="800" height="8" fill="#b9a688"/>
    <rect x="40" y="244" width="200" height="62" fill="#bda27a"/><rect x="560" y="244" width="200" height="62" fill="#bda27a"/><rect x="60" y="206" width="120" height="30" rx="6" fill="#9aa8b5"/><ellipse cx="120" cy="212" rx="40" ry="6" fill="#7e8c99"/>
    <rect x="600" y="198" width="120" height="40" rx="6" fill="#4a4a52"/>${[0, 1, 2, 3].map(i => `<circle cx="${620 + i * 28}" cy="218" r="9" fill="#2e2e35"/>`).join('')}
    <rect x="290" y="64" width="220" height="40" rx="8" fill="#9aa8b5" opacity=".0"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => [0, 1, 2].map(j => `<rect x="${i * 50}" y="${306 + j * 40}" width="50" height="40" fill="${(i + j) % 2 ? c.floor : c.floor2}"/>`).join('')).join('')}
    ${glow(120, 150, 100, c)}${glow(660, 150, 100, c)}`;

  S.lawn = c => `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sky}"/><stop offset="1" stop-color="${c.sky2}"/></linearGradient></defs>
    <rect width="800" height="420" fill="url(#sk)"/>${skyBody(c, 620, 80)}${cloud(150, 70, c)}${cloud(420, 110, c)}${cloud(700, 150, c)}
    <path d="M0 250 Q160 170 340 240 T800 230 L800 420 L0 420Z" fill="${c === PH.night ? '#2a4a4a' : '#9fcf94'}"/>
    <path d="M0 290 Q200 240 420 285 T800 270 L800 420 L0 420Z" fill="${c === PH.night ? '#2f5a52' : '#86c07a'}"/>
    <rect y="320" width="800" height="100" fill="${c === PH.night ? '#356a5c' : '#74b369'}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<g><rect x="${i * 86 + 6}" y="262" width="12" height="62" fill="${c === PH.night ? '#6b5a50' : '#f2e6cf'}"/><path d="M${i * 86 + 6} 262 L${i * 86 + 12} 252 L${i * 86 + 18} 262Z" fill="${c === PH.night ? '#6b5a50' : '#f2e6cf'}"/></g>`).join('')}
    <rect y="280" width="800" height="8" fill="${c === PH.night ? '#6b5a50' : '#f2e6cf'}"/><rect y="304" width="800" height="8" fill="${c === PH.night ? '#6b5a50' : '#f2e6cf'}"/>
    <g><rect x="60" y="150" width="24" height="180" fill="#8a6440"/><circle cx="72" cy="130" r="62" fill="${c === PH.night ? '#2f5a45' : '#5fa35a'}"/><circle cx="36" cy="162" r="40" fill="${c === PH.night ? '#356a50' : '#6fb467'}"/><circle cx="108" cy="160" r="42" fill="${c === PH.night ? '#356a50' : '#6fb467'}"/></g>
    ${[[160, 370], [250, 392], [330, 360], [470, 384], [560, 366], [650, 396], [720, 360], [120, 400]].map(([x, y], i) => `<g><circle cx="${x}" cy="${y}" r="5" fill="${['#f08aa0', '#f6d46a', '#fff', '#c39af0'][i % 4]}"/><circle cx="${x}" cy="${y}" r="2" fill="#f6d46a"/><path d="M${x} ${y + 5} V${y + 14}" stroke="#4f8f4a" stroke-width="2"/></g>`).join('')}`;

  S.balcony = c => `<defs><linearGradient id="sk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sky}"/><stop offset="1" stop-color="${c.sky2}"/></linearGradient></defs>
    <rect width="800" height="420" fill="url(#sk2)"/>${skyBody(c, 130, 80)}${cloud(480, 80, c)}${cloud(680, 120, c)}
    <g fill="${c === PH.night ? '#161b33' : '#9fb3c8'}" opacity=".9">${[[0, 220, 70], [60, 180, 60], [130, 230, 80], [220, 170, 70], [300, 215, 60], [380, 190, 80], [470, 225, 70], [550, 175, 60], [620, 210, 80], [710, 185, 90]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${300 - y}"/>`).join('')}</g>
    ${c.lamp ? [[40, 250], [100, 214], [170, 262], [250, 204], [330, 244], [410, 222], [500, 258], [580, 206], [650, 240], [740, 222]].map(([x, y]) => `<rect x="${x}" y="${y}" width="5" height="6" fill="#ffd98a" opacity="${0.6 * c.lamp + 0.2}"/>`).join('') : ''}
    <rect y="296" width="800" height="124" fill="${c.floor}"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${i * 100} 296 L${i * 120 - 80} 420" stroke="${c.floor2}" stroke-width="2" opacity=".6"/>`).join('')}
    <rect y="262" width="800" height="12" fill="${c === PH.night ? '#4a4a5a' : '#e8e2d4'}"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(i => `<rect x="${i * 50 + 10}" y="274" width="6" height="30" fill="${c === PH.night ? '#4a4a5a' : '#e8e2d4'}"/>`).join('')}
    ${[[70, '#e98aa0'], [200, '#f6d46a'], [600, '#c39af0'], [720, '#e98aa0']].map(([x, col]) => `<g><rect x="${x - 34}" y="318" width="68" height="40" rx="6" fill="#c98a62"/><path d="M${x} 318 V270" stroke="#5f9a58" stroke-width="4"/><ellipse cx="${x - 18}" cy="290" rx="16" ry="7" fill="#6faa68"/><ellipse cx="${x + 18}" cy="282" rx="16" ry="7" fill="#6faa68"/><circle cx="${x}" cy="262" r="12" fill="${col}"/><circle cx="${x}" cy="262" r="5" fill="#f6d46a"/></g>`).join('')}
    ${c.lamp ? `<path d="M0 232 Q200 262 400 232 T800 232" fill="none" stroke="#5a4a40" stroke-width="2"/>${[40, 120, 200, 280, 360, 440, 520, 600, 680, 760].map(x => `<circle cx="${x}" cy="${240 + (x % 160 ? 8 : 0)}" r="5" fill="#ffd98a" opacity="${0.5 + 0.4 * c.lamp}"/>`).join('')}` : ''}`;

  CY.scenes = {
    ids: ['living', 'bedroom', 'kitchen', 'lawn', 'balcony'],
    /* auto：夜里在卧室，其余时候在客厅 */
    resolve(pref, hour) { if (pref === 'none') return null; if (pref && S[pref]) return pref; return hour >= 22 || hour < 6.5 ? 'bedroom' : 'living'; },
    phase: phaseOf,
    svg(id, hour) {
      if (!id || !S[id]) return '';
      const ph = PH[phaseOf(hour)];
      return `<svg viewBox="0 0 800 420" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${S[id](ph)}</svg>`;
    },
  };
})(globalThis.CY = globalThis.CY || {});
