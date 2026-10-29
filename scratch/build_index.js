const fs = require('fs');

let html = fs.readFileSync('c:/Users/USER/Documents/controlleur SA/public/index_base.html', 'utf8');

// 1. Add preview container right under Step 2 category selection
const step2InsertTarget = `<div class="space-y-2 pt-1" data-purpose="service-items-list" id="services-container">`;
const previewComponent = `
<!-- Dynamic Preview Image Component -->
<div id="booking-preview-card" class="my-3 rounded-xl overflow-hidden border border-amber-500/30 bg-[#240616] shadow-md transition-all duration-300">
  <div class="relative h-48 w-full bg-neutral-900">
    <img id="booking-preview-img" src="Prestation/Coiffure avec Black.jpeg" alt="Preview Modèle" class="w-full h-full object-cover transition-all duration-300">
    <span id="booking-preview-badge" class="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-sm border border-amber-400/30 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
      💈 Modèle Coiffure Homme
    </span>
  </div>
  <div id="booking-employee-attribution" class="p-2.5 text-center text-xs font-semibold text-brand-gold bg-brand-wine/80 border-t border-amber-500/20">
    ✂️ Fait par : Premier coiffeur/coiffeuse disponible
  </div>
</div>
`;

html = html.replace(step2InsertTarget, previewComponent + '\n' + step2InsertTarget);

// 2. Add Step 4: Demandes Spéciales before Step 4 Date&Time
const step4DateTarget = `<!-- BEGIN: Step4DateTimeSelection -->`;
const stepSpecialRequestsComponent = `
<!-- BEGIN: StepSpecialRequests -->
<section class="bg-brand-card/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-500/15 space-y-3" data-purpose="step-special-requests">
  <div class="flex items-center gap-2.5">
    <span class="w-6 h-6 rounded-full bg-brand-gold text-brand-darkwine font-bold text-xs flex items-center justify-center shadow-md">4</span>
    <h2 class="text-sm font-bold text-amber-100">Demandes Spéciales & Soins Optionnels</h2>
  </div>
  
  <!-- Hint Message Box -->
  <div id="special-hint-box" class="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-100 flex items-start justify-between gap-3">
    <div class="space-y-1">
      <span class="font-bold text-brand-gold">💡 Besoin d'un soin particulier ?</span>
      <p class="text-[11px] text-amber-200/80 leading-relaxed">
        Si vous souhaitez un shampooing pour le traitement des pellicules, un masque réparateur ou tout autre soin spécifique, décrivez-le ici lors de votre réservation.
      </p>
    </div>
    <button type="button" onclick="dismissSpecialHint()" class="py-1 px-3 rounded-lg bg-brand-gold text-brand-darkwine text-[10px] font-bold whitespace-nowrap shadow hover:brightness-105 active:scale-95 transition">
      D'accord 👍
    </button>
  </div>

  <textarea id="input-special-requests" rows="3" class="w-full bg-white text-gray-900 text-xs font-semibold rounded-xl p-3 border-none focus:ring-2 focus:ring-brand-gold placeholder:text-gray-400" placeholder="Ex: Je souhaite un shampooing spécial pour le traitement des pellicules lors de mon passage..."></textarea>
</section>
<!-- END: StepSpecialRequests -->
`;

html = html.replace(step4DateTarget, stepSpecialRequestsComponent + '\n' + step4DateTarget);

// Change numbers for Date/Time (5) and Customer Details (6)
html = html.replace(
  `<span class="w-6 h-6 rounded-full bg-brand-gold text-brand-darkwine font-bold text-xs flex items-center justify-center shadow-md">4</span>\n<h2 class="text-sm font-bold text-amber-100">Date et Heure`,
  `<span class="w-6 h-6 rounded-full bg-brand-gold text-brand-darkwine font-bold text-xs flex items-center justify-center shadow-md">5</span>\n<h2 class="text-sm font-bold text-amber-100">Date et Heure`
);

