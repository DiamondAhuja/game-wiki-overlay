/**
 * Gamepad Configuration
 *
 * Centralized configuration for gamepad input handling.
 * Separates configuration data from business logic.
 *
 * This file contains ALL gamepad-related constants used across
 * both main process and renderer process.
 */

// XInput button constants
const BUTTONS = {
  DPAD_UP: 0x0001,
  DPAD_DOWN: 0x0002,
  DPAD_LEFT: 0x0004,
  DPAD_RIGHT: 0x0008,
  START: 0x0010,
  BACK: 0x0020,
  LEFT_THUMB: 0x0040,
  RIGHT_THUMB: 0x0080,
  LEFT_SHOULDER: 0x0100,
  RIGHT_SHOULDER: 0x0200,
  A: 0x1000,
  B: 0x2000,
  X: 0x4000,
  Y: 0x8000,
};

// Analog input thresholds
const ANALOG_CONFIG = {
  DEADZONE: 8000,        // Xbox default is ~7849
  STICK_MAX: 32767,
  CURSOR_SPEED: 25,       // Pixels per poll at full tilt
};

// D-pad repeat behavior
const DPAD_REPEAT = {
  DELAY: 200,            // ms before repeat starts
  RATE: 50,               // ms between repeats
};

// Polling frequency
const POLLING = {
  INTERVAL: 16,          // ~60Hz
  FREQUENCY_HZ: 60,
};

// Renderer-side cursor and navigation constants
// These are used by renderer.js and gamepad-cursor.js
const CURSOR_CONFIG = {
  // Movement multipliers for D-pad navigation
  DPAD_MOVE_MULTIPLIER: 4,      // Normal D-pad movement
  DPAD_FAST_MULTIPLIER: 6,      // Fast/repeated D-pad movement

  // Scroll amounts in pixels
  SCROLL_ANALOG_STEP: 30,       // Right stick scroll per tick
  SCROLL_PAGE_AMOUNT: 300,      // LB/RB page scroll amount

  // Timing constants
  REFRESH_DELAY_MS: 500,        // Delay before refreshing elements after navigation
  NAV_COMPLETE_DELAY_MS: 300,   // Delay after navigation completes
  CLICK_FEEDBACK_MS: 150,       // Visual click feedback duration

  // Cursor behavior
  CURSOR_SPEED: 8,              // Base cursor speed in pixels per input
  SCROLL_SPEED: 1,              // Base scroll multiplier
  CURSOR_HIDE_DELAY: 5000,      // ms before cursor auto-hides
  SNAP_RADIUS: 100,             // How close to snap to an element
  SNAP_STRENGTH: 0.3,           // Magnetic attraction strength (0-1)
  ELEMENT_REFRESH_RATE: 300,     // ms between element list refreshes
};

module.exports = {
  BUTTONS,
  ANALOG_CONFIG,
  DPAD_REPEAT,
  POLLING,
  CURSOR_CONFIG,
};
