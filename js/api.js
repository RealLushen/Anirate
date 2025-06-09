// ===============================
//   API LAYER & DATA PROCESSING
// ===============================

class AnimeAPI {
    constructor() {
        this.cache = new Map();
        this.requestCounts = new Map();
        this.lastRequests = new Map();
        this.initializeRateLimiting();
    }

    // ===============================
    //   RATE LIMITING & CACHE
    // ===============================

    initializeRateLimiting() {
        // Reset rate limit counters every minute
        setInterval(() => {
            this.requestCounts.clear();
        }, 60000);
    }

    canMakeRequest(apiName) {
        const config = CONFIG.APIs[apiName];
        if (!config) return true;

        const count = this.requestCounts.get(apiName) || 0;
        const now = Date.now();
        const lastRequest = this.lastRequests.get(apiName) || 0;

        // Check rate limit
        if (count >= config.rateLimit) {
            console.warn(`Rate limit exceeded for ${apiName}`);
            return false;
        }

        // Minimum delay between requests (100ms)
        if (now - lastRequest < 100) {
            return false;
        }

        return true;
    }

    incrementRequestCount(apiName) {
        const count = this.requestCounts.get(apiName) || 0;
        this.requestCounts.set(apiName, count + 1);
        this.lastRequests.set(apiName, Date.now());
    }

