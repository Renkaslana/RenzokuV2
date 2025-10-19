// API Configuration
const API_BASE_URL = 'https://www.sankavollerei.com/anime/episode';

// Get slug from URL parameters
function getEpisodeSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('slug');
}

// Fetch episode data from API
async function fetchEpisodeData(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/${slug}`);
        
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
    // Update page title
    updatePageTitle(episode.episode);
    
    // Episode title
    document.getElementById('episode-title').textContent = episode.episode;
    
    // Anime link
    const animeSlug = extractAnimeSlug(episode.anime.slug);
    const animeLink = document.getElementById('anime-link');
    if (animeSlug) {
        animeLink.href = `detail.html?slug=${animeSlug}`;
    } else {
        animeLink.style.display = 'none';
    }
    
    // Video player - set to default stream
    const videoPlayer = document.getElementById('video-player');
    videoPlayer.src = episode.stream_url;
    
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
    const mp4Container = document.getElementById('mp4-downloads');
    const mkvContainer = document.getElementById('mkv-downloads');
    
    // Clear existing content
    const mp4Grid = mp4Container.querySelector('.download-grid');
    const mkvGrid = mkvContainer.querySelector('.download-grid');
    mp4Grid.innerHTML = '';
    mkvGrid.innerHTML = '';
    
    if (!downloadUrls) {
        mp4Grid.innerHTML = '<p class="no-downloads">Tidak ada link download tersedia.</p>';
        return;
    }
    
    // Process MP4 downloads
    if (downloadUrls.mp4 && downloadUrls.mp4.length > 0) {
        downloadUrls.mp4.forEach(download => {
            const resolutionDiv = createDownloadResolution(download);
            mp4Grid.appendChild(resolutionDiv);
        });
    } else {
        mp4Grid.innerHTML = '<p style="color: rgba(255,255,255,0.6); text-align: center; padding: 20px;">Tidak ada download MP4 tersedia</p>';
    }
    
    // Process MKV downloads
    if (downloadUrls.mkv && downloadUrls.mkv.length > 0) {
        mkvContainer.style.display = 'block';
        downloadUrls.mkv.forEach(download => {
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
    const resolutionDiv = document.createElement('div');
    resolutionDiv.className = 'download-resolution';
    
    const title = document.createElement('div');
    title.className = 'resolution-title';
    title.innerHTML = `<span>📺</span> ${download.resolution}`;
    
    const linksContainer = document.createElement('div');
    linksContainer.className = 'download-links';
    
    if (download.urls && download.urls.length > 0) {
        download.urls.forEach(url => {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.className = 'download-link';
            link.textContent = getProviderName(url);
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
        if (prevBtn.style.display !== 'none') {
            prevBtn.click();
        }
    }
    
    // Right arrow - next episode
    if (e.key === 'ArrowRight') {
        const nextBtn = document.getElementById('next-episode');
        if (nextBtn.style.display !== 'none') {
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