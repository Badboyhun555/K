// DOM Elements
const applicationId = new URLSearchParams(window.location.search).get('id');
const personalInfoSection = document.getElementById('personal-info');
const professionalInfoSection = document.getElementById('professional-info');
const portfolioSection = document.getElementById('portfolio-section');
const videoSection = document.getElementById('video-section');
const applicationDetailsSection = document.getElementById('application-details');
const notesSection = document.getElementById('notes-section');
const statusSection = document.getElementById('status-section');
const photoGallery = document.getElementById('photo-gallery');
const videoContainer = document.getElementById('video-container');
const noVideoMessage = document.getElementById('no-video-message');
const notesList = document.getElementById('notes-list');
const noteTextarea = document.getElementById('note-textarea');
const saveNoteBtn = document.getElementById('save-note-btn');
const currentStatusEl = document.getElementById('current-status');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const adminSidebar = document.getElementById('admin-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const logoutBtn = document.getElementById('logout-btn');
const adminNameEl = document.getElementById('admin-name');
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const closeModalBtn = document.getElementById('close-modal');

// State
let applicationData = null;
let applicationFiles = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authentication
    if (!requireAdmin()) return;
    
    // Check if application ID is provided
    if (!applicationId) {
        showToast('No application ID provided.', 'error');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Display admin name
    const admin = getCurrentAdmin();
    if (adminNameEl && admin) {
        adminNameEl.textContent = admin.username;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load application data
    await loadApplication();
});

// Setup Event Listeners
function setupEventListeners() {
    // Save note
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', saveNote);
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
    
    // Image modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeImageModal);
    }
    
    if (imageModal) {
        imageModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeImageModal();
            }
        });
    }
    
    // Status action buttons
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', function() {
            const newStatus = this.getAttribute('data-status');
            updateApplicationStatus(newStatus);
        });
    });
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

// Load Application
async function loadApplication() {
    try {
        // Load application data
        const { data, error } = await supabaseQuery('applications', 'select', {
            filters: { id: applicationId }
        });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            showToast('Application not found.', 'error');
            window.location.href = 'dashboard.html';
            return;
        }
        
        applicationData = data[0];
        
        // Load application files
        const { data: files, error: filesError } = await supabaseQuery('application_files', 'select', {
            filters: { application_id: applicationId }
        });
        
        if (!filesError) {
            applicationFiles = files || [];
        }
        
        // Load notes
        await loadNotes();
        
        // Render all sections
        renderPersonalInfo();
        renderProfessionalInfo();
        renderPortfolio();
        renderVideo();
        renderApplicationDetails();
        renderStatus();
        
    } catch (error) {
        console.error('Error loading application:', error);
        showToast('Failed to load application.', 'error');
    }
}

// Render Personal Info
function renderPersonalInfo() {
    if (!personalInfoSection || !applicationData) return;
    
    personalInfoSection.innerHTML = `
        <div class="detail-card-header">
            <h2>PERSONAL INFORMATION</h2>
        </div>
        <div class="detail-card-body">
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Full Name</label>
                    <p>${applicationData.full_name}</p>
                </div>
                <div class="detail-item">
                    <label>Date of Birth</label>
                    <p>${formatDate(applicationData.date_of_birth)}</p>
                </div>
                <div class="detail-item">
                    <label>Age</label>
                    <p>${applicationData.age}</p>
                </div>
                <div class="detail-item">
                    <label>Gender</label>
                    <p>${applicationData.gender || 'Not specified'}</p>
                </div>
                <div class="detail-item">
                    <label>City</label>
                    <p>${applicationData.city}</p>
                </div>
                <div class="detail-item">
                    <label>State</label>
                    <p>${applicationData.state || 'Not specified'}</p>
                </div>
                <div class="detail-item">
                    <label>Country</label>
                    <p>${applicationData.country}</p>
                </div>
                <div class="detail-item">
                    <label>Mobile Number</label>
                    <p>${applicationData.mobile}</p>
                </div>
                <div class="detail-item">
                    <label>Email</label>
                    <p>${applicationData.email || 'Not provided'}</p>
                </div>
            </div>
        </div>
    `;
}

