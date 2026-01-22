// API Configuration
const API_URL = 'https://www.sankavollerei.com/anime/home';
const DONGHUA_API_URL = 'https://www.sankavollerei.com/anime/donghua/home/1';

// Fetch anime data from API
async function fetchAnimeData() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.sankavollerei.com/'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            // Transform new API structure to expected format
            const data = result.data;
            
            // Extract anime list from new structure
            // API returns: { ongoing: { animeList: [...] }, completed: { animeList: [...] } }
            let ongoingAnime = [];
            let completedAnime = [];
            
            // Process ongoing anime - ongoing is an OBJECT not array
            if (data.ongoing && data.ongoing.animeList && Array.isArray(data.ongoing.animeList)) {
                ongoingAnime = data.ongoing.animeList.map(anime => ({
                    title: anime.title,
                    poster: anime.poster,
                    slug: anime.animeId || anime.href?.replace('/anime/anime/', '') || '',
                    current_episode: `Episode ${anime.episodes}`,
                    release_day: anime.releaseDay,
                    newest_release_date: anime.latestReleaseDate,
                    status: 'Ongoing'
                }));
            }
            
            // Process completed anime - completed is an OBJECT not array
            if (data.completed && data.completed.animeList && Array.isArray(data.completed.animeList)) {
                completedAnime = data.completed.animeList.map(anime => ({
                    title: anime.title,
                    poster: anime.poster,
                    slug: anime.animeId || anime.href?.replace('/anime/anime/', '') || '',
                    episode_count: anime.episodes ? `${anime.episodes} Episode` : 'Completed',
                    rating: anime.rating || anime.score || '',
                    last_release_date: anime.latestReleaseDate,
                    status: 'Completed'
                }));
            }
            
            return {
                ongoing_anime: ongoingAnime,
                complete_anime: completedAnime
            };
        } else {
            throw new Error('Data tidak valid dari API');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Fetch donghua data from API
async function fetchDonghuaData() {
    try {
        const response = await fetch(DONGHUA_API_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.sankavollerei.com/'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Process donghua data structure
            const latestRelease = result.latest_release || [];
            const completedDonghua = result.complete_anime || [];
            
            // Separate ongoing and completed from latest_release
            const ongoing = latestRelease.filter(item => item.status === 'Ongoing');
            
            // Get unique titles from latest_release for ongoing
            const uniqueOngoing = [];
            const seenTitles = new Set();
            
            ongoing.forEach(item => {
                // Extract series title from episode title
                const seriesTitle = item.title.replace(/Episode \d+.*$/i, '').replace(/Subtitle Indonesia.*$/i, '').trim();
                
                if (!seenTitles.has(seriesTitle.toLowerCase())) {
                    seenTitles.add(seriesTitle.toLowerCase());
                    uniqueOngoing.push({
                        title: seriesTitle,
                        slug: item.slug.replace(/\/anichin\/episode\//, '').replace(/\/$/, '').replace(/-episode-\d+.*$/i, ''),
                        poster: item.poster,
                        status: item.status,
                        current_episode: item.current_episode || '',
                        type: 'Donghua'
                    });
                }
            });
            
            // Process completed donghua
            const processedCompleted = completedDonghua.map(item => {
                let slug = item.slug || item.url || '';
                
                // Clean slug
                if (typeof slug === 'string') {
                    slug = slug.replace(/^https?:\/\/[^\/]+\/anichin\//, '');
                    slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\//, '');
                    slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\/donghua\//, '');
                    slug = slug.replace(/\/anichin\/detail\//, '');
                    slug = slug.replace(/\/anichin\/episode\//, '');
                    slug = slug.replace(/\/$/, '');
                    slug = slug.replace(/-episode-\d+.*$/i, '');
                    slug = slug.replace(/-tamat-subtitle-indonesia$/i, '');
                    slug = slug.replace(/subtitle-indonesia$/i, '');
                    slug = slug.trim();
                    slug = slug.replace(/^https?:\/\//, '');
                    slug = slug.replace(/^[^\/]+\//, '');
                    slug = slug.replace(/^donghua\//, '');
                    slug = slug.trim();
                }
                
                return {
                    ...item,
                    slug: slug || item.slug,
                    type: item.type || 'Donghua'
                };
            });
            
            return {
                ongoing_anime: uniqueOngoing,
                complete_anime: processedCompleted
            };
        } else {
            throw new Error('Data tidak valid dari API');
        }
    } catch (error) {
        console.error('Error fetching donghua data:', error);
        throw error;
    }
}

// Create anime card element
function createAnimeCard(anime, type = 'ongoing', isDonghua = false) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    
    // Create card HTML
    const episodeInfo = type === 'ongoing' 
        ? `<span class="anime-badge episode">📺 ${anime.current_episode || 'Ongoing'}</span>
           ${anime.release_day ? `<span class="anime-badge">${anime.release_day}</span>` : ''}`
        : `<span class="anime-badge episode">✅ ${anime.episode_count || 'Completed'}</span>
           ${anime.rating ? `<span class="anime-badge rating">⭐ ${anime.rating}</span>` : ''}`;
    
    const dateInfo = type === 'ongoing'
        ? anime.newest_release_date ? `Rilis: ${anime.newest_release_date}` : ''
        : anime.last_release_date ? `Selesai: ${anime.last_release_date}` : '';
    
    const typeBadge = isDonghua ? `<span class="anime-badge" style="background: #ff6b6b;">🐉 Donghua</span>` : '';
    
    card.innerHTML = `
        <img src="${anime.poster}" alt="${anime.title}" class="anime-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/220x320?text=No+Image'">
        <div class="anime-info">
            <h3 class="anime-title">${anime.title}</h3>
            <div class="anime-meta">
                ${typeBadge}
                ${episodeInfo}
            </div>
            ${dateInfo ? `<p class="anime-date">${dateInfo}</p>` : ''}
        </div>
    `;
    
    // Add click event to navigate to detail page
    card.addEventListener('click', () => {
        let slug = anime.slug;
        
        // Clean slug for donghua
        if (isDonghua && typeof slug === 'string') {
            slug = slug.replace(/^https?:\/\/[^\/]+\/anichin\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\/donghua\//, '');
            slug = slug.replace(/^https?:\/\/[^\/]+\/donghua\/detail\//, '');
            slug = slug.replace(/\/anichin\/episode\//, '');
            slug = slug.replace(/\/anichin\/detail\//, '');
            slug = slug.replace(/\/$/, '');
            slug = slug.replace(/-episode-\d+.*$/i, '');
            slug = slug.replace(/-tamat-subtitle-indonesia$/i, '');
            slug = slug.trim();
            slug = slug.replace(/^https?:\/\//, '');
            slug = slug.replace(/^[^\/]+\//, '');
            slug = slug.replace(/^donghua\//, '');
            slug = slug.trim();
        } else if (!isDonghua && typeof slug === 'string') {
            slug = slug.replace('https://otakudesu.best/anime/', '').replace('/', '');
        }
        
        const detailUrl = isDonghua 
            ? `detail.html?slug=${encodeURIComponent(slug)}&type=donghua`
            : `detail.html?slug=${encodeURIComponent(slug)}`;
        window.location.href = detailUrl;
    });
    
    return card;
}

// Display ongoing anime
function displayOngoingAnime(animeList) {
    const container = document.getElementById('ongoing-container');
    
    if (!container) {
        console.error('ongoing-container element not found');
        return;
    }
    
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
    
    if (!container) {
        console.error('completed-container element not found');
        return;
    }
    
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

// Display ongoing donghua
function displayOngoingDonghua(donghuaList) {
    const container = document.getElementById('donghua-ongoing-container');
    
    if (!container) {
        console.error('donghua-ongoing-container element not found');
        return;
    }
    
    container.innerHTML = '';
    
    if (!donghuaList || donghuaList.length === 0) {
        container.innerHTML = '<p class="error-message">Tidak ada donghua ongoing yang tersedia</p>';
        return;
    }
    
    donghuaList.forEach(donghua => {
        const card = createAnimeCard(donghua, 'ongoing', true);
        container.appendChild(card);
    });
}

// Display completed donghua
function displayCompletedDonghua(donghuaList) {
    const container = document.getElementById('donghua-completed-container');
    
    if (!container) {
        console.error('donghua-completed-container element not found');
        return;
    }
    
    container.innerHTML = '';
    
    if (!donghuaList || donghuaList.length === 0) {
        container.innerHTML = '<p class="error-message">Tidak ada donghua yang selesai</p>';
        return;
    }
    
    donghuaList.forEach(donghua => {
        const card = createAnimeCard(donghua, 'completed', true);
        container.appendChild(card);
    });
}

// Show error message
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }
    
    container.innerHTML = `
        <div class="error-message">
            <p>❌ ${message}</p>
            <button id="retry-btn-${containerId}" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                Coba Lagi
            </button>
        </div>
    `;
    
    // Add event listener for retry button
    const retryBtn = document.getElementById(`retry-btn-${containerId}`);
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            location.reload();
        });
    }
}

// Initialize the application with better error handling
async function init() {
    try {
        console.log('Starting homepage initialization...');
        
        // Wait for DOM to be fully loaded
        if (document.readyState !== 'complete') {
            console.log('Waiting for DOM to be complete...');
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve);
                }
            });
        }
        
        // Verify containers exist
        const ongoingContainer = document.getElementById('ongoing-container');
        const completedContainer = document.getElementById('completed-container');
        const donghuaOngoingContainer = document.getElementById('donghua-ongoing-container');
        const donghuaCompletedContainer = document.getElementById('donghua-completed-container');
        
        if (!ongoingContainer) {
            console.error('ongoing-container not found in DOM');
            return;
        }
        
        if (!completedContainer) {
            console.error('completed-container not found in DOM');
            return;
        }
        
        if (!donghuaOngoingContainer) {
            console.error('donghua-ongoing-container not found in DOM');
        }
        
        if (!donghuaCompletedContainer) {
            console.error('donghua-completed-container not found in DOM');
        }
        
        console.log('Containers found, proceeding with initialization...');
        
        // Show loading states
        showLoadingState('ongoing-container');
        showLoadingState('completed-container');
        showLoadingState('donghua-ongoing-container');
        showLoadingState('donghua-completed-container');
        
        // Fetch anime and donghua data in parallel
        const [animeData, donghuaData] = await Promise.allSettled([
            Promise.race([
                fetchAnimeData(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 15000)
                )
            ]),
            Promise.race([
                fetchDonghuaData(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 15000)
                )
            ])
        ]);
        
        // Process anime data
        if (animeData.status === 'fulfilled') {
            const data = animeData.value;
            console.log('Homepage anime data loaded:', data);
            
            // Display ongoing anime
            if (data.ongoing_anime && data.ongoing_anime.length > 0) {
                displayOngoingAnime(data.ongoing_anime);
            } else {
                showEmptyState('ongoing-container', 'Belum ada anime ongoing');
            }
            
            // Display completed anime
            if (data.complete_anime && data.complete_anime.length > 0) {
                displayCompletedAnime(data.complete_anime);
            } else {
                showEmptyState('completed-container', 'Belum ada anime completed');
            }
        } else {
            console.error('Failed to load anime data:', animeData.reason);
            showError('ongoing-container', 'Gagal memuat data anime. Periksa koneksi internet Anda.');
            showError('completed-container', 'Gagal memuat data anime. Periksa koneksi internet Anda.');
        }
        
        // Process donghua data
        if (donghuaData.status === 'fulfilled') {
            const data = donghuaData.value;
            console.log('Homepage donghua data loaded:', data);
            
            // Display ongoing donghua
            if (data.ongoing_anime && data.ongoing_anime.length > 0) {
                displayOngoingDonghua(data.ongoing_anime);
            } else {
                showEmptyState('donghua-ongoing-container', 'Belum ada donghua ongoing');
            }
            
            // Display completed donghua
            if (data.complete_anime && data.complete_anime.length > 0) {
                displayCompletedDonghua(data.complete_anime);
            } else {
                showEmptyState('donghua-completed-container', 'Belum ada donghua completed');
            }
        } else {
            console.error('Failed to load donghua data:', donghuaData.reason);
            // Only show error if it's not a 404 (API might not be available)
            if (donghuaData.reason && !donghuaData.reason.message?.includes('404')) {
                showError('donghua-ongoing-container', 'Gagal memuat data donghua. Periksa koneksi internet Anda.');
                showError('donghua-completed-container', 'Gagal memuat data donghua. Periksa koneksi internet Anda.');
            } else {
                showEmptyState('donghua-ongoing-container', 'Data donghua belum tersedia');
                showEmptyState('donghua-completed-container', 'Data donghua belum tersedia');
            }
        }
        
    } catch (error) {
        console.error('Homepage init error:', error);
        
        // Show specific error messages
        const errorMessage = error.message || '';
        if (errorMessage.includes('timeout')) {
            showError('ongoing-container', 'Koneksi terlalu lambat. Silakan refresh halaman.');
            showError('completed-container', 'Koneksi terlalu lambat. Silakan refresh halaman.');
            showError('donghua-ongoing-container', 'Koneksi terlalu lambat. Silakan refresh halaman.');
            showError('donghua-completed-container', 'Koneksi terlalu lambat. Silakan refresh halaman.');
        } else if (errorMessage.includes('AI Detector')) {
            showError('ongoing-container', 'Server sedang dalam mode perlindungan. Tunggu beberapa menit.');
            showError('completed-container', 'Server sedang dalam mode perlindungan. Tunggu beberapa menit.');
            showError('donghua-ongoing-container', 'Server sedang dalam mode perlindungan. Tunggu beberapa menit.');
            showError('donghua-completed-container', 'Server sedang dalam mode perlindungan. Tunggu beberapa menit.');
        } else {
            showError('ongoing-container', 'Gagal memuat data anime. Periksa koneksi internet Anda.');
            showError('completed-container', 'Gagal memuat data anime. Periksa koneksi internet Anda.');
            showError('donghua-ongoing-container', 'Gagal memuat data donghua. Periksa koneksi internet Anda.');
            showError('donghua-completed-container', 'Gagal memuat data donghua. Periksa koneksi internet Anda.');
        }
    }
}

// Show loading state for containers
function showLoadingState(containerId) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }
    
    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Memuat data...</p>
        </div>
    `;
}

// Show empty state for containers
function showEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📺</div>
            <p>${message}</p>
        </div>
    `;
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
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Handle hero icon image loading
    const heroIcon = document.getElementById('hero-icon-img');
    const heroFallback = document.getElementById('hero-icon-fallback');
    
    if (heroIcon && heroFallback) {
        heroIcon.addEventListener('load', () => {
            console.log('Kanade image loaded successfully');
        });
        
        heroIcon.addEventListener('error', () => {
            console.log('Error loading kanade.jpg');
            heroIcon.style.display = 'none';
            heroFallback.style.display = 'block';
        });
    }
    
    // Handle hero buttons
    const btnStartWatching = document.getElementById('btn-start-watching');
    const btnSearch = document.getElementById('btn-search');
    
    if (btnStartWatching) {
        btnStartWatching.addEventListener('click', () => {
            const ongoingContainer = document.getElementById('ongoing-container');
            if (ongoingContainer) {
                ongoingContainer.scrollIntoView({behavior: 'smooth'});
            }
        });
    }
    
    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
            }
        });
    }
});

