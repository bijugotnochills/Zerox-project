/**
 * character.js – Handles character listing, search, filters, modal, gallery
 */

let allCharacters = [];
let filteredCharacters = [];
let currentCharId = null;
let currentIndex = 0;
let swiperInstance = null;
let currentPage = 1;
const pageSize = 30;

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
        console.error(err);
    }
})();

function populatePantheonFilter() {
    const pantheons = [...new Set(allCharacters.map(c => c.pantheon_id))];
    pantheons.sort((a, b) => a - b);
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
            <img src="${c.images?.character_icon || ''}" alt="${c.hero_name}" loading="lazy"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/120?text=Icon';">
            <div>
                <h3>${c.hero_name}</h3>
                <p>${c.title || ''}</p>
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
        renderPaginated();
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

    container.addEventListener('click', (e) => {
        const card = e.target.closest('.character-card');
        if (card) openModal(card.dataset.id);
    });

    modalClose.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    modalPrev.addEventListener('click', showPrevChar);
    modalNext.addEventListener('click', showNextChar);

    toggleNormal.addEventListener('click', () => {
        if (!currentCharId) return;
        const char = allCharacters.find(c => c.id == currentCharId);
        if (char?.images?.character_image) {
            modalImage.src = char.images.character_image;
            toggleNormal.classList.add('active');
            toggleReal.classList.remove('active');
        }
    });

    toggleReal.addEventListener('click', () => {
        if (!currentCharId) return;
        const char = allCharacters.find(c => c.id == currentCharId);
        if (char?.images?.character_image_real) {
            modalImage.src = char.images.character_image_real;
            toggleReal.classList.add('active');
            toggleNormal.classList.remove('active');
        }
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.getElementById(`tab-${tab}`)?.classList.add('active');
        });
    });
}

function formatWeaponSkills(skills) {
    if (!skills) return '';
    if (Array.isArray(skills)) return skills.join(', ');
    return String(skills);
}

function openModal(id) {
    console.log('Opening modal for ID:', id);
    currentCharId = id;
    const index = allCharacters.findIndex(c => c.id == id);
    if (index === -1) {
        console.error('Character not found:', id);
        return;
    }
    currentIndex = index;
    try {
        populateModal(allCharacters[index]);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        initGallerySwiper();
    } catch (err) {
        console.error('Error in openModal:', err);
        modal.style.display = 'block';
    }
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
    openModal(allCharacters[currentIndex].id);
}