// Render Professional Info
function renderProfessionalInfo() {
    if (!professionalInfoSection || !applicationData) return;
    
    professionalInfoSection.innerHTML = `
        <div class="detail-card-header">
            <h2>PROFESSIONAL PROFILE</h2>
        </div>
        <div class="detail-card-body">
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Primary Category</label>
                    <p>${applicationData.primary_category}</p>
                </div>
                <div class="detail-item">
                    <label>Secondary Category</label>
                    <p>${applicationData.secondary_category || 'Not specified'}</p>
                </div>
                <div class="detail-item">
                    <label>Experience Level</label>
                    <p>${applicationData.experience_level || 'Not specified'}</p>
                </div>
                <div class="detail-item">
                    <label>Languages</label>
                    <p>${applicationData.languages || 'Not specified'}</p>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <label>Portfolio URL</label>
                    <p>${applicationData.portfolio_url ? `<a href="${applicationData.portfolio_url}" target="_blank">${applicationData.portfolio_url}</a>` : 'Not provided'}</p>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <label>Instagram URL</label>
                    <p>${applicationData.instagram_url ? `<a href="${applicationData.instagram_url}" target="_blank">${applicationData.instagram_url}</a>` : 'Not provided'}</p>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <label>Other Professional Link</label>
                    <p>${applicationData.other_link ? `<a href="${applicationData.other_link}" target="_blank">${applicationData.other_link}</a>` : 'Not provided'}</p>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <label>Skills</label>
                    <p>${applicationData.skills || 'Not specified'}</p>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <label>About</label>
                    <p>${applicationData.about || 'Not provided'}</p>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <label>Why Join K MUSE NOVA?</label>
                    <p>${applicationData.motivation || 'Not provided'}</p>
                </div>
            </div>
        </div>
    `;
}

// Render Portfolio
async function renderPortfolio() {
    if (!portfolioSection) return;
    
    const photoFiles = applicationFiles.filter(file => file.file_type === 'photo');
    const photoTitles = [
        'Profile / Headshot',
        'Full Body',
        'Side / Profile View',
        'Portrait',
        'Natural / Casual',
        'Additional Portfolio Photo'
    ];
    
    if (photoGallery) {
        photoGallery.innerHTML = '';
        
        if (photoFiles.length === 0) {
            photoGallery.innerHTML = '<p style="color: var(--color-gray-medium); padding: 2rem; text-align: center; grid-column: 1 / -1;">No photos uploaded.</p>';
            return;
        }
        
        for (let i = 0; i < 6; i++) {
            const photoFile = photoFiles.find(file => file.slot_number === i + 1);
            
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            
            let imageContent = '<div class="photo-item-image"><p style="color: var(--color-gray-medium);">Photo not available</p></div>';
            
            if (photoFile) {
                // Get signed URL for the photo
                const { data, error } = await getSignedUrl('applications', photoFile.file_path);
                
                if (!error && data) {
                    imageContent = `
                        <div class="photo-item-image">
                            <img src="${data.signedUrl}" alt="Photo ${i + 1}" loading="lazy">
                        </div>
                    `;
                }
            }
            
            photoItem.innerHTML = `
                <div class="photo-item-header">Photo ${String(i + 1).padStart(2, '0')} — ${photoTitles[i]}</div>
                ${imageContent}
                ${photoFile ? `
                <div class="photo-item-actions">
                    <a href="#" class="btn-view-large" onclick="viewLargeImage('${photoFile.file_path}', event)">View Larger</a>
                </div>
                ` : ''}
            `;
            
            photoGallery.appendChild(photoItem);
        }
    }
}

// View Large Image
async function viewLargeImage(filePath, event) {
    if (event) event.preventDefault();
    
    if (!imageModal || !modalImage) return;
    
    try {
        const { data, error } = await getSignedUrl('applications', filePath);
        
        if (error) throw error;
        
        modalImage.src = data.signedUrl;
        imageModal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading image:', error);
        showToast('Failed to load image.', 'error');
    }
}

// Close Image Modal
function closeImageModal() {
    if (imageModal) {
        imageModal.style.display = 'none';
        modalImage.src = '';
    }
}

// Render Video
async function renderVideo() {
    if (!videoSection) return;
    
    const videoFile = applicationFiles.find(file => file.file_type === 'video');
    
    if (videoContainer && noVideoMessage) {
        if (videoFile) {
            // Get signed URL for the video
            const { data, error } = await getSignedUrl('applications', videoFile.file_path);
            
            if (!error && data) {
                videoContainer.innerHTML = `
                    <video controls>
                        <source src="${data.signedUrl}" type="${videoFile.mime_type}">
                        Your browser does not support the video tag.
                    </video>
                `;
                videoContainer.style.display = 'block';
                noVideoMessage.style.display = 'none';
            } else {
                videoContainer.style.display = 'none';
                noVideoMessage.style.display = 'block';
            }
        } else {
            videoContainer.style.display = 'none';
            noVideoMessage.style.display = 'block';
        }
    }
}

