# Anup Trading Analysis Pro — Version 2.0

Responsive web/PWA starter for desktop and Android browsers. Educational chart analysis only; no order placement or investment recommendations.

## Included
- Crypto candles and 24-hour ticker via Binance public market-data endpoints, routed through a small Express backend.
- Custom candlestick chart using TradingView Lightweight Charts for all three markets when a permitted data feed is configured.
- TradingView embedded chart mode for stocks and forex (and optional crypto).
- Basic RSI, MACD histogram and EMA 20 calculations for loaded crypto candles.
- Device-local watchlist and analysis journal.
- PWA manifest and service worker for installability.

## Requirements
- Node.js 18 or newer (built-in `fetch` is used).
- Internet connection for market data and chart libraries.

## Run locally
1. Extract the ZIP.
2. Open a terminal in the project folder.
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:3000`

## Enable licensed Stocks/Forex custom candles

1. Copy `.env.example` to `.env` and set `TWELVE_DATA_API_KEY` on the server only.
2. Keep `TWELVE_DATA_DISPLAY_AUTHORIZED=false` unless Twelve Data and the relevant exchanges have explicitly authorized display in your app.
3. Only after that authorization, set `TWELVE_DATA_DISPLAY_AUTHORIZED=true` in the server environment and restart.
4. Never put the API key in `public/app.js`, HTML, or any browser-side code.

The Basic free plan is limited to internal non-display use; it is not permission to show its raw market data in a user-facing chart. Check current plan and exchange permissions before enabling the route.

## Android install
1. Deploy the app to an HTTPS host.
2. Open its URL in Chrome on Android.
3. Use the browser menu → Install app / Add to Home screen.

## Market-data notes
- Binance public market data is used for crypto candles and 24h ticker. Availability depends on network, regional access, symbol validity and provider limits.
- Stocks and forex have a Twelve Data OHLC adapter for custom charts, plus TradingView embedded-chart fallback. Examples for custom data: `RELIANCE:NSE`, `SBIN:NSE`, `EUR/USD`, `GBP/USD`. For TradingView embeds, the app maps these to `NSE:RELIANCE`, `NSE:SBIN`, `FX:EURUSD`, `FX:GBPUSD`.
- TradingView embeds do not provide this app with a general-purpose raw market-data API. Data display, delays, exchange permissions and commercial-use restrictions are controlled by TradingView and the relevant exchanges.
- Do not scrape TradingView or expose paid API credentials in browser code. For a production product, obtain a data-provider plan that explicitly permits redistribution/display for each exchange.
- The stocks/forex custom-chart adapter requires a Twelve Data API key and a plan/exchange license that explicitly allows data display. The server route is disabled by default. The Twelve Data Basic free plan is described as internal non-display use, so do not set `TWELVE_DATA_DISPLAY_AUTHORIZED=true` on the free plan. Use TradingView embed mode until you have explicit display rights.

## Production checklist
- Host behind HTTPS.
- Add rate limiting and monitoring to the API server.
- Review Binance API terms and regional availability.
- Review TradingView widget terms and exchange display permissions.
- Add server-side caching, request throttling, error monitoring and privacy policy before public launch.
- PWA service worker caches the app shell, not market data. Journal and watchlist use browser localStorage and are not synced between devices.

## Disclaimer
This is an educational software starter. Market data can be delayed, incomplete or unavailable. Indicators are descriptive calculations, not guaranteed signals. Nothing here is financial advice.


## Android phone setup (Hindi)
See [MOBILE-HINDI-GUIDE.md](./MOBILE-HINDI-GUIDE.md) for phone-only deployment and installation steps. A Render Blueprint file (`render.yaml`) is included.
