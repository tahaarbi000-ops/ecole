const Scoring = require("./Scoring");
const Student = require("./Student");
const Subject = require("./Subject");
const Subscription = require("./Subscription");
const Teacher = require("./Teacher");

Teacher.hasMany(Subject,{
    foreignKey:"teacher_id",
    as:"subject"
})
Subject.belongsTo(Teacher,{
    foreignKey:"teacher_id",
    as:"teacher"
})

Teacher.hasMany(Subject,{
    foreignKey:"teacher_id",
    as:"scoring"
})
Scoring.belongsTo(Teacher,{
    foreignKey:"teacher_id",
    as:"scoringTeacher"
})

Student.hasOne(Subscription,{
    foreignKey:"student_id",
    as:"subscription"
})
Subscription.belongsTo(Student,{
    foreignKey:"student_id",
    as:"student"
})


module.exports = {Teacher,Subject,Scoring,Student,Subscription}