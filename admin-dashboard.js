// DOM Elements
const applicationsTable = document.getElementById('applications-table');
const applicationsMobileCards = document.getElementById('applications-mobile-cards');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const categoryFilter = document.getElementById('category-filter');
const experienceFilter = document.getElementById('experience-filter');
const sortSelect = document.getElementById('sort-select');
const totalApplicationsEl = document.getElementById('total-applications');
const newApplicationsEl = document.getElementById('new-applications');
const underReviewEl = document.getElementById('under-review');
const shortlistedEl = document.getElementById('shortlisted');
const interviewEl = document.getElementById('interview');
const selectedEl = document.getElementById('selected');
const rejectedEl = document.getElementById('rejected');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const adminSidebar = document.getElementById('admin-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const logoutBtn = document.getElementById('logout-btn');
const adminNameEl = document.getElementById('admin-name');

// State
let allApplications = [];
let filteredApplications = [];

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
    
    // Load applications
    await loadApplications();
    
    // Load statistics
    await loadStatistics();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterApplications, 300));
    }
    
    // Filters
    if (statusFilter) {
        statusFilter.addEventListener('change', filterApplications);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterApplications);
    }
    
    if (experienceFilter) {
        experienceFilter.addEventListener('change', filterApplications);
    }
    
    // Sort
    if (sortSelect) {
        sortSelect.addEventListener('change', filterApplications);
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

// Load Applications
async function loadApplications() {
    try {
        const { data, error } = await supabaseQuery('applications', 'select', {
            order: { column: 'created_at', ascending: false }
        });
        
        if (error) throw error;
        
        allApplications = data || [];
        filteredApplications = [...allApplications];
        
        renderApplications();
    } catch (error) {
        console.error('Error loading applications:', error);
        showToast('Failed to load applications.', 'error');
    }
}

// Load Statistics
async function loadStatistics() {
    try {
        // Total applications
        if (totalApplicationsEl) {
            totalApplicationsEl.textContent = allApplications.length;
        }
        
        // Count by status
        const statusCounts = {
            submitted: 0,
            under_review: 0,
            shortlisted: 0,
            interview: 0,
            selected: 0,
            rejected: 0
        };
        
        allApplications.forEach(app => {
            if (statusCounts.hasOwnProperty(app.status)) {
                statusCounts[app.status]++;
            }
        });
        
        // New applications (submitted in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const newApplications = allApplications.filter(app => {
            const appDate = new Date(app.created_at);
            return appDate >= sevenDaysAgo;
        });
        
        if (newApplicationsEl) {
            newApplicationsEl.textContent = newApplications.length;
        }
        
        if (underReviewEl) {
            underReviewEl.textContent = statusCounts.under_review;
        }
        
        if (shortlistedEl) {
            shortlistedEl.textContent = statusCounts.shortlisted;
        }
        
        if (interviewEl) {
            interviewEl.textContent = statusCounts.interview;
        }
        
        if (selectedEl) {
            selectedEl.textContent = statusCounts.selected;
        }
        
        if (rejectedEl) {
            rejectedEl.textContent = statusCounts.rejected;
        }
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Filter Applications
function filterApplications() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const categoryValue = categoryFilter ? categoryFilter.value : '';
    const experienceValue = experienceFilter ? experienceFilter.value : '';
    const sortValue = sortSelect ? sortSelect.value : 'newest';
    
    // Apply filters
    filteredApplications = allApplications.filter(app => {
        // Search filter
        const matchesSearch = !searchTerm || 
            app.application_number.toLowerCase().includes(searchTerm) ||
            app.full_name.toLowerCase().includes(searchTerm) ||
            (app.mobile && app.mobile.toLowerCase().includes(searchTerm)) ||
            (app.email && app.email.toLowerCase().includes(searchTerm));
        
        // Status filter
        const matchesStatus = !statusValue || app.status === statusValue;
        
        // Category filter
        const matchesCategory = !categoryValue || app.primary_category === categoryValue;
        
        // Experience filter
        const matchesExperience = !experienceValue || app.experience_level === experienceValue;
        
        return matchesSearch && matchesStatus && matchesCategory && matchesExperience;
    });
    
    // Apply sorting
    filteredApplications.sort((a, b) => {
        switch (sortValue) {
            case 'newest':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'oldest':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'name-az':
                return a.full_name.localeCompare(b.full_name);
            case 'name-za':
                return b.full_name.localeCompare(a.full_name);
            default:
                return 0;
        }
    });
    
    renderApplications();
}

// Render Applications
function renderApplications() {
    // Render table
    if (applicationsTable) {
        const tbody = applicationsTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (filteredApplications.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--color-gray-medium);">
                        No applications found matching your criteria.
                    </td>
                </tr>
            `;
            return;
        }
        
        filteredApplications.forEach(app => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${app.application_number}</td>
                <td>${app.full_name}</td>
                <td>${app.primary_category}</td>
                <td>${app.age}</td>
                <td>${app.city}, ${app.country}</td>
                <td><span class="status-badge status-${app.status}">${formatStatus(app.status)}</span></td>
                <td>${formatDate(app.created_at)}</td>
                <td>
                    <div class="actions">
                        <a href="application.html?id=${app.id}" class="btn-view">VIEW</a>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Render mobile cards
    if (applicationsMobileCards) {
        applicationsMobileCards.innerHTML = '';
        
        if (filteredApplications.length === 0) {
            applicationsMobileCards.innerHTML = `
                <div class="application-card" style="text-align: center; padding: 2rem; color: var(--color-gray-medium);">
                    No applications found matching your criteria.
                </div>
            `;
            return;
        }
        
        filteredApplications.forEach(app => {
            const card = document.createElement('div');
            card.className = 'application-card';
            card.innerHTML = `
                <div class="application-card-header">
                    <div>
                        <div class="application-card-id">${app.application_number}</div>
                        <div class="application-card-name">${app.full_name}</div>
                    </div>
                    <span class="status-badge status-${app.status}">${formatStatus(app.status)}</span>
                </div>
                <div class="application-card-details">
                    <div class="application-card-detail">
                        <label>Category</label>
                        <p>${app.primary_category}</p>
                    </div>
                    <div class="application-card-detail">
                        <label>Age</label>
                        <p>${app.age}</p>
                    </div>
                    <div class="application-card-detail">
                        <label>Location</label>
                        <p>${app.city}, ${app.country}</p>
                    </div>
                    <div class="application-card-detail">
                        <label>Submitted</label>
                        <p>${formatDate(app.created_at)}</p>
                    </div>
                </div>
                <div class="application-card-actions">
                    <a href="application.html?id=${app.id}" class="btn-view">VIEW DETAILS</a>
                </div>
            `;
            applicationsMobileCards.appendChild(card);
        });
    }
}

// Format Status
function formatStatus(status) {
    return status.replace(/_/g, ' ');
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
