// Lightweight Search Functions - Minimal API Calls
// This file provides basic search functionality without auto-suggestions

// Safe search functions with namespace
const LightSearch = {
    // Setup basic search functionality (no auto-suggestions)
    setupSearchFunctionality() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (!searchInput || !searchBtn) {
            console.log('Search elements not found on this page');
            return;
        }
        
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
        
        // No auto-suggestions to reduce API calls
        console.log('Lightweight search setup complete - no auto-suggestions');
    }
};

// Auto-initialize search functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    LightSearch.setupSearchFunctionality();
});
