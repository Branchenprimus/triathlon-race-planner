import { reactive, computed, watch } from 'vue';
import { TRIATHLON_PRESETS, calculateInitialTimes } from './useTriathlonPresets.js';
import { isValidTimeFormat, timeToSeconds } from '../utils/timeUtils.js';
import { savePersistentState } from '../utils/persistence.js';

export const STORAGE_KEY = 'triathlon-race-planner:v2';
const LEGACY_KEY = 'triathlon-race-planner:v1';
const MAX_SECONDS = 359999;
const MAX_VALUE = 1000000;
export const SPORT_OPTIONS = [
  { value: 'triathlon', label: 'Triathlon' },
  { value: 'cycling', label: 'Radrennen' },
  { value: 'running', label: 'Lauf' },
  { value: 'swimming', label: 'Schwimmen' }
];
const KEYS = { triathlon: ['swim', 't1', 'bike', 't2', 'run'], cycling: ['bike'], running: ['run'], swimming: ['swim'] };
const singlePreset = (name, key, distance, targetTime) => ({ name, distances: { [key]: distance }, targetTime });
export const RACE_PRESETS = {
  triathlon: TRIATHLON_PRESETS,
  cycling: {
    km20: singlePreset('20 km', 'bike', 20, '00:40:00'),
    km40: singlePreset('40 km', 'bike', 40, '01:20:00'),
    km90: singlePreset('90 km', 'bike', 90, '03:00:00'),
    km180: singlePreset('180 km', 'bike', 180, '06:00:00')
  },
  running: {
    km5: singlePreset('5 km', 'run', 5, '00:30:00'),
    km10: singlePreset('10 km', 'run', 10, '01:00:00'),
    halfMarathon: singlePreset('Halbmarathon · 21.0975 km', 'run', 21.0975, '02:00:00'),
    marathon: singlePreset('Marathon · 42.195 km', 'run', 42.195, '04:00:00')
  },
  swimming: {
    pool400: singlePreset('Pool · 400 m', 'swim', 0.4, '00:08:00'),
    pool800: singlePreset('Pool · 800 m', 'swim', 0.8, '00:16:00'),
    pool1500: singlePreset('Pool · 1500 m', 'swim', 1.5, '00:30:00'),
    openWater1900: singlePreset('Open Water · 1.9 km', 'swim', 1.9, '00:38:00'),
    openWater3800: singlePreset('Open Water · 3.8 km', 'swim', 3.8, '01:16:00'),
    openWater5000: singlePreset('Open Water · 5 km', 'swim', 5, '01:40:00')
  }
};
const DEFAULT_PRESETS = { triathlon: 'olympic', cycling: 'km40', running: 'km10', swimming: 'pool1500' };
const DEFAULT_CARBS = { sprint: 45, olympic: 60, halfIronman: 75, ironman: 90 };
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
const validNumber = (value, max = MAX_VALUE) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
const number = (value, fallback = 0, max = MAX_VALUE) => validNumber(value, max) ? value : fallback;

