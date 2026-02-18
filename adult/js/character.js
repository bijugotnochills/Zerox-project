/**
 * character.js – Handles character listing, search, filters, modal, gallery
 * Uses fetchJSON from main.js
 */

// Global state
let allCharacters = [];
let filteredCharacters = [];
let currentCharId = null;
let currentIndex = 0;
let swiperInstance = null;
let currentPage = 1;
const pageSize = 24;

// DOM elements
const container = document.getElementById('character-container');
const searchInput = document.getElementById('character-search');
const pantheonFilter = document.getElementById('pantheon-filter');
const genderFilter = document.getElementById('gender-filter');
const resetBtn = document.getElementById('reset-filters');
const gridViewBtn = document.getElementById('grid-view-btn');
const listViewBtn = document.getElementById('list-view-btn');
const paginationDiv = document.getElementById('pagination');

// Modal elements
const modal = document.getElementById('character-modal');
const modalClose = document.querySelector('.modal-close');
const modalPrev = document.getElementById('modal-prev');
const modalNext = document.getElementById('modal-next');
const toggleNormal = document.getElementById('toggle-normal');
const toggleReal = document.getElementById('toggle-real');
const modalImage = document.getElementById('modal-image');

// Load data
(async function init() {
    try {
        allCharacters = await fetchJSON('data/character_detail.json');
        filteredCharacters = [...allCharacters];
        populatePantheonFilter();
        renderPaginated();
        attachEventListeners();
    } catch (err) {
        container.innerHTML = `<div class="loader error"><i class="fas fa-exclamation-triangle"></i> Failed to load characters.</div>`;
    }
})();

function populatePantheonFilter() {
    const pantheons = [...new Set(allCharacters.map(c => c.pantheon_id))];
    pantheons.sort((a,b) => a - b);
    pantheonFilter.innerHTML = '<option value="all">All Pantheons</option>' +
        pantheons.map(id => `<option value="${id}">Pantheon ${id}</option>`).join('');
}

function filterCharacters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const pantheon = pantheonFilter.value;
    const gender = genderFilter.value;

    filteredCharacters = allCharacters.filter(c => {
        const matchesSearch = searchTerm === '' ||
            c.hero_name.toLowerCase().includes(searchTerm) ||
            c.title.toLowerCase().includes(searchTerm) ||
            (c.nickname && c.nickname.toLowerCase().includes(searchTerm));
        const matchesPantheon = pantheon === 'all' || c.pantheon_id == pantheon;
        const matchesGender = gender === 'all' || c.gender === gender;
        return matchesSearch && matchesPantheon && matchesGender;
    });

    currentPage = 1;
    renderPaginated();
}

function renderPaginated() {
    const start = (currentPage - 1) * pageSize;
    const paginated = filteredCharacters.slice(start, start + pageSize);
    const totalPages = Math.ceil(filteredCharacters.length / pageSize);

    renderCharacterCards(paginated);
    renderPagination(totalPages);
}

function renderCharacterCards(chars) {
    if (!chars.length) {
        container.innerHTML = '<div class="loader">No heroes found.</div>';
        return;
    }

    const isListView = container.classList.contains('list-view');
    container.innerHTML = chars.map(c => `
        <div class="character-card" data-id="${c.id}">
            <img src="${c.images.character_icon}" alt="${c.hero_name}" loading="lazy"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/120?text=Icon';">
            <div>
                <h3>${c.hero_name}</h3>
                <p>${c.title}</p>
                ${isListView ? `<p class="card-nickname">${c.nickname || ''}</p>` : ''}
            </div>
        </div>
    `).join('');
}

function renderPagination(totalPages) {
    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    let btns = '';
    for (let i = 1; i <= totalPages; i++) {
        btns += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    paginationDiv.innerHTML = btns;
}

// Event listeners
function attachEventListeners() {
    searchInput.addEventListener('input', debounce(filterCharacters, 300));
    pantheonFilter.addEventListener('change', filterCharacters);
    genderFilter.addEventListener('change', filterCharacters);
    resetBtn.addEventListener('click', () => {
        searchInput.value = '';
        pantheonFilter.value = 'all';
        genderFilter.value = 'all';
        filterCharacters();
    });

    gridViewBtn.addEventListener('click', () => {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        container.classList.remove('list-view');
        renderPaginated(); // re-render to adjust layout
    });

    listViewBtn.addEventListener('click', () => {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        container.classList.add('list-view');
        renderPaginated();
    });

    paginationDiv.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (!btn) return;
        currentPage = parseInt(btn.dataset.page);
        renderPaginated();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Character card click – open modal
    container.addEventListener('click', (e) => {
        const card = e.target.closest('.character-card');
        if (card) openModal(card.dataset.id);
    });

    // Modal close
    modalClose.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Modal navigation
    modalPrev.addEventListener('click', showPrevChar);
    modalNext.addEventListener('click', showNextChar);

    // Image toggle
    toggleNormal.addEventListener('click', () => {
        if (!currentCharId) return;
        const char = allCharacters.find(c => c.id == currentCharId);
        modalImage.src = char.images.character_image;
        toggleNormal.classList.add('active');
        toggleReal.classList.remove('active');
    });

    toggleReal.addEventListener('click', () => {
        if (!currentCharId) return;
        const char = allCharacters.find(c => c.id == currentCharId);
        modalImage.src = char.images.character_image_real;
        toggleReal.classList.add('active');
        toggleNormal.classList.remove('active');
    });

    // Modal tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.add('active');
        });
    });
}

