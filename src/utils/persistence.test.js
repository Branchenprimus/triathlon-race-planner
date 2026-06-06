import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPersistentState,
  loadPersistentState,
  savePersistentState
} from './persistence.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

test('loadPersistentState returns defaults when storage is empty', () => {
  const defaults = { activeView: 'pace', selectedPreset: 'olympic' };

  assert.deepEqual(loadPersistentState(createStorage(), 'planner', defaults), defaults);
});

test('loadPersistentState merges saved fields with current defaults', () => {
  const storage = createStorage({
    planner: JSON.stringify({ activeView: 'nutrition', nutrition: { bodyWeight: 80 } })
  });

  assert.deepEqual(loadPersistentState(storage, 'planner', {
    activeView: 'pace',
    selectedPreset: 'olympic',
    nutrition: { bodyWeight: 75, raceType: 'olympic' }
  }), {
    activeView: 'nutrition',
    selectedPreset: 'olympic',
    nutrition: { bodyWeight: 80, raceType: 'olympic' }
  });
});

test('loadPersistentState ignores malformed JSON and preserves defaults', () => {
  const defaults = { activeView: 'pace', selectedPreset: 'olympic' };
  const storage = createStorage({ planner: '{bad json' });

  assert.deepEqual(loadPersistentState(storage, 'planner', defaults), defaults);
});

test('savePersistentState writes JSON to storage', () => {
  const storage = createStorage();
  const state = { activeView: 'nutrition', targetTimeInput: '05:30:00' };

  savePersistentState(storage, 'planner', state);

  assert.deepEqual(JSON.parse(storage.getItem('planner')), state);
});

test('createPersistentState loads initial state and saves future snapshots', () => {
  const storage = createStorage({
    planner: JSON.stringify({ activeView: 'nutrition' })
  });

  const persistentState = createPersistentState(storage, 'planner', {
    activeView: 'pace',
    selectedPreset: 'olympic'
  });

  assert.deepEqual(persistentState.initialState, {
    activeView: 'nutrition',
    selectedPreset: 'olympic'
  });

  persistentState.save({ activeView: 'pace', selectedPreset: 'halfIronman' });

  assert.deepEqual(JSON.parse(storage.getItem('planner')), {
    activeView: 'pace',
    selectedPreset: 'halfIronman'
  });
});
