/**
 * UI Controls Module
 * 
 * Handles window controls: resize handles, opacity slider, close button,
 * and status display.
 * 
 * Single Responsibility: UI control interactions only
 */

(function(global) {
  'use strict';

  /**
   * UIControls class - manages window control interactions
   */
  class UIControls {
    /**
     * @param {Object} elements - DOM element references
     * @param {HTMLElement} elements.status - Status display element
     * @param {HTMLElement} elements.closeBtn - Close button
     * @param {HTMLElement} elements.opacitySlider - Opacity range input
     */
    constructor(elements) {
      this.status = elements.status;
      this.closeBtn = elements.closeBtn;
      this.opacitySlider = elements.opacitySlider;

      this._initResizeHandles();
      this._bindEvents();
    }

    /**
     * Initialize resize handle interactions
     * @private
     */
    _initResizeHandles() {
      const resizeHandles = document.querySelectorAll('.resize-handle');
      
      resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          
          // Extract direction from class name (resize-n, resize-se, etc.)
          const classes = handle.className.split(' ');
          const dirClass = classes.find(c => c.startsWith('resize-') && c !== 'resize-handle');
          
          if (dirClass && window.electronAPI) {
            const direction = dirClass.replace('resize-', '');
            window.electronAPI.startResize(direction);
          }
        });
      });

      // Stop resizing when mouse is released anywhere
      document.addEventListener('mouseup', () => {
        if (window.electronAPI) {
          window.electronAPI.stopResize();
        }
      });

      // Also stop if mouse leaves the window
      document.addEventListener('mouseleave', () => {
        if (window.electronAPI) {
          window.electronAPI.stopResize();
        }
      });
    }

    /**
     * Bind event listeners
     * @private
     */
    _bindEvents() {
      // Close button
      this.closeBtn.addEventListener('click', () => {
        if (window.electronAPI) {
          window.electronAPI.closeWindow();
        }
      });

      // Opacity slider
      this.opacitySlider.addEventListener('input', (e) => {
        const opacity = parseInt(e.target.value) / 100;
        if (window.electronAPI) {
          window.electronAPI.setOpacity(opacity);
        }
      });

      // Handle click-through mode notification from main process
      if (window.electronAPI) {
        window.electronAPI.onClickThroughChanged((enabled) => {
          this.setClickThroughStatus(enabled);
        });
      }
    }

    /**
     * Set loading status
     * @param {boolean} loading - Whether loading is in progress
     */
    setLoadingStatus(loading) {
      if (loading) {
        this.status.textContent = 'Loading...';
      } else {
        // Only clear if not showing click-through status
        if (!this.status.classList.contains('click-through')) {
          this.status.textContent = '';
        }
      }
    }

    /**
     * Set click-through mode status
     * @param {boolean} enabled - Whether click-through is enabled
     */
    setClickThroughStatus(enabled) {
      if (enabled) {
        this.status.textContent = 'Click-through ON';
        this.status.classList.add('click-through');
      } else {
        this.status.textContent = '';
        this.status.classList.remove('click-through');
      }
    }

    /**
     * Display a custom status message
     * @param {string} message - The message to display
     * @param {number} duration - How long to show (0 = permanent)
     */
    showStatus(message, duration = 0) {
      this.status.textContent = message;
      
      if (duration > 0) {
        setTimeout(() => {
          if (this.status.textContent === message) {
            this.status.textContent = '';
          }
        }, duration);
      }
    }
  }

  // Expose to global scope
  global.UIControls = UIControls;

})(window);