html = html.replace(
  `<span class="w-6 h-6 rounded-full bg-brand-gold text-brand-darkwine font-bold text-xs flex items-center justify-center shadow-md">5</span>\n<h2 class="text-sm font-bold text-amber-100">Vos Coordonnées`,
  `<span class="w-6 h-6 rounded-full bg-brand-gold text-brand-darkwine font-bold text-xs flex items-center justify-center shadow-md">6</span>\n<h2 class="text-sm font-bold text-amber-100">Vos Coordonnées`
);

// 3. Replace Salons in bottom navigation with Avis
const navSalonsTarget = `<button class="flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition" id="nav-item-salons" onclick="scrollToSalons()" type="button">
<div class="p-1 mb-0.5">
<svg class="w-5 h-5 stroke-current" fill="none" stroke="currentColor" viewbox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</div>
<span class="text-[10px] font-medium tracking-tight">Salons</span>
</button>`;

const navReviewsComponent = `<button class="flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition" id="nav-item-reviews" onclick="switchView('reviews')" type="button">
<div class="p-1 mb-0.5">
<svg class="w-5 h-5 stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
</div>
<span class="text-[10px] font-medium tracking-tight">Avis</span>
</button>`;

html = html.replace(navSalonsTarget, navReviewsComponent);

// Add employee credits and Avis button on gallery items
const galleryCard1Old = `<span class="text-xs text-amber-200/70 font-medium">⏳ Durée : env. 2h30</span>`;
const galleryCard1New = `<div class="space-y-1">
<span class="text-xs text-amber-200/70 font-medium block">⏳ Durée : env. 2h30</span>
<span class="text-[10px] text-brand-gold block font-semibold">✂️ Fait par : Mistorine (Coiffeuse)</span>
</div>
<button type="button" onclick="switchView('reviews')" class="py-1 px-2.5 rounded-lg bg-amber-500/20 text-brand-gold text-[10px] font-bold flex items-center gap-1 border border-amber-500/30 hover:bg-amber-500/30 transition">
💬 Avis
</button>`;

html = html.replace(galleryCard1Old, galleryCard1New);

