const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Supervisor  = sequelize.define("supervisors",{
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
    role:{
        type:DataTypes.ENUM("surveillant général","surveillant de cour","surveillant d'étude","responsable discipline"),
    },
    salary :{
        type:DataTypes.DECIMAL(10, 2),
    },
    date_deposited:{
        type:DataTypes.DATEONLY,
    },
    status:{
        type:DataTypes.ENUM("actif","inactif","en congé"),
    },
})
module.exports = Supervisor
