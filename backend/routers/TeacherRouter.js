const express = require("express");
const { getAllTeacher, createTeacher } = require("../controllers/TeacherController");
const router = express.Router()

router.get("/",getAllTeacher)
router.post("/",createTeacher)

module.exports = router