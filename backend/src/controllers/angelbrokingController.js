const { SmartAPI } = require("smartapi-javascript");
const speakeasy = require("speakeasy");

const API_KEY = "BaFBfoF9";
const CLIENT_CODE = "A62174552";  
const PASSWORD = "4124";        
const TOTP_SECRET = "QXPCIJY65HUIOML7TVVJ3S343M";  

const smart_api = new SmartAPI({ api_key: API_KEY });

async function generateAccessToken(req, res) {
  try {
    const totp = speakeasy.totp({
      secret: TOTP_SECRET,
      encoding: "base32",
    });

    const data = await smart_api.generateSession(CLIENT_CODE, PASSWORD, totp);
    const accessToken = data.data.access_token;

    // You might want to store this token in memory/cache for reuse until it expires

    return res.json({ accessToken });
  } catch (error) {
    console.error("Login failed", error);
    return res.status(500).json({ error: "Failed to login" });
  }
}

async function getMarketFeed(req, res) {
  try {
    const { accessToken, exchange, symbol } = req.query;

    if (!accessToken || !exchange || !symbol) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Initialize SmartAPI instance with API key and access token
    const smart_api_with_token = new SmartAPI({
      api_key: API_KEY,
      access_token: accessToken,
    });

    // Call market feed API (check Angel Broking docs for exact method name)
    // Usually it's getLtp or getQuotes

    const response = await smart_api_with_token.getLtp({
      exchange: exchange, // e.g., "NSE" or "NFO"
      symbol: symbol,     // e.g., "INFY"
    });

    return res.json(response.data);

  } catch (error) {
    console.error("Failed to fetch market feed:", error);
    return res.status(500).json({ error: "Failed to fetch market feed" });
  }
}

module.exports = {
  generateAccessToken,
  getMarketFeed,
};