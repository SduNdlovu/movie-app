/**
 * Movie Explorer API configuration.
 *
 * SECURITY NOTE: Any key in frontend JS is visible to visitors.
 * For production, proxy TMDB through a backend/serverless function.
 */
export const CONFIG = {
  /** TMDB v3 API key */
  API_KEY: "52a84e20ff97e36a8bc5135d0b15edd9",

  BASE_URL: "https://api.themoviedb.org/3",
  IMAGE_BASE: "https://image.tmdb.org/t/p",

  POSTER_SIZE: "w500",
  BACKDROP_SIZE: "w1280",
  PROFILE_SIZE: "w185",

  PLACEHOLDER_POSTER: "assets/images/placeholder-poster.svg",
  PLACEHOLDER_BACKDROP: "assets/images/placeholder-backdrop.svg",

  STORAGE_KEYS: {
    watchlist: "movie_explorer_watchlist",
    searchHistory: "movie_explorer_search_history",
    recentlyViewed: "movie_explorer_recent",
    theme: "movie_explorer_theme",
  },

  SEARCH_DEBOUNCE_MS: 300,
  MAX_SEARCH_HISTORY: 8,
  MAX_RECENT: 12,
  CAROUSEL_SCROLL_PX: 640,

  /** Browse rows — genre + release shelves */
  CATEGORIES: [
    { id: "trending", title: "Trending", type: "trending" },
    { id: "newreleases", title: "New Releases", type: "new_releases", days: 30 },
    { id: "comedy", title: "Comedy", type: "genre", genreId: 35 },
    { id: "horror", title: "Horror", type: "genre", genreId: 27 },
    { id: "action", title: "Action", type: "genre", genreId: 28 },
    { id: "romance", title: "Romance", type: "genre", genreId: 10749 },
    { id: "animation", title: "Animation", type: "genre", genreId: 16 },
    { id: "scifi", title: "Science Fiction", type: "genre", genreId: 878 },
    { id: "toprated", title: "Top Rated", type: "top_rated" },
    { id: "nowplaying", title: "Now Playing", type: "now_playing" },
    { id: "upcoming", title: "Upcoming", type: "upcoming" },
  ],
};
