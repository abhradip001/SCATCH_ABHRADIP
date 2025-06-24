const mongoose = require('mongoose');
const config = require("config");

const dbgr = require("debug")("development:mongoose");


mongoose.connect(`${config.get("MONGODB_URI")}/scatch`)
.then(function(){
    dbgr("Connected to MongoDB successfully");
})
.catch(function(err){
    dbgr("Error connecting to MongoDB:", err);
});

module.exports = mongoose.connection;