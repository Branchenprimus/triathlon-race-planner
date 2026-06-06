function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function mergeDefaults(defaultValue, savedValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(savedValue) ? savedValue : defaultValue;
  }

  if (isPlainObject(defaultValue)) {
    const savedObject = isPlainObject(savedValue) ? savedValue : {};
    return Object.fromEntries(
      Object.entries(defaultValue).map(([key, value]) => [
        key,
        mergeDefaults(value, savedObject[key])
      ])
    );
  }

  return savedValue === undefined ? defaultValue : savedValue;
}

export function loadPersistentState(storage, key, defaults) {
  if (!storage) return defaults;

  try {
    const rawState = storage.getItem(key);
    if (!rawState) return defaults;

    return mergeDefaults(defaults, JSON.parse(rawState));
  } catch {
    return defaults;
  }
}

export function savePersistentState(storage, key, state) {
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(state));
  } catch {
    // Persistence is best-effort. Ignore quota/security errors so the app stays usable.
  }
}

export function createPersistentState(storage, key, defaults) {
  return {
    initialState: loadPersistentState(storage, key, defaults),
    save(state) {
      savePersistentState(storage, key, state);
    }
  };
}
