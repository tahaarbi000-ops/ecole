const express = require("express");
const router = express.Router()
const AuthRouter = require("./routers/AuthRouter")
const StudentRouter = require("./routers/StudentRouter")
const TeacherRouter = require("./routers/TeacherRouter")
const SupervisorRouter = require("./routers/SupervisorRouter")
const EmployRouter = require("./routers/EmployRouter")
const AbsenceRouter = require("./routers/AbsenceRouter")
const ScoringRouter = require("./routers/ScoringRouter")
const SubscriptionRouter = require("./routers/SubscriptionRouter")

router.use("/auth",AuthRouter)
router.use("/student",StudentRouter)
router.use("/teacher",TeacherRouter)
router.use("/supervisor",SupervisorRouter)
router.use("/employ",EmployRouter)
router.use("/absence",AbsenceRouter)
router.use("/scoring",ScoringRouter)
router.use("/subscription",SubscriptionRouter)

module.exports = router