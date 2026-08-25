const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");


const Price  = sequelize.define("price",{
    id:{
        type:DataTypes.BIGINT,
        primaryKey:true,
        autoIncrement:true
    },
    price:{
        type:DataTypes.DOUBLE,
    },
})
module.exports = Price
