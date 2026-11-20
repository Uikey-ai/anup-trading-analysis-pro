const $ = id => document.getElementById(id);
let market = "crypto", interval = "1h", chartMode = "custom", chart, candleSeries, volumeSeries, emaSeries;
let candles = [];
const defaults = {crypto:"BTCUSDT",stocks:"RELIANCE:NSE",forex:"EUR/USD"};
const helpText = {
 crypto:"Binance symbols, e.g. BTCUSDT, ETHUSDT. Custom candles use public Binance data.",
 stocks:"Twelve Data symbol, e.g. RELIANCE:NSE, SBIN:NSE, AAPL.",
 forex:"Currency pair, e.g. EUR/USD, GBP/USD, USD/JPY."
};
function setStatus(text){$("connection-label").textContent=text;$("stat-status").textContent=text;}
function fmt(n){return Number(n).toLocaleString(undefined,{maximumFractionDigits:8});}
function calcEMA(values,period){let k=2/(period+1),out=[];values.forEach((v,i)=>out.push(i===0?v:v*k+out[i-1]*(1-k)));return out;}
function calcRSI(values,period=14){
 if(values.length<=period)return null;
 let gains=0,losses=0;
 for(let i=1;i<=period;i++){let d=values[i]-values[i-1];if(d>=0)gains+=d;else losses-=d;}
 let avgGain=gains/period,avgLoss=losses/period;
 for(let i=period+1;i<values.length;i++){let d=values[i]-values[i-1];avgGain=(avgGain*(period-1)+Math.max(d,0))/period;avgLoss=(avgLoss*(period-1)+Math.max(-d,0))/period;}
 return avgLoss===0?100:100-(100/(1+avgGain/avgLoss));
}
function calcMACD(values){
 if(values.length<35)return null;
 const fast=calcEMA(values,12),slow=calcEMA(values,26),line=values.map((_,i)=>fast[i]-slow[i]),signal=calcEMA(line,9);
 return {line:line.at(-1),signal:signal.at(-1),hist:line.at(-1)-signal.at(-1)};
}
function initChart(){
 const el=$("custom-chart");el.innerHTML="";
 if(!window.LightweightCharts){el.textContent="Chart library could not load. Check your internet connection.";return;}
 chart=LightweightCharts.createChart(el,{layout:{background:{color:"#0d1726"},textColor:"#9aabc0"},grid:{vertLines:{color:"#1b293b"},horzLines:{color:"#1b293b"}},rightPriceScale:{borderColor:"#26364c"},timeScale:{borderColor:"#26364c",timeVisible:true},crosshair:{mode:0},width:el.clientWidth,height:el.clientHeight});
 candleSeries=chart.addCandlestickSeries({upColor:"#25b98a",downColor:"#ef6876",borderVisible:false,wickUpColor:"#25b98a",wickDownColor:"#ef6876"});
 volumeSeries=chart.addHistogramSeries({priceFormat:{type:"volume"},priceScaleId:"volume",scaleMargins:{top:.82,bottom:0},lastValueVisible:false,priceLineVisible:false});
 emaSeries=chart.addLineSeries({color:"#eabf62",lineWidth:2,priceLineVisible:false,lastValueVisible:false});
 new ResizeObserver(()=>{if(chart)chart.applyOptions({width:el.clientWidth,height:el.clientHeight});}).observe(el);
}
async function loadCrypto(){
 setStatus("Loading");
 $("chart-title").textContent=$("symbol-input").value.trim().toUpperCase();
 $("chart-subtitle").textContent="Crypto · Binance public market data";
 try{
  const symbol=$("symbol-input").value.trim().toUpperCase();
  const [cRes,tRes]=await Promise.all([
   fetch(`/api/crypto/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=200`),
   fetch(`/api/crypto/ticker?symbol=${encodeURIComponent(symbol)}`)
  ]);
  if(!cRes.ok)throw new Error((await cRes.json()).error||"Candle data unavailable");
  if(!tRes.ok)throw new Error("Ticker data unavailable");
  candles=await cRes.json();const ticker=await tRes.json();
  $("stat-market").textContent="Crypto";$("stat-symbol").textContent=symbol;
  $("stat-price").textContent=fmt(ticker.lastPrice);
  $("stat-change").textContent=`${ticker.priceChangePercent>=0?"+":""}${ticker.priceChangePercent.toFixed(2)}% (24h)`;
  $("stat-change").style.color=ticker.priceChangePercent>=0?"var(--green)":"var(--red)";
  $("stat-range").textContent=`${fmt(ticker.lowPrice)} – ${fmt(ticker.highPrice)}`;
  if(chartMode==="custom"){if(!chart)initChart();renderCandles();}
  updateIndicators();setStatus("Connected");
 }catch(err){setStatus("Unavailable");$("custom-chart").innerHTML=`<div class="chart-placeholder">${escapeHTML(err.message)}. Try another symbol or timeframe.</div>`;}
}

