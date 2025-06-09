// ===============================
//   SEARCH FUNCTIONALITY & LIVE SUGGESTIONS
// ===============================

class AnimeSearch {
    constructor() {
        this.searchHistory = this.loadSearchHistory();
        this.currentQuery = '';
        this.selectedIndex = -1;
        this.isSearching = false;
        this.searchAbortController = null;
        this.suggestionCache = new Map();
        
        // Debounced search function
        this.debouncedSearch = UTILS.debounce(
            this.performSearch.bind(this), 
            CONFIG.SEARCH.DEBOUNCE_DELAY
        );
        
        this.initializeSearchElements();
        this.bindEvents();
        this.loadSearchSuggestions();
    }

    // ===============================
    //   INITIALIZATION
    // ===============================

    initializeSearchElements() {
        // Main search elements
        this.mainSearchInput = document.getElementById('mainSearch');
        this.mainSuggestions = document.getElementById('mainSuggestions');
        
        // Navigation search elements
        this.navSearchInput = document.getElementById('navSearch');
        this.navSuggestions = document.getElementById('navSuggestions');
        
        // Result containers
        this.trendingGrid = document.getElementById('trendingGrid');
        this.topRatedGrid = document.getElementById('topRatedGrid');
        this.newReleasesGrid = document.getElementById('newReleasesGrid');

        // Verify elements exist
        if (!this.mainSearchInput || !this.navSearchInput) {
            console.error('Search elements not found');
            return;
        }

        console.log('Search elements initialized');
    }

