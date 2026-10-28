/* 角色形象：全部是代码画的扁平矢量图。
   人有两种画法：simple 简洁抽象，只有圆脸、点状的眼睛和腮红，不画鼻子和嘴，靠眼睛和腮红表达情绪；detailed 画出五官。
   可调的有肤色、发型、发色、眼镜、胡子、衣服颜色，动物和花草有颜色。人按年龄阶段画出不同的比例，婴儿头大身子小。 */
(function (CY) {
  /* 肤色：亮面，暗面。整体偏浅偏暖，避免显得发暗 */
  const SKIN = [['#fffaf6', '#f6e6dc'], ['#fff3ea', '#f3dccd'], ['#fde3d0', '#f1c9b0'], ['#f6d2b4', '#e5b793'], ['#e8bc92', '#d29f73'], ['#d9a67c', '#c18c63'], ['#a8714b', '#8f5c3a'], ['#6e4631', '#5a3726']];
  const HAIR = { black: '#2a2522', brown: '#6a4529', auburn: '#9c4a2b', blond: '#dcb86c', gray: '#b3aea6', white: '#eceae4' };
  const COAT = {
    orange: ['#e8a15c', '#f7d8b0', '#c9803c'], gray: ['#9ea0a8', '#e1e1e6', '#7d7f87'], black: ['#3b383d', '#6a6670', '#26242a'], white: ['#f2eee6', '#ffffff', '#d9d3c7'],
    tan: ['#d3a56c', '#f1dab5', '#b4854d'], brown: ['#8a5a3a', '#d6b48f', '#6b4429'], green: ['#6f9f5a', '#c9dcae', '#557d44'], yellow: ['#e5c24f', '#f7e8a8', '#b3922f'],
    rose: ['#e98aa0', '#f9d3dc', '#c9607c'],
  };
  const CLOTHES = ['#7f9580', '#b58aa5', '#7d8fa8', '#c28a6e', '#6f86a0', '#c07a6b', '#d4a24c', '#5f8a7a', '#e7a6a1', '#8fbf9f', '#4f6d8f', '#9a8fc0'];
  const dark = (hex, k = 0.82) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
  const shadow = w => `<ellipse cx="50" cy="127" rx="${w}" ry="3.5" fill="#00000018"/>`;

  function mouth(mood, cx, y) {
    const c = '#8a4a3c';
    if (mood > 0.6) return `<path d="M${cx - 6} ${y} Q${cx} ${y + 7} ${cx + 6} ${y}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
    if (mood > 0.35) return `<path d="M${cx - 4.5} ${y + 2} L${cx + 4.5} ${y + 2}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
    return `<path d="M${cx - 5} ${y + 4} Q${cx} ${y - 2} ${cx + 5} ${y + 4}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
  }

  /* 各年龄阶段的头身比例 */
  const BODY = {
    infant: { cy: 64, rx: 30, ry: 28, shY: 104, sh0: 32 },
    toddler: { cy: 60, rx: 27, ry: 26, shY: 100, sh0: 26 },
    child: { cy: 56, rx: 25, ry: 25, shY: 94, sh0: 22 },
    teen: { cy: 52, rx: 22, ry: 25, shY: 90, sh0: 14 },
    adult: { cy: 50, rx: 22, ry: 26, shY: 88, sh0: 12 },
    elder: { cy: 51, rx: 22, ry: 26, shY: 89, sh0: 13 },
  };

  function human(p) {
    const a = p.person.appearance || {}, stage = CY.game && p.species.food !== undefined ? CY.game.stage(p) : CY.content.stageOf(typeof p.person.age === 'number' ? p.person.age : 35), mood = p.state.mood;
    const detailed = CY.avatarStyle === 'detailed';
    const asleep = !!(CY.game && CY.game.isSleeping && p.id && CY.game.isSleeping(p));
    const sk = SKIN[a.skin] || SKIN[1], hc = HAIR[a.hair_color] || HAIR.black, cloth = a.cloth || '#8fa3b8';
    const B = BODY[stage] || BODY.adult, small = stage === 'infant' || stage === 'toddler' || stage === 'child';
    const cx = 50, cy = B.cy, rx = B.rx, ry = B.ry, shY = B.shY, sh0 = B.sh0;
    const L = cx - rx, R = cx + rx, chin = cy + ry;
    const elder = stage === 'elder';
    let hairStyle = a.hair_style || 'short';
    let back = '', front = '';
    if (hairStyle === 'long') back = `<path d="M${L - 4} ${cy} Q${L - 9} ${chin + 18} ${L + 3} ${chin + 26} L${R - 3} ${chin + 26} Q${R + 9} ${chin + 18} ${R + 4} ${cy}Z" fill="${hc}"/>`;
    else if (hairStyle === 'bob') back = `<path d="M${L - 4} ${cy - 2} Q${L - 8} ${chin + 4} ${L + 2} ${chin + 6} L${R - 2} ${chin + 6} Q${R + 8} ${chin + 4} ${R + 4} ${cy - 2}Z" fill="${hc}"/>`;
    else if (hairStyle === 'ponytail') back = `<path d="M${R - 2} ${cy - 10} Q${R + 20} ${cy - 4} ${R + 12} ${cy + 24} Q${R + 6} ${cy + 10} ${R - 4} ${cy + 6}Z" fill="${hc}"/>`;
    else if (hairStyle === 'curly') back = [[-4, -ry + 4], [8, -ry - 2], [-14, -ry + 10], [20, -ry + 6], [-20, -ry + 22], [26, -ry + 20], [-24, -2], [30, -2]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="10" fill="${hc}"/>`).join('');
    else if (hairStyle === 'bun') back = `<circle cx="${cx}" cy="${cy - ry - 5}" r="${small ? 7.5 : 9.5}" fill="${hc}"/>`;
    const cap = `<path d="M${L - 1} ${cy + 3} C${L - 4} ${cy - ry - 17} ${R + 4} ${cy - ry - 17} ${R + 1} ${cy + 3} C${R - 1} ${cy - 3} ${cx + 12} ${cy - ry * 0.4} ${cx - 2} ${cy - ry * 0.46} C${cx - 14} ${cy - ry * 0.34} ${L + 4} ${cy - 3} ${L + 2} ${cy + 3}Z" fill="${hc}"/>`;
    if (hairStyle === 'bald') front = stage === 'infant' ? `<path d="M${cx - 4} ${cy - ry + 1} Q${cx} ${cy - ry - 9} ${cx + 5} ${cy - ry + 1}" fill="none" stroke="${hc}" stroke-width="3" stroke-linecap="round"/>` : elder ? `<ellipse cx="${L + 1}" cy="${cy - 2}" rx="3.5" ry="8" fill="${hc}"/><ellipse cx="${R - 1}" cy="${cy - 2}" rx="3.5" ry="8" fill="${hc}"/>` : '';
    else front = cap;
    const eyeY = cy + (small ? 5 : 3), eyeDx = small ? 10 : 9.5, eyeR = small ? 3.2 : 2.6;
    /* 眼睛：心情好是弯弯的笑眼，一般是圆点，心情差是半闭的 */
    let eyes;
    if (mood > 0.78) eyes = `<g class="eyes" fill="none" stroke="#2a2522" stroke-width="2.2" stroke-linecap="round"><path d="M${cx - eyeDx - 3} ${eyeY + 1} Q${cx - eyeDx} ${eyeY - 3} ${cx - eyeDx + 3} ${eyeY + 1}"/><path d="M${cx + eyeDx - 3} ${eyeY + 1} Q${cx + eyeDx} ${eyeY - 3} ${cx + eyeDx + 3} ${eyeY + 1}"/></g>`;
    else eyes = `<g class="eyes"><ellipse cx="${cx - eyeDx}" cy="${eyeY}" rx="${eyeR}" ry="${eyeR + 0.5}" fill="#2a2522"/><ellipse cx="${cx + eyeDx}" cy="${eyeY}" rx="${eyeR}" ry="${eyeR + 0.5}" fill="#2a2522"/>
      <circle cx="${cx - eyeDx + 1}" cy="${eyeY - 1}" r="0.9" fill="#fff"/><circle cx="${cx + eyeDx + 1}" cy="${eyeY - 1}" r="0.9" fill="#fff"/></g>`;
    const lids = mood < 0.35 ? `<g fill="none" stroke="${sk[1]}" stroke-width="2.4" stroke-linecap="round"><path d="M${cx - eyeDx - 4} ${eyeY - 2.5} Q${cx - eyeDx} ${eyeY - 5.5} ${cx - eyeDx + 4} ${eyeY - 1}"/><path d="M${cx + eyeDx - 4} ${eyeY - 1} Q${cx + eyeDx} ${eyeY - 5.5} ${cx + eyeDx + 4} ${eyeY - 2.5}"/></g>` : '';
    const bc = a.hair_color === 'white' || a.hair_color === 'gray' ? '#8a857d' : hc;
    const lift = mood < 0.35 ? 1.5 : 0;
    const brows = detailed ? `<path d="M${cx - eyeDx - 4} ${eyeY - 7 + lift} Q${cx - eyeDx} ${eyeY - 9.5} ${cx - eyeDx + 4} ${eyeY - 7}" fill="none" stroke="${bc}" stroke-width="1.8" stroke-linecap="round"/><path d="M${cx + eyeDx - 4} ${eyeY - 7} Q${cx + eyeDx} ${eyeY - 9.5} ${cx + eyeDx + 4} ${eyeY - 7 + lift}" fill="none" stroke="${bc}" stroke-width="1.8" stroke-linecap="round"/>` : '';
    const nose = detailed ? `<path d="M${cx - 1.5} ${eyeY + 5} Q${cx + 2.5} ${eyeY + 8.5} ${cx - 0.5} ${eyeY + 9.5}" fill="none" stroke="${sk[1]}" stroke-width="1.6" stroke-linecap="round"/>` : '';
    const mouthY = cy + (small ? 16 : 15);
    const cheeks = `<circle cx="${cx - 15}" cy="${eyeY + 7}" r="${small ? 5 : 4.2}" fill="#f08a80" opacity="${detailed ? 0.28 : 0.38}"/><circle cx="${cx + 15}" cy="${eyeY + 7}" r="${small ? 5 : 4.2}" fill="#f08a80" opacity="${detailed ? 0.28 : 0.38}"/>`;
    let glasses = '';
    if (a.glasses === true || a.glasses === 'round') glasses = `<g fill="none" stroke="#3e3a36" stroke-width="1.6"><circle cx="${cx - eyeDx}" cy="${eyeY}" r="7"/><circle cx="${cx + eyeDx}" cy="${eyeY}" r="7"/><path d="M${cx - eyeDx + 7} ${eyeY} L${cx + eyeDx - 7} ${eyeY}"/></g>`;
    else if (a.glasses === 'square') glasses = `<g fill="none" stroke="#3e3a36" stroke-width="1.6"><rect x="${cx - eyeDx - 7}" y="${eyeY - 5.5}" width="14" height="11" rx="3"/><rect x="${cx + eyeDx - 7}" y="${eyeY - 5.5}" width="14" height="11" rx="3"/><path d="M${cx - eyeDx + 7} ${eyeY - 1} L${cx + eyeDx - 7} ${eyeY - 1}"/></g>`;
    const beard = a.beard && !small ? (detailed
      ? `<path d="M${cx - 11} ${mouthY - 3} Q${cx} ${mouthY - 8} ${cx + 11} ${mouthY - 3} Q${cx} ${mouthY - 2} ${cx - 11} ${mouthY - 3}Z" fill="${hc}"/><path d="M${cx - 10} ${mouthY + 6} Q${cx} ${chin + 8} ${cx + 10} ${mouthY + 6} Q${cx} ${mouthY + 9} ${cx - 10} ${mouthY + 6}Z" fill="${hc}"/>`
      : `<path d="M${cx - 15} ${cy + 12} Q${cx} ${cy + 20} ${cx + 15} ${cy + 12} Q${cx + 17} ${chin + 3} ${cx} ${chin + 6} Q${cx - 17} ${chin + 3} ${cx - 15} ${cy + 12}Z" fill="${hc}"/>`) : '';
    const wrinkle = detailed && elder ? `<path d="M${cx - 18} ${cy - 12} Q${cx} ${cy - 17} ${cx + 18} ${cy - 12}" fill="none" stroke="${sk[1]}" stroke-width="1.1" stroke-linecap="round"/>` : '';
    const sh1 = 100 - sh0;
    return `<svg viewBox="0 0 100 130" class="av">
      ${shadow(small ? 24 : 34)}
      ${back}
      <path d="M${sh0} 130 Q${sh0} ${shY + 3} 50 ${shY} Q${sh1} ${shY + 3} ${sh1} 130Z" fill="${cloth}"/>
      <path d="M${sh0 + 4} 130 Q${sh0 + 4} ${shY + 8} 50 ${shY + 5}" fill="none" stroke="${dark(cloth)}" stroke-width="1.2" opacity=".5"/>
      <rect x="${cx - 8.5}" y="${chin - 6}" width="17" height="${Math.max(8, shY - chin + 12)}" rx="6" fill="${sk[1]}"/>
      <path d="M${cx - 11} ${shY + 1} Q${cx} ${shY + 15} ${cx + 11} ${shY + 1} Q${cx} ${shY + 6} ${cx - 11} ${shY + 1}Z" fill="${sk[1]}"/>
      <circle cx="${L + 0.5}" cy="${cy + 4}" r="4.6" fill="${sk[0]}" stroke="${sk[1]}" stroke-width="1"/><circle cx="${R - 0.5}" cy="${cy + 4}" r="4.6" fill="${sk[0]}" stroke="${sk[1]}" stroke-width="1"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${sk[0]}" stroke="${sk[1]}" stroke-width="1"/>
      ${cheeks}${wrinkle}${nose}${eyes}${lids}${brows}${asleep ? '' : glasses}${beard}${detailed ? mouth(mood, cx, mouthY) : ''}
      ${front}
    </svg>`;
  }

  function cat(p) {
    const a = p.person.appearance || {}, [c, l, d] = COAT[a.coat] || COAT.orange, mood = p.state.mood;
    const happy = mood > 0.35, stripes = a.coat !== 'white' && a.coat !== 'black';
    return `<svg viewBox="0 0 100 130" class="av">
      ${shadow(34)}
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
      ${shadow(34)}
      <path class="tail" d="M78 114 Q98 106 94 84" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
      <path d="M22 124 Q16 92 34 84 L66 84 Q84 92 78 124Z" fill="${c}"/>
      <ellipse cx="38" cy="122" rx="9" ry="5" fill="${l}"/><ellipse cx="62" cy="122" rx="9" ry="5" fill="${l}"/>
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

  function rabbit(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.white;
    return `<svg viewBox="0 0 100 130" class="av">
      ${shadow(30)}
      <circle cx="78" cy="108" r="8" fill="${l}"/>
      <ellipse cx="50" cy="102" rx="27" ry="22" fill="${c}"/>
      <ellipse cx="50" cy="108" rx="15" ry="14" fill="${l}"/>
      <ellipse cx="38" cy="124" rx="9" ry="4.5" fill="${d}"/><ellipse cx="62" cy="124" rx="9" ry="4.5" fill="${d}"/>
      <ellipse cx="38" cy="30" rx="7" ry="22" fill="${c}"/><ellipse cx="62" cy="30" rx="7" ry="22" fill="${c}" transform="rotate(8 62 30)"/>
      <ellipse cx="38" cy="32" rx="3.4" ry="15" fill="#f2b6bd"/><ellipse cx="62" cy="32" rx="3.4" ry="15" fill="#f2b6bd" transform="rotate(8 62 32)"/>
      <ellipse cx="50" cy="66" rx="24" ry="21" fill="${c}"/>
      <ellipse cx="50" cy="73" rx="12" ry="8" fill="${l}"/>
      <g class="eyes"><circle cx="40" cy="63" r="3" fill="#26242a"/><circle cx="60" cy="63" r="3" fill="#26242a"/><circle cx="41" cy="62" r="0.9" fill="#fff"/><circle cx="61" cy="62" r="0.9" fill="#fff"/></g>
      <ellipse cx="50" cy="70" rx="3" ry="2.2" fill="#e58a96"/>
      <path d="M50 72 L50 76 M50 76 Q46 79 43 76 M50 76 Q54 79 57 76" fill="none" stroke="#8a5a52" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="32" cy="72" r="4" fill="#f08a80" opacity=".3"/><circle cx="68" cy="72" r="4" fill="#f08a80" opacity=".3"/>
    </svg>`;
  }

  function hamster(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.tan;
    return `<svg viewBox="0 0 100 130" class="av">
      ${shadow(30)}
      <circle cx="30" cy="62" r="8" fill="${d}"/><circle cx="70" cy="62" r="8" fill="${d}"/><circle cx="30" cy="62" r="4.5" fill="#f2b6bd"/><circle cx="70" cy="62" r="4.5" fill="#f2b6bd"/>
      <ellipse cx="50" cy="90" rx="33" ry="32" fill="${c}"/>
      <ellipse cx="50" cy="104" rx="19" ry="18" fill="${l}"/>
      <ellipse cx="38" cy="122" rx="8" ry="4.5" fill="#f2b6bd"/><ellipse cx="62" cy="122" rx="8" ry="4.5" fill="#f2b6bd"/>
      <g class="eyes"><circle cx="39" cy="80" r="3" fill="#26242a"/><circle cx="61" cy="80" r="3" fill="#26242a"/><circle cx="40" cy="79" r="0.9" fill="#fff"/><circle cx="62" cy="79" r="0.9" fill="#fff"/></g>
      <ellipse cx="50" cy="88" rx="3.2" ry="2.4" fill="#e58a96"/>
      <path d="M50 90 L50 94 M50 94 Q46 97 43 94 M50 94 Q54 97 57 94" fill="none" stroke="#8a5a52" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="30" cy="90" r="5" fill="#f08a80" opacity=".3"/><circle cx="70" cy="90" r="5" fill="#f08a80" opacity=".3"/>
    </svg>`;
  }

  function bird(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.yellow;
    return `<svg viewBox="0 0 100 130" class="av">
      ${shadow(26)}
      <path d="M40 108 L28 126 M48 110 L40 128" stroke="${d}" stroke-width="5" stroke-linecap="round"/>
      <path d="M44 120 L44 128 M56 120 L56 128" stroke="#e0a060" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="50" cy="92" rx="25" ry="28" fill="${c}"/>
      <ellipse cx="54" cy="98" rx="14" ry="19" fill="${l}"/>
      <ellipse cx="38" cy="94" rx="12" ry="20" fill="${d}" transform="rotate(-12 38 94)"/>
      <circle cx="50" cy="54" r="22" fill="${c}"/>
      <path d="M44 34 Q48 26 52 34" fill="none" stroke="${d}" stroke-width="3" stroke-linecap="round"/>
      <path d="M68 54 L82 58 L68 64Z" fill="#e8913a"/>
      <g class="eyes"><circle cx="58" cy="50" r="3.2" fill="#26242a"/><circle cx="59" cy="49" r="1" fill="#fff"/></g>
      <circle cx="48" cy="62" r="4.5" fill="#f08a80" opacity=".35"/>
    </svg>`;
  }

  function fish(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.orange;
    return `<svg viewBox="0 0 100 130" class="av">
      ${shadow(30)}
      <path d="M22 100 Q22 126 50 126 Q78 126 78 100Z" fill="#b9dff0" opacity=".4"/>
      <circle cx="50" cy="80" r="38" fill="#cfeaf6" opacity=".35" stroke="#9cc9de" stroke-width="2"/>
      <path d="M14 82 Q50 66 86 82" fill="#9ed2ea" opacity=".35"/>
      <path d="M32 118 q-4 -14 2 -22 M40 120 q4 -12 -1 -20" stroke="#6faa72" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g class="tail"><path d="M64 84 L80 74 Q76 86 80 98 Z" fill="${d}"/></g>
      <ellipse cx="50" cy="86" rx="20" ry="13" fill="${c}"/>
      <path d="M40 76 Q50 66 60 78Z" fill="${d}"/>
      <ellipse cx="46" cy="92" rx="9" ry="4" fill="${l}" opacity=".7"/>
      <g class="eyes"><circle cx="38" cy="83" r="2.6" fill="#26242a"/><circle cx="38.8" cy="82.2" r="0.8" fill="#fff"/></g>
      <circle cx="26" cy="70" r="2.4" fill="#fff" opacity=".6"/><circle cx="31" cy="62" r="1.8" fill="#fff" opacity=".6"/>
      <path d="M26 118 Q50 126 74 118" stroke="#9cc9de" stroke-width="2" fill="none"/>
    </svg>`;
  }

  function turtle(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.green;
    return `<svg viewBox="0 0 100 130" class="av">
      ${shadow(34)}
      <ellipse cx="30" cy="120" rx="8" ry="5" fill="${l}"/><ellipse cx="62" cy="120" rx="8" ry="5" fill="${l}"/><ellipse cx="22" cy="104" rx="6" ry="4" fill="${l}"/>
      <path d="M12 112 L4 118" stroke="${l}" stroke-width="4" stroke-linecap="round"/>
      <path d="M14 112 Q14 74 48 72 Q82 74 82 112Z" fill="${d}"/>
      <path d="M22 108 Q22 82 48 80 Q74 82 74 108Z" fill="${c}"/>
      <path d="M48 80 L48 108 M32 92 L64 92 M26 104 L70 104" stroke="${d}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
      <circle cx="86" cy="90" r="12" fill="${l}"/>
      <path d="M76 98 Q82 104 94 98" fill="none" stroke="#7a8a5a" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
      <g class="eyes"><circle cx="90" cy="86" r="2.6" fill="#26242a"/><circle cx="90.8" cy="85.2" r="0.8" fill="#fff"/></g>
    </svg>`;
  }

  function snake(p) {
    const [c, l] = COAT[(p.person.appearance || {}).coat] || COAT.green;
    return `<svg viewBox="0 0 100 130" class="av">
      ${shadow(38)}
      <path d="M14 116 Q26 88 48 102 Q72 120 82 92 Q88 74 66 68" fill="none" stroke="${c}" stroke-width="15" stroke-linecap="round"/>
      <path d="M14 116 Q26 88 48 102 Q72 120 82 92 Q88 74 66 68" fill="none" stroke="${l}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 11" opacity=".9"/>
      <ellipse cx="62" cy="62" rx="16" ry="12" fill="${c}"/>
      <ellipse cx="64" cy="66" rx="10" ry="5" fill="${l}"/>
      <g class="eyes"><circle cx="56" cy="58" r="3" fill="#f3d36a"/><circle cx="68" cy="58" r="3" fill="#f3d36a"/><ellipse cx="56" cy="58" rx="1" ry="2.4" fill="#26242a"/><ellipse cx="68" cy="58" rx="1" ry="2.4" fill="#26242a"/></g>
      <path d="M77 66 L87 68 M87 68 L91 65 M87 68 L91 71" stroke="#c0453d" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  /* 花草：心情就是健康程度，低了会蔫。盆是通用的 */
  const pot = `<path d="M30 102 L70 102 L65 126 L35 126Z" fill="#c98a62"/><rect x="27" y="97" width="46" height="8" rx="3" fill="#d9a07a"/>`;
  function succulent(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.green, droop = p.state.mood < 0.4 ? 14 : 0;
    const leaf = (ang, len, col) => `<ellipse cx="50" cy="${98 - len / 2}" rx="7" ry="${len / 2}" fill="${col}" transform="rotate(${ang + (ang === 0 ? 0 : (ang > 0 ? droop : -droop))} 50 98)"/>`;
    return `<svg viewBox="0 0 100 130" class="av">${shadow(30)}${[-62, 62, -40, 40, -18, 18].map(a => leaf(a, 30, d)).join('')}${[-50, 50, -28, 28, 0].map(a => leaf(a, 34, c)).join('')}
      <ellipse cx="50" cy="94" rx="5" ry="6" fill="${l}"/>${pot}</svg>`;
  }
  function flower(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.rose, wilt = p.state.mood < 0.4;
    const hx = wilt ? 62 : 50, hy = wilt ? 56 : 44;
    const petals = [0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="${hx}" cy="${hy - 11}" rx="6.5" ry="10" fill="${wilt ? l : c}" transform="rotate(${a} ${hx} ${hy})"/>`).join('');
    return `<svg viewBox="0 0 100 130" class="av">${shadow(30)}
      <path d="M50 100 Q${wilt ? 58 : 50} 76 ${hx} ${hy + 8}" fill="none" stroke="#5f9a58" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="38" cy="86" rx="12" ry="5.5" fill="#6faa68" transform="rotate(-28 38 86)"/><ellipse cx="62" cy="92" rx="12" ry="5.5" fill="#6faa68" transform="rotate(${wilt ? 40 : 28} 62 92)"/>
      ${petals}<circle cx="${hx}" cy="${hy}" r="6.5" fill="#f2cf5a"/>${pot}</svg>`;
  }
  function tree(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.green, wilt = p.state.mood < 0.4, col = wilt ? '#a3a85a' : c;
    return `<svg viewBox="0 0 100 130" class="av">${shadow(30)}
      <path d="M50 102 L48 62 M49 80 L34 66 M49 74 L64 60" stroke="#8a6444" stroke-width="5" stroke-linecap="round" fill="none"/>
      <circle cx="38" cy="52" r="16" fill="${col}"/><circle cx="62" cy="48" r="17" fill="${col}"/><circle cx="50" cy="36" r="17" fill="${col}"/><circle cx="46" cy="50" r="12" fill="${wilt ? '#b8bc6c' : l}" opacity=".5"/>
      ${pot}</svg>`;
  }

  function cactus(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.green, wilt = p.state.mood < 0.4, col = wilt ? '#9fa65a' : c;
    return `<svg viewBox="0 0 100 130" class="av">${shadow(30)}
      <path d="M50 100 L50 52 Q50 42 58 42 Q66 42 66 52 L66 100Z" fill="${col}" transform="translate(-8 0)"/>
      <path d="M38 78 L26 78 Q20 78 20 70 L20 62 Q20 56 26 56 Q32 56 32 62 L32 68 L40 68Z" fill="${col}"/>
      <path d="M60 86 L72 86 Q80 86 80 78 L80 68 Q80 62 74 62 Q68 62 68 68 L68 74 L60 74Z" fill="${col}"/>
      <path d="M50 52 L50 98 M42 56 L42 96" stroke="${d}" stroke-width="1.6" opacity=".5" fill="none"/>
      ${[[50, 60], [50, 72], [50, 84], [42, 66], [42, 80], [26, 64], [74, 70]].map(([x, y]) => `<path d="M${x - 2} ${y} l-3 -2 M${x + 2} ${y} l3 -2" stroke="#f5efc8" stroke-width="1.2" stroke-linecap="round"/>`).join('')}
      ${wilt ? '' : '<circle cx="50" cy="40" r="4" fill="#f08aa0"/><circle cx="50" cy="40" r="1.6" fill="#f5d36a"/>'}${pot}</svg>`;
  }
  const DRAW = { cat, dog, rabbit, hamster, bird, fish, turtle, snake, guineapig: hamster, gecko: snake, succulent, flower, tree, cactus };
  CY.avatarStyle = 'simple';
  CY.avatar = p => (DRAW[p.species.id] || human)(p);
  /* 为添加角色对话框的预览用，不需要完整的 p */
  CY.avatarPreview = (arch, look, age) => {
    const years = typeof age === 'number' ? age : arch.age;
    return CY.avatar({ species: { id: arch.species }, state: { mood: 0.7 }, person: { age: years, appearance: look } });
  };
  CY.avatarOptions = {
    skin: SKIN.map(s => s[0]), hairColor: Object.keys(HAIR), hairColorHex: HAIR, hairStyle: ['short', 'long', 'bob', 'ponytail', 'bun', 'curly', 'bald'],
    glasses: ['none', 'round', 'square'], clothes: CLOTHES, coat: Object.keys(COAT), coatHex: Object.fromEntries(Object.entries(COAT).map(([k, v]) => [k, v[0]])),
    coatBySpecies: { cat: ['orange', 'gray', 'black', 'white'], dog: ['tan', 'brown', 'black', 'white'], rabbit: ['white', 'gray', 'brown', 'black'], hamster: ['tan', 'white', 'brown', 'gray'], bird: ['yellow', 'green', 'white', 'gray'], fish: ['orange', 'white', 'yellow', 'black'], turtle: ['green', 'brown', 'tan', 'yellow'], snake: ['green', 'yellow', 'brown', 'black'], succulent: ['green', 'tan', 'gray', 'brown'], cactus: ['green', 'tan', 'gray', 'brown'], flower: ['rose', 'orange', 'yellow', 'white'], tree: ['green', 'tan', 'brown', 'yellow'], guineapig: ['tan', 'white', 'brown', 'gray'], gecko: ['green', 'yellow', 'brown', 'black'] },
  };
})(globalThis.CY = globalThis.CY || {});
