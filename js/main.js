// ===============================
//   APPLICATION INITIALIZATION & MANAGEMENT
// ===============================

class AnimeHubApp {
    constructor() {
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        this.components = {};
        this.performanceMetrics = {};
        this.appState = {
            currentPage: 'home',
            loading: false,
            error: null,
            lastUpdated: null
        };
        
        this.initializationPromise = this.initialize();
    }

    // ===============================
    //   APP INITIALIZATION
    // ===============================

    async initialize() {
        try {
            console.log('🚀 Initializing AnimeHub...');
            
            // Wait for DOM to be fully ready
            await this.waitForDOM();
            console.log('✅ DOM ready');
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            console.log('✅ Performance monitoring started');
            
            // Setup error handling
            this.setupGlobalErrorHandling();
            console.log('✅ Error handling setup');
            
            // Check browser compatibility
            this.checkBrowserCompatibility();
            console.log('✅ Browser compatibility checked');
            
            // Setup network monitoring
            this.setupNetworkMonitoring();
            console.log('✅ Network monitoring setup');
            
            // Wait a bit for all scripts to load
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Initialize components with detailed error checking
            await this.initializeComponentsWithErrorChecking();
            console.log('✅ Components initialized');
            
            // Setup app lifecycle events
            this.setupAppLifecycle();
            console.log('✅ App lifecycle setup');
            
            // Load initial content (non-blocking)
            this.loadInitialContentAsync();
            console.log('✅ Initial content loading started');
            
            // Setup service worker (if available)
            this.setupServiceWorker();
            console.log('✅ Service worker setup');
            
            // Finalize initialization
            this.finalizeInitialization();
            console.log('✅ AnimeHub initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize AnimeHub:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            this.handleInitializationError(error);
        }
    }

    async waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    startPerformanceMonitoring() {
        this.performanceMetrics.startTime = performance.now();
        
        // Monitor load times
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'navigation') {
                            this.performanceMetrics.pageLoad = entry.loadEventEnd - entry.loadEventStart;
                        }
                    }
                });
                observer.observe({ entryTypes: ['navigation'] });
            } catch (error) {
                console.warn('Performance observer setup failed:', error);
            }
        }
    }

    setupGlobalErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error, 'JavaScript Error');
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason, 'Unhandled Promise Rejection');
            event.preventDefault(); // Prevent console error
        });
        
        // API error handler
        this.setupAPIErrorHandler();
    }

    setupAPIErrorHandler() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    this.handleAPIError(response, args[0]);
                }
                return response;
            } catch (error) {
                this.handleNetworkError(error, args[0]);
                throw error;
            }
        };
    }

    checkBrowserCompatibility() {
        const requiredFeatures = [
            'fetch',
            'Promise'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => {
            return !(feature in window);
        });
        
        if (missingFeatures.length > 0) {
            console.warn('Missing browser features:', missingFeatures);
            this.showCompatibilityWarning(missingFeatures);
        }
    }

    setupNetworkMonitoring() {
        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleNetworkChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleNetworkChange(false);
        });
    }

    // ===============================
    //   COMPONENT INITIALIZATION
    // ===============================

    async initializeComponentsWithErrorChecking() {
        console.log('🔧 Initializing components with error checking...');
        
        // Check if all required globals exist
        const requiredGlobals = ['CONFIG', 'UTILS', 'ERROR_MESSAGES', 'GRAPHQL_QUERIES'];
        for (const global of requiredGlobals) {
            if (!window[global]) {
                throw new Error(`Missing global: ${global}. Check if config.js loaded properly.`);
            }
        }
        console.log('✅ All global configs loaded');
        
        // Wait for components to be available
        await this.waitForComponents();
        console.log('✅ All components available');
        
        // Verify all components are loaded
        this.verifyComponents();
        console.log('✅ Components verified');
        
        // Initialize UI animations (simplified)
        this.initializeBasicAnimations();
        console.log('✅ Basic animations initialized');
        
        // Setup navigation
        this.setupBasicNavigation();
        console.log('✅ Basic navigation setup');
        
        // Initialize basic UI enhancements
        this.initializeBasicUIEnhancements();
        console.log('✅ Basic UI enhancements initialized');
    }

    async waitForComponents() {
        const maxAttempts = 50; // 5 seconds
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const componentsReady = [
                'animeAPI',
                'animeUI', 
                'animeSearch',
                'animeModal'
            ].every(component => window[component]);
            
            if (componentsReady) {
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Log which components are missing
        const missing = ['animeAPI', 'animeUI', 'animeSearch', 'animeModal']
            .filter(component => !window[component]);
        
        throw new Error(`Components not loaded after 5 seconds: ${missing.join(', ')}`);
    }

    verifyComponents() {
        const requiredComponents = [
            'animeAPI',
            'animeUI', 
            'animeSearch',
            'animeModal'
        ];
        
        const missingComponents = requiredComponents.filter(component => 
            !window[component]
        );
        
        if (missingComponents.length > 0) {
            throw new Error(`Missing components: ${missingComponents.join(', ')}`);
        }
        
        this.components = {
            api: window.animeAPI,
            ui: window.animeUI,
            search: window.animeSearch,
            modal: window.animeModal
        };
    }

    // ===============================
    //   SIMPLIFIED COMPONENT INITIALIZATION
    // ===============================

    initializeBasicAnimations() {
        try {
            // Add entrance animations to existing elements (simplified)
            const elementsToAnimate = document.querySelectorAll(
                '.navbar, .hero, .section-header'
            );
            
            elementsToAnimate.forEach((element, index) => {
                if (element) {
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        element.style.transition = 'all 0.6s ease';
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    }, index * 100);
                }
            });
        } catch (error) {
            console.warn('Non-critical: Animation setup failed:', error);
        }
    }

    setupBasicNavigation() {
        try {
            // Setup navigation links (simplified)
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                if (link) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Update active state
                        document.querySelectorAll('.nav-link').forEach(nl => nl.classList.remove('active'));
                        link.classList.add('active');
                    });
                }
            });
        } catch (error) {
            console.warn('Non-critical: Navigation setup failed:', error);
        }
    }

    initializeBasicUIEnhancements() {
        try {
            // Setup keyboard navigation (simplified)
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    document.body.classList.add('keyboard-navigation');
                }
            });
            
            document.addEventListener('mousedown', () => {
                document.body.classList.remove('keyboard-navigation');
            });
        } catch (error) {
            console.warn('Non-critical: UI enhancements setup failed:', error);
        }
    }

    // ===============================
    //   CONTENT LOADING (SIMPLIFIED)
    // ===============================

    async loadInitialContentAsync() {
        // Load content asynchronously without blocking initialization
        try {
            setTimeout(async () => {
                await this.loadInitialContent();
            }, 500);
        } catch (error) {
            console.warn('Non-critical: Failed to load initial content:', error);
        }
    }

    async loadInitialContent() {
        console.log('📄 Loading initial content...');
        
        try {
            // Show loading state
            this.setAppState({ loading: true });
            
            // Get content containers
            const containers = {
                trending: document.getElementById('trendingGrid'),
                topRated: document.getElementById('topRatedGrid'),
                newReleases: document.getElementById('newReleasesGrid')
            };
            
            // Show skeleton loaders
            Object.values(containers).forEach(container => {
                if (container && this.components.ui) {
                    this.components.ui.renderSkeletonCards(container);
                }
            });
            
            // Load content in parallel with staggered timing for better UX
            const promises = [
                this.loadTrendingContent(containers.trending),
                this.loadTopRatedContent(containers.topRated),
                this.loadNewReleasesContent(containers.newReleases)
            ];
            
            await Promise.allSettled(promises);
            
            // Update app state
            this.setAppState({ 
                loading: false, 
                lastUpdated: new Date().toISOString() 
            });
            
            console.log('✅ Initial content loaded');
            
        } catch (error) {
            console.error('❌ Failed to load initial content:', error);
            this.handleContentLoadError(error);
        }
    }

    async loadTrendingContent(container) {
        if (!container || !this.components.api || !this.components.ui) return;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 200)); // Stagger loading
            const trending = await this.components.api.getTrending();
            
            if (trending && trending.length > 0) {
                this.components.ui.renderAnimeGrid(container, trending);
                this.trackContentLoad('trending', trending.length);
            } else {
                this.components.ui.showEmptyState(container, 'No trending anime found');
            }
        } catch (error) {
            console.error('Error loading trending content:', error);
            if (this.components.ui) {
                this.components.ui.showError(
                    container, 
                    'Failed to load trending anime',
                    () => this.loadTrendingContent(container)
                );
            }
        }
    }

    async loadTopRatedContent(container) {
        if (!container || !this.components.api || !this.components.ui) return;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 400)); // Stagger loading
            const topRated = await this.components.api.getTopRated();
            
            if (topRated && topRated.length > 0) {
                this.components.ui.renderAnimeGrid(container, topRated);
                this.trackContentLoad('topRated', topRated.length);
            } else {
                this.components.ui.showEmptyState(container, 'No top rated anime found');
            }
        } catch (error) {
            console.error('Error loading top rated content:', error);
            if (this.components.ui) {
                this.components.ui.showError(
                    container,
                    'Failed to load top rated anime',
                    () => this.loadTopRatedContent(container)
                );
            }
        }
    }

    async loadNewReleasesContent(container) {
        if (!container || !this.components.api || !this.components.ui) return;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 600)); // Stagger loading
            const newReleases = await this.components.api.getNewReleases();
            
            if (newReleases && newReleases.length > 0) {
                this.components.ui.renderAnimeGrid(container, newReleases);
                this.trackContentLoad('newReleases', newReleases.length);
            } else {
                this.components.ui.showEmptyState(container, 'No new releases found');
            }
        } catch (error) {
            console.error('Error loading new releases content:', error);
            if (this.components.ui) {
                this.components.ui.showError(
                    container,
                    'Failed to load new releases',
                    () => this.loadNewReleasesContent(container)
                );
            }
        }
    }

    // ===============================
    //   APP LIFECYCLE
    // ===============================

    setupAppLifecycle() {
        try {
            // Page visibility API
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.handleAppResume();
                } else {
                    this.handleAppPause();
                }
            });
            
            // Before unload
            window.addEventListener('beforeunload', () => {
                this.handleAppUnload();
            });
            
            // Page load complete
            window.addEventListener('load', () => {
                this.handlePageLoadComplete();
            });
        } catch (error) {
            console.warn('App lifecycle setup failed:', error);
        }
    }

    handleAppResume() {
        console.log('📱 App resumed');
        if (this.appState.lastUpdated) {
            const lastUpdate = new Date(this.appState.lastUpdated);
            const now = new Date();
            const timeDiff = now - lastUpdate;
            
            if (timeDiff > 30 * 60 * 1000) { // 30 minutes
                this.refreshContent();
            }
        }
    }

    handleAppPause() {
        console.log('⏸️ App paused');
        this.savePendingData();
    }

    handleAppUnload() {
        console.log('👋 App unloading');
        this.finalCleanup();
    }

    handlePageLoadComplete() {
        this.calculatePerformanceMetrics();
        
        if (this.components.ui && this.components.ui.hideLoadingSpinner) {
            this.components.ui.hideLoadingSpinner();
        }
        
        this.isInitialized = true;
        this.announceAppReady();
    }

    // ===============================
    //   ERROR HANDLING
    // ===============================

    handleGlobalError(error, type) {
        console.error(`Global ${type}:`, error);
        this.trackError(error, type);
    }

    handleAPIError(response, url) {
        console.warn('API Error:', response.status, url);
        
        if (response.status === 429) {
            this.showRateLimitWarning();
        } else if (response.status >= 500) {
            this.showServerErrorWarning();
        }
    }

    handleNetworkError(error, url) {
        console.error('Network Error:', error, url);
        
        if (!this.isOnline) {
            this.showOfflineMessage();
        }
    }

    handleInitializationError(error) {
        console.error('🚨 CRITICAL ERROR - SHOWING FALLBACK UI');
        console.error('Error details:', error);
        
        // Show detailed error for debugging
        const errorDetails = `
            Error: ${error.message}
            
            Debugging info:
            - CONFIG loaded: ${!!window.CONFIG}
            - UTILS loaded: ${!!window.UTILS}
            - animeAPI loaded: ${!!window.animeAPI}
            - animeUI loaded: ${!!window.animeUI}
            - animeSearch loaded: ${!!window.animeSearch}
            - animeModal loaded: ${!!window.animeModal}
            - Document ready: ${document.readyState}
            - Online: ${navigator.onLine}
            
            Stack trace: ${error.stack}
        `;
        
        // Critical error - show fallback UI with debugging info
        document.body.innerHTML = `
            <div style="
                min-height: 100vh;
                background: #0a0a0f;
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                padding: 2rem;
            ">
                <div style="
                    max-width: 600px;
                    text-align: center;
                    background: #1e1e2a;
                    padding: 3rem;
                    border-radius: 1rem;
                    border: 1px solid rgba(255,255,255,0.1);
                ">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                    <h1 style="margin-bottom: 1rem; color: #ef4444;">AnimeHub Loading Error</h1>
                    <p style="margin-bottom: 2rem; color: #b4b4b8;">
                        We're having trouble starting AnimeHub.
                    </p>
                    
                    <button onclick="window.location.reload()" style="
                        padding: 0.75rem 1.5rem;
                        background: #6366f1;
                        color: white;
                        border: none;
                        border-radius: 0.5rem;
                        cursor: pointer;
                        font-weight: 600;
                        margin-right: 1rem;
                    ">
                        🔄 Refresh Page
                    </button>
                    
                    <details style="
                        margin-top: 2rem;
                        text-align: left;
                        background: #111827;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        border: 1px solid #374151;
                    ">
                        <summary style="cursor: pointer; color: #f59e0b; margin-bottom: 1rem;">Technical Details</summary>
                        <pre style="
                            font-size: 0.875rem;
                            color: #d1d5db;
                            white-space: pre-wrap;
                            word-break: break-word;
                        ">${errorDetails}</pre>
                    </details>
                </div>
            </div>
        `;
    }

    handleContentLoadError(error) {
        this.setAppState({ loading: false, error: error.message });
    }

    // ===============================
    //   UTILITIES & HELPERS
    // ===============================

    setAppState(newState) {
        this.appState = { ...this.appState, ...newState };
        console.log('📊 App state updated:', this.appState);
    }

    handleNetworkChange(isOnline) {
        if (isOnline) {
            this.showOnlineMessage();
            this.refreshContent();
        } else {
            this.showOfflineMessage();
        }
    }

    async refreshContent() {
        console.log('🔄 Refreshing content...');
        
        if (this.components.api && this.components.api.clearCache) {
            this.components.api.clearCache();
        }
        
        await this.loadInitialContent();
    }

    savePendingData() {
        // Save search history and other user data
        // Already handled by individual components
    }

    finalCleanup() {
        if (this.components.modal && this.components.modal.destroy) {
            this.components.modal.destroy();
        }
    }

    calculatePerformanceMetrics() {
        this.performanceMetrics.endTime = performance.now();
        this.performanceMetrics.totalTime = 
            this.performanceMetrics.endTime - this.performanceMetrics.startTime;
        
        console.log('⚡ Performance metrics:', this.performanceMetrics);
    }

    announceAppReady() {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = 'AnimeHub loaded. Start exploring anime ratings.';
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (announcement.parentNode) {
                document.body.removeChild(announcement);
            }
        }, 3000);
    }

    finalizeInitialization() {
        this.isInitialized = true;
        this.calculatePerformanceMetrics();
        this.announceAppReady();
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    // ===============================
    //   USER NOTIFICATIONS
    // ===============================

    showRateLimitWarning() {
        console.log('⚠️ Rate limit warning shown');
    }

    showServerErrorWarning() {
        console.log('⚠️ Server error warning shown');
    }

    showOfflineMessage() {
        console.log('📱 Offline message shown');
    }

    showOnlineMessage() {
        console.log('🌐 Online message shown');
    }

    showCompatibilityWarning(missingFeatures) {
        console.warn('⚠️ Browser compatibility warning:', missingFeatures);
    }

    // ===============================
    //   ANALYTICS & TRACKING
    // ===============================

    trackError(error, type) {
        console.log('📊 Error tracked:', { error: error.message, type, timestamp: Date.now() });
    }

    trackContentLoad(section, count) {
        console.log('📊 Content loaded:', { section, count, timestamp: Date.now() });
    }

    // ===============================
    //   PUBLIC API
    // ===============================

    async ready() {
        return this.initializationPromise;
    }

    getState() {
        return {
            ...this.appState,
            isInitialized: this.isInitialized,
            isOnline: this.isOnline,
            components: Object.keys(this.components),
            performance: this.performanceMetrics
        };
    }

    refresh() {
        return this.refreshContent();
    }

    clearData() {
        try {
            if (this.components.api && this.components.api.clearCache) {
                this.components.api.clearCache();
            }
            if (this.components.search && this.components.search.clearSearchHistory) {
                this.components.search.clearSearchHistory();
            }
            localStorage.clear();
        } catch (error) {
            console.warn('Error clearing data:', error);
        }
    }
}

