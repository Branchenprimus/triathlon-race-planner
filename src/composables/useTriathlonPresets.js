/**
 * Triathlon preset templates and logic
 */

export const TRIATHLON_PRESETS = {
    sprint: {
        name: 'Sprint',
        distances: {
            swim: 0.75, // km
            bike: 20,   // km
            run: 5      // km
        },
        targetTime: '01:30:00', // HH:MM:SS
        distribution: {
            swim: 0.20,    // 20%
            t1: 0.03,      // 3%
            bike: 0.45,    // 45%
            t2: 0.02,      // 2%
            run: 0.30      // 30%
        }
    },
    olympic: {
        name: 'Olympic',
        distances: {
            swim: 1.5,  // km
            bike: 40,   // km
            run: 10     // km
        },
        targetTime: '03:00:00',
        distribution: {
            swim: 0.18,    // 18%
            t1: 0.02,      // 2%
            bike: 0.50,    // 50%
            t2: 0.02,      // 2%
            run: 0.28      // 28%
        }
    },
    halfIronman: {
        name: 'Half-Ironman (70.3)',
        distances: {
            swim: 1.9,  // km
            bike: 90,   // km
            run: 21.1   // km
        },
        targetTime: '06:00:00',
        distribution: {
            swim: 0.15,    // 15%
            t1: 0.02,      // 2%
            bike: 0.52,    // 52%
            t2: 0.02,      // 2%
            run: 0.29      // 29%
        }
    },
    ironman: {
        name: 'Ironman (140.6)',
        distances: {
            swim: 3.8,  // km
            bike: 180,  // km
            run: 42.2   // km
        },
        targetTime: '12:00:00',
        distribution: {
            swim: 0.13,    // 13%
            t1: 0.02,      // 2%
            bike: 0.53,    // 53%
            t2: 0.02,      // 2%
            run: 0.30      // 30%
        }
    }
};

/**
 * Get preset by key
 * @param {string} presetKey - Key of the preset (sprint, olympic, halfIronman, ironman)
 * @returns {object} Preset configuration
 */
export function getPreset(presetKey) {
    return TRIATHLON_PRESETS[presetKey] || TRIATHLON_PRESETS.olympic;
}

/**
 * Get all preset options for dropdown
 * @returns {Array} Array of preset options
 */
export function getPresetOptions() {
    return Object.keys(TRIATHLON_PRESETS).map(key => ({
        value: key,
        label: TRIATHLON_PRESETS[key].name
    }));
}

/**
 * Calculate initial discipline times based on target time and distribution
 * @param {number} targetTimeSeconds - Target time in seconds
 * @param {object} distribution - Distribution percentages
 * @returns {object} Discipline times in seconds
 */
export function calculateInitialTimes(targetTimeSeconds, distribution) {
    return {
        swim: Math.round(targetTimeSeconds * distribution.swim),
        t1: Math.round(targetTimeSeconds * distribution.t1),
        bike: Math.round(targetTimeSeconds * distribution.bike),
        t2: Math.round(targetTimeSeconds * distribution.t2),
        run: Math.round(targetTimeSeconds * distribution.run)
    };
}

/**
 * Validate that distribution percentages sum to 1.0 (100%)
 * @param {object} distribution - Distribution object
 * @returns {boolean} True if valid
 */
export function isValidDistribution(distribution) {
    const sum = Object.values(distribution).reduce((acc, val) => acc + val, 0);
    return Math.abs(sum - 1.0) < 0.001; // Allow small floating point errors
}

// Made with Bob
