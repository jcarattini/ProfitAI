// netlify/functions/news.js
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const KEY = process.env.AV_KEY;
  if (!KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: "API key not configured" }) };

  try {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets,economy_macro,technology,earnings&limit=20&sort=LATEST&apikey=${KEY}`;
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
