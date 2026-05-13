<template>
  <div class="discipline-slider" :class="[`discipline-${discipline}`, { locked: isLocked }]">
    <div class="discipline-header">
      <div class="discipline-info">
        <span class="discipline-icon">{{ icon }}</span>
        <span class="discipline-name">{{ label }}</span>
      </div>
      <div class="discipline-stats">
        <span class="discipline-time">{{ formattedTime }}</span>
        <span class="discipline-percentage">{{ percentage }}%</span>
        <label class="toggle-switch">
          <input
            type="checkbox"
            :checked="isLocked"
            @change="toggleLock"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-label">{{ isLocked ? 'Locked' : 'Unlocked' }}</span>
        </label>
      </div>
    </div>
    
    <div class="slider-container">
      <input
        type="range"
        :min="0"
        :max="maxValue"
        :value="modelValue"
        @input="handleInput"
        class="slider"
      />
    </div>
    
    <div v-if="paceInfo" class="pace-info">
      {{ paceInfo }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { secondsToTime, calculatePercentage } from '../utils/timeUtils';

const props = defineProps({
  discipline: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  modelValue: {
    type: Number,
    required: true
  },
  maxValue: {
    type: Number,
    required: true
  },
  totalTime: {
    type: Number,
    required: true
  },
  paceInfo: {
    type: String,
    default: ''
  },
  isLocked: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'toggle-lock']);

const formattedTime = computed(() => {
  return secondsToTime(props.modelValue);
});

const percentage = computed(() => {
  return calculatePercentage(props.modelValue, props.totalTime);
});

function handleInput(event) {
  emit('update:modelValue', parseInt(event.target.value, 10));
}

function toggleLock() {
  emit('toggle-lock', props.discipline);
}
</script>

<style scoped>
.discipline-slider {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.discipline-slider:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.discipline-slider.locked {
  background: #f5f5f5;
  border: 2px solid #ffa726;
}

.discipline-slider.locked .slider {
  opacity: 0.6;
}

.discipline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.discipline-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.discipline-stats {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-slider {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  background-color: #ccc;
  border-radius: 24px;
  transition: background-color 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #ffa726;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

.toggle-switch input:checked ~ .toggle-label {
  color: #ffa726;
}

.discipline-icon {
  font-size: 24px;
}

.discipline-name {
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
}

.discipline-time {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
}

.discipline-percentage {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  background: #f0f0f0;
  color: #666;
}

.slider-container {
  margin: 12px 0;
}

.slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid currentColor;
  cursor: pointer;
  transition: transform 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid currentColor;
  cursor: pointer;
  transition: transform 0.2s;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.pace-info {
  font-size: 13px;
  color: #666;
  text-align: right;
  margin-top: 8px;
  font-style: italic;
}

/* Discipline-specific colors */
.discipline-swim .slider {
  background: linear-gradient(to right, #e3f2fd 0%, #2196f3 100%);
  color: #2196f3;
}

.discipline-t1 .slider {
  background: linear-gradient(to right, #fff3e0 0%, #ff9800 100%);
  color: #ff9800;
}

.discipline-bike .slider {
  background: linear-gradient(to right, #f3e5f5 0%, #9c27b0 100%);
  color: #9c27b0;
}

.discipline-t2 .slider {
  background: linear-gradient(to right, #fff3e0 0%, #ff9800 100%);
  color: #ff9800;
}

.discipline-run .slider {
  background: linear-gradient(to right, #e8f5e9 0%, #4caf50 100%);
  color: #4caf50;
}

.discipline-swim .discipline-percentage {
  background: #e3f2fd;
  color: #1976d2;
}

.discipline-t1 .discipline-percentage,
.discipline-t2 .discipline-percentage {
  background: #fff3e0;
  color: #f57c00;
}

.discipline-bike .discipline-percentage {
  background: #f3e5f5;
  color: #7b1fa2;
}

.discipline-run .discipline-percentage {
  background: #e8f5e9;
  color: #388e3c;
}
</style>