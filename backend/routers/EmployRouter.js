const express = require("express");
const { getAllEmploys, createEmploys } = require("../controllers/EmploysController");
const router = express.Router()

router.get("/",getAllEmploys)
router.post("/",createEmploys)

module.exports = router