/**
 * TMDB API client — all network requests live here.
 */
import { CONFIG } from "./config.js";

const cache = new Map();

/**
 * Build a TMDB URL with API key and query params.
 * @param {string} path
 * @param {Record<string, string|number|boolean|undefined|null>} [params]
 */
function buildUrl(path, params = {}) {
  const url = new URL(`${CONFIG.BASE_URL}${path}`);
  url.searchParams.set("api_key", CONFIG.API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

/**
 * @param {string} path
 * @param {Record<string, string|number|boolean|undefined|null>} [params]
 * @param {{ cacheKey?: string, cacheTtlMs?: number }} [options]
 */
export async function tmdbFetch(path, params = {}, options = {}) {
  if (!CONFIG.API_KEY || CONFIG.API_KEY.trim() === "") {
    const err = new Error("API_KEY_MISSING");
    err.code = "API_KEY_MISSING";
    throw err;
  }

  const cacheKey = options.cacheKey || `${path}?${JSON.stringify(params)}`;
  const ttl = options.cacheTtlMs ?? 60_000;

  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (Date.now() - entry.at < ttl) return entry.data;
  }

  let response;
  try {
    response = await fetch(buildUrl(path, params));
  } catch {
    const err = new Error("NETWORK_ERROR");
    err.code = "NETWORK_ERROR";
    throw err;
  }

  if (response.status === 401) {
    const err = new Error("INVALID_API_KEY");
    err.code = "INVALID_API_KEY";
    throw err;
  }

  if (response.status === 429) {
    const err = new Error("RATE_LIMIT");
    err.code = "RATE_LIMIT";
    throw err;
  }

  if (!response.ok) {
    const err = new Error(`HTTP_${response.status}`);
    err.code = "HTTP_ERROR";
    err.status = response.status;
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const err = new Error("INVALID_JSON");
    err.code = "INVALID_RESPONSE";
    throw err;
  }

  cache.set(cacheKey, { at: Date.now(), data });
  return data;
}

export function clearApiCache() {
  cache.clear();
}

export function posterUrl(path, size = CONFIG.POSTER_SIZE) {
  if (!path) return CONFIG.PLACEHOLDER_POSTER;
  return `${CONFIG.IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path, size = CONFIG.BACKDROP_SIZE) {
  if (!path) return CONFIG.PLACEHOLDER_BACKDROP;
  return `${CONFIG.IMAGE_BASE}/${size}${path}`;
}

export function profileUrl(path, size = CONFIG.PROFILE_SIZE) {
  if (!path) return CONFIG.PLACEHOLDER_POSTER;
  return `${CONFIG.IMAGE_BASE}/${size}${path}`;
}

export async function getTrending(page = 1, timeWindow = "week") {
  return tmdbFetch(`/trending/movie/${timeWindow}`, { page });
}

export async function getPopular(page = 1) {
  return tmdbFetch("/movie/popular", { page });
}

export async function getTopRated(page = 1) {
  return tmdbFetch("/movie/top_rated", { page });
}

export async function getUpcoming(page = 1) {
  return tmdbFetch("/movie/upcoming", { page });
}

export async function getNowPlaying(page = 1) {
  return tmdbFetch("/movie/now_playing", { page });
}

/**
 * Movies released in the last N days (theatrical + digital premiere dates).
 * Distinct from "Now Playing" (current theatrical) and "Upcoming" (future).
 */
export async function getNewReleases(page = 1, days = 30) {
  const today = new Date();
  const past = new Date(today);
  past.setDate(past.getDate() - days);

  const toISO = (d) => d.toISOString().slice(0, 10);

  return tmdbFetch("/discover/movie", {
    page,
    include_adult: false,
    sort_by: "primary_release_date.desc",
    "primary_release_date.gte": toISO(past),
    "primary_release_date.lte": toISO(today),
    "vote_count.gte": 5,
  });
}

/** Load movies for a browse category (Movie Explorer pattern). */
export async function getCategoryMovies(category, page = 1) {
  switch (category.type) {
    case "trending":
      return getTrending(page, "week");
    case "top_rated":
      return getTopRated(page);
    case "upcoming":
      return getUpcoming(page);
    case "now_playing":
      return getNowPlaying(page);
    case "new_releases":
      return getNewReleases(page, category.days ?? 30);
    case "genre":
      return discoverMovies({ genre: category.genreId, sort: "popularity.desc" }, page);
    default:
      return getPopular(page);
  }
}

export async function searchMovies(query, page = 1) {
  return tmdbFetch("/search/movie", {
    query,
    page,
    include_adult: false,
  });
}

/**
 * Discover movies with filters.
 * @param {object} filters
 */
export async function discoverMovies(filters = {}, page = 1) {
  const params = {
    page,
    include_adult: false,
    sort_by: filters.sort || "popularity.desc",
  };

  if (filters.genre) params.with_genres = filters.genre;
  if (filters.year) params.primary_release_year = filters.year;
  if (filters.rating) params["vote_average.gte"] = filters.rating;
  if (filters.language) params.with_original_language = filters.language;

  // Ensure rated sorts have enough votes to be meaningful
  if (String(params.sort_by).includes("vote_average")) {
    params["vote_count.gte"] = 100;
  }

  return tmdbFetch("/discover/movie", params);
}

export async function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`, {
    append_to_response: "credits,videos",
  });
}

export async function getGenres() {
  return tmdbFetch("/genre/movie/list");
}

/**
 * Map TMDB error codes to user-facing copy.
 * @param {Error & { code?: string }} err
 */
export function errorMessage(err) {
  switch (err?.code) {
    case "API_KEY_MISSING":
      return "Add your TMDB API key in js/config.js to load movies.";
    case "INVALID_API_KEY":
      return "That TMDB API key looks invalid. Check js/config.js and try again.";
    case "NETWORK_ERROR":
      return "Network error. Check your connection and try again.";
    case "RATE_LIMIT":
      return "TMDB rate limit reached. Wait a moment and retry.";
    case "INVALID_RESPONSE":
      return "Unexpected response from TMDB. Please try again.";
    default:
      return "Something went wrong loading movies. Please try again.";
  }
}

/**
 * Validate that a payload looks like a paged movie list.
 * @param {unknown} data
 */
export function isMovieList(data) {
  return Boolean(data && Array.isArray(data.results));
}
