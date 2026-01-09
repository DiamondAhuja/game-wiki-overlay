/**
 * Gamepad Input Handler
 * 
 * Low-level XInput polling and state tracking.
 * Single Responsibility: reads raw gamepad input only.
 */

const koffi = require('koffi');
const { BUTTONS, ANALOG_CONFIG, POLLING, DPAD_REPEAT } = require('./gamepadConfig');

class GamepadInput {
  constructor() {
    this.xinput = null;
    this.XInputGetState = null;
    this.lastButtons = 0;
  }

  /**
   * Initialize XInput DLL
   * @returns {boolean} Success status
   */
  init() {
    try {
      // Try XInput1_4 first (Windows 8+), fall back to XInput9_1_0
      try {
        this.xinput = koffi.load('XInput1_4.dll');
      } catch {
        this.xinput = koffi.load('XInput9_1_0.dll');
      }

      // Define XINPUT_GAMEPAD structure
      const XINPUT_GAMEPAD = koffi.struct('XINPUT_GAMEPAD', {
        wButtons: 'uint16',
        bLeftTrigger: 'uint8',
        bRightTrigger: 'uint8',
        sThumbLX: 'int16',
        sThumbLY: 'int16',
        sThumbRX: 'int16',
        sThumbRY: 'int16'
      });

      const XINPUT_STATE = koffi.struct('XINPUT_STATE', {
        dwPacketNumber: 'uint32',
        Gamepad: XINPUT_GAMEPAD
      });

      this.XInputGetState = this.xinput.func('uint32 XInputGetState(uint32 dwUserIndex, _Out_ XINPUT_STATE *pState)');
      return true;
    } catch (err) {
      console.error('Failed to initialize XInput:', err.message);
      return false;
    }
  }

  /**
   * Apply deadzone filtering to analog stick values
   * @param {number} value - Raw stick value
   * @returns {number} Filtered value (0 if within deadzone)
   */
  applyDeadzone(value) {
    const deadzone = ANALOG_CONFIG.DEADZONE;
    if (Math.abs(value) < deadzone) {
      return 0;
    }
    // Optional: normalize to remove the deadzone gap
    return value > 0 ? value - deadzone : value + deadzone;
  }

  /**
   * Check if a specific button is pressed
   * @param {number} buttons - Current button state
   * @param {number} button - Button to check
   * @returns {boolean}
   */
  isButtonPressed(buttons, button) {
    return (buttons & button) !== 0;
  }

  /**
   * Check if a button was just pressed (wasn't pressed last frame)
   * @param {number} currentButtons - Current button state
   * @param {number} button - Button to check
   * @returns {boolean}
   */
  isButtonJustPressed(currentButtons, button) {
    return this.isButtonPressed(currentButtons, button) && !this.isButtonPressed(this.lastButtons, button);
  }

  /**
   * Poll the gamepad and return current state
   * @returns {Object|null} Gamepad state or null if not available
   */
  poll() {
    if (!this.XInputGetState) return null;

    const state = {
      dwPacketNumber: 0,
      Gamepad: {
        wButtons: 0,
        bLeftTrigger: 0,
        bRightTrigger: 0,
        sThumbLX: 0,
        sThumbLY: 0,
        sThumbRX: 0,
        sThumbRY: 0
      }
    };

    const result = this.XInputGetState(0, state);
    if (result !== 0) {
      // Controller not available
      return null;
    }

    // Store button state for next frame's delta detection
    const previousButtons = this.lastButtons;
    this.lastButtons = state.Gamepad.wButtons;

    return {
      buttons: state.Gamepad.wButtons,
      previousButtons: previousButtons,
      leftTrigger: state.Gamepad.bLeftTrigger,
      rightTrigger: state.Gamepad.bRightTrigger,
      leftStickX: this.applyDeadzone(state.Gamepad.sThumbLX),
      leftStickY: this.applyDeadzone(state.Gamepad.sThumbLY),
      rightStickX: this.applyDeadzone(state.Gamepad.sThumbRX),
      rightStickY: this.applyDeadzone(state.Gamepad.sThumbRY)
    };
  }

  /**
   * Reset internal state
   */
  reset() {
    this.lastButtons = 0;
  }
}

module.exports = GamepadInput;
