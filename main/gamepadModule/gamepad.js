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
const GamepadInput = require('./gamepadInput');
const GamepadActionDispatcher = require('./gamepadActions');
const ButtonRepeatHandler = require('./buttonRepeatHandler');
const { ANALOG_CONFIG, POLLING } = require('./gamepadConfig');

// Module state
let gamepadInput = null;
let gamepadDispatcher = null;
let repeatHandler = null;
let pollInterval = null;


/**
 * Window action handler - implements interface expected by GamepadActionDispatcher
 */
const windowActionHandler = {
  isWindowVisible() {
    const win = getMainWindow();
    return win && !win.isDestroyed() && win.isVisible();
  },
  closeApp() {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      require('electron').app.quit();
    }
  },
  toggleVisibility() {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  }
};

/**
 * Navigation action handler - implements interface expected by GamepadActionDispatcher
 */
const navigationActionHandler = {
  handleClick() {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('gamepad-action', 'click');
    }
  },
  handleBack() {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('gamepad-action', 'back');
    }
  },
  handleHome() {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('gamepad-action', 'home');
    }
  },
  handleOpenKeyboard() {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('gamepad-action', 'search');
    }
  },
  handlePageUp() {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('gamepad-action', 'page-up');
    }
  },
  handlePageDown() {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('gamepad-action', 'page-down');
    }
  },
  handleSubmitSearch() {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('gamepad-action', 'start');
    }
  }
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

  // Dispatch button presses to appropriate handlers
  gamepadDispatcher.dispatchButtonPress(state);

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
  // Initialize components
  gamepadInput = new GamepadInput();
  repeatHandler = new ButtonRepeatHandler();
  gamepadDispatcher = new GamepadActionDispatcher(windowActionHandler, navigationActionHandler);

  if (!gamepadInput.init()) {
    console.log('Gamepad support disabled - XInput not available');
    return false;
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

module.exports = { startPolling, stopPolling };
