// Optimized Episode Page - Fast Loading & Better Performance
// API Configuration
const API_BASE_URL = 'https://www.sankavollerei.com/anime/episode';

// Cache untuk episode data
const episodeCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 menit

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 detik minimum antar request

// Optimized Episode Manager
const EpisodeManager = {
    // Check if we can make a request (rate limiting)
    canMakeRequest() {
        const now = Date.now();
        if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
            console.log('Rate limited: Please wait before making another request');
            return false;
        }
        return true;
    },

    // Get cached episode data
    getCachedEpisode(slug) {
        const cached = episodeCache.get(slug);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Using cached episode data for:', slug);
            return cached.data;
        }
        return null;
    },

    // Cache episode data
    cacheEpisode(slug, data) {
        episodeCache.set(slug, {
            data: data,
            timestamp: Date.now()
        });
        console.log('Cached episode data for:', slug);
    },

    // Get slug from URL parameters
    getEpisodeSlug() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('slug');
    },

    // Optimized fetch episode data with timeout and retry
    async fetchEpisodeData(slug, retryCount = 0) {
        // Check rate limiting
        if (!this.canMakeRequest()) {
            throw new Error('Rate limited. Please wait before trying again.');
        }

        // Check cache first
        const cached = this.getCachedEpisode(slug);
        if (cached) {
            return cached;
        }

        try {
            console.log(`Fetching episode data for: ${slug} (attempt ${retryCount + 1})`);
            lastRequestTime = Date.now();

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(`${API_BASE_URL}/${slug}`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Cache-Control': 'no-cache'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('API rate limited. Please wait before trying again.');
                } else if (response.status === 403) {
                    throw new Error('API access forbidden. Please try again later.');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const result = await response.json();
            console.log('Episode API Response:', result);
            console.log('API Response Status:', result.status);
            console.log('API Response Data:', result.data);
            
            // Log all properties in the response for debugging
            if (result.data) {
                console.log('Episode Data Properties:', Object.keys(result.data));
                console.log('Full Episode Data:', JSON.stringify(result.data, null, 2));
            }

            if (result.status === 'success' && result.data) {
                // Cache the successful result
                this.cacheEpisode(slug, result.data);
                return result.data;
            } else if (result.status === 'Plana AI Detector') {
                throw new Error('API protection triggered. Please wait 30 minutes before trying again.');
            } else {
                console.error('Unexpected API response structure:', result);
                throw new Error('Data episode tidak valid dari API');
            }
        } catch (error) {
            console.error('Error fetching episode data:', error);
            
            // Retry logic for network errors
            if (retryCount < 2 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
                console.log(`Retrying fetch for ${slug} (attempt ${retryCount + 2})`);
                await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
                return this.fetchEpisodeData(slug, retryCount + 1);
            }
            
            throw error;
        }
    },

    // Show loading state with progress
    showLoading() {
        const loadingElement = document.getElementById('loading-state');
        const errorElement = document.getElementById('error-state');
        const contentElement = document.getElementById('episode-content');
        
        if (loadingElement) loadingElement.style.display = 'flex';
        if (errorElement) errorElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'none';
        
        // Add loading progress indicator
        this.showLoadingProgress();
    },

    // Show loading progress
    showLoadingProgress() {
        const loadingElement = document.getElementById('loading-state');
        if (!loadingElement) return;

        const progressBar = document.createElement('div');
        progressBar.className = 'loading-progress';
        progressBar.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <p class="loading-text">Memuat episode...</p>
        `;

        // Remove existing progress if any
        const existingProgress = loadingElement.querySelector('.loading-progress');
        if (existingProgress) {
            existingProgress.remove();
        }

        loadingElement.appendChild(progressBar);
    },

    // Show error state with better UX
    showError(message) {
        const loadingElement = document.getElementById('loading-state');
        const errorElement = document.getElementById('error-state');
        const contentElement = document.getElementById('episode-content');
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'flex';
        if (contentElement) contentElement.style.display = 'none';

        const errorMessageElement = document.getElementById('error-message');
        if (errorMessageElement) {
            errorMessageElement.textContent = message;
        }

        // Add retry button functionality
        this.setupRetryButton();
    },

    // Setup retry button
    setupRetryButton() {
        const retryButton = document.querySelector('.btn-primary');
        if (retryButton) {
            retryButton.onclick = () => {
                console.log('Retry button clicked');
                this.init();
            };
        }
    },

    // Show content
    showContent() {
        const loadingElement = document.getElementById('loading-state');
        const errorElement = document.getElementById('error-state');
        const contentElement = document.getElementById('episode-content');
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'block';
    },

    // Display episode with optimized rendering
    displayEpisode(episode) {
        console.log('Displaying episode:', episode);
        
        // Update episode title
        const titleElement = document.getElementById('episode-title');
        if (titleElement && episode.title) {
            titleElement.textContent = episode.title;
        }

        // Update anime link
        const animeLinkElement = document.getElementById('anime-link');
        if (animeLinkElement && episode.anime_slug) {
            animeLinkElement.href = `detail.html?slug=${episode.anime_slug}`;
        }

        // Setup video player with lazy loading
        this.setupVideoPlayer(episode);

        // Setup episode navigation
        this.setupEpisodeNavigation(episode);

        // Display download links with optimization
        // Check different possible data structures
        let downloadUrls = null;
        if (episode.download_urls) {
            downloadUrls = episode.download_urls;
        } else if (episode.downloads) {
            downloadUrls = episode.downloads;
        } else if (episode.download) {
            downloadUrls = episode.download;
        }
        
        console.log('Download URLs found:', downloadUrls);
        this.displayDownloadLinks(downloadUrls);

        this.showContent();
    },

    // Setup video player with lazy loading
    setupVideoPlayer(episode) {
        console.log('Setting up video player for episode:', episode);
        
        const videoPlayer = document.getElementById('video-player');
        if (!videoPlayer) {
            console.error('Video player element not found');
            return;
        }

        // Check different possible video URL properties
        let videoUrl = null;
        const possibleVideoProperties = [
            'video_url', 'video_stream', 'stream_url', 'player_url', 
            'iframe_url', 'embed_url', 'video', 'stream', 'player'
        ];
        
        console.log('Checking video URL properties:');
        possibleVideoProperties.forEach(prop => {
            if (episode[prop]) {
                console.log(`- Found ${prop}:`, episode[prop]);
                if (!videoUrl) videoUrl = episode[prop];
            }
        });

        console.log('Final video URL:', videoUrl);

        if (!videoUrl) {
            console.warn('No video URL found in episode data');
            console.log('Available episode properties:', Object.keys(episode));
            
            // Show placeholder or error message
            videoPlayer.style.display = 'none';
            const playerContainer = document.querySelector('.player-container');
            if (playerContainer) {
                playerContainer.innerHTML = `
                    <div style="background: #000; color: white; padding: 40px; text-align: center; border-radius: 12px;">
                        <h3>📺 Video Tidak Tersedia</h3>
                        <p>Video stream untuk episode ini tidak tersedia saat ini.</p>
                        <p style="color: #8B5CF6; margin-top: 10px;">Silakan gunakan link download di bawah untuk menonton episode ini.</p>
                        <details style="margin-top: 15px; text-align: left;">
                            <summary style="cursor: pointer; color: #8B5CF6;">🔍 Debug Info</summary>
                            <pre style="font-size: 0.8rem; margin-top: 10px; color: rgba(255,255,255,0.7);">
Episode Properties: ${JSON.stringify(Object.keys(episode), null, 2)}
                            </pre>
                        </details>
                    </div>
                `;
            }
            return;
        }

        // Show video player
        videoPlayer.style.display = 'block';
        
        // Load video immediately (remove lazy loading for better UX)
        console.log('Loading video player with URL:', videoUrl);
        videoPlayer.src = videoUrl;
        
        // Add error handling for video player
        videoPlayer.onerror = function() {
            console.error('Video player failed to load');
            videoPlayer.style.display = 'none';
            const playerContainer = document.querySelector('.player-container');
            if (playerContainer) {
                playerContainer.innerHTML = `
                    <div style="background: #000; color: white; padding: 40px; text-align: center; border-radius: 12px;">
                        <h3>❌ Video Gagal Dimuat</h3>
                        <p>Video player tidak dapat memuat konten. Silakan gunakan link download di bawah.</p>
                        <p style="color: #8B5CF6; margin-top: 10px;">URL: ${videoUrl}</p>
                        <button onclick="location.reload()" style="background: #8B5CF6; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 10px; cursor: pointer;">
                            🔄 Coba Lagi
                        </button>
                    </div>
                `;
            }
        };
        
        // Add load event
        videoPlayer.onload = function() {
            console.log('Video player loaded successfully');
        };
    },

    // Setup episode navigation with better UX
    setupEpisodeNavigation(episode) {
        const prevButton = document.getElementById('prev-episode');
        const nextButton = document.getElementById('next-episode');
        const currentEpisodeInfo = document.getElementById('current-episode-info');
        const prevEpisodeNumber = document.getElementById('prev-episode-number');
        const nextEpisodeNumber = document.getElementById('next-episode-number');

        console.log('Setting up episode navigation:', {
            prev: episode.prev_episode_slug,
            next: episode.next_episode_slug,
            current: episode.episode_number
        });

        // Update current episode info
        if (currentEpisodeInfo && episode.episode_number) {
            currentEpisodeInfo.textContent = `Episode ${episode.episode_number}`;
        } else if (currentEpisodeInfo && episode.title) {
            // Extract episode number from title if available
            const episodeMatch = episode.title.match(/Episode\s+(\d+)/i);
            if (episodeMatch) {
                currentEpisodeInfo.textContent = `Episode ${episodeMatch[1]}`;
            } else {
                currentEpisodeInfo.textContent = 'Episode';
            }
        }

        // Previous episode button
        if (episode.prev_episode_slug) {
            if (prevButton) {
                prevButton.style.display = 'flex';
                prevButton.onclick = () => {
                    console.log('Navigating to previous episode:', episode.prev_episode_slug);
                    this.navigateToEpisode(episode.prev_episode_slug);
                };
                
                // Add episode number if available
                if (prevEpisodeNumber && episode.prev_episode_number) {
                    prevEpisodeNumber.textContent = `Episode ${episode.prev_episode_number}`;
                } else if (prevEpisodeNumber) {
                    prevEpisodeNumber.textContent = 'Previous';
                }
            }
        } else {
            if (prevButton) {
                prevButton.style.display = 'none';
            }
        }

        // Next episode button
        if (episode.next_episode_slug) {
            if (nextButton) {
                nextButton.style.display = 'flex';
                nextButton.onclick = () => {
                    console.log('Navigating to next episode:', episode.next_episode_slug);
                    this.navigateToEpisode(episode.next_episode_slug);
                };
                
                // Add episode number if available
                if (nextEpisodeNumber && episode.next_episode_number) {
                    nextEpisodeNumber.textContent = `Episode ${episode.next_episode_number}`;
                } else if (nextEpisodeNumber) {
                    nextEpisodeNumber.textContent = 'Next';
                }
            }
        } else {
            if (nextButton) {
                nextButton.style.display = 'none';
            }
        }

        // Add episode info display
        this.displayEpisodeInfo(episode);
    },

    // Navigate to episode with loading state
    navigateToEpisode(slug) {
        console.log('Navigating to episode:', slug);
        
        // Show loading state
        this.showLoading();
        
        // Update URL without page reload
        const newUrl = `${window.location.pathname}?slug=${slug}`;
        window.history.pushState({ slug }, '', newUrl);
        
        // Load new episode
        this.loadEpisode(slug);
    },

    // Load episode data
    async loadEpisode(slug) {
        try {
            const episode = await this.fetchEpisodeData(slug);
            console.log('Episode loaded:', episode);
            
            if (!episode) {
                throw new Error('Episode data is null or undefined');
            }
            
            this.displayEpisode(episode);
        } catch (error) {
            console.error('Error loading episode:', error);
            this.showError('Gagal memuat episode. Silakan coba lagi.');
        }
    },

    // Display episode information
    displayEpisodeInfo(episode) {
        // Add episode number and anime title to header
        const episodeTitle = document.getElementById('episode-title');
        if (episodeTitle && episode.episode_number) {
            const currentText = episodeTitle.textContent;
            episodeTitle.textContent = `${currentText} - Episode ${episode.episode_number}`;
        }

        // Add anime title if available
        if (episode.anime_title) {
            const animeLink = document.getElementById('anime-link');
            if (animeLink) {
                animeLink.textContent = `📖 ${episode.anime_title}`;
            }
        }
    },

    // Optimized display download links
    displayDownloadLinks(downloadUrls) {
        console.log('Displaying download links:', downloadUrls);
        
        const mp4Container = document.getElementById('mp4-grid');
        const mkvContainer = document.getElementById('mkv-grid');
        
        if (!mp4Container || !mkvContainer) {
            console.error('Download containers not found');
            return;
        }

        // Clear existing content
        mp4Container.innerHTML = '';
        mkvContainer.innerHTML = '';
        
        console.log('Processing download URLs:', downloadUrls);
        console.log('Download URLs type:', typeof downloadUrls);
        console.log('Download URLs is array:', Array.isArray(downloadUrls));
        
        if (!downloadUrls) {
            console.warn('No download URLs provided');
            mp4Container.innerHTML = `
                <div style="color: rgba(255,255,255,0.6); text-align: center; padding: 20px;">
                    <p>📥 Tidak ada link download tersedia</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">Episode ini mungkin belum memiliki link download atau sedang dalam proses upload.</p>
                </div>
            `;
            return;
        }
        
        // Handle different data structures
        let mp4Downloads = [];
        let mkvDownloads = [];
        
        if (Array.isArray(downloadUrls)) {
            console.log('Processing array format downloads');
            // If it's an array, process each item
            downloadUrls.forEach((download, index) => {
                console.log(`Download item ${index}:`, download);
                if (download.format === 'MP4' || download.type === 'mp4' || download.format === 'mp4') {
                    mp4Downloads.push(download);
                } else if (download.format === 'MKV' || download.type === 'mkv' || download.format === 'mkv') {
                    mkvDownloads.push(download);
                }
            });
        } else if (typeof downloadUrls === 'object') {
            console.log('Processing object format downloads');
            console.log('Download URLs keys:', Object.keys(downloadUrls));
            
            // Try different object structures
            if (downloadUrls.mp4 && downloadUrls.mkv) {
                mp4Downloads = downloadUrls.mp4;
                mkvDownloads = downloadUrls.mkv;
            } else if (downloadUrls.MP4 && downloadUrls.MKV) {
                mp4Downloads = downloadUrls.MP4;
                mkvDownloads = downloadUrls.MKV;
            } else {
                // Try to extract from any other structure
                console.log('Unknown download structure, attempting to parse...');
                mp4Downloads = downloadUrls.mp4 || downloadUrls.MP4 || [];
                mkvDownloads = downloadUrls.mkv || downloadUrls.MKV || [];
                
                // If still empty, try to find any array-like properties
                Object.keys(downloadUrls).forEach(key => {
                    if (Array.isArray(downloadUrls[key])) {
                        console.log(`Found array property: ${key}`, downloadUrls[key]);
                        // Try to determine format from content
                        downloadUrls[key].forEach(item => {
                            if (item.format === 'MP4' || item.type === 'mp4' || key.toLowerCase().includes('mp4')) {
                                mp4Downloads.push(item);
                            } else if (item.format === 'MKV' || item.type === 'mkv' || key.toLowerCase().includes('mkv')) {
                                mkvDownloads.push(item);
                            }
                        });
                    }
                });
            }
        }
        
        console.log('Final MP4 downloads:', mp4Downloads);
        console.log('Final MKV downloads:', mkvDownloads);
        
        // Process MP4 downloads with lazy rendering
        if (mp4Downloads && mp4Downloads.length > 0) {
            console.log('Rendering MP4 downloads');
            this.renderDownloadOptions(mp4Downloads, mp4Container);
        } else {
            console.log('No MP4 downloads found');
            mp4Container.innerHTML = `
                <div style="color: rgba(255,255,255,0.6); text-align: center; padding: 20px;">
                    <p>🎬 Tidak ada download MP4 tersedia</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">Format MP4 untuk episode ini belum tersedia.</p>
                    <details style="margin-top: 10px; text-align: left;">
                        <summary style="cursor: pointer; color: #8B5CF6;">🔍 Debug Info</summary>
                        <pre style="font-size: 0.8rem; margin-top: 10px; color: rgba(255,255,255,0.7);">
Download URLs: ${JSON.stringify(downloadUrls, null, 2)}
                        </pre>
                    </details>
                </div>
            `;
        }
        
        // Process MKV downloads with lazy rendering
        if (mkvDownloads && mkvDownloads.length > 0) {
            console.log('Rendering MKV downloads');
            document.getElementById('mkv-downloads').style.display = 'block';
            this.renderDownloadOptions(mkvDownloads, mkvContainer);
        } else {
            console.log('No MKV downloads found');
            document.getElementById('mkv-downloads').style.display = 'none';
        }
        
        // Add download instructions
        this.addDownloadInstructions();
    },

    // Add download instructions
    addDownloadInstructions() {
        const downloadSection = document.querySelector('.download-section');
        if (!downloadSection) return;

        // Check if instructions already exist
        if (downloadSection.querySelector('.download-instructions')) return;

        const instructionsDiv = document.createElement('div');
        instructionsDiv.className = 'download-instructions';
        instructionsDiv.style.cssText = `
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            text-align: center;
        `;
        
        instructionsDiv.innerHTML = `
            <h4 style="color: #8B5CF6; margin-bottom: 15px;">💡 Cara Download</h4>
            <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem; line-height: 1.6;">
                <p>• Klik salah satu provider di atas untuk mulai download</p>
                <p>• Jika link tidak berfungsi, coba provider lainnya</p>
                <p>• Resolusi lebih tinggi = kualitas lebih baik tapi file lebih besar</p>
                <p>• Gunakan aplikasi download manager untuk download yang lebih stabil</p>
            </div>
        `;
        
        downloadSection.appendChild(instructionsDiv);
    },

    // Render download options with lazy loading
    renderDownloadOptions(downloads, container) {
        downloads.forEach((download, index) => {
            // Use setTimeout for non-blocking rendering
            setTimeout(() => {
                const resolutionDiv = this.createDownloadResolution(download);
                container.appendChild(resolutionDiv);
            }, index * 50); // Stagger rendering
        });
    },

    // Create download resolution section
    createDownloadResolution(download) {
        const resolutionDiv = document.createElement('div');
        resolutionDiv.className = 'download-resolution';
        
        const title = document.createElement('div');
        title.className = 'resolution-title';
        
        // Handle different resolution property names
        const resolution = download.resolution || download.quality || download.size || 'Unknown';
        title.innerHTML = `<span>📺</span> ${resolution}`;
        
        const linksContainer = document.createElement('div');
        linksContainer.className = 'download-links';
        
        // Handle different URL structures
        let urls = [];
        if (download.urls && Array.isArray(download.urls)) {
            urls = download.urls;
        } else if (download.url) {
            urls = [download.url];
        } else if (download.links && Array.isArray(download.links)) {
            urls = download.links;
        } else if (download.download_urls && Array.isArray(download.download_urls)) {
            urls = download.download_urls;
        }
        
        console.log('URLs for resolution', resolution, ':', urls);
        
        if (urls && urls.length > 0) {
            urls.forEach(url => {
                if (url && typeof url === 'string') {
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    link.className = 'download-link';
                    link.textContent = this.getProviderName(url);
                    link.rel = 'noopener noreferrer'; // Security
                    linksContainer.appendChild(link);
                } else if (url && typeof url === 'object' && url.url) {
                    // Handle object with url and provider properties
                    const link = document.createElement('a');
                    link.href = url.url;
                    link.target = '_blank';
                    link.className = 'download-link';
                    link.textContent = url.provider || this.getProviderName(url.url);
                    link.rel = 'noopener noreferrer';
                    linksContainer.appendChild(link);
                }
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
    },

    // Get provider name from URL
    getProviderName(url) {
        const urlLower = url.toLowerCase();
        
        const providers = {
            'odfiles': 'ODFiles',
            'pdrain': 'Pdrain',
            'acefile': 'Acefile',
            'gofile': 'GoFile',
            'mega': 'Mega',
            'kfiles': 'KFiles',
            'mediafire': 'MediaFire',
            'zippyshare': 'ZippyShare',
            'drive.google': 'Google Drive',
            'dropbox': 'Dropbox'
        };

        for (const [key, name] of Object.entries(providers)) {
            if (urlLower.includes(key)) return name;
        }
        
        // Extract domain name as fallback
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '').split('.')[0];
        } catch {
            return 'Download';
        }
    },

    // Initialize the application with error handling
    async init() {
        const slug = this.getEpisodeSlug();
        
        console.log('Episode Manager initializing with slug:', slug);
        
        if (!slug) {
            this.showError('Slug episode tidak ditemukan. Silakan kembali ke halaman anime.');
            return;
        }
        
        this.showLoading();
        
        try {
            const episode = await this.fetchEpisodeData(slug);
            console.log('Episode data received:', episode);
            
            // Validate episode data
            if (!episode) {
                throw new Error('Episode data is null or undefined');
            }
            
            // Log all available properties for debugging
            console.log('Episode properties:', Object.keys(episode));
            console.log('Episode full data:', JSON.stringify(episode, null, 2));
            
            this.displayEpisode(episode);
        } catch (error) {
            console.error('Init error:', error);
            console.error('Error stack:', error.stack);
            
            let errorMessage = 'Gagal memuat episode. Silakan coba lagi.';
            
            if (error.message.includes('Rate limited')) {
                errorMessage = 'Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.';
            } else if (error.message.includes('API protection')) {
                errorMessage = 'API sedang dalam mode perlindungan. Silakan tunggu 30 menit dan coba lagi.';
            } else if (error.message.includes('forbidden')) {
                errorMessage = 'Akses API dilarang. Silakan coba lagi nanti.';
            } else if (error.name === 'AbortError') {
                errorMessage = 'Timeout loading episode. Silakan coba lagi.';
            } else if (error.message.includes('null or undefined')) {
                errorMessage = 'Data episode kosong. Episode mungkin tidak tersedia.';
            }
            
            this.showError(errorMessage);
        }
    }
};

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Prevent shortcuts when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // Left arrow - previous episode
    if (e.key === 'ArrowLeft') {
        const prevBtn = document.getElementById('prev-episode');
        if (prevBtn && prevBtn.style.display !== 'none') {
            console.log('Keyboard shortcut: Previous episode');
            prevBtn.click();
        }
    }
    
    // Right arrow - next episode
    if (e.key === 'ArrowRight') {
        const nextBtn = document.getElementById('next-episode');
        if (nextBtn && nextBtn.style.display !== 'none') {
            console.log('Keyboard shortcut: Next episode');
            nextBtn.click();
        }
    }
    
    // R key - retry/reload episode
    if (e.key === 'r' || e.key === 'R') {
        const errorState = document.getElementById('error-state');
        if (errorState && errorState.style.display !== 'none') {
            console.log('Keyboard shortcut: Retry episode');
            EpisodeManager.init();
        }
    }
    
    // Space bar - toggle video play/pause (if focused on video)
    if (e.key === ' ' && e.target.tagName === 'IFRAME') {
        e.preventDefault();
        console.log('Keyboard shortcut: Video play/pause (iframe)');
        // Note: Can't control iframe video directly due to cross-origin restrictions
    }
    
    // Escape key - go back to anime detail
    if (e.key === 'Escape') {
        const animeLink = document.getElementById('anime-link');
        if (animeLink && animeLink.href) {
            console.log('Keyboard shortcut: Back to anime detail');
            window.location.href = animeLink.href;
        }
    }
    
    // Number keys 1-9 - quick download (if available)
    if (e.key >= '1' && e.key <= '9') {
        const downloadLinks = document.querySelectorAll('.download-link');
        const index = parseInt(e.key) - 1;
        if (downloadLinks[index]) {
            console.log(`Keyboard shortcut: Download link ${e.key}`);
            downloadLinks[index].click();
        }
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    EpisodeManager.init();
});

// Export for global access
window.EpisodeManager = EpisodeManager;
