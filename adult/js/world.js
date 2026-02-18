/**
 * world.js – Handles rendering of world data from zerox.json
 * Uses fetchJSON from main.js
 */

(async function initWorld() {
    try {
        const data = await fetchJSON('data/zerox.json');
        const world = data.zerox_enon;
        renderWorldOverview(world);
        renderCosmology(world.cosmology.celestial_spheres);
        renderContinents(world.continents);
        renderPantheons(world.pantheons);
        renderMonsterPreview(world.monster_hierarchy);
    } catch (err) {
        document.querySelectorAll('.loader').forEach(el => el.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Failed to load world data.`);
    }
})();

function renderWorldOverview(world) {
    const container = document.getElementById('world-overview');
    if (!container) return;
    container.innerHTML = `
        <h2>${world.world_name}</h2>
        <p>${world.world_description}</p>
    `;
}

function renderCosmology(spheres) {
    const container = document.getElementById('cosmology-container');
    if (!container) return;
    if (!spheres || spheres.length === 0) {
        container.innerHTML = '<p>No cosmology data available.</p>';
        return;
    }
    container.innerHTML = spheres.map(s => `
        <div class="cosmology-card" data-aos="fade-up">
            <div class="tier">${s.tier}</div>
            <h3>${s.name}</h3>
            <p>${s.description}</p>
        </div>
    `).join('');
}

function renderContinents(continents) {
    const wrapper = document.getElementById('continents-wrapper');
    const container = document.querySelector('.continents-swiper');
    if (!wrapper || !container) return;

    // Check if continents data exists
    if (!continents || continents.length === 0) {
        wrapper.innerHTML = '<div class="swiper-slide">No continent data available.</div>';
        return;
    }

    // Build slides
    wrapper.innerHTML = continents.map(c => `
        <div class="swiper-slide continent-slide">
            <h3>${c.name || 'Unknown'}</h3>
            <div class="full-name">${c.full_name || ''}</div>
            <div class="location"><i class="fas fa-map-marker-alt"></i> ${c.location || 'Unknown'}</div>
            <div class="influence"><i class="fas fa-sun"></i> ${c.primary_influence || 'Unknown'}</div>
            <div class="capital"><i class="fas fa-crown"></i> ${c.capital || 'Unknown'}</div>
            <p>${c.description || ''}</p>
        </div>
    `).join('');

    // Initialize Swiper after slides are added
    try {
        new Swiper('.continents-swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            breakpoints: {
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
            },
            autoplay: { delay: 5000, disableOnInteraction: false }
        });
    } catch (err) {
        console.error('Swiper initialization failed:', err);
        // Fallback: display slides without carousel
        container.classList.add('swiper-fallback');
    }
}

function renderPantheons(pantheons) {
    const grid = document.getElementById('pantheons-grid');
    if (!grid) return;
    if (!pantheons || pantheons.length === 0) {
        grid.innerHTML = '<p>No pantheon data available.</p>';
        return;
    }
    grid.innerHTML = pantheons.map(p => `
        <div class="pantheon-card" data-aos="fade-up">
            <h4>${p.name}</h4>
            <div class="domain">${p.domain}</div>
            <div class="alignment">${p.alignment}</div>
            <div class="ruler">Ruler: ${p.ruler.name}</div>
            <p class="description">${p.description.substring(0, 150)}...</p>
            <button class="btn btn--secondary btn-small" onclick="alert('More details coming soon!')">Learn more</button>
        </div>
    `).join('');
}

function renderMonsterPreview(hierarchy) {
    const container = document.getElementById('monster-preview');
    if (!container) return;
    if (!hierarchy || hierarchy.length === 0) {
        container.innerHTML = '<p>No monster data available.</p>';
        return;
    }
    // Show first 4 monsters from tier 1-3 as sample
    const samples = [];
    hierarchy.slice(0, 3).forEach(tier => {
        tier.monsters.slice(0, 2).forEach(mon => {
            samples.push({ ...mon, tierName: tier.name });
        });
    });
    if (samples.length === 0) {
        container.innerHTML = '<p>No monsters to display.</p>';
        return;
    }
    container.innerHTML = samples.map(m => `
        <div class="monster-item">
            <h4>${m.name}</h4>
            <span class="tier">${m.tierName}</span>
            <p>${m.physical_description ? m.physical_description.substring(0, 100) + '...' : ''}</p>
        </div>
    `).join('');
}