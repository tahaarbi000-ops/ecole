const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Zone  = sequelize.define("zone",{
    id:{
        type:DataTypes.BIGINT,
        primaryKey:true,
        autoIncrement:true
    },
    label:{
        type:DataTypes.STRING,
    },
    price:{
        type:DataTypes.DOUBLE,
    },
    
})
module.exports = Zone
