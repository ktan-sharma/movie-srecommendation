import { userManager } from './auth.js';
import { API_KEY, BASE_URL } from './config.js';
import { loadPopularMovies } from './movieData.js';
import { TOP_100_MOVIES } from './movieData.js';

class MovieDetailsPage {
    static async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');
        
        if (!movieId) {
            this.showError('No movie ID provided');
            return;
        }

        try {
            const movie = await this.fetchMovieDetails(movieId);
            this.renderMovieDetails(movie);
        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showError('Failed to load movie details');
        }
    }

    static async fetchMovieDetails(movieId) {
        const response = await fetch(`https://www.omdbapi.com/?i=${movieId}&apikey=${API_KEY}`);
        const data = await response.json();
        
        if (data.Response === 'False') {
            throw new Error(data.Error);
        }
        
        return data;
    }

    static renderMovieDetails(movie) {
        const container = document.getElementById('movieDetails');
        container.innerHTML = `
            <div class="movie-header">
                <div class="movie-poster">
                    <img src="${movie.Poster}" alt="${movie.Title}" 
                         onerror="this.src='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAHCAZADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwA='">
                </div>
                <div class="movie-info-details">
                    <h1>${movie.Title}</h1>
                    <div class="movie-meta">
                        <span class="year">${movie.Year}</span>
                        <span class="runtime">${movie.Runtime}</span>
                        <span class="rating">IMDb ★ ${movie.imdbRating}</span>
                    </div>
                    <div class="movie-tags">
                        ${movie.Genre.split(', ').map(genre => 
                            `<span class="movie-tag">${genre}</span>`
                        ).join('')}
                    </div>
                    <p class="plot">${movie.Plot}</p>
                    <div class="movie-details-extra">
                        <p><strong>Director:</strong> ${movie.Director}</p>
                        <p><strong>Writers:</strong> ${movie.Writer}</p>
                        <p><strong>Stars:</strong> ${movie.Actors}</p>
                    </div>
                </div>
            </div>
        `;
    }

    static showError(message) {
        const container = document.getElementById('movieDetails');
        container.innerHTML = `
            <div class="error-message">
                ${message}
            </div>
        `;
    }
}

function initializeAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const modal = document.getElementById('loginModal');
    const closeBtn = document.querySelector('.close');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    function updateUI() {
        const user = userManager.currentUser;
        if (user) {
            loginBtn.textContent = `Welcome, ${user.name}`;
            loginBtn.classList.add('logged-in');
        } else {
            loginBtn.textContent = 'Login';
            loginBtn.classList.remove('logged-in');
        }
    }

    loginBtn.addEventListener('click', () => {
        if (userManager.currentUser) {
            userManager.logout();
            updateUI();
        } else {
            modal.style.display = 'block';
            loginSection.style.display = 'block';
            registerSection.style.display = 'none';
        }
    });

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await userManager.login(email, password);
            modal.style.display = 'none';
            loginForm.reset();
            updateUI();
        } catch (error) {
            alert(error.message);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            await userManager.register(name, email, password);
            await userManager.login(email, password);
            modal.style.display = 'none';
            registerForm.reset();
            updateUI();
        } catch (error) {
            alert(error.message);
        }
    });

    // Initialize UI based on stored session
    updateUI();
}

class MovieDetailsManager {
    static async loadMovies() {
        const movieDetailsContainer = document.getElementById('movieDetails');
        
        try {
            const moviePromises = TOP_100_MOVIES.map(id => 
                fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`)
                    .then(response => response.json())
            );

            const movies = await Promise.all(moviePromises);
            const validMovies = movies.filter(movie => movie.Response === 'True');

            if (validMovies.length === 0) {
                throw new Error('No movies found');
            }

            const movieGrid = document.createElement('div');
            movieGrid.className = 'movie-grid';

            validMovies.forEach(movie => {
                const movieCard = this.createMovieCard(movie);
                movieGrid.appendChild(movieCard);
            });

            movieDetailsContainer.innerHTML = '';
            movieDetailsContainer.appendChild(movieGrid);

        } catch (error) {
            console.error('Error loading movies:', error);
            movieDetailsContainer.innerHTML = '<div class="error">Failed to load movies. Please try again later.</div>';
        }
    }

    static createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        // Convert genre string to array and create tags
        const genres = movie.Genre ? movie.Genre.split(', ') : [];
        const genreTags = genres.map(genre => 
            `<span class="movie-tag">${genre}</span>`
        ).join('');

        card.innerHTML = `
            <img src="${movie.Poster}" 
                 alt="${movie.Title}" 
                 class="movie-poster"
                 onerror="this.src='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAHCAZADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwA='">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <div class="movie-meta">
                    <span class="year">${movie.Year}</span>
                    <span class="rating">★ ${movie.imdbRating}</span>
                </div>
                <div class="movie-tags">
                    ${genreTags}
                </div>
            </div>
        `;
        return card;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    initializeAuth();
    const movieDetailsContainer = document.getElementById('movieDetails');
    const movieId = getMovieId();
    if (movieId) {
        MovieDetailsPage.init();
    } else {
        MovieDetailsManager.loadMovies();
    }
});