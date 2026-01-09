/**
 * Navigation Manager Module
 * 
 * Handles browser-like navigation history tracking, back/forward navigation,
 * and navigation state management.
 * 
 * Single Responsibility: Navigation history and state only
 */

(function(global) {
  'use strict';

  /**
   * NavigationManager class - manages navigation history and state
   */
  class NavigationManager {
    /**
     * @param {HTMLElement} wiki - The webview element
     * @param {Object} options - Configuration options
     * @param {Function} options.onNavigationComplete - Called when navigation completes
     */
    constructor(wiki, options = {}) {
      this.wiki = wiki;
      this.options = options;

      // Navigation history tracking
      this.history = [];
      this.currentIndex = -1;

      // Navigation state - prevents rapid navigation
      this.isNavigating = false;
      this.navigationTimeout = null;

      // Track highlight state reset needs
      this.highlightStyleInjected = false;

      this._bindEvents();
    }

    /**
     * Bind webview navigation events
     * @private
     */
    _bindEvents() {
      this.wiki.addEventListener('did-navigate', (e) => this._handleNavigate(e));
      this.wiki.addEventListener('did-navigate-in-page', (e) => this._handleNavigateInPage(e));
      this.wiki.addEventListener('did-start-loading', () => this._handleStartLoading());
      this.wiki.addEventListener('did-stop-loading', () => this._handleStopLoading());
      this.wiki.addEventListener('did-fail-load', (e) => this._handleFailLoad(e));
    }

    /**
     * Handle full page navigation
     * @private
     */
    _handleNavigate(e) {
      if (e.url === 'about:blank') return;

      // Reset highlight state on page change
      this.highlightStyleInjected = false;

      // Trim forward history if we navigated (not via back/forward)
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1);
      }

      // Add to history (avoid duplicates)
      if (this.history[this.history.length - 1] !== e.url) {
        this.history.push(e.url);
        this.currentIndex = this.history.length - 1;
      }
    }

    /**
     * Handle in-page navigation (hash changes, etc.)
     * @private
     */
    _handleNavigateInPage(e) {
      if (e.url === 'about:blank') return;

      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1);
      }

      if (this.history[this.history.length - 1] !== e.url) {
        this.history.push(e.url);
        this.currentIndex = this.history.length - 1;
      }
    }

    /**
     * Handle loading start
     * @private
     */
    _handleStartLoading() {
      this.wiki.classList.add('loading');
    }

    /**
     * Handle loading complete
     * @private
     */
    _handleStopLoading() {
      this.wiki.classList.remove('loading');
      this._setNavigating(false);

      if (this.options.onNavigationComplete) {
        this.options.onNavigationComplete();
      }
    }

    /**
     * Handle load failure
     * @private
     */
    _handleFailLoad(e) {
      this._setNavigating(false);
      
      // Ignore aborted loads (normal when navigating away quickly)
      if (e.errorCode === -3 || e.validatedURL === 'about:blank') {
        return;
      }
      console.log('Load failed:', e.errorDescription, e.validatedURL);
    }

    /**
     * Set navigation state with auto-reset timeout
     * @private
     */
    _setNavigating(state) {
      this.isNavigating = state;

      if (this.navigationTimeout) {
        clearTimeout(this.navigationTimeout);
        this.navigationTimeout = null;
      }

      if (state) {
        // Auto-reset after 2 seconds in case did-stop-loading doesn't fire
        this.navigationTimeout = setTimeout(() => {
          this.isNavigating = false;
        }, 2000);
      }
    }

    /**
     * Navigate back in history
     * @returns {boolean} Whether navigation occurred
     */
    goBack() {
      if (!this.wiki.classList.contains('active')) {
        return false;
      }

      if (this.isNavigating) {
        return false;
      }

      if (this.currentIndex > 0) {
        this._setNavigating(true);
        this.currentIndex--;
        this.wiki.src = this.history[this.currentIndex];
        return true;
      }

      // No history - signal to show landing page
      return false;
    }

    /**
     * Navigate forward in history
     * @returns {boolean} Whether navigation occurred
     */
    goForward() {
      if (!this.wiki.classList.contains('active')) {
        return false;
      }

      if (this.isNavigating) {
        return false;
      }

      if (this.currentIndex < this.history.length - 1) {
        this._setNavigating(true);
        this.currentIndex++;
        this.wiki.src = this.history[this.currentIndex];
        return true;
      }

      return false;
    }

    /**
     * Clear all navigation history
     */
    clearHistory() {
      this.history = [];
      this.currentIndex = -1;
      this.isNavigating = false;
      this.highlightStyleInjected = false;
      
      if (this.navigationTimeout) {
        clearTimeout(this.navigationTimeout);
        this.navigationTimeout = null;
      }
    }

    /**
     * Check if we can go back
     * @returns {boolean}
     */
    canGoBack() {
      return this.currentIndex > 0;
    }

    /**
     * Check if we can go forward
     * @returns {boolean}
     */
    canGoForward() {
      return this.currentIndex < this.history.length - 1;
    }

    /**
     * Check if highlight styles need injection
     * @returns {boolean}
     */
    needsHighlightStyleInjection() {
      return !this.highlightStyleInjected;
    }

    /**
     * Mark highlight styles as injected
     */
    markHighlightStyleInjected() {
      this.highlightStyleInjected = true;
    }
  }

  // Expose to global scope
  global.NavigationManager = NavigationManager;

})(window);
