const express = require("express");
const { getAllSupervisors, createSupervisors } = require("../controllers/SupervisorsController");
const router = express.Router()

router.get("/",getAllSupervisors)
router.post("/",createSupervisors)

module.exports = router