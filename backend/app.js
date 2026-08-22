const express = require("express");
const router = express.Router()
const AuthRouter = require("./routers/AuthRouter")
const StudentRouter = require("./routers/StudentRouter")
const TeacherRouter = require("./routers/TeacherRouter")
const SupervisorRouter = require("./routers/SupervisorRouter")
const EmployRouter = require("./routers/EmployRouter")

router.use("/auth",AuthRouter)
router.use("/student",StudentRouter)
router.use("/teacher",TeacherRouter)
router.use("/supervisor",SupervisorRouter)
router.use("/employ",EmployRouter)

module.exports = router