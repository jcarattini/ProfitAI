// netlify/functions/market.js
// ============================================================
//  Proxy serverless para el Dashboard de Mercado
//  Recibe: ?symbols=SPY,QQQ,DIA,...
//  Devuelve: array con precio, variación y serie de 6 sesiones
//  La API key NUNCA sale al navegador — vive en variables de entorno
// ============================================================

const AV = "https://www.alphavantage.co/query";
const KEY = process.env.AV_KEY; // guardada en Netlify → Environment variables

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const symbols = (event.queryStringParameters?.symbols || "SPY").split(",").slice(0, 10);

  try {
    const results = await Promise.allSettled(
      symbols.map(async (sym) => {
        const url = `${AV}?function=TIME_SERIES_DAILY&symbol=${sym}&outputsize=compact&apikey=${KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data["Note"] || data["Information"]) throw new Error("limit");

        const ts = data["Time Series (Daily)"];
        if (!ts) throw new Error("nodata");

        const dates = Object.keys(ts).sort().slice(-6);
        const closes = dates.map((d) => parseFloat(ts[d]["4. close"]));
        const price = closes[closes.length - 1];
        const prev  = closes[closes.length - 2];

        return {
          symbol: sym,
          price,
          changePct: ((price - prev) / prev) * 100,
          changePts: price - prev,
          history: closes,
          ok: true,
        };
      })
    );

    const payload = results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { symbol: symbols[i], ok: false, error: r.reason?.message }
    );

    // Si alguno retornó "limit", avísalo explícitamente
    const limited = results.some(
      (r) => r.status === "rejected" && r.reason?.message === "limit"
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: payload, limited }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
