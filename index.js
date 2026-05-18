const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')

dotenv.config()
const app = express()
const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI

app.use(cors())
app.use(express())

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
    const db = client.db('doc_appoint')
    const doctorData = db.collection('data')

    app.get('/all-appointment', async (req, res) => {
      const cursor = doctorData.find();
      const result = await cursor.toArray();
      res.send(result)
    })


    await client.db("admin").command({ ping: 1 });
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
