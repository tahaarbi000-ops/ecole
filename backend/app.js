const express = require("express");
const router = express.Router()
const AuthRouter = require("./routers/AuthRouter")
const StudentRouter = require("./routers/StudentRouter")

router.use("/auth",AuthRouter)
router.use("/student",StudentRouter)

module.exports = router