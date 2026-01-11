/**
 * Gamepad Action Dispatcher
 *
 * Routes button presses to appropriate action handlers.
 * Decouples button detection from action execution.
 * Strategy Pattern: different handlers for different button types.
 */

const { BUTTONS } = require('./gamepad-config');

class GamepadActionDispatcher {
  constructor(windowActionHandler, navigationActionHandler) {
    this.windowActionHandler = windowActionHandler;
    this.navigationActionHandler = navigationActionHandler;
    this.lastComboState = {}; // Track previous combo states to detect just-pressed combos
  }

  /**
   * Dispatch a button press to the appropriate handler
   * @param {Object} state - Gamepad state from poll()
   * @param {boolean} backgroundMode - When true, only process visibility toggle
   */
  dispatchButtonPress(state, backgroundMode = false) {
    const { buttons, previousButtons } = state;

    // Back + B combo to close app (only on initial combo press)
    if (this.isComboJustPressed(buttons, previousButtons, BUTTONS.BACK, BUTTONS.B)) {
      this.windowActionHandler.closeApp();
      return;
    }

    // Back + Start combo to toggle visibility (only on initial combo press)
    // This works even in background mode to allow bringing overlay back
    if (this.isComboJustPressed(buttons, previousButtons, BUTTONS.BACK, BUTTONS.START)) {
      this.windowActionHandler.toggleVisibility();
      return;
    }

    // Skip navigation processing in background mode
    if (backgroundMode) {
      return;
    }

    // Only process navigation buttons if window is visible
    // (window handler will tell us if visible)
    if (!this.windowActionHandler.isWindowVisible()) {
      return;
    }

    // Single button presses - only on first press
    if (this.isJustPressed(buttons, previousButtons, BUTTONS.A)) {
      this.navigationActionHandler.handleClick();
    }
    if (this.isJustPressed(buttons, previousButtons, BUTTONS.B)) {
      this.navigationActionHandler.handleBack();
    }
    if (this.isJustPressed(buttons, previousButtons, BUTTONS.Y)) {
      this.navigationActionHandler.handleHome();
    }
    if (this.isJustPressed(buttons, previousButtons, BUTTONS.X)) {
      this.navigationActionHandler.handleOpenKeyboard();
    }
    if (this.isJustPressed(buttons, previousButtons, BUTTONS.LEFT_SHOULDER)) {
      this.navigationActionHandler.handlePageUp();
    }
    if (this.isJustPressed(buttons, previousButtons, BUTTONS.RIGHT_SHOULDER)) {
      this.navigationActionHandler.handlePageDown();
    }
    if (this.isJustPressed(buttons, previousButtons, BUTTONS.START)) {
      this.navigationActionHandler.handleSubmitSearch();
    }
  }

  /**
   * Dispatch analog stick input
   * @param {Object} state - Gamepad state
   * @param {Function} analogCallback - Handler for analog input (dx, dy) for cursor
   * @param {Function} scrollCallback - Handler for right stick scrolling
   */
  dispatchAnalog(state, analogCallback, scrollCallback) {
    if (!this.windowActionHandler.isWindowVisible()) {
      return;
    }

    const { leftStickX, leftStickY, rightStickX, rightStickY } = state;

    // Process left stick movement (cursor)
    if (Math.abs(leftStickX) > 100 || Math.abs(leftStickY) > 100) {
      analogCallback(leftStickX, -leftStickY); // Negate Y for correct direction
    }

    // Process right stick movement (scrolling)
    if (scrollCallback && (Math.abs(rightStickX) > 100 || Math.abs(rightStickY) > 100)) {
      scrollCallback(rightStickX, -rightStickY); // Negate Y for correct direction
    }
  }

  /**
   * Dispatch D-pad input with repeat
   * @param {Object} state - Gamepad state
   * @param {Function} dpadCallback - Called on repeat with direction
   * @param {Object} repeatHandler - Button repeat handler
   */
  dispatchDpad(state, dpadCallback, repeatHandler) {
    if (!this.windowActionHandler.isWindowVisible()) {
      return;
    }

    const { buttons, previousButtons } = state;

    // D-pad up
    if (this.isPressed(buttons, BUTTONS.DPAD_UP)) {
      if (this.isJustPressed(buttons, previousButtons, BUTTONS.DPAD_UP)) {
        repeatHandler.startRepeat(BUTTONS.DPAD_UP, () => dpadCallback('up'));
      }
    } else {
      repeatHandler.clearRepeat(BUTTONS.DPAD_UP);
    }

    // D-pad down
    if (this.isPressed(buttons, BUTTONS.DPAD_DOWN)) {
      if (this.isJustPressed(buttons, previousButtons, BUTTONS.DPAD_DOWN)) {
        repeatHandler.startRepeat(BUTTONS.DPAD_DOWN, () => dpadCallback('down'));
      }
    } else {
      repeatHandler.clearRepeat(BUTTONS.DPAD_DOWN);
    }

    // D-pad left
    if (this.isPressed(buttons, BUTTONS.DPAD_LEFT)) {
      if (this.isJustPressed(buttons, previousButtons, BUTTONS.DPAD_LEFT)) {
        repeatHandler.startRepeat(BUTTONS.DPAD_LEFT, () => dpadCallback('left'));
      }
    } else {
      repeatHandler.clearRepeat(BUTTONS.DPAD_LEFT);
    }

    // D-pad right
    if (this.isPressed(buttons, BUTTONS.DPAD_RIGHT)) {
      if (this.isJustPressed(buttons, previousButtons, BUTTONS.DPAD_RIGHT)) {
        repeatHandler.startRepeat(BUTTONS.DPAD_RIGHT, () => dpadCallback('right'));
      }
    } else {
      repeatHandler.clearRepeat(BUTTONS.DPAD_RIGHT);
    }
  }

  /**
   * Check if a button is currently pressed
   * @private
   */
  isPressed(buttons, button) {
    return (buttons & button) !== 0;
  }

  /**
   * Check if a button was just pressed this frame
   * @private
   */
  isJustPressed(currentButtons, previousButtons, button) {
    return this.isPressed(currentButtons, button) && !this.isPressed(previousButtons, button);
  }

  /**
   * Check if a button combo is pressed
   * @private
   */
  isCombo(buttons, button1, button2) {
    return this.isPressed(buttons, button1) && this.isPressed(buttons, button2);
  }

  /**
   * Check if a button combo was just pressed (wasn't pressed last frame)
   * @private
   */
  isComboJustPressed(currentButtons, previousButtons, button1, button2) {
    const currentCombo = this.isCombo(currentButtons, button1, button2);
    const previousCombo = this.isCombo(previousButtons, button1, button2);
    return currentCombo && !previousCombo;
  }
}

module.exports = GamepadActionDispatcher;
