const express = require("express");
const { getAllSubscription, paySubscription } = require("../controllers/SubscriptionController");
const router = express.Router()

router.get("/",getAllSubscription)
router.post("/",paySubscription)

module.exports = router