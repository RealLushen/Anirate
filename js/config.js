// ===============================
//   API CONFIGURATION
// ===============================

const CONFIG = {
    // API Endpoints (All FREE APIs)
    APIs: {
        // AniList GraphQL API (Free, no key required)
        ANILIST: {
            endpoint: 'https://graphql.anilist.co',
            rateLimit: 90, // requests per minute
        },
        
        // Jikan API - Unofficial MyAnimeList API (Free, no key required)
        JIKAN: {
            endpoint: 'https://api.jikan.moe/v4',
            rateLimit: 60, // requests per minute
        },
        
        // OMDB API for IMDB data (Free tier: 1000 requests/day)
        OMDB: {
            endpoint: 'https://www.omdbapi.com',
            apiKey: 'demo', // Replace with your free API key from omdbapi.com
            rateLimit: 1000, // requests per day
        },
        
        // Kitsu API (Free alternative anime database)
        KITSU: {
            endpoint: 'https://kitsu.io/api/edge',
            rateLimit: 400, // requests per hour
        },
        
        // AnimeNewsNetwork API (Free, for additional data)
        ANN: {
            endpoint: 'https://cdn.animenewsnetwork.com/encyclopedia/api.xml',
            rateLimit: 100, // requests per hour
        }
    },

    // Cache Configuration
    CACHE: {
        // Cache duration in milliseconds
        SEARCH_RESULTS: 5 * 60 * 1000, // 5 minutes
        ANIME_DETAILS: 30 * 60 * 1000, // 30 minutes
        TRENDING: 60 * 60 * 1000, // 1 hour
        TOP_RATED: 6 * 60 * 60 * 1000, // 6 hours
        
        // Max cache size (number of items)
        MAX_SEARCH_CACHE: 100,
        MAX_DETAILS_CACHE: 50,
    },

    // Search Configuration
    SEARCH: {
        MIN_QUERY_LENGTH: 2,
        MAX_SUGGESTIONS: 8,
        DEBOUNCE_DELAY: 300, // milliseconds
        LANGUAGES: ['english', 'german', 'romaji', 'japanese'],
    },

    // UI Configuration
    UI: {
        ITEMS_PER_PAGE: 12,
        ANIMATION_DELAY: 100, // milliseconds between card animations
        MODAL_TRANSITION: 300, // milliseconds
        SCROLL_THRESHOLD: 100, // pixels for scroll reveal
        
        // Image sizes
        POSTER_SIZES: {
            small: '230x345',
            medium: '460x690',
            large: '920x1380'
        },
        
        // Loading states
        SKELETON_COUNT: 8,
        MIN_LOADING_TIME: 500, // minimum loading time for better UX
    },

    // Default values
    DEFAULTS: {
        FALLBACK_IMAGE: 'https://via.placeholder.com/460x690/1e1e2a/6366f1?text=No+Image',
        FALLBACK_RATING: 'N/A',
        MAX_DESCRIPTION_LENGTH: 300,
        MAX_GENRES: 5,
    },

    // External services configuration
    EXTERNAL: {
        // Streaming platforms
        STREAMING_PLATFORMS: {
            'crunchyroll': {
                name: 'Crunchyroll',
                icon: 'fas fa-play-circle',
                color: '#f47521',
                baseUrl: 'https://www.crunchyroll.com'
            },
            'funimation': {
                name: 'Funimation',
                icon: 'fas fa-play-circle',
                color: '#5b4e75',
                baseUrl: 'https://www.funimation.com'
            },
            'netflix': {
                name: 'Netflix',
                icon: 'fas fa-play-circle',
                color: '#e50914',
                baseUrl: 'https://www.netflix.com'
            },
            'amazon-prime': {
                name: 'Amazon Prime',
                icon: 'fas fa-play-circle',
                color: '#00a8e1',
                baseUrl: 'https://www.amazon.com/prime-video'
            },
            'hulu': {
                name: 'Hulu',
                icon: 'fas fa-play-circle',
                color: '#1ce783',
                baseUrl: 'https://www.hulu.com'
            }
        },
        
        // External links
        EXTERNAL_LINKS: {
            mal: 'https://myanimelist.net/anime/',
            anilist: 'https://anilist.co/anime/',
            imdb: 'https://www.imdb.com/title/',
            kitsu: 'https://kitsu.io/anime/'
        }
    }
};

// ===============================
//   GRAPHQL QUERIES FOR ANILIST
// ===============================

