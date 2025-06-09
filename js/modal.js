// ===============================
//   ADVANCED MODAL SYSTEM & MANAGEMENT
// ===============================

class AnimeModal {
    constructor() {
        this.modalStack = [];
        this.currentModal = null;
        this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        this.lastFocusedElement = null;
        this.isAnimating = false;
        this.scrollPosition = 0;
        this.resizeObserver = null;
        
        this.initializeModal();
        this.bindEvents();
        this.setupAccessibility();
        this.initializeURLSupport();
    }

    // ===============================
    //   INITIALIZATION
    // ===============================

    initializeModal() {
        this.modalOverlay = document.getElementById('animeModal');
        this.modalContent = this.modalOverlay?.querySelector('.modal-content');
        this.modalBody = document.getElementById('modalBody');
        this.modalClose = document.getElementById('modalClose');

        if (!this.modalOverlay) {
            console.error('Modal elements not found');
            return;
        }

        // Add modal attributes for accessibility
        this.modalOverlay.setAttribute('role', 'dialog');
        this.modalOverlay.setAttribute('aria-modal', 'true');
        this.modalOverlay.setAttribute('aria-labelledby', 'modal-title');
        this.modalOverlay.setAttribute('aria-describedby', 'modal-description');

        console.log('Modal system initialized');
    }

