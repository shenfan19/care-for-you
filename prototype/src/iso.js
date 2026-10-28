/* 斜视的房子：用代码画的原创剖面，地面是菱形地砖，后面两面墙高，房间之间是矮墙，家具是方块。
   只画背景，人和主角是另外一层。窗外的天色跟着时间变。 */
(function (CY) {
  const W = CY.world;
  const t = (k, v) => CY.t(k, v);
  const clampHex = n => Math.max(0, Math.min(255, Math.round(n)));
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const to = v => clampHex(f < 1 ? v * f : v + (255 - v) * (f - 1));
    return '#' + [to(r), to(g), to(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  };
  const FLOOR = { bedroom: '#e8d2ae', elder: '#e3cba6', toilet: '#cfe3e6', study: '#dcc59f', living: '#ebd7b4', kitchen: '#ece4d2', yard: '#a3cc8e', ward: '#e2ebed', desk: '#dbd7c9' };
  const WALL = { bedroom: '#f3e6d0', elder: '#efe2cb', toilet: '#e3f0f2', study: '#ecdcc0', living: '#f4e8d3', kitchen: '#f2ece0', ward: '#eef4f5', desk: '#ece8dc' };
  const WH = 72, LOW = 14;

  function sky(hour) {
    if (hour >= 7 && hour < 17) return { c: '#bfe3f5', sun: true };
    if (hour >= 17 && hour < 19.5) return { c: '#f3b98a', sun: true };
    if (hour >= 5 && hour < 7) return { c: '#f0c9a0', sun: false };
    if (hour >= 19.5 && hour < 22) return { c: '#5f73ab', sun: false };
    return { c: '#1f2a55', sun: false, night: true };
  }

  CY.iso = {
    svg(place, hour) {
      const P = W.PLACES[place], out = [];
      const pt = (gx, gy, z = 0) => { const q = W.project(place, gx, gy); return `${q.x.toFixed(1)},${(q.y - z).toFixed(1)}`; };
      const poly = (pts, fill, extra = '') => out.push(`<polygon points="${pts.join(' ')}" fill="${fill}" ${extra}/>`);
      const box = (x, y, w, d, h, col, z0 = 0) => {
        const top = shade(col, 1.12), l = shade(col, 0.9), r = shade(col, 0.74);
        poly([pt(x, y + d, z0), pt(x + w, y + d, z0), pt(x + w, y + d, z0 + h), pt(x, y + d, z0 + h)], l);
        poly([pt(x + w, y, z0), pt(x + w, y + d, z0), pt(x + w, y + d, z0 + h), pt(x + w, y, z0 + h)], r);
        poly([pt(x, y, z0 + h), pt(x + w, y, z0 + h), pt(x + w, y + d, z0 + h), pt(x, y + d, z0 + h)], top);
      };
      const flat = (x, y, w, d, col) => poly([pt(x, y), pt(x + w, y), pt(x + w, y + d), pt(x, y + d)], col, 'opacity=".9"');
      const ball = (x, y, z, rx, ry, col) => { const [px, py] = pt(x, y, z).split(','); out.push(`<ellipse cx="${px}" cy="${py}" rx="${rx}" ry="${ry}" fill="${col}"/>`); };
      const sk = sky(hour);

      /* 地基的厚度 */
      poly([pt(0, P.h, 0), pt(P.w, P.h, 0), pt(P.w, P.h, -16), pt(0, P.h, -16)], '#b79f82');
      poly([pt(P.w, 0, 0), pt(P.w, P.h, 0), pt(P.w, P.h, -16), pt(P.w, 0, -16)], '#9c8668');

      const rooms = Object.entries(P.rooms).sort((a, b) => (a[1].gx + a[1].gy) - (b[1].gx + b[1].gy));
      for (const [name, r] of rooms) {
        const x = r.gx, y = r.gy, w = r.w, h = r.h;
        flat(x, y, w, h, FLOOR[name]);
        /* 地砖的线 */
        let lines = '';
        for (let i = 1; i < w; i++) lines += `M${pt(x + i, y)}L${pt(x + i, y + h)}`;
        for (let j = 1; j < h; j++) lines += `M${pt(x, y + j)}L${pt(x + w, y + j)}`;
        out.push(`<path d="${lines}" stroke="#00000014" stroke-width="1" fill="none"/>`);
        if (name === 'yard') continue;
        const tallBack = y === 0, tallLeft = x === 0;
        const wc = WALL[name];
        /* 后墙（右边那面）和左墙：外墙高，房间之间的矮墙 */
        poly([pt(x, y, 0), pt(x + w, y, 0), pt(x + w, y, tallBack ? WH : LOW), pt(x, y, tallBack ? WH : LOW)], wc, `stroke="#00000022" stroke-width="1"`);
        poly([pt(x, y, 0), pt(x, y + h, 0), pt(x, y + h, tallLeft ? WH : LOW), pt(x, y, tallLeft ? WH : LOW)], shade(wc, 0.92), `stroke="#00000022" stroke-width="1"`);
        /* 窗户 */
        const win = (ax, ay, bx, by) => {
          poly([pt(ax, ay, 30), pt(bx, by, 30), pt(bx, by, 58), pt(ax, ay, 58)], sk.c, 'stroke="#8a7a66" stroke-width="2"');
          const mx = (ax + bx) / 2, my = (ay + by) / 2;
          out.push(`<path d="M${pt(mx, my, 30)}L${pt(mx, my, 58)}M${pt(ax, ay, 44)}L${pt(bx, by, 44)}" stroke="#8a7a66" stroke-width="1.4"/>`);
          if (sk.night) { const [sx, sy] = pt((ax * 3 + bx) / 4, (ay * 3 + by) / 4, 50).split(','); out.push(`<circle cx="${sx}" cy="${sy}" r="3" fill="#f6f1c8"/>`); }
          else if (sk.sun) { const [sx, sy] = pt((ax + bx * 3) / 4, (ay + by * 3) / 4, 50).split(','); out.push(`<circle cx="${sx}" cy="${sy}" r="3.2" fill="#ffe08a"/>`); }
        };
        if (tallBack && name !== 'toilet') win(x + w * 0.28, y, x + w * 0.72, y);
        if (tallLeft && name !== 'toilet' && h >= 4) win(x, y + h * 0.28, x, y + h * 0.72);
        if (name === 'ward') {
          const cx = x + w * 0.5; poly([pt(cx - 0.18, y, 36), pt(cx + 0.18, y, 36), pt(cx + 0.18, y, 62), pt(cx - 0.18, y, 62)], '#d9534f');
          poly([pt(cx - 0.45, y, 46), pt(cx + 0.45, y, 46), pt(cx + 0.45, y, 52), pt(cx - 0.45, y, 52)], '#d9534f');
        }
        /* 家具，相对房间左上角 */
        const f = (a, b, c, d, e, col, z) => box(x + a, y + b, c, d, e, col, z);
        const fl = (a, b, c, d, col) => flat(x + a, y + b, c, d, col);
        if (name === 'bedroom') {
          fl(0.2, 3.1, 2.4, 0.8, '#cfa98e');
          f(0.35, 0.35, 2.0, 2.6, 12, '#b88a62'); f(0.4, 0.45, 1.9, 2.4, 8, '#f4ece6', 12); f(0.55, 0.5, 0.9, 0.5, 6, '#ffffff', 20); f(0.4, 1.7, 1.9, 1.2, 4, '#8fb3cf', 20);
          f(2.3, 0.12, 1.5, 0.6, 62, '#c9a77c');
          f(2.9, 0.95, 0.9, 1.3, 12, '#d9b98b'); f(2.95, 1.0, 0.8, 1.2, 4, '#fbeed8', 12);
        } else if (name === 'elder') {
          f(0.15, 0.3, 1.2, 2.4, 12, '#a98a62'); f(0.18, 0.4, 1.14, 2.2, 8, '#efe6dc', 12); f(0.18, 1.5, 1.14, 1.1, 4, '#a9c29a', 20);
          f(1.65, 0.3, 1.2, 2.4, 12, '#a98a62'); f(1.68, 0.4, 1.14, 2.2, 8, '#efe6dc', 12); f(1.68, 1.5, 1.14, 1.1, 4, '#c9a0a0', 20);
          f(1.38, 0.3, 0.24, 0.5, 18, '#8a6a48');
        } else if (name === 'toilet') {
          f(0.7, 0.3, 0.7, 0.9, 14, '#f6f8f8'); f(0.7, 0.12, 0.7, 0.25, 34, '#eef2f2'); f(1.4, 0.3, 0.5, 0.8, 26, '#e8eef0'); f(0.2, 2.8, 1.5, 0.9, 6, '#cfe0e4');
        } else if (name === 'study') {
          f(0.6, 0.25, 1.9, 0.8, 26, '#a9805a'); f(1.2, 0.35, 0.6, 0.12, 20, '#3a3f48', 26); f(1.3, 1.2, 0.5, 0.5, 16, '#4f6d8f'); f(2.55, 0.12, 0.4, 1.4, 66, '#8a6540');
          f(2.62, 0.2, 0.26, 1.2, 4, '#d9a05a', 40);
        } else if (name === 'living') {
          fl(0.9, 1.5, 2.2, 1.5, '#c98f7a');
          f(0.6, 0.3, 2.6, 0.9, 20, '#7b8fb0'); f(0.6, 0.25, 2.6, 0.2, 40, '#6c7fa0'); f(1.2, 1.8, 1.2, 0.7, 12, '#b08a62'); f(0.12, 1.4, 0.4, 1.6, 28, '#2f3440');
        } else if (name === 'kitchen') {
          f(0.2, 0.12, 3.4, 0.7, 28, '#d9d3c4'); f(1.4, 0.14, 0.8, 0.6, 3, '#4a4d55', 28); f(3.3, 0.15, 0.6, 0.8, 66, '#e8eef0');
          f(1.2, 1.7, 1.4, 1.1, 20, '#c79a6a'); f(0.8, 1.9, 0.3, 0.3, 12, '#9a7a52'); f(2.8, 1.9, 0.3, 0.3, 12, '#9a7a52');
        } else if (name === 'ward') {
          [0.8, 2.8, 4.8, 6.8].forEach((bx, i) => {
            f(bx, 0.3, 1.2, 2.4, 12, '#cfd8dc'); f(bx + 0.04, 0.4, 1.12, 2.2, 7, '#ffffff', 12); f(bx + 0.04, 1.5, 1.12, 1.1, 4, '#8fb9d6', 19);
            if (i < 3) f(bx + 1.5, 0.3, 0.06, 2.4, 44, '#aed0e0');
          });
          f(8.6, 1.0, 0.8, 0.8, 24, '#c7d0d4'); f(8.6, 3.6, 0.9, 0.5, 34, '#d6dde0');
        } else if (name === 'desk') {
          f(1.0, 1.0, 2.6, 0.9, 26, '#a9805a'); f(1.6, 1.1, 0.7, 0.1, 20, '#3a3f48', 26); f(2.0, 2.1, 0.5, 0.5, 16, '#4f6d8f');
          f(4.6, 1.0, 2.6, 0.9, 26, '#b08a62'); f(5.2, 1.1, 0.7, 0.1, 20, '#3a3f48', 26); f(5.6, 2.1, 0.5, 0.5, 16, '#6a7a8a');
          f(7.2, 0.4, 0.5, 0.5, 14, '#8a6540');
        }
        /* 房间名，淡淡的 */
        const [lx, ly] = pt(x + w * 0.08, y + h * 0.96, 0).split(',');
        out.push(`<text x="${lx}" y="${ly}" font-size="14" fill="#5a4a38" opacity=".6" font-family="system-ui,sans-serif">${t('loc.' + name)}</text>`);
      }
      /* 院子：草地上的树和花坛，画在最后，高的东西在前面 */
      if (P.rooms.yard) {
        const r = P.rooms.yard;
        box(r.gx + 0.3, r.gy + 0.4, 1.8, 0.5, 8, '#7a5538');
        for (let i = 0; i < 5; i++) ball(r.gx + 0.5 + i * 0.36, r.gy + 0.55, 14, 4, 4, ['#e8707e', '#f2c14e', '#fff', '#c58ae0', '#f2c14e'][i]);
        box(r.gx + 3.15, r.gy + 0.55, 0.3, 0.3, 30, '#8a5a3a'); ball(r.gx + 3.3, r.gy + 0.7, 52, 34, 26, '#5f9a58'); ball(r.gx + 3.0, r.gy + 0.7, 60, 22, 18, '#74ad68');
        box(r.gx + 0.1, r.gy + 3.7, 3.8, 0.12, 14, '#d9c9a8');
      }
      return `<svg viewBox="0 0 ${W.VW} ${W.VH}" preserveAspectRatio="xMidYMid meet">${out.join('')}</svg>`;
    },
  };

  /* ---------- 斜视里的小人：简单的圆头小人，宠物和花草也各有各的样子 ---------- */
  const SKINS = () => (CY.avatarOptions && CY.avatarOptions.skin) || ['#f2c9a5'];
  const HAIRS = () => (CY.avatarOptions && CY.avatarOptions.hairColorHex) || {};
  const COATS = () => (CY.avatarOptions && CY.avatarOptions.coatHex) || {};
  const SCALE = { infant: 0.55, toddler: 0.68, child: 0.78, teen: 0.92, adult: 1, elder: 0.95 };
  const person = (p, o) => {
    const a = p.person.appearance || {}, skin = SKINS()[a.skin] || SKINS()[1] || '#f2c9a5', hair = HAIRS()[a.hair_color] || '#3a2f2a', cloth = a.cloth || '#8fa3b8';
    const st = o.stage, s = SCALE[st] || 1, mood = p.state.mood, glass = a.glasses && a.glasses !== 'none' && !o.asleep;
    let back = '', front = '';
    const hs = a.hair_style || 'short';
    if (hs === 'long') back = `<path d="M9 14 Q8 32 12 34 L28 34 Q32 32 31 14Z" fill="${hair}"/>`;
    else if (hs === 'bob') back = `<path d="M9 14 Q8 25 12 26 L28 26 Q32 25 31 14Z" fill="${hair}"/>`;
    else if (hs === 'ponytail') back = `<path d="M28 10 Q38 12 34 26 Q31 18 28 16Z" fill="${hair}"/>`;
    else if (hs === 'bun') back = `<circle cx="20" cy="4" r="4.5" fill="${hair}"/>`;
    else if (hs === 'curly') back = [[10, 9], [16, 4], [24, 4], [30, 9], [8, 15], [32, 15]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${hair}"/>`).join('');
    if (hs !== 'bald') front = `<path d="M10 15 Q9 4 20 4 Q31 4 30 15 Q26 9 20 9 Q14 9 10 15Z" fill="${hair}"/>`;
    const eyes = o.asleep ? `<path d="M14 17 q2 1.6 4 0 M22 17 q2 1.6 4 0" stroke="#2a2522" stroke-width="1.3" fill="none" stroke-linecap="round"/>` : `<circle cx="16" cy="17" r="1.5" fill="#2a2522"/><circle cx="24" cy="17" r="1.5" fill="#2a2522"/>`;
    const mouth = mood > 0.6 ? `<path d="M17 21.5 q3 2.6 6 0" stroke="#7a3f33" stroke-width="1.2" fill="none" stroke-linecap="round"/>` : mood > 0.35 ? `<path d="M17.5 22 h5" stroke="#7a3f33" stroke-width="1.2" stroke-linecap="round"/>` : `<path d="M17 23 q3 -2.4 6 0" stroke="#7a3f33" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    const gl = glass ? `<g fill="none" stroke="#3e3a36" stroke-width="1"><circle cx="16" cy="17" r="3.6"/><circle cx="24" cy="17" r="3.6"/><path d="M19.6 17 h.8"/></g>` : '';
    const beard = a.beard ? `<path d="M11 19 Q12 29 20 29 Q28 29 29 19 Q26 25 20 25 Q14 25 11 19Z" fill="${hair}" opacity=".85"/>` : '';
    const tears = o.crying ? `<path class="mdrop" d="M14 20 q-2 3 0 4.5 q2 -1.5 0 -4.5Z M26 20 q-2 3 0 4.5 q2 -1.5 0 -4.5Z" fill="#7ec0ee"/>` : '';
    const legs = o.asleep ? '' : `<rect x="12.5" y="46" width="6" height="12" rx="3" fill="#4a4f5c"/><rect x="21.5" y="46" width="6" height="12" rx="3" fill="#4a4f5c"/>`;
    return `<g transform="translate(20 60) scale(${s}) translate(-20 -60)"><ellipse cx="20" cy="60" rx="12" ry="3.4" fill="#0003"/>${legs}
      <rect x="7" y="28" width="5" height="15" rx="2.5" fill="${cloth}"/><rect x="28" y="28" width="5" height="15" rx="2.5" fill="${cloth}"/><rect x="10.5" y="26" width="19" height="23" rx="7" fill="${cloth}"/>
      ${back}<circle cx="20" cy="16" r="10.5" fill="${skin}"/>${front}${beard}${eyes}${mouth}${gl}${tears}</g>`;
  };
  const critter = (p, o) => {
    const sp = p.species.id, coat = COATS()[(p.person.appearance || {}).coat] || '#c8794a', dark = shade(coat, 0.7), light = shade(coat, 1.35);
    const sh = '<ellipse cx="20" cy="60" rx="13" ry="3.4" fill="#0003"/>';
    const eye = (x, y) => o.asleep ? `<path d="M${x - 2} ${y} q2 1.6 4 0" stroke="#2a2522" stroke-width="1.2" fill="none"/>` : `<circle cx="${x}" cy="${y}" r="1.5" fill="#2a2522"/>`;
    if (sp === 'cat') return sh + `<path d="M9 52 Q-2 50 4 38" stroke="${coat}" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="19" cy="50" rx="12" ry="9" fill="${coat}"/><circle cx="27" cy="38" r="8" fill="${coat}"/><path d="M21 33 L22 25 L27 31Z M33 33 L33 25 L28 31Z" fill="${coat}"/>${eye(24, 38)}${eye(31, 38)}<path d="M26 42 h4" stroke="${dark}" stroke-width="1"/>`;
    if (sp === 'dog') return sh + `<path d="M8 48 Q1 44 4 38" stroke="${coat}" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="19" cy="49" rx="13" ry="9" fill="${coat}"/><circle cx="29" cy="38" r="8.5" fill="${coat}"/><ellipse cx="22" cy="37" rx="3.4" ry="7" fill="${dark}"/><ellipse cx="33" cy="42" rx="4" ry="3" fill="${light}"/>${eye(28, 36)}${eye(33, 36)}<circle cx="35" cy="41" r="1.5" fill="#2a2522"/>`;
    if (sp === 'rabbit') return sh + `<ellipse cx="19" cy="50" rx="12" ry="9" fill="${coat}"/><circle cx="26" cy="40" r="7.5" fill="${coat}"/><ellipse cx="23" cy="28" rx="2.8" ry="8" fill="${coat}"/><ellipse cx="29" cy="28" rx="2.8" ry="8" fill="${coat}"/>${eye(24, 40)}${eye(29, 40)}<circle cx="8" cy="52" r="3" fill="${light}"/>`;
    if (sp === 'hamster' || sp === 'guineapig') return sh + `<ellipse cx="20" cy="49" rx="${sp === 'guineapig' ? 14 : 11}" ry="${sp === 'guineapig' ? 9 : 10}" fill="${coat}"/><circle cx="14" cy="40" r="3" fill="${dark}"/><circle cx="26" cy="40" r="3" fill="${dark}"/><ellipse cx="20" cy="53" rx="7" ry="5" fill="${light}"/>${eye(16, 47)}${eye(24, 47)}<circle cx="20" cy="50" r="1.3" fill="#2a2522"/>`;
    if (sp === 'bird') return sh + `<path d="M9 52 L2 58" stroke="${dark}" stroke-width="3" stroke-linecap="round"/><ellipse cx="19" cy="46" rx="10" ry="12" fill="${coat}"/><circle cx="23" cy="32" r="7" fill="${coat}"/><path d="M29 31 L36 33 L29 36Z" fill="#e8a33a"/><ellipse cx="16" cy="48" rx="5" ry="8" fill="${dark}"/>${eye(24, 31)}<path d="M17 57 v3 M23 57 v3" stroke="#a87a3a" stroke-width="1.6"/>`;
    if (sp === 'fish') return `<ellipse cx="20" cy="58" rx="12" ry="3" fill="#0002"/><ellipse cx="20" cy="46" rx="12" ry="8" fill="${coat}"/><path d="M8 46 L1 39 L1 53Z" fill="${coat}"/><path d="M18 38 Q22 33 26 38Z" fill="${dark}"/>${eye(28, 44)}<path d="M5 20 q4 -3 8 0 M24 14 q4 -3 8 0" stroke="#9fd0e8" stroke-width="1.4" fill="none"/>`;
    if (sp === 'turtle') return sh + `<path d="M7 52 Q8 34 22 34 Q36 34 37 52Z" fill="${dark}"/><path d="M12 48 Q14 40 22 40 Q30 40 32 48Z" fill="${coat}"/><circle cx="36" cy="46" r="4.5" fill="${coat}"/>${eye(37, 45)}<rect x="10" y="52" width="6" height="6" rx="2" fill="${coat}"/><rect x="26" y="52" width="6" height="6" rx="2" fill="${coat}"/>`;
    if (sp === 'snake') return sh + `<path d="M5 56 Q12 40 20 54 Q28 66 35 48" stroke="${coat}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="35" cy="46" r="4.6" fill="${coat}"/>${eye(36, 44)}<path d="M38 48 l5 1 M38 48 l5 -1" stroke="#c0392b" stroke-width="1"/>`;
    if (sp === 'gecko') return sh + `<path d="M3 58 Q10 50 14 50" stroke="${coat}" stroke-width="3.4" fill="none" stroke-linecap="round"/><ellipse cx="22" cy="52" rx="11" ry="5.5" fill="${coat}"/><circle cx="34" cy="50" r="5" fill="${coat}"/>${eye(35, 48)}<path d="M16 55 l-3 4 M28 55 l3 4 M16 49 l-3 -4 M28 49 l3 -4" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>`;
    return sh + `<ellipse cx="20" cy="50" rx="12" ry="9" fill="${coat}"/>`;
  };
  const plant = (p) => {
    const sp = p.species.id, coat = COATS()[(p.person.appearance || {}).coat] || '#5f9a58', pot = '<path d="M11 50 L29 50 L26 60 L14 60Z" fill="#b5703f"/><rect x="10" y="48" width="20" height="4" rx="2" fill="#c98250"/>', sh = '<ellipse cx="20" cy="60.5" rx="12" ry="3" fill="#0003"/>';
    if (sp === 'cactus') return sh + pot + `<rect x="15" y="22" width="10" height="28" rx="5" fill="${coat}"/><rect x="7" y="30" width="5" height="12" rx="2.5" fill="${coat}"/><rect x="28" y="26" width="5" height="12" rx="2.5" fill="${coat}"/>`;
    if (sp === 'succulent') return sh + pot + [[20, 40], [14, 43], [26, 43], [17, 36], [23, 36]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="8" fill="${coat}" transform="rotate(${(x - 20) * 4} ${x} 48)"/>`).join('');
    if (sp === 'flower') return sh + pot + `<path d="M20 49 Q18 36 20 26" stroke="#4f8a4a" stroke-width="2.4" fill="none"/><ellipse cx="14" cy="42" rx="5" ry="2.4" fill="#4f8a4a"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="20" cy="19" rx="3.2" ry="6" fill="${coat}" transform="rotate(${a} 20 25)"/>`).join('')}<circle cx="20" cy="25" r="3.2" fill="#f2c14e"/>`;
    return sh + pot + `<rect x="18" y="30" width="4" height="20" fill="#8a5a3a"/><circle cx="20" cy="24" r="11" fill="${coat}"/><circle cx="14" cy="28" r="7" fill="${shade(coat, 1.15)}"/><circle cx="27" cy="27" r="7" fill="${shade(coat, 0.9)}"/>`;
  };
  CY.iso.mini = (p, o = {}) => {
    const human = p.species.id === 'human', st = human ? CY.game.stage(p) : null;
    const isPlant = ['succulent', 'flower', 'tree', 'cactus'].includes(p.species.id);
    const body = isPlant ? plant(p) : human ? person(p, Object.assign({ stage: st }, o)) : critter(p, o);
    return `<svg viewBox="-4 -2 48 66" class="mini">${body}</svg>`;
  };
})(globalThis.CY = globalThis.CY || {});
