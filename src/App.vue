<template>
  <div id="app">
    <nav class="app-nav" aria-label="Main navigation">
      <button
        type="button"
        class="nav-button"
        :class="{ active: activeView === 'pace' }"
        @click="activeView = 'pace'"
      >
        Pace
      </button>
      <button
        type="button"
        class="nav-button"
        :class="{ active: activeView === 'nutrition' }"
        @click="activeView = 'nutrition'"
      >
        Nutrition
      </button>
    </nav>

    <header class="app-header">
      <h1>🏊‍♂️🚴‍♂️🏃‍♂️ Triathlon Race Planner</h1>
      <p class="subtitle">Plan your race splits with interactive time distribution</p>
    </header>

    <main v-if="activeView === 'pace'" class="app-main">
      <div class="controls-section">
        <div class="preset-selector">
          <label for="preset">Distance Preset:</label>
          <select id="preset" v-model="selectedPreset" @change="loadPreset">
            <option value="">Custom</option>
            <option v-for="option in presetOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="target-time-input">
          <label for="targetTime">Target Time (HH:MM:SS):</label>
          <input
            id="targetTime"
            type="text"
            v-model="targetTimeInput"
            @input="handleTargetTimeInput"
            @blur="updateTargetTime"
            @keyup.enter="blurInput"
            placeholder="HH:MM:SS"
            pattern="[0-9]{1,2}:[0-5][0-9]:[0-5][0-9]"
          />
        </div>

        <div v-if="currentPreset" class="distance-info">
          <div class="distance-item">
            <span class="distance-icon">🏊‍♂️</span>
            <span>{{ currentPreset.distances.swim }} km</span>
          </div>
          <div class="distance-item">
            <span class="distance-icon">🚴‍♂️</span>
            <span>{{ currentPreset.distances.bike }} km</span>
          </div>
          <div class="distance-item">
            <span class="distance-icon">🏃‍♂️</span>
            <span>{{ currentPreset.distances.run }} km</span>
          </div>
        </div>
      </div>

      <div class="disciplines-section">
        <DisciplineSlider
          discipline="swim"
          label="Schwimmen"
          icon="🏊‍♂️"
          :model-value="disciplines.swim"
          :max-value="targetTimeSeconds"
          :total-time="targetTimeSeconds"
          :pace-value="swimPaceValue"
          pace-unit="/100m"
          :is-locked="lockedDisciplines.swim"
          @update:model-value="(val) => updateDiscipline('swim', val)"
          @update:pace-info="(val) => updatePaceValue('swim', val)"
          @toggle-lock="toggleLock"
        />

        <DisciplineSlider
          discipline="t1"
          label="Wechselzone 1"
          icon="🔄"
          :model-value="disciplines.t1"
          :max-value="targetTimeSeconds"
          :total-time="targetTimeSeconds"
          :is-locked="lockedDisciplines.t1"
          @update:model-value="(val) => updateDiscipline('t1', val)"
          @toggle-lock="toggleLock"
        />

        <DisciplineSlider
          discipline="bike"
          label="Radfahren"
          icon="🚴‍♂️"
          :model-value="disciplines.bike"
          :max-value="targetTimeSeconds"
          :total-time="targetTimeSeconds"
          :pace-value="bikeSpeedValue"
          pace-unit="km/h"
          :is-locked="lockedDisciplines.bike"
          @update:model-value="(val) => updateDiscipline('bike', val)"
          @update:pace-info="(val) => updatePaceValue('bike', val)"
          @toggle-lock="toggleLock"
        />

        <DisciplineSlider
          discipline="t2"
          label="Wechselzone 2"
          icon="🔄"
          :model-value="disciplines.t2"
          :max-value="targetTimeSeconds"
          :total-time="targetTimeSeconds"
          :is-locked="lockedDisciplines.t2"
          @update:model-value="(val) => updateDiscipline('t2', val)"
          @toggle-lock="toggleLock"
        />

        <DisciplineSlider
          discipline="run"
          label="Laufen"
          icon="🏃‍♂️"
          :model-value="disciplines.run"
          :max-value="targetTimeSeconds"
          :total-time="targetTimeSeconds"
          :pace-value="runPaceValue"
          pace-unit="min/km"
          :is-locked="lockedDisciplines.run"
          @update:model-value="(val) => updateDiscipline('run', val)"
          @update:pace-info="(val) => updatePaceValue('run', val)"
          @toggle-lock="toggleLock"
        />
      </div>

      <div class="summary-section" :class="{ valid: isValidTotal }">
        <div class="summary-item">
          <span class="summary-label">Total Time:</span>
          <span class="summary-value">{{ totalTimeFormatted }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Target Time:</span>
          <span class="summary-value">{{ targetTimeFormatted }}</span>
        </div>
        <div class="summary-status">
          <span v-if="isValidTotal" class="status-icon">✓</span>
          <span v-else class="status-icon">⚠</span>
          <span>{{ isValidTotal ? 'Times match!' : 'Adjusting...' }}</span>
        </div>
      </div>
    </main>

    <main v-else class="app-main nutrition-main">
      <section class="nutrition-grid">
        <div class="nutrition-panel">
          <h2>Nutrition</h2>

          <div class="form-field">
            <label for="raceType">Race type</label>
            <select id="raceType" v-model="nutrition.raceType" @change="loadNutritionRaceDefaults">
              <option v-for="race in nutritionRaceTypes" :key="race.value" :value="race.value">
                {{ race.label }}
              </option>
            </select>
          </div>

          <div class="split-fields">
            <div class="form-field">
              <label for="swimTime">Swim</label>
              <input
                id="swimTime"
                :value="nutritionTimeInputs.swim"
                type="text"
                placeholder="HH:MM:SS"
                @focus="isEditingNutritionTime.swim = true"
                @input="(event) => handleNutritionTimeInput('swim', event)"
                @blur="() => finishNutritionTimeInput('swim')"
                @keydown.enter="blurInput"
              />
            </div>
            <div class="form-field">
              <label for="bikeTime">Bike</label>
              <input
                id="bikeTime"
                :value="nutritionTimeInputs.bike"
                type="text"
                placeholder="HH:MM:SS"
                @focus="isEditingNutritionTime.bike = true"
                @input="(event) => handleNutritionTimeInput('bike', event)"
                @blur="() => finishNutritionTimeInput('bike')"
                @keydown.enter="blurInput"
              />
            </div>
            <div class="form-field">
              <label for="runTime">Run</label>
              <input
                id="runTime"
                :value="nutritionTimeInputs.run"
                type="text"
                placeholder="HH:MM:SS"
                @focus="isEditingNutritionTime.run = true"
                @input="(event) => handleNutritionTimeInput('run', event)"
                @blur="() => finishNutritionTimeInput('run')"
                @keydown.enter="blurInput"
              />
            </div>
          </div>

          <div class="split-fields">
            <div class="form-field">
              <label for="bodyWeight">Body weight (kg)</label>
              <input id="bodyWeight" v-model.number="nutrition.bodyWeight" type="number" min="1" step="1" />
            </div>
            <div class="form-field">
              <label for="carbMode">Carbs per hour</label>
              <select id="carbMode" v-model="nutrition.carbMode">
                <option value="default">Default target</option>
                <option value="custom">Custom target</option>
              </select>
            </div>
            <div class="form-field">
              <label for="customCarbs">Target carbs (g/h)</label>
              <input
                id="customCarbs"
                v-model.number="nutrition.customCarbsPerHour"
                type="number"
                min="0"
                step="5"
                :disabled="nutrition.carbMode === 'default'"
              />
            </div>
          </div>
        </div>

        <div class="nutrition-summary">
          <div class="summary-metric">
            <span class="summary-label">Race Time</span>
            <strong>{{ nutritionTotalTimeFormatted }}</strong>
          </div>
          <div class="summary-metric">
            <span class="summary-label">Carb Target</span>
            <strong>{{ nutritionCarbsPerHour }} g/h</strong>
          </div>
          <div class="summary-metric">
            <span class="summary-label">Total Carbs</span>
            <strong>{{ nutritionTotalCarbs }} g</strong>
          </div>
          <div class="summary-metric">
            <span class="summary-label">Carbs / kg / h</span>
            <strong>{{ nutritionCarbsPerKgHour }} g</strong>
          </div>
        </div>
      </section>

      <section class="products-section">
        <div class="section-heading">
          <h2>Products</h2>
          <button type="button" class="secondary-button" @click="addNutritionProduct">Add product</button>
        </div>

        <div class="products-table">
          <div class="products-row products-header">
            <span>Product</span>
            <span>Carbs</span>
            <span>Sodium</span>
            <span>Servings</span>
            <span>Total</span>
            <span></span>
          </div>

          <div v-for="product in nutrition.products" :key="product.id" class="products-row">
            <input v-model="product.name" type="text" aria-label="Product name" />
            <input v-model.number="product.carbs" type="number" min="0" step="1" aria-label="Carbs per serving" />
            <input v-model.number="product.sodium" type="number" min="0" step="10" aria-label="Sodium per serving" />
            <input v-model.number="product.servings" type="number" min="0" step="0.5" aria-label="Servings" />
            <span class="product-total">
              {{ Math.round(product.carbs * product.servings) }} g / {{ Math.round(product.sodium * product.servings) }} mg
            </span>
            <button
              type="button"
              class="icon-button"
              aria-label="Remove product"
              :disabled="nutrition.products.length === 1"
              @click="removeNutritionProduct(product.id)"
            >
              ×
            </button>
          </div>
        </div>

        <div class="nutrition-totals">
          <div>
            <span class="summary-label">Planned Carbs</span>
            <strong>{{ nutritionPlannedCarbs }} g</strong>
          </div>
          <div>
            <span class="summary-label">Carb Gap</span>
            <strong :class="{ warning: nutritionCarbGap > 0 }">{{ nutritionCarbGap }} g</strong>
          </div>
          <div>
            <span class="summary-label">Planned Sodium</span>
            <strong>{{ nutritionPlannedSodium }} mg</strong>
          </div>
        </div>
      </section>
    </main>

    <footer class="app-footer">
      <p>Adjust any discipline slider to automatically redistribute time proportionally</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import DisciplineSlider from './components/DisciplineSlider.vue';
import { 
  timeToSeconds, 
  secondsToTime, 
  isValidTimeFormat,
  calculateSwimPace,
  calculateBikeSpeed,
  calculateRunPace
} from './utils/timeUtils';
import { 
  getPreset, 
  getPresetOptions, 
  calculateInitialTimes 
} from './composables/useTriathlonPresets';
import { createPersistentState } from './utils/persistence';

const presetOptions = getPresetOptions();
const nutritionRaceTypes = [
  { value: 'sprint', label: 'Sprint', defaultCarbsPerHour: 45 },
  { value: 'olympic', label: 'Olympic', defaultCarbsPerHour: 60 },
  { value: 'halfIronman', label: '70.3', defaultCarbsPerHour: 75 },
  { value: 'ironman', label: 'Ironman', defaultCarbsPerHour: 90 }
];
const defaultPreset = getPreset('olympic');
const defaultTargetTimeSeconds = timeToSeconds(defaultPreset.targetTime);
const defaultDisciplines = calculateInitialTimes(defaultTargetTimeSeconds, defaultPreset.distribution);
const defaultNutrition = {
  raceType: 'olympic',
  swimTime: secondsToTime(defaultDisciplines.swim),
  bikeTime: secondsToTime(defaultDisciplines.bike),
  runTime: secondsToTime(defaultDisciplines.run),
  bodyWeight: 75,
  carbMode: 'default',
  customCarbsPerHour: 60,
  products: [
    { id: 1, name: 'Gel', carbs: 25, sodium: 50, servings: 4 },
    { id: 2, name: 'Drink mix', carbs: 40, sodium: 500, servings: 2 },
    { id: 3, name: 'Bar', carbs: 35, sodium: 120, servings: 1 }
  ]
};
const defaultAppState = {
  activeView: 'pace',
  selectedPreset: 'olympic',
  targetTimeInput: defaultPreset.targetTime,
  targetTimeSeconds: defaultTargetTimeSeconds,
  disciplines: defaultDisciplines,
  lockedDisciplines: {
    swim: false,
    t1: true,  // T1 locked by default
    bike: false,
    t2: true,  // T2 locked by default
    run: false
  },
  nutrition: defaultNutrition
};
const browserStorage = typeof window === 'undefined' ? null : window.localStorage;
const persistentState = createPersistentState(
  browserStorage,
  'triathlon-race-planner:v1',
  defaultAppState
);
const initialState = persistentState.initialState;

// State
const activeView = ref(initialState.activeView);
const selectedPreset = ref(initialState.selectedPreset);
const targetTimeInput = ref(initialState.targetTimeInput);
const targetTimeSeconds = ref(initialState.targetTimeSeconds);
const currentPreset = ref(selectedPreset.value ? getPreset(selectedPreset.value) : null);

const disciplines = ref({ ...initialState.disciplines });

const lockedDisciplines = ref({ ...initialState.lockedDisciplines });

let nextProductId = Math.max(0, ...initialState.nutrition.products.map(product => Number(product.id) || 0)) + 1;
let isSyncingRaceTimes = false;

const nutrition = ref({
  ...initialState.nutrition,
  products: initialState.nutrition.products.map(product => ({ ...product }))
});

const nutritionTimeInputs = ref({
  swim: nutrition.value.swimTime,
  bike: nutrition.value.bikeTime,
  run: nutrition.value.runTime
});

const isEditingNutritionTime = ref({
  swim: false,
  bike: false,
  run: false
});

// Computed properties
const totalTimeFormatted = computed(() => {
  const total = disciplines.value.swim + disciplines.value.t1 + 
                disciplines.value.bike + disciplines.value.t2 + 
                disciplines.value.run;
  return secondsToTime(total);
});

const targetTimeFormatted = computed(() => {
  return secondsToTime(targetTimeSeconds.value);
});

const isValidTotal = computed(() => {
  const total = disciplines.value.swim + disciplines.value.t1 + 
                disciplines.value.bike + disciplines.value.t2 + 
                disciplines.value.run;
  return Math.abs(total - targetTimeSeconds.value) < 2; // Allow 1 second tolerance
});

const swimPace = computed(() => {
  if (!currentPreset.value) return '';
  return calculateSwimPace(disciplines.value.swim, currentPreset.value.distances.swim * 1000);
});

const swimPaceValue = computed(() => {
  return swimPace.value.replace(' /100m', '');
});

const bikeSpeed = computed(() => {
  if (!currentPreset.value) return '';
  return calculateBikeSpeed(disciplines.value.bike, currentPreset.value.distances.bike);
});

const bikeSpeedValue = computed(() => {
  return bikeSpeed.value.replace(' km/h', '');
});

const runPace = computed(() => {
  if (!currentPreset.value) return '';
  return calculateRunPace(disciplines.value.run, currentPreset.value.distances.run);
});

const runPaceValue = computed(() => {
  return runPace.value.replace(' /km', '');
});

const selectedNutritionRace = computed(() => {
  return nutritionRaceTypes.find(race => race.value === nutrition.value.raceType) || nutritionRaceTypes[1];
});

const nutritionCarbsPerHour = computed(() => {
  if (nutrition.value.carbMode === 'custom') {
    return Math.max(0, Number(nutrition.value.customCarbsPerHour) || 0);
  }

  return selectedNutritionRace.value.defaultCarbsPerHour;
});

const nutritionTotalSeconds = computed(() => {
  return timeToSeconds(nutrition.value.swimTime) +
    timeToSeconds(nutrition.value.bikeTime) +
    timeToSeconds(nutrition.value.runTime);
});

const nutritionTotalTimeFormatted = computed(() => {
  return secondsToTime(nutritionTotalSeconds.value);
});

const nutritionTotalCarbs = computed(() => {
  return Math.round((nutritionTotalSeconds.value / 3600) * nutritionCarbsPerHour.value);
});

const nutritionCarbsPerKgHour = computed(() => {
  const weight = Math.max(1, Number(nutrition.value.bodyWeight) || 1);
  return (nutritionCarbsPerHour.value / weight).toFixed(2);
});

const nutritionPlannedCarbs = computed(() => {
  return Math.round(nutrition.value.products.reduce((sum, product) => {
    return sum + ((Number(product.carbs) || 0) * (Number(product.servings) || 0));
  }, 0));
});

const nutritionPlannedSodium = computed(() => {
  return Math.round(nutrition.value.products.reduce((sum, product) => {
    return sum + ((Number(product.sodium) || 0) * (Number(product.servings) || 0));
  }, 0));
});

const nutritionCarbGap = computed(() => {
  return Math.max(0, nutritionTotalCarbs.value - nutritionPlannedCarbs.value);
});

// Methods
function loadPreset() {
  if (!selectedPreset.value) {
    currentPreset.value = null;
    return;
  }

  const preset = getPreset(selectedPreset.value);
  currentPreset.value = preset;
  nutrition.value.raceType = selectedPreset.value;
  nutrition.value.customCarbsPerHour = selectedNutritionRace.value.defaultCarbsPerHour;
  targetTimeInput.value = preset.targetTime;
  updateTargetTime();
}

function updateTargetTime() {
  if (!isValidTimeFormat(targetTimeInput.value)) {
    targetTimeInput.value = secondsToTime(targetTimeSeconds.value);
    return;
  }

  const newTargetSeconds = timeToSeconds(targetTimeInput.value);
  if (newTargetSeconds > 0) {
    targetTimeSeconds.value = newTargetSeconds;
    
    // Recalculate all disciplines proportionally
    const currentTotal = disciplines.value.swim + disciplines.value.t1 + 
                        disciplines.value.bike + disciplines.value.t2 + 
                        disciplines.value.run;
    
    if (currentTotal > 0) {
      const ratio = newTargetSeconds / currentTotal;
      disciplines.value.swim = Math.round(disciplines.value.swim * ratio);
      disciplines.value.t1 = Math.round(disciplines.value.t1 * ratio);
      disciplines.value.bike = Math.round(disciplines.value.bike * ratio);
      disciplines.value.t2 = Math.round(disciplines.value.t2 * ratio);
      disciplines.value.run = Math.round(disciplines.value.run * ratio);
      
      // Adjust for rounding errors
      adjustForRoundingErrors();
    } else if (currentPreset.value) {
      // Initialize with preset distribution
      const times = calculateInitialTimes(newTargetSeconds, currentPreset.value.distribution);
      Object.assign(disciplines.value, times);
    }
  }
}

function handleTargetTimeInput() {
  if (isValidTimeFormat(targetTimeInput.value)) {
    updateTargetTime();
  }
}

function blurInput(event) {
  event.currentTarget.blur();
}

function normalizeTimeInputValue(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return null;

  const parts = rawValue.split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every(part => /^\d{1,2}$/.test(part))) return null;

  const numericParts = parts.map(Number);
  const secondsText = parts[parts.length - 1];
  const seconds = secondsText.length === 1 ? Number(secondsText) * 10 : Number(secondsText);
  if (seconds > 59) return null;

  if (parts.length === 2) {
    const [minutes] = numericParts;
    if (minutes > 59) return null;
    return secondsToTime((minutes * 60) + seconds);
  }

  const [hours, minutes] = numericParts;
  if (minutes > 59) return null;
  return secondsToTime((hours * 3600) + (minutes * 60) + seconds);
}

