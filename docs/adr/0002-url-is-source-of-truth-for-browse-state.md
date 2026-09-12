# URL is the single source of truth for Browse State

All four filters (search, category, sort, page) live in the URL query string; components read Browse State via the router and never hold parallel React state for it. This makes every Browse State shareable and revisitable (paste a URL into a new tab → same view) and is what makes React Router's Back/Forward behavior meaningful.

**Consequences**: the search input can't naively `pushState` per keystroke (Back would take one press per character) — it debounces and uses `replaceState` while typing, pushing a real entry only once the value settles or on a discrete category/sort/page change.
