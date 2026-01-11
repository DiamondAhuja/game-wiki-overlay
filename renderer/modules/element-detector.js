/**
 * Element Detector Module
 *
 * Handles detection and tracking of clickable elements in both
 * local DOM and webview content.
 *
 * Single Responsibility: Finding and tracking interactive elements
 */

(function(global) {
  'use strict';

  /**
   * @typedef {Object} ClickableElement
   * @property {HTMLElement} element - The DOM element
   * @property {number} centerX - Center X coordinate
   * @property {number} centerY - Center Y coordinate
   * @property {number} left - Left boundary
   * @property {number} right - Right boundary
   * @property {number} top - Top boundary
   * @property {number} bottom - Bottom boundary
   * @property {boolean} isWebviewElement - Whether element is inside webview
   * @property {number} [webviewIndex] - Index in webview's __gamepadClickables array
   */

  /**
   * ElementDetector class - finds and tracks clickable elements
   */
  class ElementDetector {
    /**
     * @param {HTMLElement} wiki - The webview element
     * @param {HTMLElement} landingPage - Landing page container
     */
    constructor(wiki, landingPage) {
      this.wiki = wiki;
      this.landingPage = landingPage;

      /** @type {ClickableElement[]} */
      this.allClickableElements = [];

      this.highlightStyleInjected = false;
    }

    /**
     * Get all currently tracked clickable elements
     * @returns {ClickableElement[]}
     */
    getElements() {
      return this.allClickableElements;
    }

    /**
     * Get local (non-webview) clickable elements
     * @returns {ClickableElement[]}
     */
    getLocalClickableElements() {
      const isInWebview = this.wiki.classList.contains('active');
      const toolbarHeight = 36;
      const elements = [];

      // Toolbar elements
      const toolbarClickables = document.querySelectorAll('#toolbar button, #search-input');
      toolbarClickables.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          elements.push({
            element: el,
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            isWebviewElement: false,
          });
        }
      });

      if (!isInWebview) {
        // Landing page elements
        const landingClickables = document.querySelectorAll('.wiki-card, #go-btn, #wiki-url-input');
        landingClickables.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && rect.top > toolbarHeight) {
            elements.push({
              element: el,
              centerX: rect.left + rect.width / 2,
              centerY: rect.top + rect.height / 2,
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
              isWebviewElement: false,
            });
          }
        });
      }

      return elements;
    }

    /**
     * Refresh the list of clickable elements
     * @param {Function} [onComplete] - Called when refresh completes
     */
    refresh(onComplete) {
      const localElements = this.getLocalClickableElements();

      if (this.wiki.classList.contains('active')) {
        // Preserve existing webview elements while fetching new ones
        const existingWebviewElements = this.allClickableElements.filter(el => el.isWebviewElement);
        const webviewRect = this.wiki.getBoundingClientRect();

        // Inject styles if needed
        if (!this.highlightStyleInjected) {
          this._injectHighlightStyles();
          this.highlightStyleInjected = true;
        }

        this.wiki.executeJavaScript(`
          (function() {
            const clickables = document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [onclick], [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])');
            const results = [];
            const viewWidth = window.innerWidth;
            const viewHeight = window.innerHeight;
            
            window.__gamepadClickables = [];
            
            for (let i = 0; i < clickables.length; i++) {
              const el = clickables[i];
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              
              if (rect.width >= 4 && rect.height >= 4 &&
                  rect.right > 0 && rect.left < viewWidth &&
                  rect.bottom > 0 && rect.top < viewHeight &&
                  style.visibility !== 'hidden' && 
                  style.display !== 'none' &&
                  parseFloat(style.opacity) > 0.1) {
                window.__gamepadClickables.push(el);
                results.push({
                  left: rect.left,
                  top: rect.top,
                  right: rect.right,
                  bottom: rect.bottom,
                  width: rect.width,
                  height: rect.height,
                  index: window.__gamepadClickables.length - 1
                });
              }
              
              if (results.length >= 500) break;
            }
            return results;
          })()
        `).then(results => {
          const webviewElements = results.map(r => ({
            element: this.wiki,
            centerX: webviewRect.left + r.left + r.width / 2,
            centerY: webviewRect.top + r.top + r.height / 2,
            left: webviewRect.left + r.left,
            right: webviewRect.left + r.right,
            top: webviewRect.top + r.top,
            bottom: webviewRect.top + r.bottom,
            isWebviewElement: true,
            webviewIndex: r.index,
          }));

          this.allClickableElements = localElements.concat(webviewElements);

          if (onComplete) onComplete();
        }).catch(() => {
          this.allClickableElements = localElements.concat(existingWebviewElements);
          if (onComplete) onComplete();
        });
      } else {
        this.allClickableElements = localElements;
        if (onComplete) onComplete();
      }
    }

    /**
     * Find the nearest clickable element to a position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} snapRadius - Maximum snap distance
     * @returns {ClickableElement|null}
     */
    findNearest(x, y, snapRadius) {
      if (this.allClickableElements.length === 0) return null;

      let nearest = null;
      let nearestDist = snapRadius;

      for (const el of this.allClickableElements) {
        // Check if cursor is inside element bounds
        if (x >= el.left && x <= el.right &&
            y >= el.top && y <= el.bottom) {
          return el;
        }

        // Calculate distance to element center
        const dist = Math.hypot(x - el.centerX, y - el.centerY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = el;
        }
      }

      return nearest;
    }

    /**
     * Reset state (for when going back to landing page)
     */
    reset() {
      this.allClickableElements = [];
      this.highlightStyleInjected = false;
    }

    /**
     * Reset highlight style injection flag (for when page navigates)
     * This forces styles to be re-injected on next refresh
     */
    resetHighlightStyles() {
      this.highlightStyleInjected = false;
    }

    /**
     * Inject highlight styles into webview
     * @private
     */
    _injectHighlightStyles() {
      this.wiki.executeJavaScript(`
        (function() {
          if (!document.getElementById('gamepad-nav-styles')) {
            const style = document.createElement('style');
            style.id = 'gamepad-nav-styles';
            style.textContent = \`
              .gamepad-selected {
                outline: 3px solid #2196F3 !important;
                outline-offset: 3px !important;
                box-shadow: 0 0 20px rgba(33, 150, 243, 0.7), inset 0 0 10px rgba(33, 150, 243, 0.2) !important;
                background-color: rgba(33, 150, 243, 0.1) !important;
                transition: all 0.15s ease-out !important;
                position: relative;
                z-index: 1000;
              }
            \`;
            document.head.appendChild(style);
          }
        })()
      `).catch(() => {});
    }
  }

  // Expose to global scope
  global.ElementDetector = ElementDetector;

})(window);
