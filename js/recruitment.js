// DOM Elements
const recruitmentForm = document.getElementById('recruitment-form');
const dobInput = document.getElementById('dob');
const ageInput = document.getElementById('age');
const consentCheckboxes = document.querySelectorAll('.consent-checkbox');
const submitButton = document.getElementById('submit-button');
const formMessage = document.getElementById('form-message');
const photoSlots = document.querySelectorAll('.photo-slot');
const videoInput = document.getElementById('video-input');
const videoPreview = document.getElementById('video-preview');

// State
let uploadedPhotos = {
    photo1: null,
    photo2: null,
    photo3: null,
    photo4: null,
    photo5: null,
    photo6: null
};
let uploadedVideo = null;
let isSubmitting = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDemoImages();
    setupEventListeners();
    checkMaintenanceMode();
});

// Load Demo Images
function loadDemoImages() {
    Object.entries(DEMO_IMAGES).forEach(([key, url]) => {
        const imgElement = document.querySelector(`#${key} .demo-image`);
        if (imgElement) {
            imgElement.src = url;
            imgElement.onerror = function() {
                this.parentElement.innerHTML = '<div class="demo-image-unavailable">REFERENCE IMAGE UNAVAILABLE</div>';
            };
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Calculate age from DOB
    if (dobInput) {
        dobInput.addEventListener('change', calculateAge);
    }
    
    // Photo upload inputs
    document.querySelectorAll('.photo-input').forEach(input => {
        input.addEventListener('change', handlePhotoUpload);
    });
    
    // Replace photo buttons
    document.querySelectorAll('.replace-photo-btn').forEach(button => {
        button.addEventListener('click', function() {
            const slotId = this.getAttribute('data-slot');
            document.querySelector(`#${slotId} .photo-input`).click();
        });
    });
    
    // Remove photo buttons
    document.querySelectorAll('.remove-photo-btn').forEach(button => {
        button.addEventListener('click', function() {
            const slotId = this.getAttribute('data-slot');
            removePhoto(slotId);
        });
    });
    
    // Video upload
    if (videoInput) {
        videoInput.addEventListener('change', handleVideoUpload);
    }
    
    // Consent checkboxes
    consentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', checkConsent);
    });
    
    // Form submission
    if (recruitmentForm) {
        recruitmentForm.addEventListener('submit', handleFormSubmit);
    }
}

// Calculate Age from Date of Birth
function calculateAge() {
    if (!dobInput.value) {
        ageInput.value = '';
        return;
    }
    
    const dob = new Date(dobInput.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    ageInput.value = age;
    
    // Check if under 18
    if (age < APP_SETTINGS.MIN_AGE) {
        showFormMessage('Applicants must be 18 years or older to apply.', 'error');
        submitButton.disabled = true;
    } else {
        clearFormMessage();
        checkConsent();
    }
}

// Handle Photo Upload
function handlePhotoUpload(event) {
    const slotId = event.target.closest('.photo-slot').id;
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!APP_SETTINGS.ALLOWED_PHOTO_TYPES.includes(file.type)) {
        showToast('Please upload a JPG, JPEG, PNG, or WEBP image.', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > APP_SETTINGS.MAX_PHOTO_SIZE_MB) {
        showToast(`Image size must be less than ${APP_SETTINGS.MAX_PHOTO_SIZE_MB}MB.`, 'error');
        event.target.value = '';
        return;
    }
    
    // Store file
    uploadedPhotos[slotId] = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewContainer = document.querySelector(`#${slotId} .preview-container`);
        const previewImage = document.querySelector(`#${slotId} .preview-image`);
        
        previewImage.src = e.target.result;
        previewContainer.style.display = 'block';
        
        // Show action buttons
        document.querySelector(`#${slotId} .photo-actions`).style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

// Remove Photo
function removePhoto(slotId) {
    uploadedPhotos[slotId] = null;
    
    // Hide preview
    const previewContainer = document.querySelector(`#${slotId} .preview-container`);
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    
    // Hide action buttons
    const photoActions = document.querySelector(`#${slotId} .photo-actions`);
    if (photoActions) {
        photoActions.style.display = 'none';
    }
    
    // Reset input
    const photoInput = document.querySelector(`#${slotId} .photo-input`);
    if (photoInput) {
        photoInput.value = '';
    }
}

// Handle Video Upload
function handleVideoUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!APP_SETTINGS.ALLOWED_VIDEO_TYPES.includes(file.type)) {
        showToast('Please upload an MP4, MOV, or WEBM video.', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > APP_SETTINGS.MAX_VIDEO_SIZE_MB) {
        showToast(`Video size must be less than ${APP_SETTINGS.MAX_VIDEO_SIZE_MB}MB.`, 'error');
        event.target.value = '';
        return;
    }
    
    // Store file
    uploadedVideo = file;
    
    // Show preview
    if (videoPreview) {
        const videoURL = URL.createObjectURL(file);
        videoPreview.src = videoURL;
        videoPreview.style.display = 'block';
        
        // Show remove button
        document.getElementById('video-actions').style.display = 'flex';
    }
}

// Remove Video
function removeVideo() {
    uploadedVideo = null;
    
    if (videoPreview) {
        videoPreview.src = '';
        videoPreview.style.display = 'none';
    }
    
    document.getElementById('video-actions').style.display = 'none';
    videoInput.value = '';
}

// Check Consent
function checkConsent() {
    const allChecked = Array.from(consentCheckboxes).every(checkbox => checkbox.checked);
    const age = parseInt(ageInput.value);
    
    submitButton.disabled = !(allChecked && age >= APP_SETTINGS.MIN_AGE && !isSubmitting);
}

// Show Form Message
function showFormMessage(message, type) {
    if (formMessage) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';
    }
}

// Clear Form Message
function clearFormMessage() {
    if (formMessage) {
        formMessage.style.display = 'none';
    }
}

// Handle Form Submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    // Validate required fields
    const requiredFields = ['full_name', 'dob', 'city', 'country', 'mobile', 'primary_category'];
    const missingFields = requiredFields.filter(field => !document.getElementById(field).value);
    
    if (missingFields.length > 0) {
        showFormMessage('Please fill in all required fields.', 'error');
        return;
    }
    
    // Validate age
    const age = parseInt(ageInput.value);
    if (isNaN(age) || age < APP_SETTINGS.MIN_AGE) {
        showFormMessage('Applicants must be 18 years or older to apply.', 'error');
        return;
    }
    
    // Validate mobile number
    const mobile = document.getElementById('mobile').value;
    if (!/^\+?[\d\s-]{10,15}$/.test(mobile)) {
        showFormMessage('Please enter a valid mobile number.', 'error');
        return;
    }
    
    // Validate email if provided
    const email = document.getElementById('email').value;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    // Validate photos
    const uploadedPhotosCount = Object.values(uploadedPhotos).filter(photo => photo !== null).length;
    if (uploadedPhotosCount < APP_SETTINGS.REQUIRED_PHOTOS) {
        showFormMessage(`Please upload exactly ${APP_SETTINGS.REQUIRED_PHOTOS} photos.`, 'error');
        return;
    }
    
    // Validate consent
    const allConsentChecked = Array.from(consentCheckboxes).every(checkbox => checkbox.checked);
    if (!allConsentChecked) {
        showFormMessage('Please check all required consent boxes.', 'error');
        return;
    }
    
    // Start submission
    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = 'SUBMITTING APPLICATION...';
    clearFormMessage();
    
    try {
        // Generate application number
        const applicationNumber = await generateApplicationNumber();
        
        // Create application folder path
        const folderPath = `applications/${applicationNumber}`;
        
        // Upload photos
        const photoPaths = [];
        for (let i = 1; i <= APP_SETTINGS.REQUIRED_PHOTOS; i++) {
            const slotKey = `photo${i}`;
            const file = uploadedPhotos[slotKey];
            
            if (file) {
                const filePath = `${folderPath}/photos/photo-${String(i).padStart(2, '0')}.${file.name.split('.').pop()}`;
                const { data, error } = await uploadFile('applications', filePath, file);
                
                if (error) throw error;
                
                photoPaths.push({
                    slot: i,
                    path: filePath,
                    filename: file.name,
                    mime_type: file.type,
                    file_size: file.size
                });
            }
        }
        
        // Upload video if provided
        let videoPath = null;
        if (uploadedVideo) {
            const videoFilePath = `${folderPath}/video/introduction.${uploadedVideo.name.split('.').pop()}`;
            const { data, error } = await uploadFile('applications', videoFilePath, uploadedVideo);
            
            if (error) throw error;
            
            videoPath = {
                path: videoFilePath,
                filename: uploadedVideo.name,
                mime_type: uploadedVideo.type,
                file_size: uploadedVideo.size
            };
        }
        
        // Insert application record
        const applicationData = {
            application_number: applicationNumber,
            full_name: document.getElementById('full_name').value,
            date_of_birth: document.getElementById('dob').value,
            age: age,
            gender: document.getElementById('gender').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            country: document.getElementById('country').value,
            mobile: mobile,
            email: email,
            primary_category: document.getElementById('primary_category').value,
            secondary_category: document.getElementById('secondary_category').value,
            experience_level: document.getElementById('experience_level').value,
            portfolio_url: document.getElementById('portfolio_url').value,
            instagram_url: document.getElementById('instagram_url').value,
            other_link: document.getElementById('other_link').value,
            languages: document.getElementById('languages').value,
            skills: document.getElementById('skills').value,
            about: document.getElementById('about').value,
            motivation: document.getElementById('motivation').value,
            status: 'submitted',
            consent_confirmed: true
        };
        
        const { data: application, error: applicationError } = await supabaseQuery('applications', 'insert', {
            data: applicationData,
            returning: '*'
        });
        
        if (applicationError) throw applicationError;
        
        // Insert file records
        const fileRecords = photoPaths.map(photo => ({
            application_id: application[0].id,
            file_type: 'photo',
            slot_number: photo.slot,
            file_path: photo.path,
            original_filename: photo.filename,
            mime_type: photo.mime_type,
            file_size: photo.file_size
        }));
        
        if (videoPath) {
            fileRecords.push({
                application_id: application[0].id,
                file_type: 'video',
                slot_number: null,
                file_path: videoPath.path,
                original_filename: videoPath.filename,
                mime_type: videoPath.mime_type,
                file_size: videoPath.file_size
            });
        }
        
        if (fileRecords.length > 0) {
            const { error: filesError } = await supabaseQuery('application_files', 'insert', {
                data: fileRecords
            });
            
            if (filesError) throw filesError;
        }
        
        // Show success message
        showSuccessPage(applicationNumber);
        
    } catch (error) {
        console.error('Application submission error:', error);
        showFormMessage('An error occurred while submitting your application. Please try again later.', 'error');
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.textContent = 'SUBMIT APPLICATION';
    }
}

