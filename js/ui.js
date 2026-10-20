/**
 * DOM rendering helpers — no direct API calls.
 */
import { posterUrl, backdropUrl, profileUrl } from "./api.js";
import { isInWatchlist } from "./watchlist.js";

/** Escape text for safe HTML insertion. */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function yearFromDate(dateStr) {
  if (!dateStr) return "—";
  return String(dateStr).slice(0, 4);
}

export function formatDate(dateStr) {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRuntime(minutes) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function ratingLabel(vote) {
  if (vote == null || vote === 0) return "N/A";
  return Number(vote).toFixed(1);
}

/**
 * Build genre name lookup from TMDB genre list.
 * @param {{ id: number, name: string }[]} genres
 */
export function genreMap(genres = []) {
  const map = new Map();
  genres.forEach((g) => map.set(g.id, g.name));
  return map;
}

export function genreNames(ids = [], map) {
  return ids.map((id) => map.get(id)).filter(Boolean);
}

/* —— Skeletons —— */

export function skeletonCards(count = 8, variant = "grid") {
  const items = Array.from({ length: count }, () =>
    variant === "row"
      ? `<div class="movie-card skeleton-card" aria-hidden="true">
           <div class="poster-wrap skeleton"></div>
           <div class="card-body">
             <div class="skeleton skeleton-text"></div>
             <div class="skeleton skeleton-text short"></div>
           </div>
         </div>`
      : `<div class="movie-card skeleton-card" aria-hidden="true">
           <div class="poster-wrap skeleton"></div>
           <div class="card-body">
             <div class="skeleton skeleton-text"></div>
             <div class="skeleton skeleton-text short"></div>
           </div>
         </div>`
  ).join("");
  return items;
}

export function skeletonUpcoming(count = 3) {
  return Array.from(
    { length: count },
    () => `<article class="upcoming-card skeleton-card" aria-hidden="true">
      <div class="upcoming-poster skeleton"></div>
      <div class="upcoming-body">
        <div class="skeleton skeleton-text lg"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
    </article>`
  ).join("");
}

/* —— Empty / error —— */

export function emptyState({ title, message, actionHtml = "" }) {
  return `<div class="empty-state" role="status">
    <div class="empty-icon" aria-hidden="true">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M7 5v14M17 5v14M2 12h20"/>
      </svg>
    </div>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(message)}</p>
    ${actionHtml}
  </div>`;
}

export function errorState(message, retryId) {
  const retry = retryId
    ? `<button type="button" class="btn btn-secondary" data-retry="${escapeHtml(retryId)}">Try again</button>`
    : "";
  return emptyState({
    title: "Couldn't load movies",
    message,
    actionHtml: retry,
  });
}

/* —— Movie cards —— */

/**
 * @param {object} movie
 * @param {{ badge?: string, rank?: number, genres?: Map }} [opts]
 */
export function movieCardHtml(movie, opts = {}) {
  const title = movie.title || movie.name || "Untitled";
  const year = yearFromDate(movie.release_date);
  const rating = ratingLabel(movie.vote_average);
  const saved = isInWatchlist(movie.id);
  const badge = opts.badge
    ? `<span class="badge">${escapeHtml(opts.badge)}</span>`
    : "";
  const rank =
    opts.rank != null
      ? `<span class="rank-badge" aria-hidden="true">${opts.rank}</span>`
      : "";

  return `<article class="movie-card" data-movie-id="${movie.id}">
    <div class="poster-wrap">
      ${rank}
      ${badge}
      <img
        class="poster"
        src="${escapeHtml(posterUrl(movie.poster_path))}"
        alt="Poster for ${escapeHtml(title)}"
        loading="lazy"
        decoding="async"
        onerror="this.onerror=null;this.src='assets/images/placeholder-poster.svg'"
      />
      <div class="card-overlay">
        <button type="button" class="btn btn-primary btn-sm" data-action="details" data-id="${movie.id}">
          View details
        </button>
        <button
          type="button"
          class="icon-btn watchlist-btn ${saved ? "is-saved" : ""}"
          data-action="watchlist"
          data-id="${movie.id}"
          aria-pressed="${saved}"
          aria-label="${saved ? "Remove from watchlist" : "Add to watchlist"}"
          title="${saved ? "Remove from watchlist" : "Add to watchlist"}"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${saved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="card-body">
      <h3 class="card-title">
        <button type="button" class="title-btn" data-action="details" data-id="${movie.id}">
          ${escapeHtml(title)}
        </button>
      </h3>
      <div class="card-meta">
        <span>${escapeHtml(year)}</span>
        <span class="rating" title="TMDB user score">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z"/></svg>
          ${escapeHtml(rating)}
          <span class="visually-hidden">TMDB score</span>
        </span>
      </div>
    </div>
  </article>`;
}

export function upcomingCardHtml(movie, genresMap) {
  const title = movie.title || "Untitled";
  const names = genreNames(movie.genre_ids || [], genresMap).slice(0, 3);
  const overview = movie.overview
    ? movie.overview.slice(0, 160) + (movie.overview.length > 160 ? "…" : "")
    : "No overview available yet.";

  return `<article class="upcoming-card" data-movie-id="${movie.id}">
    <div class="upcoming-poster">
      <img
        src="${escapeHtml(posterUrl(movie.poster_path))}"
        alt="Poster for ${escapeHtml(title)}"
        loading="lazy"
        onerror="this.onerror=null;this.src='assets/images/placeholder-poster.svg'"
      />
      <span class="badge badge-upcoming">Upcoming</span>
    </div>
    <div class="upcoming-body">
      <h3>
        <button type="button" class="title-btn" data-action="details" data-id="${movie.id}">
          ${escapeHtml(title)}
        </button>
      </h3>
      <p class="upcoming-date">
        <span class="label">Expected</span>
        ${escapeHtml(formatDate(movie.release_date))}
      </p>
      ${names.length ? `<p class="genre-tags">${names.map((n) => `<span class="tag">${escapeHtml(n)}</span>`).join("")}</p>` : ""}
      <p class="upcoming-overview">${escapeHtml(overview)}</p>
      <button type="button" class="btn btn-secondary btn-sm" data-action="details" data-id="${movie.id}">
        More info
      </button>
    </div>
  </article>`;
}

/**
 * Hero featured movie markup.
 */
export function heroHtml(movie, genresMap) {
  const title = movie.title || "Untitled";
  const year = yearFromDate(movie.release_date);
  const rating = ratingLabel(movie.vote_average);
  const names = genreNames(movie.genre_ids || [], genresMap).slice(0, 4);
  const overview = movie.overview
    ? movie.overview.slice(0, 220) + (movie.overview.length > 220 ? "…" : "")
    : "";
  const saved = isInWatchlist(movie.id);
  const bg = backdropUrl(movie.backdrop_path || movie.poster_path);

  return {
    backdropStyle: `background-image:url("${bg}")`,
    html: `
      <h1 class="hero-title" id="hero-title">${escapeHtml(title)}</h1>
      <div class="hero-facts">
        <span>${escapeHtml(year)}</span>
        <span class="rating-pill" title="Average user score from The Movie Database">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z"/></svg>
          ${escapeHtml(rating)}
          <span class="source">TMDB</span>
        </span>
        ${names.map((n) => `<span class="tag">${escapeHtml(n)}</span>`).join("")}
      </div>
      <p class="hero-overview">${escapeHtml(overview)}</p>
      <div class="hero-actions">
        <button type="button" class="btn btn-primary" data-action="details" data-id="${movie.id}">
          View details
        </button>
        <button
          type="button"
          class="btn btn-secondary watchlist-cta ${saved ? "is-saved" : ""}"
          data-action="watchlist"
          data-id="${movie.id}"
          aria-pressed="${saved}"
        >
          ${saved ? "In watchlist" : "Add to watchlist"}
        </button>
        <button type="button" class="btn btn-ghost" data-action="trailer" data-id="${movie.id}" hidden id="hero-trailer-btn">
          Watch trailer
        </button>
      </div>
    `,
  };
}

/**
 * Modal details content.
 */
export function modalHtml(movie) {
  const title = movie.title || "Untitled";
  const original =
    movie.original_title && movie.original_title !== title
      ? `<p class="modal-original">Original title: ${escapeHtml(movie.original_title)}</p>`
      : "";
  const genres = (movie.genres || [])
    .map((g) => `<span class="tag">${escapeHtml(g.name)}</span>`)
    .join("");
  const companies = (movie.production_companies || [])
    .slice(0, 4)
    .map((c) => c.name)
    .filter(Boolean);
  const cast = (movie.credits?.cast || []).slice(0, 10);
  const trailer = (movie.videos?.results || []).find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser") && v.key
  );
  const saved = isInWatchlist(movie.id);
  const bg = backdropUrl(movie.backdrop_path || movie.poster_path);

  const castHtml = cast.length
    ? `<div class="cast-row">
        ${cast
          .map(
            (p) => `<div class="cast-card">
            <img src="${escapeHtml(profileUrl(p.profile_path))}" alt="" loading="lazy"
              onerror="this.onerror=null;this.src='assets/images/placeholder-poster.svg'" />
            <p class="cast-name">${escapeHtml(p.name)}</p>
            <p class="cast-role">${escapeHtml(p.character || "")}</p>
          </div>`
          )
          .join("")}
      </div>`
    : `<p class="muted">Cast information unavailable.</p>`;

  const trailerHtml = trailer
    ? `<div class="trailer-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/${escapeHtml(trailer.key)}"
          title="Trailer for ${escapeHtml(title)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>`
    : "";

  return `
    <div class="modal-hero" style="background-image:url('${bg}')">
      <div class="modal-hero-overlay"></div>
    </div>
    <div class="modal-main">
      <div class="modal-poster">
        <img
          src="${escapeHtml(posterUrl(movie.poster_path))}"
          alt="Poster for ${escapeHtml(title)}"
          onerror="this.onerror=null;this.src='assets/images/placeholder-poster.svg'"
        />
      </div>
      <div class="modal-info">
        <h2 id="modal-title">${escapeHtml(title)}</h2>
        ${original}
        <div class="modal-facts">
          <span>${escapeHtml(formatDate(movie.release_date))}</span>
          <span>${escapeHtml(formatRuntime(movie.runtime))}</span>
          <span class="rating-pill" title="TMDB user score">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z"/></svg>
            ${escapeHtml(ratingLabel(movie.vote_average))}
            <span class="source">TMDB</span>
          </span>
          <span class="muted">${escapeHtml((movie.original_language || "").toUpperCase())}</span>
        </div>
        <div class="genre-tags">${genres}</div>
        <p class="modal-overview">${escapeHtml(movie.overview || "No overview available.")}</p>
        ${
          companies.length
            ? `<p class="production"><span class="label">Production</span> ${escapeHtml(companies.join(" · "))}</p>`
            : ""
        }
        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-primary watchlist-cta ${saved ? "is-saved" : ""}"
            data-action="watchlist"
            data-id="${movie.id}"
            aria-pressed="${saved}"
          >
            ${saved ? "Remove from watchlist" : "Add to watchlist"}
          </button>
          ${
            trailer
              ? `<a class="btn btn-secondary" href="https://www.youtube.com/watch?v=${escapeHtml(trailer.key)}" target="_blank" rel="noopener noreferrer">Open trailer</a>`
              : ""
          }
        </div>
      </div>
    </div>
    <div class="modal-section">
      <h3>Top cast</h3>
      ${castHtml}
    </div>
    ${trailerHtml ? `<div class="modal-section"><h3>Trailer</h3>${trailerHtml}</div>` : ""}
  `;
}

/* —— Toasts —— */

export function showToast(message, type = "info") {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.setAttribute("role", "status");
  el.textContent = message;
  region.appendChild(el);
  requestAnimationFrame(() => el.classList.add("is-visible"));
  setTimeout(() => {
    el.classList.remove("is-visible");
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

/* —— Watchlist button sync —— */

export function syncWatchlistButtons(id, saved) {
  document.querySelectorAll(`[data-action="watchlist"][data-id="${id}"]`).forEach((btn) => {
    btn.classList.toggle("is-saved", saved);
    btn.setAttribute("aria-pressed", String(saved));
    const label = saved ? "Remove from watchlist" : "Add to watchlist";
    if (btn.classList.contains("watchlist-cta")) {
      btn.textContent = btn.closest(".modal")
        ? saved
          ? "Remove from watchlist"
          : "Add to watchlist"
        : saved
          ? "In watchlist"
          : "Add to watchlist";
    } else {
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      const svg = btn.querySelector("svg");
      if (svg) svg.setAttribute("fill", saved ? "currentColor" : "none");
    }
  });
}
