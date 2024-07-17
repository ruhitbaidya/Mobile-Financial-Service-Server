const express = require("express");
const cors = require("cors");
const app = express();
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 6000;
app.use(cors());
app.use(express.json());
const saltRounds = 10;

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_Password}@datafind.xfgov3s.mongodb.net/?retryWrites=true&w=majority&appName=datafind`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // all db cluster
    const registerUser = client.db("Mobile_fun_app").collection("registerUser");

    app.get("/", (req, res) => {
      res.send("Hello world!");
    });

    app.post("/createToken", async (req, res) => {
      const infos = req.body;
      console.log(infos);
      let token = jwt.sign(infos, process.env.jwt_secure, {
        expiresIn: "2hr",
      });
      res.send({ token });
    });

    app.post("/verifyToken", async (req, res) => {
      const {token} = req.body;
      if(token === null){
        return res.send({status : false})
      }
      jwt.verify(token, process.env.jwt_secure, async function (err, decoded) {
        if(decoded){
            const query = {
                $or : [
                    {email : decoded.user},
                    {phone : decoded.user}
                ]
            }
            const userFind = await registerUser.findOne(query)
            if(userFind){
                return res.send(userFind)            
            }else{
                return res.send({status : false})
            }
        }
      });
    });

    app.post("/login", async (req, res) => {
      const { user, pin } = req.body;
      const query = {
        $or: [
          {
            email: user,
          },
          {
            phone: user,
          },
        ],
      };
      if (user && pin) {
        console.log("finds");
        const findUser = await registerUser.findOne(query);
        if (findUser) {
          bcrypt.compare(pin, findUser.pin, function (err, result) {
            if (result) {
              return res.send({ message: "Successfully Login", status: true });
            } else {
              return res.send("Unauthorize User");
            }
          });
        } else {
          return res.send("unauthorize user");
        }
      }
      console.log(req.body);
    });
    app.post("/register", async (req, res) => {
      const datas = req.body;
      if (
        datas.name === "" ||
        datas.email === "" ||
        datas.phone === "" ||
        datas.pin === ""
      ) {
        return res.send("Invalid Information");
      }
      if (datas.pin) {
        const existUseremail = await registerUser.findOne({
          email: datas.email,
        });
        const existUserphone = await registerUser.findOne({
          phone: datas.phone,
        });
        console.log(existUseremail, existUserphone);
        if (existUseremail || existUserphone) {
          return res
            .status(403)
            .send({ message: "You Can Not Register This Email And Password" });
        }
        bcrypt.genSalt(saltRounds, async (err, salt) => {
          bcrypt.hash(datas.pin, salt, async (err, hash) => {
            const result = await registerUser.insertOne({
              name: datas.name,
              email: datas.email,
              phone: datas.phone,
              pin: hash,
              status: "pending",
            });
            res.send(result);
          });
        });
      }
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`This server is start ${port}`);
});
