import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../public")));

const allowedIntervals = new Set(["1m","5m","15m","30m","1h","2h","4h","1d","1w"]);
const allowedSymbols = /^[A-Z0-9]{5,20}$/;

app.get("/api/crypto/klines", async (req, res) => {
  const symbol = String(req.query.symbol || "BTCUSDT").toUpperCase();
  const interval = String(req.query.interval || "1h");
  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 20), 500);

  if (!allowedSymbols.test(symbol) || !allowedIntervals.has(interval)) {
    return res.status(400).json({ error: "Invalid symbol or interval." });
  }

  try {
    const upstream = await fetch(
      `https://data-api.binance.vision/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`,
      { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(12000) }
    );
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: "Market data provider unavailable." });
    }
    const rows = await upstream.json();
    res.set("Cache-Control", "public, max-age=15");
    res.json(rows.map(row => ({
      time: Math.floor(row[0] / 1000),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5])
    })));
  } catch {
    res.status(502).json({ error: "Could not retrieve market data. Please retry." });
  }
});

app.get("/api/crypto/ticker", async (req, res) => {
  const symbol = String(req.query.symbol || "BTCUSDT").toUpperCase();
  if (!allowedSymbols.test(symbol)) return res.status(400).json({ error: "Invalid symbol." });
  try {
    const upstream = await fetch(
      `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!upstream.ok) return res.status(upstream.status).json({ error: "Ticker unavailable." });
    const d = await upstream.json();
    res.set("Cache-Control", "public, max-age=10");
    res.json({
      symbol: d.symbol,
      lastPrice: Number(d.lastPrice),
      priceChangePercent: Number(d.priceChangePercent),
      highPrice: Number(d.highPrice),
      lowPrice: Number(d.lowPrice),
      volume: Number(d.volume)
    });
  } catch {
    res.status(502).json({ error: "Could not retrieve ticker." });
  }
});


const tdIntervals = {
  "1m":"1min", "5m":"5min", "15m":"15min", "30m":"30min",
  "1h":"1h", "2h":"2h", "4h":"4h", "1d":"1day", "1w":"1week"
};

app.get("/api/twelvedata/klines", async (req, res) => {
  // Twelve Data Basic is for internal non-display use. Only enable this route
  // when the account/license explicitly permits displaying the data in this app.
  if (process.env.TWELVE_DATA_DISPLAY_AUTHORIZED !== "true") {
    return res.status(403).json({
      error: "Custom stock/forex charts require a data plan and exchange permissions that allow display. Until then, use TradingView charts."
    });
  }
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Twelve Data API key is not configured on the server." });

  const symbol = String(req.query.symbol || "").trim().toUpperCase();
  const interval = String(req.query.interval || "1h");
  const market = String(req.query.market || "");
  const outputsize = Math.min(Math.max(Number(req.query.limit) || 200, 20), 500);

  if (!symbol || symbol.length > 40 || !/^[A-Z0-9:/._ -]+$/.test(symbol) ||
      !tdIntervals[interval] || !["stocks", "forex"].includes(market)) {
    return res.status(400).json({ error: "Invalid market, symbol or interval." });
  }

  try {
    const params = new URLSearchParams({
      symbol,
      interval: tdIntervals[interval],
      outputsize: String(outputsize),
      timezone: "UTC",
      apikey: apiKey
    });
    const upstream = await fetch(`https://api.twelvedata.com/time_series?${params}`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(15000)
    });
    const payload = await upstream.json();
    if (!upstream.ok || payload.status === "error" || !Array.isArray(payload.values)) {
      return res.status(upstream.status || 502).json({
        error: payload.message || "Twelve Data did not return candle data."
      });
    }
    const rows = payload.values.slice().reverse().map(row => ({
      time: Math.floor(Date.parse(row.datetime.replace(" ", "T") + "Z") / 1000),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume || 0)
    })).filter(row => Number.isFinite(row.time) && Number.isFinite(row.close));
    res.set("Cache-Control", "private, max-age=30");
    res.json(rows);
  } catch {
    res.status(502).json({ error: "Could not retrieve Twelve Data candles. Please retry." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));
app.listen(PORT, () => console.log(`Anup Trading Analysis Pro running on http://localhost:${PORT}`));
