// netlify/functions/daily.js
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const symbol = event.queryStringParameters?.symbol;
  if (!symbol) return { statusCode: 400, headers, body: JSON.stringify({ error: "symbol required" }) };

  const KEY = process.env.AV_KEY;
  if (!KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: "API key not configured" }) };

  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data["Note"] || data["Information"]) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: "limit" }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
