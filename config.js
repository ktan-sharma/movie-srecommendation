// Define API constants
export const API_KEY = '2516c0ec';  // New API key
export const BASE_URL = 'https://www.omdbapi.com/';

// Random movie keywords for dynamic slider
export const MOVIE_KEYWORDS = [
    'star', 'war', 'love', 'hero', 'dark', 
    'light', 'time', 'space', 'life', 'world'
];

// Number of random movies to fetch for slider
export const SLIDER_MOVIE_COUNT = 10;

// Slider animation settings
export const SLIDER_CONFIG = {
    autoplaySpeed: 3000,  // Time between slides (ms)
    transitionSpeed: 500, // Slide transition duration (ms)
    pauseOnHover: true    // Pause slider on mouse hover
};

// Movie categories and IDs
export const MOVIES = {
    featured: [
        'tt0111161', // The Shawshank Redemption
        'tt0068646', // The Godfather
        'tt0468569', // The Dark Knight
        'tt0167260', // The Lord of the Rings
        'tt0137523'  // Fight Club
    ]
};

// Cache control
export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Add API validation function
export async function validateAPIKey() {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=tt0111161`);
        const data = await response.json();
        return data.Response === 'True';
    } catch (error) {
        console.error('API validation failed:', error);
        return false;
    }
}