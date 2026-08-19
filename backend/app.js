const express = require("express");
const router = express.Router()
const AuthRouter = require("./routers/AuthRouter")

router.use("/auth",AuthRouter)

module.exports = router