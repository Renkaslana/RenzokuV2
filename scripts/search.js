// Search API Configuration
const SEARCH_API_URL = 'https://www.sankavollerei.com/anime/search';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Get search query from URL parameters
function getSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
}

// Fetch anime search results
async function fetchAnimeSearchResults(query) {
    try {
        const endpoints = [
            `${SEARCH_API_URL}?keyword=${encodeURIComponent(query)}`,
            `${SEARCH_API_URL}/${encodeURIComponent(query)}`,
            `https://www.sankavollerei.com/anime/search?q=${encodeURIComponent(query)}`,
            `https://www.sankavollerei.com/anime/search?search=${encodeURIComponent(query)}`
        ];
        
        for (const url of endpoints) {
            try {
                console.log('Trying anime URL:', url);
                
                let response;
                try {
                    response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Referer': 'https://www.sankavollerei.com/',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        },
                        mode: 'cors',
                        credentials: 'omit'
                    });
                } catch (corsError) {
                    console.log('Direct API failed, trying CORS proxy...');
                    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
                    response = await fetch(proxyUrl);
                }
                
                if (!response.ok) {
                    if (response.status === 404) {
                        continue;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.status === 'Plana AI Detector') {
                    console.log('AI Detector blocked request');
                    continue;
                }
                
                if (result.status === 'success' && result.search_results) {
                    return result.search_results.map(item => ({ ...item, type: 'anime' }));
                } else if (result.status === 'success (fallback)' && result.search_results) {
                    return result.search_results.map(item => ({ ...item, type: 'anime' }));
                } else if (result.data && Array.isArray(result.data)) {
                    return result.data.map(item => ({ ...item, type: 'anime' }));
                } else if (Array.isArray(result)) {
                    return result.map(item => ({ ...item, type: 'anime' }));
                }
                
            } catch (error) {
                console.log(`Anime URL ${url} failed:`, error.message);
                continue;
            }
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching anime search results:', error);
        return [];
    }
}

// Fetch donghua search results
async function fetchDonghuaSearchResults(query) {
    try {
        const endpoints = [
            `${DONGHUA_SEARCH_API_URL}?keyword=${encodeURIComponent(query)}`,
            `${DONGHUA_SEARCH_API_URL}/${encodeURIComponent(query)}`,
            `https://www.sankavollerei.com/anime/donghua/search?q=${encodeURIComponent(query)}`,
            `https://www.sankavollerei.com/anime/donghua/search?search=${encodeURIComponent(query)}`
        ];
        
        for (const url of endpoints) {
            try {
                console.log('Trying donghua URL:', url);
                
                let response;
                try {
                    response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Referer': 'https://www.sankavollerei.com/',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        },
                        mode: 'cors',
                        credentials: 'omit'
                    });
                } catch (corsError) {
                    console.log('Direct API failed, trying CORS proxy...');
                    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
                    response = await fetch(proxyUrl);
                }
                
                if (!response.ok) {
                    if (response.status === 404) {
                        continue;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.status === 'Plana AI Detector') {
                    console.log('AI Detector blocked request');
                    continue;
                }
                
                if (result.status === 'success' && result.search_results) {
                    return result.search_results.map(item => ({ ...item, type: 'donghua' }));
                } else if (result.status === 'success (fallback)' && result.search_results) {
                    return result.search_results.map(item => ({ ...item, type: 'donghua' }));
                } else if (result.data && Array.isArray(result.data)) {
                    return result.data.map(item => ({ ...item, type: 'donghua' }));
                } else if (Array.isArray(result)) {
                    return result.map(item => ({ ...item, type: 'donghua' }));
                }
                
            } catch (error) {
                console.log(`Donghua URL ${url} failed:`, error.message);
                continue;
            }
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching donghua search results:', error);
        return [];
    }
}

