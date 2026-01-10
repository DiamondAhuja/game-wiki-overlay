/**
 * Gamepad Cursor Module
 * 
 * Handles the virtual gamepad cursor with magnetic snapping,
 * element highlighting, and click dispatching.
 * 
 * Single Responsibility: Cursor movement and visual state
 * 
 * Dependencies:
 * - CURSOR_CONFIG (cursor-config.js)
 * - ElementDetector (element-detector.js)
 * - WebviewBridge (webview-bridge.js)
 */

(function(global) {
  'use strict';

  // Use global config (loaded before this module)
  const CONFIG = global.CURSOR_CONFIG;

  /**
   * GamepadCursor class - manages virtual cursor and element highlighting
   */
  class GamepadCursor {
    /**
     * @param {Object} elements - DOM element references
     * @param {HTMLElement} elements.cursor - The cursor element
     * @param {HTMLElement} elements.wiki - The webview element
     * @param {HTMLElement} elements.landingPage - Landing page container
     */
    constructor(elements) {
      this.cursor = elements.cursor;
      this.wiki = elements.wiki;
      this.landingPage = elements.landingPage;

      // Create sub-modules
      this.elementDetector = new ElementDetector(this.wiki, this.landingPage);
      this.webviewBridge = new WebviewBridge(this.wiki);

      // Cursor state
      this.x = window.innerWidth / 2;
      this.y = window.innerHeight / 2;
      this.visible = false;
      this.hideTimeout = null;

      // Element tracking
      this.currentHighlightedElement = null;
      this.currentHighlightedLocal = null;

      // Periodic refresh
      this.elementRefreshInterval = null;
    }

    /**
     * Show the cursor
     */
    show() {
      this.visible = true;
      this.cursor.classList.add('visible');
      this.cursor.style.left = this.x + 'px';
      this.cursor.style.top = this.y + 'px';
      this._resetHideTimer();
      this._startElementRefresh();
      this.refreshElements();
    }

    /**
     * Hide the cursor
     */
    hide() {
      this.visible = false;
      this.cursor.classList.remove('visible');
      this.cursor.classList.remove('snapped');
      this._clearAllHighlights();
      this.currentHighlightedElement = null;
      this._stopElementRefresh();
    }

    /**
     * Move cursor by delta with magnetic snapping
     * @param {number} dx - X delta
     * @param {number} dy - Y delta
     */
    move(dx, dy) {
      this.show();

      // Apply manual movement
      this.x += dx;
      this.y += dy;

      // Apply magnetic attraction toward nearest element
      const nearest = this._findNearestElement();
      if (nearest) {
        const distToNearest = Math.hypot(this.x - nearest.centerX, this.y - nearest.centerY);

        // Only apply attraction if within snap radius
        if (distToNearest < CONFIG.SNAP_RADIUS && distToNearest > 0) {
          const dirX = (nearest.centerX - this.x) / distToNearest;
          const dirY = (nearest.centerY - this.y) / distToNearest;

          // Stronger pull when closer
          const attractionForce = CONFIG.SNAP_STRENGTH * (1 - distToNearest / CONFIG.SNAP_RADIUS);
          this.x += dirX * CONFIG.CURSOR_SPEED * attractionForce;
          this.y += dirY * CONFIG.CURSOR_SPEED * attractionForce;
        }
      }

      // Clamp to window bounds
      this.x = Math.max(10, Math.min(window.innerWidth - 10, this.x));
      this.y = Math.max(10, Math.min(window.innerHeight - 10, this.y));

      this._updatePosition();
      this._resetHideTimer();
    }

    /**
     * Click the currently highlighted element
     * @returns {Object|null} Info about what was clicked
     */
    click() {
      if (!this.currentHighlightedElement) {
        return null;
      }

      this.show();

      // Visual feedback
      this.cursor.classList.add('clicking');
      setTimeout(() => this.cursor.classList.remove('clicking'), CONFIG.CLICK_FEEDBACK_MS);

      const element = this.currentHighlightedElement;

      if (element.isWebviewElement) {
        // Click webview element using bridge
        this.webviewBridge.clickElement(element.webviewIndex);

        // Refresh after navigation with forced style re-injection
        // The page content may change, so we need to re-inject highlight styles
        setTimeout(() => {
          this.currentHighlightedElement = null;
          this.refreshElements(true);
        }, CONFIG.REFRESH_DELAY_MS);

        return { type: 'webview', element: null };
      } else {
        // Click local element
        const el = element.element;

        if (el.tagName === 'INPUT') {
          el.focus();
          return { type: 'input', element: el };
        } else {
          el.click();
          return { type: 'local', element: el };
        }
      }
    }

    /**
     * Get the currently highlighted element
     * @returns {Object|null}
     */
    getHighlightedElement() {
      return this.currentHighlightedElement;
    }

    /**
     * Clear all state (for when going back to landing page)
     */
    reset() {
      this.currentHighlightedElement = null;
      this._clearAllHighlights();
      this.elementDetector.reset();
    }

    /**
     * Scroll the page
     * @param {number} deltaX - Horizontal scroll amount
     * @param {number} deltaY - Vertical scroll amount
     */
    scrollPage(deltaX, deltaY) {
      if (this.webviewBridge.isActive()) {
        this.webviewBridge.scroll(deltaX, deltaY);
        setTimeout(() => this.refreshElements(), CONFIG.CLICK_FEEDBACK_MS);
      } else {
        this.landingPage.scrollBy(deltaX, deltaY);
        setTimeout(() => this.refreshElements(), CONFIG.CLICK_FEEDBACK_MS);
      }
    }

    /**
     * Scroll with gamepad (right stick)
     * @param {number} scrollX - Horizontal scroll delta
     * @param {number} scrollY - Vertical scroll delta
     */
    scrollWithGamepad(scrollX, scrollY) {
      if (this.webviewBridge.isActive()) {
        const scrollAmountX = Math.round(scrollX * CONFIG.SCROLL_SPEED * 5);
        const scrollAmountY = Math.round(scrollY * CONFIG.SCROLL_SPEED * 5);
        if (scrollAmountX !== 0 || scrollAmountY !== 0) {
          this.webviewBridge.scroll(scrollAmountX, scrollAmountY);
        }
      }
    }

    /**
     * Refresh the list of clickable elements
     * @param {boolean} [forceStyleReinject=false] - Force re-injection of highlight styles
     */
    refreshElements(forceStyleReinject = false) {
      if (forceStyleReinject) {
        this.elementDetector.resetHighlightStyles();
      }
      this.elementDetector.refresh(() => {
        if (this.visible) {
          this._updatePosition();
        }
      });
    }

    /**
     * Reset hide timer
     * @private
     */
    _resetHideTimer() {
      if (this.hideTimeout) clearTimeout(this.hideTimeout);
      this.hideTimeout = setTimeout(() => this.hide(), CONFIG.CURSOR_HIDE_DELAY);
    }

    /**
     * Update cursor position and highlighting
     * @private
     */
    _updatePosition() {
      this.cursor.style.left = this.x + 'px';
      this.cursor.style.top = this.y + 'px';

      const nearest = this._findNearestElement();
      if (nearest && nearest !== this.currentHighlightedElement) {
        this._highlightElement(nearest);
        this.currentHighlightedElement = nearest;
        this.cursor.classList.add('snapped');
      } else if (!nearest) {
        this._clearAllHighlights();
        this.currentHighlightedElement = null;
        this.cursor.classList.remove('snapped');
      }
    }

    /**
     * Find the nearest clickable element to cursor
     * @private
     * @returns {Object|null}
     */
    _findNearestElement() {
      return this.elementDetector.findNearest(this.x, this.y, CONFIG.SNAP_RADIUS);
    }

    /**
     * Clear all highlights (local and webview)
     * @private
     */
    _clearAllHighlights() {
      // Clear local
      if (this.currentHighlightedLocal) {
        this.currentHighlightedLocal.classList.remove('gamepad-selected');
        this.currentHighlightedLocal = null;
      }

      // Clear webview
      this.webviewBridge.clearHighlights();
    }

    /**
     * Highlight an element
     * @private
     * @param {Object} elementInfo - Element info object
     */
    _highlightElement(elementInfo) {
      this._clearAllHighlights();

      if (!elementInfo) return;

      if (elementInfo.isWebviewElement) {
        this.webviewBridge.highlightElement(elementInfo.webviewIndex);
      } else {
        elementInfo.element.classList.add('gamepad-selected');
        this.currentHighlightedLocal = elementInfo.element;
      }
    }

    /**
     * Start periodic element refresh
     * @private
     */
    _startElementRefresh() {
      if (this.elementRefreshInterval) clearInterval(this.elementRefreshInterval);
      this.elementRefreshInterval = setInterval(() => {
        if (this.visible) {
          this.refreshElements();
        }
      }, CONFIG.ELEMENT_REFRESH_RATE);
    }

    /**
     * Stop periodic element refresh
     * @private
     */
    _stopElementRefresh() {
      if (this.elementRefreshInterval) {
        clearInterval(this.elementRefreshInterval);
        this.elementRefreshInterval = null;
      }
    }

    /**
     * Get configuration constants
     * @returns {Object}
     */
    static getConfig() {
      return { ...CONFIG };
    }
  }

  // Expose to global scope
  global.GamepadCursor = GamepadCursor;

})(window);