function nutritionKeyToTimeField(key) {
  return `${key}Time`;
}

function handleNutritionTimeInput(key, event) {
  const value = event.target.value;
  nutritionTimeInputs.value[key] = value;

  const normalizedValue = normalizeTimeInputValue(value);
  if (normalizedValue !== null) {
    nutrition.value[nutritionKeyToTimeField(key)] = normalizedValue;
  }
}

function finishNutritionTimeInput(key) {
  isEditingNutritionTime.value[key] = false;

  const normalizedValue = normalizeTimeInputValue(nutritionTimeInputs.value[key]);
  const timeField = nutritionKeyToTimeField(key);
  nutritionTimeInputs.value[key] = normalizedValue ?? nutrition.value[timeField];

  if (normalizedValue !== null) {
    nutrition.value[timeField] = normalizedValue;
  }
}

function paceTextToSeconds(value) {
  if (!value || typeof value !== 'string') return null;

  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)/);
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function updatePaceValue(disciplineKey, value) {
  if (!currentPreset.value) return;

  if (disciplineKey === 'swim') {
    const secondsPer100m = paceTextToSeconds(value);
    if (secondsPer100m === null) return;

    const distanceM = currentPreset.value.distances.swim * 1000;
    updateDiscipline('swim', Math.round((secondsPer100m * distanceM) / 100));
    return;
  }

  if (disciplineKey === 'run') {
    const secondsPerKm = paceTextToSeconds(value);
    if (secondsPerKm === null) return;

    updateDiscipline('run', Math.round(secondsPerKm * currentPreset.value.distances.run));
    return;
  }

  if (disciplineKey === 'bike') {
    const speed = Number.parseFloat(String(value).replace(',', '.'));
    if (!Number.isFinite(speed) || speed <= 0) return;

    updateDiscipline('bike', Math.round((currentPreset.value.distances.bike / speed) * 3600));
  }
}

