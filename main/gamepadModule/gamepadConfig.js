/**
 * Gamepad Configuration
 * 
 * Centralized configuration for gamepad input handling.
 * Separates configuration data from business logic.
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
  Y: 0x8000
};

// Analog input thresholds
const ANALOG_CONFIG = {
  DEADZONE: 8000,        // Xbox default is ~7849
  STICK_MAX: 32767,
  CURSOR_SPEED: 25       // Pixels per poll at full tilt
};

// D-pad repeat behavior
const DPAD_REPEAT = {
  DELAY: 200,            // ms before repeat starts
  RATE: 50               // ms between repeats
};

// Polling frequency
const POLLING = {
  INTERVAL: 16,          // ~60Hz
  FREQUENCY_HZ: 60
};

module.exports = {
  BUTTONS,
  ANALOG_CONFIG,
  DPAD_REPEAT,
  POLLING
};
