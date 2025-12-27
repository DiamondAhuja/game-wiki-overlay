import { searchWiki, fetchPage, setCurrentWiki, getCurrentWiki } from './wikiService.js';

const wikiSelect = document.getElementById('wikiSelect');
const input = document.getElementById('searchInput');
const content = document.getElementById('content');

let currentResults = null;
let isLoadingChunks = false;
let navigationHistory = []; // Track page history for back navigation

// Handle wiki selection
wikiSelect.addEventListener('change', (e) => {
    setCurrentWiki(e.target.value);
    const wiki = getCurrentWiki();
    input.placeholder = `Search ${wiki.name} wiki...`;
    content.innerHTML = `<p>Now searching <strong>${wiki.name}</strong> wiki!</p>`;
    input.value = '';
    input.focus();
    navigationHistory = []; // Clear history when changing wikis
});

// Handle search
input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter' || !input.value.trim()) return;
    
    const query = input.value.trim();
    const wiki = getCurrentWiki();
    content.innerHTML = `<div class="loading">🔍 Searching ${wiki.name} for: <strong>${query}</strong></div>`;
    
    try {
        const results = await searchWiki(query);

        if (!results || results.length === 0 || results[1].length === 0) {
            content.innerHTML = '<p>❌ No results found.</p>';
            return;
        }

        currentResults = results;
        navigationHistory = []; // Clear history on new search
        renderResults(results);
    } catch (error) {
        content.innerHTML = `<p>❌ Error: ${error.message}</p>`;
        console.error('Search error:', error);
    }
});

function renderResults(results) {
    content.innerHTML = '';
    
    // Add back button if there's history
    if (navigationHistory.length > 0) {
        addBackButton();
    }
    
    const resultsHeader = document.createElement('h3');
    resultsHeader.textContent = 'Search Results:';
    content.appendChild(resultsHeader);

    const titles = results[1];
    const descriptions = results[2];
    
    titles.forEach((title, index) => {
        const link = document.createElement('a');
        link.className = 'search-result';
        link.href = '#';
        link.innerHTML = `<strong>${escapeHtml(title)}</strong>`;
        if (descriptions[index]) {
            link.innerHTML += `<small>${escapeHtml(descriptions[index])}</small>`;
        }
        
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            await loadPage(title);
        });
        
        content.appendChild(link);
    });
}

async function loadPage(title) {
    content.innerHTML = `<div class="loading">📄 Loading: <strong>${escapeHtml(title)}</strong></div>`;
    
    try {
        const pageData = await fetchPage(title);
        
        // Add current state to history before loading new page
        navigationHistory.push({
            type: 'page',
            title: title,
            html: pageData.html
        });
        
        renderPage(title, pageData.html);
    } catch (error) {
        content.innerHTML = `<p>❌ Error loading page: ${error.message}</p>`;
        console.error('Page load error:', error);
    }
}

function addBackButton() {
    const backBtn = document.createElement('div');
    backBtn.className = 'back-button';
    backBtn.innerHTML = '← Back';
    backBtn.addEventListener('click', () => {
        goBack();
    });
    content.insertBefore(backBtn, content.firstChild);
}

function goBack() {
    if (navigationHistory.length === 0) {
        // No history, go back to search results
        if (currentResults) {
            renderResults(currentResults);
        }
        return;
    }
    
    // Remove current page from history
    navigationHistory.pop();
    
    if (navigationHistory.length === 0) {
        // Back to search results
        if (currentResults) {
            renderResults(currentResults);
        }
    } else {
        // Go to previous page
        const previousPage = navigationHistory[navigationHistory.length - 1];
        navigationHistory.pop(); // Remove it so loadPage can add it back
        
        // Re-render the previous page without adding to history again
        content.innerHTML = `<div class="loading">Loading previous page...</div>`;
        setTimeout(() => {
            renderPage(previousPage.title, previousPage.html, true);
        }, 100);
    }
}