function updateDiscipline(disciplineKey, newValue) {
  const oldValue = disciplines.value[disciplineKey];
  const delta = newValue - oldValue;
  
  if (delta === 0) return;
  
  // Update the changed discipline
  disciplines.value[disciplineKey] = newValue;
  
  // Get all disciplines that are NOT locked and NOT the one being changed
  const adjustableDisciplines = Object.keys(disciplines.value).filter(
    key => key !== disciplineKey && !lockedDisciplines.value[key]
  );
  
  // If no adjustable disciplines, can't redistribute
  if (adjustableDisciplines.length === 0) {
    disciplines.value[disciplineKey] = oldValue; // Revert change
    return;
  }
  
  // Calculate total of adjustable disciplines
  const adjustableTotal = adjustableDisciplines.reduce((sum, key) => sum + disciplines.value[key], 0);
  
  if (adjustableTotal === 0) {
    // If other adjustable disciplines are 0, distribute evenly
    const lockedTotal = Object.keys(disciplines.value)
      .filter(key => key !== disciplineKey && lockedDisciplines.value[key])
      .reduce((sum, key) => sum + disciplines.value[key], 0);
    const remaining = targetTimeSeconds.value - newValue - lockedTotal;
    const perDiscipline = Math.floor(remaining / adjustableDisciplines.length);
    adjustableDisciplines.forEach(key => {
      disciplines.value[key] = perDiscipline;
    });
  } else {
    // Redistribute proportionally based on current values
    adjustableDisciplines.forEach(key => {
      const proportion = disciplines.value[key] / adjustableTotal;
      const adjustment = Math.round(-delta * proportion);
      disciplines.value[key] = Math.max(0, disciplines.value[key] + adjustment);
    });
  }
  
  // Adjust for rounding errors to ensure total equals target
  adjustForRoundingErrors();
}

