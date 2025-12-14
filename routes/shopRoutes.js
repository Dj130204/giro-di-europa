import express from "express";
const router = express.Router();

router.get("/shop", (req, res) => res.render("shop"));
router.get("/shop/:handle", (req, res) => res.render("product", { handle: req.params.handle }));

export default router;