// Generate Application Number
async function generateApplicationNumber() {
    const year = new Date().getFullYear();
    const prefix = `KMN-${year}-`;
    
    // Get the latest application number for this year
    const { data, error } = await supabaseQuery('applications', 'select', {
        columns: 'application_number',
        filters: {
            application_number: { value: `${prefix}%`, operator: 'like' }
        },
        order: { column: 'application_number', ascending: false },
        limit: 1
    });
    
    if (error) throw error;
    
    let nextNumber = 1;
    
    if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].application_number.split('-')[2]);
        nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
}

// Show Success Page
function showSuccessPage(applicationNumber) {
    const formContainer = document.querySelector('.form-container');
    
    if (formContainer) {
        formContainer.innerHTML = `
            <div class="success-container">
                <h2>APPLICATION RECEIVED</h2>
                <p>Thank you for applying to K MUSE NOVA.</p>
                <p>Your application has been successfully received and will be reviewed.</p>
                <div class="application-id">
                    <p>Application ID:</p>
                    <h3>${applicationNumber}</h3>
                </div>
                <div class="success-actions">
                    <a href="index.html" class="btn-primary">RETURN TO HOME</a>
                </div>
            </div>
        `;
    }
}

// Check Maintenance Mode
async function checkMaintenanceMode() {
    try {
        const isMaintenance = await checkMaintenanceMode();
        
        if (isMaintenance) {
            const formContainer = document.querySelector('.form-container');
            
            if (formContainer) {
                formContainer.innerHTML = `
                    <div class="maintenance-container">
                        <h2>APPLICATIONS TEMPORARILY CLOSED</h2>
                        <p>We are currently not accepting new applications. Please check back later.</p>
                        <div class="maintenance-actions">
                            <a href="index.html" class="btn-primary">RETURN TO HOME</a>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error checking maintenance mode:', error);
    }
}