function defaultConfig(sport, presetId = DEFAULT_PRESETS[sport]) {
  const preset = RACE_PRESETS[sport][presetId];
  const seconds = timeToSeconds(preset.targetTime);
  return {
    selectedPreset: presetId,
    distances: { ...preset.distances },
    targetTimeSeconds: seconds,
    disciplines: sport === 'triathlon' ? calculateInitialTimes(seconds, preset.distribution) : { [KEYS[sport][0]]: seconds },
    lockedDisciplines: Object.fromEntries(KEYS[sport].map(key => [key, key === 't1' || key === 't2']))
  };
}
function defaultNutrition() {
  return {
    raceType: 'olympic', bodyWeight: 75, carbMode: 'default', customCarbsPerHour: 60,
    products: [
      { id: 1, name: 'Gel', carbs: 25, sodium: 50, servings: 4 },
      { id: 2, name: 'Drink mix', carbs: 40, sodium: 500, servings: 2 },
      { id: 3, name: 'Bar', carbs: 35, sodium: 120, servings: 1 }
    ]
  };
}
function cleanConfig(sport, saved) {
  const input = object(saved);
  const presetId = input.selectedPreset === '' ? '' : own(RACE_PRESETS[sport], input.selectedPreset) ? input.selectedPreset : DEFAULT_PRESETS[sport];
  const config = defaultConfig(sport, presetId || DEFAULT_PRESETS[sport]);
  config.selectedPreset = presetId;
  // Standard presets own their distances. Only Custom accepts persisted distances.
  if (presetId === '') for (const key of Object.keys(config.distances)) {
    config.distances[key] = number(object(input.distances)[key], config.distances[key]);
  }
  for (const key of KEYS[sport]) {
    config.disciplines[key] = Math.round(number(object(input.disciplines)[key], config.disciplines[key], MAX_SECONDS));
    const lock = object(input.lockedDisciplines)[key];
    if (typeof lock === 'boolean') config.lockedDisciplines[key] = lock;
  }
  // Actual splits are authoritative; never restore a stale target or hidden nutrition time.
  const sum = Object.values(config.disciplines).reduce((a, b) => a + b, 0);
  if (sum > MAX_SECONDS) return defaultConfig(sport);
  config.targetTimeSeconds = sum;
  return config;
}
function cleanNutrition(saved) {
  const input = object(saved);
  const fallback = defaultNutrition();
  return {
    raceType: own(DEFAULT_CARBS, input.raceType) ? input.raceType : fallback.raceType,
    bodyWeight: number(input.bodyWeight, fallback.bodyWeight) || fallback.bodyWeight,
    carbMode: input.carbMode === 'custom' ? 'custom' : 'default',
    customCarbsPerHour: number(input.customCarbsPerHour, fallback.customCarbsPerHour),
    products: Array.isArray(input.products) && input.products.some(p => p && typeof p === 'object')
      ? input.products.filter(p => p && typeof p === 'object').slice(0, 100).map((p, index) => ({
        id: index + 1, name: typeof p.name === 'string' ? p.name : 'Product',
        carbs: number(p.carbs), sodium: number(p.sodium), servings: number(p.servings)
      })) : fallback.products
  };
}
function load(storage) {
  let saved = {};
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) saved = object(JSON.parse(raw));
    else {
      const legacy = object(JSON.parse(storage?.getItem(LEGACY_KEY) || '{}'));
      saved = { selectedSport: 'triathlon', sports: { triathlon: legacy }, nutrition: legacy.nutrition };
    }
  } catch { /* Invalid or inaccessible storage must not prevent planning. */ }
  return {
    version: 2,
    selectedSport: own(KEYS, saved.selectedSport) ? saved.selectedSport : 'triathlon',
    sports: Object.fromEntries(SPORT_OPTIONS.map(({ value }) => [value, cleanConfig(value, object(saved.sports)[value])])),
    nutrition: cleanNutrition(saved.nutrition)
  };
}

// Integer allocation keeps the exact total, even with zero-valued legs or rounding.
function allocate(config, keys, total) {
  if (!keys.length) return;
  const previous = keys.reduce((sum, key) => sum + config.disciplines[key], 0);
  let remaining = total;
  keys.forEach((key, index) => {
    const value = index === keys.length - 1 ? remaining : Math.min(remaining, Math.round(total * (previous ? config.disciplines[key] / previous : 1 / keys.length)));
    config.disciplines[key] = value;
    remaining -= value;
  });
}

