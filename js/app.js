/**
 * Movie Explorer — browse rows, search, and watchlist.
 */
import { CONFIG } from "./config.js";
import {
  getCategoryMovies,
  getMovieDetails,
  getTrending,
  errorMessage,
  isMovieList,
} from "./api.js";
import {
  getWatchlist,
  toggleWatchlist,
  addRecentlyViewed,
} from "./watchlist.js";
import {
  movieCardHtml,
  heroHtml,
  modalHtml,
  skeletonCards,
  emptyState,
  errorState,
  showToast,
  syncWatchlistButtons,
  genreMap,
} from "./ui.js";
import { createSearchController } from "./search.js";

const movieStore = new Map();
let genresById = new Map();
let modalOpen = false;
let lastFocus = null;
let searchController;

/* —— Theme —— */

function initTheme() {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.theme);
  const theme = saved === "light" || saved === "dark" ? saved : "dark";
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeButton(theme);
}

function updateThemeButton(theme) {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(CONFIG.STORAGE_KEYS.theme, next);
  updateThemeButton(next);
}

/* —— Modal —— */

function openModal(html) {
  const modal = document.getElementById("movie-modal");
  const body = document.getElementById("modal-body");
  lastFocus = document.activeElement;
  body.innerHTML = html;
  modal.hidden = false;
  modalOpen = true;
  document.body.classList.add("modal-open");
  modal.querySelector(".modal-close")?.focus();
}

function closeModal() {
  const modal = document.getElementById("movie-modal");
  if (modal.hidden) return;
  modal.hidden = true;
  modalOpen = false;
  document.body.classList.remove("modal-open");
  document.getElementById("modal-body").innerHTML = "";
  lastFocus?.focus?.();
}

function initModal() {
  document.getElementById("movie-modal")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-modal]")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOpen) {
      e.preventDefault();
      closeModal();
    }
  });
}

async function showMovieDetails(id) {
  openModal(`<div class="modal-loading">${skeletonCards(1)}</div>`);
  try {
    const movie = await getMovieDetails(Number(id));
    if (!movie?.id) throw Object.assign(new Error("Invalid"), { code: "INVALID_RESPONSE" });
    movieStore.set(movie.id, movie);
    addRecentlyViewed(movie);
    openModal(modalHtml(movie));
  } catch (err) {
    openModal(
      emptyState({
        title: "Details unavailable",
        message: errorMessage(err),
        actionHtml: `<button type="button" class="btn btn-secondary" data-close-modal>Close</button>`,
      })
    );
  }
}

/* —— Watchlist —— */

function handleWatchlistToggle(id) {
  let movie = movieStore.get(Number(id)) || getWatchlist().find((m) => m.id === Number(id));
  if (!movie) {
    showToast("Open details first, then save.", "error");
    return;
  }
  const { added } = toggleWatchlist(movie);
  syncWatchlistButtons(movie.id, added);
  renderWatchlist();
  showToast(
    added ? `Added “${movie.title}” to watchlist` : `Removed “${movie.title}” from watchlist`,
    added ? "success" : "info"
  );
}

function renderWatchlist() {
  const el = document.getElementById("watchlist-movies");
  const list = getWatchlist();
  list.forEach((m) => movieStore.set(m.id, m));
  if (!list.length) {
    el.innerHTML = emptyState({
      title: "Your watchlist is empty",
      message: "Click a poster, then add it to your watchlist.",
    });
    return;
  }
  el.innerHTML = list.map((m) => movieCardHtml(m, { badge: "Saved" })).join("");
}

/* —— Browse rows (Movie Explorer layout) —— */

function buildBrowseShell() {
  const browse = document.getElementById("browse");
  browse.innerHTML = CONFIG.CATEGORIES.map(
    (cat) => `
    <section class="category-section container" id="cat-${cat.id}" aria-labelledby="title-${cat.id}">
      <div class="section-head row-head">
        <div>
          <h2 class="section-title" id="title-${cat.id}">${cat.title}</h2>
          ${
            cat.type === "new_releases"
              ? `<p class="section-desc">Released in the last ${cat.days ?? 30} days</p>`
              : ""
          }
        </div>
        <div class="carousel-controls">
          <button type="button" class="icon-btn" data-carousel-prev="track-${cat.id}" aria-label="Scroll ${cat.title} left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button type="button" class="icon-btn" data-carousel-next="track-${cat.id}" aria-label="Scroll ${cat.title} right">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      <div class="carousel" id="track-${cat.id}" tabindex="0">
        <div class="carousel-track movie-row" id="row-${cat.id}">
          ${skeletonCards(8, "row")}
        </div>
      </div>
    </section>`
  ).join("");
}

