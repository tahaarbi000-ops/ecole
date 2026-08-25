require("dotenv").config();

const Price = require("../models/Price");
const sequelize = require("../config/db");
const bcrypt = require("bcryptjs");
async function createAdmin (){
    try{
        await sequelize.sync();
    
    const data = [
        { level: 'Préscolaire', amount: 30 },
        { level: '1ère année', amount: 85 },
        { level: '2ème année', amount: 85 },
        { level: '3ème année', amount: 85 },
        { level: '4ème année', amount: 85 },
        { level: '5ème année', amount: 85 },
        { level: '6ème année', amount: 85 },
    ]
    for(const d of data){
        await Price.create({label:d.level,price:d.amount})
    }
    console.log("price created");
    process.exit();
    }catch(err){
        console.log(err);
        process.exit();
    }
}
createAdmin()