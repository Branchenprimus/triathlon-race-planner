/**
 * Time conversion utilities for the Triathlon Race Planner
 */

/**
 * Convert HH:MM:SS string to total seconds
 * @param {string} timeString - Time in format "HH:MM:SS"
 * @returns {number} Total seconds
 */
export function timeToSeconds(timeString) {
    if (!timeString || typeof timeString !== 'string') return 0;

    const parts = timeString.split(':').map(part => parseInt(part, 10) || 0);

    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
        const [minutes, seconds] = parts;
        return minutes * 60 + seconds;
    }

    return 0;
}

/**
 * Convert seconds to HH:MM:SS string
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Time in format "HH:MM:SS"
 */
export function secondsToTime(totalSeconds) {
    if (typeof totalSeconds !== 'number' || totalSeconds < 0) return '00:00:00';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return [hours, minutes, seconds]
        .map(val => String(val).padStart(2, '0'))
        .join(':');
}

/**
 * Format seconds to MM:SS for display
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Time in format "MM:SS"
 */
export function secondsToMinutesSeconds(totalSeconds) {
    if (typeof totalSeconds !== 'number' || totalSeconds < 0) return '00:00';

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Calculate pace in min/km for running
 * @param {number} seconds - Time in seconds
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Pace in format "MM:SS /km"
 */
export function calculateRunPace(seconds, distanceKm) {
    if (!distanceKm || distanceKm <= 0) return '--:-- /km';

    const paceSeconds = seconds / distanceKm;
    return `${secondsToMinutesSeconds(paceSeconds)} /km`;
}

/**
 * Calculate pace in min/100m for swimming
 * @param {number} seconds - Time in seconds
 * @param {number} distanceM - Distance in meters
 * @returns {string} Pace in format "MM:SS /100m"
 */
export function calculateSwimPace(seconds, distanceM) {
    if (!distanceM || distanceM <= 0) return '--:-- /100m';

    const paceSeconds = (seconds / distanceM) * 100;
    return `${secondsToMinutesSeconds(paceSeconds)} /100m`;
}

/**
 * Calculate speed in km/h for cycling
 * @param {number} seconds - Time in seconds
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Speed in format "XX.X km/h"
 */
export function calculateBikeSpeed(seconds, distanceKm) {
    if (!seconds || seconds <= 0) return '0.0 km/h';

    const hours = seconds / 3600;
    const speed = distanceKm / hours;

    return `${speed.toFixed(1)} km/h`;
}

/**
 * Validate time string format (HH:MM:SS)
 * @param {string} timeString - Time string to validate
 * @returns {boolean} True if valid
 */
export function isValidTimeFormat(timeString) {
    if (!timeString || typeof timeString !== 'string') return false;

    const timeRegex = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/;
    return timeRegex.test(timeString);
}

/**
 * Calculate percentage of total
 * @param {number} value - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export function calculatePercentage(value, total) {
    if (!total || total <= 0) return 0;
    return Math.round((value / total) * 100);
}

// Made with Bob
