document.addEventListener('DOMContentLoaded', function () {
    const sliderContainer = document.querySelector('.hero-slider');
    if (!sliderContainer) return;

    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.querySelector('.slider-dots');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');

    let currentSlide = 0;
    const totalSlides = slides.length;
    let slideInterval;

    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('slider-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        if (dotsContainer) dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.slider-dot');

    function goToSlide(n) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');

        currentSlide = (n + totalSlides) % totalSlides;

        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');

        resetTimer();
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    function resetTimer() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000); // Auto slide every 5 seconds
    }

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
    });

    // Initialize
    if (slides.length > 0) {
        slides[0].classList.add('active');
        resetTimer();
    }
});
