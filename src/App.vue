<template>
  <div class="planner">
    <header class="app-header">
      <h1>🏊‍♂️ 🚴‍♂️ 🏃‍♂️ Race Planner</h1>
      <p class="subtitle">Dein Rennen · deine Zeiten · dein Verpflegungsplan</p>
    </header>

    <nav class="app-nav" role="tablist" aria-label="Sportart">
      <button v-for="sport in SPORT_OPTIONS" :id="`tab-${sport.value}`" :key="sport.value"
        type="button" role="tab" class="nav-button" :class="{ active: state.selectedSport === sport.value }"
        :aria-selected="state.selectedSport === sport.value" aria-controls="race-panel"
        :tabindex="state.selectedSport === sport.value ? 0 : -1"
        @click="selectSport(sport.value)" @keydown="handleTabKey($event, sport.value)">
        {{ sport.label }}
      </button>
    </nav>

    <main id="race-panel" role="tabpanel" :aria-labelledby="`tab-${state.selectedSport}`" class="planner-grid">
      <section class="app-main pace-card" aria-labelledby="pace-heading">
        <h2 id="pace-heading">Pace</h2>
        <div class="controls-section">
          <div class="form-field">
            <label for="preset">Distance Preset</label>
            <select id="preset" :value="config.selectedPreset" @change="selectPreset($event.target.value)">
              <option v-for="(preset, id) in presets" :key="id" :value="id">{{ preset.name }}</option>
              <option value="">Custom</option>
            </select>
          </div>
          <div class="form-field">
            <label for="targetTime">Target Time (HH:MM:SS)</label>
            <input id="targetTime" v-model="targetTimeInput" type="text" placeholder="HH:MM:SS"
              @input="setTargetTime(targetTimeInput)" @blur="resetTarget" @keydown.enter="$event.target.blur()" />
          </div>
          <div class="distance-fields">
            <div v-for="key in distanceKeys" :key="key" class="form-field">
              <label :for="`distance-${key}`">{{ disciplineInfo[key].icon }} {{ disciplineInfo[key].label }} (km)</label>
              <input :id="`distance-${key}`" type="number" min="0" max="1000000" step="any"
                :value="config.distances[key]" :disabled="config.selectedPreset !== ''"
                @input="setDistance(key, inputNumber($event))" @blur="$event.target.value = config.distances[key]" />
            </div>
          </div>
          <p class="hint">{{ config.selectedPreset === '' ? 'Custom: Distanzen frei bearbeiten (km).' : 'Für eigene Distanzen Custom auswählen. Zeiten sind editierbare Planwerte.' }}</p>
        </div>

        <div class="disciplines-section">
          <DisciplineSlider v-for="key in activeKeys" :key="`${state.selectedSport}-${key}`"
            :discipline="key" :label="disciplineInfo[key].label" :icon="disciplineInfo[key].icon"
            :model-value="config.disciplines[key]" :max-value="isTriathlon ? config.targetTimeSeconds : Math.min(359999, Math.max(3600, totalSeconds * 2))"
            :total-time="totalSeconds" :is-locked="isTriathlon && config.lockedDisciplines[key]"
            :show-distribution="isTriathlon" :pace-value="paceValue(key)" :pace-unit="disciplineInfo[key].unit || ''"
            @update:model-value="updateDiscipline(key, $event)" @update:pace-info="updatePace(key, $event)" @toggle-lock="toggleLock" />
        </div>
        <div class="summary-section valid">
          <div><span class="summary-label">Total Time</span><strong id="pace-total-duration">{{ secondsToTime(totalSeconds) }}</strong></div>
          <div><span class="summary-label">Target Time</span><strong>{{ secondsToTime(config.targetTimeSeconds) }}</strong></div>
          <span class="match-status">✓ Times match</span>
        </div>
        <p class="hint card-note">{{ isTriathlon ? 'Änderungen verteilen die verbleibende Zeit proportional. Gesperrte Zeiten bleiben bei anderen Änderungen unverändert. Direkte Eingaben bearbeiten auch gesperrte Zeiten.' : 'Zeit und Pace bearbeiten die gesamte Renndauer – ohne Wechselzeiten oder versteckte Disziplinen.' }}</p>
      </section>

      <section class="app-main nutrition-card" aria-labelledby="nutrition-heading">
        <h2 id="nutrition-heading">Nutrition</h2>
        <p class="hint">Schätzung aus der aktuellen Renndauer{{ isTriathlon ? ' inklusive Wechselzeiten' : '' }}. Editierbare Planwerte, keine individuelle Ernährungsempfehlung.</p>
        <div class="nutrition-summary" aria-live="polite" aria-atomic="true">
          <div class="summary-metric"><span class="summary-label">Race Time</span><strong id="nutrition-total-duration">{{ secondsToTime(summary.totalSeconds) }}</strong></div>
          <div class="summary-metric"><span class="summary-label">Carb Target</span><strong id="nutrition-carbs-per-hour">{{ summary.carbsPerHour }} g/h</strong></div>
          <div class="summary-metric"><span class="summary-label">Total Carbs · Schätzung</span><strong id="nutrition-total-carbs">{{ summary.totalCarbs }} g</strong></div>
          <div class="summary-metric"><span class="summary-label">Carbs / kg / h</span><strong>{{ summary.carbsPerKgHour }} g</strong></div>
        </div>
        <div class="split-fields">
          <div class="form-field">
            <label for="bodyWeight">Body weight (kg)</label>
            <input id="bodyWeight" type="number" min="1" max="1000000" step="any" :value="state.nutrition.bodyWeight"
              @input="setNutritionNumber('bodyWeight', $event, 1)" @blur="$event.target.value = state.nutrition.bodyWeight" />
          </div>
          <div class="form-field">
            <label for="carbMode">Carbs per hour</label>
            <select id="carbMode" v-model="state.nutrition.carbMode"><option value="default">Existing default target</option><option value="custom">Custom target</option></select>
          </div>
        </div>
        <div class="split-fields">
          <div v-if="state.nutrition.carbMode === 'default'" class="form-field">
            <label for="raceType">Target template (g/h)</label>
            <select id="raceType" v-model="state.nutrition.raceType">
              <option value="sprint">Sprint · 45</option><option value="olympic">Olympic · 60</option>
              <option value="halfIronman">70.3 · 75</option><option value="ironman">Ironman · 90</option>
            </select>
          </div>
          <div class="form-field">
            <label for="customCarbs">Target carbs (g/h)</label>
            <input id="customCarbs" type="number" min="0" max="1000000" step="any" :value="state.nutrition.customCarbsPerHour"
              :disabled="state.nutrition.carbMode !== 'custom'" @input="setNutritionNumber('customCarbsPerHour', $event)"
              @blur="$event.target.value = state.nutrition.customCarbsPerHour" />
          </div>
        </div>
        <p class="hint">Vorhandene Zielvorlagen bleiben wählbar und ändern keine Rennzeiten. Eigene Werte unter Custom target eintragen.</p>

        <section class="products-section" aria-labelledby="products-heading">
          <div class="section-heading"><h3 id="products-heading">Products</h3><button type="button" class="secondary-button" @click="addProduct">Add product</button></div>
          <div class="products-table">
            <div v-for="product in state.nutrition.products" :key="product.id" class="product-row">
              <label class="product-name">Product<input v-model="product.name" type="text" aria-label="Product name" /></label>
              <label>Carbs (g)<input type="number" min="0" max="1000000" step="any" :value="product.carbs" aria-label="Carbs per serving"
                @input="setProductNumber(product, 'carbs', $event)" @blur="$event.target.value = product.carbs" /></label>
              <label>Sodium (mg)<input type="number" min="0" max="1000000" step="any" :value="product.sodium" aria-label="Sodium per serving"
                @input="setProductNumber(product, 'sodium', $event)" @blur="$event.target.value = product.sodium" /></label>
              <label>Servings<input type="number" min="0" max="1000000" step="any" :value="product.servings" aria-label="Servings"
                @input="setProductNumber(product, 'servings', $event)" @blur="$event.target.value = product.servings" /></label>
              <span class="product-total">{{ Math.round(product.carbs * product.servings) }} g / {{ Math.round(product.sodium * product.servings) }} mg</span>
              <button type="button" class="icon-button" aria-label="Remove product" :disabled="state.nutrition.products.length === 1" @click="removeProduct(product.id)">×</button>
            </div>
          </div>
          <div class="nutrition-totals">
            <div><span class="summary-label">Planned Carbs</span><strong>{{ summary.plannedCarbs }} g</strong></div>
            <div><span class="summary-label">Carb Gap</span><strong :class="{ warning: summary.carbGap > 0 }">{{ summary.carbGap }} g</strong></div>
            <div><span class="summary-label">Planned Sodium</span><strong>{{ summary.plannedSodium }} mg</strong></div>
          </div>
        </section>
      </section>
    </main>
    <footer class="app-footer">Race Planner · Pace &amp; Nutrition bleiben gemeinsam im Blick.</footer>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted, nextTick } from 'vue';
