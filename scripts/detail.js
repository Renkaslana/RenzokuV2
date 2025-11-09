// API Configuration
const API_BASE_URL = 'https://www.sankavollerei.com/anime/anime';
const DONGHUA_API_BASE_URL = 'https://www.sankavollerei.com/anime/donghua/detail';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Get content type from URL parameters (anime or donghua)
function getContentType() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('type') || 'anime'; // Default to anime
}

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
    
    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    
    // Process slug to remove URL prefixes - ENHANCED REGEX
    if (typeof slug === 'string') {
        if (isDonghua) {
            // Remove donghua URL prefixes
            slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\/donghua\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\/detail\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/anichin\//, '');
            slug = slug.replace(/\/anichin\/episode\//, '');
            slug = slug.replace(/\/anichin\/detail\//, '');
            slug = slug.replace(/-episode-\d+.*$/i, '');
            slug = slug.replace(/-tamat-subtitle-indonesia$/i, '');
        } else {
            // Remove anime URL prefixes
            slug = slug.replace(/^https?:\/\/[^\/]+\/anime\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/anime\/anime\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/anime\/detail\//, '');
        }
        slug = slug.replace(/\/$/, ''); // Remove trailing slash
        slug = slug.trim();
        
        // Additional cleanup for common patterns
        slug = slug.replace(/^https?:\/\//, ''); // Remove any remaining protocol
        slug = slug.replace(/^[^\/]+\//, ''); // Remove domain part
        
        // Remove remaining prefix if exists
        if (isDonghua) {
            slug = slug.replace(/^donghua\//, '');
        } else {
            slug = slug.replace(/^anime\//, '');
        }
        
        // Final cleanup
        slug = slug.trim();
    }
    
    console.log('Processed slug:', slug, 'Type:', contentType);
    return slug;
}

// Fetch anime detail data from API
async function fetchAnimeDetail(slug) {
    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    
    try {
        console.log(`Fetching ${contentType} detail for slug:`, slug);
        
        // Use different endpoints based on content type
        let endpoints = [];
        
        if (isDonghua) {
            endpoints = [
                `${DONGHUA_API_BASE_URL}/${slug}`,
                `https://www.sankavollerei.com/anime/donghua/detail/${slug}`,
                `https://www.sankavollerei.com/anime/donghua/donghua/${slug}`,
                `https://www.sankavollerei.com/anime/donghua/info/${slug}`
            ];
        } else {
            endpoints = [
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
        }
        
        console.log('Will try', endpoints.length, 'different endpoints');
        
        for (let i = 0; i < endpoints.length; i++) {
            const url = endpoints[i];
            try {
                console.log(`[${i + 1}/${endpoints.length}] Trying detail URL:`, url);
                
                // Add timeout to prevent hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                let response;
                try {
                    response = await fetch(url, {
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
                } catch (corsError) {
                    console.log('Direct API failed, trying CORS proxy...');
                    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
                    response = await fetch(proxyUrl, {
                        signal: controller.signal
                    });
                }
                
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
                
                // Handle donghua response structure (data directly in root)
                if (isDonghua) {
                    if (result.status === 'Completed' || result.status === 'Ongoing' || result.title) {
                        console.log('✅ Found donghua detail data from:', url);
                        // Transform donghua response to match anime structure
                        return transformDonghuaResponse(result);
                    }
                } else {
                    // Handle anime response structure
                    if (result.status === 'success' && result.data) {
                        console.log('✅ Found anime detail data from:', url);
                        return result.data;
                    } else if (result.data && !result.status) {
                        console.log('✅ Found anime detail data (direct) from:', url);
                        return result.data;
                    }
                }
                
                console.log('❌ Invalid response structure, trying next endpoint...');
                continue;
                
            } catch (error) {
                console.log(`❌ URL ${url} failed:`, error.message);
                if (error.message.includes('perlindungan') || error.message.includes('AI Detector')) {
                    throw error;
                }
                if (error.name === 'AbortError') {
                    console.log('⏰ Request timeout, trying next endpoint...');
                    continue;
                }
                continue;
            }
        }
        
        console.log('❌ All detail endpoints failed');
        throw new Error(`Semua endpoint detail ${contentType} gagal`);
        
    } catch (error) {
        console.error(`Error fetching ${contentType} detail:`, error);
        throw error;
    }
}

// Transform donghua API response to match anime structure
function transformDonghuaResponse(donghuaData) {
    // Map episode_list to episode_lists format
    const episodeLists = (donghuaData.episodes_list || []).map((ep, index) => {
        // Extract episode number from episode string or slug
        let episodeNumber = index + 1;
        const episodeMatch = ep.episode?.match(/Episode\s+(\d+)/i) || ep.slug?.match(/episode-(\d+)/i);
        if (episodeMatch) {
            episodeNumber = parseInt(episodeMatch[1]);
        }
        
        return {
            episode_number: episodeNumber.toString(),
            episode: ep.episode || `Episode ${episodeNumber}`,
            slug: ep.slug || ep.url?.replace(/^\/anichin\/episode\//, '').replace(/\/$/, '') || ''
        };
    });
    
    // Extract slug from URL if needed
    let slug = donghuaData.slug || '';
    if (!slug && donghuaData.url) {
        slug = donghuaData.url.replace(/^\/anichin\/detail\//, '').replace(/\/$/, '');
    }
    
    return {
        title: donghuaData.title || '',
        japanese_title: donghuaData.alter_title || '',
        poster: donghuaData.poster || '',
        rating: donghuaData.rating || 'N/A',
        status: donghuaData.status || 'Unknown',
        type: donghuaData.type || 'Donghua',
        episode_count: donghuaData.episodes_count || (episodeLists.length > 0 ? episodeLists.length.toString() : '?'),
        duration: donghuaData.duration || '',
        release_date: donghuaData.released || donghuaData.released_on || '',
        studio: donghuaData.studio || '',
        synopsis: donghuaData.synopsis || '',
        genres: (donghuaData.genres || []).map(genre => ({
            name: genre.name || '',
            otakudesu_url: genre.url || ''
        })),
        episode_lists: episodeLists,
        recommendations: [], // Donghua API might not have recommendations
        slug: slug,
        network: donghuaData.network || '',
        country: donghuaData.country || '',
        season: donghuaData.season || ''
    };
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
    const statusText = anime.status || 'Unknown';
    const statusLower = statusText.toLowerCase();
    
    // Determine status class - handle various status formats
    let statusClass = 'ongoing';
    if (statusLower.includes('completed') || statusLower.includes('tamat') || statusLower.includes('selesai')) {
        statusClass = 'completed';
    } else if (statusLower.includes('ongoing') || statusLower.includes('berlangsung')) {
        statusClass = 'ongoing';
    }
    
    statusElement.textContent = statusText;
    statusElement.className = 'meta-value status-badge ' + statusClass;
    
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

// Episode List State Management
let allEpisodes = [];
let filteredEpisodes = [];
let displayedEpisodes = [];
let currentEpisodeView = 'grid';
let episodesPerPage = 20;
let currentEpisodePage = 1;

// Display episodes with pagination and search
function displayEpisodes(episodes) {
    if (!episodes || episodes.length === 0) {
        const container = document.getElementById('episodes-list');
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Tidak ada episode tersedia</p>';
        hideEpisodeControls();
        return;
    }
    
    // Store all episodes
    allEpisodes = [...episodes].reverse(); // Reverse to show latest first
    filteredEpisodes = [...allEpisodes];
    currentEpisodePage = 1;
    
    // Setup episode controls
    setupEpisodeControls();
    
    // Render episodes
    renderEpisodes();
}

// Setup episode controls (search, view toggle, pagination)
function setupEpisodeControls() {
    const searchInput = document.getElementById('episode-search-input');
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    const loadMoreBtn = document.getElementById('load-more-episodes');
    
    // Search functionality
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase().trim();
                filterEpisodes(query);
            }, 300);
        });
    }
    
    // View toggle functionality
    viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchEpisodeView(view);
        });
    });
    
    // Load more functionality
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentEpisodePage++;
            renderEpisodes();
        });
    }
    
    // Show controls
    updateEpisodeStats();
}

