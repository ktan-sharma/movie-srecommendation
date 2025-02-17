import { API_KEY } from './config.js';

export class SliderManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentSlide = 0;
        this.autoPlayInterval = null;
    }

    async initialize() {
        try {
            const movies = await this.fetchFeaturedMovies();
            if (!movies.length) {
                this.showError('No featured movies available');
                return;
            }
            this.render(movies);
            this.setupControls();
            this.startAutoPlay();
        } catch (error) {
            this.showError('Failed to load featured movies');
            console.error('Error initializing slider:', error);
        }
    }

    async fetchFeaturedMovies() {
        const featuredIds = [
            'tt0111161', // The Shawshank Redemption
            'tt0068646', // The Godfather
            'tt0071562', // The Godfather: Part II
            'tt0468569', // The Dark Knight
            'tt0050083'  // 12 Angry Men
        ];

        const movies = await Promise.all(
            featuredIds.map(async id => {
                try {
                    const response = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`);
                    const data = await response.json();
                    return data.Response === 'True' ? data : null;
                } catch (error) {
                    console.error(`Error fetching movie ${id}:`, error);
                    return null;
                }
            })
        );

        return movies.filter(movie => movie !== null);
    }

    render(movies) {
        this.container.innerHTML = `
            <div class="slider-content">
                ${movies.map((movie, index) => `
                    <div class="slider-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                        <img src="${movie.Poster}" alt="${movie.Title}" class="slide-image">
                        <div class="slide-info">
                            <h2>${movie.Title}</h2>
                            <div class="slide-meta">
                                <span class="year">${movie.Year}</span>
                                <span class="rating">★ ${movie.imdbRating}</span>
                            </div>
                            <p class="plot">${movie.Plot}</p>
                            <button class="view-more" onclick="window.location.href='movie.html?id=${movie.imdbID}'">
                                View Details
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="slider-nav prev" aria-label="Previous slide">❮</button>
            <button class="slider-nav next" aria-label="Next slide">❯</button>
            <div class="slider-dots">
                ${movies.map((_, i) => `
                    <button class="dot ${i === 0 ? 'active' : ''}" 
                            data-index="${i}" 
                            aria-label="Go to slide ${i + 1}"></button>
                `).join('')}
            </div>
        `;
    }

    setupControls() {
        const prevButton = this.container.querySelector('.prev');
        const nextButton = this.container.querySelector('.next');
        const dots = this.container.querySelectorAll('.dot');

        prevButton?.addEventListener('click', () => this.prevSlide());
        nextButton?.addEventListener('click', () => this.nextSlide());
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.goToSlide(index);
            });
        });

        this.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.container.addEventListener('mouseleave', () => this.startAutoPlay());
    }

    goToSlide(index) {
        const slides = this.container.querySelectorAll('.slider-slide');
        const dots = this.container.querySelectorAll('.dot');
        
        slides[this.currentSlide].classList.remove('active');
        dots[this.currentSlide].classList.remove('active');
        
        this.currentSlide = index;
        
        slides[this.currentSlide].classList.add('active');
        dots[this.currentSlide].classList.add('active');
    }

    nextSlide() {
        const slides = this.container.querySelectorAll('.slider-slide');
        this.goToSlide((this.currentSlide + 1) % slides.length);
    }

    prevSlide() {
        const slides = this.container.querySelectorAll('.slider-slide');
        this.goToSlide((this.currentSlide - 1 + slides.length) % slides.length);
    }

    startAutoPlay() {
        this.pauseAutoPlay();
        this.autoPlayInterval = setInterval(() => this.nextSlide(), 5000);
    }

    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="slider-error">
                <p>${message}</p>
            </div>
        `;
    }
}