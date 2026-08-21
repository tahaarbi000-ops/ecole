const express = require("express");
const { createStudent, getAllStudents } = require("../controllers/StudentController");
const router = express.Router()

router.get("/",getAllStudents)
router.post("/",createStudent)

module.exports = router