const GRAPHQL_QUERIES = {
    // Search anime query
    SEARCH_ANIME: `
        query SearchAnime($search: String!, $page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
                pageInfo {
                    hasNextPage
                    total
                }
                media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        large
                        medium
                    }
                    bannerImage
                    startDate {
                        year
                        month
                        day
                    }
                    endDate {
                        year
                        month
                        day
                    }
                    description
                    episodes
                    duration
                    status
                    genres
                    averageScore
                    popularity
                    favourites
                    studios {
                        nodes {
                            name
                        }
                    }
                    externalLinks {
                        url
                        site
                    }
                    streamingEpisodes {
                        title
                        thumbnail
                        url
                        site
                    }
                }
            }
        }
    `,

    // Get anime details
    ANIME_DETAILS: `
        query AnimeDetails($id: Int!) {
            Media(id: $id, type: ANIME) {
                id
                title {
                    romaji
                    english
                    native
                }
                coverImage {
                    large
                    medium
                }
                bannerImage
                startDate {
                    year
                    month
                    day
                }
                endDate {
                    year
                    month
                    day
                }
                description
                episodes
                duration
                status
                genres
                averageScore
                popularity
                favourites
                source
                season
                seasonYear
                studios {
                    nodes {
                        name
                    }
                }
                staff {
                    nodes {
                        name {
                            full
                        }
                    }
                }
                characters {
                    nodes {
                        name {
                            full
                        }
                    }
                }
                externalLinks {
                    url
                    site
                    color
                }
                streamingEpisodes {
                    title
                    thumbnail
                    url
                    site
                }
                relations {
                    nodes {
                        id
                        title {
                            romaji
                            english
                        }
                        coverImage {
                            medium
                        }
                        type
                        format
                    }
                }
                recommendations {
                    nodes {
                        mediaRecommendation {
                            id
                            title {
                                romaji
                                english
                            }
                            coverImage {
                                medium
                            }
                            averageScore
                        }
                    }
                }
            }
        }
    `,

    // Get trending anime
    TRENDING_ANIME: `
        query TrendingAnime($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
                media(type: ANIME, sort: TRENDING_DESC, status: RELEASING) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        large
                        medium
                    }
                    bannerImage
                    description
                    episodes
                    averageScore
                    popularity
                    genres
                    startDate {
                        year
                    }
                    status
                }
            }
        }
    `,

    // Get top rated anime
    TOP_RATED_ANIME: `
        query TopRatedAnime($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
                media(type: ANIME, sort: SCORE_DESC, status: FINISHED) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        large
                        medium
                    }
                    bannerImage
                    description
                    episodes
                    averageScore
                    popularity
                    genres
                    startDate {
                        year
                    }
                    status
                }
            }
        }
    `,

    // Get new releases
    NEW_RELEASES: `
        query NewReleases($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
                media(type: ANIME, sort: START_DATE_DESC, status_in: [RELEASING, FINISHED]) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        large
                        medium
                    }
                    bannerImage
                    description
                    episodes
                    averageScore
                    popularity
                    genres
                    startDate {
                        year
                        month
                    }
                    status
                }
            }
        }
    `
};

// ===============================
//   UTILITY FUNCTIONS
// ===============================

const UTILS = {
    // Format anime title for display
    formatTitle(titleObj) {
        return titleObj.english || titleObj.romaji || titleObj.native || 'Unknown Title';
    },

    // Format date
    formatDate(dateObj) {
        if (!dateObj || !dateObj.year) return 'Unknown';
        if (dateObj.month && dateObj.day) {
            return `${dateObj.day}/${dateObj.month}/${dateObj.year}`;
        }
        return dateObj.year.toString();
    },

    // Format score
    formatScore(score) {
        return score ? (score / 10).toFixed(1) : CONFIG.DEFAULTS.FALLBACK_RATING;
    },

    // Truncate text
    truncateText(text, maxLength = CONFIG.DEFAULTS.MAX_DESCRIPTION_LENGTH) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    },

    // Remove HTML tags
    stripHtml(html) {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    },

    // Generate cache key
    getCacheKey(type, query, page = 1) {
        return `${type}_${query}_${page}`;
    },

    // Check if cache is valid
    isCacheValid(timestamp, duration) {
        return Date.now() - timestamp < duration;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Generate placeholder image URL
    getPlaceholderImage(width = 460, height = 690, text = 'No Image') {
        return `https://via.placeholder.com/${width}x${height}/1e1e2a/6366f1?text=${encodeURIComponent(text)}`;
    },

    // Format episode count
    formatEpisodes(episodes) {
        if (!episodes) return 'Unknown';
        return episodes === 1 ? '1 Episode' : `${episodes} Episodes`;
    },

    // Get status color
    getStatusColor(status) {
        const colors = {
            'RELEASING': '#34d399',
            'FINISHED': '#6366f1',
            'NOT_YET_RELEASED': '#f59e0b',
            'CANCELLED': '#ef4444',
            'HIATUS': '#8b5cf6'
        };
        return colors[status] || '#6b7280';
    },

    // Format popularity
    formatPopularity(popularity) {
        if (!popularity) return 'Unknown';
        if (popularity >= 1000000) return `${(popularity / 1000000).toFixed(1)}M`;
        if (popularity >= 1000) return `${(popularity / 1000).toFixed(1)}K`;
        return popularity.toString();
    }
};

// ===============================
//   ERROR MESSAGES
// ===============================

const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    API_ERROR: 'Unable to fetch data. Please try again later.',
    SEARCH_ERROR: 'Search failed. Please try a different query.',
    NO_RESULTS: 'No anime found. Try searching with a different title.',
    RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
    INVALID_QUERY: 'Please enter a valid search query.',
    LOADING_ERROR: 'Failed to load content. Please refresh the page.',
    CACHE_ERROR: 'Cache error. Data may be outdated.',
    PARSE_ERROR: 'Failed to parse response data.',
    TIMEOUT_ERROR: 'Request timeout. Please try again.'
};

// ===============================
//   EXPORT CONFIGURATION
// ===============================

// Make configuration globally available
window.CONFIG = CONFIG;
window.GRAPHQL_QUERIES = GRAPHQL_QUERIES;
window.UTILS = UTILS;
window.ERROR_MESSAGES = ERROR_MESSAGES;

// Console log for debugging
console.log('AnimeHub Configuration Loaded', {
    apis: Object.keys(CONFIG.APIs),
    queries: Object.keys(GRAPHQL_QUERIES),
    version: '1.0.0'
});