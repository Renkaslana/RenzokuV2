// Safe Search Functions - Optimized Version
// This file provides search functionality with caching and rate limiting

// Search API Configuration
const SEARCH_API_URL = 'https://www.sankavollerei.com/anime/search';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Cache untuk suggestions
const suggestionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

// Rate limiting
let lastSearchTime = 0;
const MIN_SEARCH_INTERVAL = 2000; // 2 detik minimum antar search

// Safe search functions with namespace
const SafeSearch = {
    // Check if we can make a search request (rate limiting)
    canMakeSearch() {
        const now = Date.now();
        if (now - lastSearchTime < MIN_SEARCH_INTERVAL) {
            console.log('Rate limited: Please wait before searching again');
            return false;
        }
        return true;
    },

    // Check if we have cached suggestions
    getCachedSuggestions(query) {
        const cached = suggestionCache.get(query.toLowerCase());
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Using cached suggestions for:', query);
            return cached.data;
        }
        return null;
    },

    // Cache suggestions
    cacheSuggestions(query, data) {
        suggestionCache.set(query.toLowerCase(), {
            data: data,
            timestamp: Date.now()
        });
        console.log('Cached suggestions for:', query);
    },

    // Fetch search results from API (with rate limiting)
    async fetchSearchResults(query) {
        // Check rate limiting
        if (!this.canMakeSearch()) {
            return [];
        }

        // Check cache first
        const cached = this.getCachedSuggestions(query);
        if (cached) {
            return cached;
        }

        try {
            console.log('Fetching search results for:', query);
            lastSearchTime = Date.now();
            
            let response;
            try {
                response = await fetch(`${SEARCH_API_URL}/${encodeURIComponent(query)}`);
            } catch (corsError) {
                console.log('Direct API failed, trying CORS proxy...');
                // Use CORS proxy as fallback
                const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${SEARCH_API_URL}/${encodeURIComponent(query)}`)}`;
                response = await fetch(proxyUrl);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Search API Response:', result);
            
            let searchResults = [];
            if (result.status === 'success' && result.search_results) {
                searchResults = result.search_results;
            } else if (result.status === 'success (fallback)' && result.search_results) {
                searchResults = result.search_results;
            }
            
            // Cache the results
            this.cacheSuggestions(query, searchResults);
            
            return searchResults;
        } catch (error) {
            console.error('Error fetching search results:', error);
            return [];
        }
    },

    // Display search suggestions (optimized)
    displaySuggestions(results) {
        const container = document.getElementById('search-suggestions');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!results || results.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        // Limit to 3 suggestions for better performance
        const limitedResults = results.slice(0, 3);
        
        limitedResults.forEach(anime => {
            const item = document.createElement('div');
            item.className = 'search-suggestion-item';
            
            const slug = anime.slug.replace('https://otakudesu.best/anime/', '').replace('/', '');
            
            item.innerHTML = `
                <img src="${anime.poster}" alt="${anime.title}" class="suggestion-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/40x60?text=No+Image'">
                <div class="suggestion-info">
                    <div class="suggestion-title">${anime.title}</div>
                    <div class="suggestion-meta">${anime.status} • ${anime.type || 'TV'}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                window.location.href = `detail.html?slug=${slug}`;
            });
            
            container.appendChild(item);
        });
        
        container.style.display = 'block';
    },

    // Hide search suggestions
    hideSuggestions() {
        const container = document.getElementById('search-suggestions');
        if (container) {
            container.style.display = 'none';
        }
    },

    // Setup search functionality for any page (optimized)
    setupSearchFunctionality() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (!searchInput || !searchBtn) {
            console.log('Search elements not found on this page');
            return;
        }
        
        let searchTimeout;
        let isSearching = false;
        
        // Search on button click
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            console.log('Search button clicked, query:', query);
            if (query) {
                console.log('Redirecting to search page with query:', query);
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            } else {
                console.log('No query entered');
            }
        });
        
        // Search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
        
        // Auto-suggestions (optimized with longer debounce and rate limiting)
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            // Only search if query is 2+ characters and not currently searching
            if (query.length >= 2 && !isSearching) {
                searchTimeout = setTimeout(async () => {
                    // Check rate limiting
                    if (!this.canMakeSearch()) {
                        console.log('Rate limited: Skipping suggestions');
                        return;
                    }
                    
                    isSearching = true;
                    try {
                        console.log('Searching for suggestions:', query);
                        const results = await this.fetchSearchResults(query);
                        console.log('Suggestions found:', results.length);
                        this.displaySuggestions(results);
                    } catch (error) {
                        console.error('Error fetching suggestions:', error);
                        this.hideSuggestions();
                    } finally {
                        isSearching = false;
                    }
                }, 800); // Increased debounce to 800ms
            } else if (query.length < 2) {
                this.hideSuggestions();
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSuggestions();
            }
        });
    }
};

// Auto-initialize search functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    SafeSearch.setupSearchFunctionality();
});
