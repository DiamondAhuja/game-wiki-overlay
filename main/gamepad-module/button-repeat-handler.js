/**
 * Button Repeat Handler
 *
 * Manages D-pad button repeat logic.
 * Single Responsibility: handles timing and state for button repeats only.
 */

const { DPAD_REPEAT } = require('./gamepad-config');

class ButtonRepeatHandler {
  constructor() {
    this.repeatTimers = {};
  }

  /**
   * Start repeat for a held button with initial delay
   * @param {number} button - Button constant
   * @param {Function} callback - Called repeatedly while held
   */
  startRepeat(button, callback) {
    // Clear any existing timer for this button
    if (this.repeatTimers[button]) {
      this.clearRepeat(button);
    }

    // Initial delay before repeat starts
    this.repeatTimers[button] = setTimeout(() => {
      // Start interval for continuous repeat
      this.repeatTimers[button + '_interval'] = setInterval(() => {
        callback();
      }, DPAD_REPEAT.RATE);

      // Call once after initial delay
      callback();
    }, DPAD_REPEAT.DELAY);
  }

  /**
   * Stop repeat for a button
   * @param {number} button - Button constant
   */
  clearRepeat(button) {
    if (this.repeatTimers[button]) {
      clearTimeout(this.repeatTimers[button]);
      delete this.repeatTimers[button];
    }
    if (this.repeatTimers[button + '_interval']) {
      clearInterval(this.repeatTimers[button + '_interval']);
      delete this.repeatTimers[button + '_interval'];
    }
  }

  /**
   * Clear all active repeats
   */
  clearAll() {
    Object.keys(this.repeatTimers).forEach(key => {
      if (typeof this.repeatTimers[key] === 'number') {
        clearTimeout(this.repeatTimers[key]);
      } else {
        clearInterval(this.repeatTimers[key]);
      }
      delete this.repeatTimers[key];
    });
  }
}

module.exports = ButtonRepeatHandler;
