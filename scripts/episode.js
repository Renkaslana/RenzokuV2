// API Configuration
const API_BASE_URL = 'https://www.sankavollerei.com/anime/episode';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Get slug from URL parameters
function getEpisodeSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('slug');
}

// Fetch episode data from API
async function fetchEpisodeData(slug) {
    try {
        // Try direct API call first
        let response;
        try {
            response = await fetch(`${API_BASE_URL}/${slug}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://www.sankavollerei.com/',
                    'Origin': 'https://www.sankavollerei.com'
                }
            });
        } catch (corsError) {
            console.log('Direct API failed, trying CORS proxy...');
            // Use CORS proxy as fallback
            const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${API_BASE_URL}/${slug}`)}`;
            response = await fetch(proxyUrl);
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            return result.data;
        } else {
            throw new Error('Data episode tidak valid dari API');
        }
    } catch (error) {
        console.error('Error fetching episode data:', error);
        throw error;
    }
}

// Show loading state
function showLoading() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('episode-content').style.display = 'none';
}

// Show error state
function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    document.getElementById('episode-content').style.display = 'none';
}

// Show content
function showContent() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('episode-content').style.display = 'block';
}

// Update page title
function updatePageTitle(episodeTitle) {
    document.title = `${episodeTitle} - Renzoku Anime`;
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
    
    // Video player - set to default stream
    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer) {
        videoPlayer.src = episode.stream_url;
    }
    
    // Episode navigation
    setupEpisodeNavigation(episode);
    
    // Download links
    displayDownloadLinks(episode.download_urls);
    
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
        showError('Slug episode tidak ditemukan. Silakan kembali ke halaman anime.');
        return;
    }
    
    showLoading();
    
    try {
        const episode = await fetchEpisodeData(slug);
        displayEpisode(episode);
    } catch (error) {
        showError('Gagal memuat episode. Silakan coba lagi.');
        console.error('Init error:', error);
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);