const express = require("express")
const router = express.Router();
const UrlController=require("../controllers/UrlController")

router.post("/url/shorten",UrlController.createShortenUrl)
router.get("/:urlCode",UrlController.redirectUrl)


module.exports = router;