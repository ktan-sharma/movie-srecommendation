export const POPULAR_MOVIES = [
    'tt0111161', // The Shawshank Redemption
    'tt0068646', // The Godfather
    'tt0071562', // The Godfather: Part II
    'tt0468569', // The Dark Knight
    'tt0050083', // 12 Angry Men
    'tt0108052', // Schindler's List
    'tt0110912', // Pulp Fiction
    'tt0167260', // The Lord of the Rings: Return of the King
    'tt0060196', // The Good, the Bad and the Ugly
    'tt0137523', // Fight Club
    // ... add more movie IDs here
];

export const TOP_100_MOVIES = [
    'tt0111161', 'tt0068646', 'tt0071562', 'tt0468569', 'tt0050083', 
    'tt0108052', 'tt0110912', 'tt0167260', 'tt0060196', 'tt0137523',
    'tt0120737', 'tt0109830', 'tt0080684', 'tt1375666', 'tt0167261',
    'tt0073486', 'tt0099685', 'tt0133093', 'tt0047478', 'tt0114369',
    // Add more IMDb IDs until you reach 100
];

export const API_KEY = '2516c0ec';

export async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(`https://www.omdbapi.com/?i=${movieId}&apikey=2516c0ec`);
        const data = await response.json();
        return data.Response === 'True' ? data : null;
    } catch (error) {
        console.error(`Error fetching movie ${movieId}:`, error);
        return null;
    }
}

export async function loadPopularMovies(start = 0, count = 10) {
    const selectedIds = POPULAR_MOVIES.slice(start, start + count);
    const moviePromises = selectedIds.map(id => fetchMovieDetails(id));
    const movies = await Promise.all(moviePromises);
    return movies.filter(movie => movie !== null);
}