    bindEvents() {
        if (!this.modalOverlay) return;

        // Close button click
        if (this.modalClose) {
            this.modalClose.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeModal();
            });
        }

        // Overlay click to close
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.closeModal();
            }
        });

        // Prevent event bubbling on modal content
        if (this.modalContent) {
            this.modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // Browser navigation
        window.addEventListener('popstate', (e) => {
            this.handlePopState(e);
        });

        // Resize handling
        window.addEventListener('resize', UTILS.throttle(() => {
            this.handleResize();
        }, 250));

        // Focus management
        this.modalOverlay.addEventListener('transitionend', (e) => {
            if (e.target === this.modalOverlay) {
                this.handleTransitionEnd();
            }
        });
    }

    setupAccessibility() {
        // Create live region for screen readers
        this.liveRegion = document.createElement('div');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.className = 'sr-only';
        document.body.appendChild(this.liveRegion);

        // Setup resize observer for responsive modal
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.adjustModalSize();
            });
        }
    }

    initializeURLSupport() {
        // Check for modal parameters in URL on page load
        const urlParams = new URLSearchParams(window.location.search);
        const animeId = urlParams.get('anime');
        const source = urlParams.get('source') || 'anilist';

        if (animeId) {
            // Delay to ensure UI is ready
            setTimeout(() => {
                this.openModal(animeId, source, false);
            }, 500);
        }
    }

    // ===============================
    //   MODAL OPERATIONS
    // ===============================

    async openModal(animeId, source = 'anilist', addToHistory = true) {
        if (this.isAnimating) return;

        try {
            this.isAnimating = true;

            // Store current focus
            this.lastFocusedElement = document.activeElement;

            // Prevent body scroll
            this.preventBodyScroll();

            // Add to modal stack
            const modalData = { animeId, source, timestamp: Date.now() };
            this.modalStack.push(modalData);
            this.currentModal = modalData;

            // Update URL if needed
            if (addToHistory) {
                this.updateURL(animeId, source);
            }

            // Show modal overlay
            this.modalOverlay.classList.add('active');
            
            // Announce to screen readers
            this.announceToScreenReader('Opening anime details');

            // Load and display content
            await this.loadModalContent(animeId, source);

            // Setup focus management
            this.setupFocusTrap();

            // Setup resize observer
            if (this.resizeObserver && this.modalContent) {
                this.resizeObserver.observe(this.modalContent);
            }

            // Analytics
            this.trackModalOpen(animeId, source);

        } catch (error) {
            console.error('Error opening modal:', error);
            this.showModalError(error.message);
        } finally {
            this.isAnimating = false;
        }
    }

    closeModal(updateHistory = true) {
        if (this.isAnimating || !this.isModalOpen()) return;

        this.isAnimating = true;

        // Remove from modal stack
        this.modalStack.pop();
        this.currentModal = this.modalStack[this.modalStack.length - 1] || null;

        // Hide modal
        this.modalOverlay.classList.remove('active');

        // Restore body scroll
        this.restoreBodyScroll();

        // Restore focus
        this.restoreFocus();

        // Update URL
        if (updateHistory) {
            this.clearURL();
        }

        // Clean up resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // Announce to screen readers
        this.announceToScreenReader('Closed anime details');

        // Clear modal content after animation
        setTimeout(() => {
            if (this.modalBody) {
                this.modalBody.innerHTML = '';
            }
            this.isAnimating = false;
        }, CONFIG.UI.MODAL_TRANSITION);

        // Analytics
        this.trackModalClose();
    }

    async loadModalContent(animeId, source) {
        if (!this.modalBody) return;

        try {
            // Show loading state
            window.animeUI.showModalLoading(this.modalBody);

            // Fetch anime details
            const animeDetails = await window.animeAPI.getAnimeDetails(animeId, source);

            if (!animeDetails) {
                throw new Error('Failed to load anime details');
            }

            // Render content
            window.animeUI.renderModalContent(this.modalBody, animeDetails);

            // Setup modal-specific events
            this.setupModalEvents();

            // Update modal title for accessibility
            this.updateModalTitle(animeDetails.title.display);

        } catch (error) {
            console.error('Error loading modal content:', error);
            window.animeUI.showModalError(this.modalBody, error.message);
        }
    }

    setupModalEvents() {
        // External link tracking
        const externalLinks = this.modalBody.querySelectorAll('a[target="_blank"]');
        externalLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.trackExternalLink(link.href);
            });
        });

        // Image loading error handling
        const images = this.modalBody.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('error', () => {
                img.src = CONFIG.DEFAULTS.FALLBACK_IMAGE;
            });
        });

        // Streaming platform clicks
        const streamingLinks = this.modalBody.querySelectorAll('.platform-item');
        streamingLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.trackStreamingClick(link.textContent.trim());
            });
        });
    }

    // ===============================
    //   KEYBOARD & FOCUS MANAGEMENT
    // ===============================

    handleKeydown(event) {
        if (!this.isModalOpen()) return;

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                this.closeModal();
                break;

            case 'Tab':
                this.handleTabKey(event);
                break;

            case 'ArrowLeft':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.navigateToPrevious();
                }
                break;

            case 'ArrowRight':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.navigateToNext();
                }
                break;

            case 'F11':
                event.preventDefault();
                this.toggleFullscreen();
                break;
        }
    }

    handleTabKey(event) {
        const focusableElements = this.modalContent.querySelectorAll(this.focusableElements);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }

    setupFocusTrap() {
        // Focus first focusable element
        setTimeout(() => {
            const focusableElements = this.modalContent.querySelectorAll(this.focusableElements);
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            } else {
                this.modalClose?.focus();
            }
        }, 100);
    }

    restoreFocus() {
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
            try {
                this.lastFocusedElement.focus();
            } catch (error) {
                // Element might no longer exist
                console.warn('Could not restore focus:', error);
            }
        }
        this.lastFocusedElement = null;
    }

    // ===============================
    //   SCROLL & RESIZE MANAGEMENT
    // ===============================

    preventBodyScroll() {
        this.scrollPosition = window.pageYOffset;
        document.body.style.cssText = `
            position: fixed;
            top: -${this.scrollPosition}px;
            left: 0;
            right: 0;
            overflow: hidden;
        `;
    }

    restoreBodyScroll() {
        document.body.style.cssText = '';
        window.scrollTo(0, this.scrollPosition);
    }

    handleResize() {
        if (this.isModalOpen()) {
            this.adjustModalSize();
        }
    }

    adjustModalSize() {
        if (!this.modalContent) return;

        const maxHeight = window.innerHeight * 0.9;
        this.modalContent.style.maxHeight = `${maxHeight}px`;

        // Adjust for mobile
        if (window.innerWidth < 768) {
            this.modalContent.style.margin = '1rem';
            this.modalContent.style.maxHeight = `calc(100vh - 2rem)`;
        }
    }

    handleTransitionEnd() {
        if (this.isModalOpen()) {
            // Modal opened
            this.adjustModalSize();
        }
    }

    // ===============================
    //   URL MANAGEMENT
    // ===============================

    updateURL(animeId, source) {
        const url = new URL(window.location);
        url.searchParams.set('anime', animeId);
        url.searchParams.set('source', source);
        
        history.pushState(
            { animeId, source, modal: true },
            '',
            url.toString()
        );
    }

    clearURL() {
        const url = new URL(window.location);
        url.searchParams.delete('anime');
        url.searchParams.delete('source');
        
        history.pushState(
            { modal: false },
            '',
            url.toString()
        );
    }

    handlePopState(event) {
        const state = event.state;
        
        if (state && state.modal === false) {
            // User clicked back, close modal
            this.closeModal(false);
        } else if (state && state.animeId) {
            // User went forward/back to a modal state
            this.openModal(state.animeId, state.source, false);
        }
    }

    // ===============================
    //   NAVIGATION & UTILITIES
    // ===============================

    navigateToPrevious() {
        // Could implement navigation between related anime
        console.log('Navigate to previous anime');
    }

    navigateToNext() {
        // Could implement navigation between related anime
        console.log('Navigate to next anime');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.modalContent.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    }

    isModalOpen() {
        return this.modalOverlay?.classList.contains('active') || false;
    }

    getCurrentAnime() {
        return this.currentModal;
    }

    getModalHistory() {
        return this.modalStack.slice();
    }

    // ===============================
    //   ACCESSIBILITY
    // ===============================

    updateModalTitle(title) {
        const modalTitle = this.modalBody.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.id = 'modal-title';
            this.modalOverlay.setAttribute('aria-labelledby', 'modal-title');
        }

        // Update document title
        document.title = `${title} - AnimeHub`;
    }

    announceToScreenReader(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
            setTimeout(() => {
                this.liveRegion.textContent = '';
            }, 1000);
        }
    }

    // ===============================
    //   ERROR HANDLING
    // ===============================

    showModalError(message) {
        if (this.modalBody) {
            window.animeUI.showModalError(this.modalBody, message);
        }
    }

    // ===============================
    //   ANALYTICS & TRACKING
    // ===============================

    trackModalOpen(animeId, source) {
        // Analytics implementation
        console.log('Modal opened:', { animeId, source, timestamp: Date.now() });
    }

    trackModalClose() {
        const duration = this.currentModal ? 
            Date.now() - this.currentModal.timestamp : 0;
        console.log('Modal closed:', { duration });
    }

    trackExternalLink(url) {
        console.log('External link clicked:', url);
    }

    trackStreamingClick(platform) {
        console.log('Streaming platform clicked:', platform);
    }

    // ===============================
    //   MODAL PRESETS & SHORTCUTS
    // ===============================

    async openQuickModal(animeId, source = 'anilist') {
        // Quick open with minimal animations
        this.modalOverlay.style.transition = 'opacity 0.15s ease';
        await this.openModal(animeId, source);
        this.modalOverlay.style.transition = '';
    }

    async openModalFromCard(cardElement) {
        const animeId = cardElement.dataset.animeId;
        const source = cardElement.dataset.source;
        
        if (animeId && source) {
            await this.openModal(animeId, source);
        }
    }

    // ===============================
    //   MODAL SHARING
    // ===============================

    shareModal() {
        if (!this.currentModal) return;

        const shareData = {
            title: document.title,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(shareData.url).then(() => {
                this.announceToScreenReader('Link copied to clipboard');
            });
        }
    }

    // ===============================
    //   CLEANUP
    // ===============================

    destroy() {
        // Clean up event listeners
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // Remove live region
        if (this.liveRegion && this.liveRegion.parentNode) {
            this.liveRegion.parentNode.removeChild(this.liveRegion);
        }

        // Clear modal stack
        this.modalStack = [];
        this.currentModal = null;

        // Restore body scroll if needed
        if (this.isModalOpen()) {
            this.restoreBodyScroll();
        }
    }

    // ===============================
    //   PUBLIC API
    // ===============================

    // Expose public methods
    open(animeId, source = 'anilist') {
        return this.openModal(animeId, source);
    }

    close() {
        return this.closeModal();
    }

    isOpen() {
        return this.isModalOpen();
    }

    getCurrent() {
        return this.getCurrentAnime();
    }

    share() {
        return this.shareModal();
    }

    // Get modal state for debugging
    getState() {
        return {
            isOpen: this.isModalOpen(),
            isAnimating: this.isAnimating,
            stackSize: this.modalStack.length,
            currentModal: this.currentModal,
            scrollPosition: this.scrollPosition
        };
    }
}