// 4. Add view-reviews HTML before END: MainContent
const mainContentEndTarget = '</main>';
const viewReviewsComponent = `
<!-- ============================================== -->
<!-- VIEW 3: AVIS & COMMUNAUTÉ VIEW                 -->
<!-- ============================================== -->
<div class="space-y-4 view-transition hidden" id="view-reviews">
  <section class="bg-brand-card/75 backdrop-blur-md rounded-2xl p-4 border border-amber-500/20 shadow-lg text-center space-y-2">
    <h2 class="text-lg font-serif font-bold text-brand-gold">⭐ Avis & Expérience Clients</h2>
    <p class="text-xs text-amber-200/70">Partagez votre expérience et échangez avec la communauté Yalo Glam's</p>
  </section>

  <!-- Rating Score Card -->
  <section class="bg-gradient-to-r from-amber-500/20 via-brand-wine to-amber-700/20 rounded-2xl p-4 border border-amber-400/30 text-center space-y-1 shadow-lg">
    <div class="text-3xl font-extrabold text-brand-gold font-serif">4.9 / 5</div>
    <div class="text-base text-brand-gold tracking-widest">⭐⭐⭐⭐⭐</div>
    <div class="text-[10px] text-amber-200/80">Basé sur plus de 120 avis vérifiés de clients du salon</div>
  </section>

  <!-- Submit Review Form Card -->
  <section class="bg-brand-card/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-500/15 space-y-3">
    <h3 class="text-xs font-bold text-brand-gold uppercase tracking-wider">✏️ Laisser un commentaire & une note</h3>
    <form id="review-submit-form" onsubmit="handleReviewSubmit(event)" class="space-y-2.5">
      <div class="grid grid-cols-2 gap-2">
        <input id="rev-name-input" type="text" placeholder="Votre Nom / Prénom" required class="bg-white text-gray-900 text-xs font-semibold rounded-xl py-2 px-3 border-none focus:ring-2 focus:ring-brand-gold">
        <select id="rev-rating-input" class="bg-white text-gray-900 text-xs font-semibold rounded-xl py-2 px-3 border-none focus:ring-2 focus:ring-brand-gold">
          <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
          <option value="4">⭐⭐⭐⭐ (4/5)</option>
          <option value="3">⭐⭐⭐ (3/5)</option>
        </select>
      </div>
      <textarea id="rev-comment-input" rows="2" placeholder="Ex: Dégradé parfait réalisé par Marco ! Très bon accueil..." required class="w-full bg-white text-gray-900 text-xs font-semibold rounded-xl p-3 border-none focus:ring-2 focus:ring-brand-gold placeholder:text-gray-400"></textarea>
      <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldDark text-brand-darkwine font-bold text-xs shadow-gold-sm hover:brightness-105 transition">
        Publier mon avis
      </button>
    </form>
  </section>

  <!-- Reviews Feed -->
  <section class="space-y-3" id="reviews-feed">
    <!-- Sample Review Item 1 -->
    <div class="bg-[#240616] p-3.5 rounded-2xl border border-amber-500/20 space-y-2 shadow-md">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-brand-gold">Vanessa K. (Bastos)</span>
        <span class="text-[10px] text-amber-200/60">Il y a 2h • ⭐⭐⭐⭐⭐</span>
      </div>
      <p class="text-xs text-gray-200 leading-relaxed font-light">
        "Les tresses américaines faites par Mistorine sont juste magnifiques ! Le tracé est parfait et ça ne tire pas du tout. Je recommande vivement !"
      </p>
      <div class="p-2.5 rounded-xl bg-amber-500/10 border-l-2 border-brand-gold text-[11px] text-amber-200">
        👑 <strong class="text-brand-gold">Patronne Yalo Glam's :</strong> Merci beaucoup Vanessa ! Toute l'équipe s'efforce d'offrir la meilleure qualité. À très bientôt !
      </div>
    </div>

    <!-- Sample Review Item 2 -->
    <div class="bg-[#240616] p-3.5 rounded-2xl border border-amber-500/20 space-y-2 shadow-md">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-brand-gold">Thierry M. (Mimboman)</span>
        <span class="text-[10px] text-amber-200/60">Hier • ⭐⭐⭐⭐⭐</span>
      </div>
      <p class="text-xs text-gray-200 leading-relaxed font-light">
        "Superbe coupe au Black par Marco. Très pro et ponctuel sur la réservation."
      </p>
      <div class="p-2.5 rounded-xl bg-amber-500/10 border-l-2 border-brand-gold text-[11px] text-amber-200">
        👑 <strong class="text-brand-gold">Patronne Yalo Glam's :</strong> Merci Thierry ! Marco est ravi que la prestation vous ait plu.
      </div>
    </div>
  </section>
</div>
`;

html = html.replace(mainContentEndTarget, viewReviewsComponent + '\n' + mainContentEndTarget);

