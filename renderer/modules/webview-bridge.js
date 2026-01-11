/**
 * Webview Bridge Module
 *
 * Handles communication with webview content, including
 * element highlighting and click dispatching.
 *
 * Single Responsibility: Webview script injection and interaction
 */

(function(global) {
  'use strict';

  /**
   * WebviewBridge class - manages webview interactions
   */
  class WebviewBridge {
    /**
     * @param {HTMLElement} wiki - The webview element
     */
    constructor(wiki) {
      this.wiki = wiki;
    }

    /**
     * Check if webview is currently active
     * @returns {boolean}
     */
    isActive() {
      return this.wiki.classList.contains('active');
    }

    /**
     * Highlight an element in the webview
     * @param {number} webviewIndex - Index in __gamepadClickables array
     */
    highlightElement(webviewIndex) {
      this.wiki.executeJavaScript(`
        (function() {
          if (window.__gamepadClickables && window.__gamepadClickables[${webviewIndex}]) {
            window.__gamepadClickables[${webviewIndex}].classList.add('gamepad-selected');
          }
        })()
      `).catch(() => {});
    }

    /**
     * Clear all highlights in the webview
     */
    clearHighlights() {
      if (!this.isActive()) return;

      this.wiki.executeJavaScript(`
        (function() {
          const highlighted = document.querySelector('.gamepad-selected');
          if (highlighted) highlighted.classList.remove('gamepad-selected');
        })()
      `).catch(() => {});
    }

    /**
     * Click an element in the webview
     * @param {number} webviewIndex - Index in __gamepadClickables array
     */
    clickElement(webviewIndex) {
      this.wiki.executeJavaScript(`
        (function() {
          if (window.__gamepadClickables && window.__gamepadClickables[${webviewIndex}]) {
            const el = window.__gamepadClickables[${webviewIndex}];
            const link = el.closest('a') || el;
            link.click();
          }
        })()
      `).catch(() => {});
    }

    /**
     * Scroll the webview content
     * @param {number} deltaX - Horizontal scroll amount
     * @param {number} deltaY - Vertical scroll amount
     */
    scroll(deltaX, deltaY) {
      if (!this.isActive()) return;

      this.wiki.executeJavaScript(`window.scrollBy(${deltaX}, ${deltaY})`).catch(() => {});
    }
  }

  // Expose to global scope
  global.WebviewBridge = WebviewBridge;

})(window);
