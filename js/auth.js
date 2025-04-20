// Function to check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('currentUser') !== null;
}

// Function to redirect if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// Function to handle logout
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Initialize authentication for protected pages
function initAuth() {
    // For protected pages (not login page)
    if (!window.location.pathname.includes('login.html')) {
        requireAuth();
        
        // Set up logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }
    }
}

// Initialize login form
function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // Simple validation
            if (!email || !password) {
                alert('Please enter both email and password');
                return;
            }
            
            // Check if user exists
            let users = JSON.parse(localStorage.getItem('users') || '[]');
            let user = users.find(u => u.email === email);
            
            if (user) {
                // Existing user - verify password (basic, not secure)
                if (user.password === password) {
                    login(user);
                } else {
                    alert('Incorrect password');
                }
            } else {
                // New user - create account
                const newUser = {
                    id: Date.now().toString(),
                    email: email,
                    password: password,
                    createdAt: new Date().toISOString()
                };
                
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));
                login(newUser);
            }
        });
    }
}

// Function to log user in
function login(user) {
    // Store current user without password
    const { password, ...userWithoutPassword } = user;
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    
    // Redirect to dashboard
    window.location.href = 'index.html';
}

// Function to get current user
function getCurrentUser() {
    const userJSON = localStorage.getItem('currentUser');
    return userJSON ? JSON.parse(userJSON) : null;
}

// Initialize authentication
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initLoginForm();
});