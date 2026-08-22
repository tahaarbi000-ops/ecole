const Subject = require("./Subject");
const Teacher = require("./Teacher");

Teacher.hasMany(Subject,{
    foreignKey:"teacher_id",
    as:"subject"
})
Subject.hasMany(Teacher,{
    foreignKey:"teacher_id",
    as:"teacher"
})

module.exports = {Teacher,Subject}