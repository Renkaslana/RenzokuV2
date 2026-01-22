// API Configuration
const API_BASE_URL = 'https://www.sankavollerei.com/anime/episode';
const DONGHUA_API_BASE_URL = 'https://www.sankavollerei.com/anime/donghua/episode';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Multiple API endpoints for redundancy
const EPISODE_ENDPOINTS = [
    'https://www.sankavollerei.com/anime/episode',
    'https://api.sankavollerei.com/episode',
    'https://backup.sankavollerei.com/anime/episode'
];

// Donghua episode endpoints
const DONGHUA_EPISODE_ENDPOINTS = [
    'https://www.sankavollerei.com/anime/donghua/episode'
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

// Get content type from URL parameters (anime or donghua)
function getContentType() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('type') || 'anime'; // Default to anime
}

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

// Get endpoints based on content type - Unified helper
function getEpisodeEndpoints(contentType) {
    const isDonghua = contentType === 'donghua';
    return isDonghua ? DONGHUA_EPISODE_ENDPOINTS : EPISODE_ENDPOINTS;
}

// Preload episode data (for instant loading) - Unified approach
async function preloadEpisode(slug, contentType) {
    if (EPISODE_PRELOAD_CACHE.has(slug)) {
        console.log('Episode already preloaded:', slug);
        return;
    }
    
    try {
        console.log(`Preloading ${contentType || 'episode'}:`, slug);
        const endpoints = getEpisodeEndpoints(contentType || getContentType());
        const data = await fetchEpisodeFromEndpoint(endpoints[0], slug);
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

// Preload next/previous episodes - Unified approach
function preloadAdjacentEpisodes(episode) {
    const contentType = getContentType();
    
    // Helper function to extract and clean slug based on content type
    function extractAndCleanSlug(episodeData) {
        const slug = typeof episodeData === 'string' 
            ? episodeData 
            : (episodeData.slug || episodeData);
        
        if (contentType === 'donghua') {
            return cleanDonghuaEpisodeSlug(slug);
        } else {
            return extractEpisodeSlug(slug) || slug;
        }
    }
    
    // Preload next episode
    if (episode.next_episode) {
        const cleanedSlug = extractAndCleanSlug(episode.next_episode);
        if (cleanedSlug) {
            setTimeout(() => preloadEpisode(cleanedSlug, contentType), 1000);
        }
    }
    
    // Preload previous episode
    if (episode.previous_episode || episode.prev_episode) {
        const prevEpisode = episode.previous_episode || episode.prev_episode;
        const cleanedSlug = extractAndCleanSlug(prevEpisode);
        if (cleanedSlug) {
            setTimeout(() => preloadEpisode(cleanedSlug, contentType), 1500);
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

// Transform donghua episode response to standard format
function transformDonghuaEpisodeResponse(donghuaData) {
    console.log('Transforming donghua episode response:', donghuaData);
    
    const transformed = {
        episode: donghuaData.episode || '',
        stream_url: donghuaData.streaming?.main_url?.url || '',
        streaming_servers: donghuaData.streaming?.servers || [],
        download_urls: transformDonghuaDownloadUrls(donghuaData.download_url),
        anime: {
            title: donghuaData.donghua_details?.title || '',
            slug: cleanDonghuaSlug(donghuaData.donghua_details?.slug || ''),
            url: donghuaData.donghua_details?.url || ''
        },
        previous_episode: donghuaData.navigation?.previous_episode ? {
            episode: donghuaData.navigation.previous_episode.episode,
            slug: cleanDonghuaEpisodeSlug(donghuaData.navigation.previous_episode.slug),
            url: donghuaData.navigation.previous_episode.url
        } : null,
        next_episode: donghuaData.navigation?.next_episode ? {
            episode: donghuaData.navigation.next_episode.episode,
            slug: cleanDonghuaEpisodeSlug(donghuaData.navigation.next_episode.slug),
            url: donghuaData.navigation.next_episode.url
        } : null,
        has_previous_episode: !!donghuaData.navigation?.previous_episode,
        has_next_episode: !!donghuaData.navigation?.next_episode
    };
    
    console.log('Transformed donghua episode:', transformed);
    return transformed;
}

// Transform donghua download URLs to standard format
function transformDonghuaDownloadUrls(downloadUrl) {
    if (!downloadUrl) return null;
    
    const downloads = [];
    
    // Process each resolution (360p, 480p, 720p, 1080p)
    const resolutions = ['360p', '480p', '720p', '1080p'];
    
    resolutions.forEach(resolution => {
        const resolutionKey = `download_url_${resolution}`;
        const resolutionData = downloadUrl[resolutionKey];
        
        if (resolutionData) {
            const urls = [];
            
            // Add Mirrored if available
            if (resolutionData.Mirrored) {
                urls.push({
                    url: resolutionData.Mirrored,
                    provider: 'Mirrored'
                });
            }
            
            // Add Terabox if available
            if (resolutionData.Terabox) {
                urls.push({
                    url: resolutionData.Terabox,
                    provider: 'Terabox'
                });
            }
            
            if (urls.length > 0) {
                downloads.push({
                    resolution: resolution,
                    quality: resolution,
                    urls: urls
                });
            }
        }
    });
    
    return downloads.length > 0 ? { mp4: downloads } : null;
}

// Clean donghua slug for navigation
function cleanDonghuaSlug(slug) {
    if (!slug) return '';
    
    // Remove URL prefixes
    slug = slug.replace(/^https?:\/\/[^\/]+\//, '');
    slug = slug.replace(/^\/anichin\//, '');
    slug = slug.replace(/^anichin\//, '');
    slug = slug.replace(/\/detail\//, '');
    slug = slug.replace(/\/$/, '');
    
    return slug.trim();
}

// Transform anime episode API response to expected format
function transformAnimeEpisodeResponse(episodeData) {
    // API structure: { title, defaultStreamingUrl, server: { qualities: [...] }, downloadUrl, ... }
    
    // Extract streaming servers from qualities
    const streamingServers = [];
    if (episodeData.server && episodeData.server.qualities) {
        episodeData.server.qualities.forEach(quality => {
            if (quality.serverList && Array.isArray(quality.serverList)) {
                quality.serverList.forEach(server => {
                    streamingServers.push({
                        quality: quality.title,
                        server_name: server.title,
                        server_id: server.serverId,
                        href: server.href,
                        // Will be populated when clicked
                        url: null
                    });
                });
            }
        });
    }
    
    // Extract download URLs
    const downloadUrls = {
        mkv_urls: [],
        mp4_urls: []
    };
    
    if (episodeData.downloadUrl && episodeData.downloadUrl.qualities) {
        // Group by quality to match expected structure
        const qualityGroups = {
            mkv: {},
            mp4: {}
        };
        
        episodeData.downloadUrl.qualities.forEach(quality => {
            const qualityTitle = quality.title || '';
            const size = quality.size || '';
            const urls = quality.urls || [];
            
            // Determine if MKV or MP4
            const isMkv = qualityTitle.toUpperCase().includes('MKV');
            const cleanQuality = qualityTitle.replace(/^(MKV|Mp4)_/i, ''); // Remove prefix
            
            // Create download item with all URLs for this quality
            const downloadItem = {
                quality: cleanQuality,
                size: size,
                resolution: cleanQuality, // Add resolution field
                urls: urls.map(urlObj => ({
                    provider: urlObj.title || 'Unknown',
                    host: urlObj.title || 'Unknown',
                    url: urlObj.url || ''
                }))
            };
            
            // Add to appropriate array
            if (isMkv) {
                downloadUrls.mkv_urls.push(downloadItem);
            } else {
                downloadUrls.mp4_urls.push(downloadItem);
            }
        });
    }
    
    return {
        episode: episodeData.title || '',
        anime: {
            title: episodeData.info?.title || '',
            slug: episodeData.animeId || ''
        },
        stream_url: episodeData.defaultStreamingUrl || '',
        streaming_servers: streamingServers,
        download_urls: downloadUrls,
        prev_episode: episodeData.hasPrevEpisode ? {
            slug: episodeData.prevEpisode?.episodeId || '',
            title: episodeData.prevEpisode?.title || ''
        } : null,
        next_episode: episodeData.hasNextEpisode ? {
            slug: episodeData.nextEpisode?.episodeId || '',
            title: episodeData.nextEpisode?.title || ''
        } : null,
        release_time: episodeData.releaseTime || ''
    };
}

// Clean donghua episode slug for navigation
function cleanDonghuaEpisodeSlug(slug) {
    if (!slug) return '';
    
    // Remove URL prefixes and paths
    slug = slug.replace(/^https?:\/\/[^\/]+\//, '');
    slug = slug.replace(/^\/anichin\/episode\//, '');
    slug = slug.replace(/^anichin\/episode\//, '');
    slug = slug.replace(/\/$/, '');
    
    return slug.trim();
}

// Fetch episode data from API with retry mechanism - Unified approach
async function fetchEpisodeData(slug, maxRetries = 3) {
    // Check cache first
    const cachedData = getCachedEpisode(slug);
    if (cachedData) {
        return cachedData;
    }

    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    const endpoints = getEpisodeEndpoints(contentType);
    
    // Debug logging
    console.log('=== Episode Fetch Debug ===');
    console.log('Content Type:', contentType);
    console.log('Is Donghua:', isDonghua);
    console.log('Slug:', slug);
    console.log('Endpoints to try:', endpoints);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Episode fetch attempt ${attempt}/${maxRetries} for ${contentType} slug: ${slug}`);
            
            // Wait for rate limit
            await waitForRateLimit();
            
            // Try multiple endpoints
            for (const baseUrl of endpoints) {
                try {
                    console.log(`Trying endpoint: ${baseUrl}/${slug}`);
                    const response = await fetchEpisodeFromEndpoint(baseUrl, slug);
                    if (response) {
                        console.log('Successfully fetched episode data from:', baseUrl);
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

// Fetch from specific endpoint - Unified approach with better error handling
async function fetchEpisodeFromEndpoint(baseUrl, slug) {
    const fullUrl = `${baseUrl}/${slug}`;
    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    
    console.log(`Fetching from endpoint: ${fullUrl} (${contentType})`);
    
    try {
        // Try direct API call first
        let response;
        try {
            response = await fetch(fullUrl, {
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
        
        // Handle donghua response structure (data directly in root)
        if (isDonghua) {
            // Donghua API can return status 'success' or data directly
            if (result.status === 'success') {
                console.log('Donghua episode data received with success status');
                return transformDonghuaEpisodeResponse(result);
            } else if (result.episode || result.streaming || result.donghua_details) {
                // Direct donghua data structure
                console.log('Donghua episode data received (direct structure)');
                return transformDonghuaEpisodeResponse(result);
            } else {
                console.error('Invalid donghua response structure:', result);
                throw new Error('Invalid response structure from donghua API');
            }
        }
        
        // Handle anime response structure
        if (result.status === 'success' && result.data) {
            console.log('Anime episode data received');
            return transformAnimeEpisodeResponse(result.data);
        } else if (result.data && !result.status) {
            // Some APIs return data directly
            console.log('Anime episode data received (direct structure)');
            return transformAnimeEpisodeResponse(result.data);
        } else if (result.episode || result.stream_url) {
            // Direct episode structure (fallback)
            console.log('Anime episode data received (alternative structure)');
            return result;
        } else {
            console.error('Invalid anime response structure:', result);
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

// Update page title - Unified approach
function updatePageTitle(episodeTitle) {
    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    const platformName = isDonghua ? 'Renzoku Donghua' : 'Renzoku Anime';
    document.title = `${episodeTitle} - ${platformName}`;
}

// Setup video player with fallback sources
function setupVideoPlayer(videoPlayer, episode) {
    if (!videoPlayer || !episode) return;
    
    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    
    // Check if it's an iframe or video element
    const isIframe = videoPlayer.tagName.toLowerCase() === 'iframe';
    
    // Primary stream URL
    let primaryUrl = episode.stream_url;
    
    // For donghua, use main_url from streaming object
    if (isDonghua && !primaryUrl && episode.streaming_servers && episode.streaming_servers.length > 0) {
        // Try to find Premium server first, or use first available
        const premiumServer = episode.streaming_servers.find(s => s.name && s.name.toLowerCase().includes('premium'));
        primaryUrl = premiumServer ? premiumServer.url : episode.streaming_servers[0].url;
    }
    
    if (primaryUrl) {
        videoPlayer.src = primaryUrl;
        console.log('Video player set with URL:', primaryUrl.substring(0, 50) + '...');
        
        // Only add event listeners for video elements, not iframes
        if (!isIframe) {
            // Add error handling for video load failures
            videoPlayer.addEventListener('error', (e) => {
                console.log('Primary video source failed, trying fallback...');
                handleVideoError(videoPlayer, episode);
            });
            
            // Add load success handler
            videoPlayer.addEventListener('loadeddata', () => {
                console.log('Video loaded successfully');
            });
        }
    } else {
        console.warn('No stream URL provided for episode');
        if (!isIframe) {
            handleVideoError(videoPlayer, episode);
        }
    }
    
    // For donghua, setup streaming server selector if multiple servers available
    if (isDonghua && episode.streaming_servers && episode.streaming_servers.length > 1) {
        setupStreamingServers(videoPlayer, episode);
    }
    
    // For anime, always setup streaming servers selector
    if (!isDonghua && episode.streaming_servers && episode.streaming_servers.length > 0) {
        setupAnimeStreamingServers(videoPlayer, episode);
    }
}

// Handle video loading errors
function handleVideoError(videoPlayer, episode) {
    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    
    // Try alternative sources if available
    let alternativeSources = [
        episode.alternative_stream_url,
        episode.backup_stream_url,
        episode.mirror_url
    ].filter(Boolean);
    
    // For donghua, add streaming servers as alternative sources
    if (isDonghua && episode.streaming_servers && episode.streaming_servers.length > 0) {
        const serverUrls = episode.streaming_servers
            .map(server => server.url)
            .filter(Boolean);
        alternativeSources = [...alternativeSources, ...serverUrls];
    }
    
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

// Setup streaming servers selector for donghua
function setupStreamingServers(videoPlayer, episode) {
    if (!episode.streaming_servers || episode.streaming_servers.length <= 1) return;
    
    const playerContainer = videoPlayer.parentElement;
    if (!playerContainer) return;
    
    // Create server selector
    const serverSelector = document.createElement('div');
    serverSelector.className = 'streaming-servers-selector';
    serverSelector.innerHTML = `
        <label for="server-select">Server Streaming:</label>
        <select id="server-select" class="server-select">
            ${episode.streaming_servers.map((server, index) => 
                `<option value="${index}" ${index === 0 ? 'selected' : ''}>${server.name || `Server ${index + 1}`}</option>`
            ).join('')}
        </select>
    `;
    
    // Insert before video player
    playerContainer.insertBefore(serverSelector, videoPlayer);
    
    // Handle server change
    const select = serverSelector.querySelector('#server-select');
    select.addEventListener('change', (e) => {
        const selectedIndex = parseInt(e.target.value);
        const selectedServer = episode.streaming_servers[selectedIndex];
        if (selectedServer && selectedServer.url) {
            videoPlayer.src = selectedServer.url;
        }
    });
}

// Setup anime streaming servers with quality selection
async function setupAnimeStreamingServers(videoPlayer, episode) {
    if (!episode.streaming_servers || episode.streaming_servers.length === 0) return;
    
    const playerContainer = videoPlayer.parentElement;
    if (!playerContainer) return;
    
    // Group servers by quality
    const qualityGroups = {};
    episode.streaming_servers.forEach(server => {
        if (!qualityGroups[server.quality]) {
            qualityGroups[server.quality] = [];
        }
        qualityGroups[server.quality].push(server);
    });
    
    // Create quality and server selector
    const serverSelector = document.createElement('div');
    serverSelector.className = 'streaming-servers-selector';
    serverSelector.innerHTML = `
        <label for="quality-select">Kualitas:</label>
        <select id="quality-select" class="quality-select server-select">
            ${Object.keys(qualityGroups).map((quality, index) => 
                `<option value="${quality}" ${index === 0 ? 'selected' : ''}>${quality}</option>`
            ).join('')}
        </select>
        
        <label for="server-select" style="margin-left: 15px;">Server:</label>
        <select id="server-select" class="server-select">
            <!-- Will be populated based on quality -->
        </select>
    `;
    
    // Insert before player container (not inside it)
    playerContainer.parentElement.insertBefore(serverSelector, playerContainer);
    
    const qualitySelect = serverSelector.querySelector('#quality-select');
    const serverSelect = serverSelector.querySelector('#server-select');
    
    // Function to update server options based on selected quality
    function updateServerOptions(quality) {
        const servers = qualityGroups[quality] || [];
        serverSelect.innerHTML = servers.map((server, index) => 
            `<option value="${index}" data-server-id="${server.server_id}">${server.server_name}</option>`
        ).join('');
        
        // Load first server by default
        if (servers.length > 0) {
            loadStreamUrl(servers[0], videoPlayer);
        }
    }
    
    // Initialize with first quality
    const firstQuality = Object.keys(qualityGroups)[0];
    if (firstQuality) {
        updateServerOptions(firstQuality);
    }
    
    // Handle quality change
    qualitySelect.addEventListener('change', (e) => {
        updateServerOptions(e.target.value);
    });
    
    // Handle server change
    serverSelect.addEventListener('change', (e) => {
        const quality = qualitySelect.value;
        const servers = qualityGroups[quality] || [];
        const selectedIndex = parseInt(e.target.value);
        const selectedServer = servers[selectedIndex];
        
        if (selectedServer) {
            loadStreamUrl(selectedServer, videoPlayer);
        }
    });
}

// Load stream URL from server endpoint
async function loadStreamUrl(server, videoPlayer) {
    if (!server || !server.server_id) return;
    
    // Check if it's an iframe
    const isIframe = videoPlayer.tagName.toLowerCase() === 'iframe';
    
    // Show loading indicator on video
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'video-loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div><p>Memuat video...</p>';
    loadingOverlay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; z-index: 10;';
    
    const playerContainer = videoPlayer.parentElement;
    playerContainer.style.position = 'relative';
    playerContainer.appendChild(loadingOverlay);
    
    try {
        // Call server API to get stream URL
        const serverUrl = `https://www.sankavollerei.com/anime/server/${server.server_id}`;
        const response = await fetch(serverUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Referer': 'https://www.sankavollerei.com/'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data && result.data.url) {
            videoPlayer.src = result.data.url;
            console.log(`Loaded stream from ${server.server_name} (${server.quality}): ${result.data.url.substring(0, 50)}...`);
        } else {
            throw new Error('Invalid server response');
        }
        
    } catch (error) {
        console.error('Failed to load stream URL:', error);
        alert(`Gagal memuat video dari server ${server.server_name}. Silakan coba server lain.`);
    } finally {
        // Remove loading overlay
        if (loadingOverlay.parentElement) {
            loadingOverlay.parentElement.removeChild(loadingOverlay);
        }
    }
}

// Extract anime/donghua slug from URL - Unified helper
function extractAnimeSlug(url) {
    if (!url) return null;
    
    // Handle donghua URLs
    if (url.includes('/anichin/') || url.includes('/donghua/')) {
        const match = url.match(/(?:anichin|donghua)\/(?:detail\/)?([^\/]+)/);
        if (match) {
            return cleanDonghuaSlug(match[1]);
        }
    }
    
    // Handle anime URLs
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
    
    // Anime/Donghua link
    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    let animeSlug = episode.anime?.slug || '';
    
    // Clean slug if needed
    if (isDonghua) {
        animeSlug = cleanDonghuaSlug(animeSlug);
    } else {
        animeSlug = extractAnimeSlug(animeSlug) || animeSlug;
    }
    
    const animeLink = document.getElementById('anime-link');
    if (animeLink) {
        if (animeSlug) {
            const linkText = isDonghua ? '📖 Lihat Detail Donghua' : '📖 Lihat Detail Anime';
            animeLink.textContent = linkText;
            animeLink.href = `detail.html?slug=${encodeURIComponent(animeSlug)}${isDonghua ? '&type=donghua' : ''}`;
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
    
    const contentType = getContentType();
    const isDonghua = contentType === 'donghua';
    const typeParam = isDonghua ? '&type=donghua' : '';
    
    // Previous episode
    if (episode.has_previous_episode && episode.previous_episode) {
        prevBtn.style.display = 'flex';
        prevBtn.onclick = () => {
            const prevSlug = episode.previous_episode.slug || episode.previous_episode;
            window.location.href = `episode.html?slug=${encodeURIComponent(prevSlug)}${typeParam}`;
        };
    } else {
        prevBtn.style.display = 'none';
    }
    
    // Next episode
    if (episode.has_next_episode && episode.next_episode) {
        nextBtn.style.display = 'flex';
        nextBtn.onclick = () => {
            const nextSlug = episode.next_episode.slug || episode.next_episode;
            window.location.href = `episode.html?slug=${encodeURIComponent(nextSlug)}${typeParam}`;
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
    if (downloadUrls.mp4_urls && Array.isArray(downloadUrls.mp4_urls)) {
        mp4Downloads = downloadUrls.mp4_urls;
    } else if (downloadUrls.mp4 && Array.isArray(downloadUrls.mp4)) {
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
    if (downloadUrls.mkv_urls && Array.isArray(downloadUrls.mkv_urls)) {
        mkvDownloads = downloadUrls.mkv_urls;
    } else if (downloadUrls.mkv && Array.isArray(downloadUrls.mkv)) {
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
    const contentType = getContentType();
    
    console.log('=== Episode Init ===');
    console.log('Slug:', slug);
    console.log('Content Type:', contentType);
    console.log('URL Search Params:', window.location.search);
    
    if (!slug) {
        showError('Slug episode tidak ditemukan. Silakan kembali ke halaman anime.', 'not-found');
        return;
    }
    
    showLoading();
    
    try {
        console.log(`Starting episode load for ${contentType} slug:`, slug);
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