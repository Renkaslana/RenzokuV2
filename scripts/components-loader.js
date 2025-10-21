// ============================================
// RENZOKU - COMPONENT LOADER
// Load header and footer components dynamically
// ============================================

/**
 * Load a component from a file and inject it into a placeholder
 * @param {string} elementId - ID of the placeholder element
 * @param {string} componentPath - Path to the component HTML file
 */
async function loadComponent(elementId, componentPath) {
    try {
        // Fetch the component file
        const response = await fetch(componentPath);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get the HTML content
        const html = await response.text();
        
        // Find the placeholder element
        const element = document.getElementById(elementId);
        
        if (element) {
            // Inject the HTML into the placeholder
            element.innerHTML = html;
            console.log(`✅ [Component] Loaded: ${componentPath}`);
        } else {
            console.warn(`⚠️ [Component] Element #${elementId} not found`);
        }
    } catch (error) {
        console.error(`❌ [Component] Failed to load ${componentPath}:`, error);
        
        // Fallback: show error message in placeholder
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div style="padding: 1rem; background: #ff6b6b; color: white;">
                ⚠️ Failed to load component: ${componentPath}
            </div>`;
        }
    }
}

/**
 * Detect the correct path to components based on current page location
 */
function getComponentPath() {
    const currentPath = window.location.pathname;
    
    // If we're in pages/ folder, path should be './components/'
    // If we're in root, path should be './pages/components/'
    if (currentPath.includes('/pages/')) {
        return './components/';
    } else {
        return './pages/components/';
    }
}

/**
 * Initialize all components (header and footer)
 */
async function initComponents() {
    console.log('🔄 [Component] Initializing components...');
    
    const componentPath = getComponentPath();
    console.log(`📁 [Component] Using path: ${componentPath}`);
    
    // Load header component
    await loadComponent('header-placeholder', `${componentPath}header.html`);
    
    // Load footer component
    await loadComponent('footer-placeholder', `${componentPath}footer.html`);
    
    // Initialize scripts that depend on header/footer being loaded
    initHeaderScripts();
    
    console.log('✅ [Component] All components initialized');
}

/**
 * Initialize scripts that depend on header/footer elements
 */
function initHeaderScripts() {
    // Mobile menu initialization
    // (script.js has initMobileMenu function)
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        // Check if initMobileMenu function exists (defined in script.js)
        if (typeof initMobileMenu === 'function') {
            try {
                initMobileMenu();
                console.log('✅ [Component] Mobile menu initialized');
            } catch (error) {
                console.error('❌ [Component] Mobile menu init error:', error);
            }
        } else {
            // Fallback: basic mobile menu setup
            setupBasicMobileMenu();
        }
    }
    
    // Search functionality initialization
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput && searchBtn) {
        setupHeaderSearch();
        console.log('✅ [Component] Search functionality initialized');
    }
    
    console.log('✅ [Component] Header scripts initialized');
}

/**
 * Basic mobile menu setup (fallback if initMobileMenu doesn't exist)
 */
function setupBasicMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        // Create overlay and panel
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.id = 'mobile-menu-overlay';
        
        const panel = document.createElement('div');
        panel.className = 'mobile-menu-panel';
        panel.id = 'mobile-menu-panel';
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'mobile-menu-close';
        closeBtn.innerHTML = '✕';
        closeBtn.setAttribute('aria-label', 'Tutup menu');
        panel.appendChild(closeBtn);
        
        // Clone navigation links
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const clonedLink = link.cloneNode(true);
            panel.appendChild(clonedLink);
        });
        
        // Append to body
        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        
        // Close menu function
        const closeMobileMenu = () => {
            mobileMenuBtn.classList.remove('active');
            overlay.classList.remove('active');
            panel.classList.remove('active');
            document.body.style.overflow = '';
        };
        
        // Toggle menu
        mobileMenuBtn.addEventListener('click', () => {
            const isActive = mobileMenuBtn.classList.contains('active');
            
            if (isActive) {
                closeMobileMenu();
            } else {
                mobileMenuBtn.classList.add('active');
                overlay.classList.add('active');
                panel.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
        
        // Close on overlay click
        overlay.addEventListener('click', closeMobileMenu);
        
        // Close on close button click
        closeBtn.addEventListener('click', closeMobileMenu);
        
        // Close on nav link click
        panel.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                closeMobileMenu();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenuBtn.classList.contains('active')) {
                closeMobileMenu();
            }
        });
        
        console.log('✅ [Component] Basic mobile menu setup complete');
    }
}

/**
 * Setup search functionality for header
 */
function setupHeaderSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (!searchInput || !searchBtn) {
        console.log('⚠️ [Component] Search elements not found');
        return;
    }
    
    // Search on button click
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        console.log('🔍 [Search] Button clicked, query:', query);
        if (query) {
            console.log('🔍 [Search] Redirecting to search page with query:', query);
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        } else {
            console.log('⚠️ [Search] No query entered');
        }
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            console.log('🔍 [Search] Enter pressed, query:', query);
            if (query) {
                console.log('🔍 [Search] Redirecting to search page with query:', query);
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        }
    });
    
    // Focus search input when pressing Ctrl+K (common shortcut)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            console.log('🔍 [Search] Focused search input with Ctrl+K');
        }
    });
    
    console.log('✅ [Component] Header search functionality setup complete');
}

// Auto-run component initialization when DOM is ready
if (document.readyState === 'loading') {
    // DOM still loading, wait for DOMContentLoaded event
    document.addEventListener('DOMContentLoaded', initComponents);
} else {
    // DOM already loaded, run immediately
    initComponents();
}

