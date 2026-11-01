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
  const FLOOR = { bedroom: '#e8d2ae', guest: '#e6d0ac', elder: '#e3cba6', toilet: '#cfe3e6', study: '#dcc59f', living: '#ebd7b4', kitchen: '#ece4d2', yard: '#a3cc8e', lawn: '#9fcc86', road: '#8f8f96', ward: '#e2ebed', aisle: '#ece6d6', desk: '#dbd7c9' };
  const WALL = { bedroom: '#f3e6d0', guest: '#f1e4cd', elder: '#efe2cb', toilet: '#e3f0f2', study: '#ecdcc0', living: '#f4e8d3', kitchen: '#f2ece0', ward: '#eef4f5', aisle: '#f1ede2', desk: '#ece8dc' };
  const WH = 72, LOW = 14;
  const SPR = () => (CY.isoSprites || {}).furn || {};
  const G0 = () => CY.game;

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
      const ball = (x, y, z, rx, ry, col) => { const [px, py] = pt(x, y, z).split(','); out.push(`<ellipse class="leaf" style="animation-delay:${((px * 7 + py * 3) % 20 / -10).toFixed(1)}s" cx="${px}" cy="${py}" rx="${rx}" ry="${ry}" fill="${col}"/>`); };
      const sk = sky(hour); let winN = 0;

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
        if (name === 'lawn' || name === 'road') {
          const f = (a, b, c, d, e, col, z) => box(x + a, y + b, c, d, e, col, z), fl = (a, b, c, d, col) => flat(x + a, y + b, c, d, col);
          const tree = (a, b) => { f(a, b, 0.3, 0.3, 30, '#8a5a3a'); ball(x + a + 0.15, y + b + 0.15, 52, 34, 26, '#5f9a58'); ball(x + a - 0.1, y + b + 0.15, 60, 22, 18, '#74ad68'); };
          if (name === 'lawn') {
            fl(0, 2.5, 10, 0.9, '#e6d6b0'); fl(6.2, 0.8, 3.2, 1.6, '#8fc3e6');
            f(1.2, 0.7, 1.8, 0.5, 10, '#a57a4a'); f(1.2, 0.6, 1.8, 0.14, 22, '#8a6540');
            tree(0.6, 3.8); tree(8.9, 3.6); tree(4.6, 0.4); tree(9.2, 0.5);
            for (let i = 0; i < 6; i++) ball(x + 2.4 + i * 0.5, y + 4.6, 6, 4, 4, ['#e8707e', '#f2c14e', '#fff', '#c58ae0', '#f2c14e', '#e8707e'][i]);
          } else {
            fl(0, 0, 10, 1.2, '#c8c4bb'); fl(0, 1.2, 10, 3.2, '#6d6d75'); fl(0, 4.4, 10, 1.6, '#c8c4bb');
            for (let i = 0; i < 6; i++) fl(5.4, 1.3 + i * 0.5, 2.2, 0.28, '#f2f2f2');
            /* 街上的车：Kenney Car Kit 的 CC0 模型，两辆停在人行道边，两辆在车道上 */
            const cars = [['city-building-b', 0, 1.0, -0.6], ['city-building-g', 0, 3.2, -0.6], ['city-building-e', 0, 5.4, -0.6], ['city-building-k', 0, 7.8, -0.6], ['car-sedan', 1, 1.9, 0.62], ['car-van', 1, 6.3, 0.62], ['car-taxi', 1, 2.4, 2.05], ['car-ambulance', 3, 7.4, 3.0], ['car-cone', 0, 4.6, 3.9]], cq = [];
            for (const [nm, rot, a2, b2] of cars) { const m = SPR()[nm], e = m && m[rot]; if (!e) continue; const [px, py] = pt(x + a2 - e.cx, y + b2 - e.cz, 0).split(',').map(Number); cq.push({ k: a2 + b2, s: `<image href="assets/iso/furn/${nm}_${rot}.png" x="${(px - e.ax).toFixed(1)}" y="${(py - e.ay).toFixed(1)}" width="${e.w}" height="${e.h}"/>` }); }
            cq.sort((u, v) => u.k - v.k).forEach(it => out.push(it.s));
            f(1.2, 4.9, 0.12, 0.12, 50, '#555'); f(8.6, 4.9, 0.12, 0.12, 50, '#555'); tree(9.2, 5.0);
          }
          const [lx, ly] = pt(x + w * 0.04, y + h * 0.97, 0).split(',');
          out.push(`<text x="${lx}" y="${ly}" font-size="14" fill="#3a4a38" opacity=".6" font-family="system-ui,sans-serif">${t('loc.' + name)}</text>`);
          continue;
        }
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
          /* 窗外的风：几道风丝和一片叶子在窗格里从一边飘到另一边，用窗格裁剪，方向顺着窗子 */
          const cid = 'wc' + (winN++), [x0, y0] = pt(ax, ay, 44).split(',').map(Number), [x1, y1] = pt(bx, by, 44).split(',').map(Number), dx = (x1 - x0) * 0.8, dy = (y1 - y0) * 0.8;
          out.push(`<clipPath id="${cid}"><polygon points="${[pt(ax, ay, 30), pt(bx, by, 30), pt(bx, by, 58), pt(ax, ay, 58)].join(' ')}"/></clipPath><g clip-path="url(#${cid})" style="--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px">`);
          [[36, 0], [43, -1.2], [51, -2.4]].forEach(([z, d], i) => { const [gx, gy] = pt(ax + (bx - ax) * 0.05, ay + (by - ay) * 0.05, z).split(',').map(Number), [ex, ey] = pt(ax + (bx - ax) * 0.3, ay + (by - ay) * 0.3, z).split(',').map(Number); out.push(`<path class="wgust" style="animation-delay:${d}s" d="M${gx},${gy}L${ex},${ey}" stroke="#ffffffcc" stroke-width="1.6" stroke-linecap="round"/>`); });
          const [lx0, ly0] = pt(ax + (bx - ax) * 0.1, ay + (by - ay) * 0.1, 48).split(',').map(Number); out.push(`<ellipse class="wleaf" style="animation-delay:-1.5s" cx="${lx0}" cy="${ly0}" rx="2.6" ry="1.4" fill="#6fae5c"/></g>`);
          if (sk.night) { const [sx, sy] = pt((ax * 3 + bx) / 4, (ay * 3 + by) / 4, 50).split(','); out.push(`<circle cx="${sx}" cy="${sy}" r="3" fill="#f6f1c8"/>`); }
          else if (sk.sun) { const [sx, sy] = pt((ax + bx * 3) / 4, (ay + by * 3) / 4, 50).split(','); out.push(`<circle cx="${sx}" cy="${sy}" r="3.2" fill="#ffe08a"/>`); }
        };
        if (tallBack && name !== 'toilet') win(x + w * 0.28, y, x + w * 0.72, y);
        if (tallLeft && name !== 'toilet' && h >= 4) win(x, y + h * 0.28, x, y + h * 0.72);
        if (name === 'ward') {
          const cx = x + w * 0.5; poly([pt(cx - 0.18, y, 36), pt(cx + 0.18, y, 36), pt(cx + 0.18, y, 62), pt(cx - 0.18, y, 62)], '#d9534f');
          poly([pt(cx - 0.45, y, 46), pt(cx + 0.45, y, 46), pt(cx + 0.45, y, 52), pt(cx - 0.45, y, 52)], '#d9534f');
        }
        /* 家具：Kenney 的 CC0 模型渲染成斜视精灵。坐标是相对房间左上角的格子，精灵的包围盒中心放在这一点；rot 0 面朝 gy 增加（靠后墙），1 面朝 gx 增加（靠左墙），2 面朝 gy 减少，3 面朝 gx 减少；lift 是抬高的像素，桌面上的东西用 */
        const f = (a, b, c, d, e, col, z) => box(x + a, y + b, c, d, e, col, z);
        const fl = (a, b, c, d, col) => flat(x + a, y + b, c, d, col);
        const q = [];
        const spr = (nm, rot, a, b, lift = 0, key) => {
          const m = SPR()[nm], e = m && m[rot]; if (!e) return;
          const [px, py] = pt(x + a - e.cx, y + b - e.cz, 0).split(',').map(Number);
          q.push({ k: key === undefined ? a + b : key, s: `<image href="assets/iso/furn/${nm}_${rot}.png" x="${(px - e.ax).toFixed(1)}" y="${(py - e.ay - lift).toFixed(1)}" width="${e.w}" height="${e.h}"/>` });
        };
        const L = 32;   /* 桌面的高度，像素 */
        if (name === 'bedroom') {
          const nb = W.bedCount('bedroom');
          spr('rugRound', 0, 2.2, 3.0, 0, -9);
          for (let i = 0; i < nb; i++) spr('bedSingle', 0, 0.7 + i * 1.1, 1.2);
          spr('bookcaseClosedWide', 1, 0.3, 3.2);
          spr('cardboardBoxOpen', 0, 3.55, 3.2); spr('pillow', 0, 3.55, 3.2, 14, 3.21 + 3.55);
          spr('lampRoundFloor', 0, 3.7, 0.4);
        } else if (name === 'guest') {
          const ng = W.bedCount('guest');
          for (let i = 0; i < ng; i++) spr('bedSingle', 0, 0.7 + i * 1.1, 1.2);
          spr('rugRound', 0, 2.0, 4.6, 0, -9); spr('sideTableDrawers', 0, 3.6, 0.35); spr('lampRoundTable', 0, 3.6, 0.35, 22, 3.96);
          spr('bookcaseClosedWide', 1, 0.3, 5.8); spr('pottedPlant', 0, 3.6, 7.4);
        } else if (name === 'elder') {
          const ne = W.bedCount('elder');
          for (let i = 0; i < ne; i++) spr('bedSingle', 0, 0.7 + i * 1.1, 1.2);
          spr('sideTableDrawers', 0, 2.5, 0.35); spr('lampRoundTable', 0, 2.5, 0.35, 22, 2.86);
          spr('rugRound', 0, 1.5, 3.1, 0, -9);
        } else if (name === 'toilet') {
          spr('toilet', 0, 0.55, 0.5); spr('bathroomSink', 0, 1.45, 0.4);
          spr('washer', 1, 0.35, 2.2); spr('shower', 0, 1.4, 3.2);
        } else if (name === 'study') {
          spr('desk', 0, 1.5, 0.45); spr('computerScreen', 0, 1.5, 0.35, L, 1.86); spr('computerKeyboard', 0, 1.5, 0.75, L, 2.26);
          spr('lampSquareTable', 0, 2.2, 0.35, L, 2.56);
          spr('chairDesk', 2, 1.56, 1.5);
          spr('bookcaseOpen', 1, 0.3, 2.8); spr('pottedPlant', 0, 2.7, 3.4);
        } else if (name === 'living') {
          spr('rugRound', 0, 1.9, 2.0, 0, -9);
          spr('cabinetTelevision', 1, 0.3, 2.0); spr('televisionModern', 1, 0.3, 2.0, 22, 2.31);
          spr('loungeSofaLong', 3, 3.35, 2.0); spr('tableCoffee', 1, 1.9, 2.0);
          spr('pottedPlant', 0, 0.35, 3.6); spr('lampRoundFloor', 0, 3.6, 0.5);
        } else if (name === 'kitchen') {
          spr('kitchenFridge', 0, 0.5, 0.45); spr('kitchenCabinet', 0, 1.35, 0.45); spr('kitchenSink', 0, 2.2, 0.45); spr('kitchenStove', 0, 3.05, 0.45);
          spr('table', 0, 2.0, 2.4); spr('chair', 0, 1.5, 1.75); spr('chair', 0, 2.5, 1.75); spr('chair', 2, 1.5, 3.05); spr('chair', 2, 2.5, 3.05);
          spr('trashcan', 0, 3.7, 3.5);
          if (G0().tableFood()) { spr('food-bowl-soup', 0, 2.0, 2.4, L, 4.5); spr('food-bread', 0, 1.65, 2.3, L, 4.6); spr('food-apple', 0, 2.4, 2.55, L, 4.7); }
        } else if (name === 'ward') {
          [0.8, 2.8, 4.8, 6.8].forEach((bx, i) => { spr('bedSingle', 0, bx + 0.55, 1.4); if (i < 3) f(bx + 1.5, 0.3, 0.06, 2.4, 44, '#aed0e0'); });
          spr('sideTable', 0, 8.9, 1.0); spr('kitchenFridge', 0, 8.9, 3.8);
        } else if (name === 'aisle') {
          [0.9, 3.0].forEach(bx => { spr('market-shelf-bags', 0, bx + 0.7, 1.2); spr('market-shelf-boxes', 0, bx + 1.9, 1.2); });
          spr('market-shelf-end', 1, 0.5, 3.4); spr('market-freezers-standing', 0, 6.4, 0.8); spr('market-freezers-standing', 0, 7.6, 0.8);
          spr('market-display-fruit', 0, 3.2, 3.4); spr('market-display-bread', 0, 4.6, 3.4);
          spr('market-cash-register', 0, 8.3, 3.8); spr('market-shopping-basket', 0, 6.4, 3.9); spr('market-column', 0, 9.4, 2.4);
        } else if (name === 'desk') {
          [1.7, 5.4].forEach(cx => { spr('desk', 0, cx + 0.2, 1.3); spr('computerScreen', 0, cx + 0.2, 1.2, L, cx + 1.6); spr('chairDesk', 2, cx + 0.2, 2.3); });
          spr('pottedPlant', 0, 7.4, 0.8);
        }
        for (const id in CY.house().items) if (G0().owned(id) && !G0().itemAway(id)) for (const e of CY.house().items[id]) if (e.room === name) spr(e.s, e.rot || 0, e.x, e.y, e.lift || 0, e.key);
        q.sort((a2, b2) => a2.k - b2.k).forEach(it => out.push(it.s));
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
      return `<svg viewBox="0 0 ${W.vw(place)} ${W.vh(place)}" preserveAspectRatio="xMidYMid meet">${out.join('')}</svg>`;
    },
  };

})(globalThis.CY = globalThis.CY || {});
