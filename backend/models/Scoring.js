const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Teacher = require("./Teacher");

const Scoring  = sequelize.define("scoring",{
    id:{
        type:DataTypes.BIGINT,
        primaryKey:true,
        autoIncrement:true
    },
    noticed:{
        type:DataTypes.STRING,
    },
    sense:{
        type:DataTypes.ENUM("entrée","sortie"),
    },
    date:{
        type:DataTypes.DATEONLY,
    },
    time:{
        type:DataTypes.TIME,
    },
    justification:{
        type:DataTypes.BOOLEAN,
    },
    teacher_id:{
        type:DataTypes.BIGINT,
        references:{
            model:Teacher,
            key:"id"
        }
    },
    
})
module.exports = Scoring