function toggleLock(disciplineKey) {
  lockedDisciplines.value[disciplineKey] = !lockedDisciplines.value[disciplineKey];
}

function loadNutritionRaceDefaults() {
  const preset = getPreset(nutrition.value.raceType);
  const times = calculateInitialTimes(timeToSeconds(preset.targetTime), preset.distribution);

  isSyncingRaceTimes = true;
  selectedPreset.value = nutrition.value.raceType;
  currentPreset.value = preset;
  targetTimeInput.value = preset.targetTime;
  targetTimeSeconds.value = timeToSeconds(preset.targetTime);
  Object.assign(disciplines.value, times);

  nutrition.value.swimTime = secondsToTime(times.swim);
  nutrition.value.bikeTime = secondsToTime(times.bike);
  nutrition.value.runTime = secondsToTime(times.run);
  nutrition.value.customCarbsPerHour = selectedNutritionRace.value.defaultCarbsPerHour;
  isSyncingRaceTimes = false;
}

function addNutritionProduct() {
  nutrition.value.products.push({
    id: nextProductId,
    name: 'Product',
    carbs: 30,
    sodium: 100,
    servings: 1
  });
  nextProductId += 1;
}

function removeNutritionProduct(productId) {
  if (nutrition.value.products.length === 1) return;
  nutrition.value.products = nutrition.value.products.filter(product => product.id !== productId);
}

