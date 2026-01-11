/**
 * On-Screen Keyboard (OSK) Manager Module
 *
 * Handles the virtual on-screen keyboard for gamepad text input.
 *
 * Single Responsibility: Keyboard display, navigation, and input handling
 */

(function(global) {
  'use strict';

  // Keyboard layouts
  const LAYOUTS = {
    letters: [
      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
      'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '\'',
      'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '-',
    ],
    numbers: [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
      '!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
      '+', '=', '[', ']', '{', '}', ':', ';', '"', '?',
    ],
  };

  const COLS = 10;

  /**
   * OSKManager class - manages on-screen keyboard functionality
   */
  class OSKManager {
    /**
     * @param {Object} elements - DOM element references
     * @param {HTMLElement} elements.osk - The keyboard container
     * @param {HTMLElement} elements.oskKeys - Container for keyboard keys
     * @param {HTMLElement} elements.oskInputText - Preview text element
     * @param {Object} callbacks - Callback functions
     * @param {Function} callbacks.onHideCursor - Called when keyboard opens (hide main cursor)
     * @param {Function} callbacks.onShowCursor - Called when keyboard closes (show main cursor)
     * @param {Function} callbacks.onSubmit - Called when input is submitted
     */
    constructor(elements, callbacks = {}) {
      this.osk = elements.osk;
      this.oskKeys = elements.oskKeys;
      this.oskInputText = elements.oskInputText;
      this.callbacks = callbacks;

      // State
      this.visible = false;
      this.selectedIndex = 0;
      this.currentLayout = 'letters';
      this.inputValue = '';
      this.targetInput = null;

      // Analog navigation debounce
      this.lastAnalogNav = 0;
    }

    /**
     * Check if the keyboard is currently visible
     * @returns {boolean}
     */
    isVisible() {
      return this.visible;
    }

    /**
     * Show the on-screen keyboard
     * @param {HTMLInputElement} targetInput - The input element to type into
     */
    show(targetInput) {
      this.targetInput = targetInput;
      this.inputValue = targetInput.value || '';
      this.selectedIndex = 0;
      this.visible = true;
      this.osk.classList.remove('hidden');
      this._renderKeys();
      this._updatePreview();

      if (this.callbacks.onHideCursor) {
        this.callbacks.onHideCursor();
      }
    }

    /**
     * Hide the on-screen keyboard
     * @param {boolean} submit - Whether to submit the input value
     */
    hide(submit = false) {
      if (submit && this.targetInput) {
        this.targetInput.value = this.inputValue;

        if (this.callbacks.onSubmit) {
          this.callbacks.onSubmit(this.targetInput, this.inputValue);
        }
      }

      this.visible = false;
      this.osk.classList.add('hidden');
      this.targetInput = null;

      if (this.callbacks.onShowCursor) {
        this.callbacks.onShowCursor();
      }
    }

    /**
     * Navigate the keyboard in a direction
     * @param {'up'|'down'|'left'|'right'} direction
     */
    navigate(direction) {
      const keys = LAYOUTS[this.currentLayout];
      const rows = Math.ceil(keys.length / COLS);

      let col = this.selectedIndex % COLS;
      let row = Math.floor(this.selectedIndex / COLS);

      switch (direction) {
      case 'up':
        row = (row - 1 + rows) % rows;
        break;
      case 'down':
        row = (row + 1) % rows;
        break;
      case 'left':
        col = (col - 1 + COLS) % COLS;
        break;
      case 'right':
        col = (col + 1) % COLS;
        break;
      }

      let newIndex = row * COLS + col;
      if (newIndex >= keys.length) {
        newIndex = keys.length - 1;
      }

      this.selectedIndex = newIndex;
      this._renderKeys();
    }

    /**
     * Handle analog stick navigation with debounce
     * @param {number} dx - X delta
     * @param {number} dy - Y delta
     * @returns {boolean} Whether navigation occurred
     */
    handleAnalogNavigation(dx, dy) {
      const now = Date.now();
      if (now - this.lastAnalogNav < 150) return false;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        this.lastAnalogNav = now;
        if (Math.abs(dx) > Math.abs(dy)) {
          this.navigate(dx > 0 ? 'right' : 'left');
        } else {
          this.navigate(dy > 0 ? 'down' : 'up');
        }
        return true;
      }
      return false;
    }

    /**
     * Type the currently selected key
     */
    typeSelected() {
      const keys = LAYOUTS[this.currentLayout];
      if (this.selectedIndex < keys.length) {
        this.inputValue += keys[this.selectedIndex].toLowerCase();
        this._updatePreview();
      }
    }

    /**
     * Delete the last character
     */
    backspace() {
      this.inputValue = this.inputValue.slice(0, -1);
      this._updatePreview();
    }

    /**
     * Add a space
     */
    space() {
      this.inputValue += ' ';
      this._updatePreview();
    }

    /**
     * Switch between letter and number layouts
     */
    switchLayout() {
      this.currentLayout = this.currentLayout === 'letters' ? 'numbers' : 'letters';
      this.selectedIndex = Math.min(this.selectedIndex, LAYOUTS[this.currentLayout].length - 1);
      this._renderKeys();
    }

    /**
     * Get the target input element
     * @returns {HTMLInputElement|null}
     */
    getTargetInput() {
      return this.targetInput;
    }

    /**
     * Render the keyboard keys
     * @private
     */
    _renderKeys() {
      const keys = LAYOUTS[this.currentLayout];
      this.oskKeys.innerHTML = '';

      keys.forEach((key, index) => {
        const keyEl = document.createElement('div');
        keyEl.className = 'osk-key' + (index === this.selectedIndex ? ' selected' : '');
        keyEl.textContent = key;
        keyEl.dataset.index = index;

        keyEl.addEventListener('click', () => {
          this.inputValue += key.toLowerCase();
          this._updatePreview();
        });

        this.oskKeys.appendChild(keyEl);
      });
    }

    /**
     * Update the preview text
     * @private
     */
    _updatePreview() {
      this.oskInputText.textContent = this.inputValue || '';
    }
  }

  // Expose to global scope
  global.OSKManager = OSKManager;

})(window);
