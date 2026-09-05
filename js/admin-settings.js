// DOM Elements
const agencyNameInput = document.getElementById('agency-name');
const agencyEmailInput = document.getElementById('agency-email');
const instagramUrlInput = document.getElementById('instagram-url');
const applicationStatusSelect = document.getElementById('application-status');
const maintenanceModeToggle = document.getElementById('maintenance-mode');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const adminSidebar = document.getElementById('admin-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const logoutBtn = document.getElementById('logout-btn');
const adminNameEl = document.getElementById('admin-name');

// State
let settingsData = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authentication
    if (!requireAdmin()) return;
    
    // Display admin name
    const admin = getCurrentAdmin();
    if (adminNameEl && admin) {
        adminNameEl.textContent = admin.username;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load settings
    await loadSettings();
});

// Setup Event Listeners
function setupEventListeners() {
    // Save settings
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // Mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleMobileMenu);
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutAdmin);
    }
}

// Toggle Mobile Menu
function toggleMobileMenu() {
    if (adminSidebar) {
        adminSidebar.classList.toggle('active');
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.classList.toggle('active');
    }
}

// Load Settings
async function loadSettings() {
    try {
        const { data, error } = await supabaseQuery('site_settings', 'select');
        
        if (error) throw error;
        
        // Convert to object
        settingsData = {};
        if (data) {
            data.forEach(setting => {
                settingsData[setting.setting_key] = setting.setting_value;
            });
        }
        
        // Populate form fields
        if (agencyNameInput) {
            agencyNameInput.value = settingsData.agency_name || 'K MUSE NOVA';
        }
        
        if (agencyEmailInput) {
            agencyEmailInput.value = settingsData.agency_email || '';
        }
        
        if (instagramUrlInput) {
            instagramUrlInput.value = settingsData.instagram_url || '';
        }
        
        if (applicationStatusSelect) {
            applicationStatusSelect.value = settingsData.application_status || 'open';
        }
        
        if (maintenanceModeToggle) {
            maintenanceModeToggle.checked = settingsData.maintenance_mode === 'true';
        }
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showToast('Failed to load settings.', 'error');
    }
}

// Save Settings
async function saveSettings() {
    // Disable button
    if (saveSettingsBtn) {
        saveSettingsBtn.disabled = true;
        saveSettingsBtn.textContent = 'SAVING...';
    }
    
    try {
        // Prepare settings to save
        const newSettings = {
            agency_name: agencyNameInput ? agencyNameInput.value : '',
            agency_email: agencyEmailInput ? agencyEmailInput.value : '',
            instagram_url: instagramUrlInput ? instagramUrlInput.value : '',
            application_status: applicationStatusSelect ? applicationStatusSelect.value : 'open',
            maintenance_mode: maintenanceModeToggle ? maintenanceModeToggle.checked.toString() : 'false'
        };
        
        // Update or insert each setting
        for (const [key, value] of Object.entries(newSettings)) {
            // Check if setting exists
            const { data: existingSetting } = await supabaseQuery('site_settings', 'select', {
                filters: { setting_key: key }
            });
            
            if (existingSetting && existingSetting.length > 0) {
                // Update existing setting
                const { error } = await supabaseQuery('site_settings', 'update', {
                    data: { setting_value: value, updated_at: new Date().toISOString() },
                    filters: { setting_key: key }
                });
                
                if (error) throw error;
            } else {
                // Insert new setting
                const { error } = await supabaseQuery('site_settings', 'insert', {
                    data: { setting_key: key, setting_value: value }
                });
                
                if (error) throw error;
            }
        }
        
        // Update local state
        settingsData = newSettings;
        
        showToast('Settings saved successfully.', 'success');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Failed to save settings.', 'error');
    } finally {
        // Re-enable button
        if (saveSettingsBtn) {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.textContent = 'SAVE SETTINGS';
        }
    }
}
