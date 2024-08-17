const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//mongo start =====================

const uri = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PASS}@cluster0.v2tnkbl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const db = client.db("productsDB");
    const productsCollection = db.collection("products");

    app.get("/products", async (req, res) => {
      const { name, category, brand, sortBy } = req.query || "";
      let query = {};
      let sortCriteria = {};

    // search and filtering logic start from here =============================
    if (name || category || brand) {
        query = {
          $or: [],
        };

        if (name) {
          query.$or.push({ name: { $regex: name, $options: "i" } });
        }
        if (category) {
          query.$or.push({ category: { $regex: category, $options: "i" } });
        }
        if (brand) {
          query.$or.push({ brand: { $regex: brand, $options: "i" } });
        }
      }
    // search and filtering logic start from here =============================

    //   sorting logic start here===================================
    if (sortBy === "price-asc") {
        sortCriteria = { price: 1 }; // Sort by price, ascending
      } else if (sortBy === "price-desc") {
        sortCriteria = { price: -1 }; // Sort by price, descending
      } else if (sortBy === "date-desc") {
        sortCriteria = { createdAt: -1 }; // Sort by date, newest first
      }
    //   sorting logic end here=======================

      const size = parseInt(req.query.size);
      const page = parseInt(req.query.page) - 1;
      const result = await productsCollection
        .find(query).sort(sortCriteria)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });
    app.get("/productsCount", async (req, res) => {
      const { name, category, brand } = req.query || "";

      let query = {};
     

      if (name || category || brand) {
        query = {
          $or: [],
        };

        if (name) {
          query.$or.push({ name: { $regex: name, $options: "i" } });
        }
        if (category) {
          query.$or.push({ category: { $regex: category, $options: "i" } });
        }
        if (brand) {
          query.$or.push({ brand: { $regex: brand, $options: "i" } });
        }
      }
    

      const totalProduct = await productsCollection.countDocuments(query);
      res.send({ totalProduct });
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("server running");
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
