/* 开局默认衣服优先分开色系，保留明确选择，且不能改角色卡或已有家庭。 */
const assert = require('node:assert/strict');
const { ctx, CY, G, fs, vm, root, path } = require('./harness');
CY.ui = { esc: value => String(value) };
vm.runInContext(fs.readFileSync(path.join(root, 'src/ui/people_add.js'), 'utf8'), ctx);
const U = CY.ui, families = Object.values(CY.avatarOptions.clothesFamilies);
const familyOf = color => families.findIndex(colors => colors.includes(color));
const presetIds = ['couple_baby', 'dual_work', 'single_parent', 'summer', 'threegen', 'elder_care', 'solo_pets'];

(async () => {
  await G.load();
  const cardsBefore = JSON.stringify(CY.content.archetypes);
  const create = G.createPerson, load = G.load, lead = G.setProtagonist, random = Math.random;
  let created;
  G.createPerson = async spec => { created.push(spec); return 'member-' + created.length; };
  G.load = async () => {};
  G.setProtagonist = () => {};
  const colorsOf = rows => rows.filter(m => CY.content.archOf(m.arch).species === 'human').map(m => m.look.cloth);
  const checkSeparated = colors => {
    const first = colors.slice(0, families.length);
    assert.equal(new Set(first.map(familyOf)).size, first.length);
    assert(colors.every(color => CY.avatarOptions.clothes.includes(color)));
  };
  try {
    for (let seed0 = 1; seed0 <= 20; seed0++) {
      let seed = seed0;
      Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      for (const id of presetIds) {
        const preset = CY.content.presets.find(p => p.id === id);
        const members = U.withWorker(preset.members);
        const before = JSON.stringify(members);
        G.people = []; created = [];
        await U.createMembers(members);
        checkSeparated(colorsOf(created));
        assert.equal(JSON.stringify(members), before, '不能修改预设成员');
        for (const m of created) if (CY.content.archOf(m.arch).species !== 'human') assert.equal(JSON.stringify(m.look), JSON.stringify(CY.content.archOf(m.arch).look));
      }
      G.people = []; created = [];
      await U.createMembers(U.withWorker(U.randomHousehold()));
      checkSeparated(colorsOf(created));
    }
    // 即使随机数总取相同值，也不能一直挑到同一色系。
    Math.random = () => 0;
    const colors = [];
    for (let i = 0; i < families.length * 3; i++) {
      colors.push(CY.pickCloth(colors));
      const counts = families.map((_, k) => colors.filter(color => familyOf(color) === k).length);
      assert(Math.max(...counts) - Math.min(...counts) <= 1);
    }
    checkSeparated(colors);
    // 先预留明确选择的衣服颜色，避免列表前面的自动成员抢到相同色系。
    const existing = { species: { id: 'human' }, person: { appearance: { cloth: '#6f86a0' } } };
    G.people = [existing]; created = [];
    const manual = { arch: 'mom', name: 'Mom', look: { cloth: '#d4a24c', glasses: 'round' } };
    await U.createMembers([{ arch: 'dad', name: 'Dad' }, manual]);
    assert.equal(created[1].look.cloth, manual.look.cloth);
    assert.equal(created[1].look.glasses, 'round');
    assert(![familyOf(existing.person.appearance.cloth), familyOf(manual.look.cloth)].includes(familyOf(created[0].look.cloth)));
    assert.equal(existing.person.appearance.cloth, '#6f86a0');
    assert.equal(JSON.stringify(CY.content.archetypes), cardsBefore);
  } finally {
    G.createPerson = create; G.load = load; G.setProtagonist = lead; Math.random = random;
  }
  // 用真实创建和重读确认分配结果进入存档，也就是角色、饼图实际使用的衣服色。
  await G.load();
  await U.createMembers(CY.content.presets.find(p => p.id === 'threegen').members);
  const persisted = G.people.filter(G.isHuman).map(p => p.person.appearance.cloth);
  checkSeparated(persisted);
  await G.load();
  assert.equal(JSON.stringify(G.people.filter(G.isHuman).map(p => p.person.appearance.cloth)), JSON.stringify(persisted));
  assert(G.people.filter(G.isHuman).every(p => CY.avatarColor(p) === p.person.appearance.cloth));
  console.log('通过：七种预设与随机开局、六色系去重、耗尽均衡复用、手选与已有颜色保留、动物配色、存档重读和饼图主色');
})().catch(error => { console.error(error); process.exitCode = 1; });
