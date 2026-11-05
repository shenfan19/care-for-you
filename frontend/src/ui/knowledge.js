/* 百科：设置里打开，也可以从操作面板和发生的事里的下划线链接直达某一条。
   左边是条目，右边是这一条当前的设计。内容从实时的模板和参数生成，改了数值页面跟着变；
   有现实依据的节奏仍然写游戏里是多少，现实里是多少，出处是什么，没有出处的就写游戏设定，数据来自 CY.references。涉及疾病和用药的地方固定写明不是医疗建议。
   条目编号：need:需求 act:动作 item:用品 cond:疾病 stage:阶段 sys:系统规则 refs:参考文献。
   系统规则的长文只有简体中文和英文，其他语言回落到英文。 */
(function (CY) {
  const G = CY.game, U = CY.ui = CY.ui || {};
  const t = (k, v) => CY.t(k, v), esc = U.esc, R = CY.references;
  const pick = o => (o ? o[CY.i18n.lang] || (/^zh/.test(CY.i18n.lang) ? o['zh-CN'] : '') || o.en || '' : '');
  const fmtH = h => (h >= 10 ? Math.round(h) : Math.round(h * 10) / 10) + ' h';
  const stageName = s => (s === 'all' ? t('know.stage_all') : t('know.stage_' + s));
  /* 需求的显示名：内部用同一个键，到了界面才换成说法。同一个键在不同物种里说法可以不同，比如口渴，水生动物叫水位低了；
     百科里的条目以人的说法为准，人没有这项的才用别的物种的 */
  const needDef = k => { const sp = G.tpl.species || {}; if (sp.human && sp.human.needs && sp.human.needs[k]) return sp.human.needs[k]; for (const x of Object.values(sp)) if (x.needs && x.needs[k]) return x.needs[k]; for (const c of Object.values(G.tpl.conditions || {})) if (c.needs && c.needs[k]) return c.needs[k]; return null; };
  const needLabel = k => CY.tOr('need.' + k, (needDef(k) || {}).label || k);
  const needIcon = k => (needDef(k) || {}).icon || '•';
  const plain = l => (l && typeof l === 'object' ? l.default || Object.values(l)[0] || '' : l || '');
  const actLabel = a => CY.tOr('act.' + a.id, plain(a.label) || a.id);
  const itemName = id => CY.tOr('shop.' + id, id);
  const ZH = () => /^zh/.test(CY.i18n.lang);
  const LONG = o => pick(o);

  /* ---------- 链接 ---------- */
  U.pediaLink = (id, text) => `<a class="pl" href="#" data-pedia="${esc(id)}">${esc(text)}</a>`;
  /* 动作，需求，病名的引用换成条目编号 */
  const refId = keys => { for (const k of keys || []) { let m; if ((m = /^act\.([^.]+)/.exec(k))) return 'act:' + m[1]; if ((m = /^need\.(.+)$/.exec(k))) return 'need:' + m[1]; if ((m = /^cond\.(.+)$/.exec(k))) return 'cond:' + m[1]; } return null; };
  /* 发生的事的文字，动作名，需求名，病名变成下划线链接，其余和 G.entryText 一样 */
  U.entryHtml = e => {
    if (!(e.k && CY.i18n.hasOwn(e.k))) return linkNames(esc(e.text));
    const links = [], args = {};
    for (const [k, v] of Object.entries(e.a || {})) {
      if (v && typeof v === 'object' && v.t) {
        const txt = v.t.reduceRight((fb, key) => CY.tOr(key, fb), v.d), id = refId(v.t), vm = /^visitor\.([^.]+)\.name$/.exec(v.t[0] || '');
        if (vm) { args[k] = '\u0001' + links.length + '\u0002'; links.push(`<a class="pl" href="#" data-visitor="${esc(vm[1])}">${esc(txt)}</a>`); }
        else if (id && U.pediaHas(id)) { args[k] = '\u0001' + links.length + '\u0002'; links.push(U.pediaLink(id, txt)); } else args[k] = txt;
      } else args[k] = v;
    }
    return linkNames(esc(t(e.k, args)).replace(/\u0001(\d+)\u0002/g, (m, i) => links[i]));
  };
  /* 文字里出现的家人名字变成下划线链接，点开看状态；只改标签之外的文字，已经是链接的不再套 */
  const linkNames = html => {
    const names = G.people.filter(p => p.person.name && p.person.name.length >= 2).sort((a, b) => b.person.name.length - a.person.name.length);
    if (!names.length) return html;
    const byName = new Map(names.map(p => [esc(p.person.name), p.id])), re = new RegExp([...byName.keys()].map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    return html.split(/(<a[\s\S]*?<\/a>|<[^>]+>)/).map(seg => (seg[0] === '<' ? seg : seg.replace(re, n => `<a class="pl" href="#" data-person="${esc(byName.get(n))}">${n}</a>`))).join('');
  };
  U.nameLink = pid => { const p = G.get(pid); return p ? `<a class="pl" href="#" data-person="${esc(p.id)}">${esc(p.person.name)}</a>` : esc(pid); };

  /* ---------- 条目 ---------- */
  const badge = st => `<span class="kbadge ${st}">${esc(t('know.' + st))}</span>`;
  const refsHtml = it => ((it && it.refs) || []).length ? `<ul class="krefs">${it.refs.map(id => { const s = R.sources[id]; return `<li>${esc(s.cite)}${s.url ? ` <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">link</a>` : ''}</li>`; }).join('')}</ul>` : '';
  const field = (k, v) => (v === '' || v === undefined ? '' : `<div class="pf"><span class="pk">${esc(t('pedia.f_' + k))}</span><span>${v}</span></div>`);
  const sec = (title, body) => `<h4>${esc(title)}</h4>${body}`;
  const allActions = () => { const m = {}; for (const sp of Object.values(G.tpl.species || {})) for (const [id, a] of Object.entries(sp.actions || {})) if (!m[id]) m[id] = Object.assign({ id }, a); for (const c of Object.values(G.tpl.conditions || {})) for (const [id, a] of Object.entries(c.actions || {})) if (!m[id]) m[id] = Object.assign({ id }, a); return m; };
  const needKeys = () => { const s = new Set(); for (const sp of Object.values(G.tpl.species || {})) for (const k in sp.needs || {}) s.add(k); return [...s]; };

  const needBody = k => {
    const r = R.rows().find(x => x.need === k), it = r && r.item, real = it ? pick(it.real) : pick(R.setting);
    const game = r ? r.ivs.map(x => `${esc(stageName(x.stage))} ${fmtH(x.h)}`).join(' · ') : '';
    const hr = it && it.real_h ? `${it.real_h[0] === it.real_h[1] ? it.real_h[0] : it.real_h[0] + '-' + it.real_h[1]} h` : '';
    const by = Object.values(allActions()).filter(a => a.effect && a.effect[k] > 0 && !a.selfonly).map(a => U.pediaLink('act:' + a.id, actLabel(a)));
    return `<p>${badge(it ? it.status : 'setting')}</p>` + field('game', game) + field('real', hr) + `<p>${esc(real)}</p>${it && it.note ? `<p class="mute">${esc(pick(it.note))}</p>` : ''}${refsHtml(it)}` + sec(t('pedia.f_by'), by.length ? `<p>${by.join(' · ')}</p>` : '<p class="mute">-</p>');
  };
  const actBody = a => {
    const eff = Object.entries(a.effect || {}).filter(([, v]) => v > 0).map(([k, v]) => `${U.pediaLink('need:' + k, needLabel(k))} ${Math.round(v * 100)}%`).join(' · ');
    const tags = [];
    if (a.household) tags.push(t('pedia.t_household')); if (a.selfonly) tags.push(t('pedia.t_selfonly')); if (a.nap) tags.push(t('pedia.t_nap')); if (a.outing) tags.push(t('pedia.t_outing')); if (a.carry) tags.push(t('pedia.t_carry'));
    const items = a.item_for ? Object.entries(a.item_for).map(([st, id]) => `${esc(stageName(st))}: ${U.pediaLink('item:' + id, itemName(id))}`).join(' · ') : '';
    const gate = a.gate ? t('pedia.n_gate', { need: needLabel(a.gate.need), min: Math.round(a.gate.min * 100) }) : '';
    return field('stages', (a.stages || []).map(s => esc(stageName(s))).join(' · ')) + field('hold', a.hold ? t('unit.sec', { n: a.hold }) : '') + field('min', a.min ? a.min + ' min' : '') + field('effect', eff) + field('item', items) + field('gate', esc(gate)) + field('flags', esc(tags.join(' · ')));
  };
  const itemBody = id => {
    const it = G.SHOP.find(x => x.id === id) || {};
    const acts = Object.values(allActions()).filter(a => a.item_for && Object.values(a.item_for).includes(id)).map(a => U.pediaLink('act:' + a.id, actLabel(a)));
    return `<p>${esc(CY.tOr('shop.' + id + '_fx', ''))}</p>` + field('price', it.price !== undefined ? '💰 ' + it.price : '') + field('requires', it.needs ? U.pediaLink('item:' + it.needs, itemName(it.needs)) : '') + field('acts', acts.join(' · '));
  };
  const condBody = c => {
    const d = G.tpl.conditions[c] || {}, needs = Object.keys(d.needs || {}).map(k => esc(CY.tOr('need.' + k, d.needs[k].label || k))).join(' · ');
    const acts = Object.entries(d.actions || {}).map(([id, a]) => U.pediaLink('act:' + id, actLabel(Object.assign({ id }, a))));
    return `<p class="warn">${esc(pick(R.medical))}</p><p class="mute">${esc(t('know.cond_note'))}</p>` + field('needs', needs) + field('acts', acts.join(' · ')) + field('heal', d.heal_after ? esc(t('pedia.n_heal', { need: CY.tOr('need.' + d.heal_after.need, d.heal_after.need), n: d.heal_after.count })) : '');
  };
  const stageBody = s => {
    const c = (G.tpl.classes || {})[s] || {}, r = c.routine;
    const tags = []; if (c.cries) tags.push(t('pedia.t_cries')); if (c.needs_caregiver) tags.push(t('pedia.t_caregiver'));
    const acts = Object.values(allActions()).filter(a => (a.stages || []).includes(s) && !a.selfonly).map(a => U.pediaLink('act:' + a.id, actLabel(a)));
    return field('urgency', c.urgency !== undefined ? c.urgency : '') + field('selfcare', c.self_care !== undefined ? Math.round(c.self_care * 100) + '%' : '') + field('flags', esc(tags.join(' · '))) +
      (r ? field('routine', esc(`${t('pedia.n_wake')} ${r.wake} · ${t('pedia.n_bed')} ${r.bed}${r.meals ? ' · ' + t('pedia.n_meals') + ' ' + r.meals.join(' ') : ''}`)) : '') + field('acts', acts.join(' · '));
  };
  const sysArticles = () => {
    const C = (G.dispatch && G.dispatch.cfg()) || {};
    const pc = x => Math.round(x * 100) + '%';
    return {
      time: { 'zh-CN': `<p>标准模式下现实 1 秒是游戏 1 分钟，现实约 24 分钟是游戏的一天，当前流速是 ×${Math.round(G.speed())}。加速模式把游戏时间加快，钱仍按现实时间算，所以加速不多赚一分钱。</p><p>需求的增长速度跟着钟面走，每个人什么时候饿、渴、困贴近真实的间隔。专注的爬升按游戏时间，${(G.FOCUS || { minutes: 20 }).minutes} 个游戏分钟。关掉页面游戏就停在那里，没有离线推进。</p>`,
        en: `<p>In standard mode one real second is one game minute, so a game day takes about 24 real minutes. The current speed is ×${Math.round(G.speed())}. Fast mode runs game time faster, but money is still counted in real time, so speeding up earns nothing extra.</p><p>Need growth follows the clock, so when people get hungry, thirsty or tired stays close to real intervals. Focus ramps in game time, ${(G.FOCUS || { minutes: 20 }).minutes} game minutes. Closing the page pauses the game; nothing advances offline.</p>` },
      dispatch: { 'zh-CN': `<p>家里有一个统一的看护调度，每 ${C.step_minutes || 5} 个游戏分钟看一次全家，决定谁看护谁、谁做哪件事、谁换班去睡。玩家当主角时主角不被调度，其他人照常。</p><ul><li>盯人：醒着的婴儿和幼儿必须有一位成人或老人盯着，睡着的不用。现任看护人精力够就不换。</li><li>睡眠底线：不在盯人、手也空，疲劳到 ${pc(C.sleep_at || 0.72)}，就去睡 ${C.nap_minutes || 120} 分钟；睡着的人被需要时先叫醒。</li><li>两条独立的精力通道：盯着一个人，和手上的活，各自消耗，每小时额外疲劳是 ${pc(C.watch_extra || 0.03)} 和 ${pc(C.hands_extra || 0.04)}。同一个人又盯又做，两条同时耗，不会因为在一个人身上而变轻。</li><li>需求拆分：被照顾的人每项需求压力超过 ${pc(C.act_at || 0.45)} 就派人动手，一人一步一件事，所以喂奶和哄睡可以由两个人同时做。</li><li>喂养方式：配方奶谁都能冲；母乳时婴儿饿了只有妈妈一类的人能喂，睡着也叫醒。</li><li>做饭：醒着的人饿到 ${pc(C.meal_at || 0.6)}，派一个手空的人做饭，占手上的活 ${C.cook_minutes || 45} 分钟。</li><li>耗竭：看护人疲劳过了线，出手效果逐步降低，最低打 ${pc(1 - (C.depl_loss || 0.5))}。没有人可以替班的看护人不会放弃，后果由虚弱度承担。</li><li>家人出手的效果是玩家自己动手的 ${pc(C.efficiency || 0.7)}。</li></ul>`,
        en: `<p>The household has one shared care scheduler. Every ${C.step_minutes || 5} game minutes it looks at the whole family and decides who watches whom, who does which task, and who hands over to sleep. When you play a character, that character is not scheduled; everyone else is.</p><ul><li>Watching: an awake infant or toddler must have an adult or elder watching. A sleeping one does not. The current watcher stays while their energy holds.</li><li>Sleep floor: someone who is not watching, has free hands and reaches ${pc(C.sleep_at || 0.72)} fatigue goes to sleep for ${C.nap_minutes || 120} minutes; a sleeper who is needed is woken first.</li><li>Two independent energy channels: watching a person and doing a task each cost energy, adding ${pc(C.watch_extra || 0.03)} and ${pc(C.hands_extra || 0.04)} fatigue per hour. Doing both costs both; combining them in one person does not make them lighter.</li><li>Splitting needs: each need above ${pc(C.act_at || 0.45)} pressure gets a person, one task per person per step, so feeding and settling to sleep can happen at once with two people.</li><li>Feeding: formula can be made by anyone; with breastfeeding only the mother can feed, and is woken if asleep.</li><li>Cooking: when someone is hungry at ${pc(C.meal_at || 0.6)}, one free-handed person cooks, occupying their hands for ${C.cook_minutes || 45} minutes.</li><li>Depletion: past the fatigue line a carer's effect drops, down to ${pc(1 - (C.depl_loss || 0.5))}. A carer with nobody to hand over to does not give up; frailty bears the cost.</li><li>Family help is ${pc(C.efficiency || 0.7)} as effective as doing it yourself.</li></ul>` },
      outing: { 'zh-CN': `<p>婴儿和幼儿不能单独留在家里。带人出门时，家里还有别人看护，他们就留下；没有人看护了，他们跟着一起出门，这是规则推出来的。</p><ul><li>没有婴儿车：只有成年人当主角才抱得动婴儿，老人，少年，小孩当主角抱不稳。</li><li>有了婴儿车：谁都能推着婴儿出门，爷爷奶奶也可以。</li><li>卧床的老人要有轮椅才能被推出门。</li><li>家里有不能单独留下、又带不走的人时，出不了门，面板底部会写原因。</li></ul>`,
        en: `<p>Infants and toddlers cannot be left home alone. When someone goes out, those who still have someone at home stay; otherwise they come along. This follows from the rule, it is not a special case.</p><ul><li>Without a stroller: only an adult lead can carry an infant; an elder, teen or child lead cannot hold one steady.</li><li>With a stroller: anyone can push the infant out, grandparents included.</li><li>A bedridden elder needs a wheelchair to be taken out.</li><li>If someone at home can neither be left alone nor taken along, nobody can go out, and the panel says why.</li></ul>` },
    };
  };
  const SYS = ['time', 'dispatch', 'outing'];
  const sysTitle = { time: { 'zh-CN': '时间与昼夜', en: 'Time and day' }, dispatch: { 'zh-CN': '看护调度', en: 'Care scheduling' }, outing: { 'zh-CN': '外出与婴儿车', en: 'Going out and the stroller' } };

  /* 目录：编号，分组，标题，图标，正文函数；按语言和模板缓存，改了设置或换语言重建 */
  let cache = null;
  const index = () => {
    const key = CY.i18n.lang + '|' + (G.tpl.species ? Object.keys(G.tpl.species).length : 0) + '|' + Object.keys(G.tpl.conditions || {}).length + '|' + G.speed();
    if (cache && cache.key === key) return cache;
    const list = [];
    for (const k of needKeys()) list.push({ id: 'need:' + k, group: 'needs', title: needLabel(k), icon: needIcon(k), body: () => needBody(k) });
    for (const a of Object.values(allActions()).sort((x, y) => actLabel(x).localeCompare(actLabel(y)))) list.push({ id: 'act:' + a.id, group: 'actions', title: actLabel(a), icon: '', body: () => actBody(a) });
    for (const it of G.SHOP) list.push({ id: 'item:' + it.id, group: 'items', title: itemName(it.id), icon: it.icon, body: () => itemBody(it.id) });
    for (const c of Object.keys(G.tpl.conditions || {})) list.push({ id: 'cond:' + c, group: 'conds', title: CY.tOr('cond.' + c, (G.tpl.conditions[c] || {}).label || c), icon: '🩺', body: () => condBody(c) });
    for (const s of ['infant', 'toddler', 'child', 'teen', 'adult', 'elder']) list.push({ id: 'stage:' + s, group: 'stages', title: stageName(s), icon: '', body: () => stageBody(s) });
    for (const s of SYS) list.push({ id: 'sys:' + s, group: 'sys', title: pick(sysTitle[s]), icon: '', body: () => pick(sysArticles()[s]) });
    const fo = R.items.find(i => i.id === 'focus'), F = G.FOCUS || { floor: 0.2, minutes: 20 };
    if (fo) list.push({ id: 'sys:focus', group: 'sys', title: t('know.focus'), icon: '', body: () => `<p>${badge(fo.status)}</p>` + field('game', `${Math.round(F.floor * 100)}% → 100% / ${F.minutes} min`) + `<p>${esc(pick(fo.real))}</p><p class="mute">${esc(pick(fo.note))}</p>${refsHtml(fo)}` });
    list.push({ id: 'refs', group: 'refs', title: t('pedia.g_refs'), icon: '📚', body: () => `<p class="warn">${esc(pick(R.medical))}</p><p class="mute">${esc(t('know.intro'))} ${esc(t('know.checked'))}</p><p class="mute">${esc(t('know.other'))}</p><ul class="krefs">${Object.values(R.sources).map(s => `<li>${esc(s.cite)}${s.url ? ` <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">link</a>` : ''}</li>`).join('')}</ul>` });
    cache = { key, list, byId: Object.fromEntries(list.map(e => [e.id, e])) };
    return cache;
  };
  U.pediaHas = id => !!index().byId[id];
  const GROUPS = ['needs', 'actions', 'items', 'conds', 'stages', 'sys', 'refs'];

  /* ---------- 弹窗：左边条目，右边当前的设计 ---------- */
  U.pedia = function (id) {
    const open = document.getElementById('pedia');
    const ix = index(), first = ix.byId[id] ? id : (open && open.dataset.cur) || 'need:' + needKeys()[0];
    const select = sel => {
      const e = ix.byId[sel] || ix.list[0], root = document.getElementById('pedia');
      root.dataset.cur = e.id; root.classList.add('show-body');
      root.querySelectorAll('.pnav [data-pid]').forEach(b => b.classList.toggle('on', b.dataset.pid === e.id));
      const body = root.querySelector('.pbody');
      body.innerHTML = `<button class="pback">${esc(t('pedia.back'))}</button><h3>${e.icon ? esc(e.icon) + ' ' : ''}${esc(e.title)}</h3>${e.body()}`;
      body.scrollTop = 0; body.querySelector('.pback').onclick = () => root.classList.remove('show-body');
      const on = root.querySelector('.pnav .on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
    };
    if (!open) {
      const nav = GROUPS.map(g => `<div class="pg" data-g="${g}"><div class="pgh">${esc(t('pedia.g_' + g))}</div>${ix.list.filter(e => e.group === g).map(e => `<button class="pi" data-pid="${esc(e.id)}" data-t="${esc(e.title.toLowerCase())}">${e.icon ? esc(e.icon) + ' ' : ''}${esc(e.title)}</button>`).join('')}</div>`).join('');
      const dlg = U.dialog(`<h2 style="margin-top:0">${esc(t('pedia.title'))}</h2>
        <div class="pedia" id="pedia"><div class="pnav"><input type="search" class="psearch" placeholder="${esc(t('pedia.search'))}" aria-label="${esc(t('pedia.search'))}">${nav}</div><div class="pbody"></div></div>
        <div class="row" style="justify-content:flex-end;margin-top:10px"><button id="kclose" class="primary">${esc(t('btn.close'))}</button></div>`, true);
      dlg.querySelector('#kclose').onclick = U.closeDialog;
      dlg.querySelectorAll('.pnav [data-pid]').forEach(b => b.onclick = () => select(b.dataset.pid));
      dlg.querySelector('.psearch').oninput = ev => {
        const q = ev.target.value.trim().toLowerCase();
        dlg.querySelectorAll('.pnav [data-pid]').forEach(b => { b.style.display = !q || b.dataset.t.includes(q) ? '' : 'none'; });
        dlg.querySelectorAll('.pnav .pg').forEach(g => { g.style.display = [...g.querySelectorAll('[data-pid]')].some(b => b.style.display !== 'none') ? '' : 'none'; });
      };
    }
    select(first);
  };
  U.knowledgeDialog = () => U.pedia();

  /* 下划线链接：整页任何地方带 data-pedia 的链接都打开百科 */
  if (typeof document !== 'undefined') document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a.pl[data-pedia]'); if (a) { e.preventDefault(); e.stopPropagation(); U.pedia(a.dataset.pedia); return; } const n = e.target.closest && e.target.closest('a.pl[data-person], a.pl[data-visitor]'); if (n) { e.preventDefault(); e.stopPropagation(); if (n.dataset.person) U.statusDialog(n.dataset.person); else U.visitorDialog(n.dataset.visitor); } }, true);
})(globalThis.CY = globalThis.CY || {});
