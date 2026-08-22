const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Employ  = sequelize.define("employs",{
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
        type:DataTypes.ENUM("secrétaire","comptable","chauffeur","agent de nettoyage","agent de sécurité"),
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
module.exports = Employ