// Add JS helper functions and state handlers
const jsInsertTarget = `function selectCategory(catKey) {`;
const jsHelpers = `
  function checkSpecialHintDismissed() {
    if (localStorage.getItem('yg_dismissed_special_hint') === 'true') {
      const el = document.getElementById('special-hint-box');
      if (el) el.style.display = 'none';
    }
  }

  function dismissSpecialHint() {
    localStorage.setItem('yg_dismissed_special_hint', 'true');
    const el = document.getElementById('special-hint-box');
    if (el) el.style.display = 'none';
  }

  function handleReviewSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('rev-name-input').value.trim();
    const rating = document.getElementById('rev-rating-input').value;
    const comment = document.getElementById('rev-comment-input').value.trim();

    if (!name || !comment) return;

    const feed = document.getElementById('reviews-feed');
    if (!feed) return;

    const stars = "⭐".repeat(Number(rating));
    const card = document.createElement('div');
    card.className = "bg-[#240616] p-3.5 rounded-2xl border border-amber-500/20 space-y-2 shadow-md";
    card.innerHTML = \`
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-brand-gold">\${name}</span>
        <span class="text-[10px] text-amber-200/60">À l'instant • \${stars}</span>
      </div>
      <p class="text-xs text-gray-200 leading-relaxed font-light">
        "\${comment}"
      </p>
    \`;

    feed.prepend(card);
    document.getElementById('rev-comment-input').value = '';
    showToast('Avis publié avec succès !');
  }

  function updatePreviewImage(catKey) {
    const imgEl = document.getElementById('booking-preview-img');
    const badgeEl = document.getElementById('booking-preview-badge');
    if (!imgEl || !badgeEl) return;

    if (catKey === 'femmes') {
      imgEl.src = 'Prestation/Traisse Americaine.jpeg';
      badgeEl.innerHTML = '✨ Modèle Coiffure Femme';
    } else if (catKey === 'hommes') {
      imgEl.src = 'Prestation/Coiffure avec Black.jpeg';
      badgeEl.innerHTML = '💈 Modèle Coiffure Homme';
    } else {
      imgEl.src = 'Prestation/Dreadlocks.jpeg';
      badgeEl.innerHTML = '🎁 Pack Soins & Esthétique';
    }
  }

  function updateStylistAttribution() {
    const stylistSelect = document.getElementById('select-stylist');
    const attrEl = document.getElementById('booking-employee-attribution');
    if (!stylistSelect || !attrEl) return;

    const val = stylistSelect.value;
    if (val && val !== 'Premier disponible') {
      attrEl.innerHTML = \`✂️ Fait par : <strong class="text-brand-goldLight">\${val}</strong>\`;
    } else {
      attrEl.innerHTML = \`✂️ Fait par : Premier coiffeur/coiffeuse disponible\`;
    }
  }
`;

html = html.replace(jsInsertTarget, jsHelpers + '\n' + jsInsertTarget);

// In selectCategory(catKey), call updatePreviewImage(catKey)
html = html.replace('badge.textContent = labels[catKey];', 'badge.textContent = labels[catKey];\n    updatePreviewImage(catKey);');

// Update switchView to handle 'reviews'
const switchViewOld = `function switchView(viewId) {
    state.currentView = viewId;
    const viewBooking = document.getElementById('view-booking');
    const viewGallery = document.getElementById('view-gallery');
    const tabBooking = document.getElementById('tab-btn-booking');
    const tabGallery = document.getElementById('tab-btn-gallery');
    const navRdv = document.getElementById('nav-item-rdv');
    const navGallery = document.getElementById('nav-item-gallery');

    if (viewId === 'booking') {
      viewBooking.classList.remove('hidden');
      viewBooking.classList.add('block');
      viewGallery.classList.remove('block');
      viewGallery.classList.add('hidden');

      // Update primary tabs
      tabBooking.className = "py-3 px-3 rounded-2xl bg-[#521334] border-2 border-brand-gold text-brand-goldLight text-xs font-bold flex items-center justify-center gap-2 shadow-gold-sm transition-all";
      tabGallery.className = "py-3 px-3 rounded-2xl bg-brand-card/80 hover:bg-brand-card border border-amber-500/20 text-gray-200 text-xs font-medium flex items-center justify-center gap-2 transition hover:text-brand-gold";

      // Update bottom nav
      navRdv.className = "flex flex-col items-center py-1 text-brand-gold transition";
      navRdv.querySelector('div').className = "p-1 rounded-xl bg-brand-gold/15 mb-0.5";
      navGallery.className = "flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition";
      navGallery.querySelector('div').className = "p-1 mb-0.5";
    } else {
      viewGallery.classList.remove('hidden');
      viewGallery.classList.add('block');
      viewBooking.classList.remove('block');
      viewBooking.classList.add('hidden');

      // Update primary tabs
      tabGallery.className = "py-3 px-3 rounded-2xl bg-[#521334] border-2 border-brand-gold text-brand-goldLight text-xs font-bold flex items-center justify-center gap-2 shadow-gold-sm transition-all";
      tabBooking.className = "py-3 px-3 rounded-2xl bg-brand-card/80 hover:bg-brand-card border border-amber-500/20 text-gray-200 text-xs font-medium flex items-center justify-center gap-2 transition hover:text-brand-gold";

      // Update bottom nav
      navGallery.className = "flex flex-col items-center py-1 text-brand-gold transition";
      navGallery.querySelector('div').className = "p-1 rounded-xl bg-brand-gold/15 mb-0.5";
      navRdv.className = "flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition";
      navRdv.querySelector('div').className = "p-1 mb-0.5";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }`;