function adjustForRoundingErrors() {
  const total = disciplines.value.swim + disciplines.value.t1 +
                disciplines.value.bike + disciplines.value.t2 +
                disciplines.value.run;
  const diff = targetTimeSeconds.value - total;
  
  if (diff !== 0) {
    // Add/subtract the difference to the largest unlocked discipline
    const adjustableDisciplines = Object.keys(disciplines.value).filter(
      key => !lockedDisciplines.value[key]
    );
    
    if (adjustableDisciplines.length > 0) {
      const largest = adjustableDisciplines.reduce((a, b) =>
        disciplines.value[a] > disciplines.value[b] ? a : b
      );
      disciplines.value[largest] = Math.max(0, disciplines.value[largest] + diff);
    }
  }
}

watch(
  () => [disciplines.value.swim, disciplines.value.bike, disciplines.value.run],
  ([swim, bike, run]) => {
    if (isSyncingRaceTimes) return;

    isSyncingRaceTimes = true;
    nutrition.value.swimTime = secondsToTime(swim);
    nutrition.value.bikeTime = secondsToTime(bike);
    nutrition.value.runTime = secondsToTime(run);
    isSyncingRaceTimes = false;
  }
);

watch(
  () => [nutrition.value.swimTime, nutrition.value.bikeTime, nutrition.value.runTime],
  ([swimTime, bikeTime, runTime]) => {
    const times = { swim: swimTime, bike: bikeTime, run: runTime };
    Object.entries(times).forEach(([key, value]) => {
      if (!isEditingNutritionTime.value[key]) {
        nutritionTimeInputs.value[key] = value;
      }
    });

    if (isSyncingRaceTimes) return;
    if (![swimTime, bikeTime, runTime].every(isValidTimeFormat)) return;

    isSyncingRaceTimes = true;
    disciplines.value.swim = timeToSeconds(swimTime);
    disciplines.value.bike = timeToSeconds(bikeTime);
    disciplines.value.run = timeToSeconds(runTime);
    targetTimeSeconds.value = disciplines.value.swim +
      disciplines.value.t1 +
      disciplines.value.bike +
      disciplines.value.t2 +
      disciplines.value.run;
    targetTimeInput.value = secondsToTime(targetTimeSeconds.value);
    isSyncingRaceTimes = false;
  }
);

