// API Configuration
const API_URL = 'https://www.sankavollerei.com/anime/home';

// Fetch anime data from API
async function fetchAnimeData() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            return result.data;
        } else {
            throw new Error('Data tidak valid dari API');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Create anime card element
function createAnimeCard(anime, type = 'ongoing') {
    const card = document.createElement('div');
    card.className = 'anime-card';
    
    // Create card HTML
    const episodeInfo = type === 'ongoing' 
        ? `<span class="anime-badge episode">📺 ${anime.current_episode}</span>
           <span class="anime-badge">${anime.release_day}</span>`
        : `<span class="anime-badge episode">✅ ${anime.episode_count} Episode</span>
           <span class="anime-badge rating">⭐ ${anime.rating}</span>`;
    
    const dateInfo = type === 'ongoing'
        ? `Rilis: ${anime.newest_release_date}`
        : `Selesai: ${anime.last_release_date}`;
    
    card.innerHTML = `
        <img src="${anime.poster}" alt="${anime.title}" class="anime-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/220x320?text=No+Image'">
        <div class="anime-info">
            <h3 class="anime-title">${anime.title}</h3>
            <div class="anime-meta">
                ${episodeInfo}
            </div>
            <p class="anime-date">${dateInfo}</p>
        </div>
    `;
    
    // Add click event to navigate to detail page
    card.addEventListener('click', () => {
        const slug = anime.slug.replace('https://otakudesu.best/anime/', '').replace('/', '');
        window.location.href = `detail.html?slug=${slug}`;
    });
    
    return card;
}

// Display ongoing anime
function displayOngoingAnime(animeList) {
    const container = document.getElementById('ongoing-container');
    container.innerHTML = '';
    
    if (!animeList || animeList.length === 0) {
        container.innerHTML = '<p class="error-message">Tidak ada anime ongoing yang tersedia</p>';
        return;
    }
    
    animeList.forEach(anime => {
        const card = createAnimeCard(anime, 'ongoing');
        container.appendChild(card);
    });
}

// Display completed anime
function displayCompletedAnime(animeList) {
    const container = document.getElementById('completed-container');
    container.innerHTML = '';
    
    if (!animeList || animeList.length === 0) {
        container.innerHTML = '<p class="error-message">Tidak ada anime yang selesai</p>';
        return;
    }
    
    animeList.forEach(anime => {
        const card = createAnimeCard(anime, 'completed');
        container.appendChild(card);
    });
}

// Show error message
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="error-message">
            <p>❌ ${message}</p>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                Coba Lagi
            </button>
        </div>
    `;
}

// Initialize the application
async function init() {
    try {
        // Fetch data from API
        const data = await fetchAnimeData();
        
        // Display ongoing anime
        if (data.ongoing_anime) {
            displayOngoingAnime(data.ongoing_anime);
        } else {
            showError('ongoing-container', 'Data anime ongoing tidak ditemukan');
        }
        
        // Display completed anime
        if (data.complete_anime) {
            displayCompletedAnime(data.complete_anime);
        } else {
            showError('completed-container', 'Data anime selesai tidak ditemukan');
        }
        
    } catch (error) {
        // Show error in both containers
        showError('ongoing-container', 'Gagal memuat data anime. Periksa koneksi internet Anda.');
        showError('completed-container', 'Gagal memuat data anime. Periksa koneksi internet Anda.');
    }
}

// Smooth scroll for navigation (only for internal links)
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Only prevent default for internal anchor links (#)
        if (href.startsWith('#')) {
            e.preventDefault();
            
            // Remove active class from all links
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Scroll to section
            if (href === '#home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (href === '#ongoing') {
                document.getElementById('ongoing-container').scrollIntoView({ behavior: 'smooth' });
            } else if (href === '#completed') {
                document.getElementById('completed-container').scrollIntoView({ behavior: 'smooth' });
            }
        }
        // For external links (like schedule.html), let the browser handle navigation normally
    });
});

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Initialize search functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Search functionality will be handled by search.js
    console.log('Index page loaded, search functionality handled by search.js');
});

