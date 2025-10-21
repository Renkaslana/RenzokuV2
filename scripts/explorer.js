// ============================================
// EXPLORER.JS - Multi-tab Anime Explorer
// Handles all tab functionality and data management
// ============================================

// API Configuration
const UNLIMITED_API = 'https://www.sankavollerei.com/anime/unlimited';

// Global State Management
let allAnimeData = [];
let filteredAnimeData = [];
let currentTab = 'popular';
let currentPage = 1;
let currentLetter = 'all';
let currentYear = 'all';

// Pagination settings
const itemsPerPage = 24;

// Popular Anime List - Top 10 Curated by User
const POPULAR_ANIME_LIST = [
    {
        rank: 1,
        animeId: "sousou-no-frieren",
        slug: "sousou-frieren-sub-indo", // Slug yang benar untuk API
        title: "Sousou no Frieren",
        japaneseTitle: "葬送のフリーレン",
        rating: "9.2",
        status: "Completed",
        type: "TV",
        episodes: "28",
        year: "2023",
        genre: "Adventure, Drama, Fantasy",
        description: "Petualangan elf Frieren setelah kematian teman-temannya",
        popularity: 98,
        poster: "https://cdn.myanimelist.net/images/anime/1675/127908l.jpg",
        fallbackPlaceholder: {
            letter: "S",
            color: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", // Gold
            icon: "🧙‍♀️"
        }
    },
    {
        rank: 2,
        animeId: "solo-leveling",
        slug: "level-solo-sub-indo", // Slug yang benar untuk API
        title: "Solo Leveling",
        japaneseTitle: "俺だけレベルアップな件",
        rating: "9.0",
        status: "Ongoing",
        type: "TV",
        episodes: "12",
        year: "2024",
        genre: "Action, Adventure, Fantasy",
        description: "Cerita Sung Jin-Woo yang menjadi hunter terkuat",
        popularity: 96,
        poster: "https://cdn.myanimelist.net/images/anime/1448/147351l.jpg",
        fallbackPlaceholder: {
            letter: "S",
            color: "linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)", // Silver
            icon: "⚔️"
        }
    },
    {
        rank: 3,
        animeId: "kimetsu-no-yaiba-season-2",
        slug: "kimetsu-yaiba-season-2-sub-indo", // Slug yang benar untuk API
        title: "Kimetsu no Yaiba Season 2",
        japaneseTitle: "鬼滅の刃 遊郭編",
        rating: "8.9",
        status: "Completed",
        type: "TV",
        episodes: "11",
        year: "2021",
        genre: "Action, Supernatural, Historical",
        description: "Lanjutan petualangan Tanjiro di Entertainment District",
        popularity: 94,
        poster: "https://cdn.myanimelist.net/images/anime/1908/120036l.jpg", // Tambahkan ini
        fallbackPlaceholder: {
            letter: "K",
            color: "linear-gradient(135deg, #CD7F32 0%, #B87333 100%)", // Bronze
            icon: "👹"
        }
    },
    {
        rank: 4,
        animeId: "sword-art-online",
        slug: "sawo-sub-indo", // Slug yang benar untuk API
        title: "Sword Art Online",
        japaneseTitle: "ソードアート・オンライン",
        rating: "8.7",
        status: "Completed",
        type: "TV",
        episodes: "25",
        year: "2012",
        genre: "Action, Adventure, Romance",
        description: "Petualangan Kirito di dunia virtual SAO",
        popularity: 92,
        poster: "https://cdn.myanimelist.net/images/anime/11/39717l.jpg",
        fallbackPlaceholder: {
            letter: "S",
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Purple
            icon: "🗡️"
        }
    },
    {
        rank: 5,
        animeId: "overlord",
        slug: "olord-sub-indo", // Slug yang benar untuk API
        title: "Overlord",
        japaneseTitle: "オーバーロード",
        rating: "8.5",
        status: "Ongoing",
        type: "TV",
        episodes: "52",
        year: "2015",
        genre: "Action, Fantasy, Supernatural",
        description: "Cerita Momonga yang terjebak di dunia game",
        popularity: 90,
        poster: "https://cdn.myanimelist.net/images/anime/7/88019l.jpg",
        fallbackPlaceholder: {
            letter: "O",
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Purple
            icon: "💀"
        }
    },
    {
        rank: 6,
        animeId: "tensei-shitara-slime-datta-ken",
        slug: "tensei-shi-slime-sub-indo", // Slug yang benar untuk API
        title: "Tensei Shitara Slime Datta Ken",
        japaneseTitle: "転生したらスライムだった件",
        rating: "8.4",
        status: "Ongoing",
        type: "TV",
        episodes: "48",
        year: "2018",
        genre: "Adventure, Comedy, Fantasy",
        description: "Cerita Satoru yang bereinkarnasi menjadi slime",
        popularity: 88,
        poster: "https://cdn.myanimelist.net/images/anime/1394/93898l.jpg",
        fallbackPlaceholder: {
            letter: "T",
            color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // Pink
            icon: "🟦"
        }
    },
    {
        rank: 7,
        animeId: "violet-evergarden",
        slug: "vioevgrden-sub-indo", // Slug yang benar untuk API
        title: "Violet Evergarden",
        japaneseTitle: "ヴァイオレット・エヴァーガーデン",
        rating: "8.3",
        status: "Completed",
        type: "TV",
        episodes: "13",
        year: "2018",
        genre: "Drama, Slice of Life",
        description: "Perjalanan Violet mencari makna cinta dan emosi",
        popularity: 86,
        poster: "https://cdn.myanimelist.net/images/anime/1035/145305l.jpg",
        fallbackPlaceholder: {
            letter: "V",
            color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // Pink
            icon: "💙"
        }
    },
    {
        rank: 8,
        animeId: "shingeki-no-kyojin",
        slug: "shingekyo-subtitle-indonesia", // Slug yang benar untuk API
        title: "Shingeki no Kyojin",
        japaneseTitle: "進撃の巨人",
        rating: "8.2",
        status: "Completed",
        type: "TV",
        episodes: "75",
        year: "2013",
        genre: "Action, Drama, Fantasy",
        description: "Perjuangan umat manusia melawan Titan",
        popularity: 84,
        poster: "https://cdn.myanimelist.net/images/anime/10/47347l.jpg",
        fallbackPlaceholder: {
            letter: "S",
            color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue
            icon: "⚔️"
        }
    },
    {
        rank: 9,
        animeId: "spy-x-family",
        slug: "spy-family-sub-indo", // Slug yang benar untuk API
        title: "Spy x Family",
        japaneseTitle: "スパイファミリー",
        rating: "8.1",
        status: "Ongoing",
        type: "TV",
        episodes: "25",
        year: "2022",
        genre: "Action, Comedy, Family",
        description: "Keluarga palsu dengan spy, assassin, dan telepath",
        popularity: 82,
        poster: "https://cdn.myanimelist.net/images/anime/1441/122795l.jpg",
        fallbackPlaceholder: {
            letter: "S",
            color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue
            icon: "🕵️"
        }
    },
    {
        rank: 10,
        animeId: "grand-blue",
        slug: "grand-the-blue-subtitle-indonesia", // Slug yang benar untuk API
        title: "Grand Blue",
        japaneseTitle: "ぐらんぶる",
        rating: "8.0",
        status: "Completed",
        type: "TV",
        episodes: "12",
        year: "2018",
        genre: "Comedy, Slice of Life",
        description: "Komedi kampus tentang diving dan kehidupan mahasiswa",
        popularity: 80,
        poster: "https://cdn.myanimelist.net/images/anime/1011/92109l.jpg",
        fallbackPlaceholder: {
            letter: "G",
            color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue
            icon: "🏊‍♂️"
        }
    }
];

