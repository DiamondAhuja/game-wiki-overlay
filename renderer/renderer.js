/**
 * Game Wiki Overlay - Renderer Main
 * 
 * This file serves as the application orchestrator, initializing all modules
 * and wiring them together. It follows the Dependency Inversion principle by
 * depending on abstractions (module interfaces) rather than implementations.
 * 
 * Module Dependencies (all loaded via script tags before this file):
 * - WikiManager: Wiki selection and webview management
 * - NavigationManager: History tracking and back/forward navigation
 * - UIControls: Window controls (resize, opacity, close)
 * - GamepadCursor: Virtual cursor with magnetic snapping
 * - OSKManager: On-screen keyboard for gamepad text input
 * 
 * @requires wikis-config.js (WIKIS global)
 * @requires modules/wiki-manager.js (WikiManager class)
 * @requires modules/navigation-manager.js (NavigationManager class)
 * @requires modules/ui-controls.js (UIControls class)
 * @requires modules/gamepad-cursor.js (GamepadCursor class)
 * @requires modules/osk-manager.js (OSKManager class)
 */

(function() {
  'use strict';

  // ============================================================
  // DOM Element References
  // ============================================================
  const elements = {
    wiki: document.getElementById('wiki'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    backBtn: document.getElementById('back-btn'),
    forwardBtn: document.getElementById('forward-btn'),
    homeBtn: document.getElementById('home-btn'),
    closeBtn: document.getElementById('close-btn'),
    status: document.getElementById('status'),
    landingPage: document.getElementById('landing-page'),
    wikiUrlInput: document.getElementById('wiki-url-input'),
    goBtn: document.getElementById('go-btn'),
    wikiGrid: document.getElementById('wiki-grid'),
    opacitySlider: document.getElementById('opacity-slider'),
    cursor: document.getElementById('gamepad-cursor'),
    osk: document.getElementById('osk'),
    oskKeys: document.getElementById('osk-keys'),
    oskInputText: document.getElementById('osk-input-text')
  };

  // ============================================================
  // Module Initialization
  // ============================================================

  // Wiki Manager - handles wiki selection and webview
  const wikiManager = new WikiManager({
    wiki: elements.wiki,
    landingPage: elements.landingPage,
    wikiGrid: elements.wikiGrid,
    wikiUrlInput: elements.wikiUrlInput,
    goBtn: elements.goBtn,
    searchInput: elements.searchInput,
    searchBtn: elements.searchBtn
  });

  // Navigation Manager - handles history and back/forward
  const navigationManager = new NavigationManager(elements.wiki, {
    onNavigationComplete: () => {
      uiControls.setLoadingStatus(false);
      // Always refresh elements after navigation, with forced style re-injection
      // This ensures clickable elements are detected on the new page
      setTimeout(() => gamepadCursor.refreshElements(true), CURSOR_CONFIG.NAV_COMPLETE_DELAY_MS);
    }
  });

  // UI Controls - handles window controls
  const uiControls = new UIControls({
    status: elements.status,
    closeBtn: elements.closeBtn,
    opacitySlider: elements.opacitySlider
  });

  // Gamepad Cursor - handles virtual cursor and element highlighting
  const gamepadCursor = new GamepadCursor({
    cursor: elements.cursor,
    wiki: elements.wiki,
    landingPage: elements.landingPage
  });

  // OSK Manager - handles on-screen keyboard
  const oskManager = new OSKManager({
    osk: elements.osk,
    oskKeys: elements.oskKeys,
    oskInputText: elements.oskInputText
  }, {
    onHideCursor: () => gamepadCursor.hide(),
    onShowCursor: () => gamepadCursor.show(),
    onSubmit: (targetInput, value) => {
      // Trigger the appropriate action based on which input was used
      if (targetInput === elements.searchInput) {
        wikiManager.performSearch();
      } else if (targetInput === elements.wikiUrlInput) {
        wikiManager.goToCustomUrl();
      }
    }
  });

  // ============================================================
  // Additional Event Bindings (module interactions)
  // ============================================================

  // Loading state from webview
  elements.wiki.addEventListener('did-start-loading', () => {
    uiControls.setLoadingStatus(true);
  });

  // Navigation buttons
  elements.backBtn.addEventListener('click', () => {
    if (!navigationManager.goBack()) {
      // No history to go back to - show landing page
      showLandingPage();
    }
  });

  elements.forwardBtn.addEventListener('click', () => {
    navigationManager.goForward();
  });

  elements.homeBtn.addEventListener('click', () => {
    showLandingPage();
  });

  // ============================================================
  // Helper Functions
  // ============================================================

  /**
   * Show the landing page and reset state
   */
  function showLandingPage() {
    wikiManager.showLandingPage();
    navigationManager.clearHistory();
    gamepadCursor.reset();
    gamepadCursor.hide();
  }

  // ============================================================
  // Gamepad Input Handling
  // ============================================================

  if (window.electronAPI) {
    // Get config constants
    const CONFIG = window.CURSOR_CONFIG;
    const CURSOR_SPEED = CONFIG.CURSOR_SPEED;

    /**
     * OSK action handlers - maps action names to handler functions
     * @type {Object.<string, Function>}
     */
    const OSK_ACTIONS = {
      'cursor-up': () => oskManager.navigate('up'),
      'cursor-up-fast': () => oskManager.navigate('up'),
      'cursor-down': () => oskManager.navigate('down'),
      'cursor-down-fast': () => oskManager.navigate('down'),
      'cursor-left': () => oskManager.navigate('left'),
      'cursor-left-fast': () => oskManager.navigate('left'),
      'cursor-right': () => oskManager.navigate('right'),
      'cursor-right-fast': () => oskManager.navigate('right'),
      'click': () => oskManager.typeSelected(),      // A - type selected key
      'back': () => oskManager.hide(false),          // B - close keyboard
      'search': () => oskManager.backspace(),        // X - backspace
      'home': () => oskManager.space(),              // Y - space
      'page-up': () => oskManager.switchLayout(),    // LB - switch layout
      'page-down': () => oskManager.switchLayout(),  // RB - switch layout
      'start': () => oskManager.hide(true)           // Start - submit
    };

    /**
     * Gamepad action handlers - maps action names to handler functions
     * @type {Object.<string, Function>}
     */
    const GAMEPAD_ACTIONS = {
      // D-pad navigation
      'cursor-up': () => gamepadCursor.move(0, -CURSOR_SPEED * CONFIG.DPAD_MOVE_MULTIPLIER),
      'cursor-up-fast': () => gamepadCursor.move(0, -CURSOR_SPEED * CONFIG.DPAD_FAST_MULTIPLIER),
      'cursor-down': () => gamepadCursor.move(0, CURSOR_SPEED * CONFIG.DPAD_MOVE_MULTIPLIER),
      'cursor-down-fast': () => gamepadCursor.move(0, CURSOR_SPEED * CONFIG.DPAD_FAST_MULTIPLIER),
      'cursor-left': () => gamepadCursor.move(-CURSOR_SPEED * CONFIG.DPAD_MOVE_MULTIPLIER, 0),
      'cursor-left-fast': () => gamepadCursor.move(-CURSOR_SPEED * CONFIG.DPAD_FAST_MULTIPLIER, 0),
      'cursor-right': () => gamepadCursor.move(CURSOR_SPEED * CONFIG.DPAD_MOVE_MULTIPLIER, 0),
      'cursor-right-fast': () => gamepadCursor.move(CURSOR_SPEED * CONFIG.DPAD_FAST_MULTIPLIER, 0),
      
      // Right stick scrolling
      'scroll-up-analog': () => gamepadCursor.scrollPage(0, -CONFIG.SCROLL_ANALOG_STEP),
      'scroll-down-analog': () => gamepadCursor.scrollPage(0, CONFIG.SCROLL_ANALOG_STEP),
      
      // Page scrolling (LB/RB)
      'page-up': () => gamepadCursor.scrollPage(0, -CONFIG.SCROLL_PAGE_AMOUNT),
      'page-down': () => gamepadCursor.scrollPage(0, CONFIG.SCROLL_PAGE_AMOUNT),
      
      // Click action (A button)
      'click': handleClick,
      
      // Back action (B button)
      'back': () => {
        if (wikiManager.isWikiActive()) {
          if (!navigationManager.goBack()) {
            showLandingPage();
          }
          setTimeout(() => gamepadCursor.refreshElements(), CONFIG.REFRESH_DELAY_MS);
        }
      },
      
      // Home action (Y button)
      'home': showLandingPage,
      
      // Search/keyboard action (X button)
      'search': () => {
        if (wikiManager.isWikiActive() && !elements.searchInput.disabled) {
          gamepadCursor.show();
          oskManager.show(elements.searchInput);
        }
      }
    };

    // Handle gamepad actions
    window.electronAPI.onGamepadAction((action) => {
      // If OSK is visible, route to keyboard actions
      if (oskManager.isVisible()) {
        const handler = OSK_ACTIONS[action];
        if (handler) handler();
        return;
      }

      // Normal gamepad actions
      const handler = GAMEPAD_ACTIONS[action];
      if (handler) handler();
    });

    // Handle analog stick input
    window.electronAPI.onAnalogInput((data) => {
      if (oskManager.isVisible()) {
        oskManager.handleAnalogNavigation(data.dx, data.dy);
        return;
      }

      if (data.dx !== 0 || data.dy !== 0) {
        gamepadCursor.move(data.dx, data.dy);
      }
    });

    // Handle right stick scrolling
    window.electronAPI.onGamepadScroll((data) => {
      if (wikiManager.isWikiActive() && !oskManager.isVisible()) {
        gamepadCursor.scrollWithGamepad(data.scrollY);
      }
    });

    /**
     * Handle click action - special logic for text inputs
     */
    function handleClick() {
      const highlighted = gamepadCursor.getHighlightedElement();

      // Check if clicking a text input - open OSK instead
      if (highlighted && !highlighted.isWebviewElement) {
        const el = highlighted.element;
        if (el.tagName === 'INPUT' && 
            (el.type === 'text' || el.type === 'search' || !el.type) && 
            !el.disabled) {
          oskManager.show(el);
          return;
        }
      }

      gamepadCursor.click();
    }
  }

  // ============================================================
  // Initialization
  // ============================================================

  // Render wiki cards from configuration
  wikiManager.renderWikiCards();

  // Start on landing page
  wikiManager.showLandingPage();

})();