import DisciplineSlider from './components/DisciplineSlider.vue';
import { createRacePlanner, SPORT_OPTIONS, RACE_PRESETS } from './composables/useRacePlanner.js';
import { secondsToTime, calculateSwimPace, calculateBikeSpeed, calculateRunPace } from './utils/timeUtils.js';
let storage = null;
try { storage = typeof window === 'undefined' ? null : window.localStorage; } catch { /* Private browsing may deny storage access. */ }
const planner = createRacePlanner(storage);
const { state, config, activeKeys, totalSeconds, nutritionSummary: summary, selectSport, selectPreset,
  setDistance, setTargetTime, updateDiscipline, updatePace, toggleLock, addProduct, removeProduct } = planner;
onUnmounted(planner.stop);
const isTriathlon = computed(() => state.selectedSport === 'triathlon');
const presets = computed(() => RACE_PRESETS[state.selectedSport]);
const distanceKeys = computed(() => Object.keys(config.value.distances));
const targetTimeInput = ref(secondsToTime(config.value.targetTimeSeconds));
const resetTarget = () => { targetTimeInput.value = secondsToTime(config.value.targetTimeSeconds); };
watch(() => [state.selectedSport, config.value.targetTimeSeconds, config.value.selectedPreset], resetTarget);
const disciplineInfo = {
  swim: { label: 'Schwimmen', icon: '🏊‍♂️', unit: '/100m' },
  t1: { label: 'Wechselzone 1', icon: '🔄' },
  bike: { label: 'Radfahren', icon: '🚴‍♂️', unit: 'km/h' },
  t2: { label: 'Wechselzone 2', icon: '🔄' },
  run: { label: 'Laufen', icon: '🏃‍♂️', unit: 'min/km' }
};
function paceValue(key) {
  const seconds = config.value.disciplines[key];
  const distance = config.value.distances[key];
  if (key === 'swim') return calculateSwimPace(seconds, distance * 1000).replace(' /100m', '');
  if (key === 'bike') return calculateBikeSpeed(seconds, distance).replace(' km/h', '');
  if (key === 'run') return calculateRunPace(seconds, distance).replace(' /km', '');
  return '';
}
function inputNumber(event) { return event.target.value.trim() === '' ? NaN : Number(event.target.value); }
function setNutritionNumber(key, event, min = 0) {
  const value = inputNumber(event);
  if (Number.isFinite(value) && value >= min && value <= 1000000) state.nutrition[key] = value;
}
function setProductNumber(product, key, event) {
  const value = inputNumber(event);
  if (Number.isFinite(value) && value >= 0 && value <= 1000000) product[key] = value;
}
async function handleTabKey(event, sport) {
  const index = SPORT_OPTIONS.findIndex(option => option.value === sport);
  const targets = { ArrowRight: (index + 1) % 4, ArrowLeft: (index + 3) % 4, Home: 0, End: 3 };
  if (!(event.key in targets)) return;
  event.preventDefault();
  const next = SPORT_OPTIONS[targets[event.key]].value;
  selectSport(next);
  await nextTick();
  document.getElementById(`tab-${next}`)?.focus();
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
#app { max-width: 1540px; margin: 0 auto; padding: 24px; }
.app-header { text-align: center; color: white; margin-bottom: 24px; }
.app-header h1 { font-size: 32px; margin-bottom: 8px; text-shadow: 2px 2px 4px #0003; }
.subtitle { font-size: 16px; opacity: .9; }
.app-nav { display: flex; gap: 8px; margin-bottom: 24px; padding: 6px; background: #ffffff2e; border: 1px solid #ffffff47; border-radius: 12px; }
.nav-button { flex: 1; min-height: 44px; border: 0; border-radius: 8px; color: white; background: transparent; font-size: 15px; font-weight: 700; cursor: pointer; }
.nav-button.active { color: #2c3e50; background: white; box-shadow: 0 4px 14px #0002; }
button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid #354cc4; outline-offset: 3px; }
.nav-button:focus-visible { outline-color: white; }
.planner-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.app-main { min-width: 0; background: white; border-radius: 16px; padding: 28px; box-shadow: 0 10px 40px #0003; }
h2 { margin-bottom: 20px; color: #2c3e50; font-size: 26px; }
h3 { color: #2c3e50; font-size: 20px; }
.controls-section { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
.form-field { margin-bottom: 16px; min-width: 0; }
.form-field label { display: block; font-weight: 600; margin-bottom: 8px; color: #2c3e50; }
.form-field input, .form-field select, .product-row input { width: 100%; min-width: 0; padding: 11px; font-size: 16px; color: #2c3e50; background: white; border: 2px solid #e0e0e0; border-radius: 8px; }
.form-field input:focus, .form-field select:focus, .product-row input:focus { border-color: #667eea; }
.form-field input:disabled { background: #f5f5f5; color: #666; opacity: 1; }
.distance-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 12px; }
.hint { color: #626b77; font-size: 13px; line-height: 1.6; }
.card-note { margin-top: 16px; }
.summary-section { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; padding: 18px; background: #e8f5e9; border-radius: 12px; border: 2px solid #4caf50; }
.summary-label { display: block; font-size: 11px; color: #626b77; text-transform: uppercase; font-weight: 600; }
.summary-section strong { display: block; color: #2c3e50; font: bold 20px 'Courier New', monospace; margin-top: 4px; }
.match-status { color: #286d2b; font-size: 13px; font-weight: 600; }
.nutrition-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
.summary-metric, .nutrition-totals > div { padding: 16px; border: 1px solid #e8ebef; border-radius: 8px; background: #f8f9fa; }
.summary-metric strong, .nutrition-totals strong { display: block; margin-top: 4px; color: #2c3e50; font-size: 22px; overflow-wrap: anywhere; }
.split-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.products-section { margin-top: 28px; padding-top: 20px; border-top: 2px solid #f0f0f0; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.secondary-button, .icon-button { border: 0; border-radius: 8px; font-weight: 700; cursor: pointer; min-height: 44px; }
.secondary-button { padding: 10px 14px; color: white; background: #5266c9; }
.products-table { display: grid; gap: 12px; }
.product-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) 42px; gap: 8px; align-items: end; padding: 14px; background: #f8f9fa; border: 1px solid #e8ebef; border-radius: 10px; }
.product-row label { font-size: 12px; color: #626b77; font-weight: 600; }
.product-row input { padding: 8px; margin-top: 4px; }
.product-name { grid-column: 1 / -1; }
.product-total { grid-column: 1 / 4; font-size: 13px; font-weight: 700; color: #2c3e50; align-self: center; }
.icon-button { grid-column: 4; grid-row: 2 / 4; width: 42px; color: #c62828; background: #ffebee; font-size: 24px; }
.icon-button:disabled { color: #888; background: #eee; cursor: not-allowed; }
.nutrition-totals { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.nutrition-totals > div { padding: 12px; }
.nutrition-totals strong { font-size: 18px; }
.warning { color: #c62828 !important; }
.app-footer { text-align: center; color: white; margin-top: 24px; font-size: 14px; opacity: .9; }
@media (max-width: 1050px) { .planner-grid { grid-template-columns: 1fr; } #app { max-width: 800px; } }
@media (max-width: 600px) {
  #app { padding: 12px; }
  .app-header h1 { font-size: 24px; }
  .app-main { padding: 18px; }
  .app-nav { gap: 2px; padding: 4px; }
  .nav-button { font-size: 13px; }
  .split-fields { grid-template-columns: 1fr; gap: 0; }
  .nutrition-totals { grid-template-columns: 1fr; }
  .summary-section { justify-content: center; text-align: center; }
}
</style>