// Render Application Details
function renderApplicationDetails() {
    if (!applicationDetailsSection || !applicationData) return;
    
    applicationDetailsSection.innerHTML = `
        <div class="detail-card-header">
            <h2>APPLICATION DETAILS</h2>
        </div>
        <div class="detail-card-body">
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Application ID</label>
                    <p>${applicationData.application_number}</p>
                </div>
                <div class="detail-item">
                    <label>Current Status</label>
                    <p><span class="status-badge status-${applicationData.status}">${formatStatus(applicationData.status)}</span></p>
                </div>
                <div class="detail-item">
                    <label>Submitted On</label>
                    <p>${formatDate(applicationData.created_at)}</p>
                </div>
                <div class="detail-item">
                    <label>Last Updated</label>
                    <p>${formatDate(applicationData.updated_at)}</p>
                </div>
                <div class="detail-item">
                    <label>Consent Confirmed</label>
                    <p>${applicationData.consent_confirmed ? 'Yes' : 'No'}</p>
                </div>
            </div>
        </div>
    `;
}

// Render Status
function renderStatus() {
    if (!statusSection || !applicationData) return;
    
    if (currentStatusEl) {
        currentStatusEl.innerHTML = `<span class="status-badge status-${applicationData.status}">${formatStatus(applicationData.status)}</span>`;
    }
}

// Update Application Status
async function updateApplicationStatus(newStatus) {
    // Require confirmation for destructive actions
    if (newStatus === 'rejected' || newStatus === 'archived') {
        const confirmMessage = newStatus === 'rejected' 
            ? 'Are you sure you want to reject this application?' 
            : 'Are you sure you want to archive this application?';
        
        if (!confirm(confirmMessage)) {
            return;
        }
    }
    
    try {
        const { error } = await supabaseQuery('applications', 'update', {
            data: { status: newStatus },
            filters: { id: applicationId }
        });
        
        if (error) throw error;
        
        // Update local state
        applicationData.status = newStatus;
        
        // Re-render status sections
        renderStatus();
        renderApplicationDetails();
        
        showToast('Application status updated.', 'success');
        
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Failed to update application status.', 'error');
    }
}

// Load Notes
async function loadNotes() {
    if (!notesList) return;
    
    try {
        const { data, error } = await supabaseQuery('application_notes', 'select', {
            filters: { application_id: applicationId },
            order: { column: 'created_at', ascending: false }
        });
        
        if (error) throw error;
        
        notesList.innerHTML = '';
        
        if (!data || data.length === 0) {
            notesList.innerHTML = '<p style="color: var(--color-gray-medium); padding: 1rem;">No notes yet.</p>';
            return;
        }
        
        // Load admin names for notes
        const adminIds = [...new Set(data.map(note => note.admin_user_id))];
        const adminNames = {};
        
        for (const adminId of adminIds) {
            const { data: adminData } = await supabaseQuery('users', 'select', {
                filters: { id: adminId },
                columns: 'username, full_name'
            });
            
            if (adminData && adminData.length > 0) {
                adminNames[adminId] = adminData[0].full_name || adminData[0].username;
            } else {
                adminNames[adminId] = 'Unknown';
            }
        }
        
        data.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            noteItem.innerHTML = `
                <div class="note-header">
                    <span class="note-author">${adminNames[note.admin_user_id] || 'Unknown'}</span>
                    <span class="note-date">${formatNoteDate(note.created_at)}</span>
                </div>
                <div class="note-content">${note.note}</div>
            `;
            notesList.appendChild(noteItem);
        });
        
    } catch (error) {
        console.error('Error loading notes:', error);
        notesList.innerHTML = '<p style="color: #c62828; padding: 1rem;">Failed to load notes.</p>';
    }
}

// Format Note Date
function formatNoteDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Save Note
async function saveNote() {
    if (!noteTextarea) return;
    
    const noteText = noteTextarea.value.trim();
    
    if (!noteText) {
        showToast('Please enter a note.', 'warning');
        return;
    }
    
    const admin = getCurrentAdmin();
    if (!admin) {
        showToast('Admin session expired.', 'error');
        logoutAdmin();
        return;
    }
    
    try {
        const { error } = await supabaseQuery('application_notes', 'insert', {
            data: {
                application_id: applicationId,
                admin_user_id: admin.userId,
                note: noteText
            }
        });
        
        if (error) throw error;
        
        // Clear textarea
        noteTextarea.value = '';
        
        // Reload notes
        await loadNotes();
        
        showToast('Note saved.', 'success');
        
    } catch (error) {
        console.error('Error saving note:', error);
        showToast('Failed to save note.', 'error');
    }
}

// Format Status
function formatStatus(status) {
    return status.replace(/_/g, ' ');
}
