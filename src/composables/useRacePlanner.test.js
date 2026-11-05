import test from 'node:test';
import assert from 'node:assert/strict';
import { createRacePlanner, SPORT_OPTIONS, RACE_PRESETS, STORAGE_KEY } from './useRacePlanner.js';

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('four sport modes expose only their active disciplines and retain independent configurations', () => {
  const p = createRacePlanner();
  assert.deepEqual(SPORT_OPTIONS.map(s => s.label), ['Triathlon', 'Radrennen', 'Lauf', 'Schwimmen']);
  assert.deepEqual(p.activeKeys.value, ['swim', 't1', 'bike', 't2', 'run']);
  const tri = structuredClone(JSON.parse(JSON.stringify(p.config.value)));
  for (const [sport, key] of [['cycling', 'bike'], ['running', 'run'], ['swimming', 'swim']]) {
    p.selectSport(sport);
    assert.deepEqual(p.activeKeys.value, [key]);
    assert.deepEqual(Object.keys(p.config.value.disciplines), [key]);
    p.selectPreset('');
    p.setDistance(key, 7.25);
    p.setTargetTime('01:12:00');
    p.selectSport('triathlon');
    assert.deepEqual(JSON.parse(JSON.stringify(p.config.value)), tri);
    p.selectSport(sport);
    assert.equal(p.config.value.distances[key], 7.25);
    assert.equal(p.totalSeconds.value, 4320);
  }
  p.selectSport('unknown');
  assert.equal(p.state.selectedSport, 'swimming');
});

test('all sports offer standard presets and custom distances; presets clear stale custom time', () => {
  const p = createRacePlanner();
  assert.deepEqual(Object.keys(RACE_PRESETS.triathlon), ['sprint', 'olympic', 'halfIronman', 'ironman']);
  assert.deepEqual(Object.values(RACE_PRESETS.cycling).map(p => p.distances.bike), [20, 40, 90, 180]);
  assert.deepEqual(Object.values(RACE_PRESETS.running).map(p => p.distances.run), [5, 10, 21.0975, 42.195]);
  assert.ok(Object.values(RACE_PRESETS.swimming).some(p => p.name.includes('Pool')));
  assert.ok(Object.values(RACE_PRESETS.swimming).some(p => p.name.includes('Open Water')));
  for (const sport of SPORT_OPTIONS.map(s => s.value)) {
    p.selectSport(sport);
    for (const [id, preset] of Object.entries(RACE_PRESETS[sport])) {
      p.selectPreset('');
      p.setTargetTime('09:00:00');
      p.selectPreset(id);
      assert.deepEqual(JSON.parse(JSON.stringify(p.config.value.distances)), preset.distances);
      assert.equal(p.config.value.targetTimeSeconds, p.totalSeconds.value);
      assert.notEqual(p.totalSeconds.value, 32400);
    }
    p.selectPreset('');
    const key = p.activeKeys.value.find(k => !k.startsWith('t'));
    p.setDistance(key, 2.345);
    assert.equal(p.config.value.selectedPreset, '');
    assert.equal(p.config.value.distances[key], 2.345);
  }
});

test('single-sport time, target and pace edits change actual duration and reactive nutrition without hidden legs', () => {
  const p = createRacePlanner();
  p.state.nutrition.carbMode = 'custom';
  p.state.nutrition.customCarbsPerHour = 60;
  for (const [sport, key, distance, pace] of [
    ['cycling', 'bike', 40, '20'], ['running', 'run', 10, '12:00'], ['swimming', 'swim', 2, '6:00']
  ]) {
    p.selectSport(sport);
    p.selectPreset('');
    p.setDistance(key, distance);
    p.updateDiscipline(key, 3600);
    assert.equal(p.totalSeconds.value, 3600);
    assert.equal(p.nutritionSummary.value.totalCarbs, 60);
    p.setTargetTime('03:00:00');
    assert.equal(p.config.value.disciplines[key], 10800);
    assert.equal(p.nutritionSummary.value.totalCarbs, 180);
    p.updatePace(key, pace);
    assert.equal(p.totalSeconds.value, 7200);
    assert.equal(p.config.value.targetTimeSeconds, 7200);
    assert.equal(p.nutritionSummary.value.totalCarbs, 120);
  }
});

test('triathlon redistribution is proportional, nonnegative and respects locks including target changes', () => {
  const p = createRacePlanner();
  const before = { ...p.config.value.disciplines };
  p.updateDiscipline('swim', before.swim + 600);
  assert.equal(p.totalSeconds.value, 10800);
  assert.equal(p.config.value.disciplines.t1, before.t1);
  assert.equal(p.config.value.disciplines.t2, before.t2);
  assert.ok(Math.abs(p.config.value.disciplines.bike / p.config.value.disciplines.run - before.bike / before.run) < 0.002);
  p.setTargetTime('04:00:00');
  assert.equal(p.totalSeconds.value, 14400);
  assert.equal(p.config.value.disciplines.t1, before.t1);
  assert.equal(p.config.value.disciplines.t2, before.t2);
  assert.equal(p.nutritionSummary.value.totalSeconds, 14400); // includes transitions
  p.updateDiscipline('swim', 359999);
  assert.equal(p.totalSeconds.value, 14400);
  assert.ok(Object.values(p.config.value.disciplines).every(v => v >= 0));
  for (const key of p.activeKeys.value) p.config.value.lockedDisciplines[key] = true;
  const frozen = { ...p.config.value.disciplines };
  p.updateDiscipline('bike', 1);
  p.setTargetTime('00:01:00');
  assert.deepEqual({ ...p.config.value.disciplines }, frozen);
});