async function loadCategory(category) {
  const row = document.getElementById(`row-${category.id}`);
  if (!row) return;

  try {
    const data = await getCategoryMovies(category, 1);
    if (!isMovieList(data)) throw new Error("bad");

    const results = (data.results || []).filter((m) => m.poster_path);
    results.forEach((m) => movieStore.set(m.id, m));

    if (!results.length) {
      row.innerHTML = emptyState({
        title: "Nothing here",
        message: "No posters available for this category right now.",
      });
      return;
    }

    let badge;
    if (category.type === "trending") badge = "Trending";
    else if (category.type === "new_releases") badge = "New";
    row.innerHTML = results.map((m) => movieCardHtml(m, { badge })).join("");
  } catch (err) {
    row.innerHTML = errorState(errorMessage(err), category.id);
  }
}

async function loadAllCategories() {
  await Promise.all(CONFIG.CATEGORIES.map((cat) => loadCategory(cat)));
}

async function loadHero() {
  const backdrop = document.getElementById("hero-backdrop");
  const meta = document.getElementById("hero-meta");
  try {
    const data = await getTrending(1, "week");
    if (!isMovieList(data) || !data.results.length) throw new Error("empty");
    data.results.forEach((m) => movieStore.set(m.id, m));
    const featured = data.results.find((m) => m.backdrop_path) || data.results[0];
    const { html, backdropStyle } = heroHtml(featured, genresById);
    backdrop.style.cssText = backdropStyle;
    meta.innerHTML = html;
    meta.classList.add("is-ready");

    getMovieDetails(featured.id)
      .then((full) => {
        movieStore.set(full.id, full);
        const trailer = (full.videos?.results || []).find(
          (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser") && v.key
        );
        const btn = document.getElementById("hero-trailer-btn");
        if (btn && trailer) {
          btn.hidden = false;
          btn.dataset.trailerKey = trailer.key;
        }
      })
      .catch(() => {});
  } catch (err) {
    meta.innerHTML = emptyState({
      title: "Featured title unavailable",
      message: errorMessage(err),
    });
  }
}

/* —— UI chrome —— */

function initCarousels() {
  document.querySelectorAll("[data-carousel-prev],[data-carousel-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-carousel-prev") || btn.getAttribute("data-carousel-next");
      const track = document.getElementById(id);
      if (!track) return;
      const dir = btn.hasAttribute("data-carousel-next") ? 1 : -1;
      track.scrollBy({ left: dir * CONFIG.CAROUSEL_SCROLL_PX, behavior: "smooth" });
    });
  });
}

function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  window.addEventListener(
    "scroll",
    () => {
      btn.hidden = window.scrollY < 600;
    },
    { passive: true }
  );
  btn?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initDelegation() {
  document.body.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (actionEl) {
      const { action, id } = actionEl.dataset;
      if (action === "details") {
        showMovieDetails(id);
        return;
      }
      if (action === "watchlist") {
        handleWatchlistToggle(id);
        return;
      }
      if (action === "trailer") {
        const key = actionEl.dataset.trailerKey;
        if (key) window.open(`https://www.youtube.com/watch?v=${key}`, "_blank", "noopener,noreferrer");
        else showMovieDetails(id);
        return;
      }
    }

    const retry = e.target.closest("[data-retry]");
    if (retry) {
      const which = retry.getAttribute("data-retry");
      if (which === "search") searchController?.retry();
      else {
        const cat = CONFIG.CATEGORIES.find((c) => c.id === which);
        if (cat) loadCategory(cat);
      }
      return;
    }

    if (e.target.closest("[data-action], a, button, select, input")) return;
    const card = e.target.closest("[data-movie-id]");
    if (card) showMovieDetails(card.dataset.movieId);
  });
}

async function boot() {
  document.getElementById("year").textContent = String(new Date().getFullYear());

  initTheme();
  initModal();
  initBackToTop();
  initDelegation();
  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);

  // Seed genre map for hero tags (ids only — names optional)
  genresById = genreMap([
    { id: 28, name: "Action" },
    { id: 35, name: "Comedy" },
    { id: 27, name: "Horror" },
    { id: 10749, name: "Romance" },
    { id: 16, name: "Animation" },
    { id: 878, name: "Science Fiction" },
  ]);

  buildBrowseShell();
  initCarousels();

  searchController = createSearchController({
    movieStore,
    onOpenMovie: showMovieDetails,
  });

  renderWatchlist();

  if (!CONFIG.API_KEY?.trim()) {
    const msg = errorMessage({ code: "API_KEY_MISSING" });
    document.getElementById("hero-meta").innerHTML = emptyState({
      title: "API key required",
      message: msg,
    });
    return;
  }

  await Promise.all([loadHero(), loadAllCategories()]);
}

boot();