export function createRacePlanner(storage = null) {
  const state = reactive(load(storage));
  const config = computed(() => state.sports[state.selectedSport]);
  const activeKeys = computed(() => KEYS[state.selectedSport]);
  const totalSeconds = computed(() => activeKeys.value.reduce((sum, key) => sum + config.value.disciplines[key], 0));
  const nutritionSummary = computed(() => {
    const n = state.nutrition;
    // Keep the existing configurable targets, not new sport-specific health advice.
    const carbsPerHour = n.carbMode === 'custom' ? number(n.customCarbsPerHour) : (DEFAULT_CARBS[n.raceType] || 60);
    const products = Array.isArray(n.products) ? n.products : [];
    const plannedCarbs = Math.round(products.reduce((sum, p) => sum + number(p?.carbs) * number(p?.servings), 0));
    const plannedSodium = Math.round(products.reduce((sum, p) => sum + number(p?.sodium) * number(p?.servings), 0));
    const totalCarbs = Math.round(totalSeconds.value / 3600 * carbsPerHour);
    return { totalSeconds: totalSeconds.value, carbsPerHour, totalCarbs, plannedCarbs, plannedSodium,
      carbsPerKgHour: (carbsPerHour / Math.max(1, number(n.bodyWeight, 75))).toFixed(2),
      carbGap: Math.max(0, totalCarbs - plannedCarbs) };
  });
  function selectSport(sport) {
    if (own(KEYS, sport)) state.selectedSport = sport;
  }
  function selectPreset(id) {
    const sport = state.selectedSport;
    if (id === '') { config.value.selectedPreset = ''; return; }
    if (!own(RACE_PRESETS[sport], id)) return;
    const locks = { ...config.value.lockedDisciplines };
    state.sports[sport] = { ...defaultConfig(sport, id), lockedDisciplines: locks };
    if (sport === 'triathlon') state.nutrition.raceType = id;
  }
  function setDistance(key, value) {
    if (config.value.selectedPreset === '' && own(config.value.distances, key) && validNumber(value)) config.value.distances[key] = value;
  }
  function setTargetTime(value) {
    if (!isValidTimeFormat(value)) return;
    const seconds = timeToSeconds(value);
    const c = config.value;
    if (state.selectedSport !== 'triathlon') {
      c.disciplines[activeKeys.value[0]] = seconds;
      c.targetTimeSeconds = seconds;
      return;
    }
    const adjustable = activeKeys.value.filter(key => !c.lockedDisciplines[key]);
    const lockedTotal = activeKeys.value.filter(key => c.lockedDisciplines[key]).reduce((sum, key) => sum + c.disciplines[key], 0);
    if (!adjustable.length || seconds < lockedTotal) return;
    allocate(c, adjustable, seconds - lockedTotal);
    c.targetTimeSeconds = seconds;
  }
  function updateDiscipline(key, value) {
    if (!activeKeys.value.includes(key) || !validNumber(value, MAX_SECONDS)) return;
    const c = config.value;
    const seconds = Math.round(value);
    if (state.selectedSport !== 'triathlon') {
      c.disciplines[key] = seconds;
      c.targetTimeSeconds = seconds;
      return;
    }
    const adjustable = activeKeys.value.filter(k => k !== key && !c.lockedDisciplines[k]);
    if (!adjustable.length) return;
    const lockedTotal = activeKeys.value.filter(k => k !== key && c.lockedDisciplines[k]).reduce((sum, k) => sum + c.disciplines[k], 0);
    c.disciplines[key] = Math.min(seconds, c.targetTimeSeconds - lockedTotal);
    allocate(c, adjustable, c.targetTimeSeconds - lockedTotal - c.disciplines[key]);
  }
  function updatePace(key, value) {
    if (!own(config.value.distances, key) || typeof value !== 'string') return;
    const distance = config.value.distances[key];
    if (distance <= 0) return;
    let seconds;
    if (key === 'bike') {
      const text = value.trim().replace(',', '.');
      if (!/^\d+(?:\.\d+)?$/.test(text) || Number(text) <= 0) return;
      seconds = distance / Number(text) * 3600;
    } else {
      const match = value.trim().match(/^(\d{1,5}):([0-5]\d)$/);
      if (!match) return;
      const pace = Number(match[1]) * 60 + Number(match[2]);
      if (!pace) return;
      seconds = pace * distance * (key === 'swim' ? 10 : 1);
    }
    updateDiscipline(key, Math.round(seconds));
  }
  function toggleLock(key) {
    if (state.selectedSport === 'triathlon' && activeKeys.value.includes(key)) config.value.lockedDisciplines[key] = !config.value.lockedDisciplines[key];
  }
  function addProduct() {
    const id = Math.max(0, ...state.nutrition.products.map(p => number(p.id))) + 1;
    state.nutrition.products.push({ id, name: 'Product', carbs: 30, sodium: 100, servings: 1 });
  }
  function removeProduct(id) {
    if (state.nutrition.products.length > 1) state.nutrition.products = state.nutrition.products.filter(p => p.id !== id);
  }
  const save = () => savePersistentState(storage, STORAGE_KEY, state);
  const stop = watch(state, save, { deep: true, flush: 'sync' });
  save();
  return { state, config, activeKeys, totalSeconds, nutritionSummary, selectSport, selectPreset,
    setDistance, setTargetTime, updateDiscipline, updatePace, toggleLock, addProduct, removeProduct, stop };
}
