class UserManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || {};
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.setupProfileUpload();
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    async register(name, email, password) {
        try {
            // Validate inputs
            if (!name || name.length < 2) {
                throw new Error('Name must be at least 2 characters long');
            }
            if (!this.validateEmail(email)) {
                throw new Error('Please enter a valid email address');
            }
            if (!this.validatePassword(password)) {
                throw new Error('Password must be at least 6 characters long');
            }

            // Check if email already exists
            if (this.users[email]) {
                throw new Error('Email already registered');
            }

            // Create new user
            const user = {
                name,
                email,
                password,
                createdAt: new Date().toISOString(),
                watchlist: []
            };

            // Save user
            this.users[email] = user;
            localStorage.setItem('users', JSON.stringify(this.users));
            console.log('User registered:', user); // Debug log
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            // Validate email format
            if (!this.validateEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            const user = this.users[email];
            if (!user) {
                throw new Error('No account found with this email');
            }

            if (user.password !== password) {
                throw new Error('Incorrect password');
            }

            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.updateUIForAuthState();
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUIForAuthState();
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    initializeAuth() {
        this.setupLoginModal();
        this.setupEventListeners();
        this.updateUIForAuthState();
    }

    setupLoginModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById('loginModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div id="loginModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <div id="loginSection" class="active">
                        <h2 class="auth-title">Login</h2>
                        <form id="modalLoginForm">
                            <div class="form-group">
                                <input type="email" id="modalLoginEmail" placeholder="Email" required>
                            </div>
                            <div class="form-group">
                                <input type="password" id="modalLoginPassword" placeholder="Password" required>
                            </div>
                            <button type="submit" class="auth-button">Login</button>
                        </form>
                        <div class="auth-switch">
                            Don't have an account? <a id="showRegister">Register</a>
                        </div>
                    </div>
                    <div id="registerSection">
                        <h2 class="auth-title">Register</h2>
                        <form id="modalRegisterForm">
                            <div class="form-group">
                                <input type="text" id="modalRegisterName" placeholder="Full Name" required>
                            </div>
                            <div class="form-group">
                                <input type="email" id="modalRegisterEmail" placeholder="Email" required>
                            </div>
                            <div class="form-group">
                                <input type="password" id="modalRegisterPassword" placeholder="Password" required>
                            </div>
                            <button type="submit" class="auth-button">Register</button>
                        </form>
                        <div class="auth-switch">
                            Already have an account? <a id="showLogin">Login</a>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    setupEventListeners() {
        // Remove old event listeners if they exist
        const oldModal = document.getElementById('loginModal');
        if (oldModal) {
            const clone = oldModal.cloneNode(true);
            oldModal.parentNode.replaceChild(clone, oldModal);
        }

        const modal = document.getElementById('loginModal');
        const loginBtn = document.getElementById('loginBtn');
        const closeBtn = document.querySelector('.close');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const loginSection = document.getElementById('loginSection');
        const registerSection = document.getElementById('registerSection');
        const logoutBtn = document.getElementById('logoutBtn');

        // Toggle modal display
        loginBtn?.addEventListener('click', () => {
            modal.style.display = 'block';
            loginSection.style.display = 'block';
            registerSection.style.display = 'none';
        });

        closeBtn?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Switch between login and register forms
        showRegister?.addEventListener('click', () => {
            loginSection.style.display = 'none';
            registerSection.style.display = 'block';
        });
        
        showLogin?.addEventListener('click', () => {
            registerSection.style.display = 'none';
            loginSection.style.display = 'block';
        });

        // Handle form submissions
        const loginForm = document.getElementById('modalLoginForm');
        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('modalLoginEmail').value.trim();
            const password = document.getElementById('modalLoginPassword').value;
            
            try {
                await this.login(email, password);
                modal.style.display = 'none';
                loginForm.reset();
                this.updateUIForAuthState();
                window.location.reload(); // Refresh to update UI
            } catch (error) {
                this.showError(loginForm, error.message);
            }
        });

        const registerForm = document.getElementById('modalRegisterForm');
        registerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const name = document.getElementById('modalRegisterName').value.trim();
                const email = document.getElementById('modalRegisterEmail').value.trim();
                const password = document.getElementById('modalRegisterPassword').value;

                console.log('Attempting registration:', { name, email }); // Debug log

                const registered = await this.register(name, email, password);
                if (registered) {
                    console.log('Registration successful'); // Debug log
                    await this.login(email, password);
                    modal.style.display = 'none';
                    registerForm.reset();
                }
            } catch (error) {
                console.error('Registration form error:', error); // Debug log
                this.showError(registerForm, error.message);
            }
        });

        // Handle logout
        logoutBtn?.addEventListener('click', () => {
            this.logout();
            window.location.reload(); // Refresh to update UI
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Add watchlist click handler
        const watchlistLink = document.querySelector('.dropdown-item[href="#myWatchlist"]');
        if (watchlistLink) {
            watchlistLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showWatchlist();
            });
        }
    }

    updateUIForAuthState() {
        const loginBtn = document.getElementById('loginBtn');
        const userProfile = document.querySelector('.user-profile');
        const profileIcon = document.getElementById('profileIcon');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');

        if (this.currentUser) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';
            if (profileName) profileName.textContent = this.currentUser.name;
            if (profileEmail) profileEmail.textContent = this.currentUser.email;
            
            if (profileIcon) {
                if (this.currentUser.profilePicture) {
                    this.updateProfilePicture(this.currentUser.profilePicture);
                } else {
                    profileIcon.textContent = this.currentUser.name.charAt(0).toUpperCase();
                }
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (userProfile) userProfile.style.display = 'none';
        }
    }

    showError(form, message) {
        console.log('Showing error:', message); // Debug log
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const existingError = form.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        form.insertBefore(errorDiv, form.firstChild);
        
        // Auto-remove error after 3 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    setupProfileUpload() {
        const setup = () => {
            // Get or create profile upload input
            let profileUpload = document.getElementById('profileUpload');
            const profileContainer = document.querySelector('.profile-container');

            if (!profileContainer) {
                console.error('Profile container not found');
                return;
            }

            if (!profileUpload) {
                // Create the upload input
                profileUpload = document.createElement('input');
                profileUpload.type = 'file';
                profileUpload.id = 'profileUpload';
                profileUpload.accept = 'image/*';
                profileUpload.className = 'profile-upload-input';
                profileContainer.appendChild(profileUpload);
            }

            // Add event listener
            profileUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    if (!file.type.startsWith('image/')) {
                        throw new Error('Please select an image file');
                    }

                    if (file.size > 5 * 1024 * 1024) {
                        throw new Error('Image size should be less than 5MB');
                    }

                    const base64 = await this.convertToBase64(file);
                    
                    if (this.currentUser) {
                        this.currentUser.profilePicture = base64;
                        this.users[this.currentUser.email] = this.currentUser;
                        
                        // Update storage
                        localStorage.setItem('users', JSON.stringify(this.users));
                        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                        
                        // Update UI immediately
                        this.updateProfilePicture(base64);
                        console.log('Profile picture updated successfully');
                    }
                } catch (error) {
                    console.error('Profile upload error:', error);
                    alert(error.message);
                }
            });

            // Load existing profile picture if available
            if (this.currentUser?.profilePicture) {
                this.updateProfilePicture(this.currentUser.profilePicture);
            }

            console.log('Profile upload initialized successfully');
        };

        // If DOM is already loaded, setup immediately
        if (document.readyState === 'complete') {
            setup();
        } else {
            // Otherwise wait for DOM to be ready
            document.addEventListener('DOMContentLoaded', setup);
        }
    }

    convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    updateProfilePicture(base64) {
        const profileIcon = document.getElementById('profileIcon');
        if (!profileIcon) return;

        // Clear existing content
        profileIcon.innerHTML = '';

        if (base64) {
            const img = document.createElement('img');
            img.src = base64;
            img.alt = 'Profile';
            profileIcon.appendChild(img);
        } else {
            profileIcon.textContent = this.currentUser?.name.charAt(0).toUpperCase() || 'U';
        }
    }

    showWatchlist() {
        // Create and show watchlist modal
        const watchlistHTML = `
            <div id="watchlistModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2 class="auth-title">My Watchlist</h2>
                    <div id="watchlistItems" class="watchlist-container">
                        ${this.renderWatchlistItems()}
                    </div>
                </div>
            </div>`;

        // Remove existing modal if present
        const existingModal = document.getElementById('watchlistModal');
        if (existingModal) existingModal.remove();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', watchlistHTML);

        // Show modal and setup close button
        const modal = document.getElementById('watchlistModal');
        const closeBtn = modal.querySelector('.close');
        
        modal.style.display = 'block';
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    renderWatchlistItems() {
        if (!this.currentUser || !this.currentUser.watchlist || this.currentUser.watchlist.length === 0) {
            return '<p class="empty-watchlist">Your watchlist is empty</p>';
        }

        return this.currentUser.watchlist
            .map(movie => `
                <div class="watchlist-item">
                    <img src="${movie.poster}" alt="${movie.title}" class="watchlist-poster">
                    <div class="watchlist-info">
                        <h3>${movie.title}</h3>
                        <p>${movie.year}</p>
                        <button class="remove-watchlist" data-id="${movie.id}">
                            Remove from Watchlist
                        </button>
                    </div>
                </div>
            `).join('');
    }
}

// Initialize and export the user manager
const userManager = new UserManager();
export { userManager };