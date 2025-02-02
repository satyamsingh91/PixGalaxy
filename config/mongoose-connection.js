const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/pinterestclone")
 const db =mongoose.connection;

 db.on("open",function(){
    console.log("mongodb connected");
 })

 module.exports=db;