// Search API Configuration
const SEARCH_API_URL = 'https://www.sankavollerei.com/anime/search';

// Get search query from URL parameters
function getSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
}

// Fetch search results from API
async function fetchSearchResults(query) {
    try {
        console.log('Searching for:', query);
        const url = `${SEARCH_API_URL}/${encodeURIComponent(query)}`;
        console.log('API URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.status === 'success' && result.search_results) {
            console.log('Found results:', result.search_results.length);
            return result.search_results;
        } else if (result.status === 'success (fallback)' && result.search_results) {
            // Handle fallback response
            console.log('Found fallback results:', result.search_results.length);
            return result.search_results;
        } else {
            console.log('No results found');
            return [];
        }
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
function createSearchResultCard(anime) {
    const card = document.createElement('div');
    card.className = 'search-result-card';
    
    // Extract slug from URL
    const slug = anime.slug.replace('https://otakudesu.best/anime/', '').replace('/', '');
    
    // Create status badge
    const statusBadge = anime.status === 'Ongoing' 
        ? `<span class="anime-badge status-ongoing">📺 ${anime.status}</span>`
        : `<span class="anime-badge status-completed">✅ ${anime.status}</span>`;
    
    // Create rating badge if available
    const ratingBadge = anime.rating && anime.rating !== '0' 
        ? `<span class="anime-badge rating">⭐ ${anime.rating}</span>`
        : '';
    
    // Create episode count badge
    const episodeBadge = anime.episode_count && anime.episode_count !== '?'
        ? `<span class="anime-badge">📺 ${anime.episode_count} Episode</span>`
        : '';
    
    card.innerHTML = `
        <img src="${anime.poster}" alt="${anime.title}" class="anime-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/220x320?text=No+Image'">
        <div class="anime-info">
            <h3 class="anime-title">${anime.title}</h3>
            <div class="anime-meta">
                ${statusBadge}
                ${ratingBadge}
                ${episodeBadge}
            </div>
            <p class="anime-synopsis">${anime.synopsis || 'Sinopsis tidak tersedia.'}</p>
        </div>
    `;
    
    // Add click event to navigate to detail page
    card.addEventListener('click', () => {
        window.location.href = `detail.html?slug=${slug}`;
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
            <strong>💡 Saran pencarian:</strong><br>
            • Coba kata kunci yang lebih spesifik<br>
            • Gunakan nama anime yang lengkap<br>
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
        const results = await fetchSearchResults(query);
        displaySearchResults(results, query);
    } catch (error) {
        showErrorWithSuggestions(query);
        console.error('Search init error:', error);
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
        
        const slug = anime.slug.replace('https://otakudesu.best/anime/', '').replace('/', '');
        
        item.innerHTML = `
            <img src="${anime.poster}" alt="${anime.title}" class="suggestion-poster" onerror="this.src='https://via.placeholder.com/40x60?text=No+Image'">
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
}

// Hide search suggestions
function hideSuggestions() {
    const container = document.getElementById('search-suggestions');
    container.style.display = 'none';
}

// Initialize based on current page
if (window.location.pathname.includes('search.html')) {
    // This is the search results page
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    // This is the main page with search functionality
    document.addEventListener('DOMContentLoaded', setupSearchFunctionality);
}