// Fetch search results from API (searches both anime and donghua)
async function fetchSearchResults(query) {
    try {
        console.log('Searching for:', query);
        
        // Search both anime and donghua in parallel
        const [animeResults, donghuaResults] = await Promise.allSettled([
            fetchAnimeSearchResults(query),
            fetchDonghuaSearchResults(query)
        ]);
        
        let results = [];
        
        // Combine results from both sources
        if (animeResults.status === 'fulfilled' && animeResults.value) {
            results = [...results, ...animeResults.value];
        }
        
        if (donghuaResults.status === 'fulfilled' && donghuaResults.value) {
            results = [...results, ...donghuaResults.value];
        }
        
        console.log(`Found ${results.length} total results (${animeResults.status === 'fulfilled' ? animeResults.value?.length || 0 : 0} anime, ${donghuaResults.status === 'fulfilled' ? donghuaResults.value?.length || 0 : 0} donghua)`);
        
        return results;
        
    } catch (error) {
        console.error('Error fetching search results:', error);
        throw error;
    }
}

// Show loading state
function showLoading() {
    const loadingElement = document.getElementById('loading-state');
    const errorElement = document.getElementById('error-state');
    const resultsElement = document.getElementById('search-results');
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (errorElement) errorElement.style.display = 'none';
    if (resultsElement) resultsElement.style.display = 'none';
}

// Show error state
function showError(message) {
    const errorMessageElement = document.getElementById('error-message');
    const loadingElement = document.getElementById('loading-state');
    const errorElement = document.getElementById('error-state');
    const resultsElement = document.getElementById('search-results');
    
    if (errorMessageElement) errorMessageElement.textContent = message;
    if (loadingElement) loadingElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'flex';
    if (resultsElement) resultsElement.style.display = 'none';
}

// Show search results
function showResults() {
    const loadingElement = document.getElementById('loading-state');
    const errorElement = document.getElementById('error-state');
    const resultsElement = document.getElementById('search-results');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'none';
    if (resultsElement) resultsElement.style.display = 'block';
}

