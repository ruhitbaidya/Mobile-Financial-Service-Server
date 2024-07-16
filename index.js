const express = require("express");
const cors = require("cors")
const app = express();
const bcrypt = require('bcrypt');
require("dotenv").config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 6000
app.use(cors())
app.use(express.json())
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_Password}@datafind.xfgov3s.mongodb.net/?retryWrites=true&w=majority&appName=datafind`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // all db cluster
    const registerUser = client.db("Mobile_fun_app").collection("registerUser");

    app.get("/", (req, res)=>{
        res.send("Hello world!")
    })

    app.get("/jwtToken", async(req, res)=>{
        let token = jwt.sign({ foo: 'bar' }, 'shhhhh');
    })

    app.post('/register', async(req, res)=>{
        const datas = req.body;
        if(datas.name === "" || datas.email === "" || datas.phone === "" || datas.pin === ""){
            return res.send("Invalid Information")
        }
        if(datas.pin){
            const existUseremail = await registerUser.findOne({email : datas.email})
            const existUserphone = await registerUser.findOne({phone : datas.phone})
            console.log(existUseremail, existUserphone)
            if(existUseremail || existUserphone){
                return res.status(403).send({message : "You Can Not Register This Email And Password"})
            }
             bcrypt.genSalt(saltRounds,   async(err, salt) => {
                bcrypt.hash(datas.pin, salt,   async(err, hash)=> {
                    const result = await registerUser.insertOne({
                        name : datas.name,
                        email : datas.email,
                        phone : datas.phone,
                        pin : hash,
                        status : "pending"
                    })
                    res.send(result)
                });
            });
        }
      
    })

  } finally {
   
    // await client.close();
  }
}
run().catch(console.dir);





app.listen(port, ()=>{
    console.log(`This server is start ${port}`)
})