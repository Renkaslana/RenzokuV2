// Schedule API Configuration
const SCHEDULE_API_URL = 'https://www.sankavollerei.com/anime/schedule';

// Fetch schedule data from API
async function fetchScheduleData() {
    try {
        console.log('Fetching schedule data...');
        const response = await fetch(SCHEDULE_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Schedule API Response:', result);
        
        if (result.status === 'success' && result.data) {
            console.log('Found schedule data:', result.data.length, 'days');
            return result.data;
        } else {
            throw new Error('Data jadwal tidak valid dari API');
        }
    } catch (error) {
        console.error('Error fetching schedule data:', error);
        throw error;
    }
}

// Show loading state
function showLoading() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('schedule-content').style.display = 'none';
}

// Show error state
function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    document.getElementById('schedule-content').style.display = 'none';
}

// Show schedule content
function showContent() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('schedule-content').style.display = 'block';
}

// Get day icon
function getDayIcon(day) {
    const icons = {
        'Senin': '📅',
        'Selasa': '📅',
        'Rabu': '📅',
        'Kamis': '📅',
        'Jumat': '📅',
        'Sabtu': '📅',
        'Minggu': '📅',
        'Random': '🎲'
    };
    return icons[day] || '📅';
}

// Create anime card for schedule
function createScheduleAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'schedule-anime-card';
    
    // Extract slug from URL
    const slug = anime.slug;
    
    card.innerHTML = `
        <img src="${anime.poster}" alt="${anime.anime_name}" class="schedule-anime-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/200x280?text=No+Image'">
        <div class="schedule-anime-info">
            <h3 class="schedule-anime-title">${anime.anime_name}</h3>
            <div class="schedule-anime-meta">Episode Baru</div>
        </div>
    `;
    
    // Add click event to navigate to detail page
    card.addEventListener('click', () => {
        window.location.href = `detail.html?slug=${slug}`;
    });
    
    return card;
}

// Create day section
function createDaySection(dayData) {
    const section = document.createElement('div');
    section.className = 'day-section';
    section.setAttribute('data-day', dayData.day);
    
    const dayIcon = getDayIcon(dayData.day);
    const animeCount = dayData.anime_list ? dayData.anime_list.length : 0;
    
    section.innerHTML = `
        <div class="day-header">
            <span class="day-icon">${dayIcon}</span>
            <h2 class="day-name">${dayData.day}</h2>
            <span class="day-count">${animeCount} Anime</span>
        </div>
        <div class="day-anime-grid">
            <!-- Anime cards will be populated here -->
        </div>
    `;
    
    // Add anime cards
    const animeGrid = section.querySelector('.day-anime-grid');
    if (dayData.anime_list && dayData.anime_list.length > 0) {
        dayData.anime_list.forEach(anime => {
            const card = createScheduleAnimeCard(anime);
            animeGrid.appendChild(card);
        });
    } else {
        animeGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 2rem;">Tidak ada anime yang tayang hari ini</p>';
    }
    
    return section;
}

// Display schedule data
function displaySchedule(scheduleData) {
    const container = document.getElementById('schedule-grid');
    container.innerHTML = '';
    
    // Update schedule count
    const totalAnime = scheduleData.reduce((total, day) => total + (day.anime_list ? day.anime_list.length : 0), 0);
    document.getElementById('schedule-count').textContent = `${totalAnime} anime dalam jadwal`;
    
    if (!scheduleData || scheduleData.length === 0) {
        showError('Tidak ada data jadwal anime yang tersedia');
        return;
    }
    
    // Create sections for each day
    scheduleData.forEach(dayData => {
        const section = createDaySection(dayData);
        container.appendChild(section);
    });
    
    showContent();
}

// Filter schedule by day
function filterScheduleByDay(day) {
    const sections = document.querySelectorAll('.day-section');
    
    sections.forEach(section => {
        if (day === 'all' || section.getAttribute('data-day') === day) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

// Setup day navigation
function setupDayNavigation() {
    const dayButtons = document.querySelectorAll('.day-btn');
    
    dayButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            dayButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Filter schedule
            const day = button.getAttribute('data-day');
            filterScheduleByDay(day);
        });
    });
}

// Search functionality for schedule page
function setupSearchFunctionality() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (!searchInput || !searchBtn) {
        console.log('Search elements not found on schedule page');
        return;
    }
    
    // Search on button click
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        }
    });
}

// Initialize schedule page
async function initSchedule() {
    showLoading();
    
    try {
        const scheduleData = await fetchScheduleData();
        displaySchedule(scheduleData);
        setupDayNavigation();
        setupSearchFunctionality();
    } catch (error) {
        showError('Gagal memuat jadwal anime. Periksa koneksi internet Anda.');
        console.error('Schedule init error:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSchedule);
