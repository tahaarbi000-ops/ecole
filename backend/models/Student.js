const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Student  = sequelize.define("students",{
    id:{
        type:DataTypes.BIGINT,
        primaryKey:true,
        autoIncrement:true
    },
    name:{
        type:DataTypes.STRING,
    },
    last_name:{
        type:DataTypes.STRING,
    },
    father_name:{
        type:DataTypes.STRING,
    },
    mother_name:{
        type:DataTypes.STRING,
    },
    father_phone:{
        type:DataTypes.STRING,
    },
    mother_phone:{
        type:DataTypes.STRING,
    },
    address:{
        type:DataTypes.STRING,
    },
    class:{
        type:DataTypes.STRING,
    },
    gender:{
        type:DataTypes.ENUM("garçon","fille"),
    },
    birthday:{
        type:DataTypes.DATEONLY,
    },
})
module.exports = Student
