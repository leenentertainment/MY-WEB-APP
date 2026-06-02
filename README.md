# MY-WEB-APP
 
Simple personal Stock Management app (single-file frontend).

Usage
- Open [index.html](index.html) in your browser.
- Add products, record buys and sells, view current stock and history.
- Export and import CSV via the buttons in the app.

Files
- [index.html](index.html) — main UI
- [js/app.js](js/app.js) — application logic (uses localStorage)
- [css/style.css](css/style.css) — styles

New pages/features
- `Home`: overall product and item counts.
- `Inventory`: add/edit/delete products and see per-product stock.
- `Sale`: record buys/sells; prevents oversell; view and edit/delete transactions.
- `Summary`: filter by date range and export summary CSV.
- `Settings`: backup (download JSON), restore from JSON, and reset all data.

Notes
- Data is kept in browser `localStorage` under key shown in Settings.
- Backup/restore uses JSON; transaction export uses CSV.

PWA & Offline
- The app includes a basic `manifest.json` and `sw.js` service worker for offline caching. Open the app in a browser and choose "Install" (or add to home screen) to use it like an app.

Cloud Sync (Firebase)
- To enable optional cloud sync, go to `Settings`, paste your Firebase config JSON (the web app config object), click `Save & Connect`, then `Sync Now` to push your local data to your Firebase Realtime Database under `personal_stock/default`.
- No credentials are stored remotely by default — you must provide your own Firebase project.

Security
- Firebase sync is optional. If enabled, your app writes/reads data from your Firebase Realtime Database; configure rules appropriately for your use case.