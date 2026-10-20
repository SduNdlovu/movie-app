/**
 * Watchlist + recently viewed + search history (localStorage).
 */
import { CONFIG } from "./config.js";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

/** Normalize a movie object for storage (keep fields needed for cards). */
export function slimMovie(movie) {
  return {
    id: movie.id,
    title: movie.title || movie.name || "Untitled",
    poster_path: movie.poster_path ?? null,
    backdrop_path: movie.backdrop_path ?? null,
    release_date: movie.release_date || "",
    vote_average: movie.vote_average ?? 0,
    genre_ids: movie.genre_ids || (movie.genres || []).map((g) => g.id),
    overview: movie.overview || "",
    original_language: movie.original_language || "",
  };
}

export function getWatchlist() {
  return readJson(CONFIG.STORAGE_KEYS.watchlist, []);
}

export function isInWatchlist(id) {
  return getWatchlist().some((m) => m.id === Number(id));
}

/**
 * Toggle watchlist membership.
 * @returns {{ added: boolean, list: object[] }}
 */
export function toggleWatchlist(movie) {
  const list = getWatchlist();
  const id = Number(movie.id);
  const index = list.findIndex((m) => m.id === id);

  if (index >= 0) {
    list.splice(index, 1);
    writeJson(CONFIG.STORAGE_KEYS.watchlist, list);
    return { added: false, list };
  }

  list.unshift(slimMovie(movie));
  writeJson(CONFIG.STORAGE_KEYS.watchlist, list);
  return { added: true, list };
}

export function removeFromWatchlist(id) {
  const list = getWatchlist().filter((m) => m.id !== Number(id));
  writeJson(CONFIG.STORAGE_KEYS.watchlist, list);
  return list;
}

/* —— Recently viewed —— */

export function getRecentlyViewed() {
  return readJson(CONFIG.STORAGE_KEYS.recentlyViewed, []);
}

export function addRecentlyViewed(movie) {
  const list = getRecentlyViewed().filter((m) => m.id !== Number(movie.id));
  list.unshift(slimMovie(movie));
  writeJson(CONFIG.STORAGE_KEYS.recentlyViewed, list.slice(0, CONFIG.MAX_RECENT));
  return list;
}

export function clearRecentlyViewed() {
  writeJson(CONFIG.STORAGE_KEYS.recentlyViewed, []);
}

/* —— Search history —— */

export function getSearchHistory() {
  return readJson(CONFIG.STORAGE_KEYS.searchHistory, []);
}

export function addSearchHistory(query) {
  const q = String(query || "").trim();
  if (!q) return getSearchHistory();
  const list = getSearchHistory().filter((item) => item.toLowerCase() !== q.toLowerCase());
  list.unshift(q);
  writeJson(CONFIG.STORAGE_KEYS.searchHistory, list.slice(0, CONFIG.MAX_SEARCH_HISTORY));
  return list;
}

export function removeSearchHistory(query) {
  const list = getSearchHistory().filter((item) => item !== query);
  writeJson(CONFIG.STORAGE_KEYS.searchHistory, list);
  return list;
}

export function clearSearchHistory() {
  writeJson(CONFIG.STORAGE_KEYS.searchHistory, []);
}