watch(
  () => ({
    activeView: activeView.value,
    selectedPreset: selectedPreset.value,
    targetTimeInput: targetTimeInput.value,
    targetTimeSeconds: targetTimeSeconds.value,
    disciplines: disciplines.value,
    lockedDisciplines: lockedDisciplines.value,
    nutrition: nutrition.value
  }),
  (state) => persistentState.save(state),
  { deep: true }
);
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  max-width: 980px;
  margin: 0 auto;
  padding: 20px;
}

.app-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 12px;
}

.nav-button {
  flex: 1;
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  color: white;
  background: transparent;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.nav-button.active {
  color: #2c3e50;
  background: white;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
}

.app-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.app-header h1 {
  font-size: 32px;
  margin-bottom: 8px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
}

.app-main {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.controls-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.preset-selector,
.target-time-input {
  margin-bottom: 16px;
}

.preset-selector label,
.target-time-input label,
.form-field label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
}

.preset-selector select,
.target-time-input input,
.form-field select,
.form-field input,
.products-row input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.preset-selector select:focus,
.target-time-input input:focus,
.form-field select:focus,
.form-field input:focus,
.products-row input:focus {
  outline: none;
  border-color: #667eea;
}

.form-field input:disabled {
  color: #888;
  background: #f5f5f5;
}

.distance-info {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.distance-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.distance-icon {
  font-size: 18px;
}

.disciplines-section {
  margin-bottom: 30px;
}

.summary-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s;
}

.summary-section.valid {
  background: #e8f5e9;
  border-color: #4caf50;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
}

.summary-value {
  font-family: 'Courier New', monospace;
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
}

.summary-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #666;
}