test('state persists selected sport, custom settings, locks and nutrition, then reloads', () => {
  const store = storage();
  const p = createRacePlanner(store);
  p.selectSport('running');
  p.selectPreset('');
  p.setDistance('run', 12.34);
  p.updateDiscipline('run', 5432);
  p.state.nutrition.customCarbsPerHour = 72;
  p.state.nutrition.carbMode = 'custom';
  const loaded = createRacePlanner(store);
  assert.equal(loaded.state.selectedSport, 'running');
  assert.equal(loaded.config.value.selectedPreset, '');
  assert.equal(loaded.config.value.distances.run, 12.34);
  assert.equal(loaded.totalSeconds.value, 5432);
  assert.equal(loaded.nutritionSummary.value.carbsPerHour, 72);
  loaded.selectSport('triathlon');
  assert.equal(loaded.config.value.lockedDisciplines.t1, true);
  assert.ok(store.getItem(STORAGE_KEY));
});

test('legacy v1 triathlon state safely migrates splits, locks and products without stale nutrition times', () => {
  const legacy = { selectedPreset: 'sprint', targetTimeSeconds: 6000,
    disciplines: { swim: 1000, t1: 100, bike: 3000, t2: 100, run: 1800 },
    lockedDisciplines: { swim: true, t1: true, bike: false, t2: true, run: false },
    nutrition: { bodyWeight: 80, carbMode: 'custom', customCarbsPerHour: 42, swimTime: '99:00:00',
      products: [{ id: 8, name: 'My product', carbs: 23, sodium: 75, servings: 2 }] } };
  const store = storage({ 'triathlon-race-planner:v1': JSON.stringify(legacy) });
  const p = createRacePlanner(store);
  assert.equal(p.state.selectedSport, 'triathlon');
  assert.equal(p.config.value.selectedPreset, 'sprint');
  assert.equal(p.totalSeconds.value, 6000);
  assert.equal(p.config.value.lockedDisciplines.swim, true);
  assert.equal(p.nutritionSummary.value.totalCarbs, 70);
  assert.equal(p.state.nutrition.bodyWeight, 80);
  assert.equal(p.state.nutrition.products[0].name, 'My product');
  assert.equal(store.getItem('triathlon-race-planner:v1'), JSON.stringify(legacy));
});

test('malformed, null, hostile and invalid persisted fields recover to finite usable state', () => {
  for (const raw of ['{broken', 'null', '[]', JSON.stringify({ selectedSport: 'bogus', sports: {
    triathlon: { selectedPreset: '__proto__', disciplines: { swim: -5, bike: 'Infinity', run: null }, lockedDisciplines: { t1: 'no' } },
    running: { selectedPreset: '', distances: { run: -10 }, disciplines: { run: 'bad' } }
  }, nutrition: { bodyWeight: 0, carbMode: 'bogus', customCarbsPerHour: -2, products: [null, { name: 42, carbs: -3, sodium: 'Infinity', servings: -4 }] } })]) {
    const p = createRacePlanner(storage({ [STORAGE_KEY]: raw }));
    for (const sport of SPORT_OPTIONS.map(s => s.value)) {
      p.selectSport(sport);
      assert.ok(Object.values(p.config.value.disciplines).every(v => Number.isFinite(v) && v >= 0));
      assert.ok(Object.values(p.config.value.distances).every(v => Number.isFinite(v) && v >= 0));
      assert.equal(p.totalSeconds.value, p.config.value.targetTimeSeconds);
      assert.ok(Number.isFinite(p.nutritionSummary.value.totalCarbs));
      assert.ok(p.nutritionSummary.value.plannedCarbs >= 0);
    }
  }
  const blocked = createRacePlanner({ getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } });
  blocked.selectSport('cycling');
  assert.equal(blocked.state.selectedSport, 'cycling');
});

test('invalid live times, distances and pace do not corrupt state; nutrition remains finite/nonnegative', () => {
  const p = createRacePlanner();
  p.selectSport('running');
  p.selectPreset('');
  const before = JSON.stringify(p.config.value);
  for (const value of [NaN, Infinity, -1, 'bad', null]) {
    p.setDistance('run', value);
    p.updateDiscipline('run', value);
  }
  for (const value of ['-5:00', '5:99', '5:00oops', 'Infinity']) p.updatePace('run', value);
  for (const value of ['99:99:99', '-01:00:00', 'bad']) p.setTargetTime(value);
  assert.equal(JSON.stringify(p.config.value), before);
  p.state.nutrition.customCarbsPerHour = Infinity;
  p.state.nutrition.carbMode = 'custom';
  p.state.nutrition.products = [{ id: 1, name: 'x', carbs: -5, sodium: Infinity, servings: -2 }];
  assert.equal(p.nutritionSummary.value.totalCarbs, 0);
  assert.equal(p.nutritionSummary.value.plannedCarbs, 0);
  assert.equal(p.nutritionSummary.value.plannedSodium, 0);
  p.updateDiscipline('run', 0);
  assert.equal(p.totalSeconds.value, 0);
});
