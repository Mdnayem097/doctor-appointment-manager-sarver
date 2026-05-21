const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');


dotenv.config()
const app = express()
const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const jwks = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
  const header = req?.headers.authorization
  if (!header) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.split(" ")[1]
  console.log("TOKEN:", token);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const { payload } = await jwtVerify(token, jwks)
    console.log(payload)
    next()
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden' });
  }

}

async function run() {
  try {
    // await client.connect();
    const db = client.db('doc_appoint')
    const doctorData = db.collection('data')
    const appointmentCollection = db.collection('appointments');
    const usersCollection = db.collection("user");

    app.get('/all-appointment', async (req, res) => {
      const cursor = doctorData.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/all-appointment/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await doctorData.findOne(query);
      res.send(user);
    });

    app.post('/appointments', async (req, res) => {
      const newAppointment = req.body
      const result = await appointmentCollection.insertOne(newAppointment)
      res.send(result)
    })

    app.get('/appointments', async (req, res) => {
      const cursor = appointmentCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.patch('/appointments/:id', async (req, res) => {
      try {
        const id = req.params.id;

        const filter = {
          _id: new ObjectId(id)
        };

        const updatedDocument = {
          $set: req.body
        };

        const result = await appointmentCollection.updateOne(
          filter,
          updatedDocument
        );

        res.send(result);

      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Update failed" });
      }
    });

    app.delete('/appointments/:id', async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      }
      const result = await appointmentCollection.deleteOne(query);
      res.send(result);
    })

    app.patch("/users/:email", async (req, res) => {
      try {
        const email = req.params.email.toLowerCase().trim();

        const updatedData = req.body;

        const result = await usersCollection.updateOne(
          { email: email },
          {
            $set: {
              name: updatedData.name,
              image: updatedData.image,
            },
          }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: error.message,
        });
      }
    });


    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