function renderPage(title, html, skipHistoryAdd = false) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Clean up unwanted elements but keep tables and images
    const unwantedSelectors = [
        '.mw-editsection',
        '.mw-cite-backlink',
        '.reference',
        '.noprint',
        'script',
        'style',
        '.navbox',
        '.ambox',
        '.hatnote'
    ];
    
    unwantedSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // Style images for better display with lazy loading
    doc.querySelectorAll('img').forEach((img) => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '6px';
        img.style.margin = '10px 0';
        img.style.display = 'block';
        img.loading = 'lazy'; // Enable lazy loading
        
        const wiki = getCurrentWiki();
        const baseUrl = wiki.api.replace('/api.php', '');
        
        // Fix src attribute
        let src = img.getAttribute('src');
        if (src) {
            if (src.startsWith('//')) {
                src = 'https:' + src;
                img.setAttribute('src', src);
            } else if (src.startsWith('/') && !src.startsWith('//')) {
                src = baseUrl + src;
                img.setAttribute('src', src);
            }
            // For images from data: URIs or already valid https: URLs, leave them as-is
        }
        
        // Fix srcset attribute for responsive images
        const srcset = img.getAttribute('srcset');
        if (srcset) {
            const fixedSrcset = srcset.split(',').map(entry => {
                const parts = entry.trim().split(' ');
                let url = parts[0];
                if (url.startsWith('//')) {
                    url = 'https:' + url;
                } else if (url.startsWith('/') && !url.startsWith('//')) {
                    url = baseUrl + url;
                }
                return parts.length > 1 ? `${url} ${parts[1]}` : url;
            }).join(', ');
            img.setAttribute('srcset', fixedSrcset);
        }
        
        // Fix data-src for lazy-loaded images
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
            let fixedDataSrc = dataSrc;
            if (dataSrc.startsWith('//')) {
                fixedDataSrc = 'https:' + dataSrc;
                img.setAttribute('data-src', fixedDataSrc);
                if (!src) img.setAttribute('src', fixedDataSrc);
            } else if (dataSrc.startsWith('/') && !dataSrc.startsWith('//')) {
                fixedDataSrc = baseUrl + dataSrc;
                img.setAttribute('data-src', fixedDataSrc);
                if (!src) img.setAttribute('src', fixedDataSrc);
            }
        }
        
        // Remove any opacity or filter styles that might be inherited from parent links
        img.style.opacity = '1';
        img.style.filter = 'none';
        
        // Add error handling for failed images
        img.addEventListener('error', function() {
            console.log('Failed to load image:', this.src);
            // Try alternative if available
            const dataSrc = this.getAttribute('data-src');
            if (dataSrc && dataSrc !== this.src) {
                console.log('Trying alternative source:', dataSrc);
                this.src = dataSrc;
            } else {
                this.style.display = 'none';
            }
        });
        
        // Success logging
        img.addEventListener('load', function() {
            console.log('Successfully loaded image:', this.src);
        });
    });
    
    // Style tables for better display in overlay
    doc.querySelectorAll('table').forEach((table) => {
        table.style.width = '100%';
        table.style.maxWidth = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.margin = '16px 0';
        table.style.fontSize = '13px';
        table.style.background = 'rgba(40, 40, 60, 0.4)';
        table.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        table.style.borderRadius = '6px';
        table.style.overflow = 'hidden';
        
        // Style table cells
        table.querySelectorAll('td, th').forEach(cell => {
            cell.style.padding = '8px';
            cell.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            cell.style.color = '#d0d0d0';
        });
        
        // Style headers
        table.querySelectorAll('th').forEach(th => {
            th.style.background = 'rgba(100, 150, 255, 0.2)';
            th.style.fontWeight = '600';
            th.style.color = '#e0e0e0';
        });
    });
    
    // Create page content
    content.innerHTML = '';
    addBackButton();
    
    const titleEl = document.createElement('h1');
    titleEl.className = 'page-title';
    titleEl.textContent = title;
    content.appendChild(titleEl);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'wiki-content';
    content.appendChild(contentDiv);
    
    // Render content in chunks for smooth scrolling
    renderContentInChunks(doc.body, contentDiv);
}

function renderContentInChunks(sourceElement, targetElement) {
    const children = Array.from(sourceElement.children);
    const chunkSize = 3; // Render 3 elements at a time for better performance
    let currentIndex = 0;
    let isRendering = false;
    
    function renderChunk() {
        if (currentIndex >= children.length || isRendering) {
            return;
        }
        
        isRendering = true;
        const endIndex = Math.min(currentIndex + chunkSize, children.length);
        const fragment = document.createDocumentFragment();
        
        for (let i = currentIndex; i < endIndex; i++) {
            const clonedNode = children[i].cloneNode(true);
            
            // Process links to enable internal wiki navigation
            clonedNode.querySelectorAll('a').forEach(link => {
                const href = link.getAttribute('href');
                
                // Check if link wraps an image
                const hasImage = link.querySelector('img') !== null;
                
                if (href && (href.startsWith('/wiki/') || href.startsWith('./') || href.startsWith('../'))) {
                    link.style.cursor = 'pointer';
                    if (!hasImage) {
                        link.style.color = '#6db3ff';
                    }
                    link.addEventListener('click', async (e) => {
                        e.preventDefault();
                        let pageTitle = href.replace('/wiki/', '').replace('./', '').replace('../', '');
                        pageTitle = decodeURIComponent(pageTitle.split('#')[0].replace(/_/g, ' '));
                        if (pageTitle) {
                            await loadPage(pageTitle);
                        }
                    });
                } else if (href && (href.startsWith('http') || href.startsWith('//'))) {
                    // For image links, just prevent navigation
                    if (hasImage) {
                        link.style.cursor = 'default';
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                        });
                        // Ensure images in links display properly
                        const imgs = link.querySelectorAll('img');
                        imgs.forEach(img => {
                            img.style.opacity = '1';
                            img.style.filter = 'none';
                        });
                    } else {
                        // For text links, show disabled state
                        link.style.opacity = '0.6';
                        link.title = 'External link - disabled in overlay';
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                        });
                    }
                }
            });
            
            fragment.appendChild(clonedNode);
        }
        
        targetElement.appendChild(fragment);
        currentIndex = endIndex;
        isRendering = false;
        
        // Schedule next chunk if needed
        if (currentIndex < children.length) {
            requestAnimationFrame(() => {
                setTimeout(renderChunk, 50); // Delay for smooth UI
            });
        }
    }
    
    // Load more content when scrolling near bottom
    let scrollTimeout;
    content.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollPosition = content.scrollTop + content.clientHeight;
            const scrollThreshold = content.scrollHeight - 300;
            
            if (scrollPosition > scrollThreshold && currentIndex < children.length && !isRendering) {
                renderChunk();
            }
        }, 100);
    });
    
    // Initial render - load first few chunks immediately
    renderChunk();
    setTimeout(() => {
        if (currentIndex < children.length) renderChunk();
    }, 100);
    setTimeout(() => {
        if (currentIndex < children.length) renderChunk();
    }, 200);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}