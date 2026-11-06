/* 角色形象：全部是代码画的扁平矢量图。
   人是豆子造型，只有点状的眼睛和腮红，靠眼睛和腮红表达情绪。可调的有肤色、发型、发色、眼镜、胡子、衣服颜色，动物和花草有颜色。
   人按年龄阶段画出不同的比例，婴儿矮圆，老人略驼。 */
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

  function hedgehog(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.brown;
    const spikes = [-78, -62, -46, -30, -14, 2, 18, 34, 50, 66, 82].map(a => { const r = a * Math.PI / 180, x1 = 50 + 31 * Math.sin(r), y1 = 90 - 29 * Math.cos(r), x2 = 50 + 44 * Math.sin(r), y2 = 90 - 42 * Math.cos(r); return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${d}" stroke-width="5" stroke-linecap="round"/>`; }).join('');
    return `<svg viewBox="0 0 100 130" class="av">${shadow(30)}${spikes}
      <ellipse cx="50" cy="92" rx="34" ry="30" fill="${c}"/>
      <ellipse cx="50" cy="104" rx="23" ry="19" fill="${l}"/>
      <circle cx="32" cy="76" r="6" fill="${l}"/><circle cx="68" cy="76" r="6" fill="${l}"/>
      <g class="eyes"><circle cx="41" cy="97" r="2.8" fill="#26242a"/><circle cx="59" cy="97" r="2.8" fill="#26242a"/><circle cx="42" cy="96" r="0.9" fill="#fff"/><circle cx="60" cy="96" r="0.9" fill="#fff"/></g>
      <ellipse cx="50" cy="106" rx="4" ry="3" fill="#3a2f2a"/>
      <path d="M50 108 Q46 112 43 109 M50 108 Q54 112 57 109" fill="none" stroke="#8a5a52" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="34" cy="104" r="4" fill="#f08a80" opacity=".3"/><circle cx="66" cy="104" r="4" fill="#f08a80" opacity=".3"/>
      <ellipse cx="38" cy="123" rx="8" ry="4" fill="${d}"/><ellipse cx="62" cy="123" rx="8" ry="4" fill="${d}"/>
    </svg>`;
  }
  function duck(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.yellow;
    return `<svg viewBox="0 0 100 130" class="av">${shadow(28)}
      <path d="M40 118 l-6 8 l12 0z M62 118 l-6 8 l12 0z" fill="#e8913a"/>
      <ellipse cx="50" cy="96" rx="31" ry="26" fill="${c}"/>
      <ellipse cx="34" cy="98" rx="11" ry="17" fill="${d}" transform="rotate(14 34 98)"/>
      <path d="M78 90 Q92 80 88 94 Q84 100 78 98Z" fill="${c}"/>
      <circle cx="50" cy="52" r="22" fill="${c}"/>
      <ellipse cx="62" cy="66" rx="15" ry="8" fill="#f0a23a"/><path d="M50 66 Q62 71 74 66" fill="none" stroke="#c9791e" stroke-width="1.4" stroke-linecap="round"/>
      <g class="eyes"><circle cx="46" cy="48" r="3.2" fill="#26242a"/><circle cx="47" cy="47" r="1" fill="#fff"/></g>
      <circle cx="40" cy="60" r="4.5" fill="#f08a80" opacity=".3"/>
    </svg>`;
  }
  function ferret(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.tan;
    return `<svg viewBox="0 0 100 130" class="av">${shadow(32)}
      <path d="M14 110 Q4 100 12 88" stroke="${d}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="42" cy="104" rx="34" ry="17" fill="${c}"/>
      <ellipse cx="44" cy="112" rx="22" ry="8" fill="${l}"/>
      <ellipse cx="24" cy="120" rx="7" ry="4" fill="${d}"/><ellipse cx="58" cy="120" rx="7" ry="4" fill="${d}"/>
      <circle cx="72" cy="80" r="17" fill="${c}"/>
      <path d="M58 76 Q72 66 86 76 Q86 84 72 84 Q58 84 58 76Z" fill="${d}"/>
      <circle cx="61" cy="66" r="5" fill="${d}"/><circle cx="83" cy="66" r="5" fill="${d}"/>
      <ellipse cx="72" cy="88" rx="8" ry="6" fill="${l}"/><ellipse cx="72" cy="85" rx="2.6" ry="2" fill="#3a2f2a"/>
      <g class="eyes"><circle cx="66" cy="78" r="2.6" fill="#26242a"/><circle cx="78" cy="78" r="2.6" fill="#26242a"/></g>
    </svg>`;
  }
  function axolotl(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.rose;
    const gill = (x, dir) => [0, 1, 2].map(i => `<path d="M${x} ${72 + i * 9} q${dir * 14} ${-4 + i * 2} ${dir * 20} ${-8 + i * 6}" stroke="${d}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`).join('');
    return `<svg viewBox="0 0 100 130" class="av">${shadow(30)}
      <path d="M22 118 Q50 128 78 118" stroke="#9cc9de" stroke-width="2" fill="none"/>
      <path d="M62 110 Q86 110 90 100" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="104" rx="26" ry="14" fill="${c}"/>
      <ellipse cx="28" cy="116" rx="7" ry="4" fill="${d}"/><ellipse cx="72" cy="116" rx="7" ry="4" fill="${d}"/>
      ${gill(32, -1)}${gill(68, 1)}
      <ellipse cx="50" cy="80" rx="25" ry="22" fill="${c}"/>
      <ellipse cx="50" cy="92" rx="16" ry="8" fill="${l}"/>
      <g class="eyes"><circle cx="40" cy="78" r="2.8" fill="#26242a"/><circle cx="60" cy="78" r="2.8" fill="#26242a"/><circle cx="41" cy="77" r="0.9" fill="#fff"/><circle cx="61" cy="77" r="0.9" fill="#fff"/></g>
      <path d="M43 88 Q50 94 57 88" fill="none" stroke="#8a5a52" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="33" cy="87" r="4" fill="#f08a80" opacity=".35"/><circle cx="67" cy="87" r="4" fill="#f08a80" opacity=".35"/>
    </svg>`;
  }
  function chicken(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.white;
    return `<svg viewBox="0 0 100 130" class="av">${shadow(28)}
      <path d="M42 112 l0 12 m16 -12 l0 12" stroke="#e0a060" stroke-width="3" stroke-linecap="round"/>
      <path d="M72 84 Q92 70 88 98 Q80 100 72 98Z" fill="${d}"/>
      <ellipse cx="48" cy="94" rx="28" ry="24" fill="${c}"/>
      <ellipse cx="42" cy="98" rx="13" ry="17" fill="${l}" transform="rotate(-10 42 98)"/>
      <circle cx="46" cy="56" r="18" fill="${c}"/>
      <path d="M38 40 q2 -10 6 -2 q3 -10 7 -2 q4 -8 6 2 Z" fill="#d94a4a"/>
      <path d="M60 56 L72 60 L60 64Z" fill="#e8913a"/><path d="M58 64 q0 10 -5 8 q-1 -6 3 -8Z" fill="#d94a4a"/>
      <g class="eyes"><circle cx="54" cy="52" r="3" fill="#26242a"/><circle cx="55" cy="51" r="0.9" fill="#fff"/></g>
      <circle cx="44" cy="62" r="4" fill="#f08a80" opacity=".3"/>
    </svg>`;
  }
  function orchid(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.rose, wilt = p.state.mood < 0.4;
    const blossom = (x, y) => [0, 72, 144, 216, 288].map(a => `<ellipse cx="${x}" cy="${y - 8}" rx="5" ry="8" fill="${wilt ? l : c}" transform="rotate(${a} ${x} ${y})"/>`).join('') + `<circle cx="${x}" cy="${y}" r="3.4" fill="#f2cf5a"/>`;
    return `<svg viewBox="0 0 100 130" class="av">${shadow(30)}
      <path d="M50 100 Q52 70 40 50 Q34 40 30 38" fill="none" stroke="#5f9a58" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="34" cy="94" rx="18" ry="6" fill="#6faa68" transform="rotate(-24 34 94)"/><ellipse cx="68" cy="94" rx="18" ry="6" fill="#6faa68" transform="rotate(24 68 94)"/>
      ${blossom(30, 40)}${blossom(42, 58)}${blossom(48, 76)}${pot}</svg>`;
  }
  function bamboo(p) {
    const [c, l, d] = COAT[(p.person.appearance || {}).coat] || COAT.green, wilt = p.state.mood < 0.4, col = wilt ? '#b3b768' : c;
    const stalk = (x, top) => `<rect x="${x - 3}" y="${top}" width="6" height="${100 - top}" rx="3" fill="${col}"/>${[0, 1, 2].map(i => `<path d="M${x - 3} ${top + 14 + i * 16} h6" stroke="${d}" stroke-width="1.6"/>`).join('')}`;
    const leaf = (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="3.4" fill="${wilt ? '#a8ab5a' : l}" transform="rotate(${a} ${x} ${y})"/>`;
    return `<svg viewBox="0 0 100 130" class="av">${shadow(30)}
      ${stalk(38, 30)}${stalk(50, 18)}${stalk(62, 36)}
      ${leaf(46, 28, -20)}${leaf(56, 24, 20)}${leaf(34, 40, -30)}${leaf(68, 44, 26)}${leaf(46, 44, -10)}${pot}</svg>`;
  }

  /* ---------- 豆子造型：头和身子是一个轮廓，可在设置里选 ----------
     A 整只衣服色加肤色脸盘，没有手脚；B 同 A，加手和脚；C 上半肤色下半衣服，加手脚。
     手脚是独立的小椭圆，走路和照顾时用 CSS 动起来，不用骨骼。
     朝向：dir 是斜视里的四个方向 se、sw、ne、nw，朝下的两个脸转向一侧，朝上的两个只看见后脑勺和头发，左右靠整体镜像得到；没有 dir 就是正对着看的样子。 */
const BEAN_STAGE = { infant: { w: 66, h: 62 }, toddler: { w: 64, h: 70 }, child: { w: 62, h: 80 }, teen: { w: 60, h: 90 }, adult: { w: 64, h: 92 }, elder: { w: 66, h: 88 } };
let beanUid = 0;

/* 穿衣小豆：上半肤色，下半衣服，有手有脚 */
function beanDraw(o) {
  const id = 'bn' + (beanUid++), B = BEAN_STAGE[o.stage], w = B.w, h = B.h, bot = 122, top = bot - h, cx = 50, L = cx - w / 2, R = cx + w / 2;
  const sk = SKIN[o.skin] || SKIN[1], hc = HAIR[o.hair] || HAIR.black, cloth = o.cloth, small = ['infant', 'toddler', 'child'].includes(o.stage);
  const r1 = Math.min(h * 0.5, w * 0.62), y1 = top + r1, y2 = bot - h * 0.12;
  const shape = `M${L} ${y1} A${w / 2} ${r1} 0 0 1 ${R} ${y1} L${R} ${y2} Q${R} ${bot} ${R - w * 0.22} ${bot} L${L + w * 0.22} ${bot} Q${L} ${bot} ${L} ${y2}Z`;
  const eyeY = top + r1 * 0.98, eyeDx = Math.min(11, w * 0.2), mood = o.mood;
  const dir = o.dir, away = dir === 'ne' || dir === 'nw', turned = dir === 'se' || dir === 'sw', mirror = dir === 'sw' || dir === 'nw', fx = turned ? 11 : 0;
  let back = '', front = '';
  const fy = top + r1 * 0.6;
  const capPath = `M${L - 4} ${top - 4} L${R + 4} ${top - 4} L${R + 4} ${fy} Q${cx + w * 0.22} ${fy + 9} ${cx + 2} ${fy - 2} Q${cx - w * 0.2} ${fy + 7} ${L - 4} ${fy + 3}Z`;
  const st = o.style;
  if (st === 'long') back = `<path d="M${L - 5} ${y1} Q${L - 9} ${bot - 14} ${L + 4} ${bot - 18} L${R - 4} ${bot - 18} Q${R + 9} ${bot - 14} ${R + 5} ${y1}Z" fill="${hc}"/>`;
  else if (st === 'bob') back = `<path d="M${L - 4} ${y1} Q${L - 7} ${y1 + 22} ${L + 3} ${y1 + 24} L${R - 3} ${y1 + 24} Q${R + 7} ${y1 + 22} ${R + 4} ${y1}Z" fill="${hc}"/>`;
  else if (st === 'bun') back = `<circle cx="${cx}" cy="${top - 4}" r="${small ? 8 : 10}" fill="${hc}"/>`;
  else if (st === 'ponytail' && away) back = `<ellipse cx="${cx}" cy="${top + r1 * 1.3}" rx="7" ry="14" fill="${hc}"/>`;
  else if (st === 'ponytail' && turned) back = `<path d="M${L + 4} ${top + r1 * 0.5} Q${L - 22} ${top + r1 * 0.5} ${L - 12} ${top + r1 * 1.6} Q${L - 8} ${top + r1 * 0.9} ${L + 6} ${top + r1 * 0.9}Z" fill="${hc}"/>`;
  else if (st === 'ponytail') back = `<path d="M${R - 4} ${top + r1 * 0.5} Q${R + 22} ${top + r1 * 0.5} ${R + 12} ${top + r1 * 1.6} Q${R + 8} ${top + r1 * 0.9} ${R - 6} ${top + r1 * 0.9}Z" fill="${hc}"/>`;
  else if (st === 'curly') back = [[-12, 2], [0, -3], [12, 2], [-19, 12], [19, 12]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${top + dy + 4}" r="11" fill="${hc}"/>`).join('');
  const hb = top + r1 * 1.3, backCap = `<path d="M${L - 4} ${top - 4} L${R + 4} ${top - 4} L${R + 4} ${hb} Q${cx} ${hb + 8} ${L - 4} ${hb}Z" fill="${hc}"/>`;
  if (away) front = st === 'bald' ? '' : backCap;
  else if (st !== 'bald') front = `<path d="${capPath}" fill="${hc}"/>`;
  else if (o.stage === 'infant') front = `<path d="M${cx - 4} ${top + 3} Q${cx} ${top - 6} ${cx + 5} ${top + 3}" fill="none" stroke="${hc}" stroke-width="3" stroke-linecap="round"/>`;
  else if (o.stage === 'elder') front = `<ellipse cx="${L + 3}" cy="${eyeY - 4}" rx="3.5" ry="9" fill="${hc}"/><ellipse cx="${R - 3}" cy="${eyeY - 4}" rx="3.5" ry="9" fill="${hc}"/>`;

  const eyes = o.asleep
    ? `<g class="eyes" fill="none" stroke="#2a2522" stroke-width="2.2" stroke-linecap="round"><path d="M${cx - eyeDx - 3} ${eyeY} Q${cx - eyeDx} ${eyeY + 3} ${cx - eyeDx + 3} ${eyeY}"/><path d="M${cx + eyeDx - 3} ${eyeY} Q${cx + eyeDx} ${eyeY + 3} ${cx + eyeDx + 3} ${eyeY}"/></g>`
    : mood > 0.78
    ? `<g class="eyes" fill="none" stroke="#2a2522" stroke-width="2.2" stroke-linecap="round"><path d="M${cx - eyeDx - 3} ${eyeY + 1} Q${cx - eyeDx} ${eyeY - 3} ${cx - eyeDx + 3} ${eyeY + 1}"/><path d="M${cx + eyeDx - 3} ${eyeY + 1} Q${cx + eyeDx} ${eyeY - 3} ${cx + eyeDx + 3} ${eyeY + 1}"/></g>`
    : `<g class="eyes"><ellipse cx="${cx - eyeDx}" cy="${eyeY}" rx="2.7" ry="3.2" fill="#2a2522"/><ellipse cx="${cx + eyeDx}" cy="${eyeY}" rx="2.7" ry="3.2" fill="#2a2522"/><circle cx="${cx - eyeDx + 1}" cy="${eyeY - 1}" r=".9" fill="#fff"/><circle cx="${cx + eyeDx + 1}" cy="${eyeY - 1}" r=".9" fill="#fff"/></g>`;
  const lids = mood < 0.35 ? `<g fill="none" stroke="${sk[1]}" stroke-width="2.6" stroke-linecap="round"><path d="M${cx - eyeDx - 4} ${eyeY - 3} Q${cx - eyeDx} ${eyeY - 6} ${cx - eyeDx + 4} ${eyeY - 1}"/><path d="M${cx + eyeDx - 4} ${eyeY - 1} Q${cx + eyeDx} ${eyeY - 6} ${cx + eyeDx + 4} ${eyeY - 3}"/></g>` : '';
  const cheeks = `<circle cx="${cx - eyeDx - 5}" cy="${eyeY + 7}" r="4.4" fill="#f08a80" opacity=".4"/><circle cx="${cx + eyeDx + 5}" cy="${eyeY + 7}" r="4.4" fill="#f08a80" opacity=".4"/>`;
  const glasses = o.glasses && o.glasses !== 'none' && !o.asleep ? `<g fill="none" stroke="#3e3a36" stroke-width="1.6"><circle cx="${cx - eyeDx}" cy="${eyeY}" r="6.8"/><circle cx="${cx + eyeDx}" cy="${eyeY}" r="6.8"/><path d="M${cx - eyeDx + 6.8} ${eyeY} L${cx + eyeDx - 6.8} ${eyeY}"/></g>` : '';
  const beard = o.beard && !small ? `<path d="M${cx - w * 0.42} ${eyeY + 6} Q${cx - w * 0.44} ${eyeY + 24} ${cx} ${eyeY + 27} Q${cx + w * 0.44} ${eyeY + 24} ${cx + w * 0.42} ${eyeY + 6} Q${cx} ${eyeY + 13} ${cx - w * 0.42} ${eyeY + 6}Z" fill="${hc}"/>` : '';

  /* 躯体：上半肤色，下半衣服 */
  let torso;
  const stroke = `stroke="${dark(sk[0], 0.8)}" stroke-width="1"`;
  {
    const sp = top + h * 0.6;
    torso = `<path d="${shape}" fill="${sk[0]}" ${stroke}/><g clip-path="url(#${id})"><rect x="${L - 2}" y="${sp}" width="${w + 4}" height="${h}" fill="${cloth}"/><path d="M${L - 2} ${sp} Q${cx} ${sp + 9} ${R + 2} ${sp}" fill="none" stroke="${dark(cloth, 0.78)}" stroke-width="1.4"/></g>`;
  }
  const limbs = `<ellipse class="foot l" cx="${cx - w * 0.2}" cy="${bot + 1}" rx="${small ? 7 : 8.5}" ry="4.5" fill="#4a4048"/><ellipse class="foot r" cx="${cx + w * 0.2}" cy="${bot + 1}" rx="${small ? 7 : 8.5}" ry="4.5" fill="#4a4048"/>`;
  const hands = `<ellipse class="hand l" cx="${L - 1}" cy="${top + h * 0.7}" rx="5" ry="6" fill="${sk[0]}" stroke="${sk[1]}" stroke-width="1"/><ellipse class="hand r" cx="${R + 1}" cy="${top + h * 0.7}" rx="5" ry="6" fill="${sk[0]}" stroke="${sk[1]}" stroke-width="1"/>`;
  const lean = o.stage === 'elder' ? ' transform="rotate(-2 50 122)"' : '';
  /* 朝上的人看不见脸，长头发垂在身后，画在躯体上面 */
  const face = away ? '' : `<g${fx ? ` transform="translate(${cx + fx} 0) scale(.86 1) translate(${-cx} 0)"` : ''}>${cheeks}${eyes}${lids}${glasses}${beard}</g>`;
  const hairOver = away ? back : '';
  const body = `${limbs}<g class="bean"${lean}>${away ? '' : back}${torso}${hairOver}
      <g clip-path="url(#${id})">${front}</g>
      ${face}
      ${hands}
    </g>`;
  return `<svg viewBox="0 0 100 135" class="av" data-top="${top}"${dir ? ` data-dir="${dir}"` : ''}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
    ${mirror ? '<g transform="translate(100 0) scale(-1 1)">' : '<g>'}<ellipse cx="50" cy="127" rx="${w * 0.6}" ry="3.5" fill="#00000018"/>
    ${body}</g></svg>`;
}
  const beanHuman = (p, dir) => {
    const a = p.person.appearance || {}, G = CY.game;
    const stage = G && p.species.food !== undefined ? G.stage(p) : CY.content.stageOf(typeof p.person.age === 'number' ? p.person.age : 35);
    return beanDraw({ stage: BEAN_STAGE[stage] ? stage : 'adult', skin: a.skin === undefined ? 1 : a.skin, hair: a.hair_color || 'black', style: a.hair_style || 'short', cloth: CY.avatarColor(p), glasses: a.glasses, beard: a.beard, mood: p.state.mood, asleep: !!(G && G.isSleeping && p.id && G.isSleeping(p)), dir: dir || '' });
  };
  const DRAW = { hedgehog, duck, ferret, axolotl, chicken, orchid, bamboo, cat, dog, rabbit, hamster, bird, fish, turtle, snake, guineapig: hamster, gecko: snake, succulent, flower, tree, cactus };
  /* CY.figure：人的造型，设置里选。dressed 穿衣小豆，默认，上半肤色下半衣服，精灵图没加载完时也退回它；sprite 迷你小人精灵，Kenney 素材渲染，动物和花草也跟着用精灵。
     只换人，动物和花草不变 */
  CY.FIGURES = ['dressed', 'sprite'];
  /* 迷你小人要有精灵图才能用；有的运行包为了文件数限制不带精灵图（itch.io 一个压缩包最多 1000 个文件），那时只提供穿衣小豆，旧设置里选了迷你小人也退回穿衣小豆 */
  CY.figuresAvailable = () => CY.FIGURES.filter(k => k !== 'sprite' || !!((CY.isoSprites || {}).char));
  CY.figureOf = v => (CY.figuresAvailable().includes(v) ? v : 'dressed');
  CY.figure = 'dressed';
  CY.DIRS = ['se', 'sw', 'ne', 'nw'];
  /* ---------- 人物精灵：Kenney 的 CC0 小人渲染成四个朝向，站，走，坐，睡四种姿势。肤色在浏览器里按玩家的选择重着色 ----------
     图没加载完，或者没有图像环境（测试），就先画原来的矢量豆子。 */
    const CHAR_KEYS = ['female-a', 'female-b', 'female-c', 'female-d', 'female-e', 'female-f', 'male-a', 'male-b', 'male-c', 'male-d', 'male-e', 'male-f'];
  const STAGE_K = { infant: 0.72, toddler: 0.78, child: 0.86, teen: 0.95, adult: 1, elder: 0.96 };   /* 年龄之间的差距压小，宝宝不至于小得看不清 */
  const ROT = { '': 0, sw: 0, se: 1, ne: 2, nw: 3 };
  const hashOf = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  CY.charKeys = CHAR_KEYS;
  /* 这个人用哪个形象：看外观里选的，没选就按性别和编号定一个，不会变 */
  CY.charKeyOf = (p) => {
    const a = (p.person && p.person.appearance) || {};
    if (CHAR_KEYS.includes(a.model)) return a.model;
    const she = CY.content.pron((p.person && p.person.pronoun) || '') === 'she', pool = CHAR_KEYS.filter(k => k.startsWith(she ? 'female' : 'male'));
    return pool[hashOf((p.person && p.person.id) || (p.id) || (a.hair_style || '') + (a.cloth || '')) % pool.length];
  };
  let sprUid = 0;
  /* 肤色重着色不读像素（直接打开 index.html 时图片算跨域，读不了）：同一张图盖两层，上面一层用滤镜按比例放大每个通道，再用皮肤遮罩只留下皮肤的部分 */
  const sprite = (p, dir, pose) => {
    const M = (CY.isoSprites || {}).char; if (!M || typeof document === 'undefined') return null;
    const key = CY.charKeyOf(p), m = M[key]; if (!m) return null;
    const rot = pose === 'sleep' ? 0 : ROT[dir] || 0, base = `assets/iso/char/${key}_${pose}_${rot}`, e = m[pose] && m[pose][rot]; if (!e) return null;
    const a = (p.person && p.person.appearance) || {}, G = CY.game, stage = G && p.species.food !== undefined ? G.stage(p) : CY.content.stageOf(typeof p.person.age === 'number' ? p.person.age : 35);
    const sk = a.skin === undefined ? null : SKIN[a.skin], k = 1.43 * (STAGE_K[stage] || 1) * (pose === 'sleep' ? 0.85 : 1);
    const x = (50 - e.ax * k).toFixed(1), y = (124 - e.ay * k).toFixed(1), w = (e.w * k).toFixed(1), h = (e.h * k).toFixed(1);
    const hueOf = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
    /* 三块可以换色的区域：皮肤和头发按通道比例放大，衣服按色相转过去；每块一张遮罩，滤镜只作用在遮罩里 */
    const layers = [];
    if (sk && m.skin) { const to = hexRgb(sk[1]), r = to.map((v, i) => +(v / m.skin[i]).toFixed(3)); layers.push(['m', `<feColorMatrix type="matrix" values="${r[0]} 0 0 0 0 0 ${r[1]} 0 0 0 0 0 ${r[2]} 0 0 0 0 0 1 0"/>`]); }
    if (a.hair_color && HAIR[a.hair_color] && m.hair) { const to = hexRgb(HAIR[a.hair_color]), r = to.map((v, i) => +(Math.min(4, v / Math.max(20, m.hair[i]))).toFixed(3)); layers.push(['h', `<feColorMatrix type="matrix" values="${r[0]} 0 0 0 0 0 ${r[1]} 0 0 0 0 0 ${r[2]} 0 0 0 0 0 1 0"/>`]); }
    if (/^#[0-9a-f]{6}$/i.test(a.cloth || '') && m.cloth) { const deg = Math.round(hueOf(hexRgb(a.cloth)) - hueOf(m.cloth)); layers.push(['c', `<feColorMatrix type="hueRotate" values="${deg}"/>`]); }
    let tint = '';
    for (const [suf, fx] of layers) {
      const id = 'sp' + (sprUid++);
      tint += `<defs><filter id="${id}f" color-interpolation-filters="sRGB">${fx}</filter><mask id="${id}m" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}"><image href="${base}_${suf}.png" x="${x}" y="${y}" width="${w}" height="${h}"/></mask></defs><image href="${base}.png" x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#${id}f)" mask="url(#${id}m)"/>`;
    }
    /* 婴儿出门坐在婴儿车里：车画在婴儿前面，遮住下半身 */
    let cart = '';
    if (G && G.usingStroller && G.usingStroller(p)) { const cm = ((CY.isoSprites || {}).furn || {})['market-shopping-cart'], ce = cm && cm[rot]; if (ce) { const ck = 0.62; cart = `<image href="assets/iso/furn/market-shopping-cart_${rot}.png" x="${(50 - ce.ax * ck).toFixed(1)}" y="${(124 - ce.ay * ck + 4).toFixed(1)}" width="${(ce.w * ck).toFixed(1)}" height="${(ce.h * ck).toFixed(1)}"/>`; } }
    return `<svg viewBox="0 0 100 130" class="av" style="overflow:visible"><ellipse cx="50" cy="124" rx="${(22 * (STAGE_K[stage] || 1)).toFixed(1)}" ry="4" fill="#00000022"/><image href="${base}.png" x="${x}" y="${(+y - (cart ? 6 : 0)).toFixed(1)}" width="${w}" height="${h}"/>${tint}${cart}</svg>`;
  };
  /* 动物和花草的精灵：动物来自 Kenney 的 Cube Pets，花草用家具包里的植物放大；没有逐种对应的用最接近的，没有就退回矢量画法 */
  const petSprite = (p, dir, asleep) => {
    const M = (CY.isoSprites || {}).pet; if (!M || typeof document === 'undefined') return null;
    const m = M[p.species.id]; if (!m) return null;
    const pose = !asleep && dir && m.walk ? 'walk' : 'stand', rot = ROT[dir || ''] || 0, e = m[pose] && m[pose][rot]; if (!e) return null;
    const base = `assets/iso/pet/${p.species.id}_${pose}_${rot}`, k = 0.85;   /* 宠物比人小，也不比宝宝大 */
    return `<svg viewBox="0 0 100 130" class="av" style="overflow:visible"><ellipse cx="50" cy="124" rx="${Math.max(10, e.w * k * 0.4).toFixed(1)}" ry="4" fill="#00000022"/><image href="${base}.png" x="${(50 - e.ax * k).toFixed(1)}" y="${(124 - e.ay * k).toFixed(1)}" width="${(e.w * k).toFixed(1)}" height="${(e.h * k).toFixed(1)}"/></svg>`;
  };
  CY.avatarBean = (p, dir) => beanHuman(p, dir || 'se');   /* 分享卡用：不管设置里选了哪种造型，画成穿衣小豆，纯矢量，能放进画布 */
  CY.avatar = (p, dir, pose) => {
    if (DRAW[p.species.id]) { const G0 = CY.game; return CY.figure !== 'sprite' ? DRAW[p.species.id](p) : petSprite(p, dir || '', !!(G0 && G0.isSleeping && p.id && G0.isSleeping(p))) || DRAW[p.species.id](p); }
    const G = CY.game, asleep = pose !== 'awake' && !!(G && G.isSleeping && p.id && (G.isSleeping(p) || (G.bedridden && G.bedridden(p) && !G.flag(p, 'outing'))));
    const wc = ((p.person && (p.person.archetype || p.person.card)) || '') === 'wheelchair_user';   /* 坐轮椅的家人一直坐在轮椅里，睡着了才躺下 */
    const pz = asleep ? 'sleep' : (wc || (G && G.usingWheelchair && G.usingWheelchair(p) && pose !== 'sit')) ? 'chair' : pose === 'sit' ? 'sit' : dir && pose !== 'stand' ? 'walk' : 'stand';
    return (CY.figure === 'sprite' ? sprite : () => null)(p, dir || '', pz) || beanHuman(p, dir);
  };
  /* 为添加角色对话框的预览用，不需要完整的 p */
  CY.avatarPreview = (arch, look, age) => {
    const years = typeof age === 'number' ? age : arch.age;
    return CY.avatar({ species: { id: arch.species }, state: { mood: 0.7 }, person: { age: years, appearance: look, pronoun: arch.pronoun || 'he' } });
  };
  CY.avatarOptions = {
    skin: SKIN.map(s => s[0]), hairColor: Object.keys(HAIR), hairColorHex: HAIR, hairStyle: ['short', 'long', 'bob', 'ponytail', 'bun', 'curly', 'bald'],
    glasses: ['none', 'round', 'square'], clothes: CLOTHES, coat: Object.keys(COAT), coatHex: Object.fromEntries(Object.entries(COAT).map(([k, v]) => [k, v[0]])),
    coatBySpecies: { cat: ['orange', 'gray', 'black', 'white'], dog: ['tan', 'brown', 'black', 'white'], rabbit: ['white', 'gray', 'brown', 'black'], hamster: ['tan', 'white', 'brown', 'gray'], bird: ['yellow', 'green', 'white', 'gray'], fish: ['orange', 'white', 'yellow', 'black'], turtle: ['green', 'brown', 'tan', 'yellow'], snake: ['green', 'yellow', 'brown', 'black'], succulent: ['green', 'tan', 'gray', 'brown'], cactus: ['green', 'tan', 'gray', 'brown'], flower: ['rose', 'orange', 'yellow', 'white'], tree: ['green', 'tan', 'brown', 'yellow'], guineapig: ['tan', 'white', 'brown', 'gray'], hedgehog: ['brown', 'gray', 'tan', 'white'], duck: ['yellow', 'white', 'brown', 'gray'], ferret: ['tan', 'brown', 'white', 'black'], axolotl: ['rose', 'white', 'gray', 'black'], chicken: ['white', 'brown', 'yellow', 'black'], orchid: ['rose', 'white', 'yellow', 'green'], bamboo: ['green', 'yellow', 'tan', 'brown'], gecko: ['green', 'yellow', 'brown', 'black'] },
  };
  /* 统计和分享共用角色主色；不为重色另选颜色。无人形衣服的角色用毛色或花草颜色。 */
  CY.avatarColor = p => {
    const a = p && p.person.appearance || {}, species = p && p.species.id;
    const coats = CY.avatarOptions.coatBySpecies[species];
    return coats ? (COAT[a.coat] || COAT[coats[0]])[0] : a.cloth || '#8fa3b8';
  };
})(globalThis.CY = globalThis.CY || {});
