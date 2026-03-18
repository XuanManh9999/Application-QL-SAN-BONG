const express = require("express");
const controller = require("./articles.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createArticleSchema, updateArticleSchema } = require("./articles.schema");

const router = express.Router();

router.get("/", protect, authorize("SUPER_ADMIN"), controller.listArticles);
router.get("/:id", protect, authorize("SUPER_ADMIN"), controller.getArticleById);
router.post("/", protect, authorize("SUPER_ADMIN"), validate(createArticleSchema), controller.createArticle);
router.patch("/:id", protect, authorize("SUPER_ADMIN"), validate(updateArticleSchema), controller.updateArticle);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), controller.deleteArticle);

module.exports = router;
