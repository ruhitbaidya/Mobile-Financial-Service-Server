const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 6000





app.listen(port, ()=>{
    console.log(`This server is start ${port}`)
})