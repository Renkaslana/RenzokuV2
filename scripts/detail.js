// API Configuration
const API_BASE_URL = 'https://www.sankavollerei.com/anime/anime';

// Get slug from URL parameters
function getAnimeSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    let slug = urlParams.get('slug');
    
    if (!slug) {
        console.log('No slug found in URL parameters');
        return null;
    }
    
    // Decode URL-encoded slug
    slug = decodeURIComponent(slug);
    console.log('Raw slug from URL:', slug);
    
    // Process slug to remove URL prefixes - ENHANCED REGEX
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
    
    console.log('Processed slug:', slug);
    return slug;
}

// Fetch anime detail data from API
async function fetchAnimeDetail(slug) {
    try {
        console.log('Fetching anime detail for slug:', slug);
        
        // Try different API endpoints and methods
        const endpoints = [
            `${API_BASE_URL}/${slug}`,
            `https://www.sankavollerei.com/anime/anime/${slug}`,
            `https://www.sankavollerei.com/anime/detail/${slug}`,
            `https://www.sankavollerei.com/anime/info/${slug}`,
            // Try with different slug formats
            `https://www.sankavollerei.com/anime/anime/${slug}-sub-indo`,
            `https://www.sankavollerei.com/anime/anime/${slug}-sub`,
            `https://www.sankavollerei.com/anime/anime/${slug}-dub`,
            // Try without sub-indo suffix
            `https://www.sankavollerei.com/anime/anime/${slug.replace('-sub-indo', '')}`,
            `https://www.sankavollerei.com/anime/anime/${slug.replace('-sub', '')}`,
            `https://www.sankavollerei.com/anime/anime/${slug.replace('-dub', '')}`
        ];
        
        console.log('Will try', endpoints.length, 'different endpoints');
        
        for (let i = 0; i < endpoints.length; i++) {
            const url = endpoints[i];
            try {
                console.log(`[${i + 1}/${endpoints.length}] Trying detail URL:`, url);
                
                // Add timeout to prevent hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout
                
                const response = await fetch(url, {
                    signal: controller.signal,
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
                
                clearTimeout(timeoutId);
                
                console.log(`Response status for ${url}:`, response.status);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        console.log('404 - Endpoint not found, trying next...');
                        continue;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                console.log('API Response for', url, ':', result);
                
                // Check for AI Detector response
                if (result.status === 'Plana AI Detector') {
                    console.log('AI Detector blocked request:', result.message);
                    throw new Error('API sedang dalam mode perlindungan. Silakan coba lagi nanti.');
                }
                
                if (result.status === 'success' && result.data) {
                    console.log('✅ Found anime detail data from:', url);
                    return result.data;
                } else if (result.data && !result.status) {
                    // Some APIs return data directly
                    console.log('✅ Found anime detail data (direct) from:', url);
                    return result.data;
                } else {
                    console.log('❌ Invalid response structure, trying next endpoint...');
                    continue;
                }
                
            } catch (error) {
                console.log(`❌ URL ${url} failed:`, error.message);
                if (error.message.includes('perlindungan') || error.message.includes('AI Detector')) {
                    throw error; // Don't try other URLs if AI blocked
                }
                if (error.name === 'AbortError') {
                    console.log('⏰ Request timeout, trying next endpoint...');
                    continue;
                }
                continue;
            }
        }
        
        console.log('❌ All detail endpoints failed');
        throw new Error('Semua endpoint detail anime gagal');
        
    } catch (error) {
        console.error('Error fetching anime detail:', error);
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
    console.log('Showing error:', message);
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    document.getElementById('detail-content').style.display = 'none';
    document.getElementById('error-message').textContent = message;
}

// Fallback detail search using home API
async function fallbackDetailSearch(slug) {
    try {
        console.log('Trying fallback detail search with home API for slug:', slug);
        const response = await fetch('https://www.sankavollerei.com/anime/home', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.sankavollerei.com/'
            }
        });
        
        if (!response.ok) {
            console.log('Home API response not ok:', response.status);
            return null;
        }
        
        const data = await response.json();
        if (data.status !== 'success' || !data.data) {
            console.log('Home API data invalid:', data);
            return null;
        }
        
        // Search in ongoing and completed anime
        const allAnime = [...(data.data.ongoing_anime || []), ...(data.data.complete_anime || [])];
        console.log('Total anime in home API:', allAnime.length);
        
        // Try different matching strategies
        const matchingStrategies = [
            // Exact match
            item => item.slug === slug,
            // Contains match
            item => item.slug.includes(slug),
            // Reverse contains match
            item => slug.includes(item.slug),
            // Match without sub-indo suffix
            item => item.slug === slug.replace('-sub-indo', ''),
            // Match without sub suffix
            item => item.slug === slug.replace('-sub', ''),
            // Match without dub suffix
            item => item.slug === slug.replace('-dub', ''),
            // Partial match
            item => item.slug.split('-').some(part => slug.includes(part))
        ];
        
        let anime = null;
        for (let i = 0; i < matchingStrategies.length; i++) {
            anime = allAnime.find(matchingStrategies[i]);
            if (anime) {
                console.log(`✅ Found anime using strategy ${i + 1}:`, anime.title, 'slug:', anime.slug);
                break;
            }
        }
        
        if (!anime) {
            console.log('❌ No anime found in home API with any matching strategy');
            console.log('Available slugs:', allAnime.map(a => a.slug).slice(0, 10));
            return null;
        }
        
        // Create basic anime detail structure
        const fallbackData = {
            title: anime.title,
            poster: anime.poster,
            slug: anime.slug,
            status: anime.status || 'Unknown',
            rating: anime.rating || 'N/A',
            synopsis: 'Sinopsis tidak tersedia untuk anime ini. Data ini diambil dari daftar anime yang sedang tayang/selesai.',
            episode_lists: [],
            recommendations: [],
            genres: [],
            type: anime.type || 'TV',
            episode_count: anime.episode_count || '?',
            duration: anime.duration || '24 min',
            release_date: anime.release_date || '-',
            studio: anime.studio || '-',
            japanese_title: anime.japanese_title || '',
            batch: anime.batch || null
        };
        
        console.log('✅ Fallback detail search successful:', fallbackData.title);
        return fallbackData;
        
    } catch (error) {
        console.error('❌ Fallback detail search failed:', error);
        return null;
    }
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
    console.log('=== DETAIL PAGE INIT START ===');
    const slug = getAnimeSlug();
    
    if (!slug) {
        console.log('❌ No slug found, showing error');
        showError('Slug anime tidak ditemukan. Silakan kembali ke halaman home.');
        return;
    }
    
    console.log('✅ Slug found:', slug);
    console.log('Current URL:', window.location.href);
    console.log('URL search params:', window.location.search);
    
    showLoading();
    
    try {
        console.log('🔄 Starting main detail API fetch...');
        let animeData = await fetchAnimeDetail(slug);
        
        // If main detail API fails, try fallback
        if (!animeData) {
            console.log('❌ Main detail API failed, trying fallback...');
            animeData = await fallbackDetailSearch(slug);
        }
        
        if (animeData) {
            console.log('✅ Anime data found, displaying...');
            displayAnimeDetail(animeData);
        } else {
            console.log('❌ No anime data found from any source');
            throw new Error('Tidak dapat menemukan detail anime');
        }
        
    } catch (error) {
        console.error('❌ Init error:', error);
        
        // Try fallback if main API throws error
        if (error.message.includes('perlindungan') || error.message.includes('AI Detector')) {
            console.log('🔄 AI Detector blocked, trying fallback...');
            try {
                const fallbackData = await fallbackDetailSearch(slug);
                if (fallbackData) {
                    console.log('✅ Fallback successful, displaying...');
                    displayAnimeDetail(fallbackData);
                    return;
                }
            } catch (fallbackError) {
                console.error('❌ Fallback detail search also failed:', fallbackError);
            }
        }
        
        let errorMessage = 'Gagal memuat detail anime. ';
        
        if (error.message.includes('timeout')) {
            errorMessage += 'Server sedang sibuk atau lambat. Silakan coba lagi.';
        } else if (error.message.includes('perlindungan')) {
            errorMessage += 'API sedang dalam mode perlindungan. Tunggu beberapa menit dan coba lagi.';
        } else if (error.message.includes('CORS')) {
            errorMessage += 'Masalah CORS. Pastikan menggunakan localhost server.';
        } else if (error.message.includes('Tidak dapat menemukan')) {
            errorMessage += 'Anime tidak ditemukan dalam database.';
        } else {
            errorMessage += 'Periksa koneksi internet Anda atau coba lagi nanti.';
        }
        
        console.log('❌ Showing error message:', errorMessage);
        showError(errorMessage);
    }
    
    console.log('=== DETAIL PAGE INIT END ===');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

