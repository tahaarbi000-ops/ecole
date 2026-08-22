const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Teacher  = sequelize.define("teachers",{
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
    phone:{
        type:DataTypes.STRING,
    },
    salary :{
        type: DataTypes.DECIMAL(10, 2),
    },
    date_deposited:{
        type:DataTypes.DATEONLY,
    },
    status:{
        type:DataTypes.ENUM("actif","inactif","en congé"),
    },
})
module.exports = Teacher
