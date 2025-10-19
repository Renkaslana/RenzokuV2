// API Configuration
const API_BASE_URL = 'https://www.sankavollerei.com/anime/episode';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Multiple API endpoints for redundancy
const EPISODE_ENDPOINTS = [
    'https://www.sankavollerei.com/anime/episode',
    'https://api.sankavollerei.com/episode',
    'https://backup.sankavollerei.com/anime/episode'
];

// Rate limiting configuration
const RATE_LIMIT = {
    maxRequests: 5,
    timeWindow: 60000, // 1 minute
    requests: []
};

// Episode cache
const EPISODE_CACHE = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Episode preloading system
const EPISODE_PRELOAD_CACHE = new Map();
const PRELOAD_DURATION = 10 * 60 * 1000; // 10 minutes

// Request queue to prevent overwhelming API
const REQUEST_QUEUE = [];
let isProcessingQueue = false;

// Get slug from URL parameters
function getEpisodeSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('slug');
}

// Rate limiting check
function checkRateLimit() {
    const now = Date.now();
    // Remove old requests outside time window
    RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => now - time < RATE_LIMIT.timeWindow);
    
    if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
        const oldestRequest = Math.min(...RATE_LIMIT.requests);
        const waitTime = RATE_LIMIT.timeWindow - (now - oldestRequest);
        return waitTime;
    }
    
    RATE_LIMIT.requests.push(now);
    return 0;
}

// Wait for rate limit
async function waitForRateLimit() {
    const waitTime = checkRateLimit();
    if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
}

// Check cache for episode data
function getCachedEpisode(slug) {
    // Check global cache from detail page first
    if (window.EPISODE_CACHE && window.EPISODE_CACHE.has(slug)) {
        const globalCached = window.EPISODE_CACHE.get(slug);
        if (Date.now() - globalCached.timestamp < CACHE_DURATION) {
            console.log('Using global cached episode data for:', slug);
            // Move to local cache
            cacheEpisode(slug, globalCached.data);
            window.EPISODE_CACHE.delete(slug);
            return globalCached.data;
        }
    }
    
    // Check main cache
    const cached = EPISODE_CACHE.get(slug);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Using cached episode data for:', slug);
        return cached.data;
    }
    
    // Check preload cache
    const preloaded = EPISODE_PRELOAD_CACHE.get(slug);
    if (preloaded && Date.now() - preloaded.timestamp < PRELOAD_DURATION) {
        console.log('Using preloaded episode data for:', slug);
        // Move to main cache
        cacheEpisode(slug, preloaded.data);
        EPISODE_PRELOAD_CACHE.delete(slug);
        return preloaded.data;
    }
    
    return null;
}

// Cache episode data
function cacheEpisode(slug, data) {
    EPISODE_CACHE.set(slug, {
        data: data,
        timestamp: Date.now()
    });
    console.log('Cached episode data for:', slug);
}

// Preload episode data (for instant loading)
async function preloadEpisode(slug) {
    if (EPISODE_PRELOAD_CACHE.has(slug)) {
        console.log('Episode already preloaded:', slug);
        return;
    }
    
    try {
        console.log('Preloading episode:', slug);
        const data = await fetchEpisodeFromEndpoint(EPISODE_ENDPOINTS[0], slug);
        if (data) {
            EPISODE_PRELOAD_CACHE.set(slug, {
                data: data,
                timestamp: Date.now()
            });
            console.log('Episode preloaded successfully:', slug);
        }
    } catch (error) {
        console.log('Preload failed for:', slug, error.message);
    }
}

// Preload next/previous episodes
function preloadAdjacentEpisodes(episode) {
    if (episode.next_episode) {
        const nextSlug = extractEpisodeSlug(episode.next_episode.slug);
        if (nextSlug) {
            setTimeout(() => preloadEpisode(nextSlug), 1000);
        }
    }
    
    if (episode.prev_episode) {
        const prevSlug = extractEpisodeSlug(episode.prev_episode.slug);
        if (prevSlug) {
            setTimeout(() => preloadEpisode(prevSlug), 1500);
        }
    }
}

// Extract episode slug from URL
function extractEpisodeSlug(url) {
    if (!url) return null;
    const match = url.match(/episode\/([^\/]+)/);
    return match ? match[1] : null;
}