.status-icon {
  font-size: 24px;
}

.summary-section.valid .status-icon {
  color: #4caf50;
}

.nutrition-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
}

.nutrition-panel h2,
.section-heading h2 {
  margin-bottom: 16px;
  color: #2c3e50;
  font-size: 22px;
}

.split-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.form-field {
  margin-bottom: 16px;
}

.nutrition-summary,
.nutrition-totals {
  display: grid;
  gap: 12px;
  align-content: start;
}

.summary-metric,
.nutrition-totals > div {
  padding: 16px;
  border: 1px solid #e8ebef;
  border-radius: 8px;
  background: #f8f9fa;
}

.summary-metric strong,
.nutrition-totals strong {
  display: block;
  margin-top: 4px;
  color: #2c3e50;
  font-size: 22px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.secondary-button,
.icon-button {
  border: 0;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.secondary-button {
  padding: 10px 14px;
  color: white;
  background: #667eea;
}

.products-table {
  display: grid;
  gap: 8px;
}

.products-row {
  display: grid;
  grid-template-columns: minmax(150px, 1.2fr) minmax(86px, 0.7fr) minmax(98px, 0.8fr) minmax(94px, 0.7fr) minmax(150px, 1fr) 42px;
  gap: 8px;
  align-items: center;
}

.products-header {
  color: #666;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.product-total {
  font-weight: 700;
  color: #2c3e50;
}

.icon-button {
  width: 42px;
  height: 42px;
  color: #c62828;
  background: #ffebee;
  font-size: 24px;
  line-height: 1;
}

.icon-button:disabled {
  color: #aaa;
  background: #f5f5f5;
  cursor: not-allowed;
}

.nutrition-totals {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.warning {
  color: #c62828 !important;
}

.app-footer {
  text-align: center;
  color: white;
  margin-top: 20px;
  font-size: 14px;
  opacity: 0.9;
}

@media (max-width: 600px) {
  #app {
    padding: 10px;
  }

  .app-header h1 {
    font-size: 24px;
  }

  .app-main {
    padding: 20px;
  }

  .distance-info {
    flex-direction: column;
    gap: 8px;
  }

  .summary-section {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .nutrition-grid,
  .split-fields,
  .nutrition-totals {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .products-row {
    grid-template-columns: 1fr 1fr;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .products-header {
    display: none;
  }

  .product-total {
    grid-column: 1 / -1;
  }
}
</style>
