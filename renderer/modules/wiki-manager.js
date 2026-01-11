/**
 * Wiki Manager Module
 *
 * Handles wiki selection, rendering wiki cards, custom URL navigation,
 * and managing the wiki webview state.
 *
 * Single Responsibility: All wiki-related state and operations
 *
 * @requires WIKIS - Global array from wikis-config.js
 */

(function(global) {
  'use strict';

  /**
   * WikiManager class - manages wiki selection and webview state
   */
  class WikiManager {
    /**
     * @param {Object} elements - DOM element references
     * @param {HTMLElement} elements.wiki - The webview element
     * @param {HTMLElement} elements.landingPage - Landing page container
     * @param {HTMLElement} elements.wikiGrid - Container for wiki cards
     * @param {HTMLElement} elements.wikiUrlInput - Custom URL input
     * @param {HTMLElement} elements.goBtn - Go button for custom URL
     * @param {HTMLElement} elements.searchInput - Search input in toolbar
     * @param {HTMLElement} elements.searchBtn - Search button in toolbar
     */
    constructor(elements) {
      this.wiki = elements.wiki;
      this.landingPage = elements.landingPage;
      this.wikiGrid = elements.wikiGrid;
      this.wikiUrlInput = elements.wikiUrlInput;
      this.goBtn = elements.goBtn;
      this.searchInput = elements.searchInput;
      this.searchBtn = elements.searchBtn;

      // Current wiki configuration
      this.config = {
        baseUrl: '',
        searchUrl: '',
      };

      // Callback for when wiki state changes
      this.onWikiNavigated = null;

      this._bindEvents();
    }

    /**
     * Bind internal event listeners
     * @private
     */
    _bindEvents() {
      this.goBtn.addEventListener('click', () => this.goToCustomUrl());

      this.wikiUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.goToCustomUrl();
        }
      });

      this.searchBtn.addEventListener('click', () => this.performSearch());

      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });

      // Prevent new windows - open in same webview
      this.wiki.addEventListener('new-window', (e) => {
        e.preventDefault();
        if (e.url) {
          this.wiki.src = e.url;
        }
      });
    }

    /**
     * Render wiki cards from the global WIKIS configuration
     */
    renderWikiCards() {
      this.wikiGrid.innerHTML = '';

      if (typeof WIKIS === 'undefined' || !Array.isArray(WIKIS)) {
        console.error('WIKIS configuration not found');
        return;
      }

      WIKIS.forEach(wikiData => {
        const card = document.createElement('button');
        card.className = 'wiki-card';
        card.type = 'button';
        card.setAttribute('role', 'listitem');
        card.dataset.url = wikiData.url;
        card.dataset.search = wikiData.search;
        card.setAttribute('aria-label', `Open ${wikiData.name} wiki`);

        card.innerHTML = `
          <span class="wiki-icon" aria-hidden="true">${wikiData.icon}</span>
          <span class="wiki-name">${wikiData.name}</span>
        `;

        card.addEventListener('click', () => {
          this.showWiki(wikiData.url, wikiData.search);
        });

        this.wikiGrid.appendChild(card);
      });
    }

    /**
     * Show the landing page, hide the webview
     */
    showLandingPage() {
      this.landingPage.classList.remove('hidden');
      this.wiki.classList.remove('active');
      this.wiki.src = 'about:blank';
      this.searchInput.value = '';
      this.searchInput.placeholder = 'Select a wiki first...';
      this.searchInput.disabled = true;
      this.searchBtn.disabled = true;

      this.config = { baseUrl: '', searchUrl: '' };
    }

    /**
     * Show a wiki in the webview
     * @param {string} baseUrl - The wiki's base URL
     * @param {string} searchUrl - The wiki's search URL pattern
     */
    showWiki(baseUrl, searchUrl) {
      this.config.baseUrl = baseUrl;
      this.config.searchUrl = searchUrl || baseUrl + '/wiki/Special:Search?search=';

      this.landingPage.classList.add('hidden');
      this.wiki.classList.add('active');
      this.wiki.src = baseUrl;
      this.searchInput.disabled = false;
      this.searchInput.placeholder = 'Search wiki...';
      this.searchBtn.disabled = false;
    }

    /**
     * Navigate to a custom URL entered by the user
     */
    goToCustomUrl() {
      let url = this.wikiUrlInput.value.trim();
      if (url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        this.showWiki(url, url + '/wiki/Special:Search?search=');
      }
    }

    /**
     * Perform a search on the current wiki
     */
    performSearch() {
      const query = this.searchInput.value.trim();
      if (query && this.config.searchUrl) {
        this.wiki.src = this.config.searchUrl + encodeURIComponent(query);
      }
    }

    /**
     * Check if the webview is currently active (showing a wiki)
     * @returns {boolean}
     */
    isWikiActive() {
      return this.wiki.classList.contains('active');
    }

    /**
     * Get the current wiki configuration
     * @returns {Object} config with baseUrl and searchUrl
     */
    getConfig() {
      return { ...this.config };
    }
  }

  // Expose to global scope
  global.WikiManager = WikiManager;

})(window);