// Process request queue
async function processRequestQueue() {
    if (isProcessingQueue || REQUEST_QUEUE.length === 0) return;
    
    isProcessingQueue = true;
    
    while (REQUEST_QUEUE.length > 0) {
        const request = REQUEST_QUEUE.shift();
        try {
            await waitForRateLimit();
            const result = await request.fn();
            request.resolve(result);
        } catch (error) {
            request.reject(error);
        }
    }
    
    isProcessingQueue = false;
}

// Queue request to prevent API overwhelming
function queueRequest(fn) {
    return new Promise((resolve, reject) => {
        REQUEST_QUEUE.push({ fn, resolve, reject });
        processRequestQueue();
    });
}

// Fetch episode data from API with retry mechanism
async function fetchEpisodeData(slug, maxRetries = 3) {
    // Check cache first
    const cachedData = getCachedEpisode(slug);
    if (cachedData) {
        return cachedData;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Episode fetch attempt ${attempt}/${maxRetries} for slug: ${slug}`);
            
            // Wait for rate limit
            await waitForRateLimit();
            
            // Try multiple endpoints
            for (const baseUrl of EPISODE_ENDPOINTS) {
                try {
                    const response = await fetchEpisodeFromEndpoint(baseUrl, slug);
                    if (response) {
                        // Cache successful response
                        cacheEpisode(slug, response);
                        return response;
                    }
                } catch (endpointError) {
                    console.log(`Endpoint ${baseUrl} failed:`, endpointError.message);
                    continue;
                }
            }
            
            throw new Error('All endpoints failed');
            
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Exponential backoff: wait longer between retries
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Fetch from specific endpoint
async function fetchEpisodeFromEndpoint(baseUrl, slug) {
    try {
        // Try direct API call first
        let response;
        try {
            response = await fetch(`${baseUrl}/${slug}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://www.sankavollerei.com/',
                    'Origin': 'https://www.sankavollerei.com',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                timeout: 10000 // 10 second timeout
            });
        } catch (corsError) {
            console.log('Direct API failed, trying CORS proxy...');
            // Use CORS proxy as fallback
            const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${baseUrl}/${slug}`)}`;
            response = await fetch(proxyUrl, {
                timeout: 15000 // Longer timeout for proxy
            });
        }
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Episode not found');
            } else if (response.status === 429) {
                throw new Error('Rate limited by server');
            } else if (response.status >= 500) {
                throw new Error('Server error');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Check for AI Detector response
        if (result.status === 'Plana AI Detector') {
            throw new Error('API blocked by AI Detector');
        }
        
        if (result.status === 'success' && result.data) {
            return result.data;
        } else if (result.data && !result.status) {
            // Some APIs return data directly
            return result.data;
        } else {
            throw new Error('Invalid response structure from API');
        }
    } catch (error) {
        console.error('Endpoint fetch error:', error);
        throw error;
    }
}