    setCache(key, data, duration = CONFIG.CACHE.SEARCH_RESULTS) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            duration
        });

        // Cleanup old cache entries
        if (this.cache.size > CONFIG.CACHE.MAX_SEARCH_CACHE) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (UTILS.isCacheValid(cached.timestamp, cached.duration)) {
            return cached.data;
        }

        this.cache.delete(key);
        return null;
    }

    // ===============================
    //   ANILIST API (GraphQL)
    // ===============================

    async fetchFromAniList(query, variables = {}) {
        if (!this.canMakeRequest('ANILIST')) {
            throw new Error(ERROR_MESSAGES.RATE_LIMIT);
        }

        try {
            this.incrementRequestCount('ANILIST');

            const response = await fetch(CONFIG.APIs.ANILIST.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            if (!response.ok) {
                throw new Error(`AniList API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.errors) {
                throw new Error(`AniList GraphQL error: ${data.errors[0].message}`);
            }

            return data.data;
        } catch (error) {
            console.error('AniList API Error:', error);
            throw error;
        }
    }

    async searchAniList(query, page = 1, perPage = 12) {
        const cacheKey = UTILS.getCacheKey('anilist_search', query, page);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.fetchFromAniList(GRAPHQL_QUERIES.SEARCH_ANIME, {
                search: query,
                page,
                perPage
            });

            const result = {
                results: data.Page.media.map(this.normalizeAniListAnime),
                pagination: data.Page.pageInfo
            };

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('AniList search error:', error);
            return { results: [], pagination: { hasNextPage: false, total: 0 } };
        }
    }

    async getAniListDetails(id) {
        const cacheKey = UTILS.getCacheKey('anilist_details', id);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.fetchFromAniList(GRAPHQL_QUERIES.ANIME_DETAILS, { id });
            const result = this.normalizeAniListAnime(data.Media, true);
            
            this.setCache(cacheKey, result, CONFIG.CACHE.ANIME_DETAILS);
            return result;
        } catch (error) {
            console.error('AniList details error:', error);
            return null;
        }
    }

    async getTrendingAniList(page = 1, perPage = 12) {
        const cacheKey = UTILS.getCacheKey('anilist_trending', 'all', page);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.fetchFromAniList(GRAPHQL_QUERIES.TRENDING_ANIME, {
                page,
                perPage
            });

            const result = data.Page.media.map(this.normalizeAniListAnime);
            this.setCache(cacheKey, result, CONFIG.CACHE.TRENDING);
            return result;
        } catch (error) {
            console.error('AniList trending error:', error);
            return [];
        }
    }

    async getTopRatedAniList(page = 1, perPage = 12) {
        const cacheKey = UTILS.getCacheKey('anilist_top', 'all', page);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.fetchFromAniList(GRAPHQL_QUERIES.TOP_RATED_ANIME, {
                page,
                perPage
            });

            const result = data.Page.media.map(this.normalizeAniListAnime);
            this.setCache(cacheKey, result, CONFIG.CACHE.TOP_RATED);
            return result;
        } catch (error) {
            console.error('AniList top rated error:', error);
            return [];
        }
    }

    async getNewReleasesAniList(page = 1, perPage = 12) {
        const cacheKey = UTILS.getCacheKey('anilist_new', 'all', page);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.fetchFromAniList(GRAPHQL_QUERIES.NEW_RELEASES, {
                page,
                perPage
            });

            const result = data.Page.media.map(this.normalizeAniListAnime);
            this.setCache(cacheKey, result, CONFIG.CACHE.TRENDING);
            return result;
        } catch (error) {
            console.error('AniList new releases error:', error);
            return [];
        }
    }

    // ===============================
    //   JIKAN API (MyAnimeList)
    // ===============================

    async fetchFromJikan(endpoint) {
        if (!this.canMakeRequest('JIKAN')) {
            throw new Error(ERROR_MESSAGES.RATE_LIMIT);
        }

        try {
            this.incrementRequestCount('JIKAN');

            const response = await fetch(`${CONFIG.APIs.JIKAN.endpoint}${endpoint}`);

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(ERROR_MESSAGES.RATE_LIMIT);
                }
                throw new Error(`Jikan API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Jikan API Error:', error);
            throw error;
        }
    }

    async searchJikan(query, page = 1) {
        const cacheKey = UTILS.getCacheKey('jikan_search', query, page);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.fetchFromJikan(`/anime?q=${encodeURIComponent(query)}&page=${page}&limit=12`);
            
            const result = {
                results: data.data.map(this.normalizeJikanAnime),
                pagination: data.pagination
            };

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Jikan search error:', error);
            return { results: [], pagination: { has_next_page: false } };
        }
    }

    async getJikanDetails(malId) {
        const cacheKey = UTILS.getCacheKey('jikan_details', malId);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const [animeData, statsData] = await Promise.all([
                this.fetchFromJikan(`/anime/${malId}`),
                this.fetchFromJikan(`/anime/${malId}/statistics`).catch(() => null)
            ]);

            const result = this.normalizeJikanAnime(animeData.data, true);
            if (statsData) {
                result.stats = statsData.data;
            }

            this.setCache(cacheKey, result, CONFIG.CACHE.ANIME_DETAILS);
            return result;
        } catch (error) {
            console.error('Jikan details error:', error);
            return null;
        }
    }

    async getTopAnimeJikan(type = 'anime', page = 1) {
        const cacheKey = UTILS.getCacheKey('jikan_top', type, page);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.fetchFromJikan(`/top/anime?page=${page}&limit=12`);
            const result = data.data.map(this.normalizeJikanAnime);
            
            this.setCache(cacheKey, result, CONFIG.CACHE.TOP_RATED);
            return result;
        } catch (error) {
            console.error('Jikan top anime error:', error);
            return [];
        }
    }

    // ===============================
    //   OMDB API (IMDB Data)
    // ===============================

    async fetchFromOMDB(params) {
        if (!this.canMakeRequest('OMDB')) {
            throw new Error(ERROR_MESSAGES.RATE_LIMIT);
        }

        try {
            this.incrementRequestCount('OMDB');

            const searchParams = new URLSearchParams({
                apikey: CONFIG.APIs.OMDB.apiKey,
                ...params
            });

            const response = await fetch(`${CONFIG.APIs.OMDB.endpoint}?${searchParams}`);

            if (!response.ok) {
                throw new Error(`OMDB API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.Error) {
                throw new Error(`OMDB error: ${data.Error}`);
            }

            return data;
        } catch (error) {
            console.error('OMDB API Error:', error);
            throw error;
        }
    }

    async searchOMDBByTitle(title) {
        const cacheKey = UTILS.getCacheKey('omdb_search', title);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.fetchFromOMDB({
                s: title,
                type: 'series'
            });

            const result = data.Search ? data.Search.map(this.normalizeOMDBResult) : [];
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('OMDB search error:', error);
            return [];
        }
    }

    async getOMDBDetails(imdbId) {
        const cacheKey = UTILS.getCacheKey('omdb_details', imdbId);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.fetchFromOMDB({
                i: imdbId,
                plot: 'full'
            });

            const result = this.normalizeOMDBResult(data, true);
            this.setCache(cacheKey, result, CONFIG.CACHE.ANIME_DETAILS);
            return result;
        } catch (error) {
            console.error('OMDB details error:', error);
            return null;
        }
    }

    // ===============================
    //   DATA NORMALIZATION
    // ===============================

    normalizeAniListAnime(anime, detailed = false) {
        const normalized = {
            id: anime.id,
            source: 'anilist',
            title: {
                english: anime.title.english,
                romaji: anime.title.romaji,
                native: anime.title.native,
                display: UTILS.formatTitle(anime.title)
            },
            image: {
                large: anime.coverImage?.extraLarge || anime.coverImage?.large || CONFIG.DEFAULTS.FALLBACK_IMAGE,
                medium: anime.coverImage?.large || anime.coverImage?.medium || CONFIG.DEFAULTS.FALLBACK_IMAGE
            },
            banner: anime.bannerImage,
            description: UTILS.stripHtml(anime.description),
            episodes: anime.episodes,
            duration: anime.duration,
            status: anime.status,
            genres: anime.genres || [],
            rating: {
                anilist: UTILS.formatScore(anime.averageScore),
                source: 'AniList',
                max: '10.0'
            },
            popularity: anime.popularity,
            favourites: anime.favourites,
            year: anime.startDate?.year,
            startDate: UTILS.formatDate(anime.startDate),
            endDate: UTILS.formatDate(anime.endDate)
        };

        if (detailed) {
            normalized.studios = anime.studios?.nodes?.map(s => s.name) || [];
            normalized.staff = anime.staff?.nodes?.slice(0, 5) || [];
            normalized.characters = anime.characters?.nodes?.slice(0, 5) || [];
            normalized.externalLinks = anime.externalLinks || [];
            normalized.streamingEpisodes = anime.streamingEpisodes || [];
            normalized.relations = anime.relations?.nodes || [];
            normalized.recommendations = anime.recommendations?.nodes?.slice(0, 6) || [];
            normalized.source = anime.source;
            normalized.season = anime.season;
            normalized.seasonYear = anime.seasonYear;
        }

        return normalized;
    }

    normalizeJikanAnime(anime, detailed = false) {
        const normalized = {
            id: anime.mal_id,
            source: 'jikan',
            title: {
                english: anime.title_english,
                romaji: anime.title,
                native: anime.title_japanese,
                display: anime.title_english || anime.title
            },
            image: {
                large: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || CONFIG.DEFAULTS.FALLBACK_IMAGE,
                medium: anime.images?.webp?.image_url || anime.images?.jpg?.image_url || CONFIG.DEFAULTS.FALLBACK_IMAGE
            },
            description: anime.synopsis,
            episodes: anime.episodes,
            duration: anime.duration,
            status: anime.status,
            genres: anime.genres?.map(g => g.name) || [],
            rating: {
                mal: anime.score?.toString() || CONFIG.DEFAULTS.FALLBACK_RATING,
                source: 'MyAnimeList',
                max: '10.0'
            },
            popularity: anime.popularity,
            members: anime.members,
            year: anime.aired?.from ? new Date(anime.aired.from).getFullYear() : null,
            startDate: anime.aired?.from,
            endDate: anime.aired?.to,
            malUrl: anime.url
        };

        if (detailed) {
            normalized.studios = anime.studios?.map(s => s.name) || [];
            normalized.producers = anime.producers?.map(p => p.name) || [];
            normalized.licensors = anime.licensors?.map(l => l.name) || [];
            normalized.type = anime.type;
            normalized.source = anime.source;
            normalized.themes = anime.themes?.map(t => t.name) || [];
            normalized.demographics = anime.demographics?.map(d => d.name) || [];
            normalized.season = anime.season;
            normalized.year = anime.year;
        }

        return normalized;
    }

    normalizeOMDBResult(result, detailed = false) {
        const normalized = {
            id: result.imdbID,
            source: 'omdb',
            title: {
                display: result.Title
            },
            image: {
                large: result.Poster !== 'N/A' ? result.Poster : CONFIG.DEFAULTS.FALLBACK_IMAGE,
                medium: result.Poster !== 'N/A' ? result.Poster : CONFIG.DEFAULTS.FALLBACK_IMAGE
            },
            year: result.Year,
            rating: {
                imdb: result.imdbRating || CONFIG.DEFAULTS.FALLBACK_RATING,
                source: 'IMDB',
                max: '10.0'
            },
            imdbUrl: `https://www.imdb.com/title/${result.imdbID}/`
        };

        if (detailed) {
            normalized.description = result.Plot;
            normalized.director = result.Director;
            normalized.writer = result.Writer;
            normalized.actors = result.Actors;
            normalized.genre = result.Genre;
            normalized.language = result.Language;
            normalized.country = result.Country;
            normalized.awards = result.Awards;
            normalized.metascore = result.Metascore;
            normalized.imdbVotes = result.imdbVotes;
            normalized.type = result.Type;
            normalized.totalSeasons = result.totalSeasons;
        }

        return normalized;
    }

    // ===============================
    //   COMBINED SEARCH & DATA
    // ===============================

    async searchAllSources(query, page = 1) {
        const searches = await Promise.allSettled([
            this.searchAniList(query, page),
            this.searchJikan(query, page)
        ]);

        const results = [];
        
        // Combine AniList results
        if (searches[0].status === 'fulfilled') {
            results.push(...searches[0].value.results);
        }

        // Combine Jikan results
        if (searches[1].status === 'fulfilled') {
            results.push(...searches[1].value.results);
        }

        // Remove duplicates and sort by relevance
        const uniqueResults = this.removeDuplicates(results);
        const sortedResults = this.sortByRelevance(uniqueResults, query);

        return {
            results: sortedResults.slice(0, CONFIG.UI.ITEMS_PER_PAGE),
            total: uniqueResults.length
        };
    }

    async getEnhancedAnimeDetails(id, source = 'anilist') {
        let mainData;

        // Get primary data from specified source
        if (source === 'anilist') {
            mainData = await this.getAniListDetails(id);
        } else if (source === 'jikan') {
            mainData = await this.getJikanDetails(id);
        }

        if (!mainData) return null;

        // Initialize enhanced ratings object
        const enhancedRatings = {
            anilist: null,
            mal: null,
            imdb: null,
            episodes: []
        };

        // Get AniList rating
        if (mainData.rating?.anilist && mainData.rating.anilist !== CONFIG.DEFAULTS.FALLBACK_RATING) {
            enhancedRatings.anilist = {
                score: mainData.rating.anilist,
                max: '10.0',
                source: 'AniList'
            };
        }

        // Get MAL rating if not already from Jikan
        if (source !== 'jikan') {
            try {
                const malResults = await this.searchJikan(mainData.title.english || mainData.title.romaji || mainData.title.display);
                if (malResults.results && malResults.results.length > 0) {
                    const malAnime = malResults.results[0];
                    if (malAnime.rating?.mal && malAnime.rating.mal !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                        enhancedRatings.mal = {
                            score: malAnime.rating.mal,
                            max: '10.0',
                            source: 'MyAnimeList',
                            malId: malAnime.id
                        };

                        // Get detailed MAL data including episode ratings
                        try {
                            const malDetails = await this.getJikanDetails(malAnime.id);
                            if (malDetails) {
                                enhancedRatings.mal.score = malDetails.rating.mal;
                                
                                // Try to get episode ratings from MAL
                                const episodeRatings = await this.getJikanEpisodeRatings(malAnime.id);
                                if (episodeRatings && episodeRatings.length > 0) {
                                    enhancedRatings.episodes = episodeRatings;
                                }
                            }
                        } catch (error) {
                            console.warn('Could not get detailed MAL data:', error);
                        }
                    }
                }
            } catch (error) {
                console.warn('Could not fetch MAL data:', error);
            }
        } else {
            // We already have MAL data
            if (mainData.rating?.mal && mainData.rating.mal !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                enhancedRatings.mal = {
                    score: mainData.rating.mal,
                    max: '10.0',
                    source: 'MyAnimeList',
                    malId: mainData.id
                };

                // Get episode ratings
                try {
                    const episodeRatings = await this.getJikanEpisodeRatings(mainData.id);
                    if (episodeRatings && episodeRatings.length > 0) {
                        enhancedRatings.episodes = episodeRatings;
                    }
                } catch (error) {
                    console.warn('Could not get episode ratings:', error);
                }
            }
        }

        // Try to get IMDB rating
        const searchTitle = mainData.title.english || mainData.title.romaji || mainData.title.display;
        if (searchTitle) {
            try {
                const omdbResults = await this.searchOMDBByTitle(searchTitle);
                if (omdbResults.length > 0) {
                    const imdbData = await this.getOMDBDetails(omdbResults[0].id);
                    if (imdbData && imdbData.rating?.imdb && imdbData.rating.imdb !== CONFIG.DEFAULTS.FALLBACK_RATING) {
                        enhancedRatings.imdb = {
                            score: imdbData.rating.imdb,
                            max: '10.0',
                            source: 'IMDB',
                            imdbId: imdbData.id
                        };
                    }
                }
            } catch (error) {
                console.warn('Could not fetch IMDB data:', error);
            }
        }

        // Enhance main data with all ratings
        mainData.enhancedRatings = enhancedRatings;
        
        // Calculate average rating
        const validRatings = [
            enhancedRatings.anilist?.score,
            enhancedRatings.mal?.score,
            enhancedRatings.imdb?.score
        ].filter(score => score && score !== CONFIG.DEFAULTS.FALLBACK_RATING).map(score => parseFloat(score));

        if (validRatings.length > 0) {
            mainData.averageRating = (validRatings.reduce((a, b) => a + b) / validRatings.length).toFixed(1);
            mainData.ratingCount = validRatings.length;
        }

        return mainData;
    }

    async getJikanEpisodeRatings(malId) {
        try {
            // Try to get episode data from Jikan
            const episodesData = await this.fetchFromJikan(`/anime/${malId}/episodes`);
            
            if (episodesData && episodesData.data) {
                return episodesData.data.map(episode => ({
                    number: episode.mal_id,
                    title: episode.title,
                    rating: episode.score || null,
                    aired: episode.aired,
                    duration: episode.duration
                })).filter(ep => ep.rating); // Only episodes with ratings
            }
        } catch (error) {
            console.warn('Could not fetch episode ratings:', error);
        }
        return [];
    }

    removeDuplicates(results) {
        const seen = new Set();
        return results.filter(anime => {
            const title = anime.title.display.toLowerCase();
            if (seen.has(title)) return false;
            seen.add(title);
            return true;
        });
    }

    sortByRelevance(results, query) {
        const lowerQuery = query.toLowerCase();
        
        return results.sort((a, b) => {
            const aTitle = a.title.display.toLowerCase();
            const bTitle = b.title.display.toLowerCase();
            
            // Exact match
            if (aTitle === lowerQuery) return -1;
            if (bTitle === lowerQuery) return 1;
            
            // Starts with query
            if (aTitle.startsWith(lowerQuery) && !bTitle.startsWith(lowerQuery)) return -1;
            if (bTitle.startsWith(lowerQuery) && !aTitle.startsWith(lowerQuery)) return 1;
            
            // Contains query
            const aIncludes = aTitle.includes(lowerQuery);
            const bIncludes = bTitle.includes(lowerQuery);
            
            if (aIncludes && !bIncludes) return -1;
            if (bIncludes && !aIncludes) return 1;
            
            // Sort by popularity
            return (b.popularity || 0) - (a.popularity || 0);
        });
    }

    // ===============================
    //   PUBLIC API METHODS
    // ===============================

    async search(query, page = 1) {
        if (!query || query.length < CONFIG.SEARCH.MIN_QUERY_LENGTH) {
            throw new Error(ERROR_MESSAGES.INVALID_QUERY);
        }

        try {
            return await this.searchAllSources(query.trim(), page);
        } catch (error) {
            console.error('Search error:', error);
            throw new Error(ERROR_MESSAGES.SEARCH_ERROR);
        }
    }

    async getAnimeDetails(id, source = 'anilist') {
        try {
            return await this.getEnhancedAnimeDetails(id, source);
        } catch (error) {
            console.error('Get details error:', error);
            throw new Error(ERROR_MESSAGES.API_ERROR);
        }
    }

    async getTrending() {
        try {
            return await this.getTrendingAniList();
        } catch (error) {
            console.error('Get trending error:', error);
            throw new Error(ERROR_MESSAGES.API_ERROR);
        }
    }

    async getTopRated() {
        try {
            return await this.getTopRatedAniList();
        } catch (error) {
            console.error('Get top rated error:', error);
            throw new Error(ERROR_MESSAGES.API_ERROR);
        }
    }

    async getNewReleases() {
        try {
            return await this.getNewReleasesAniList();
        } catch (error) {
            console.error('Get new releases error:', error);
            throw new Error(ERROR_MESSAGES.API_ERROR);
        }
    }

    // Clear cache manually
    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }

    // Get cache status
    getCacheStatus() {
        return {
            size: this.cache.size,
            maxSize: CONFIG.CACHE.MAX_SEARCH_CACHE,
            apis: Object.fromEntries(this.requestCounts)
        };
    }
}

// ===============================
//   INITIALIZE API
// ===============================

// Create global API instance
window.animeAPI = new AnimeAPI();

console.log('AnimeAPI initialized', {
    sources: ['AniList', 'Jikan', 'OMDB'],
    cacheEnabled: true,
    rateLimitingEnabled: true
});