// ===============================
//   INITIALIZE APPLICATION
// ===============================

// Simple loading check before app initialization
function checkScriptsLoaded() {
    const requiredScripts = ['CONFIG', 'UTILS', 'animeAPI', 'animeUI', 'animeSearch', 'animeModal'];
    const missing = requiredScripts.filter(script => !window[script]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required scripts:', missing);
        return false;
    }
    
    console.log('✅ All required scripts loaded');
    return true;
}

// Initialize with retry mechanism
async function initializeWithRetry() {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            console.log(`🚀 Initialization attempt ${retries + 1}/${maxRetries}`);
            
            // Check if scripts are loaded
            if (!checkScriptsLoaded()) {
                if (retries < maxRetries - 1) {
                    console.log('⏳ Waiting for scripts to load...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    retries++;
                    continue;
                } else {
                    throw new Error('Required scripts failed to load after multiple attempts');
                }
            }
            
            // Create and initialize app
            window.animeHubApp = new AnimeHubApp();
            await window.animeHubApp.ready();
            
            console.log('🎉 AnimeHub initialized successfully!');
            return;
            
        } catch (error) {
            console.error(`❌ Initialization attempt ${retries + 1} failed:`, error);
            retries++;
            
            if (retries >= maxRetries) {
                console.error('❌ All initialization attempts failed');
                showFailureMessage(error);
                return;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

function showFailureMessage(error) {
    document.body.innerHTML = `
        <div style="
            min-height: 100vh;
            background: #0a0a0f;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            padding: 2rem;
        ">
            <div style="
                max-width: 500px;
                text-align: center;
                background: #1e1e2a;
                padding: 3rem;
                border-radius: 1rem;
                border: 1px solid rgba(255,255,255,0.1);
            ">
                <div style="font-size: 4rem; margin-bottom: 1rem;">😵</div>
                <h1 style="margin-bottom: 1rem; color: #ef4444;">Initialization Failed</h1>
                <p style="margin-bottom: 2rem; color: #b4b4b8;">
                    AnimeHub couldn't start. This might be due to network issues or browser compatibility.
                </p>
                
                <button onclick="window.location.reload()" style="
                    padding: 0.75rem 1.5rem;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-weight: 600;
                    margin-right: 1rem;
                ">
                    🔄 Try Again
                </button>
            </div>
        </div>
    `;
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWithRetry);
} else {
    // DOM already loaded, start immediately
    initializeWithRetry();
}

// Global error boundary
window.addEventListener('error', (event) => {
    console.error('🚨 Unhandled error:', event.error);
    console.error('📍 Error location:', event.filename, 'line', event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});

// Export for debugging
console.log('🏗️ AnimeHub Application Manager loaded', {
    version: '1.0.0',
    build: 'debug',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    onLine: navigator.onLine
});