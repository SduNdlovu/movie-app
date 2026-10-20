# Movie Explorer

A premium movie discovery web app built with **HTML5, CSS3, and vanilla JavaScript** (ES modules). Browse trending and genre rows, search titles, open rich details (cast + trailer), and keep a persistent watchlist — powered by [The Movie Database (TMDB)](https://www.themoviedb.org/).

> This product uses the TMDB API but is **not endorsed or certified by TMDB**.

---

## Features checklist

| Feature | Status |
|---|---|
| Sticky nav + search with autocomplete | Done |
| Cinematic hero with dynamic featured movie | Done |
| Genre browse rows (Comedy, Horror, Action, etc.) | Done |
| New Releases (last 30 days) | Done |
| Debounced search + Enter / button submit | Done |
| Search clear, loading skeletons, empty & error states | Done |
| Movie details modal (Escape / overlay close, scroll lock) | Done |
| Cast + YouTube trailer when available | Done |
| Watchlist add/remove + localStorage persistence | Done |
| Toast notifications | Done |
| Light/dark theme toggle (dark default) | Done |
| Back-to-top, reduced-motion support | Done |
| Responsive layout | Done |
| TMDB attribution in footer | Done |

---

## Project structure

```
Movie_explore/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   ├── api.js
│   ├── watchlist.js
│   ├── ui.js
│   ├── search.js
│   └── app.js
├── assets/images/
│   ├── placeholder-poster.svg
│   └── placeholder-backdrop.svg
└── README.md
```

---

## 1. Get a TMDB API key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup).
2. Open **Settings → API** and request an API key (choose *Developer*).
3. Copy your **API Key (v3 auth)**.

### Security note

Any key in frontend JavaScript is **visible to visitors**. Fine for personal projects; for production, proxy TMDB through a backend and keep the secret server-side.

Movie Explorer keeps the key in `js/config.js` for local development simplicity.

---

## 2. Configure the key

Open `js/config.js` and set:

```js
API_KEY: "YOUR_TMDB_V3_API_KEY_HERE",
```

---

## 3. Run locally

ES modules need an HTTP server:

```bash
npx serve .
```

Or with Python (if installed):

```bash
python -m http.server 5500
```

Then open the URL shown in the terminal.

---

## 4. Deploy to GitHub Pages

1. Push this project to a GitHub repository.
2. **Settings → Pages** → deploy from branch `main` / root.
3. Site URL: `https://<username>.github.io/<repo-name>/`

Prefer not committing a real API key to a public repo.

---

## License / attribution

Movie data and images © their respective owners, provided via TMDB.  
Movie Explorer UI code is provided for your project use.
