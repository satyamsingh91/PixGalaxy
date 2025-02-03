const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
 const db =mongoose.connection;

 db.on("open",function(){
    console.log("mongodb connected");
 })

 module.exports=db;