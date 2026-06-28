
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const verifyToken = require("./verifyToken");

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.DB_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

let dbPromise;
function getDB() {
  if (!dbPromise) {
    dbPromise = client.connect().then(() => {
      console.log("✅ MongoDB connected");
      return client.db("propertyRentalDB");
    });
  }
  return dbPromise;
}

app.use(async (req, res, next) => {
  try {
    const db = await getDB();
    req.propertiesCollection = db.collection("properties");
    req.favoritesCollection = db.collection("favorites");
    req.bookingsCollection = db.collection("bookings");
    req.usersCollection = db.collection("user");
    req.reviewsCollection = db.collection("reviews");
    next();
  } catch (err) {
    console.error("DB connection error:", err);
    res.status(500).send({ message: "Database connection failed" });
  }
});

// ─── Properties (public) ─────────────────────────────────
app.get("/properties", async (req, res) => {
  const { propertiesCollection } = req;
  const { location, type, min, max, sort, page = 1, limit = 6 } = req.query;
  const query = { status: "approved" };
  if (location) query.location = { $regex: location, $options: "i" };
  if (type && type !== "Any Type") query.type = type;
  if (min || max) {
    query.price = {};
    if (min) query.price.$gte = Number(min);
    if (max) query.price.$lte = Number(max);
  }
  const sortOption =
    sort === "price-asc" ? { price: 1 } : sort === "price-desc" ? { price: -1 } : { createdAt: -1 };
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;
  const total = await propertiesCollection.countDocuments(query);
  const properties = await propertiesCollection.find(query).sort(sortOption).skip(skip).limit(limitNum).toArray();
  res.send({ properties, total, totalPages: Math.max(1, Math.ceil(total / limitNum)), currentPage: pageNum });
});

// ⚠️ Protected — owner/admin only
app.get("/properties/all", verifyToken, async (req, res) => {
  const properties = await req.propertiesCollection.find().sort({ createdAt: -1 }).toArray();
  res.send(properties);
});

app.get("/properties/owner/:email", verifyToken, async (req, res) => {
  const properties = await req.propertiesCollection
    .find({ ownerEmail: req.params.email })
    .sort({ createdAt: -1 })
    .toArray();
  res.send(properties);
});

app.get("/properties/:id", async (req, res) => {
  try {
    const property = await req.propertiesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!property) return res.status(404).send({ message: "Property not found" });
    res.send(property);
  } catch (err) {
    res.status(400).send({ message: "Invalid property id" });
  }
});

// ─── Root ────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Property Rental & Booking Platform server is running");
});

if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

module.exports = app;