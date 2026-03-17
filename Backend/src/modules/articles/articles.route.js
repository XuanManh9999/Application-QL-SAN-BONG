const express = require("express");
const controller = require("./articles.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createArticleSchema, updateArticleSchema } = require("./articles.schema");

const router = express.Router();

router.get("/", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), controller.listArticles);
router.get("/:id", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), controller.getArticleById);
router.post("/", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), validate(createArticleSchema), controller.createArticle);
router.patch("/:id", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), validate(updateArticleSchema), controller.updateArticle);
router.delete("/:id", protect, authorize("SUPER_ADMIN", "OWNER"), controller.deleteArticle);

module.exports = router;
