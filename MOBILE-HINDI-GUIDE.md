# Android मोबाइल पर Anup Trading Analysis Pro चलाएँ

यह प्रोजेक्ट मोबाइल स्क्रीन के लिए responsive है और PWA के रूप में install हो सकता है। इसे पहले HTTPS hosting पर प्रकाशित करना होगा।

## सबसे आसान तरीका: GitHub + Render (मोबाइल से भी)

1. ZIP को डाउनलोड करके अपने फोन में Extract करें।
2. GitHub पर लॉगिन करें और नया Public या Private repository बनाएँ।
3. Repository में **Add file → Upload files** चुनकर Extract किए हुए प्रोजेक्ट के सभी फ़ोल्डर और फ़ाइलें अपलोड करें। ध्यान दें: `package.json`, `render.yaml`, `server` और `public` repository के मुख्य स्तर पर होने चाहिए।
4. Render.com पर GitHub से लॉगिन करें। **New → Blueprint** चुनें और अपना repository connect करें।
5. Render को `render.yaml` मिलने पर service बनाएँ। Deploy पूरा होने पर आपको `https://...onrender.com` जैसा URL मिलेगा।
6. Android में Chrome से यह URL खोलें। Menu (⋮) → **Install app** या **Add to Home screen** दबाएँ।
7. अब ऐप फोन की Home Screen से खुलेगा।

## मोबाइल में इस्तेमाल
- चार्ट को उँगली से drag करके देखें और pinch/zoom करें।
- समय अवधि के बटन दाएँ-बाएँ scroll हो सकते हैं।
- Watchlist और Journal उसी मोबाइल/ब्राउज़र में सेव रहते हैं। Browser data साफ करने पर वे मिट सकते हैं।
- ऐप को पहली बार खोलने और market data पाने के लिए इंटरनेट चाहिए।

## डेटा और सीमाएँ
- Crypto market data Binance के public endpoints से आता है।
- Stocks और Forex के लिए TradingView chart उपलब्ध है। Custom raw-data chart के लिए अलग से display अधिकार वाला data plan चाहिए।
- Twelve Data की free Basic योजना को user-facing raw chart display के लिए सक्षम न करें। `TWELVE_DATA_DISPLAY_AUTHORIZED` को `false` ही रखें जब तक लिखित अनुमति/उचित योजना न हो। API key को कभी `public` फ़ोल्डर में न डालें।
- यह केवल शैक्षिक chart-study ऐप है; इसमें order placing या buy/sell recommendations नहीं हैं।

## ज़रूरी बात
ZIP अपने-आप वेबसाइट नहीं बनता। Hosting पर एक बार deploy करना जरूरी है। Render की free service कुछ समय निष्क्रिय रहने पर सो सकती है; पहली बार खुलने में थोड़ा समय लग सकता है।
