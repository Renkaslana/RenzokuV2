// Debug Helper untuk Episode Page
// Gunakan ini untuk debugging masalah video stream dan download links

const EpisodeDebugger = {
    // Test API response
    async testAPIResponse(slug) {
        console.log('🔍 Testing API response for slug:', slug);
        
        try {
            const response = await fetch(`https://www.sankavollerei.com/anime/episode/${slug}`);
            console.log('📡 API Response Status:', response.status);
            console.log('📡 API Response Headers:', response.headers);
            
            const data = await response.json();
            console.log('📊 API Response Data:', data);
            
            // Analyze video URLs
            if (data.data) {
                console.log('🎬 Video URL Analysis:');
                const videoProperties = ['video_url', 'video_stream', 'stream_url', 'player_url', 'iframe_url', 'embed_url', 'video', 'stream', 'player'];
                videoProperties.forEach(prop => {
                    if (data.data[prop]) {
                        console.log(`✅ Found ${prop}:`, data.data[prop]);
                    } else {
                        console.log(`❌ Missing ${prop}`);
                    }
                });
                
                // Analyze download URLs
                console.log('📥 Download URL Analysis:');
                const downloadProperties = ['download_urls', 'downloads', 'download', 'links'];
                downloadProperties.forEach(prop => {
                    if (data.data[prop]) {
                        console.log(`✅ Found ${prop}:`, data.data[prop]);
                        console.log(`   Type: ${typeof data.data[prop]}`);
                        console.log(`   Is Array: ${Array.isArray(data.data[prop])}`);
                        if (Array.isArray(data.data[prop])) {
                            console.log(`   Length: ${data.data[prop].length}`);
                        } else if (typeof data.data[prop] === 'object') {
                            console.log(`   Keys: ${Object.keys(data.data[prop])}`);
                        }
                    } else {
                        console.log(`❌ Missing ${prop}`);
                    }
                });
                
                // Show all available properties
                console.log('📋 All Episode Properties:', Object.keys(data.data));
                console.log('📋 Full Episode Data:', JSON.stringify(data.data, null, 2));
            }
            
            return data;
        } catch (error) {
            console.error('❌ API Test Error:', error);
            return null;
        }
    },
    
    // Test DOM elements
    testDOMElements() {
        console.log('🔍 Testing DOM Elements:');
        
        const elements = [
            'episode-title',
            'video-player',
            'mp4-grid',
            'mkv-grid',
            'mp4-downloads',
            'mkv-downloads',
            'loading-state',
            'error-state',
            'episode-content'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`- ${id}:`, element ? '✅ Found' : '❌ Not Found');
            if (element) {
                console.log(`  - Display: ${element.style.display || 'default'}`);
                console.log(`  - Classes: ${element.className}`);
            }
        });
    },
    
    // Test current episode data
    testCurrentEpisode() {
        console.log('🔍 Testing Current Episode Data:');
        
        const slug = new URLSearchParams(window.location.search).get('slug');
        console.log('- Current Slug:', slug);
        
        if (window.EpisodeManager) {
            console.log('- EpisodeManager Available:', true);
            console.log('- Cached Episodes:', window.EpisodeManager.episodeCache?.size || 0);
        } else {
            console.log('- EpisodeManager Available:', false);
        }
    },
    
    // Run all tests
    async runAllTests() {
        console.log('🚀 Running Episode Debug Tests...');
        
        this.testDOMElements();
        this.testCurrentEpisode();
        
        const slug = new URLSearchParams(window.location.search).get('slug');
        if (slug) {
            await this.testAPIResponse(slug);
        } else {
            console.log('⚠️ No slug found in URL');
        }
        
        console.log('✅ Debug tests completed');
    },
    
    // Clear cache
    clearCache() {
        console.log('🧹 Clearing Episode Cache...');
        
        if (window.EpisodeManager && window.EpisodeManager.episodeCache) {
            window.EpisodeManager.episodeCache.clear();
            console.log('✅ Episode cache cleared');
        }
        
        // Clear service worker cache
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                    console.log('✅ Cache cleared:', cacheName);
                });
            });
        }
    },
    
    // Force reload episode
    forceReloadEpisode() {
        console.log('🔄 Force reloading episode...');
        
        if (window.EpisodeManager) {
            window.EpisodeManager.init();
        } else {
            console.log('❌ EpisodeManager not available');
        }
    }
};

// Make debugger available globally
window.EpisodeDebugger = EpisodeDebugger;

// Auto-run tests if in debug mode
if (window.location.search.includes('debug=true')) {
    console.log('🐛 Debug mode enabled');
    EpisodeDebugger.runAllTests();
}

// Add debug commands to console
console.log('🔧 Episode Debugger available!');
console.log('Commands:');
console.log('- EpisodeDebugger.runAllTests()');
console.log('- EpisodeDebugger.testAPIResponse("slug")');
console.log('- EpisodeDebugger.testDOMElements()');
console.log('- EpisodeDebugger.clearCache()');
console.log('- EpisodeDebugger.forceReloadEpisode()');
console.log('- Add ?debug=true to URL for auto-testing');