// Show loading state with progress
function showLoading() {
    const loadingState = document.getElementById('loading-state');
    const episodeContent = document.getElementById('episode-content');
    const errorState = document.getElementById('error-state');
    
    if (loadingState) {
        loadingState.style.display = 'flex';
        loadingState.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Memuat episode...</div>
            <div class="loading-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill"></div>
                </div>
                <div class="progress-text" id="progress-text">0%</div>
            </div>
        `;
    }
    
    if (episodeContent) {
        episodeContent.style.display = 'none';
    }
    
    if (errorState) {
        errorState.style.display = 'none';
    }
    
    // Start progress animation
    animateProgress();
}

// Animate loading progress
function animateProgress() {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (!progressFill || !progressText) return;
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90; // Don't complete until actual load
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
        
        if (progress >= 90) {
            clearInterval(interval);
        }
    }, 200);
    
    // Store interval for cleanup
    window.loadingProgressInterval = interval;
}

// Complete loading progress
function completeProgress() {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill && progressText) {
        progressFill.style.width = '100%';
        progressText.textContent = '100%';
    }
    
    // Clear interval
    if (window.loadingProgressInterval) {
        clearInterval(window.loadingProgressInterval);
        window.loadingProgressInterval = null;
    }
}

// Show error state with detailed messages
function showError(message, errorType = 'general') {
    const errorMessage = document.getElementById('error-message');
    const errorContainer = document.getElementById('error-state');
    
    // Create detailed error message based on error type
    let detailedMessage = message;
    let suggestion = '';
    
    switch (errorType) {
        case 'ai-detector':
            detailedMessage = 'Server sedang dalam mode perlindungan';
            suggestion = 'Tunggu 2-3 menit dan coba lagi. Jangan terlalu sering mengakses episode.';
            break;
        case 'not-found':
            detailedMessage = 'Episode tidak ditemukan';
            suggestion = 'Episode mungkin belum tersedia atau telah dihapus.';
            break;
        case 'rate-limit':
            detailedMessage = 'Terlalu banyak permintaan';
            suggestion = 'Tunggu sebentar sebelum mencoba lagi.';
            break;
        case 'server-error':
            detailedMessage = 'Server sedang bermasalah';
            suggestion = 'Coba lagi dalam beberapa menit.';
            break;
        case 'network':
            detailedMessage = 'Masalah koneksi internet';
            suggestion = 'Periksa koneksi internet Anda dan coba lagi.';
            break;
        case 'timeout':
            detailedMessage = 'Koneksi terlalu lambat';
            suggestion = 'Periksa kecepatan internet Anda.';
            break;
        default:
            suggestion = 'Periksa koneksi internet Anda atau coba lagi nanti.';
    }
    
    if (errorMessage) {
        errorMessage.innerHTML = `
            <div class="error-main">${detailedMessage}</div>
            <div class="error-suggestion">${suggestion}</div>
        `;
    }
    
    if (errorContainer) {
        errorContainer.style.display = 'flex';
    }
    
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('episode-content').style.display = 'none';
}

// Show content
function showContent() {
    // Complete progress animation
    completeProgress();
    
    // Small delay to show 100% completion
    setTimeout(() => {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'none';
        document.getElementById('episode-content').style.display = 'block';
    }, 300);
}

// Update page title
function updatePageTitle(episodeTitle) {
    document.title = `${episodeTitle} - Renzoku Anime`;
}

// Setup video player with fallback sources
function setupVideoPlayer(videoPlayer, episode) {
    if (!videoPlayer || !episode) return;
    
    // Primary stream URL
    const primaryUrl = episode.stream_url;
    
    if (primaryUrl) {
        videoPlayer.src = primaryUrl;
        
        // Add error handling for video load failures
        videoPlayer.addEventListener('error', (e) => {
            console.log('Primary video source failed, trying fallback...');
            handleVideoError(videoPlayer, episode);
        });
        
        // Add load success handler
        videoPlayer.addEventListener('loadeddata', () => {
            console.log('Video loaded successfully');
        });
    } else {
        console.warn('No stream URL provided for episode');
        handleVideoError(videoPlayer, episode);
    }
}

// Handle video loading errors
function handleVideoError(videoPlayer, episode) {
    // Try alternative sources if available
    const alternativeSources = [
        episode.alternative_stream_url,
        episode.backup_stream_url,
        episode.mirror_url
    ].filter(Boolean);
    
    if (alternativeSources.length > 0) {
        console.log('Trying alternative video sources...');
        tryAlternativeVideoSource(videoPlayer, alternativeSources, 0);
    } else {
        console.error('No alternative video sources available');
        showVideoError(videoPlayer);
    }
}

// Try alternative video sources
function tryAlternativeVideoSource(videoPlayer, sources, index) {
    if (index >= sources.length) {
        showVideoError(videoPlayer);
        return;
    }
    
    const source = sources[index];
    console.log(`Trying alternative source ${index + 1}/${sources.length}: ${source}`);
    
    videoPlayer.src = source;
    
    videoPlayer.addEventListener('error', () => {
        console.log(`Alternative source ${index + 1} failed, trying next...`);
        tryAlternativeVideoSource(videoPlayer, sources, index + 1);
    }, { once: true });
    
    videoPlayer.addEventListener('loadeddata', () => {
        console.log(`Alternative source ${index + 1} loaded successfully`);
    }, { once: true });
}

// Show video error message
function showVideoError(videoPlayer) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'video-error';
    errorDiv.innerHTML = `
        <div class="video-error-content">
            <h3>⚠️ Video Tidak Dapat Dimuat</h3>
            <p>Video episode tidak tersedia atau mengalami masalah teknis.</p>
            <p>Silakan coba lagi atau gunakan link download di bawah.</p>
        </div>
    `;
    
    // Replace video player with error message
    videoPlayer.parentNode.replaceChild(errorDiv, videoPlayer);
}

// Extract anime slug from URL
function extractAnimeSlug(url) {
    // URL format: https://otakudesu.best/anime/slug-sub-indo/
    const match = url.match(/anime\/([^\/]+)/);
    return match ? match[1] : null;
}

// Display episode content
function displayEpisode(episode) {
    // Debug: Log episode data structure
    console.log('Episode data received:', episode);
    console.log('Download URLs:', episode.download_urls);
    
    // Update page title
    updatePageTitle(episode.episode);
    
    // Episode title
    const episodeTitle = document.getElementById('episode-title');
    if (episodeTitle) {
        episodeTitle.textContent = episode.episode;
    }
    
    // Anime link
    const animeSlug = extractAnimeSlug(episode.anime.slug);
    const animeLink = document.getElementById('anime-link');
    if (animeLink) {
        if (animeSlug) {
            animeLink.href = `detail.html?slug=${animeSlug}`;
        } else {
            animeLink.style.display = 'none';
        }
    }
    
    // Video player - set to default stream with fallback
    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer) {
        setupVideoPlayer(videoPlayer, episode);
    }
    
    // Episode navigation
    setupEpisodeNavigation(episode);
    
    // Download links
    displayDownloadLinks(episode.download_urls);
    
    // Preload adjacent episodes for instant navigation
    preloadAdjacentEpisodes(episode);
    
    // Show content
    showContent();
}

// Setup episode navigation
function setupEpisodeNavigation(episode) {
    const prevBtn = document.getElementById('prev-episode');
    const nextBtn = document.getElementById('next-episode');
    
    // Check if navigation elements exist
    if (!prevBtn || !nextBtn) {
        console.log('Episode navigation elements not found, skipping navigation setup');
        return;
    }
    
    // Previous episode
    if (episode.has_previous_episode && episode.previous_episode) {
        prevBtn.style.display = 'flex';
        prevBtn.onclick = () => {
            window.location.href = `episode.html?slug=${episode.previous_episode.slug}`;
        };
    } else {
        prevBtn.style.display = 'none';
    }
    
    // Next episode
    if (episode.has_next_episode && episode.next_episode) {
        nextBtn.style.display = 'flex';
        nextBtn.onclick = () => {
            window.location.href = `episode.html?slug=${episode.next_episode.slug}`;
        };
    } else {
        nextBtn.style.display = 'none';
    }
}

// Display download links
function displayDownloadLinks(downloadUrls) {
    console.log('=== displayDownloadLinks called ===');
    console.log('downloadUrls:', downloadUrls);
    
    const mkvContainer = document.getElementById('mkv-downloads');
    const mp4Grid = document.getElementById('mp4-grid');
    const mkvGrid = document.getElementById('mkv-grid');
    
    console.log('mkvContainer found:', !!mkvContainer);
    console.log('mp4Grid found:', !!mp4Grid);
    console.log('mkvGrid found:', !!mkvGrid);
    
    // Check if containers exist
    if (!mkvContainer || !mp4Grid || !mkvGrid) {
        console.log('Download containers not found, skipping download links setup');
        return;
    }
    
    // Clear existing content
    mp4Grid.innerHTML = '';
    mkvGrid.innerHTML = '';
    
    if (!downloadUrls) {
        mp4Grid.innerHTML = '<p class="no-downloads">Tidak ada link download tersedia.</p>';
        return;
    }
    
    // Debug: Log structure once
    console.log('Download URLs structure:', downloadUrls);
    console.log('Download URLs type:', typeof downloadUrls);
    console.log('Download URLs keys:', downloadUrls ? Object.keys(downloadUrls) : 'null');
    
    // Process MP4 downloads - try different possible structures
    let mp4Downloads = null;
    let mkvDownloads = null;
    
    // Try different possible structures
    if (downloadUrls.mp4 && Array.isArray(downloadUrls.mp4)) {
        mp4Downloads = downloadUrls.mp4;
    } else if (downloadUrls.downloads && downloadUrls.downloads.mp4) {
        mp4Downloads = downloadUrls.downloads.mp4;
    } else if (downloadUrls.download && downloadUrls.download.mp4) {
        mp4Downloads = downloadUrls.download.mp4;
    } else if (Array.isArray(downloadUrls)) {
        // If downloadUrls is directly an array, treat as MP4
        mp4Downloads = downloadUrls;
    }
    
    // Try different possible structures for MKV
    if (downloadUrls.mkv && Array.isArray(downloadUrls.mkv)) {
        mkvDownloads = downloadUrls.mkv;
    } else if (downloadUrls.downloads && downloadUrls.downloads.mkv) {
        mkvDownloads = downloadUrls.downloads.mkv;
    } else if (downloadUrls.download && downloadUrls.download.mkv) {
        mkvDownloads = downloadUrls.download.mkv;
    }
    
    console.log('MP4 downloads found:', mp4Downloads);
    console.log('MKV downloads found:', mkvDownloads);
    
    // Process MP4 downloads
    if (mp4Downloads && mp4Downloads.length > 0) {
        mp4Downloads.forEach(download => {
            const resolutionDiv = createDownloadResolution(download);
            mp4Grid.appendChild(resolutionDiv);
        });
    } else {
        mp4Grid.innerHTML = '<p style="color: rgba(255,255,255,0.6); text-align: center; padding: 20px;">Tidak ada download MP4 tersedia</p>';
    }
    
    // Process MKV downloads
    if (mkvDownloads && mkvDownloads.length > 0) {
        mkvContainer.style.display = 'block';
        mkvDownloads.forEach(download => {
            const resolutionDiv = createDownloadResolution(download);
            mkvGrid.appendChild(resolutionDiv);
        });
    } else {
        mkvContainer.style.display = 'none';
    }
}


// Create download card
function createDownloadCard(download, format) {
    const card = document.createElement('div');
    card.className = 'download-card';
    
    const header = document.createElement('div');
    header.className = 'download-header';
    
    const resolution = document.createElement('span');
    resolution.className = 'download-resolution';
    resolution.textContent = download.resolution;
    header.appendChild(resolution);
    
    const formatTag = document.createElement('span');
    formatTag.className = 'download-format';
    formatTag.textContent = format;
    header.appendChild(formatTag);
    
    card.appendChild(header);
    
    const providersContainer = document.createElement('div');
    providersContainer.className = 'download-providers';
    
    // Handle the correct structure from API
    if (download.urls && Array.isArray(download.urls)) {
        download.urls.forEach(provider => {
            const providerBtn = document.createElement('a');
            providerBtn.href = provider.url;
            providerBtn.target = '_blank';
            providerBtn.className = 'download-btn';
            providerBtn.textContent = provider.provider;
            
            providersContainer.appendChild(providerBtn);
        });
    }
    
    card.appendChild(providersContainer);
    
    return card;
}

// Create download resolution section
function createDownloadResolution(download) {
    console.log('Creating download resolution for:', download);
    
    const resolutionDiv = document.createElement('div');
    resolutionDiv.className = 'download-resolution';
    
    // Handle different resolution field names
    const resolution = download.resolution || download.quality || download.size || 'Unknown';
    
    const title = document.createElement('div');
    title.className = 'resolution-title';
    title.innerHTML = `<span>📺</span> ${resolution}`;
    
    const linksContainer = document.createElement('div');
    linksContainer.className = 'download-links';
    
    // Try different possible URL structures
    let urls = null;
    
    if (download.urls && Array.isArray(download.urls)) {
        urls = download.urls;
    } else if (download.links && Array.isArray(download.links)) {
        urls = download.links;
    } else if (download.downloads && Array.isArray(download.downloads)) {
        urls = download.downloads;
    } else if (download.providers && Array.isArray(download.providers)) {
        urls = download.providers;
    }
    
    console.log('URLs found for resolution:', urls);
    
    if (urls && urls.length > 0) {
        urls.forEach((urlItem, index) => {
            let url, provider;
            
            // Handle different URL structures
            if (typeof urlItem === 'string') {
                url = urlItem;
                provider = getProviderName(url);
            } else if (typeof urlItem === 'object' && urlItem !== null) {
                // Try different possible object structures
                url = urlItem.url || urlItem.link || urlItem.href || urlItem.src || urlItem.download_url;
                provider = urlItem.provider || urlItem.name || urlItem.title || urlItem.host || getProviderName(url);
                
                // If no URL found in object, skip
                if (!url) {
                    // Only log first few warnings to avoid spam
                    if (index < 3) {
                        console.warn(`No URL found in download object ${index}:`, urlItem);
                    }
                    return;
                }
            } else {
                // Only log first few warnings to avoid spam
                if (index < 3) {
                    console.warn(`Invalid URL item type ${index}:`, typeof urlItem, urlItem);
                }
                return;
            }
            
            // Validate final URL
            if (!url || typeof url !== 'string' || !url.trim()) {
                // Only log first few warnings to avoid spam
                if (index < 3) {
                    console.warn(`Invalid final URL ${index}:`, url);
                }
                return;
            }
            
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.className = 'download-link';
            link.textContent = provider || getProviderName(url);
            linksContainer.appendChild(link);
        });
    } else {
        const noLinks = document.createElement('span');
        noLinks.style.color = 'rgba(255,255,255,0.6)';
        noLinks.textContent = 'Tidak ada link tersedia';
        linksContainer.appendChild(noLinks);
    }
    
    resolutionDiv.appendChild(title);
    resolutionDiv.appendChild(linksContainer);
    
    return resolutionDiv;
}

// Get provider name from URL
function getProviderName(url) {
    // Check if url is a string
    if (typeof url !== 'string') {
        console.warn('getProviderName received non-string parameter:', typeof url, url);
        return 'Download';
    }
    
    // Check if url is empty or invalid
    if (!url || url.trim() === '') {
        return 'Download';
    }
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('odfiles')) return 'ODFiles';
    if (urlLower.includes('pdrain')) return 'Pdrain';
    if (urlLower.includes('acefile')) return 'Acefile';
    if (urlLower.includes('gofile')) return 'GoFile';
    if (urlLower.includes('mega')) return 'Mega';
    if (urlLower.includes('kfiles')) return 'KFiles';
    if (urlLower.includes('mediafire')) return 'MediaFire';
    if (urlLower.includes('zippyshare')) return 'ZippyShare';
    if (urlLower.includes('drive.google')) return 'Google Drive';
    if (urlLower.includes('dropbox')) return 'Dropbox';
    
    // Extract domain name as fallback
    try {
        const domain = new URL(url).hostname;
        return domain.replace('www.', '').split('.')[0];
    } catch {
        return 'Download';
    }
}

// Initialize the application
async function init() {
    const slug = getEpisodeSlug();
    
    if (!slug) {
        showError('Slug episode tidak ditemukan. Silakan kembali ke halaman anime.', 'not-found');
        return;
    }
    
    showLoading();
    
    try {
        console.log('Starting episode load for slug:', slug);
        const episode = await queueRequest(() => fetchEpisodeData(slug));
        
        if (!episode) {
            throw new Error('No episode data received');
        }
        
        console.log('Episode data loaded successfully:', episode);
        displayEpisode(episode);
        
    } catch (error) {
        console.error('Init error:', error);
        
        // Determine error type for better user feedback
        let errorType = 'general';
        
        if (error.message.includes('AI Detector')) {
            errorType = 'ai-detector';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
            errorType = 'not-found';
        } else if (error.message.includes('Rate limited') || error.message.includes('429')) {
            errorType = 'rate-limit';
        } else if (error.message.includes('Server error') || error.message.includes('500')) {
            errorType = 'server-error';
        } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
            errorType = 'timeout';
        } else if (error.message.includes('CORS') || error.message.includes('network')) {
            errorType = 'network';
        }
        
        showError(error.message, errorType);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Left arrow - previous episode
    if (e.key === 'ArrowLeft') {
        const prevBtn = document.getElementById('prev-episode');
        if (prevBtn && prevBtn.style.display !== 'none') {
            prevBtn.click();
        }
    }
    
    // Right arrow - next episode
    if (e.key === 'ArrowRight') {
        const nextBtn = document.getElementById('next-episode');
        if (nextBtn && nextBtn.style.display !== 'none') {
            nextBtn.click();
        }
    }
    
    // Space bar - toggle video play/pause (if focused on video)
    if (e.key === ' ' && e.target.tagName === 'IFRAME') {
        e.preventDefault();
        // Note: Can't control iframe video directly due to cross-origin restrictions
    }
});

// Handle retry button
document.addEventListener('DOMContentLoaded', () => {
    const retryBtn = document.getElementById('btn-retry-episode');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            location.reload();
        });
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);