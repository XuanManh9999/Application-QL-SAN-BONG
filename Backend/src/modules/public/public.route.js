const express = require("express");
const articles = require("./publicArticles.controller");

const router = express.Router();

// Public content for customer app (no auth required)
router.get("/articles", articles.list);
router.get("/articles/:id", articles.getById);

module.exports = router;