// ===============================
//   MODAL KEYBOARD SHORTCUTS
// ===============================

class ModalShortcuts {
    constructor(modalInstance) {
        this.modal = modalInstance;
        this.setupShortcuts();
    }

    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere if user is typing
            if (this.isTyping(e.target)) return;

            // Modal shortcuts (only when modal is open)
            if (this.modal.isOpen()) {
                this.handleModalShortcuts(e);
            }
        });
    }

    handleModalShortcuts(event) {
        // Ctrl/Cmd + Enter - Share modal
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            this.modal.share();
        }

        // Ctrl/Cmd + D - Close modal
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            this.modal.close();
        }

        // Space - Scroll down in modal
        if (event.key === ' ' && !event.shiftKey) {
            event.preventDefault();
            this.scrollModalContent(200);
        }

        // Shift + Space - Scroll up in modal
        if (event.key === ' ' && event.shiftKey) {
            event.preventDefault();
            this.scrollModalContent(-200);
        }
    }

    scrollModalContent(amount) {
        const modalBody = this.modal.modalBody;
        if (modalBody) {
            modalBody.scrollTop += amount;
        }
    }

    isTyping(element) {
        const tagName = element.tagName.toLowerCase();
        return tagName === 'input' || 
               tagName === 'textarea' || 
               element.contentEditable === 'true';
    }
}

// ===============================
//   INITIALIZE MODAL SYSTEM
// ===============================

// Create global modal instance
window.animeModal = new AnimeModal();
window.modalShortcuts = new ModalShortcuts(window.animeModal);

// Integrate with existing UI system
if (window.animeUI) {
    // Override the UI modal method to use advanced modal system
    window.animeUI.openAnimeModal = (animeId, source) => {
        return window.animeModal.open(animeId, source);
    };

    window.animeUI.closeModal = () => {
        return window.animeModal.close();
    };
}

console.log('Advanced Modal System initialized', {
    accessibility: true,
    keyboardNavigation: true,
    urlSupport: true,
    focusManagement: true,
    shortcuts: true
});