// Modal functions
function openModal(id) {
    currentCharId = id;
    const index = allCharacters.findIndex(c => c.id == id);
    currentIndex = index;
    populateModal(allCharacters[index]);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    initGallerySwiper();
}

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    if (swiperInstance) swiperInstance.destroy();
}

function showPrevChar() {
    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = allCharacters.length - 1;
    }
    currentCharId = allCharacters[currentIndex].id;
    populateModal(allCharacters[currentIndex]);
    initGallerySwiper();
}

function showNextChar() {
    if (currentIndex < allCharacters.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    currentCharId = allCharacters[currentIndex].id;
    populateModal(allCharacters[currentIndex]);
    initGallerySwiper();
}

function populateModal(char) {
    // Basic info
    document.getElementById('modal-title').textContent = char.hero_name;
    document.getElementById('modal-subtitle').textContent = `${char.title} · ${char.nickname || ''}`;

    // Image (default normal)
    modalImage.src = char.images.character_image;
    modalImage.alt = char.hero_name;

    // Lore, description, story
    document.getElementById('modal-lore').textContent = char.lore;
    document.getElementById('modal-description').textContent = char.description;
    const storyDiv = document.getElementById('modal-story');
    storyDiv.innerHTML = `
        <p><strong>Part 1:</strong> ${char.story.part1}</p>
        <p><strong>Part 2:</strong> ${char.story.part2}</p>
        <p><strong>Part 3:</strong> ${char.story.part3}</p>
        <p><strong>Part 4:</strong> ${char.story.part4}</p>
    `;

    // Attributes
    document.getElementById('modal-race').textContent = char.race;
    document.getElementById('modal-powers').textContent = char.powers;
    document.getElementById('modal-speciality').textContent = char.speciality;

    // Facial structure
    const f = char.facial_structure;
    document.getElementById('modal-facial').innerHTML = `
        <p><strong>Eyes:</strong> ${f.eyes.eye_color} (${f.eyes.eye_type})</p>
        <p><strong>Nose:</strong> ${f.nose}</p>
        <p><strong>Hair:</strong> ${f.hair.hairstyle} (${f.hair.hair_color})</p>
        <p><strong>Face Shape:</strong> ${f.face_shape}</p>
    `;

    // Upper body
    const u = char.upper_body;
    document.getElementById('modal-upper').innerHTML = `
        <p><strong>Body Structure:</strong> ${u.body_structure}</p>
        <p><strong>Arms:</strong> ${u.arms}</p>
        <p><strong>Chest:</strong> ${u.chest}</p>
        <p><strong>Shoulders:</strong> ${u.shoulders}</p>
        <p><strong>Neck:</strong> ${u.neck}</p>
        <p><strong>Waist:</strong> ${u.waist}</p>
    `;

    // Lower body
    const l = char.lower_body;
    document.getElementById('modal-lower').innerHTML = `
        <p><strong>Hips:</strong> ${l.hips}</p>
        <p><strong>Legs:</strong> ${l.legs}</p>
        <p><strong>Feet:</strong> ${l.feet}</p>
    `;

    // Clothing
    const cloth = char.clothing;
    document.getElementById('modal-clothing').innerHTML = `
        <p><strong>Head:</strong> ${cloth.head}</p>
        <p><strong>Upper:</strong> ${cloth.upper}</p>
        <p><strong>Lower:</strong> ${cloth.lower}</p>
        <p><strong>Accessories:</strong> ${cloth.accessories}</p>
    `;

    // Weapon
    const wp = char.weapon;
    document.getElementById('modal-weapon-name').textContent = wp.name;
    document.getElementById('modal-weapon-type').textContent = wp.type;
    document.getElementById('modal-weapon-aura').textContent = wp.aura;
    document.getElementById('modal-weapon-feature').textContent = wp.special_feature;
    document.getElementById('modal-weapon-skills').textContent = wp.special_skills.join(', ');

    // Skills
    const skills = char.skills;
    let skillsHtml = '';
    skills.basic_skills.forEach(s => {
        skillsHtml += `<div class="skill-card"><span class="skill-type">Basic</span><strong>${s.name}</strong><p>${s.description}</p></div>`;
    });
    if (skills.passive_skill) {
        skillsHtml += `<div class="skill-card"><span class="skill-type">Passive</span><strong>${skills.passive_skill.name}</strong><p>${skills.passive_skill.description}</p></div>`;
    }
    skills.special_skills.forEach(s => {
        skillsHtml += `<div class="skill-card"><span class="skill-type">Special</span><strong>${s.name}</strong><p>${s.description}</p></div>`;
    });
    if (skills.ultimate_skill) {
        skillsHtml += `<div class="skill-card"><span class="skill-type">Ultimate</span><strong>${skills.ultimate_skill.name}</strong><p>${skills.ultimate_skill.description}</p></div>`;
    }
    document.getElementById('modal-skills').innerHTML = skillsHtml;

    // Gallery
    const galleryWrapper = document.getElementById('gallery-wrapper');
    galleryWrapper.innerHTML = char.images.hero_gallery.map(url => `
        <div class="swiper-slide"><img src="${url}" alt="Gallery" loading="lazy"></div>
    `).join('');
}

function initGallerySwiper() {
    if (swiperInstance) swiperInstance.destroy(true, true);
    swiperInstance = new Swiper('.gallery-swiper', {
        slidesPerView: 1,
        spaceBetween: 10,
        loop: true,
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        breakpoints: {
            640: { slidesPerView: 1 },
            1024: { slidesPerView: 1 }
        }
    });
}