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

    startPerformanceMonitoring() {
        this.performanceMetrics.startTime = performance.now();
        
        // Monitor load times
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'navigation') {
                        this.performanceMetrics.pageLoad = entry.loadEventEnd - entry.loadEventStart;
                    }
                }
            });
            observer.observe({ entryTypes: ['navigation'] });
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
            'Promise',
            'IntersectionObserver',
            'ResizeObserver'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => {
            return !(feature in window) && !(feature in window.constructor.prototype);
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
        
        // Connection quality monitoring
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.monitorConnectionQuality(connection);
        }
    }

    // ===============================
    //   COMPONENT INITIALIZATION
    // ===============================

    async initializeComponents() {
        console.log('🔧 Initializing components...');
        
        // Verify all components are loaded
        this.verifyComponents();
        
        // Initialize UI animations
        this.initializeAnimations();
        
        // Setup navigation
        this.setupNavigation();
        
        // Initialize tooltips and other UI enhancements
        this.initializeUIEnhancements();
        
        // Setup theme management
        this.setupThemeManagement();
        
        console.log('✅ Components initialized');
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

    initializeAnimations() {
        // Add entrance animations to existing elements
        const elementsToAnimate = document.querySelectorAll(
            '.navbar, .hero, .section-header'
        );
        
        elementsToAnimate.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
        // Setup intersection observer for scroll animations
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        const scrollElements = document.querySelectorAll(
            '.section-header, .anime-card, .footer-section'
        );
        
        scrollElements.forEach(element => {
            element.classList.add('scroll-reveal');
            if (this.components.ui.intersectionObserver) {
                this.components.ui.observeElement(element);
            }
        });
    }

    setupNavigation() {
        // Setup navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.handleNavigation(e, link);
            });
        });
        
        // Setup smooth scrolling
        this.setupSmoothScrolling();
        
        // Setup scroll to top
        this.setupScrollToTop();
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupScrollToTop() {
        // Create scroll to top button
        const scrollButton = document.createElement('button');
        scrollButton.className = 'scroll-to-top';
        scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollButton.setAttribute('aria-label', 'Scroll to top');
        document.body.appendChild(scrollButton);
        
        // Show/hide on scroll
        window.addEventListener('scroll', UTILS.throttle(() => {
            if (window.pageYOffset > 500) {
                scrollButton.classList.add('visible');
            } else {
                scrollButton.classList.remove('visible');
            }
        }, 100));
        
        // Click handler
        scrollButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    initializeUIEnhancements() {
        // Initialize lazy loading for images
        this.setupLazyLoading();
        
        // Setup tooltips
        this.setupTooltips();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        // Setup focus indicators
        this.setupFocusIndicators();
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            
            // Observe images with data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    setupTooltips() {
        // Simple tooltip implementation
        document.addEventListener('mouseover', (e) => {
            if (e.target.hasAttribute('data-tooltip')) {
                this.showTooltip(e.target, e.target.getAttribute('data-tooltip'));
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.hasAttribute('data-tooltip')) {
                this.hideTooltip();
            }
        });
    }

    setupKeyboardNavigation() {
        // Skip link for accessibility
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Tab navigation indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    setupFocusIndicators() {
        // Enhanced focus styles for interactive elements
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-navigation *:focus {
                outline: 2px solid var(--accent-primary) !important;
                outline-offset: 2px !important;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: var(--accent-primary);
                color: white;
                padding: 8px;
                border-radius: 4px;
                text-decoration: none;
                z-index: 9999;
                transition: top 0.3s;
            }
            
            .skip-link:focus {
                top: 6px;
            }
            
            .scroll-to-top {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                width: 50px;
                height: 50px;
                background: var(--accent-primary);
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transform: scale(0.8);
                transition: all 0.3s ease;
                z-index: 1000;
                box-shadow: var(--shadow-medium);
            }
            
            .scroll-to-top.visible {
                opacity: 1;
                visibility: visible;
                transform: scale(1);
            }
            
            .scroll-to-top:hover {
                background: var(--accent-secondary);
                transform: scale(1.1);
                box-shadow: var(--shadow-large);
            }
        `;
        document.head.appendChild(style);
    }

    setupThemeManagement() {
        // Respect user's color scheme preference
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            this.handleThemeChange(mediaQuery);
            mediaQuery.addListener(this.handleThemeChange.bind(this));
        }
    }

    // ===============================
    //   CONTENT LOADING
    // ===============================

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
                if (container) {
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
        if (!container) return;
        
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
            this.components.ui.showError(
                container, 
                'Failed to load trending anime',
                () => this.loadTrendingContent(container)
            );
        }
    }

    async loadTopRatedContent(container) {
        if (!container) return;
        
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
            this.components.ui.showError(
                container,
                'Failed to load top rated anime',
                () => this.loadTopRatedContent(container)
            );
        }
    }

    async loadNewReleasesContent(container) {
        if (!container) return;
        
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
            this.components.ui.showError(
                container,
                'Failed to load new releases',
                () => this.loadNewReleasesContent(container)
            );
        }
    }

    // ===============================
    //   APP LIFECYCLE
    // ===============================

    setupAppLifecycle() {
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
    }

    handleAppResume() {
        console.log('📱 App resumed');
        // Refresh data if it's been a while
        const lastUpdate = new Date(this.appState.lastUpdated);
        const now = new Date();
        const timeDiff = now - lastUpdate;
        
        if (timeDiff > 30 * 60 * 1000) { // 30 minutes
            this.refreshContent();
        }
    }

    handleAppPause() {
        console.log('⏸️ App paused');
        // Save any pending data
        this.savePendingData();
    }

    handleAppUnload() {
        console.log('👋 App unloading');
        // Final cleanup and analytics
        this.finalCleanup();
    }

    handlePageLoadComplete() {
        // Calculate and log performance metrics
        this.calculatePerformanceMetrics();
        
        // Hide any remaining loading states
        this.components.ui.hideLoadingSpinner();
        
        // Mark as fully initialized
        this.isInitialized = true;
        
        // Announce to screen readers
        this.announceAppReady();
    }

    // ===============================
    //   ERROR HANDLING
    // ===============================

    handleGlobalError(error, type) {
        console.error(`Global ${type}:`, error);
        
        // Track error for analytics
        this.trackError(error, type);
        
        // Don't overwhelm user with too many error notifications
        if (this.shouldShowErrorToUser(error, type)) {
            this.showUserError(error, type);
        }
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
        // Critical error - show fallback UI
        document.body.innerHTML = `
            <div class="error-page">
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h1>Something went wrong</h1>
                    <p>We're having trouble loading AnimeHub. Please try refreshing the page.</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        <i class="fas fa-redo"></i>
                        Refresh Page
                    </button>
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

    handleNavigation(event, link) {
        event.preventDefault();
        const href = link.getAttribute('href');
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        link.classList.add('active');
        
        // Handle navigation
        if (href.startsWith('#')) {
            this.scrollToSection(href.substring(1));
        }
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    handleNetworkChange(isOnline) {
        if (isOnline) {
            this.showOnlineMessage();
            this.refreshContent();
        } else {
            this.showOfflineMessage();
        }
    }

    handleThemeChange(mediaQuery) {
        // Could implement light/dark theme switching
        console.log('Theme preference:', mediaQuery.matches ? 'light' : 'dark');
    }

    async refreshContent() {
        console.log('🔄 Refreshing content...');
        
        // Clear API cache
        this.components.api.clearCache();
        
        // Reload content
        await this.loadInitialContent();
    }

    savePendingData() {
        // Save search history and other user data
        // Already handled by individual components
    }

    finalCleanup() {
        // Clean up any remaining resources
        if (this.components.modal) {
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
        // Create announcement for screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = 'AnimeHub loaded. Start exploring anime ratings.';
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 3000);
    }

    // ===============================
    //   USER NOTIFICATIONS
    // ===============================

    showUserError(error, type) {
        // Could implement toast notifications
        console.log('Showing user error:', error, type);
    }

    showRateLimitWarning() {
        console.log('Rate limit warning shown');
    }

    showServerErrorWarning() {
        console.log('Server error warning shown');
    }

    showOfflineMessage() {
        console.log('Offline message shown');
    }

    showOnlineMessage() {
        console.log('Online message shown');
    }

    showCompatibilityWarning(missingFeatures) {
        console.warn('Browser compatibility warning:', missingFeatures);
    }

    // ===============================
    //   ANALYTICS & TRACKING
    // ===============================

    trackError(error, type) {
        console.log('Error tracked:', { error: error.message, type, timestamp: Date.now() });
    }

    trackContentLoad(section, count) {
        console.log('Content loaded:', { section, count, timestamp: Date.now() });
    }

    shouldShowErrorToUser(error, type) {
        // Logic to prevent error spam
        return true; // Simplified for now
    }

    monitorConnectionQuality(connection) {
        console.log('Connection quality:', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
        });
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

    showTooltip(element, text) {
        // Simple tooltip implementation
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
    }

    hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // ===============================
    //   PUBLIC API
    // ===============================

    // Expose public methods
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
        // Clear all app data
        this.components.api.clearCache();
        this.components.search.clearSearchHistory();
        localStorage.clear();
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
                    AnimeHub couldn't start. This might be due to:
                </p>
                
                <ul style="text-align: left; color: #b4b4b8; line-height: 1.8; margin-bottom: 2rem;">
                    <li>🌐 Network connection issues</li>
                    <li>🚫 Browser blocking JavaScript files</li>
                    <li>📱 Browser compatibility issues</li>
                    <li>🔒 Security settings blocking content</li>
                </ul>
                
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
                
                <button onclick="console.log('Error details:', ${JSON.stringify(error.message)})" style="
                    padding: 0.75rem 1.5rem;
                    background: #374151;
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-weight: 600;
                ">
                    🔍 Check Console
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