// DOM Elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-button');
const loginMessage = document.getElementById('login-message');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (isAdminLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Setup form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    // Get form values
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Validate inputs
    if (!username || !password) {
        showLoginMessage('Please enter both username and password.', 'error');
        return;
    }
    
    // Disable button and show loading state
    loginButton.disabled = true;
    loginButton.textContent = 'LOGGING IN...';
    clearLoginMessage();
    
    try {
        // Query users table for matching username
        const { data, error } = await supabaseQuery('users', 'select', {
            filters: { username: username }
        });
        
        if (error) throw error;
        
        // Check if user exists
        if (!data || data.length === 0) {
            showLoginMessage('Invalid username or password.', 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'LOGIN';
            return;
        }
        
        const user = data[0];
        
        // Check password (plain text for experimental version)
        // NOTE: In production, this should use password hashing
        if (user.password !== password) {
            showLoginMessage('Invalid username or password.', 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'LOGIN';
            return;
        }
        
        // Check if user is admin
        if (user.role !== 'admin') {
            showLoginMessage('You do not have admin access.', 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'LOGIN';
            return;
        }
        
        // Check if user is active
        if (!user.is_active) {
            showLoginMessage('Your account has been deactivated.', 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'LOGIN';
            return;
        }
        
        // Create admin session
        const adminSession = {
            userId: user.id,
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString()
        };
        
        // Store session in localStorage
        localStorage.setItem('kmn_admin_session', JSON.stringify(adminSession));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        showLoginMessage('An error occurred during login. Please try again.', 'error');
        loginButton.disabled = false;
        loginButton.textContent = 'LOGIN';
    }
}

// Show Login Message
function showLoginMessage(message, type) {
    if (loginMessage) {
        loginMessage.textContent = message;
        loginMessage.className = `login-message ${type}`;
        loginMessage.style.display = 'block';
    }
}

// Clear Login Message
function clearLoginMessage() {
    if (loginMessage) {
        loginMessage.style.display = 'none';
    }
}

// Check if Admin is Logged In
function isAdminLoggedIn() {
    const session = localStorage.getItem('kmn_admin_session');
    return session !== null;
}

// Get Current Admin
function getCurrentAdmin() {
    const session = localStorage.getItem('kmn_admin_session');
    return session ? JSON.parse(session) : null;
}

// Require Admin Authentication
function requireAdmin() {
    if (!isAdminLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Logout Admin
function logoutAdmin() {
    localStorage.removeItem('kmn_admin_session');
    window.location.href = 'login.html';
}