    bindEvents() {
        // Main search events
        if (this.mainSearchInput) {
            this.mainSearchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e, 'main');
            });
            
            this.mainSearchInput.addEventListener('keydown', (e) => {
                this.handleKeyDown(e, 'main');
            });
            
            this.mainSearchInput.addEventListener('focus', () => {
                this.handleFocus('main');
            });
            
            this.mainSearchInput.addEventListener('blur', () => {
                setTimeout(() => this.handleBlur('main'), 150);
            });
        }

        // Navigation search events
        if (this.navSearchInput) {
            this.navSearchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e, 'nav');
            });
            
            this.navSearchInput.addEventListener('keydown', (e) => {
                this.handleKeyDown(e, 'nav');
            });
            
            this.navSearchInput.addEventListener('focus', () => {
                this.handleFocus('nav');
            });
            
            this.navSearchInput.addEventListener('blur', () => {
                setTimeout(() => this.handleBlur('nav'), 150);
            });
        }

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });

        // Click outside to close suggestions
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.closeSuggestions('main');
                this.closeSuggestions('nav');
            }
        });
    }

    // ===============================
    //   EVENT HANDLERS
    // ===============================

    handleSearchInput(event, type) {
        const query = event.target.value.trim();
        this.currentQuery = query;

        if (query.length < CONFIG.SEARCH.MIN_QUERY_LENGTH) {
            this.closeSuggestions(type);
            if (query.length === 0) {
                this.showDefaultContent();
            }
            return;
        }

        // Show loading state
        this.showSearchLoading(type);
        
        // Perform debounced search
        this.debouncedSearch(query, type);
    }

    handleKeyDown(event, type) {
        const suggestionsContainer = type === 'main' ? this.mainSuggestions : this.navSuggestions;
        const suggestions = suggestionsContainer?.querySelectorAll('.suggestion-item') || [];

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, suggestions.length - 1);
                this.updateSelection(suggestions);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(suggestions);
                break;
                
            case 'Enter':
                event.preventDefault();
                if (this.selectedIndex >= 0 && suggestions[this.selectedIndex]) {
                    this.selectSuggestion(suggestions[this.selectedIndex]);
                } else if (this.currentQuery) {
                    this.performFullSearch(this.currentQuery);
                }
                break;
                
            case 'Escape':
                this.closeSuggestions(type);
                event.target.blur();
                break;
        }
    }

    handleFocus(type) {
        const input = type === 'main' ? this.mainSearchInput : this.navSearchInput;
        const query = input.value.trim();
        
        if (query.length >= CONFIG.SEARCH.MIN_QUERY_LENGTH) {
            this.showSuggestions(type);
        } else if (query.length === 0) {
            this.showSearchHistory(type);
        }
    }

    handleBlur(type) {
        this.closeSuggestions(type);
        this.selectedIndex = -1;
    }

    handleGlobalKeydown(event) {
        // Ctrl/Cmd + K to focus search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.focusMainSearch();
        }
        
        // Escape to close modal and clear search
        if (event.key === 'Escape') {
            this.clearAllSearches();
        }
    }

    // ===============================
    //   SEARCH OPERATIONS
    // ===============================

    async performSearch(query, type) {
        if (this.isSearching) {
            this.abortCurrentSearch();
        }

        this.isSearching = true;
        this.searchAbortController = new AbortController();

        try {
            // Check cache first
            const cached = this.suggestionCache.get(query.toLowerCase());
            if (cached && UTILS.isCacheValid(cached.timestamp, CONFIG.CACHE.SEARCH_RESULTS)) {
                this.displaySuggestions(cached.data, type);
                return;
            }

            // Perform API search
            const results = await window.animeAPI.search(query, 1);
            
            if (results && results.results) {
                // Cache results
                this.suggestionCache.set(query.toLowerCase(), {
                    data: results.results,
                    timestamp: Date.now()
                });

                this.displaySuggestions(results.results, type);
                this.addToSearchHistory(query);
            } else {
                this.showNoResults(type);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Search error:', error);
                this.showSearchError(type, error.message);
            }
        } finally {
            this.isSearching = false;
            this.searchAbortController = null;
        }
    }

    async performFullSearch(query) {
        try {
            // Hide suggestions
            this.closeSuggestions('main');
            this.closeSuggestions('nav');

            // Show loading state
            window.animeUI.showLoadingSpinner();

            // Clear current grids and show skeleton
            this.clearSearchResults();
            window.animeUI.renderSkeletonCards(this.trendingGrid);

            // Perform search
            const results = await window.animeAPI.search(query, 1);

            if (results && results.results && results.results.length > 0) {
                // Update page title/heading
                this.updateSearchResultsHeading(query, results.results.length);
                
                // Render results
                window.animeUI.renderAnimeGrid(this.trendingGrid, results.results);
                
                // Hide other sections
                this.hideDefaultSections();
                
                // Add to search history
                this.addToSearchHistory(query);
            } else {
                this.showNoSearchResults(query);
            }
        } catch (error) {
            console.error('Full search error:', error);
            this.showSearchError('main', error.message);
        } finally {
            window.animeUI.hideLoadingSpinner();
        }
    }

    abortCurrentSearch() {
        if (this.searchAbortController) {
            this.searchAbortController.abort();
        }
    }

    // ===============================
    //   SUGGESTION DISPLAY
    // ===============================

    displaySuggestions(results, type) {
        const container = type === 'main' ? this.mainSuggestions : this.navSuggestions;
        if (!container) return;

        window.animeUI.renderSearchSuggestions(container, results);
        this.bindSuggestionEvents(container);
    }

    bindSuggestionEvents(container) {
        const suggestions = container.querySelectorAll('.suggestion-item');
        
        suggestions.forEach((suggestion, index) => {
            suggestion.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection(suggestions);
            });
            
            suggestion.addEventListener('click', () => {
                this.selectSuggestion(suggestion);
            });
        });
    }

    selectSuggestion(suggestionElement) {
        const animeId = suggestionElement.dataset.animeId;
        const source = suggestionElement.dataset.source;
        const title = suggestionElement.querySelector('.suggestion-title').textContent;

        // Close suggestions
        this.closeSuggestions('main');
        this.closeSuggestions('nav');

        // Add to search history
        this.addToSearchHistory(title);

        // Open modal
        window.animeUI.openAnimeModal(animeId, source);
    }

    updateSelection(suggestions) {
        suggestions.forEach((suggestion, index) => {
            if (index === this.selectedIndex) {
                suggestion.classList.add('selected');
                suggestion.scrollIntoView({ block: 'nearest' });
            } else {
                suggestion.classList.remove('selected');
            }
        });
    }

    showSuggestions(type) {
        const container = type === 'main' ? this.mainSuggestions : this.navSuggestions;
        if (container && container.children.length > 0) {
            container.classList.add('active');
        }
    }

    closeSuggestions(type) {
        const container = type === 'main' ? this.mainSuggestions : this.navSuggestions;
        if (container) {
            container.classList.remove('active');
        }
        this.selectedIndex = -1;
    }

    // ===============================
    //   SEARCH HISTORY
    // ===============================

    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('animeSearchHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Could not load search history:', error);
            return [];
        }
    }

    saveSearchHistory() {
        try {
            localStorage.setItem('animeSearchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('Could not save search history:', error);
        }
    }

    addToSearchHistory(query) {
        if (!query || query.length < CONFIG.SEARCH.MIN_QUERY_LENGTH) return;

        // Remove existing entry
        this.searchHistory = this.searchHistory.filter(item => 
            item.query.toLowerCase() !== query.toLowerCase()
        );

        // Add to beginning
        this.searchHistory.unshift({
            query: query,
            timestamp: Date.now()
        });

        // Limit history size
        this.searchHistory = this.searchHistory.slice(0, 20);

        this.saveSearchHistory();
    }

    showSearchHistory(type) {
        if (this.searchHistory.length === 0) return;

        const container = type === 'main' ? this.mainSuggestions : this.navSuggestions;
        if (!container) return;

        const historyHTML = this.searchHistory.slice(0, 5).map(item => `
            <div class="suggestion-item history-item" data-query="${item.query}">
                <div class="suggestion-image">
                    <i class="fas fa-history"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${item.query}</div>
                    <div class="suggestion-info">
                        <span>Recent search</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = historyHTML;
        container.classList.add('active');

        // Bind history events
        container.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query;
                this.performFullSearch(query);
            });
        });
    }

    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    // ===============================
    //   LOADING & ERROR STATES
    // ===============================

    showSearchLoading(type) {
        const container = type === 'main' ? this.mainSuggestions : this.navSuggestions;
        if (!container) return;

        container.innerHTML = `
            <div class="suggestion-item loading-item">
                <div class="suggestion-image">
                    <div class="spinner"></div>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">Searching...</div>
                    <div class="suggestion-info">
                        <span>Finding anime</span>
                    </div>
                </div>
            </div>
        `;
        container.classList.add('active');
    }

    showSearchError(type, message) {
        const container = type === 'main' ? this.mainSuggestions : this.navSuggestions;
        if (!container) return;

        container.innerHTML = `
            <div class="suggestion-item error-item">
                <div class="suggestion-image">
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">Search Error</div>
                    <div class="suggestion-info">
                        <span>${message}</span>
                    </div>
                </div>
            </div>
        `;
        container.classList.add('active');
    }

    showNoResults(type) {
        const container = type === 'main' ? this.mainSuggestions : this.navSuggestions;
        if (!container) return;

        container.innerHTML = `
            <div class="suggestion-item no-results-item">
                <div class="suggestion-image">
                    <i class="fas fa-search" style="color: #6b7280;"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">No results found</div>
                    <div class="suggestion-info">
                        <span>Try a different search term</span>
                    </div>
                </div>
            </div>
        `;
        container.classList.add('active');
    }

    // ===============================
    //   SEARCH RESULTS DISPLAY
    // ===============================

    updateSearchResultsHeading(query, resultCount) {
        // Update or create search results heading
        let heading = document.querySelector('.search-results-heading');
        
        if (!heading) {
            heading = document.createElement('div');
            heading.className = 'search-results-heading section-header';
            
            // Insert before trending section
            const trendingSection = document.querySelector('.featured-section');
            if (trendingSection) {
                trendingSection.parentNode.insertBefore(heading, trendingSection);
            }
        }

        heading.innerHTML = `
            <h2 class="section-title">Search Results for "${query}"</h2>
            <p class="section-subtitle">${resultCount} anime found</p>
            <button class="btn btn-secondary clear-search-btn">
                <i class="fas fa-times"></i>
                Clear Search
            </button>
        `;

        // Bind clear search event
        const clearBtn = heading.querySelector('.clear-search-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    showNoSearchResults(query) {
        this.updateSearchResultsHeading(query, 0);
        
        window.animeUI.showEmptyState(
            this.trendingGrid, 
            `No anime found for "${query}"`
        );
        
        this.hideDefaultSections();
    }

    clearSearchResults() {
        const heading = document.querySelector('.search-results-heading');
        if (heading) {
            heading.remove();
        }
    }

    hideDefaultSections() {
        const sections = [
            document.querySelector('.top-rated-section'),
            document.querySelector('.new-releases-section')
        ];

        sections.forEach(section => {
            if (section) {
                section.style.display = 'none';
            }
        });
    }

    showDefaultSections() {
        const sections = [
            document.querySelector('.top-rated-section'),
            document.querySelector('.new-releases-section')
        ];

        sections.forEach(section => {
            if (section) {
                section.style.display = 'block';
            }
        });
    }

    // ===============================
    //   UTILITY METHODS
    // ===============================

    clearSearch() {
        // Clear input fields
        if (this.mainSearchInput) this.mainSearchInput.value = '';
        if (this.navSearchInput) this.navSearchInput.value = '';

        // Close suggestions
        this.closeSuggestions('main');
        this.closeSuggestions('nav');

        // Clear search results
        this.clearSearchResults();

        // Show default content
        this.showDefaultContent();

        // Reset state
        this.currentQuery = '';
        this.selectedIndex = -1;
    }

    clearAllSearches() {
        this.clearSearch();
        window.animeUI.closeModal();
    }

    focusMainSearch() {
        if (this.mainSearchInput) {
            this.mainSearchInput.focus();
        }
    }

    focusNavSearch() {
        if (this.navSearchInput) {
            this.navSearchInput.focus();
        }
    }

    async showDefaultContent() {
        try {
            this.clearSearchResults();
            this.showDefaultSections();

            // Load default content if grids are empty
            if (!this.trendingGrid.children.length) {
                await this.loadDefaultContent();
            }
        } catch (error) {
            console.error('Error loading default content:', error);
        }
    }

    async loadDefaultContent() {
        try {
            window.animeUI.showLoadingSpinner();

            // Load all sections in parallel
            const [trending, topRated, newReleases] = await Promise.all([
                window.animeAPI.getTrending(),
                window.animeAPI.getTopRated(),
                window.animeAPI.getNewReleases()
            ]);

            // Render content
            if (trending && trending.length > 0) {
                window.animeUI.renderAnimeGrid(this.trendingGrid, trending);
            }

            if (topRated && topRated.length > 0) {
                window.animeUI.renderAnimeGrid(this.topRatedGrid, topRated);
            }

            if (newReleases && newReleases.length > 0) {
                window.animeUI.renderAnimeGrid(this.newReleasesGrid, newReleases);
            }

        } catch (error) {
            console.error('Error loading default content:', error);
            // Show error in trending grid
            window.animeUI.showError(
                this.trendingGrid,
                'Failed to load content',
                () => this.loadDefaultContent()
            );
        } finally {
            window.animeUI.hideLoadingSpinner();
        }
    }

    loadSearchSuggestions() {
        // Pre-load popular anime for faster suggestions
        const popularQueries = ['naruto', 'attack on titan', 'one piece', 'demon slayer'];
        
        popularQueries.forEach(query => {
            setTimeout(() => {
                this.performSearch(query, 'preload');
            }, Math.random() * 2000);
        });
    }

    // Get search analytics
    getSearchAnalytics() {
        return {
            historyCount: this.searchHistory.length,
            cacheSize: this.suggestionCache.size,
            currentQuery: this.currentQuery,
            isSearching: this.isSearching
        };
    }

    // Clear cache
    clearSuggestionCache() {
        this.suggestionCache.clear();
    }
}

// ===============================
//   SEARCH KEYBOARD SHORTCUTS
// ===============================

class SearchShortcuts {
    constructor(searchInstance) {
        this.search = searchInstance;
        this.bindShortcuts();
    }

    bindShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Focus search: Ctrl/Cmd + K or just "/"
            if (((e.ctrlKey || e.metaKey) && e.key === 'k') || 
                (e.key === '/' && !this.isInputFocused())) {
                e.preventDefault();
                this.search.focusMainSearch();
            }

            // Clear search: Ctrl/Cmd + L
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                this.search.clearSearch();
            }

            // Search history: Ctrl/Cmd + H
            if ((e.ctrlKey || e.metaKey) && e.key === 'h' && e.shiftKey) {
                e.preventDefault();
                this.showSearchHistoryModal();
            }
        });
    }

    isInputFocused() {
        const active = document.activeElement;
        return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
    }

    showSearchHistoryModal() {
        // Could implement a search history modal
        console.log('Search history:', this.search.searchHistory);
    }
}

// ===============================
//   INITIALIZE SEARCH
// ===============================

// Create global search instance
window.animeSearch = new AnimeSearch();
window.searchShortcuts = new SearchShortcuts(window.animeSearch);

console.log('AnimeSearch initialized', {
    debounceDelay: CONFIG.SEARCH.DEBOUNCE_DELAY,
    minQueryLength: CONFIG.SEARCH.MIN_QUERY_LENGTH,
    maxSuggestions: CONFIG.SEARCH.MAX_SUGGESTIONS,
    keyboardShortcuts: true
});