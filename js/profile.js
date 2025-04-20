// Initialize profile page
function initProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Display user information
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('account-created').textContent = formatDateTime(currentUser.createdAt);
    
    // Set up theme toggle
    const themeSwitch = document.getElementById('theme-switch');
    themeSwitch.addEventListener('change', function() {
        const theme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
    
    // Load and display stats
    loadUserStats(currentUser.id);
}

// Load user statistics
function loadUserStats(userId) {
    // Get timelines
    const timelines = getUserTimelines(userId);
    
    // Count total timelines
    document.getElementById('total-timelines').textContent = timelines.length;
    
    // Count total events across all timelines
    let totalEvents = 0;
    timelines.forEach(timeline => {
        totalEvents += (timeline.events ? timeline.events.length : 0);
    });
    document.getElementById('total-events').textContent = totalEvents;
    
    // Get last updated date
    const lastUpdated = localStorage.getItem(`lastUpdated_${userId}`);
    if (lastUpdated) {
        document.getElementById('last-updated').textContent = formatDateTime(lastUpdated);
    }
}

// Get user timelines
function getUserTimelines(userId) {
    return JSON.parse(localStorage.getItem(`timelines_${userId}`) || '[]');
}

// Initialize profile on page load
document.addEventListener('DOMContentLoaded', initProfile);