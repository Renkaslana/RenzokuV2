// API Configuration
const API_BASE_URL = 'https://www.sankavollerei.com/anime/anime';

// Get slug from URL parameters
function getAnimeSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('slug');
}

// Fetch anime detail data from API
async function fetchAnimeDetail(slug) {
    try {
        console.log('Fetching anime detail for slug:', slug);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${API_BASE_URL}/${slug}`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        // Check for AI Detector response
        if (result.status === 'Plana AI Detector') {
            throw new Error('API sedang dalam mode perlindungan. Silakan coba lagi nanti.');
        }
        
        if (result.status === 'success' && result.data) {
            return result.data;
        } else {
            throw new Error('Data tidak valid dari API');
        }
    } catch (error) {
        console.error('Error fetching anime detail:', error);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. Server mungkin sedang sibuk.');
        }
        
        throw error;
    }
}

// Show loading state
function showLoading() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('detail-content').style.display = 'none';
}

// Show error state
function showError(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    document.getElementById('detail-content').style.display = 'none';
    document.getElementById('error-message').textContent = message;
}

// Show content
function showContent() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('detail-content').style.display = 'block';
}

// Update page title
function updatePageTitle(title) {
    document.title = `${title} - Renzoku`;
}

// Display anime details
function displayAnimeDetail(anime) {
    // Update page title
    updatePageTitle(anime.title);
    
    // Hero section
    document.getElementById('backdrop-img').src = anime.poster;
    document.getElementById('backdrop-img').alt = anime.title;
    document.getElementById('anime-poster').src = anime.poster;
    document.getElementById('anime-poster').alt = anime.title;
    document.getElementById('anime-rating').textContent = anime.rating || 'N/A';
    
    // Title and subtitle
    document.getElementById('anime-title').textContent = anime.title;
    document.getElementById('anime-japanese-title').textContent = anime.japanese_title || '';
    
    // Meta information
    const statusElement = document.getElementById('anime-status');
    statusElement.textContent = anime.status || 'Unknown';
    statusElement.className = 'meta-value status-badge ' + 
        (anime.status?.toLowerCase() === 'completed' ? 'completed' : 'ongoing');
    
    document.getElementById('anime-type').textContent = anime.type || '-';
    document.getElementById('anime-episodes').textContent = anime.episode_count || '-';
    document.getElementById('anime-duration').textContent = anime.duration || '-';
    document.getElementById('anime-release').textContent = anime.release_date || '-';
    document.getElementById('anime-studio').textContent = anime.studio || '-';
    
    // Genres
    displayGenres(anime.genres);
    
    // Batch download
    if (anime.batch && anime.batch.otakudesu_url) {
        const batchSection = document.getElementById('batch-download');
        const batchLink = document.getElementById('batch-link');
        batchSection.style.display = 'block';
        batchLink.href = anime.batch.otakudesu_url;
    }
    
    // Synopsis
    document.getElementById('anime-synopsis').textContent = anime.synopsis || 'Sinopsis tidak tersedia.';
    
    // Episodes
    displayEpisodes(anime.episode_lists);
    
    // Recommendations
    displayRecommendations(anime.recommendations);
    
    // Show content
    showContent();
}

// Display genres
function displayGenres(genres) {
    const container = document.getElementById('anime-genres');
    container.innerHTML = '';
    
    if (!genres || genres.length === 0) {
        return;
    }
    
    genres.forEach(genre => {
        const tag = document.createElement('a');
        tag.href = genre.otakudesu_url;
        tag.target = '_blank';
        tag.className = 'genre-tag';
        tag.textContent = genre.name;
        container.appendChild(tag);
    });
}

// Display episodes
function displayEpisodes(episodes) {
    const container = document.getElementById('episodes-list');
    container.innerHTML = '';
    
    if (!episodes || episodes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Tidak ada episode tersedia</p>';
        return;
    }
    
    // Reverse to show latest episode first
    const reversedEpisodes = [...episodes].reverse();
    
    reversedEpisodes.forEach(episode => {
        const card = document.createElement('div');
        card.className = 'episode-card';
        card.style.cursor = 'pointer';
        
        card.innerHTML = `
            <div class="episode-info">
                <div class="episode-number">${episode.episode_number}</div>
                <div class="episode-title">Episode ${episode.episode_number}</div>
            </div>
            <span class="episode-icon">▶️</span>
        `;
        
        // Navigate to episode page
        card.addEventListener('click', () => {
            window.location.href = `episode.html?slug=${episode.slug}`;
        });
        
        container.appendChild(card);
    });
}

// Display recommendations
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendations-list');
    container.innerHTML = '';
    
    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1 / -1;">Tidak ada rekomendasi tersedia</p>';
        return;
    }
    
    recommendations.forEach(anime => {
        const card = createRecommendationCard(anime);
        container.appendChild(card);
    });
}

// Create recommendation card (reuse from home page)
function createRecommendationCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    
    card.innerHTML = `
        <img src="${anime.poster}" alt="${anime.title}" class="anime-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/220x320?text=No+Image'">
        <div class="anime-info">
            <h3 class="anime-title">${anime.title}</h3>
        </div>
    `;
    
    // Add click event to navigate to detail page
    card.addEventListener('click', () => {
        window.location.href = `detail.html?slug=${anime.slug}`;
    });
    
    return card;
}

// Initialize the application
async function init() {
    const slug = getAnimeSlug();
    
    if (!slug) {
        showError('Slug anime tidak ditemukan. Silakan kembali ke halaman home.');
        return;
    }
    
    showLoading();
    
    try {
        const animeData = await fetchAnimeDetail(slug);
        displayAnimeDetail(animeData);
    } catch (error) {
        console.error('Init error:', error);
        
        let errorMessage = 'Gagal memuat detail anime. ';
        
        if (error.message.includes('timeout')) {
            errorMessage += 'Server sedang sibuk atau lambat. Silakan coba lagi.';
        } else if (error.message.includes('perlindungan')) {
            errorMessage += 'API sedang dalam mode perlindungan. Tunggu beberapa menit dan coba lagi.';
        } else if (error.message.includes('CORS')) {
            errorMessage += 'Masalah CORS. Pastikan menggunakan localhost server.';
        } else {
            errorMessage += 'Periksa koneksi internet Anda atau coba lagi nanti.';
        }
        
        showError(errorMessage);
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

