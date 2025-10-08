const express = require("express");
const router = express.Router();

const { generateAccessToken, getMarketFeed } = require("../controllers/angelbrokingController");

router.get("/generate-token", generateAccessToken);
router.get("/market-feed", getMarketFeed);

module.exports = router;