function showNextChar() {
    if (currentIndex < allCharacters.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    openModal(allCharacters[currentIndex].id);
}

function populateModal(char) {
    console.log('Populating modal for:', char?.hero_name);
    if (!char) {
        throw new Error('No character data provided');
    }

    // Basic info
    setText('modal-title', char.hero_name || 'Unknown');
    setText('modal-subtitle', (char.title ? char.title : '') + (char.nickname ? ` · ${char.nickname}` : ''));

    // Image
    if (char.images?.character_image) {
        modalImage.src = char.images.character_image;
        modalImage.alt = char.hero_name || '';
    }

    // Lore, description
    setText('modal-lore', char.lore || 'No lore available.');
    setText('modal-description', char.description || 'No description.');

    // Story - handle variable number of parts
    const storyDiv = document.getElementById('modal-story');
    if (char.story && typeof char.story === 'object') {
        const partKeys = Object.keys(char.story)
            .filter(key => key.toLowerCase().startsWith('part'))
            .sort((a, b) => {
                const numA = parseInt(a.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.replace(/\D/g, '')) || 0;
                return numA - numB;
            });

        if (partKeys.length > 0) {
            storyDiv.innerHTML = partKeys.map(key => {
                const partNumber = key.replace(/\D/g, '');
                return `<p><strong>Part ${partNumber}:</strong> ${char.story[key]}</p>`;
            }).join('');
        } else {
            storyDiv.innerHTML = '<p>No story parts available.</p>';
        }
    } else {
        storyDiv.innerHTML = '<p>No story available.</p>';
    }

    // Attributes
    setText('modal-race', char.race || 'Unknown');
    setText('modal-powers', char.powers || 'Unknown');
    setText('modal-speciality', char.speciality || 'Unknown');

    // --- Appearance sections (handle both object and string) ---
    // Facial structure
    const f = char.facial_structure;
    let facialHtml = '';
    if (f && typeof f === 'object') {
        if (f.mask) {
            const mask = f.mask;
            facialHtml += `<p><strong>Mask Name:</strong> ${mask.name || 'Unknown'}</p>`;
            facialHtml += `<p><strong>Material:</strong> ${mask.material || ''}</p>`;
            facialHtml += `<p><strong>Forehead:</strong> ${mask.forehead || ''}</p>`;
            facialHtml += `<p><strong>Eyes:</strong> ${mask.eyes || ''}</p>`;
            facialHtml += `<p><strong>Nose:</strong> ${mask.nose || ''}</p>`;
            facialHtml += `<p><strong>Mouth:</strong> ${mask.mouth || ''}</p>`;
            if (mask.tusks) facialHtml += `<p><strong>Tusks:</strong> ${mask.tusks}</p>`;
            if (mask.surface) facialHtml += `<p><strong>Surface:</strong> ${mask.surface}</p>`;
        } else {
            const eyes = f.eyes || {};
            const hair = f.hair || {};
            facialHtml = `
                <p><strong>Eyes:</strong> ${eyes.eye_color || 'Unknown'} (${eyes.eye_type || ''})</p>
                <p><strong>Nose:</strong> ${f.nose || ''}</p>
                <p><strong>Hair:</strong> ${hair.hairstyle || ''} (${hair.hair_color || ''})</p>
                <p><strong>Face Shape:</strong> ${f.face_shape || ''}</p>
            `;
            if (f.ears) facialHtml += `<p><strong>Ears:</strong> ${f.ears}</p>`;
        }
    } else if (f && typeof f === 'string') {
        facialHtml = `<p>${f}</p>`;
    } else {
        facialHtml = '<p>No facial data available.</p>';
    }
    setHtml('modal-facial', facialHtml);

    // Upper body
    const u = char.upper_body;
    let upperHtml = '';
    if (u && typeof u === 'object') {
        upperHtml = `
            <p><strong>Body Structure:</strong> ${u.body_structure || ''}</p>
            <p><strong>Arms:</strong> ${u.arms || ''}</p>
            <p><strong>Chest:</strong> ${u.chest || ''}</p>
            <p><strong>Shoulders:</strong> ${u.shoulders || ''}</p>
            <p><strong>Neck:</strong> ${u.neck || ''}</p>
            <p><strong>Waist:</strong> ${u.waist || ''}</p>
        `;
    } else if (u && typeof u === 'string') {
        upperHtml = `<p>${u}</p>`;
    } else {
        upperHtml = '<p>No upper body data.</p>';
    }
    setHtml('modal-upper', upperHtml);

    // Lower body
    const l = char.lower_body;
    let lowerHtml = '';
    if (l && typeof l === 'object') {
        lowerHtml = `
            <p><strong>Hips:</strong> ${l.hips || ''}</p>
            <p><strong>Legs:</strong> ${l.legs || ''}</p>
            <p><strong>Feet:</strong> ${l.feet || ''}</p>
        `;
    } else if (l && typeof l === 'string') {
        lowerHtml = `<p>${l}</p>`;
    } else {
        lowerHtml = '<p>No lower body data.</p>';
    }
    setHtml('modal-lower', lowerHtml);

    // Clothing
    const cloth = char.clothing;
    let clothingHtml = '';
    if (cloth && typeof cloth === 'object') {
        clothingHtml = `
            <p><strong>Head:</strong> ${cloth.head || ''}</p>
            <p><strong>Upper:</strong> ${cloth.upper || ''}</p>
            <p><strong>Lower:</strong> ${cloth.lower || ''}</p>
            <p><strong>Accessories:</strong> ${cloth.accessories || ''}</p>
        `;
        if (cloth.feet) clothingHtml += `<p><strong>Feet:</strong> ${cloth.feet}</p>`;
    } else if (cloth && typeof cloth === 'string') {
        clothingHtml = `<p>${cloth}</p>`;
    } else {
        clothingHtml = '<p>No clothing data.</p>';
    }
    setHtml('modal-clothing', clothingHtml);

    // === WEAPON HANDLING ===
    const weaponContainer = document.getElementById('weapon-container');
    let weaponsHtml = '';
    let weaponData = null;
    if (char.weapons && Array.isArray(char.weapons)) {
        weaponData = char.weapons;
    } else if (char.weapon) {
        weaponData = char.weapon;
    }
    if (weaponData) {
        const weaponsArray = Array.isArray(weaponData) ? weaponData : [weaponData];
        weaponsArray.forEach(wp => {
            if (!wp) return;
            const skills = formatWeaponSkills(wp.special_skills);
            weaponsHtml += `
                <div class="weapon-detail">
                    <h3>${wp.name || 'Unnamed'}</h3>
                    <p><strong>Type:</strong> ${wp.type || ''}</p>
                    <p><strong>Aura:</strong> ${wp.aura || ''}</p>
                    <p><strong>Special Feature:</strong> ${wp.special_feature || ''}</p>
                    <p><strong>Weapon Skills:</strong> ${skills}</p>
                </div>
            `;
        });
    }
    weaponContainer.innerHTML = weaponsHtml || '<p>No weapon data.</p>';

    // === SKILLS SECTION ===
    const skills = char.skills || {};
    let skillsHtml = '';
    if (Array.isArray(skills.basic_skills)) {
        skills.basic_skills.forEach(s => {
            if (s) skillsHtml += `<div class="skill-card"><span class="skill-type">Basic</span><strong>${s.name || ''}</strong><p>${s.description || ''}</p></div>`;
        });
    }
    if (skills.passive_skill) {
        if (Array.isArray(skills.passive_skill)) {
            skills.passive_skill.forEach(s => {
                if (s) skillsHtml += `<div class="skill-card"><span class="skill-type">Passive</span><strong>${s.name || ''}</strong><p>${s.description || ''}</p></div>`;
            });
        } else {
            skillsHtml += `<div class="skill-card"><span class="skill-type">Passive</span><strong>${skills.passive_skill.name || ''}</strong><p>${skills.passive_skill.description || ''}</p></div>`;
        }
    }
    if (Array.isArray(skills.special_skills)) {
        skills.special_skills.forEach(s => {
            if (s) skillsHtml += `<div class="skill-card"><span class="skill-type">Special</span><strong>${s.name || ''}</strong><p>${s.description || ''}</p></div>`;
        });
    }
    if (skills.ultimate_skill) {
        if (Array.isArray(skills.ultimate_skill)) {
            skills.ultimate_skill.forEach(s => {
                if (s) skillsHtml += `<div class="skill-card"><span class="skill-type">Ultimate</span><strong>${s.name || ''}</strong><p>${s.description || ''}</p></div>`;
            });
        } else {
            skillsHtml += `<div class="skill-card"><span class="skill-type">Ultimate</span><strong>${skills.ultimate_skill.name || ''}</strong><p>${skills.ultimate_skill.description || ''}</p></div>`;
        }
    }
    document.getElementById('modal-skills').innerHTML = skillsHtml || '<p>No skill data.</p>';

    // === COMPANION TAB ===
    const companionDiv = document.getElementById('modal-companion');
    let companionHtml = '';
    if (char.companion) {
        const c = char.companion;
        companionHtml += `
            <div class="companion-detail">
                <h3>${c.name || 'Unnamed Companion'}</h3>
                ${c.image ? `<img src="${c.image}" alt="${c.name}" class="companion-image">` : ''}
                <p><strong>Type:</strong> ${c.type || ''}</p>
                <p><strong>Description:</strong> ${c.description || ''}</p>
                ${c.abilities ? `
                    <h4>Abilities:</h4>
                    <ul>${Array.isArray(c.abilities) ? c.abilities.map(a => `<li>${a}</li>`).join('') : `<li>${c.abilities}</li>`}</ul>
                ` : ''}
            </div>
        `;
    } else if (char.companions && Array.isArray(char.companions)) {
        char.companions.forEach(c => {
            companionHtml += `
                <div class="companion-detail">
                    <h3>${c.name || 'Unnamed Companion'}</h3>
                    ${c.image ? `<img src="${c.image}" alt="${c.name}" class="companion-image">` : ''}
                    <p><strong>Type:</strong> ${c.type || ''}</p>
                    <p><strong>Description:</strong> ${c.description || ''}</p>
                    ${c.abilities ? `
                        <h4>Abilities:</h4>
                        <ul>${Array.isArray(c.abilities) ? c.abilities.map(a => `<li>${a}</li>`).join('') : `<li>${c.abilities}</li>`}</ul>
                    ` : ''}
                </div>
            `;
        });
    } else {
        companionHtml = '<p>No companion data.</p>';
    }
    setHtml('modal-companion', companionHtml);

    // Gallery
    const galleryWrapper = document.getElementById('gallery-wrapper');
    if (char.images && Array.isArray(char.images.hero_gallery)) {
        galleryWrapper.innerHTML = char.images.hero_gallery.map(url => `
            <div class="swiper-slide"><img src="${url || ''}" alt="Gallery" loading="lazy"></div>
        `).join('');
    } else {
        galleryWrapper.innerHTML = '<div class="swiper-slide">No gallery images.</div>';
    }

    // --- Companion tab visibility ---
    const companionTabBtn = document.getElementById('companion-tab-btn');
    const companionPane = document.getElementById('tab-companion');
    const companionDivContent = document.getElementById('modal-companion');
    const hasCompanion = companionDivContent && companionDivContent.innerHTML.trim() !== '<p>No companion data.</p>';

    if (hasCompanion) {
        companionTabBtn.style.display = '';
    } else {
        companionTabBtn.style.display = 'none';
        if (companionPane && companionPane.classList.contains('active')) {
            const firstVisibleTab = document.querySelector('.tab-btn:not([style*="display: none"])');
            if (firstVisibleTab) {
                firstVisibleTab.click();
            } else {
                document.querySelector('[data-tab="lore"]').classList.add('active');
                document.getElementById('tab-lore').classList.add('active');
                companionPane.classList.remove('active');
            }
        }
    }
}

// Helper to safely set text content
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Helper to safely set innerHTML
function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function initGallerySwiper() {
    if (swiperInstance) swiperInstance.destroy(true, true);
    if (typeof Swiper === 'undefined') {
        console.error('Swiper library not loaded');
        return;
    }
    try {
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
    } catch (err) {
        console.error('Swiper initialization failed:', err);
    }
}