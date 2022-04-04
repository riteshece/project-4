const express = require("express")
const router = express.Router();


router.get("/test", function(req,res){
    res.send("All Okay")
})

module.exports = router;