const switchViewNew = `function switchView(viewId) {
    state.currentView = viewId;
    const viewBooking = document.getElementById('view-booking');
    const viewGallery = document.getElementById('view-gallery');
    const viewReviews = document.getElementById('view-reviews');

    const tabBooking = document.getElementById('tab-btn-booking');
    const tabGallery = document.getElementById('tab-btn-gallery');

    const navRdv = document.getElementById('nav-item-rdv');
    const navGallery = document.getElementById('nav-item-gallery');
    const navReviews = document.getElementById('nav-item-reviews');

    if (viewBooking) viewBooking.className = viewId === 'booking' ? 'space-y-4 view-transition block' : 'space-y-4 view-transition hidden';
    if (viewGallery) viewGallery.className = viewId === 'gallery' ? 'space-y-4 view-transition block' : 'space-y-4 view-transition hidden';
    if (viewReviews) viewReviews.className = viewId === 'reviews' ? 'space-y-4 view-transition block' : 'space-y-4 view-transition hidden';

    if (tabBooking) {
      tabBooking.className = viewId === 'booking' 
        ? "py-3 px-3 rounded-2xl bg-[#521334] border-2 border-brand-gold text-brand-goldLight text-xs font-bold flex items-center justify-center gap-2 shadow-gold-sm transition-all"
        : "py-3 px-3 rounded-2xl bg-brand-card/80 hover:bg-brand-card border border-amber-500/20 text-gray-200 text-xs font-medium flex items-center justify-center gap-2 transition hover:text-brand-gold";
    }
    if (tabGallery) {
      tabGallery.className = viewId === 'gallery' 
        ? "py-3 px-3 rounded-2xl bg-[#521334] border-2 border-brand-gold text-brand-goldLight text-xs font-bold flex items-center justify-center gap-2 shadow-gold-sm transition-all"
        : "py-3 px-3 rounded-2xl bg-brand-card/80 hover:bg-brand-card border border-amber-500/20 text-gray-200 text-xs font-medium flex items-center justify-center gap-2 transition hover:text-brand-gold";
    }

    if (navRdv) {
      navRdv.className = viewId === 'booking' ? "flex flex-col items-center py-1 text-brand-gold transition" : "flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition";
      navRdv.querySelector('div').className = viewId === 'booking' ? "p-1 rounded-xl bg-brand-gold/15 mb-0.5" : "p-1 mb-0.5";
    }
    if (navGallery) {
      navGallery.className = viewId === 'gallery' ? "flex flex-col items-center py-1 text-brand-gold transition" : "flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition";
      navGallery.querySelector('div').className = viewId === 'gallery' ? "p-1 rounded-xl bg-brand-gold/15 mb-0.5" : "p-1 mb-0.5";
    }
    if (navReviews) {
      navReviews.className = viewId === 'reviews' ? "flex flex-col items-center py-1 text-brand-gold transition" : "flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition";
      navReviews.querySelector('div').className = viewId === 'reviews' ? "p-1 rounded-xl bg-brand-gold/15 mb-0.5" : "p-1 mb-0.5";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }`;

html = html.replace(switchViewOld, switchViewNew);

// Add listeners for DOMContentLoaded
const domLoadOld = `// Date and Time listeners for live summary update`;
const domLoadNew = `
  document.addEventListener('DOMContentLoaded', () => {
    checkSpecialHintDismissed();
    const selStylist = document.getElementById('select-stylist');
    if (selStylist) selStylist.addEventListener('change', updateStylistAttribution);
  });
  // Date and Time listeners for live summary update`;

html = html.replace(domLoadOld, domLoadNew);

fs.writeFileSync('c:/Users/USER/Documents/controlleur SA/public/index.html', html, 'utf8');
console.log('Final index.html generated! Length: ' + html.length);