// Mobile Menu Toggle
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        // Create mobile menu overlay and panel
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.id = 'mobile-menu-overlay';
        
        const panel = document.createElement('div');
        panel.className = 'mobile-menu-panel';
        panel.id = 'mobile-menu-panel';
        
        // Add close button to mobile panel
        const closeBtn = document.createElement('button');
        closeBtn.className = 'mobile-menu-close';
        closeBtn.innerHTML = '✕';
        closeBtn.setAttribute('aria-label', 'Tutup menu');
        panel.appendChild(closeBtn);
        
        // Clone navigation links to mobile panel
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const clonedLink = link.cloneNode(true);
            panel.appendChild(clonedLink);
        });
        
        // Add overlay and panel to body
        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        
        // Function to close mobile menu
        const closeMobileMenu = () => {
            mobileMenuBtn.classList.remove('active');
            overlay.classList.remove('active');
            panel.classList.remove('active');
            document.body.style.overflow = '';
        };
        
        // Toggle mobile menu
        mobileMenuBtn.addEventListener('click', () => {
            const isActive = mobileMenuBtn.classList.contains('active');
            
            if (isActive) {
                closeMobileMenu();
            } else {
                // Open menu
                mobileMenuBtn.classList.add('active');
                overlay.classList.add('active');
                panel.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
        
        // Close menu when clicking close button
        closeBtn.addEventListener('click', closeMobileMenu);
        
        // Close menu when clicking overlay
        overlay.addEventListener('click', closeMobileMenu);
        
        // Close menu when clicking nav links
        panel.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                closeMobileMenu();
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenuBtn.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    }
}



