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
  const FLOOR = { bedroom: '#e8d2ae', elder: '#e3cba6', toilet: '#cfe3e6', study: '#dcc59f', living: '#ebd7b4', kitchen: '#ece4d2', yard: '#a3cc8e', lawn: '#9fcc86', road: '#8f8f96', ward: '#e2ebed', desk: '#dbd7c9' };
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
            f(0.4, 0.05, 2.6, 0.95, 62, '#e9b872'); f(3.3, 0.05, 2.6, 0.95, 62, '#9ec3a8'); f(6.2, 0.05, 3.2, 0.95, 62, '#d98c8c');
            fl(0.4, 1.0, 2.6, 0.2, '#c0392b'); fl(3.3, 1.0, 2.6, 0.2, '#2e86c1'); fl(6.2, 1.0, 3.2, 0.2, '#f1c40f');
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

})(globalThis.CY = globalThis.CY || {});