// Genre definitions (based on common anime genres)
const ANIME_GENRES = [
    { name: 'Action', icon: '⚔️', keywords: ['action', 'adventure', 'battle', 'fight', 'war'] },
    { name: 'Romance', icon: '💕', keywords: ['romance', 'love', 'romantic', 'couple', 'relationship'] },
    { name: 'Fantasy', icon: '🔮', keywords: ['fantasy', 'magic', 'supernatural', 'mystical', 'enchanted'] },
    { name: 'Comedy', icon: '😂', keywords: ['comedy', 'funny', 'humor', 'comic', 'laugh'] },
    { name: 'Drama', icon: '🎭', keywords: ['drama', 'emotional', 'serious', 'tragic', 'melodrama'] },
    { name: 'School', icon: '🎓', keywords: ['school', 'student', 'academy', 'high school', 'college'] },
    { name: 'Sci-Fi', icon: '🚀', keywords: ['sci-fi', 'science fiction', 'space', 'future', 'robot'] },
    { name: 'Horror', icon: '👻', keywords: ['horror', 'scary', 'ghost', 'monster', 'terror'] },
    { name: 'Slice of Life', icon: '🌸', keywords: ['slice of life', 'daily life', 'ordinary', 'realistic'] },
    { name: 'Sports', icon: '⚽', keywords: ['sports', 'athletic', 'competition', 'team', 'game'] }
];

