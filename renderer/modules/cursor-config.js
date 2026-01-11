/**
 * Cursor Configuration Module
 *
 * Centralized configuration for the gamepad cursor system.
 * Imported from main process config when available, with fallbacks.
 *
 * Single Responsibility: Cursor-related constants only
 */

(function(global) {
  'use strict';

  /**
   * @typedef {Object} CursorConfiguration
   * @property {number} CURSOR_SPEED - Base cursor speed in pixels per input
   * @property {number} SCROLL_SPEED - Base scroll multiplier
   * @property {number} CURSOR_HIDE_DELAY - ms before cursor auto-hides
   * @property {number} SNAP_RADIUS - How close to snap to an element
   * @property {number} SNAP_STRENGTH - Magnetic attraction strength (0-1)
   * @property {number} ELEMENT_REFRESH_RATE - ms between element list refreshes
   * @property {number} DPAD_MOVE_MULTIPLIER - Normal D-pad movement multiplier
   * @property {number} DPAD_FAST_MULTIPLIER - Fast D-pad movement multiplier
   * @property {number} SCROLL_ANALOG_STEP - Right stick scroll per tick
   * @property {number} SCROLL_PAGE_AMOUNT - LB/RB page scroll amount
   * @property {number} REFRESH_DELAY_MS - Delay before refreshing elements
   * @property {number} NAV_COMPLETE_DELAY_MS - Delay after navigation completes
   * @property {number} CLICK_FEEDBACK_MS - Visual click feedback duration
   */

  /** @type {CursorConfiguration} */
  const CURSOR_CONFIG = {
    // Movement multipliers for D-pad navigation
    DPAD_MOVE_MULTIPLIER: 4,
    DPAD_FAST_MULTIPLIER: 6,

    // Scroll amounts in pixels
    SCROLL_ANALOG_STEP: 30,
    SCROLL_PAGE_AMOUNT: 300,

    // Timing constants
    REFRESH_DELAY_MS: 500,
    NAV_COMPLETE_DELAY_MS: 300,
    CLICK_FEEDBACK_MS: 150,

    // Cursor behavior
    CURSOR_SPEED: 8,
    SCROLL_SPEED: 1,
    CURSOR_HIDE_DELAY: 5000,
    SNAP_RADIUS: 100,
    SNAP_STRENGTH: 0.3,
    ELEMENT_REFRESH_RATE: 300,
  };

  // Expose to global scope
  global.CURSOR_CONFIG = CURSOR_CONFIG;

})(window);
