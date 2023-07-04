const express = require('express')
const app = express()
const stripe = require('stripe')(process.env.DB_STRIPEKEY);
const port = process.env.PORT||5000
var cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
app.use(cors())
app.use(express.json())
require("dotenv").config();




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f7zs7lw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// jwt

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorized acess" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
    if (error) {
      return res
        .status(403)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

  let cleaningCollections= client.db("cleaningServiceDB").collection('cleaningServiceCollections')
  let cleaningUsersCollections= client.db("cleaningUserDB").collection('cleaningUsersCollections')
  let appoinmentsCollections= client.db("appoinmentsDB").collection("appoinmentsCollections")
 

  let staffCollections=client.db("staffDB").collection("staffCollections")

  let paymentServiceCollections=client.db("paymentServiceDB").collection("paymentServiceCollections")




  const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await cleaningUsersCollections.findOne(query);
    if (user?.role !== "admin") {
      return res
        .status(403)
        .send({ error: true, message: "forbiden access" });
    }
    next();
  };


 




  app.get('/allstaff', async(req, res) => {

    const result= await staffCollections.find().toArray()
    res.send(result)
  })
  


  app.post('/appoinments',async(req,res)=>{
    const appoinments= req.body
    const result = await appoinmentsCollections.insertOne(appoinments)
    res.send(result)
  })


  app.get('/usersappoinments',verifyJWT,verifyAdmin,async(req, res) => {

    let result= await appoinmentsCollections.find().toArray()
    res.send(result)
  })




  
app.get('/appoinments',verifyJWT,async(req, res) => {

  let query={}
  if(req.query?.email){
    query={email:req.query?.email}
  }
  if (req.decoded.email !== req.query.email) {
    return res
      .status(403)
      .send({ error: true, message: "forbidden access" });
  }
  let result= await appoinmentsCollections.find(query).toArray()
  res.send(result)
})


app.get('/appoinments/:id', async(req, res) => {
  let id=req.params.id
  const query={_id: new ObjectId(id)}
  let result= await appoinmentsCollections.findOne(query)
  res.send(result)
})


app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1h',
  });
  res.send({ token });
});


  
app.delete('/appoinments/:id', async(req, res) => {
  const id=req.params.id
  let query={_id: new ObjectId(id)}
  let result= await appoinmentsCollections.deleteOne(query)
  res.send(result)
})





  
app.patch('/usersappoinments/:id', async(req, res) => {
  const id=req.params.id
  const appoinments=req.body.status
  const filter={_id: new ObjectId(id)}
  const updateDoc = {
    $set: {
      status: appoinments
    },
    
  }
  const result = await appoinmentsCollections.updateOne(filter, updateDoc );
  res.send(result)
})




app.patch('/usersappoinments/:id', async(req, res) => {
  const id=req.params.id
  const appoinments=req.body.status
  const filter={_id: new ObjectId(id)}
  const updateDoc = {
    $set: {
      status: appoinments
    },
    
  }
  const result = await appoinmentsCollections.updateOne(filter, updateDoc );
  res.send(result)
})





app.post('/allusers',async(req,res)=>{
  const user= req.body
  const query={email:user.email}
  const existingUsers= await cleaningUsersCollections.findOne(query)
  if(existingUsers){
    return res.send({message:"user already exist"})
  }
  const result= await cleaningUsersCollections.insertOne(user)
  res.send(result)
})




app.patch('/allusers/:id',async(req,res)=>{
const id=req.params.id
const users=req.body.role
const filter={_id: new ObjectId(id)}
const updateDoc = {
  $set: {
    role: users
  },
  
}
const result = await cleaningUsersCollections.updateOne(filter, updateDoc );
res.send(result)
})




app.get('/allusers', verifyJWT,verifyAdmin,async (req, res) => {
  let result = await cleaningUsersCollections.find().toArray();
  res.send(result);
});


app.get("/allusers/admin/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;
  if (req.decoded.email !== email) {
    return res.send({ admin: false });
  }
  const query = { email: email };
  const user = await cleaningUsersCollections.findOne(query);
  const result = { admin: user?.role === "admin" };
  res.send(result);
});



app.get("/allusers/user/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;
  if (req.decoded.email !== email) {
    return res.send({ user: false });
  }
  const query = { email: email };
  const user = await cleaningUsersCollections.findOne(query);
  const result = { user: user?.role === "user" };
  res.send(result);
});





app.patch('/allstaff/:id',  async(req, res) => {
const id=req.params.id
const payments=req.body.status
const filter={_id: new ObjectId(id) }

const updateDoc = {
  $set: {
    status: payments
  } 
  
}
const result = await staffCollections.updateOne(filter, updateDoc );
res.send(result)

})






  app.get('/services', async(req, res) => {
    let result= await cleaningCollections.find().toArray()
    res.send(result)
  })
  
  app.get('/services/servicename', async(req, res) => {
    const options = {

        projection: { _id: 1,name:1 },
      };
  
    let services= await cleaningCollections.find({},options).toArray()
    res.send(services)
  })
  




  app.get('/services/:id', async(req, res) => {
    const id=req.params.id
    const query={_id: new ObjectId(id)}
    let services= await cleaningCollections.findOne(query)
    res.send(services)
  })
  
  app.post('/payments',async(req,res)=>{
    const payments= req.body
    const result = await paymentServiceCollections.insertOne(payments)

    const query={_id: new ObjectId(payments.serviceId)}
    const deletedResult= await appoinmentsCollections.deleteOne(query)
    res.send({result,deletedResult})
  })




  app.get('/payments',verifyJWT,async(req,res)=>{
    let query={}
    if(req.query?.email){
      query={email:req.query?.email}
    }
    if (req.decoded.email !== req.query.email) {
      return res
        .status(403)
        .send({ error: true, message: "forbidden access" });
    }
    let options={
      sort:{"rate":req.query?.sort=== 'asc'?1:-1}
    }
   
const result= await paymentServiceCollections.find(query,options).toArray()
    res.send(result)
  })








  
  app.post("/create-payment-intent", async (req, res) => {
    const { rate } = req.body;
    const amount = rate * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  });


    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);










app.get('/', (req, res) => {
  res.send('Cleaning service server')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})