// Initialize Explorer
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Explorer] Initializing Anime Explorer...');
    initTabSystem();
    loadUnlimitedAnime();
});

// ============================================
// TAB SYSTEM MANAGEMENT
// ============================================

function initTabSystem() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });
    
    
    console.log('[Explorer] Tab system initialized');
}

function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update active tab panel
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-panel`).classList.add('active');
    
    // Update current tab
    currentTab = tabName;
    
    // Load tab-specific content
    loadTabContent(tabName);
    
    console.log(`[Explorer] Switched to ${tabName} tab`);
}

function loadTabContent(tabName) {
    switch(tabName) {
        case 'popular':
            loadPopularContent();
            break;
        case 'alphabetical':
            loadAlphabeticalContent();
            break;
        case 'years':
            loadYearsContent();
            break;
    }
}

// ============================================
// POPULAR ANIME SYSTEM
// ============================================

// ============================================
// DATA LOADING
// ============================================

async function loadUnlimitedAnime() {
    try {
        showLoadingState();
        
        const response = await fetch(UNLIMITED_API);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && data.data.list) {
            // Flatten the data structure
            allAnimeData = data.data.list.flatMap(category => 
                category.animeList.map(anime => ({
                    ...anime,
                    startWith: category.startWith,
                    // Add mock data for features
                    popularityScore: Math.floor(Math.random() * 100),
                    releaseYear: generateRandomYear(),
                    genre: detectGenre(anime.title)
                }))
            );
            
            filteredAnimeData = [...allAnimeData];
            
            // Update stats
            updateExplorerStats();
            
            // Load initial content
            loadTabContent(currentTab);
            
            console.log(`[Explorer] Loaded ${allAnimeData.length} anime successfully`);
        } else {
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('[Explorer] Error loading anime data:', error);
        showErrorState('Gagal memuat data anime. Silakan refresh halaman.');
    }
}

function generateRandomYear() {
    // Generate random year between 2000-2024
    return Math.floor(Math.random() * 25) + 2000;
}

function detectGenre(title) {
    const titleLower = title.toLowerCase();
    for (const genre of ANIME_GENRES) {
        if (genre.keywords.some(keyword => titleLower.includes(keyword))) {
            return genre.name;
        }
    }
    return 'Other';
}

function updateExplorerStats() {
    // Update total anime count
    document.getElementById('total-anime').textContent = allAnimeData.length.toLocaleString();
    
    // Update years count
    const uniqueYears = new Set(allAnimeData.map(anime => anime.releaseYear));
    document.getElementById('total-years').textContent = uniqueYears.size;
}

// ============================================
// POPULAR TAB
// ============================================

function loadPopularContent() {
    console.log('[Explorer] Loading popular content...');
    
    // Langsung render popular anime list tanpa fetch Home API
    renderPopularRanking(POPULAR_ANIME_LIST);
    
    console.log('[Explorer] Popular content loaded successfully - No Home API used');
}

function renderPopularRanking(popularAnimeList) {
    const container = document.getElementById('popular-ranking');
    
    container.innerHTML = popularAnimeList.map(anime => {
        const color = getRankingColor(anime.rank);
        
        return `
            <div class="ranking-card" onclick="goToAnime('${anime.slug || anime.animeId}')">
                <div class="ranking-badge">${anime.rank}</div>
                <div class="ranking-poster">
                    ${anime.poster ? 
                        `<img src="${anime.poster}" alt="${anime.title}" class="anime-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <div class="ranking-placeholder" style="background: ${anime.fallbackPlaceholder.color}; display: none;">
                            <span class="anime-letter">${anime.fallbackPlaceholder.letter}</span>
                            <span class="anime-icon">${anime.fallbackPlaceholder.icon}</span>
                         </div>` :
                        `<div class="ranking-placeholder" style="background: ${anime.fallbackPlaceholder.color}">
                            <span class="anime-letter">${anime.fallbackPlaceholder.letter}</span>
                            <span class="anime-icon">${anime.fallbackPlaceholder.icon}</span>
                         </div>`
                    }
                </div>
                <div class="ranking-info">
                    <h3 class="ranking-title">${anime.title}</h3>
                    <p class="ranking-japanese">${anime.japaneseTitle}</p>
                    <div class="ranking-stats">
                        <span class="rating">⭐ ${anime.rating}</span>
                        <span class="year">📅 ${anime.year}</span>
                        <span class="status">${anime.status}</span>
                    </div>
                    <p class="ranking-genre">${anime.genre}</p>
                </div>
        </div>
        `;
    }).join('');
}

// Get ranking color based on rank
function getRankingColor(rank) {
    if (rank === 1) return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'; // Gold
    if (rank === 2) return 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)'; // Silver
    if (rank === 3) return 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)'; // Bronze
    if (rank <= 5) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; // Purple
    if (rank <= 7) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'; // Pink
    return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'; // Blue
}

// Fungsi untuk render anime card
function renderAnimeCard(anime, showTrending = false) {
    return `
        <div class="anime-card" onclick="goToAnime('${anime.animeId}')">
            <div class="anime-poster-placeholder">
                <span class="anime-letter">${anime.startWith}</span>
            </div>
            <div class="anime-info">
                <h3 class="anime-title">${anime.title}</h3>
                <p class="anime-id">${anime.animeId}</p>
                ${showTrending ? `<p class="anime-trend">🔥 Trending</p>` : ''}
            </div>
        </div>
    `;
}

// ============================================
// ALPHABETICAL TAB
// ============================================

function loadAlphabeticalContent() {
    if (allAnimeData.length === 0) return;
    
    renderAlphabetFilter();
    renderAlphabeticalGrid();
    initAlphabeticalSearch();
}

function renderAlphabetFilter() {
    const container = document.querySelector('.alphabet-filter');
    
    // Get unique letters
    const letters = [...new Set(allAnimeData.map(anime => anime.startWith))].sort();
    
    // Create filter buttons
    let filterHTML = '<button class="filter-btn active" data-letter="all">All</button>';
    
    letters.forEach(letter => {
        const count = allAnimeData.filter(anime => anime.startWith === letter).length;
        filterHTML += `
            <button class="filter-btn" data-letter="${letter}">
                ${letter} (${count})
            </button>
        `;
    });
    
    container.innerHTML = filterHTML;
    
    // Add event listeners
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const letter = btn.dataset.letter;
            filterByAlphabet(letter);
        });
    });
}

function filterByAlphabet(letter) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-letter="${letter}"]`).classList.add('active');
    
    // Filter data
    if (letter === 'all') {
        filteredAnimeData = [...allAnimeData];
    } else {
        filteredAnimeData = allAnimeData.filter(anime => anime.startWith === letter);
    }
    
    currentLetter = letter;
    currentPage = 1;
    
    renderAlphabeticalGrid();
    renderPagination('alphabetical');
}

