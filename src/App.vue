<template>
  <div id="app">
    <header class="app-header">
      <h1>🏊‍♂️🚴‍♂️🏃‍♂️ Triathlon Race Planner</h1>
      <p class="subtitle">Plan your race splits with interactive time distribution</p>
    </header>

    <main class="app-main">
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
            @blur="updateTargetTime"
            @keyup.enter="updateTargetTime"
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
          :pace-info="swimPace"
          :is-locked="lockedDisciplines.swim"
          @update:model-value="(val) => updateDiscipline('swim', val)"
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
          :pace-info="bikeSpeed"
          :is-locked="lockedDisciplines.bike"
          @update:model-value="(val) => updateDiscipline('bike', val)"
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
          :pace-info="runPace"
          :is-locked="lockedDisciplines.run"
          @update:model-value="(val) => updateDiscipline('run', val)"
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

// State
const selectedPreset = ref('olympic');
const targetTimeInput = ref('03:00:00');
const targetTimeSeconds = ref(10800); // 3 hours default
const currentPreset = ref(null);
const presetOptions = getPresetOptions();

const disciplines = ref({
  swim: 0,
  t1: 0,
  bike: 0,
  t2: 0,
  run: 0
});

const lockedDisciplines = ref({
  swim: false,
  t1: true,  // T1 locked by default
  bike: false,
  t2: true,  // T2 locked by default
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

const bikeSpeed = computed(() => {
  if (!currentPreset.value) return '';
  return calculateBikeSpeed(disciplines.value.bike, currentPreset.value.distances.bike);
});

const runPace = computed(() => {
  if (!currentPreset.value) return '';
  return calculateRunPace(disciplines.value.run, currentPreset.value.distances.run);
});

// Methods
function loadPreset() {
  if (!selectedPreset.value) {
    currentPreset.value = null;
    return;
  }

  const preset = getPreset(selectedPreset.value);
  currentPreset.value = preset;
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

// Initialize with Olympic preset
loadPreset();
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
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
.target-time-input label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
}

.preset-selector select,
.target-time-input input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.preset-selector select:focus,
.target-time-input input:focus {
  outline: none;
  border-color: #667eea;
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
}
</style>
