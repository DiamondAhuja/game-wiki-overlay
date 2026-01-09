/**
 * Gamepad Module
 * 
 * Orchestrates gamepad input handling using modular components.
 * Single Responsibility: coordinates between input, actions, and main process.
 * 
 * Component Architecture:
 * - GamepadInput: Low-level XInput polling
 * - GamepadActionDispatcher: Routes buttons to handlers
 * - ButtonRepeatHandler: Manages D-pad repeat timing
 */

const { getMainWindow } = require('../window');

/**
 * @typedef {Object} WindowActionHandler
 * @property {() => boolean} isWindowVisible - Check if main window is visible
 * @property {() => void} closeApp - Close the application
 * @property {() => void} toggleVisibility - Toggle window visibility
 */

/**
 * @typedef {Object} NavigationActionHandler
 * @property {() => void} handleClick - Handle A button click
 * @property {() => void} handleBack - Handle B button back
 * @property {() => void} handleHome - Handle Y button home
 * @property {() => void} handleOpenKeyboard - Handle X button keyboard
 * @property {() => void} handlePageUp - Handle LB page up
 * @property {() => void} handlePageDown - Handle RB page down
 * @property {() => void} handleSubmitSearch - Handle Start button submit
 */
const GamepadInput = require('./gamepad-input');
const GamepadActionDispatcher = require('./gamepad-actions');
const ButtonRepeatHandler = require('./button-repeat-handler');
const { ANALOG_CONFIG, POLLING } = require('./gamepad-config');

// Module state
let gamepadInput = null;
let gamepadDispatcher = null;
let repeatHandler = null;
let pollInterval = null;
let backgroundMode = false; // When true, only process visibility toggle combo


/**
 * Safely get the main window if it exists and is not destroyed
 * @returns {Electron.BrowserWindow|null}
 * @private
 */
function getValidWindow() {
  const win = getMainWindow();
  return (win && !win.isDestroyed()) ? win : null;
}

/**
 * Send a gamepad action to the renderer process
 * @param {string} action - The action name to send
 * @private
 */
function sendGamepadAction(action) {
  const win = getValidWindow();
  if (win) {
    win.webContents.send('gamepad-action', action);
  }
}

/**
 * Window action handler - implements WindowActionHandler interface
 * @type {WindowActionHandler}
 */
const windowActionHandler = {
  isWindowVisible() {
    const win = getValidWindow();
    return win ? win.isVisible() : false;
  },
  closeApp() {
    const win = getValidWindow();
    if (win) {
      require('electron').app.quit();
    }
  },
  toggleVisibility() {
    const win = getValidWindow();
    if (win) {
      if (win.isVisible()) {
        // First minimize to taskbar - this properly returns focus to previous app
        win.minimize();
        // Then hide after a brief delay so Windows processes the focus change
        setTimeout(() => {
          if (win && !win.isDestroyed()) {
            win.hide();
          }
        }, 50);
      } else {
        win.show();
        win.restore();
        win.focus();
        // Re-apply always on top after restore
        win.setAlwaysOnTop(true, 'screen-saver');
      }
    }
  }
};

/**
 * Navigation action handler - implements NavigationActionHandler interface
 * Uses sendGamepadAction utility to reduce repetition
 * @type {NavigationActionHandler}
 */
const navigationActionHandler = {
  handleClick: () => sendGamepadAction('click'),
  handleBack: () => sendGamepadAction('back'),
  handleHome: () => sendGamepadAction('home'),
  handleOpenKeyboard: () => sendGamepadAction('search'),
  handlePageUp: () => sendGamepadAction('page-up'),
  handlePageDown: () => sendGamepadAction('page-down'),
  handleSubmitSearch: () => sendGamepadAction('start')
};

/**
 * Poll the gamepad and dispatch actions
 * @private
 */
function pollGamepad() {
  const state = gamepadInput.poll();
  if (!state) {
    // Controller disconnected
    return;
  }

  // Always dispatch button presses (handles visibility toggle combo even in background mode)
  gamepadDispatcher.dispatchButtonPress(state, backgroundMode);

  // Skip navigation/cursor input when in background mode
  if (backgroundMode) {
    return;
  }

  // Dispatch D-pad input with repeat
  gamepadDispatcher.dispatchDpad(state, (direction) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('gamepad-action', `cursor-${direction}`);
    }
  }, repeatHandler);

  // Dispatch analog input (cursors & scrolling)
  gamepadDispatcher.dispatchAnalog(state, (dx, dy) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      // Apply cursor speed multiplier
      const scaledDx = (dx / ANALOG_CONFIG.STICK_MAX) * ANALOG_CONFIG.CURSOR_SPEED;
      const scaledDy = (dy / ANALOG_CONFIG.STICK_MAX) * ANALOG_CONFIG.CURSOR_SPEED;
      win.webContents.send('analog-input', { dx: scaledDx, dy: scaledDy });
    }
  }, (rightStickX, rightStickY) => {
    // Right stick scrolling
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      // Right stick values are already deadzone-filtered, so scale appropriately
      // Max post-deadzone value is approximately (32767 - 8000) = 24767
      const maxPostDeadzone = ANALOG_CONFIG.STICK_MAX - ANALOG_CONFIG.DEADZONE;
      const scrollSpeed = 15; // Pixels per poll at full deflection
      const scrollY = (rightStickY / maxPostDeadzone) * scrollSpeed;
      
      // Only send if there's meaningful movement
      if (Math.abs(scrollY) > 0.5) {
        win.webContents.send('gamepad-scroll', { scrollY });
      }
    }
  });
}

/**
 * Start gamepad polling
 * @returns {boolean} Success status
 */
function startPolling() {
  // Already polling
  if (pollInterval) {
    return true;
  }
  
  // Initialize components if needed
  if (!gamepadInput) {
    gamepadInput = new GamepadInput();
    if (!gamepadInput.init()) {
      console.log('Gamepad support disabled - XInput not available');
      return false;
    }
  }
  
  if (!repeatHandler) {
    repeatHandler = new ButtonRepeatHandler();
  }
  
  if (!gamepadDispatcher) {
    gamepadDispatcher = new GamepadActionDispatcher(windowActionHandler, navigationActionHandler);
  }

  // Poll at specified frequency
  pollInterval = setInterval(pollGamepad, POLLING.INTERVAL);
  console.log(`Gamepad polling started (${POLLING.FREQUENCY_HZ}Hz)`);
  return true;
}

/**
 * Stop gamepad polling and clean up
 */
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  // Clean up repeat timers
  if (repeatHandler) {
    repeatHandler.clearAll();
  }

  // Reset input state
  if (gamepadInput) {
    gamepadInput.reset();
  }

  console.log('Gamepad polling stopped');
}

/**
 * Set background mode - when true, only visibility toggle combo is processed
 * @param {boolean} enabled - Whether to enable background mode
 */
function setBackgroundMode(enabled) {
  backgroundMode = enabled;
  
  // Clear repeat handlers when entering background mode
  if (enabled && repeatHandler) {
    repeatHandler.clearAll();
  }
}

module.exports = { startPolling, stopPolling, setBackgroundMode };