function renderAlphabeticalGrid() {
    const container = document.getElementById('alphabetical-grid');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredAnimeData.slice(startIndex, endIndex);
    
    container.innerHTML = pageData.map(anime => renderAnimeCard(anime)).join('');
    
    renderPagination('alphabetical');
}

function initAlphabeticalSearch() {
    const searchInput = document.getElementById('alphabetical-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            if (query.trim() === '') {
                filteredAnimeData = currentLetter === 'all' ? 
                    [...allAnimeData] : 
                    allAnimeData.filter(anime => anime.startWith === currentLetter);
            } else {
                filteredAnimeData = allAnimeData.filter(anime =>
                    anime.title.toLowerCase().includes(query) ||
                    anime.animeId.toLowerCase().includes(query)
                );
            }
            
            currentPage = 1;
            renderAlphabeticalGrid();
        });
    }
}


// ============================================
// YEARS TAB
// ============================================

function loadYearsContent() {
    if (allAnimeData.length === 0) return;
    
    renderYearNavigation();
    renderYearStats();
    renderYearContent();
}

function renderYearNavigation() {
    const container = document.querySelector('.year-navigation');
    
    // Get unique years
    const years = [...new Set(allAnimeData.map(anime => anime.releaseYear))].sort((a, b) => b - a);
    
    let yearHTML = '<button class="year-btn active" data-year="all">All Years</button>';
    
    years.forEach(year => {
        const count = allAnimeData.filter(anime => anime.releaseYear === year).length;
        yearHTML += `
            <button class="year-btn" data-year="${year}">
                ${year} (${count})
            </button>
        `;
    });
    
    container.innerHTML = yearHTML;
    
    // Add event listeners
    container.querySelectorAll('.year-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const year = btn.dataset.year;
            filterByYear(year);
        });
    });
}

