import { userManager } from './auth.js';
import { API_KEY, BASE_URL, MOVIES } from './config.js';
import { MovieCardManager } from './movieCard.js';
import { SliderManager } from './sliderManager.js';

class AppInitializer {
    constructor() {
        this.movieGrid = document.getElementById('movieGrid');
        this.slider = document.getElementById('movieSlider');
    }

    async initialize() {
        try {
            userManager.initializeAuth(); // Initialize authentication
            // Test API connection first
            const apiWorks = await this.testAPIConnection();
            if (!apiWorks) {
                throw new Error('Failed to connect to movie database');
            }

            // Initialize all components
            this.initializeEventListeners();
            await Promise.all([
                this.initializeSlider(),
                this.initializeMovieGrid()
            ]);

        } catch (error) {
            console.error('Application initialization failed:', error);
            this.handleError(error);
        }
    }

    async testAPIConnection() {
        try {
            const response = await fetch(`${BASE_URL}?i=tt0111161&apikey=${API_KEY}`);
            const data = await response.json();
            return data.Response === 'True';
        } catch (error) {
            console.error('API Test failed:', error);
            return false;
        }
    }

    initializeEventListeners() {
        // Global event handlers
        window.handleWatchlist = MovieCardManager.handleWatchlist;
        window.addEventListener('load', () => this.updateUIForAuthState());
        window.addEventListener('auth-change', () => this.updateUIForAuthState());
    }

    updateUIForAuthState() {
        const isLoggedIn = userManager.isLoggedIn();
        document.body.classList.toggle('user-logged-in', isLoggedIn);
    }

    async initializeSlider() {
        if (!this.slider) return;
        
        try {
            const featuredMovies = await this.fetchFeaturedMovies();
            if (!featuredMovies.length) {
                this.slider.innerHTML = '<div class="error">No featured movies available</div>';
                return;
            }
            
            const sliderManager = new SliderManager('movieSlider');
            await sliderManager.initialize();
        } catch (error) {
            console.error('Slider initialization failed:', error);
            this.slider.innerHTML = '<div class="error">Failed to load featured movies</div>';
        }
    }

    async initializeMovieGrid() {
        if (!this.movieGrid) return;

        try {
            const movies = await this.fetchMovies();
            MovieCardManager.populateGrid(this.movieGrid, movies);
        } catch (error) {
            console.error('Movie grid initialization failed:', error);
            this.handleError(error);
        }
    }

    async fetchFeaturedMovies() {
        try {
            const movies = await Promise.all(
                MOVIES.featured.map(async (movieId) => {
                    const response = await fetch(`${BASE_URL}?i=${movieId}&apikey=${API_KEY}`);
                    if (!response.ok) throw new Error('Failed to fetch movie data');
                    return response.json();
                })
            );
            return movies.filter(movie => movie.Response === "True");
        } catch (error) {
            console.error('Error fetching featured movies:', error);
            throw error;
        }
    }

    async fetchMovies() {
        try {
            // Fetch popular movies
            const popularMovieIds = MOVIES.featured.slice(0, 8); // Get first 8 movies
            const movies = await Promise.all(
                popularMovieIds.map(async (movieId) => {
                    const response = await fetch(`${BASE_URL}?i=${movieId}&apikey=${API_KEY}`);
                    if (!response.ok) throw new Error('Failed to fetch movie data');
                    return response.json();
                })
            );
            return movies.filter(movie => movie.Response === "True");
        } catch (error) {
            console.error('Error fetching movies:', error);
            throw error;
        }
    }

    handleError(error) {
        const errorMessage = `
            <div class="error">
                <h3>Error Loading Content</h3>
                <p>${error.message}</p>
            </div>
        `;
        
        if (this.movieGrid) {
            this.movieGrid.innerHTML = errorMessage;
        }
        if (this.slider) {
            this.slider.innerHTML = errorMessage;
        }
    }
}

// Remove MovieDisplay class as it's redundant

document.addEventListener('DOMContentLoaded', async () => {
    const app = new AppInitializer();
    await app.initialize();
});