// Filter episodes by search query
function filterEpisodes(query) {
    if (!query) {
        filteredEpisodes = [...allEpisodes];
    } else {
        filteredEpisodes = allEpisodes.filter(episode => {
            const episodeNum = episode.episode_number || episode.episode?.match(/Episode\s+(\d+)/i)?.[1] || '';
            const episodeTitle = episode.episode || `Episode ${episodeNum}`;
            return episodeNum.includes(query) || 
                   episodeTitle.toLowerCase().includes(query) ||
                   episode.slug.toLowerCase().includes(query);
        });
    }
    
    currentEpisodePage = 1;
    renderEpisodes();
}

// Switch between grid and list view
function switchEpisodeView(view) {
    currentEpisodeView = view;
    const container = document.getElementById('episodes-list');
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    
    // Update active button
    viewToggleBtns.forEach(btn => {
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update container class
    if (view === 'list') {
        container.classList.add('compact-list');
    } else {
        container.classList.remove('compact-list');
    }
    
    // Re-render with new view
    renderEpisodes();
}

// Render episodes with pagination
function renderEpisodes() {
    const container = document.getElementById('episodes-list');
    const noEpisodesFound = document.getElementById('no-episodes-found');
    const pagination = document.getElementById('episode-pagination');
    
    container.innerHTML = '';
    
    if (filteredEpisodes.length === 0) {
        container.style.display = 'none';
        if (noEpisodesFound) noEpisodesFound.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
        updateEpisodeStats();
        return;
    }
    
    container.style.display = 'grid';
    if (noEpisodesFound) noEpisodesFound.style.display = 'none';
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredEpisodes.length / episodesPerPage);
    const startIndex = 0;
    const endIndex = currentEpisodePage * episodesPerPage;
    displayedEpisodes = filteredEpisodes.slice(startIndex, endIndex);
    
    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    const isCompact = currentEpisodeView === 'list';
    
    // Render episodes
    displayedEpisodes.forEach(episode => {
        const card = createEpisodeCard(episode, isDonghua, isCompact);
        container.appendChild(card);
    });
    
    // Update pagination
    const loadMoreBtn = document.getElementById('load-more-episodes');
    if (endIndex < filteredEpisodes.length) {
        if (pagination) {
            pagination.style.display = 'flex';
            const paginationInfo = document.getElementById('episode-pagination-info');
            if (paginationInfo) {
                paginationInfo.textContent = `Menampilkan ${displayedEpisodes.length} dari ${filteredEpisodes.length} episode`;
            }
            if (loadMoreBtn) {
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = 'Muat Lebih Banyak';
            }
        }
    } else {
        if (pagination) {
            pagination.style.display = 'flex';
            const paginationInfo = document.getElementById('episode-pagination-info');
            if (paginationInfo) {
                paginationInfo.textContent = `Semua ${filteredEpisodes.length} episode ditampilkan`;
            }
            if (loadMoreBtn) {
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'Semua Episode Ditampilkan';
            }
        }
    }
    
    updateEpisodeStats();
}

// Create episode card element
function createEpisodeCard(episode, isDonghua, isCompact) {
    const card = document.createElement('div');
    card.className = `episode-card${isCompact ? ' compact' : ''}`;
    card.style.cursor = 'pointer';
    
    const episodeNum = episode.episode_number || episode.episode?.match(/Episode\s+(\d+)/i)?.[1] || '';
    const episodeTitle = episode.episode || `Episode ${episodeNum}`;
    
    // Extract subtitle info if available
    const subtitleMatch = episodeTitle.match(/Subtitle\s+([^\)]+)/i);
    const subtitle = subtitleMatch ? subtitleMatch[1] : 'Indonesia';
    
    card.innerHTML = `
        <div class="episode-info${isCompact ? ' compact' : ''}">
            <div class="episode-number${isCompact ? ' compact' : ''}">${episodeNum}</div>
            <div class="episode-title-wrapper">
                <div class="episode-title${isCompact ? ' compact' : ''}">${episodeTitle}</div>
                ${isCompact ? `<div class="episode-subtitle">${subtitle}</div>` : ''}
            </div>
        </div>
        <span class="episode-icon${isCompact ? ' compact' : ''}">▶️</span>
    `;
    
    // Navigate to episode page
    card.addEventListener('click', () => {
        const episodeUrl = isDonghua 
            ? `episode.html?slug=${episode.slug}&type=donghua`
            : `episode.html?slug=${episode.slug}`;
        window.location.href = episodeUrl;
    });
    
    return card;
}