function filterByYear(year) {
    // Update active year button
    document.querySelectorAll('.year-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-year="${year}"]`).classList.add('active');
    
    // Filter data
    if (year === 'all') {
        filteredAnimeData = [...allAnimeData];
    } else {
        filteredAnimeData = allAnimeData.filter(anime => anime.releaseYear == year);
    }
    
    currentYear = year;
    renderYearContent();
}

function renderYearStats() {
    const container = document.getElementById('year-stats');
    
    const totalAnime = allAnimeData.length;
    const recentAnime = allAnimeData.filter(anime => anime.releaseYear >= 2020).length;
    const classicAnime = allAnimeData.filter(anime => anime.releaseYear < 2010).length;
    
    container.innerHTML = `
        <h3>📊 Year Statistics</h3>
        <p>Total: ${totalAnime} anime | Recent (2020+): ${recentAnime} | Classic (<2010): ${classicAnime}</p>
    `;
}

function renderYearContent() {
    const container = document.getElementById('year-content');
    
    container.innerHTML = filteredAnimeData.map(anime => renderAnimeCard(anime)).join('');
}


// ============================================
// PAGINATION
// ============================================

function renderPagination(type) {
    const container = document.getElementById(`${type}-pagination`);
    if (!container) return;
    
    const totalPages = Math.ceil(filteredAnimeData.length / itemsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${currentPage - 1}, '${type}')">
            ← Previous
        </button>
    `;
    
    // Page numbers (show max 5 pages)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i}, '${type}')">
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${currentPage + 1}, '${type}')">
            Next →
        </button>
    `;
    
    container.innerHTML = paginationHTML;
}

function changePage(page, type) {
    const totalPages = Math.ceil(filteredAnimeData.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    
    switch(type) {
        case 'alphabetical':
            renderAlphabeticalGrid();
            break;
        // Add other types as needed
    }
}

// ============================================
// NAVIGATION
// ============================================

function goToAnime(animeId) {
    window.location.href = `detail.html?slug=${animeId}`;
}

// ============================================
// UI STATES
// ============================================

function showLoadingState() {
    const containers = [
        'trending-grid',
        'alphabetical-grid',
        'year-content'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Memuat anime...</p>
                </div>
            `;
        }
    });
}

function showErrorState(message) {
    const containers = [
        'trending-grid',
        'alphabetical-grid',
        'year-content'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                </div>
            `;
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Console logging for debugging
console.log('[Explorer] Script loaded successfully');
