const mongoose = require("mongoose");
const initdata = require("./data.js");
const listing = require("../models/listing.js");

const mongoUrl = "mongodb://127.0.0.1:27017/wonderlust";

main()
 .then(() =>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(mongoUrl);
}

const initDB = async ()=>{
    await listing.deleteMany({});
    await listing.insertMany(initdata.data);
    console.log("data was  initialized ");
};

initDB();