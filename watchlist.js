import { userManager } from './auth.js';
import { API_KEY, BASE_URL } from './config.js';

export class WatchlistManager {
    constructor() {
        this.initializeWatchlist();
    }

    initializeWatchlist() {
        // Only initialize if we're on the watchlist page
        if (window.location.pathname.includes('watchlist.html')) {
            this.renderWatchlist();
        }
    }

    isInWatchlist(movieId) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser?.watchlist) return false;
        return currentUser.watchlist.some(movie => String(movie.id) === String(movieId));
    }

    addToWatchlist(movie) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('Please login to add movies to your watchlist');
            return false;
        }

        // Initialize watchlist if it doesn't exist
        if (!currentUser.watchlist) {
            currentUser.watchlist = [];
        }

        // Standardize the movie object structure
        const movieToAdd = {
            id: movie.id,
            title: movie.title,
            poster: movie.poster || movie.poster_path && `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            year: movie.year || movie.release_date?.split('-')[0] || 'N/A',
            imdbRating: movie.imdbRating || 'N/A',
            userRating: null // Initialize user rating as null
        };

        // Check if movie is already in watchlist
        if (this.isInWatchlist(movieToAdd.id)) {
            alert('This movie is already in your watchlist');
            return false;
        }

        // Add movie to watchlist
        currentUser.watchlist.push(movieToAdd);

        // Update localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Update users in localStorage
        const users = JSON.parse(localStorage.getItem('users'));
        users[currentUser.email] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));

        console.log('Movie added to watchlist:', movieToAdd);
        return true;
    }

    removeFromWatchlist(movieId) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser?.watchlist) return false;

        currentUser.watchlist = currentUser.watchlist.filter(movie => String(movie.id) !== String(movieId));
        
        // Update localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update users in localStorage
        const users = JSON.parse(localStorage.getItem('users'));
        users[currentUser.email] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));

        // Re-render if on watchlist page
        if (window.location.pathname.includes('watchlist.html')) {
            this.renderWatchlist();
        }
        return true;
    }

    renderWatchlist() {
        const container = document.getElementById('watchlistContainer');
        if (!container) return;

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser?.watchlist?.length) {
            container.innerHTML = '<div class="empty-watchlist">Your watchlist is empty</div>';
            return;
        }

        container.innerHTML = currentUser.watchlist.map(movie => `
            <div class="watchlist-item" data-id="${movie.id}">
                <img src="${movie.poster}" alt="${movie.title}" class="watchlist-poster">
                <div class="watchlist-info">
                    <h3>${movie.title}</h3>
                    <p class="year">${movie.year}</p>
                    <div class="ratings-container">
                        <div class="imdb-rating">
                            <span class="rating-label">IMDb:</span>
                            <span class="rating-value">★ ${movie.imdbRating}</span>
                        </div>
                        <div class="user-rating">
                            <span class="rating-label">Your Rating:</span>
                            <select class="rating-select" onchange="watchlistManager.updateUserRating('${movie.id}', this.value)">
                                <option value="">Rate</option>
                                ${Array.from({length: 10}, (_, i) => {
                                    const rating = (i + 1);
                                    return `<option value="${rating}" ${movie.userRating === rating ? 'selected' : ''}>
                                        ${rating}/10
                                    </option>`;
                                }).join('')}
                            </select>
                        </div>
                    </div>
                    <button class="remove-watchlist" onclick="watchlistManager.removeFromWatchlist('${movie.id}')">
                        Remove from Watchlist
                    </button>
                </div>
            </div>
        `).join('');
    }

    getWatchlist() {
        const user = userManager.getCurrentUser();
        return user?.watchlist || [];
    }

    async fetchWatchlistMovies() {
        const user = userManager.getCurrentUser();
        if (!user?.watchlist || user.watchlist.length === 0) {
            return [];
        }

        try {
            const movies = await Promise.all(
                user.watchlist.map(async (movieId) => {
                    const response = await fetch(`${BASE_URL}?i=${movieId}&apikey=${API_KEY}`);
                    const data = await response.json();
                    if (data.Response === "True") {
                        return {
                            ...data,
                            dateAdded: user.watchlistDates[movieId]
                        };
                    }
                    return null;
                })
            );
            return movies.filter(movie => movie !== null);
        } catch (error) {
            console.error('Error fetching watchlist movies:', error);
            return [];
        }
    }

    updateUserRating(movieId, rating) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser?.watchlist) return;

        const movie = currentUser.watchlist.find(m => String(m.id) === String(movieId));
        if (movie) {
            movie.userRating = Number(rating);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Update users in localStorage
            const users = JSON.parse(localStorage.getItem('users'));
            users[currentUser.email] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
}

export const watchlistManager = new WatchlistManager();

function createWatchlistCard(movie) {
    return `
        <div class="movie-card" data-id="${movie.imdbID}">
            <img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <div class="movie-meta">
                    <span class="year">${movie.Year}</span>
                    <div class="ratings-container">
                        <span class="imdb-rating">IMDb: ★ ${movie.imdbRating}/10</span>
                        <div class="user-rating">
                            <span>My Rating:</span>
                            <select class="rating-select" onchange="handleRating('${movie.imdbID}', this.value)">
                                <option value="">Rate</option>
                                ${[1,2,3,4,5].map(num => `
                                    <option value="${num}" ${movie.userRating === num ? 'selected' : ''}>
                                        ${'★'.repeat(num)}${'☆'.repeat(5-num)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <button class="watchlist-btn remove" onclick="handleWatchlist('${movie.imdbID}')">
                    Remove from Watchlist
                </button>
            </div>
        </div>
    `;
}

async function displayWatchlist() {
    const watchlistGrid = document.getElementById('watchlistGrid');
    if (!watchlistGrid) return;

    const sortFilter = document.getElementById('sortFilter');
    
    watchlistGrid.innerHTML = '<div class="loading">Loading watchlist...</div>';
    
    try {
        let movies = await watchlistManager.fetchWatchlistMovies();
        
        if (movies.length === 0) {
            watchlistGrid.innerHTML = `
                <div class="empty-watchlist">
                    <p>Your watchlist is empty</p>
                    <a href="index.html" class="browse-btn">Browse Movies</a>
                </div>
            `;
            return;
        }

        // Sort movies if filter is present
        if (sortFilter) {
            const sortBy = sortFilter.value;
            movies = sortMovies(movies, sortBy);
        }

        watchlistGrid.innerHTML = movies.map(movie => 
            MovieCardManager.createMovieCard(movie)
        ).join('');
    } catch (error) {
        console.error('Error displaying watchlist:', error);
        watchlistGrid.innerHTML = `
            <div class="error">
                <h3>Error Loading Watchlist</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// Add this to your initialization code
function initializeProfile() {
    const user = userManager.currentUser;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const profileIcon = document.getElementById('profileIcon');
    const profilePicInput = document.getElementById('profilePicInput');

    // Display current profile picture or initial
    if (profileIcon) {
        if (user.profilePicture) {
            profileIcon.innerHTML = `<img src="${user.profilePicture}" alt="Profile" class="profile-image">`;
        } else {
            profileIcon.textContent = user.name.charAt(0);
        }

        // Add click handler to open file picker
        profileIcon.addEventListener('click', () => {
            profilePicInput.click();
        });
    }

    // Handle file selection
    if (profilePicInput) {
        profilePicInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        user.profilePicture = event.target.result;
                        localStorage.setItem('currentUser', JSON.stringify(user));
                        profileIcon.innerHTML = `<img src="${user.profilePicture}" alt="Profile" class="profile-image">`;
                    } catch (error) {
                        console.error('Failed to update profile picture:', error);
                        alert('Failed to update profile picture. Please try again.');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Initialize only if we're on the watchlist page
if (window.location.pathname.includes('watchlist.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        displayWatchlist();
    });
}

// Add global handlers for the rating and watchlist buttons
window.handleRating = async (movieId, rating) => {
    await userManager.updateRating(movieId, parseInt(rating));
    displayWatchlist(); // Refresh the display
};

window.handleWatchlist = async (movieId) => {
    await watchlistManager.removeFromWatchlist(movieId);
    displayWatchlist(); // Refresh the display
};

// Initialize if on watchlist page
if (document.getElementById('watchlistContainer')) {
    new WatchlistManager();
}

// Make it available globally for onclick handlers
window.watchlistManager = watchlistManager;