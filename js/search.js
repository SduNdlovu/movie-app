/**
 * Search + autocomplete (Movie Explorer pattern, polished).
 */
import { CONFIG } from "./config.js";
import { searchMovies, errorMessage, isMovieList, posterUrl } from "./api.js";
import {
  movieCardHtml,
  skeletonCards,
  emptyState,
  errorState,
  escapeHtml,
} from "./ui.js";

export function createSearchController({ onResultsVisible, movieStore, onOpenMovie }) {
  const form = document.getElementById("nav-search-form");
  const input = document.getElementById("nav-search-input");
  const clearBtn = document.getElementById("nav-search-clear");
  const autocomplete = document.getElementById("autocomplete");
  const section = document.getElementById("search-results-section");
  const resultsEl = document.getElementById("search-results");
  const heading = document.getElementById("search-heading");
  const desc = document.getElementById("search-desc");
  const clearPanelBtn = document.getElementById("clear-search-panel");
  const browse = document.getElementById("browse");
  const hero = document.getElementById("home");

  let debounceTimer = null;
  let currentQuery = "";
  let abortToken = 0;

  function setClearVisibility() {
    if (clearBtn) clearBtn.hidden = !input.value;
  }

  function hideAutocomplete() {
    autocomplete.hidden = true;
    autocomplete.innerHTML = "";
    input?.setAttribute("aria-expanded", "false");
  }

  async function showAutocomplete(q) {
    const query = q.trim();
    if (!query) {
      hideAutocomplete();
      return;
    }

    try {
      const data = await searchMovies(query, 1);
      if (!isMovieList(data)) {
        hideAutocomplete();
        return;
      }

      const results = (data.results || []).filter((m) => m.poster_path).slice(0, 7);
      if (!results.length) {
        hideAutocomplete();
        return;
      }

      results.forEach((m) => movieStore.set(m.id, m));

      autocomplete.innerHTML = results
        .map(
          (movie) => `<button type="button" class="autocomplete-item" role="option" data-autocomplete-id="${movie.id}" data-autocomplete-title="${escapeHtml(movie.title || "")}">
            <img src="${escapeHtml(posterUrl(movie.poster_path, "w92"))}" alt="" width="40" height="60" loading="lazy"
              onerror="this.onerror=null;this.src='assets/images/placeholder-poster.svg'" />
            <span class="autocomplete-meta">
              <span class="autocomplete-title">${escapeHtml(movie.title || "Untitled")}</span>
              <span class="autocomplete-year">${escapeHtml((movie.release_date || "").slice(0, 4) || "—")}</span>
            </span>
          </button>`
        )
        .join("");

      autocomplete.hidden = false;
      input.setAttribute("aria-expanded", "true");
    } catch {
      hideAutocomplete();
    }
  }

  function showSearchMode(visible) {
    section.hidden = !visible;
    if (browse) browse.hidden = visible;
    if (hero) hero.hidden = visible;
    onResultsVisible?.(visible);
  }

  async function runSearch(query) {
    const q = query.trim();
    if (!q) {
      clearSearch();
      return;
    }

    currentQuery = q;
    hideAutocomplete();
    showSearchMode(true);
    heading.textContent = `Results for “${q}”`;
    desc.textContent = "Searching…";
    resultsEl.innerHTML = skeletonCards(12);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const token = ++abortToken;

    try {
      const data = await searchMovies(q, 1);
      if (token !== abortToken) return;

      if (!isMovieList(data)) {
        resultsEl.innerHTML = errorState("Unexpected search response.", "search");
        return;
      }

      const results = (data.results || []).filter((m) => m.poster_path);
      results.forEach((m) => movieStore.set(m.id, m));

      if (!results.length) {
        resultsEl.innerHTML = emptyState({
          title: "No movies found",
          message: `Nothing matched “${q}”. Try another title.`,
        });
        desc.textContent = "0 matches";
        return;
      }

      resultsEl.innerHTML = results.map((m) => movieCardHtml(m)).join("");
      desc.textContent = `${data.total_results || results.length} matches`;
    } catch (err) {
      if (token !== abortToken) return;
      resultsEl.innerHTML = errorState(errorMessage(err), "search");
    }
  }

  function clearSearch() {
    abortToken += 1;
    currentQuery = "";
    input.value = "";
    setClearVisibility();
    hideAutocomplete();
    showSearchMode(false);
    resultsEl.innerHTML = "";
  }

  function scheduleLive() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = input.value.trim();
      showAutocomplete(q);
    }, CONFIG.SEARCH_DEBOUNCE_MS);
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearTimeout(debounceTimer);
    runSearch(input.value);
  });

  input?.addEventListener("input", () => {
    setClearVisibility();
    scheduleLive();
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideAutocomplete();
  });

  clearBtn?.addEventListener("click", () => clearSearch());
  clearPanelBtn?.addEventListener("click", () => clearSearch());

  autocomplete?.addEventListener("click", (e) => {
    const item = e.target.closest("[data-autocomplete-id]");
    if (!item) return;
    const id = item.getAttribute("data-autocomplete-id");
    const title = item.getAttribute("data-autocomplete-title") || "";
    input.value = title;
    setClearVisibility();
    hideAutocomplete();
    if (id && onOpenMovie) onOpenMovie(id);
    else runSearch(title);
  });

  document.addEventListener("click", (e) => {
    const container = document.getElementById("search-container");
    if (container && !container.contains(e.target)) hideAutocomplete();
  });

  setClearVisibility();

  return {
    runSearch,
    clearSearch,
    retry: () => currentQuery && runSearch(currentQuery),
    getQuery: () => currentQuery,
  };
}
