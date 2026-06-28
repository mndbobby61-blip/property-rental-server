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

// ─── Properties ──────────────────────────────────────────
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

app.post("/properties", verifyToken, async (req, res) => {
  const property = req.body;
  const newProperty = { ...property, status: "pending", createdAt: new Date() };
  const result = await req.propertiesCollection.insertOne(newProperty);
  res.send(result);
});

app.patch("/properties/:id/status", verifyToken, async (req, res) => {
  const { status, rejectionFeedback } = req.body;
  const updateDoc = { status };
  if (rejectionFeedback) updateDoc.rejectionFeedback = rejectionFeedback;
  try {
    const result = await req.propertiesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateDoc }
    );
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: "Invalid property id" });
  }
});

app.patch("/properties/:id", verifyToken, async (req, res) => {
  const updatedData = req.body;
  delete updatedData._id;
  try {
    const result = await req.propertiesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedData }
    );
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: "Invalid property id" });
  }
});

app.delete("/properties/:id", verifyToken, async (req, res) => {
  try {
    const result = await req.propertiesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: "Invalid property id" });
  }
});

// ─── Favorites ───────────────────────────────────────────
app.post("/favorites", verifyToken, async (req, res) => {
  const { email, propertyId } = req.body;
  const existing = await req.favoritesCollection.findOne({ email, propertyId });
  if (existing) return res.send({ message: "Already in favorites", insertedId: null });
  const result = await req.favoritesCollection.insertOne({ email, propertyId, createdAt: new Date() });
  res.send(result);
});

app.get("/favorites/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const favorites = await req.favoritesCollection.find({ email }).toArray();
  const propertyIds = favorites.map((f) => new ObjectId(f.propertyId));
  const properties = await req.propertiesCollection.find({ _id: { $in: propertyIds } }).toArray();
  const result = properties.map((p) => {
    const fav = favorites.find((f) => f.propertyId === p._id.toString());
    return { ...p, favoriteId: fav?._id };
  });
  res.send(result);
});

app.delete("/favorites/:id", verifyToken, async (req, res) => {
  const result = await req.favoritesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send(result);
});

// ─── Bookings ────────────────────────────────────────────
app.post("/bookings", verifyToken, async (req, res) => {
  const booking = req.body;
  const newBooking = { ...booking, bookingStatus: "pending", paymentStatus: "unpaid", createdAt: new Date() };
  const result = await req.bookingsCollection.insertOne(newBooking);
  res.send(result);
});

app.get("/bookings", verifyToken, async (req, res) => {
  const { email } = req.query;
  const query = email ? { tenantEmail: email } : {};
  const bookings = await req.bookingsCollection.find(query).sort({ createdAt: -1 }).toArray();
  res.send(bookings);
});

app.get("/bookings/all", verifyToken, async (req, res) => {
  const bookings = await req.bookingsCollection.find().sort({ createdAt: -1 }).toArray();
  res.send(bookings);
});

app.get("/bookings/:id", verifyToken, async (req, res) => {
  try {
    const booking = await req.bookingsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!booking) return res.status(404).send({ message: "Booking not found" });
    res.send(booking);
  } catch (err) {
    res.status(400).send({ message: "Invalid booking id" });
  }
});

app.patch("/bookings/:id/confirm-payment", verifyToken, async (req, res) => {
  const { transactionId } = req.body;
  try {
    const updateDoc = { paymentStatus: "paid", bookingStatus: "pending" };
    if (transactionId) updateDoc.transactionId = transactionId;
    const result = await req.bookingsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateDoc }
    );
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: "Invalid booking id" });
  }
});

app.patch("/bookings/:id/status", verifyToken, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await req.bookingsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { bookingStatus: status } }
    );
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: "Invalid booking id" });
  }
});

app.get("/booking-requests/:email", verifyToken, async (req, res) => {
  const ownerEmail = req.params.email;
  const ownerProperties = await req.propertiesCollection.find({ ownerEmail }).toArray();
  const propertyIds = ownerProperties.map((p) => p._id.toString());
  const bookings = await req.bookingsCollection
    .find({ propertyId: { $in: propertyIds } })
    .sort({ createdAt: -1 })
    .toArray();
  res.send(bookings);
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