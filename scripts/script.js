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
        
        if (!ongoingContainer) {
            console.error('ongoing-container not found in DOM');
            return;
        }
        
        if (!completedContainer) {
            console.error('completed-container not found in DOM');
            return;
        }
        
        console.log('Containers found, proceeding with initialization...');
        
        // Show loading states
        showLoadingState('ongoing-container');
        showLoadingState('completed-container');
        
        // Fetch data from API with timeout
        const data = await Promise.race([
            fetchAnimeData(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 15000)
            )
        ]);
        
        console.log('Homepage data loaded:', data);
        
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
        
    } catch (error) {
        console.error('Homepage init error:', error);
        
        // Show specific error messages
        if (error.message.includes('timeout')) {
            showError('ongoing-container', 'Koneksi terlalu lambat. Silakan refresh halaman.');
            showError('completed-container', 'Koneksi terlalu lambat. Silakan refresh halaman.');
        } else if (error.message.includes('AI Detector')) {
            showError('ongoing-container', 'Server sedang dalam mode perlindungan. Tunggu beberapa menit.');
            showError('completed-container', 'Server sedang dalam mode perlindungan. Tunggu beberapa menit.');
        } else {
            showError('ongoing-container', 'Gagal memuat data anime. Periksa koneksi internet Anda.');
            showError('completed-container', 'Gagal memuat data anime. Periksa koneksi internet Anda.');
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



