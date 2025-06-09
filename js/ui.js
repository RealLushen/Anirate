// ===============================
//   UI RENDERING & VISUALIZATION
// ===============================

class AnimeUI {
    constructor() {
        this.animationDelayCounter = 0;
        this.intersectionObserver = null;
        this.initializeScrollAnimations();
    }

    // ===============================
    //   SCROLL ANIMATIONS
    // ===============================

    initializeScrollAnimations() {
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        this.intersectionObserver.unobserve(entry.target);
                    }
                });
            },
            { 
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );
    }

    observeElement(element) {
        if (this.intersectionObserver) {
            this.intersectionObserver.observe(element);
        }
    }

    // ===============================
    //   ANIME CARD RENDERING
    // ===============================

    createAnimeCard(anime, index = 0) {
        const card = document.createElement('div');
        card.className = 'anime-card scroll-reveal gpu-accelerated';
        card.style.animationDelay = `${index * CONFIG.UI.ANIMATION_DELAY}ms`;
        card.dataset.animeId = anime.id;
        card.dataset.source = anime.source;

        // Create image container with lazy loading
        const imageContainer = this.createImageContainer(anime);
        
        // Create card content
        const content = this.createCardContent(anime);

        card.appendChild(imageContainer);
        card.appendChild(content);

        // Add click handler
        card.addEventListener('click', () => {
            this.openAnimeModal(anime.id, anime.source);
        });

        // Add hover effects
        this.addCardHoverEffects(card);

        // Observe for scroll animation
        this.observeElement(card);

        return card;
    }

    createImageContainer(anime) {
        const container = document.createElement('div');
        container.className = 'card-image-container';

        const img = document.createElement('img');
        img.className = 'card-image';
        img.src = anime.image.medium;
        img.alt = anime.title.display;
        img.loading = 'lazy';

        // Add error handling for images
        img.onerror = () => {
            img.src = CONFIG.DEFAULTS.FALLBACK_IMAGE;
        };

        const overlay = document.createElement('div');
        overlay.className = 'card-overlay';

        // Add badges based on anime status/type
        const badges = this.createBadges(anime);

        container.appendChild(img);
        container.appendChild(overlay);
        if (badges) container.appendChild(badges);

        return container;
    }

    createBadges(anime) {
        const badges = document.createElement('div');
        badges.className = 'card-badges';

        // Status badge
        if (anime.status === 'RELEASING') {
            const badge = document.createElement('span');
            badge.className = 'badge badge-trending';
            badge.textContent = 'Ongoing';
            badges.appendChild(badge);
        }

        // High rating badge
        const rating = parseFloat(anime.rating?.anilist || anime.rating?.mal || 0);
        if (rating >= 8.5) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-top-rated';
            badge.textContent = 'Top Rated';
            badges.appendChild(badge);
        }

        // New release badge (within last year)
        const currentYear = new Date().getFullYear();
        if (anime.year && anime.year >= currentYear - 1) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-new';
            badge.textContent = 'New';
            badges.appendChild(badge);
        }

        return badges.children.length > 0 ? badges : null;
    }

    createCardContent(anime) {
        const content = document.createElement('div');
        content.className = 'card-content';

        // Title
        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = anime.title.display;
        title.title = anime.title.display; // Full title on hover

        // Info row (year, episodes)
        const info = document.createElement('div');
        info.className = 'card-info';

        const year = document.createElement('span');
        year.className = 'card-year';
        year.textContent = anime.year || 'Unknown';

        const episodes = document.createElement('span');
        episodes.className = 'card-episodes';
        episodes.innerHTML = `<i class="fas fa-play"></i> ${UTILS.formatEpisodes(anime.episodes)}`;

        info.appendChild(year);
        info.appendChild(episodes);

        // Average Rating Only
        const ratings = this.createSimpleRatingsSection(anime);

        // Genres
        const genres = this.createGenresSection(anime.genres);

        // No description - removed as requested

        content.appendChild(title);
        content.appendChild(info);
        content.appendChild(ratings);
        content.appendChild(genres);

        return content;
    }

    createSimpleRatingsSection(anime) {
        const ratingsContainer = document.createElement('div');
        ratingsContainer.className = 'card-ratings card-ratings-simple';

        // Show only the main/average rating NUMBER
        const mainRating = this.getMainRating(anime);
        if (mainRating) {
            const mainRatingEl = document.createElement('div');
            mainRatingEl.className = 'main-rating-only';
            
            // Show only the score, no source label
            const isAverage = mainRating.isAverage || mainRating.source.includes('Avg');
            const scoreClass = isAverage ? 'rating-score-only average-highlight' : 'rating-score-only';
            
            mainRatingEl.innerHTML = `
                <div class="${scoreClass}">${mainRating.score}</div>
            `;
            ratingsContainer.appendChild(mainRatingEl);
        } else {
            // No rating available
            const noRatingEl = document.createElement('div');
            noRatingEl.className = 'no-rating';
            noRatingEl.innerHTML = `
                <div class="rating-score-only">N/A</div>
            `;
            ratingsContainer.appendChild(noRatingEl);
        }

        return ratingsContainer;
    }

    createRatingsSection(anime) {
        const ratingsContainer = document.createElement('div');
        ratingsContainer.className = 'card-ratings card-ratings-prominent';

        // Create prominent rating display
        const mainRating = this.getMainRating(anime);
        if (mainRating) {
            const mainRatingEl = document.createElement('div');
            mainRatingEl.className = 'main-rating';
            
            // Add special class for average ratings
            const isAverage = mainRating.isAverage || mainRating.source.includes('Avg');
            const scoreClass = isAverage ? 'rating-score-large average-highlight' : 'rating-score-large';
            const sourceClass = isAverage ? 'rating-source average-source' : 'rating-source';
            
            mainRatingEl.innerHTML = `
                <div class="${scoreClass}">${mainRating.score}</div>
                <div class="${sourceClass}">${mainRating.source}</div>
            `;
            ratingsContainer.appendChild(mainRatingEl);
        }

        // Add secondary ratings as smaller indicators
        const secondaryRatings = this.getSecondaryRatings(anime);
        if (secondaryRatings.length > 0) {
            const secondaryContainer = document.createElement('div');
            secondaryContainer.className = 'secondary-ratings';
            
            secondaryRatings.forEach(rating => {
                const ratingEl = this.createSmallRatingItem(rating.source.toLowerCase(), rating.score, rating.max);
                secondaryContainer.appendChild(ratingEl);
            });
            
            ratingsContainer.appendChild(secondaryContainer);
        }

        return ratingsContainer;
    }

    getMainRating(anime) {
        // Prioritize average rating if available
        if (anime.averageRating && anime.ratingCount > 1) {
            return {
                score: anime.averageRating,
                source: `Avg (${anime.ratingCount})`,
                max: '10',
                isAverage: true
            };
        }

        // If enhanced ratings are available, calculate average on the fly
        if (anime.enhancedRatings) {
            const ratings = [
                anime.enhancedRatings.anilist,
                anime.enhancedRatings.mal,
                anime.enhancedRatings.imdb
            ].filter(r => r && r.score !== CONFIG.DEFAULTS.FALLBACK_RATING);
            
            if (ratings.length > 1) {
                const validScores = ratings.map(r => parseFloat(r.score)).filter(s => !isNaN(s));
                const average = (validScores.reduce((a, b) => a + b) / validScores.length).toFixed(1);
                return {
                    score: average,
                    source: `Avg (${ratings.length})`,
                    max: '10',
                    isAverage: true
                };
            } else if (ratings.length === 1) {
                return {
                    score: ratings[0].score,
                    source: ratings[0].source,
                    max: ratings[0].max
                };
            }
        }

        // Fallback to original rating
        if (anime.rating?.anilist && anime.rating.anilist !== CONFIG.DEFAULTS.FALLBACK_RATING) {
            return { score: anime.rating.anilist, source: 'AniList', max: '10' };
        }
        if (anime.rating?.mal && anime.rating.mal !== CONFIG.DEFAULTS.FALLBACK_RATING) {
            return { score: anime.rating.mal, source: 'MAL', max: '10' };
        }
        
        return null;
    }

    getSecondaryRatings(anime) {
        const ratings = [];
        
        if (anime.enhancedRatings) {
            if (anime.enhancedRatings.anilist && anime.enhancedRatings.anilist.score !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                ratings.push(anime.enhancedRatings.anilist);
            }
            if (anime.enhancedRatings.mal && anime.enhancedRatings.mal.score !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                ratings.push(anime.enhancedRatings.mal);
            }
            if (anime.enhancedRatings.imdb && anime.enhancedRatings.imdb.score !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                ratings.push(anime.enhancedRatings.imdb);
            }
        } else {
            // Fallback to original ratings
            if (anime.rating?.anilist && anime.rating.anilist !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                ratings.push({ score: anime.rating.anilist, source: 'AniList', max: '10' });
            }
            if (anime.rating?.mal && anime.rating.mal !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                ratings.push({ score: anime.rating.mal, source: 'MyAnimeList', max: '10' });
            }
        }

        // Return all except the main (highest) rating
        if (ratings.length > 1) {
            const sorted = ratings.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
            return sorted.slice(1); // Skip the highest (main) rating
        }

        return [];
    }

    createSmallRatingItem(source, score, max) {
        const ratingItem = document.createElement('div');
        ratingItem.className = `rating-item-small rating-${source}`;

        const icon = document.createElement('i');
        icon.className = 'fas fa-star';

        const scoreSpan = document.createElement('span');
        scoreSpan.textContent = score;

        ratingItem.appendChild(icon);
        ratingItem.appendChild(scoreSpan);

        return ratingItem;
    }

    createRatingItem(source, score, max) {
        const ratingItem = document.createElement('div');
        ratingItem.className = `rating-item rating-${source}`;

        const icon = document.createElement('i');
        icon.className = 'fas fa-star';

        const scoreSpan = document.createElement('span');
        scoreSpan.textContent = `${score}/${max}`;

        ratingItem.appendChild(icon);
        ratingItem.appendChild(scoreSpan);

        return ratingItem;
    }

    createGenresSection(genres) {
        const genresContainer = document.createElement('div');
        genresContainer.className = 'card-genres';

        if (!genres || genres.length === 0) return genresContainer;

        // Limit to first 3 genres for cards
        const limitedGenres = genres.slice(0, 3);

        limitedGenres.forEach(genre => {
            const genreTag = document.createElement('span');
            genreTag.className = 'genre-tag';
            genreTag.textContent = genre;
            genresContainer.appendChild(genreTag);
        });

        return genresContainer;
    }

    addCardHoverEffects(card) {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            card.style.zIndex = '10';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.zIndex = '';
        });
    }

    // ===============================
    //   GRID RENDERING
    // ===============================

    renderAnimeGrid(container, animeList, startIndex = 0) {
        if (!container || !animeList) return;

        // Clear existing content if startIndex is 0
        if (startIndex === 0) {
            container.innerHTML = '';
            this.animationDelayCounter = 0;
        }

        const fragment = document.createDocumentFragment();

        animeList.forEach((anime, index) => {
            const card = this.createAnimeCard(anime, startIndex + index);
            fragment.appendChild(card);
        });

        container.appendChild(fragment);

        // Trigger animations
        this.triggerStaggeredAnimations(container.children);
    }

    triggerStaggeredAnimations(elements) {
        Array.from(elements).forEach((element, index) => {
            if (element.classList.contains('anime-card')) {
                setTimeout(() => {
                    element.classList.add('animate-fade-in-up');
                }, index * CONFIG.UI.ANIMATION_DELAY);
            }
        });
    }

    // ===============================
    //   MODAL RENDERING
    // ===============================

    async openAnimeModal(animeId, source = 'anilist') {
        const modal = document.getElementById('animeModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;

        // Show loading state
        this.showModalLoading(modalBody);
        modal.classList.add('active');

        try {
            const animeDetails = await window.animeAPI.getAnimeDetails(animeId, source);
            
            if (animeDetails) {
                this.renderModalContent(modalBody, animeDetails);
            } else {
                this.showModalError(modalBody, 'Failed to load anime details');
            }
        } catch (error) {
            console.error('Modal error:', error);
            this.showModalError(modalBody, error.message);
        }
    }

    showModalLoading(container) {
        container.innerHTML = `
            <div class="modal-loading">
                <div class="spinner"></div>
                <p>Loading anime details...</p>
            </div>
        `;
    }

    showModalError(container, message) {
        container.innerHTML = `
            <div class="modal-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="document.getElementById('animeModal').classList.remove('active')">
                    Close
                </button>
            </div>
        `;
    }

    renderModalContent(container, anime) {
        const modalContent = `
            <div class="modal-header">
                ${anime.banner ? `<img src="${anime.banner}" alt="Banner" class="modal-backdrop">` : ''}
                <img src="${anime.image.large}" alt="${anime.title.display}" class="modal-poster">
            </div>
            
            <div class="modal-info">
                <h1 class="modal-title">${anime.title.display}</h1>
                
                <div class="modal-meta">
                    ${this.createMetaItem('calendar', 'Year', anime.year || 'Unknown')}
                    ${this.createMetaItem('play', 'Episodes', UTILS.formatEpisodes(anime.episodes))}
                    ${this.createMetaItem('clock', 'Duration', anime.duration ? `${anime.duration} min` : 'Unknown')}
                    ${this.createMetaItem('info-circle', 'Status', this.formatStatus(anime.status))}
                </div>

                ${this.createModalRatings(anime)}
                
                ${this.createModalGenres(anime.genres)}
                
                ${this.createStudiosSection(anime.studios)}
                
                ${this.createStreamingSection(anime)}
                
                ${this.createExternalLinksSection(anime)}
            </div>
        `;

        container.innerHTML = modalContent;
        
        // Add entrance animation
        setTimeout(() => {
            container.classList.add('animate-fade-in-up');
        }, 100);
    }

    createMetaItem(icon, label, value) {
        return `
            <div class="meta-item">
                <i class="fas fa-${icon}"></i>
                <span><strong>${label}:</strong> ${value}</span>
            </div>
        `;
    }

    createModalRatings(anime) {
        let ratingsHTML = '<div class="modal-ratings-enhanced">';

        // Main ratings section - much more prominent
        ratingsHTML += '<div class="main-ratings-section">';
        ratingsHTML += '<h3 class="ratings-title"><i class="fas fa-star"></i> Anime Ratings</h3>';
        
        const allRatings = this.getAllRatings(anime);
        
        if (allRatings.length === 0) {
            ratingsHTML += '<div class="no-ratings">No ratings available</div>';
        } else {
            ratingsHTML += '<div class="ratings-grid">';
            
            allRatings.forEach(rating => {
                const colorClass = this.getRatingColorClass(parseFloat(rating.score));
                const platformInfo = this.getPlatformInfo(rating.source);
                
                ratingsHTML += `
                    <div class="rating-card-large ${rating.source.toLowerCase().replace(' ', '')}">
                        <div class="rating-platform">
                            <i class="${platformInfo.icon}" style="color: ${platformInfo.color}"></i>
                            <span class="platform-name">${rating.source}</span>
                        </div>
                        <div class="rating-score-huge ${colorClass}">${rating.score}</div>
                        <div class="rating-max">/ ${rating.max}</div>
                        ${rating.voters ? `<div class="rating-voters">${rating.voters}</div>` : ''}
                    </div>
                `;
            });
            
            ratingsHTML += '</div>';

            // Average rating if multiple sources
            if (allRatings.length > 1) {
                const validScores = allRatings.map(r => parseFloat(r.score)).filter(s => !isNaN(s));
                const average = (validScores.reduce((a, b) => a + b) / validScores.length).toFixed(1);
                const avgColorClass = this.getRatingColorClass(parseFloat(average));
                
                ratingsHTML += `
                    <div class="average-rating">
                        <div class="average-rating-content">
                            <span class="average-label">Average Rating</span>
                            <span class="average-score ${avgColorClass}">${average}/10</span>
                            <span class="average-sources">from ${allRatings.length} sources</span>
                        </div>
                    </div>
                `;
            }
        }
        
        ratingsHTML += '</div>';

        // Episode ratings section
        if (anime.enhancedRatings && anime.enhancedRatings.episodes && anime.enhancedRatings.episodes.length > 0) {
            ratingsHTML += this.createEpisodeRatingsSection(anime.enhancedRatings.episodes);
        }

        ratingsHTML += '</div>';

        return ratingsHTML;
    }

    getPlatformInfo(source) {
        const platforms = {
            'AniList': {
                icon: 'fas fa-chart-line',
                color: '#02a9ff'
            },
            'MyAnimeList': {
                icon: 'fas fa-list-ul',
                color: '#2e51a2'
            },
            'IMDB': {
                icon: 'fas fa-film',
                color: '#f5c518'
            }
        };
        
        return platforms[source] || {
            icon: 'fas fa-star',
            color: '#6366f1'
        };
    }

    getAllRatings(anime) {
        const ratings = [];

        if (anime.enhancedRatings) {
            if (anime.enhancedRatings.anilist && anime.enhancedRatings.anilist.score !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                ratings.push({
                    ...anime.enhancedRatings.anilist,
                    voters: anime.favourites ? `${anime.favourites} favorites` : null
                });
            }
            if (anime.enhancedRatings.mal && anime.enhancedRatings.mal.score !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                ratings.push({
                    ...anime.enhancedRatings.mal,
                    voters: anime.members ? `${anime.members} members` : null
                });
            }
            if (anime.enhancedRatings.imdb && anime.enhancedRatings.imdb.score !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                ratings.push(anime.enhancedRatings.imdb);
            }
        } else {
            // Fallback to basic ratings
            if (anime.rating?.anilist && anime.rating.anilist !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                ratings.push({
                    score: anime.rating.anilist,
                    source: 'AniList',
                    max: '10.0'
                });
            }
            if (anime.rating?.mal && anime.rating.mal !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                ratings.push({
                    score: anime.rating.mal,
                    source: 'MyAnimeList', 
                    max: '10.0'
                });
            }
        }

        return ratings;
    }

    createEpisodeRatingsSection(episodes) {
        let html = '<div class="episode-ratings-section">';
        html += '<h3 class="ratings-title"><i class="fas fa-tv"></i> Episode Ratings</h3>';
        
        if (episodes.length === 0) {
            html += '<div class="no-episode-ratings">Episode ratings not available</div>';
        } else {
            html += '<div class="episode-ratings-container">';
            
            // Show first 12 episodes or all if less
            const displayEpisodes = episodes.slice(0, 12);
            
            displayEpisodes.forEach(episode => {
                const colorClass = this.getRatingColorClass(parseFloat(episode.rating));
                html += `
                    <div class="episode-rating-item">
                        <div class="episode-number">EP ${episode.number}</div>
                        <div class="episode-rating ${colorClass}">${episode.rating}</div>
                        ${episode.title ? `<div class="episode-title">${episode.title}</div>` : ''}
                    </div>
                `;
            });
            
            if (episodes.length > 12) {
                html += `<div class="more-episodes">+${episodes.length - 12} more episodes</div>`;
            }
            
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }

    getRatingColorClass(score) {
        if (score >= 8.5) return 'rating-excellent';
        if (score >= 7.5) return 'rating-great';
        if (score >= 6.5) return 'rating-good';
        if (score >= 5.5) return 'rating-average';
        return 'rating-poor';
    }



    createModalGenres(genres) {
        if (!genres || genres.length === 0) return '';

        const genresHTML = genres.slice(0, CONFIG.DEFAULTS.MAX_GENRES).map(genre => 
            `<span class="genre-tag">${genre}</span>`
        ).join('');

        return `<div class="modal-genres">${genresHTML}</div>`;
    }

    createStudiosSection(studios) {
        if (!studios || studios.length === 0) return '';

        const studiosHTML = studios.slice(0, 3).join(', ');
        
        return `
            <div class="studios-section">
                <h4><i class="fas fa-building"></i> Studios</h4>
                <p>${studiosHTML}</p>
            </div>
        `;
    }

    createStreamingSection(anime) {
        if (!anime.streamingEpisodes || anime.streamingEpisodes.length === 0) {
            return this.createGenericStreamingSection();
        }

        const platforms = [...new Set(anime.streamingEpisodes.map(ep => ep.site))];
        const platformsHTML = platforms.map(platform => {
            const platformInfo = CONFIG.EXTERNAL.STREAMING_PLATFORMS[platform.toLowerCase()] || {
                name: platform,
                icon: 'fas fa-play-circle',
                color: '#6366f1'
            };

            return `
                <a href="#" class="platform-item" style="border-color: ${platformInfo.color}">
                    <i class="${platformInfo.icon}" style="color: ${platformInfo.color}"></i>
                    <span>${platformInfo.name}</span>
                </a>
            `;
        }).join('');

        return `
            <div class="streaming-section">
                <h4><i class="fas fa-play"></i> Available on</h4>
                <div class="streaming-platforms">
                    ${platformsHTML}
                </div>
            </div>
        `;
    }

    createGenericStreamingSection() {
        const commonPlatforms = ['crunchyroll', 'funimation', 'netflix'];
        const platformsHTML = commonPlatforms.map(platform => {
            const platformInfo = CONFIG.EXTERNAL.STREAMING_PLATFORMS[platform];
            return `
                <a href="${platformInfo.baseUrl}" target="_blank" class="platform-item" style="border-color: ${platformInfo.color}">
                    <i class="${platformInfo.icon}" style="color: ${platformInfo.color}"></i>
                    <span>${platformInfo.name}</span>
                </a>
            `;
        }).join('');

        return `
            <div class="streaming-section">
                <h4><i class="fas fa-play"></i> Check availability on</h4>
                <div class="streaming-platforms">
                    ${platformsHTML}
                </div>
            </div>
        `;
    }

    createExternalLinksSection(anime) {
        const links = [];

        // Add source-specific links
        if (anime.source === 'anilist') {
            links.push({
                name: 'AniList',
                url: `${CONFIG.EXTERNAL.EXTERNAL_LINKS.anilist}${anime.id}`,
                icon: 'fas fa-external-link-alt'
            });
        }

        if (anime.malUrl) {
            links.push({
                name: 'MyAnimeList',
                url: anime.malUrl,
                icon: 'fas fa-external-link-alt'
            });
        }

        if (anime.imdbUrl) {
            links.push({
                name: 'IMDB',
                url: anime.imdbUrl,
                icon: 'fas fa-external-link-alt'
            });
        }

        if (links.length === 0) return '';

        const linksHTML = links.map(link => `
            <a href="${link.url}" target="_blank" class="platform-item">
                <i class="${link.icon}"></i>
                <span>${link.name}</span>
            </a>
        `).join('');

        return `
            <div class="external-links-section">
                <h4><i class="fas fa-link"></i> External Links</h4>
                <div class="streaming-platforms">
                    ${linksHTML}
                </div>
            </div>
        `;
    }

    formatStatus(status) {
        const statusMap = {
            'RELEASING': 'Currently Airing',
            'FINISHED': 'Completed',
            'NOT_YET_RELEASED': 'Upcoming',
            'CANCELLED': 'Cancelled',
            'HIATUS': 'On Hiatus'
        };
        return statusMap[status] || status || 'Unknown';
    }

    // ===============================
    //   SEARCH SUGGESTIONS
    // ===============================

    renderSearchSuggestions(container, results) {
        if (!container || !results || results.length === 0) {
            container.innerHTML = '';
            container.classList.remove('active');
            return;
        }

        const suggestionsHTML = results.slice(0, CONFIG.SEARCH.MAX_SUGGESTIONS).map((anime, index) => `
            <div class="suggestion-item" data-anime-id="${anime.id}" data-source="${anime.source}" style="animation-delay: ${index * 50}ms">
                <img src="${anime.image.medium}" alt="${anime.title.display}" class="suggestion-image">
                <div class="suggestion-content">
                    <div class="suggestion-title">${anime.title.display}</div>
                    <div class="suggestion-info">
                        <span>${anime.year || 'Unknown'}</span>
                        ${anime.rating?.anilist || anime.rating?.mal ? 
                            `<span class="suggestion-rating">
                                <i class="fas fa-star"></i>
                                ${anime.rating.anilist || anime.rating.mal}
                            </span>` : ''
                        }
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = suggestionsHTML;
        container.classList.add('active');

        // Add click handlers
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const animeId = item.dataset.animeId;
                const source = item.dataset.source;
                this.openAnimeModal(animeId, source);
                container.classList.remove('active');
            });
        });
    }

    // ===============================
    //   LOADING STATES
    // ===============================

    showLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('active');
        }
    }

    hideLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('active');
        }
    }

    renderSkeletonCards(container, count = CONFIG.UI.SKELETON_COUNT) {
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < count; i++) {
            const skeleton = this.createSkeletonCard();
            fragment.appendChild(skeleton);
        }

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'anime-card skeleton-card';
        card.innerHTML = `
            <div class="skeleton" style="height: 400px; border-radius: var(--radius-lg);"></div>
            <div style="padding: var(--spacing-md);">
                <div class="skeleton skeleton-text" style="height: 1.5rem; margin-bottom: var(--spacing-sm);"></div>
                <div class="skeleton skeleton-text short" style="height: 1rem; margin-bottom: var(--spacing-sm);"></div>
                <div class="skeleton skeleton-text medium" style="height: 1rem; margin-bottom: var(--spacing-sm);"></div>
                <div class="skeleton skeleton-text long" style="height: 3rem;"></div>
            </div>
        `;
        return card;
    }

    // ===============================
    //   ERROR STATES
    // ===============================

    showError(container, message, retryCallback = null) {
        const errorHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                ${retryCallback ? `
                    <button class="btn btn-primary retry-btn">
                        <i class="fas fa-redo"></i>
                        Try Again
                    </button>
                ` : ''}
            </div>
        `;

        container.innerHTML = errorHTML;

        if (retryCallback) {
            const retryBtn = container.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', retryCallback);
            }
        }
    }

    showEmptyState(container, message = 'No anime found') {
        const emptyHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Results</h3>
                <p>${message}</p>
                <p>Try searching with different keywords or browse our trending anime.</p>
            </div>
        `;

        container.innerHTML = emptyHTML;
    }

    // ===============================
    //   UTILITY METHODS
    // ===============================

    closeModal() {
        const modal = document.getElementById('animeModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    clearContainer(container) {
        if (container) {
            container.innerHTML = '';
        }
    }

    addGlowEffect(element) {
        element.classList.add('hover-glow');
    }

    removeGlowEffect(element) {
        element.classList.remove('hover-glow');
    }

    // Initialize tooltips (if needed)
    initializeTooltips() {
        // Add tooltip functionality for truncated text
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('card-title') && 
                e.target.scrollWidth > e.target.clientWidth) {
                e.target.title = e.target.textContent;
            }
        });
    }
}

// ===============================
//   INITIALIZE UI
// ===============================

// Create global UI instance
window.animeUI = new AnimeUI();

// Initialize tooltips
window.animeUI.initializeTooltips();

console.log('AnimeUI initialized', {
    scrollAnimations: true,
    cardRendering: true,
    modalSystem: true,
    loadingStates: true
});