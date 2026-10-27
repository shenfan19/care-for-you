/* 角色形象：全部是代码画的扁平矢量图。选项：肤色、发型、发色、眼镜、胡子、衣服颜色；动物有毛色。 */
(function (CY) {
  /* 肤色：亮面，暗面 */
  const SKIN = [['#fde3d0', '#f3c7ac'], ['#f6d2b4', '#e5b793'], ['#e8bc92', '#d29f73'], ['#c98f63', '#b0774c'], ['#9a6542', '#7f4f31'], ['#684230', '#53321f']];
  const HAIR = { black: '#2a2522', brown: '#6a4529', auburn: '#9c4a2b', blond: '#dcb86c', gray: '#b3aea6', white: '#eceae4' };
  const COAT = {
    orange: ['#e8a15c', '#f7d8b0', '#c9803c'], gray: ['#9ea0a8', '#e1e1e6', '#7d7f87'], black: ['#3b383d', '#6a6670', '#26242a'], white: ['#f2eee6', '#ffffff', '#d9d3c7'],
    tan: ['#d3a56c', '#f1dab5', '#b4854d'], brown: ['#8a5a3a', '#d6b48f', '#6b4429'], green: ['#6f9f5a', '#c9dcae', '#557d44'], yellow: ['#d9b44a', '#f2e3a8', '#b3922f'],
  };
  const CLOTHES = ['#7f9580', '#b58aa5', '#7d8fa8', '#c28a6e', '#6f86a0', '#c07a6b', '#d4a24c', '#5f8a7a', '#e7a6a1', '#8fbf9f', '#4f6d8f', '#9a8fc0'];
  const dark = (hex, k = 0.82) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');

  function mouth(mood, cx, y) {
    const c = '#8a4a3c';
    if (mood > 0.6) return `<path d="M${cx - 6} ${y} Q${cx} ${y + 7} ${cx + 6} ${y}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
    if (mood > 0.35) return `<path d="M${cx - 4.5} ${y + 2} L${cx + 4.5} ${y + 2}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
    return `<path d="M${cx - 5} ${y + 4} Q${cx} ${y - 2} ${cx + 5} ${y + 4}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
  }

  function human(p) {
    const a = p.person.appearance || {}, stage = p.person.age_stage || 'adult', mood = p.state.mood;
    const sk = SKIN[a.skin] || SKIN[1], hc = HAIR[a.hair_color] || HAIR.black, cloth = a.cloth || '#8fa3b8';
    const child = stage === 'child', elder = stage === 'elder';
    const cx = 50, cy = child ? 56 : 50, rx = child ? 25 : 22, ry = child ? 25 : 26;
    const L = cx - rx, R = cx + rx, chin = cy + ry;
    const shY = child ? 93 : 88, sh0 = child ? 22 : 12;
    const hairStyle = a.hair_style || 'short';
    let back = '', front = '';
    /* 头发后层 */
    if (hairStyle === 'long') back = `<path d="M${L - 4} ${cy} Q${L - 9} ${chin + 18} ${L + 3} ${chin + 26} L${R - 3} ${chin + 26} Q${R + 9} ${chin + 18} ${R + 4} ${cy}Z" fill="${hc}"/>`;
    else if (hairStyle === 'bob') back = `<path d="M${L - 4} ${cy - 2} Q${L - 8} ${chin + 4} ${L + 2} ${chin + 6} L${R - 2} ${chin + 6} Q${R + 8} ${chin + 4} ${R + 4} ${cy - 2}Z" fill="${hc}"/>`;
    else if (hairStyle === 'ponytail') back = `<path d="M${R - 2} ${cy - 10} Q${R + 20} ${cy - 4} ${R + 12} ${cy + 24} Q${R + 6} ${cy + 10} ${R - 4} ${cy + 6}Z" fill="${hc}"/>`;
    else if (hairStyle === 'curly') back = [[-4, -ry + 4], [8, -ry - 2], [-14, -ry + 10], [20, -ry + 6], [-20, -ry + 22], [26, -ry + 20], [-24, -2], [30, -2]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="10" fill="${hc}"/>`).join('');
    else if (hairStyle === 'bun') back = `<circle cx="${cx}" cy="${cy - ry - 5}" r="9.5" fill="${hc}"/>`;
    /* 头发前层 */
    const cap = `<path d="M${L - 1} ${cy + 3} C${L - 4} ${cy - ry - 17} ${R + 4} ${cy - ry - 17} ${R + 1} ${cy + 3} C${R - 1} ${cy - 3} ${cx + 12} ${cy - ry * 0.4} ${cx - 2} ${cy - ry * 0.46} C${cx - 14} ${cy - ry * 0.34} ${L + 4} ${cy - 3} ${L + 2} ${cy + 3}Z" fill="${hc}"/>`;
    if (hairStyle === 'bald') front = elder ? `<ellipse cx="${L + 1}" cy="${cy - 2}" rx="3.5" ry="8" fill="${hc}"/><ellipse cx="${R - 1}" cy="${cy - 2}" rx="3.5" ry="8" fill="${hc}"/>` : '';
    else front = cap;
    const eyeY = cy + (child ? 5 : 3), eyeDx = child ? 10 : 9.5, eyeR = child ? 3.1 : 2.5;
    const eyes = `<g class="eyes"><ellipse cx="${cx - eyeDx}" cy="${eyeY}" rx="${eyeR}" ry="${eyeR + 0.6}" fill="#2a2522"/><ellipse cx="${cx + eyeDx}" cy="${eyeY}" rx="${eyeR}" ry="${eyeR + 0.6}" fill="#2a2522"/>
      <circle cx="${cx - eyeDx + 1}" cy="${eyeY - 1}" r="0.9" fill="#fff"/><circle cx="${cx + eyeDx + 1}" cy="${eyeY - 1}" r="0.9" fill="#fff"/></g>`;
    const bc = hairStyle === 'bald' && !elder ? '#6b5a4a' : (a.hair_color === 'white' || a.hair_color === 'gray' ? '#8a857d' : hc);
    const lift = mood < 0.35 ? 1.5 : 0;
    const brows = `<path d="M${cx - eyeDx - 4} ${eyeY - 7 + lift} Q${cx - eyeDx} ${eyeY - 9.5} ${cx - eyeDx + 4} ${eyeY - 7}" fill="none" stroke="${bc}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M${cx + eyeDx - 4} ${eyeY - 7} Q${cx + eyeDx} ${eyeY - 9.5} ${cx + eyeDx + 4} ${eyeY - 7 + lift}" fill="none" stroke="${bc}" stroke-width="1.8" stroke-linecap="round"/>`;
    const nose = `<path d="M${cx - 1.5} ${eyeY + 5} Q${cx + 2.5} ${eyeY + 8.5} ${cx - 0.5} ${eyeY + 9.5}" fill="none" stroke="${sk[1]}" stroke-width="1.6" stroke-linecap="round"/>`;
    const mouthY = cy + (child ? 16 : 15);
    const cheeks = `<circle cx="${cx - 15}" cy="${eyeY + 8}" r="${child ? 4.5 : 3.8}" fill="#f08a80" opacity=".28"/><circle cx="${cx + 15}" cy="${eyeY + 8}" r="${child ? 4.5 : 3.8}" fill="#f08a80" opacity=".28"/>`;
    let glasses = '';
    if (a.glasses === true || a.glasses === 'round') glasses = `<g fill="none" stroke="#3e3a36" stroke-width="1.6"><circle cx="${cx - eyeDx}" cy="${eyeY}" r="7"/><circle cx="${cx + eyeDx}" cy="${eyeY}" r="7"/><path d="M${cx - eyeDx + 7} ${eyeY} L${cx + eyeDx - 7} ${eyeY}"/></g>`;
    else if (a.glasses === 'square') glasses = `<g fill="none" stroke="#3e3a36" stroke-width="1.6"><rect x="${cx - eyeDx - 7}" y="${eyeY - 5.5}" width="14" height="11" rx="3"/><rect x="${cx + eyeDx - 7}" y="${eyeY - 5.5}" width="14" height="11" rx="3"/><path d="M${cx - eyeDx + 7} ${eyeY - 1} L${cx + eyeDx - 7} ${eyeY - 1}"/></g>`;
    const beard = a.beard ? `<path d="M${cx - 11} ${mouthY - 3} Q${cx} ${mouthY - 8} ${cx + 11} ${mouthY - 3} Q${cx} ${mouthY - 2} ${cx - 11} ${mouthY - 3}Z" fill="${hc}"/>
      <path d="M${cx - 10} ${mouthY + 6} Q${cx} ${chin + 8} ${cx + 10} ${mouthY + 6} Q${cx} ${mouthY + 9} ${cx - 10} ${mouthY + 6}Z" fill="${hc}"/>` : '';
    const wrinkle = elder ? `<path d="M${cx - 18} ${cy - 12} Q${cx} ${cy - 17} ${cx + 18} ${cy - 12} M${cx - 16} ${eyeY + 5} L${cx - 20} ${eyeY + 7} M${cx + 16} ${eyeY + 5} L${cx + 20} ${eyeY + 7}" fill="none" stroke="${sk[1]}" stroke-width="1.1" stroke-linecap="round"/>` : '';
    return `<svg viewBox="0 0 100 130" class="av">
      <ellipse cx="50" cy="127" rx="${child ? 24 : 34}" ry="3.5" fill="#00000018"/>
      ${back}
      <path d="M${sh0} 130 Q${sh0} ${shY + 3} 50 ${shY} Q${100 - sh0} ${shY + 3} ${100 - sh0} 130Z" fill="${cloth}"/>
      <path d="M${sh0 + 4} 130 Q${sh0 + 4} ${shY + 8} 50 ${shY + 5}" fill="none" stroke="${dark(cloth)}" stroke-width="1.2" opacity=".5"/>
      <rect x="${cx - 8.5}" y="${chin - 6}" width="17" height="${shY - chin + 12}" rx="6" fill="${sk[1]}"/>
      <path d="M${cx - 11} ${shY + 1} Q${cx} ${shY + 15} ${cx + 11} ${shY + 1} Q${cx} ${shY + 6} ${cx - 11} ${shY + 1}Z" fill="${sk[1]}"/>
      <circle cx="${L + 0.5}" cy="${cy + 4}" r="4.6" fill="${sk[0]}"/><circle cx="${R - 0.5}" cy="${cy + 4}" r="4.6" fill="${sk[0]}"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${sk[0]}"/>
      ${cheeks}${wrinkle}${nose}${eyes}${brows}${glasses}${beard}${mouth(mood, cx, mouthY)}
      ${front}
    </svg>`;
  }

  function cat(p) {
    const a = p.person.appearance || {}, [c, l, d] = COAT[a.coat] || COAT.orange, mood = p.state.mood;
    const happy = mood > 0.35, stripes = a.coat !== 'white' && a.coat !== 'black';
    return `<svg viewBox="0 0 100 130" class="av">
      <ellipse cx="50" cy="126" rx="34" ry="3.5" fill="#00000018"/>
      <path class="tail" d="M76 116 Q104 112 96 82" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
      <path d="M22 124 Q16 94 36 84 L64 84 Q84 94 78 124Z" fill="${c}"/>
      ${stripes ? `<path d="M30 100 L38 102 M28 110 L37 111 M70 100 L62 102 M72 110 L63 111" stroke="${d}" stroke-width="2.4" stroke-linecap="round"/>` : ''}
      <ellipse cx="38" cy="122" rx="9" ry="5" fill="${l}"/><ellipse cx="62" cy="122" rx="9" ry="5" fill="${l}"/>
      <polygon points="20,58 25,28 46,46" fill="${c}"/><polygon points="80,58 75,28 54,46" fill="${c}"/>
      <polygon points="26,52 28,36 40,46" fill="#e9a0a0"/><polygon points="74,52 72,36 60,46" fill="#e9a0a0"/>
      <ellipse cx="50" cy="64" rx="31" ry="25" fill="${c}"/>
      ${stripes ? `<path d="M50 40 L50 48 M42 41 L43 48 M58 41 L57 48" stroke="${d}" stroke-width="2.4" stroke-linecap="round"/>` : ''}
      <ellipse cx="50" cy="73" rx="12" ry="9" fill="${l}"/>
      <g class="eyes"><ellipse cx="38" cy="62" rx="4" ry="${happy ? 5 : 3}" fill="#f3d36a"/><ellipse cx="62" cy="62" rx="4" ry="${happy ? 5 : 3}" fill="#f3d36a"/>
        <ellipse cx="38" cy="62" rx="1.6" ry="${happy ? 4.2 : 2.4}" fill="#26242a"/><ellipse cx="62" cy="62" rx="1.6" ry="${happy ? 4.2 : 2.4}" fill="#26242a"/></g>
      <polygon points="47,70 53,70 50,74" fill="#e08a86"/>
      <path d="M50 74 Q46 79 42 76 M50 74 Q54 79 58 76" fill="none" stroke="#7a4a3e" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M18 68 L34 71 M18 75 L34 75 M82 68 L66 71 M82 75 L66 75" stroke="#ffffffaa" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`;
  }

  function dog(p) {
    const a = p.person.appearance || {}, [c, l, d] = COAT[a.coat] || COAT.tan, mood = p.state.mood;
    return `<svg viewBox="0 0 100 130" class="av">
      <ellipse cx="50" cy="126" rx="34" ry="3.5" fill="#00000018"/>
      <path class="tail" d="M78 114 Q98 106 94 84" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
      <path d="M22 124 Q16 92 34 84 L66 84 Q84 92 78 124Z" fill="${c}"/>
      <ellipse cx="38" cy="122" rx="9" ry="5" fill="${l}"/><ellipse cx="62" cy="122" rx="9" ry="5" fill="${l}"/>
      <path d="M72 94 Q92 82 90 108" fill="none" stroke="#c4584c" stroke-width="0"/>
      <ellipse cx="22" cy="58" rx="9" ry="19" fill="${d}" transform="rotate(14 22 58)"/><ellipse cx="78" cy="58" rx="9" ry="19" fill="${d}" transform="rotate(-14 78 58)"/>
      <ellipse cx="50" cy="62" rx="28" ry="25" fill="${c}"/>
      <ellipse cx="50" cy="72" rx="15" ry="11" fill="${l}"/>
      <g class="eyes"><circle cx="39" cy="58" r="3.2" fill="#26242a"/><circle cx="61" cy="58" r="3.2" fill="#26242a"/><circle cx="40" cy="57" r="1" fill="#fff"/><circle cx="62" cy="57" r="1" fill="#fff"/></g>
      <path d="M32 50 Q39 46 45 50 M55 50 Q61 46 68 50" fill="none" stroke="${d}" stroke-width="1.8" stroke-linecap="round" ${mood < 0.35 ? 'transform="translate(0 -1.5)"' : ''}/>
      <ellipse cx="50" cy="68" rx="5.5" ry="4" fill="#2a2522"/>
      <path d="M50 72 L50 77 M50 77 Q44 82 40 77 M50 77 Q56 82 60 77" fill="none" stroke="#5a3b30" stroke-width="1.6" stroke-linecap="round"/>
      ${mood > 0.6 ? '<path d="M46 80 Q50 90 54 80Z" fill="#e0707a"/>' : ''}
      <path d="M30 92 Q50 104 70 92" fill="none" stroke="#c4584c" stroke-width="5" stroke-linecap="round"/>
    </svg>`;
  }

  function snake(p) {
    const a = p.person.appearance || {}, [c, l, d] = COAT[a.coat] || COAT.green;
    return `<svg viewBox="0 0 100 130" class="av">
      <ellipse cx="50" cy="126" rx="38" ry="3.5" fill="#00000018"/>
      <path d="M14 116 Q26 88 48 102 Q72 120 82 92 Q88 74 66 68" fill="none" stroke="${c}" stroke-width="15" stroke-linecap="round"/>
      <path d="M14 116 Q26 88 48 102 Q72 120 82 92 Q88 74 66 68" fill="none" stroke="${l}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 11" opacity=".9"/>
      <ellipse cx="62" cy="62" rx="16" ry="12" fill="${c}"/>
      <ellipse cx="64" cy="66" rx="10" ry="5" fill="${l}"/>
      <g class="eyes"><circle cx="56" cy="58" r="3" fill="#f3d36a"/><circle cx="68" cy="58" r="3" fill="#f3d36a"/><ellipse cx="56" cy="58" rx="1" ry="2.4" fill="#26242a"/><ellipse cx="68" cy="58" rx="1" ry="2.4" fill="#26242a"/></g>
      <path d="M77 66 L87 68 M87 68 L91 65 M87 68 L91 71" stroke="#c0453d" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  CY.avatar = p => (p.species.id === 'cat' ? cat(p) : p.species.id === 'dog' ? dog(p) : p.species.id === 'snake' ? snake(p) : human(p));
  /* 为添加角色对话框的预览用，不需要完整的 p */
  CY.avatarPreview = (arch, look, name) => {
    const species = { id: arch.species };
    return CY.avatar({ species, state: { mood: 0.7 }, person: { age_stage: arch.age_stage, appearance: look } });
  };
  CY.avatarOptions = {
    skin: SKIN.map(s => s[0]), hairColor: Object.keys(HAIR), hairColorHex: HAIR, hairStyle: ['short', 'long', 'bob', 'ponytail', 'bun', 'curly', 'bald'],
    hairStyleLabel: ['短发', '长发', '齐肩', '马尾', '发髻', '卷发', '光头'], glasses: ['none', 'round', 'square'], glassesLabel: ['无', '圆框', '方框'],
    clothes: CLOTHES, coat: Object.keys(COAT), coatHex: Object.fromEntries(Object.entries(COAT).map(([k, v]) => [k, v[0]])),
    coatBySpecies: { cat: ['orange', 'gray', 'black', 'white'], dog: ['tan', 'brown', 'black', 'white'], snake: ['green', 'yellow', 'brown', 'black'] },
  };
})(globalThis.CY = globalThis.CY || {});