// Update episode statistics
function updateEpisodeStats() {
    const statsElement = document.getElementById('episode-stats');
    if (statsElement && allEpisodes.length > 0) {
        if (filteredEpisodes.length === allEpisodes.length) {
            statsElement.textContent = `${allEpisodes.length} Episode`;
        } else {
            statsElement.textContent = `${filteredEpisodes.length} dari ${allEpisodes.length} Episode`;
        }
    }
}

// Hide episode controls if no episodes
function hideEpisodeControls() {
    const controls = document.querySelector('.episode-controls');
    if (controls) {
        controls.style.display = 'none';
    }
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
    
    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    
    card.innerHTML = `
        <img src="${anime.poster}" alt="${anime.title}" class="anime-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/220x320?text=No+Image'">
        <div class="anime-info">
            <h3 class="anime-title">${anime.title}</h3>
        </div>
    `;
    
    // Add click event to navigate to detail page
    card.addEventListener('click', () => {
        let slug = anime.slug;
        
        // Clean slug if needed
        if (typeof slug === 'string') {
            if (isDonghua || anime.type === 'Donghua') {
                slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\//, '');
                slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\/detail\//, '');
                slug = slug.replace(/^https?:\/\/[^\/]+\/anichin\//, '');
                slug = slug.replace(/\/anichin\/detail\//, '');
                slug = slug.replace(/\/$/, '');
                slug = slug.trim();
                slug = slug.replace(/^https?:\/\//, '');
                slug = slug.replace(/^[^\/]+\//, '');
                slug = slug.replace(/^donghua\//, '');
                slug = slug.trim();
            }
        }
        
        const detailUrl = (isDonghua || anime.type === 'Donghua')
            ? `detail.html?slug=${encodeURIComponent(slug)}&type=donghua`
            : `detail.html?slug=${encodeURIComponent(slug)}`;
        window.location.href = detailUrl;
    });
    
    return card;
}

// Initialize the application
async function init() {
    // Setup episode preloading
    setupEpisodePreloading();
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

// Setup episode preloading for instant episode access
function setupEpisodePreloading() {
    // Preload episodes when user hovers over episode links
    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a[href*="episode.html"]');
        if (link) {
            const href = link.getAttribute('href');
            const slug = extractEpisodeSlugFromHref(href);
            if (slug) {
                // Preload episode data
                preloadEpisodeFromDetail(slug);
            }
        }
    });
    
    // Preload episodes when user clicks on episode links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href*="episode.html"]');
        if (link) {
            const href = link.getAttribute('href');
            const slug = extractEpisodeSlugFromHref(href);
            if (slug) {
                // Immediate preload for clicked episode
                preloadEpisodeFromDetail(slug, true);
            }
        }
    });
}

// Extract episode slug from href
function extractEpisodeSlugFromHref(href) {
    if (!href) return null;
    const match = href.match(/slug=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// Preload episode from detail page
async function preloadEpisodeFromDetail(slug, priority = false) {
    if (!slug) return;
    
    try {
        // Check if already cached
        if (window.EPISODE_CACHE && window.EPISODE_CACHE.has(slug)) {
            console.log('Episode already cached:', slug);
            return;
        }
        
        console.log(`${priority ? 'Priority' : 'Background'} preloading episode:`, slug);
        
        // Use the same API endpoints as episode.js
        const endpoints = [
            'https://www.sankavollerei.com/anime/episode',
            'https://api.sankavollerei.com/episode',
            'https://backup.sankavollerei.com/anime/episode'
        ];
        
        for (const baseUrl of endpoints) {
            try {
                const response = await fetch(`${baseUrl}/${slug}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://www.sankavollerei.com/',
                        'Origin': 'https://www.sankavollerei.com'
                    },
                    timeout: priority ? 5000 : 10000
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.status === 'success' && result.data) {
                        // Store in global cache for episode.js to use
                        if (!window.EPISODE_CACHE) {
                            window.EPISODE_CACHE = new Map();
                        }
                        window.EPISODE_CACHE.set(slug, {
                            data: result.data,
                            timestamp: Date.now()
                        });
                        console.log('Episode preloaded successfully:', slug);
                        return;
                    }
                }
            } catch (error) {
                console.log(`Preload failed for ${baseUrl}/${slug}:`, error.message);
                continue;
            }
        }
        
        console.log('All preload attempts failed for:', slug);
    } catch (error) {
        console.log('Preload error for:', slug, error.message);
    }
}

// Handle retry button
document.addEventListener('DOMContentLoaded', () => {
    const retryBtn = document.getElementById('btn-retry-detail');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            location.reload();
        });
    }
});

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