async function loadTwelveDataCandles(){
 setStatus("Loading");
 const symbol=$("symbol-input").value.trim().toUpperCase();
 $("chart-title").textContent=symbol;
 $("chart-subtitle").textContent=(market==="stocks"?"Stocks":"Forex")+" · Twelve Data custom candles";
 try{
  const query=new URLSearchParams({symbol,interval,market,limit:"200"});
  const response=await fetch(`/api/twelvedata/klines?${query}`);
  const payload=await response.json();
  if(!response.ok)throw new Error(payload.error||"Custom market data unavailable");
  candles=payload;
  if(!chart)initChart();
  renderCandles();
  updateIndicators();
  const last=candles.at(-1);
  $("stat-market").textContent=market==="stocks"?"Stocks":"Forex";
  $("stat-symbol").textContent=symbol;
  $("stat-price").textContent=last?fmt(last.close):"—";
  $("stat-change").textContent="Latest returned candle";
  $("stat-range").textContent=last?`${fmt(last.low)} – ${fmt(last.high)}`:"—";
  setStatus("Connected");
 }catch(err){
  setStatus("License / data needed");
  $("custom-chart").innerHTML=`<div class="chart-placeholder" style="padding:24px;text-align:center">${escapeHTML(err.message)}<br><br>Choose TradingView mode for the available embedded chart, or configure a provider plan with display rights.</div>`;
 }
}
function escapeHTML(value){
 return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function tradingViewSymbol(){
 const raw=$("symbol-input").value.trim().toUpperCase();
 if(market==="stocks"){
  if(raw.includes(":")){const [name,exchange]=raw.split(":");return `${exchange}:${name}`;}
  return raw;
 }
 if(market==="forex")return "FX:"+raw.replace("/","");
 return raw;
}

function renderCandles(){
 if(!chart||!candles.length)return;
 candleSeries.setData(candles);
 volumeSeries.setData(candles.map(c=>({time:c.time,value:c.volume,color:c.close>=c.open?"#247e68":"#91434e"})));
 const closes=candles.map(c=>c.close),ema=calcEMA(closes,20);
 emaSeries.setData(candles.map((c,i)=>({time:c.time,value:ema[i]})));
 emaSeries.applyOptions({visible:$("ema-toggle").checked});
 volumeSeries.applyOptions({visible:$("volume-toggle").checked});
 chart.timeScale().fitContent();
}
function updateIndicators(){
 const closes=candles.map(c=>c.close),rsi=calcRSI(closes),macd=calcMACD(closes),ema=calcEMA(closes,20).at(-1);
 $("rsi-value").textContent=rsi===null?"—":rsi.toFixed(2);
 $("rsi-note").textContent=rsi===null?"Need more candles":rsi>=70?"Above 70 zone":rsi<=30?"Below 30 zone":"Between 30 and 70";
 $("macd-value").textContent=macd?macd.hist.toFixed(4):"—";
 $("macd-note").textContent=macd?(macd.hist>=0?"Histogram positive":"Histogram negative"):"Need more candles";
 $("ema-value").textContent=ema?fmt(ema):"—";
}
function renderTradingView(){
 $("tv-chart").innerHTML="";
 const symbol=tradingViewSymbol();
 const container=$("tv-chart");
 if(!window.TradingView){container.textContent="TradingView widget could not load. Check internet access.";return;}
 new TradingView.widget({autosize:true,symbol,interval:interval==="1m"?"1":interval==="5m"?"5":interval==="15m"?"15":interval==="1h"?"60":interval==="4h"?"240":interval==="1d"?"D":"W",timezone:"Asia/Kolkata",theme:"dark",style:"1",locale:"en",enable_publishing:false,hide_top_toolbar:false,allow_symbol_change:true,container_id:"tv-chart",studies:["RSI@tv-basicstudies","MACD@tv-basicstudies","Volume@tv-basicstudies"]});
}
function showChart(){
 const custom=chartMode==="custom";
 $("custom-chart").classList.toggle("hidden",!custom);$("tv-chart").classList.toggle("hidden",custom);
 $("chart-mode-custom").classList.toggle("active",custom);$("chart-mode-tv").classList.toggle("active",!custom);
 if(custom){if(!chart)initChart();if(candles.length)renderCandles();}
 else renderTradingView();
}
function loadMarket(){
 const symbol=$("symbol-input").value.trim().toUpperCase();
 $("chart-title").textContent=symbol;$("stat-market").textContent=market==="stocks"?"Stocks":market==="forex"?"Forex":"Crypto";$("stat-symbol").textContent=symbol;
 if(chartMode==="custom"){
  if(market==="crypto")loadCrypto();
  else loadTwelveDataCandles();
 } else {
  $("chart-subtitle").textContent=market==="stocks"?"Stocks · TradingView chart":"Forex · TradingView chart";
  $("stat-price").textContent="Chart provider";$("stat-change").textContent="Quote availability varies";$("stat-range").textContent="See chart";
  setStatus("Chart mode");showChart();
 }
}
document.querySelectorAll(".market-tab").forEach(btn=>btn.addEventListener("click",()=>{
 market=btn.dataset.market;document.querySelectorAll(".market-tab").forEach(b=>b.classList.toggle("active",b===btn));
 $("symbol-input").value=defaults[market];$("symbol-help").textContent=helpText[market];
 loadMarket();
}));
$("load-symbol").addEventListener("click",loadMarket);
$("symbol-input").addEventListener("keydown",e=>{if(e.key==="Enter")loadMarket();});
document.querySelectorAll("[data-interval]").forEach(btn=>btn.addEventListener("click",()=>{
 interval=btn.dataset.interval;document.querySelectorAll("[data-interval]").forEach(b=>b.classList.toggle("active",b===btn));loadMarket();
}));
$("chart-mode-custom").addEventListener("click",()=>{chartMode="custom";showChart();loadMarket();});
$("chart-mode-tv").addEventListener("click",()=>{chartMode="tv";showChart();});
$("ema-toggle").addEventListener("change",()=>{if(emaSeries)emaSeries.applyOptions({visible:$("ema-toggle").checked});});
$("volume-toggle").addEventListener("change",()=>{if(volumeSeries)volumeSeries.applyOptions({visible:$("volume-toggle").checked});});

function getWatch(){try{return JSON.parse(localStorage.getItem("anup-watchlist")||'["BTCUSDT","ETHUSDT","BNBUSDT"]')}catch{return ["BTCUSDT"]}}
function renderWatch(){const list=$("watchlist");list.innerHTML="";getWatch().forEach(s=>{const row=document.createElement("button");row.className="watch-item";const name=document.createElement("strong");name.textContent=s;const hint=document.createElement("small");hint.textContent="Open";row.append(name,hint);row.addEventListener("click",()=>{market="crypto";document.querySelectorAll(".market-tab").forEach(b=>b.classList.toggle("active",b.dataset.market==="crypto"));$("symbol-input").value=s;loadMarket();});list.append(row);});}
$("watch-add-btn").addEventListener("click",()=>{const s=$("watch-input").value.trim().toUpperCase();if(!/^[A-Z0-9]{5,20}$/.test(s))return;const items=getWatch();if(!items.includes(s))items.unshift(s);localStorage.setItem("anup-watchlist",JSON.stringify(items.slice(0,12)));$("watch-input").value="";renderWatch();});
function getJournal(){try{return JSON.parse(localStorage.getItem("anup-journal")||"[]")}catch{return []}}
function renderJournal(){const box=$("journal-list");box.innerHTML="";getJournal().slice(0,20).forEach(item=>{const div=document.createElement("div");div.className="journal-entry";const title=document.createElement("strong");title.textContent=item.symbol;const date=document.createElement("small");date.textContent=item.date;const note=document.createElement("div");note.textContent=item.note;div.append(title,date,note);box.append(div);});}
$("save-journal").addEventListener("click",()=>{const symbol=$("journal-symbol").value.trim().toUpperCase(),note=$("journal-note").value.trim();if(!symbol||!note){alert("Please enter a symbol and observation.");return;}const items=getJournal();items.unshift({symbol,note,date:new Date().toLocaleString()});localStorage.setItem("anup-journal",JSON.stringify(items.slice(0,100)));$("journal-symbol").value="";$("journal-note").value="";renderJournal();});
let installPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("install-btn").classList.remove("hidden");});
$("install-btn").addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("install-btn").classList.add("hidden");});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
renderWatch();renderJournal();loadMarket();
setInterval(()=>{if(chartMode==="custom"){if(market==="crypto")loadCrypto();else loadTwelveDataCandles();}},60000);
