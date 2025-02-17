import { watchlistManager } from './watchlist.js';
import { userManager } from './auth.js';
import { API_KEY, BASE_URL, MOVIES } from './config.js';

export class MovieLoader {
    static async loadMovies(start = 0, count = 10) {
        try {
            // Use the full list of movie IDs
            const movieIds = [
                'tt0111161', 'tt0068646', 'tt0071562', 'tt0468569', 'tt0050083',
                'tt0108052', 'tt0110912', 'tt0167260', 'tt0060196', 'tt0137523',
                'tt0120737', 'tt0109830', 'tt0080684', 'tt1375666', 'tt0167261',
                // Add more movie IDs here...
            ];
            
            if (!movieIds || !movieIds.length) {
                console.warn('No movie IDs available to load');
                return [];
            }

            const selectedIds = movieIds.slice(start, start + count);
            const moviePromises = selectedIds.map(async (movieId) => {
                try {
                    // Construct proper URL with API key
                    const response = await fetch(`https://www.omdbapi.com/?i=${movieId}&apikey=2516c0ec`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    
                    if (data.Response === 'True') {
                        return {
                            id: movieId,
                            imdbID: movieId,
                            Title: data.Title,
                            Year: data.Year,
                            Poster: data.Poster,
                            imdbRating: data.imdbRating,
                            Genre: data.Genre
                        };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error fetching movie ${movieId}:`, error);
                    return null;
                }
            });

            const movies = (await Promise.all(moviePromises)).filter(movie => movie !== null);
            return movies;
        } catch (error) {
            console.error('Error loading movies:', error);
            return [];
        }
    }
}

export class MovieCardManager {
    static createMovieCard(movie) {
        if (!movie) return null;
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        const movieData = {
            id: movie.imdbID || movie.id,
            title: movie.Title || '',
            year: movie.Year || '',
            rating: movie.imdbRating || '',
            poster: movie.Poster !== 'N/A' ? movie.Poster : null,
            genres: movie.Genre ? movie.Genre.split(', ') : []
        };

        card.innerHTML = `
            <img src="${movieData.poster || ''}" 
                 alt="${movieData.title}" 
                 class="movie-poster"
                 onerror="this.src='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAHCAZADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwA='">
            <div class="movie-info">
                <h3>${movieData.title}</h3>
                <div class="movie-meta">
                    <span class="year">${movieData.year}</span>
                    ${movieData.rating ? `<span class="rating">★ ${movieData.rating}</span>` : ''}
                </div>
                <div class="movie-tags">
                    ${movieData.genres.map(genre => 
                        `<span class="movie-tag">${genre}</span>`
                    ).join('')}
                </div>
            </div>
        `;

        // Add click handler
        card.addEventListener('click', () => {
            if (movieData.id) {
                window.location.href = `movie.html?id=${movieData.id}`;
            }
        });

        return card;
    }

    static populateGrid(container, movies) {
        if (!container || !movies) return;

        // Clear existing content
        container.innerHTML = '';

        // Create and append movie cards
        movies.forEach(movie => {
            const card = this.createMovieCard(movie);
            if (card) {
                container.appendChild(card);
            }
        });

        // Show message if no movies
        if (!movies.length) {
            container.innerHTML = '<div class="no-movies">No movies available</div>';
        }
    }

    static populateSlider(container, movies) {
        if (!container) return;
        container.innerHTML = `
            <div class="slider-track">
                ${movies.map(movie => this.createMovieCard(movie)).join('')}
            </div>
        `;
    }

    static async initializeMovieGrid() {
        const movieGrid = document.getElementById('movieGrid');
        if (!movieGrid) return;

        try {
            const movies = await MovieLoader.loadMovies(1, 100);
            if (movies.length > 0) {
                movieGrid.innerHTML = movies.map(movie => this.createMovieCard(movie)).join('');
            } else {
                movieGrid.innerHTML = '<div class="error-message">Failed to load movies</div>';
            }
        } catch (error) {
            console.error('Error initializing movie grid:', error);
            movieGrid.innerHTML = '<div class="error-message">Failed to load movies</div>';
        }
    }
}

// Make the handler available globally
window.MovieCardManager = MovieCardManager;

// Initialize the movie grid when the page loads
document.addEventListener('DOMContentLoaded', () => {
    MovieCardManager.initializeMovieGrid();
});