// Create search result card
function createSearchResultCard(item) {
    const card = document.createElement('div');
    card.className = 'search-result-card';
    
    const isDonghua = item.type === 'donghua';
    
    // Extract slug from URL - handle different URL formats
    let slug = item.slug;
    if (typeof slug === 'string') {
        if (isDonghua) {
            // Clean donghua slug
            slug = slug.replace(/^https?:\/\/[^\/]+\/anichin\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\/donghua\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\/detail\//, '');
            slug = slug.replace(/\/anichin\/episode\//, '');
            slug = slug.replace(/\/anichin\/detail\//, '');
            slug = slug.replace(/\/$/, '');
            slug = slug.replace(/-episode-\d+.*$/i, '');
            slug = slug.replace(/-tamat-subtitle-indonesia$/i, '');
        } else {
            // Clean anime slug
        slug = slug.replace(/^https?:\/\/[^\/]+\/anime\//, '');
        slug = slug.replace(/^https?:\/\/[^\/]+\/anime\/anime\//, '');
        slug = slug.replace(/^https?:\/\/[^\/]+\/anime\/detail\//, '');
        }
        slug = slug.replace(/\/$/, '');
        slug = slug.trim();
        slug = slug.replace(/^https?:\/\//, '');
        slug = slug.replace(/^[^\/]+\//, '');
        
        if (isDonghua) {
            slug = slug.replace(/^donghua\//, '');
        } else {
        slug = slug.replace(/^anime\//, '');
        }
        
        slug = slug.trim();
    }
    
    console.log('Original slug:', item.slug, 'Processed slug:', slug, 'Type:', item.type);
    
    // Create type badge
    const typeBadge = isDonghua 
        ? `<span class="anime-badge" style="background: #ff6b6b;">🐉 Donghua</span>`
        : `<span class="anime-badge" style="background: #4dabf7;">📺 Anime</span>`;
    
    // Create status badge
    const statusBadge = item.status === 'Ongoing' 
        ? `<span class="anime-badge status-ongoing">📺 ${item.status}</span>`
        : `<span class="anime-badge status-completed">✅ ${item.status}</span>`;
    
    // Create rating badge if available
    const ratingBadge = item.rating && item.rating !== '0' 
        ? `<span class="anime-badge rating">⭐ ${item.rating}</span>`
        : '';
    
    // Create episode count badge
    const episodeBadge = item.episode_count && item.episode_count !== '?'
        ? `<span class="anime-badge">📺 ${item.episode_count} Episode</span>`
        : '';
    
    card.innerHTML = `
        <img src="${item.poster}" alt="${item.title}" class="anime-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/220x320?text=No+Image'">
        <div class="anime-info">
            <h3 class="anime-title">${item.title}</h3>
            <div class="anime-meta">
                ${typeBadge}
                ${statusBadge}
                ${ratingBadge}
                ${episodeBadge}
            </div>
            <p class="anime-synopsis">${item.synopsis || 'Sinopsis tidak tersedia.'}</p>
        </div>
    `;
    
    // Add click event to navigate to detail page
    card.addEventListener('click', () => {
        console.log('Navigating to detail page with slug:', slug, 'type:', item.type);
        const detailUrl = isDonghua 
            ? `detail.html?slug=${encodeURIComponent(slug)}&type=donghua`
            : `detail.html?slug=${encodeURIComponent(slug)}`;
        window.location.href = detailUrl;
    });
    
    return card;
}

// Display search results
function displaySearchResults(results, query) {
    const container = document.getElementById('results-container');
    container.innerHTML = '';
    
    // Update search info
    document.getElementById('search-query').textContent = `"${query}"`;
    document.getElementById('search-count').textContent = `${results.length} hasil ditemukan`;
    
    if (!results || results.length === 0) {
        showErrorWithSuggestions(query);
        return;
    }
    
    results.forEach(anime => {
        const card = createSearchResultCard(anime);
        container.appendChild(card);
    });
    
    showResults();
}

// Fallback search using home API
async function fallbackSearch(query) {
    try {
        console.log('Trying fallback search with home API...');
        const response = await fetch('https://www.sankavollerei.com/anime/home', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.sankavollerei.com/'
            }
        });
        
        if (!response.ok) return [];
        
        const data = await response.json();
        if (data.status !== 'success' || !data.data) return [];
        
        // Search in ongoing and completed anime
        const allAnime = [...(data.data.ongoing_anime || []), ...(data.data.complete_anime || [])];
        const queryLower = query.toLowerCase();
        
        const results = allAnime.filter(anime => 
            anime.title.toLowerCase().includes(queryLower) ||
            anime.slug.toLowerCase().includes(queryLower)
        );
        
        console.log(`Fallback search found ${results.length} results`);
        return results;
        
    } catch (error) {
        console.error('Fallback search failed:', error);
        return [];
    }
}

// Show error with search suggestions
function showErrorWithSuggestions(query) {
    const errorMessage = document.getElementById('error-message');
    const errorActions = document.querySelector('.error-actions');
    
    // Clear existing suggestion buttons
    errorActions.innerHTML = '';
    
    if (!query) {
        errorMessage.innerHTML = `
            Kata kunci pencarian tidak ditemukan<br><br>
            <strong>💡 Saran pencarian:</strong><br>
            • Coba kata kunci yang lebih spesifik<br>
            • Gunakan nama anime yang lengkap<br>
            • Contoh: "overlord", "boruto", "one piece"
        `;
    } else {
        errorMessage.innerHTML = `
            Tidak ditemukan anime dengan kata kunci "${query}"<br><br>
            <strong>⚠️ Kemungkinan penyebab:</strong><br>
            • API Search sedang dibatasi oleh AI Detector<br>
            • Kata kunci terlalu spesifik<br>
            • Server sedang maintenance<br><br>
            <strong>💡 Saran pencarian:</strong><br>
            • Coba kata kunci yang lebih pendek<br>
            • Gunakan nama anime yang umum<br>
            • Contoh: "overlord", "boruto", "one piece"
        `;
    }
    
    // Add suggested search buttons
    const suggestions = ['overlord', 'boruto', 'one piece', 'demon slayer', 'attack on titan'];
    suggestions.forEach(suggestion => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-suggestion';
        btn.textContent = `🔍 ${suggestion}`;
        btn.onclick = () => {
            window.location.href = `search.html?q=${encodeURIComponent(suggestion)}`;
        };
        errorActions.appendChild(btn);
    });
    
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    document.getElementById('search-results').style.display = 'none';
}

// Initialize search page
async function initSearch() {
    const query = getSearchQuery();
    
    if (!query) {
        showErrorWithSuggestions('');
        return;
    }
    
    showLoading();
    
    try {
        let results = await fetchSearchResults(query);
        
        // If main search fails, try fallback search
        if (!results || results.length === 0) {
            console.log('Main search failed, trying fallback...');
            results = await fallbackSearch(query);
        }
        
        if (results && results.length > 0) {
            displaySearchResults(results, query);
        } else {
            console.log('Both main and fallback search failed');
            showErrorWithSuggestions(query);
        }
        
    } catch (error) {
        console.error('Search init error:', error);
        
        // Try fallback if main search throws error
        if (error.message.includes('AI Detector')) {
            console.log('AI Detector blocked, trying fallback...');
            try {
                const fallbackResults = await fallbackSearch(query);
                if (fallbackResults && fallbackResults.length > 0) {
                    displaySearchResults(fallbackResults, query);
                    return;
                }
            } catch (fallbackError) {
                console.error('Fallback search also failed:', fallbackError);
            }
        }
        
        showErrorWithSuggestions(query);
    }
}

// Search functionality for main page
function setupSearchFunctionality() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    let searchTimeout;
    
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
    
    // Auto-suggestions (simplified version)
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length >= 1) { // Changed from 2 to 1 for single character search
            searchTimeout = setTimeout(async () => {
                try {
                    console.log('Searching for suggestions:', query);
                    const results = await fetchSearchResults(query);
                    console.log('Suggestions found:', results.length);
                    displaySuggestions(results.slice(0, 5)); // Show only first 5 results
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                    hideSuggestions();
                }
            }, 300);
        } else {
            hideSuggestions();
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideSuggestions();
        }
    });
}

// Display search suggestions
function displaySuggestions(results) {
    const container = document.getElementById('search-suggestions');
    container.innerHTML = '';
    
    if (!results || results.length === 0) {
        hideSuggestions();
        return;
    }
    
    results.forEach(anime => {
        const item = document.createElement('div');
        item.className = 'search-suggestion-item';
        
        // Extract slug from URL - handle different URL formats
        let slug = anime.slug;
        if (typeof slug === 'string') {
            // Remove common URL prefixes with more specific regex
            slug = slug.replace(/^https?:\/\/[^\/]+\/anime\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/anime\/anime\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/anime\/detail\//, '');
            slug = slug.replace(/\/$/, ''); // Remove trailing slash
            slug = slug.trim();
            
            // Additional cleanup for common patterns
            slug = slug.replace(/^https?:\/\//, ''); // Remove any remaining protocol
            slug = slug.replace(/^[^\/]+\//, ''); // Remove domain part
            
            // Remove remaining 'anime/' prefix if exists
            slug = slug.replace(/^anime\//, '');
            
            // Final cleanup
            slug = slug.trim();
        }
        
        item.innerHTML = `
            <img src="${anime.poster}" alt="${anime.title}" class="suggestion-poster" onerror="this.src='https://via.placeholder.com/40x60?text=No+Image'">
            <div class="suggestion-info">
                <div class="suggestion-title">${anime.title}</div>
                <div class="suggestion-meta">${anime.status} • ${anime.type || 'TV'}</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            console.log('Navigating to detail page with slug:', slug);
            console.log('Original anime.slug:', anime.slug);
            console.log('Processed slug:', slug);
            window.location.href = `detail.html?slug=${encodeURIComponent(slug)}`;
        });
        
        container.appendChild(item);
    });
    
    container.style.display = 'block';
}

// Hide search suggestions
function hideSuggestions() {
    const container = document.getElementById('search-suggestions');
    container.style.display = 'none';
}

// Handle retry button
document.addEventListener('DOMContentLoaded', () => {
    const retryBtn = document.getElementById('btn-retry-search');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            location.reload();
        });
    }
});

// Initialize based on current page
if (window.location.pathname.includes('search.html')) {
    // This is the search results page
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    // This is the main page with search functionality
    document.addEventListener('DOMContentLoaded', setupSearchFunctionality);
}
