/**
 * main.js – Shared utilities for Zerox Enon
 * Handles preloader, current year, mobile menu, AOS init, global error handler
 */

// Preloader fade-out
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }
});

// Set current year in footer
const yearSpan = document.getElementById('current-year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Mobile menu functionality
const mobileToggle = document.getElementById('mobile-menu-toggle');
const mobileOverlay = document.getElementById('mobile-nav-overlay');
const mobileClose = document.getElementById('mobile-nav-close');

if (mobileToggle && mobileOverlay && mobileClose) {
    // Open menu
    mobileToggle.addEventListener('click', () => {
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        mobileToggle.setAttribute('aria-expanded', 'true');
    });

    // Close menu
    const closeMenu = () => {
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
        mobileToggle.setAttribute('aria-expanded', 'false');
    };

    mobileClose.addEventListener('click', closeMenu);

    // Close when clicking outside the menu container (on the overlay background)
    mobileOverlay.addEventListener('click', (e) => {
        if (e.target === mobileOverlay) {
            closeMenu();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileOverlay.classList.contains('active')) {
            closeMenu();
        }
    });
}

// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 800,
    once: true,
    offset: 100,
    easing: 'ease-in-out'
});

// Global error handler for images
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found';
    }
}, true);

// Utility: debounce function
window.debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Utility: fetch JSON with caching
const cache = new Map();
window.fetchJSON = async (url) => {
    if (cache.has(url)) return cache.get(url);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        cache.set(url, data);
        return data;
    } catch (err) {
        console.error(`Failed to fetch ${url}:`, err);
        throw err;
    }
};