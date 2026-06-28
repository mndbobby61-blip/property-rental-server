require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(process.env.DB_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

const sampleProperties = [
  { title: "Sunny 2-Bed Apartment", location: "Gulshan 2, Dhaka", type: "Apartment", price: 28000, rentType: "Monthly", beds: 2, baths: 2, size: 1100, status: "approved", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800", description: "A bright, well-ventilated apartment close to Gulshan Avenue.", amenities: ["Parking", "Generator", "Lift"], createdAt: new Date() },
  { title: "Quiet Family House", location: "Bashundhara R/A, Dhaka", type: "House", price: 45000, rentType: "Monthly", beds: 4, baths: 3, size: 2200, status: "approved", image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800", description: "Spacious family home in a quiet residential block.", amenities: ["Garden", "Parking"], createdAt: new Date() },
  { title: "Modern Studio Unit", location: "Banani, Dhaka", type: "Studio", price: 16000, rentType: "Monthly", beds: 1, baths: 1, size: 480, status: "approved", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800", description: "Compact studio, fully furnished, walking distance to Banani 11.", amenities: ["Furnished", "Wifi"], createdAt: new Date() },
  { title: "Shared Room near Campus", location: "Mohammadpur, Dhaka", type: "Room", price: 7000, rentType: "Monthly", beds: 1, baths: 1, size: 200, status: "approved", image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800", description: "Budget-friendly shared room, popular with students.", amenities: ["Wifi"], createdAt: new Date() },
  { title: "Compact Office Space", location: "Dhanmondi, Dhaka", type: "Office", price: 32000, rentType: "Monthly", beds: 0, baths: 1, size: 900, status: "approved", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800", description: "Ground-floor office space, suitable for small teams.", amenities: ["Parking", "Generator"], createdAt: new Date() },
  { title: "Riverside Duplex", location: "Uttara, Dhaka", type: "House", price: 52000, rentType: "Monthly", beds: 3, baths: 2, size: 1800, status: "approved", image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=800", description: "Two-storey duplex with a small private garden.", amenities: ["Garden", "Parking", "Lift"], createdAt: new Date() },
  { title: "Bright Corner Apartment", location: "Mirpur DOHS, Dhaka", type: "Apartment", price: 21000, rentType: "Monthly", beds: 2, baths: 1, size: 950, status: "approved", image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800", description: "Corner unit with extra natural light on two sides.", amenities: ["Lift", "Generator"], createdAt: new Date() },
  { title: "Furnished Studio", location: "Dhanmondi, Dhaka", type: "Studio", price: 19500, rentType: "Monthly", beds: 1, baths: 1, size: 520, status: "approved", image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=800", description: "Fully furnished studio, move-in ready.", amenities: ["Furnished", "Wifi", "Lift"], createdAt: new Date() },
  { title: "Spacious Family Home", location: "Baridhara, Dhaka", type: "House", price: 60000, rentType: "Monthly", beds: 4, baths: 3, size: 2400, status: "approved", image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800", description: "Large home in a diplomatic-zone-adjacent neighborhood.", amenities: ["Garden", "Parking", "Generator"], createdAt: new Date() },
  { title: "Affordable Single Room", location: "Mohammadpur, Dhaka", type: "Room", price: 6000, rentType: "Monthly", beds: 1, baths: 1, size: 180, status: "approved", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=800", description: "Simple single room, ideal for a single tenant on a budget.", amenities: ["Wifi"], createdAt: new Date() },
  { title: "Daily Stay Apartment", location: "Banani, Dhaka", type: "Apartment", price: 2500, rentType: "Daily", beds: 1, baths: 1, size: 600, status: "approved", image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=800", description: "Short-stay friendly apartment, ideal for business travelers.", amenities: ["Furnished", "Wifi"], createdAt: new Date() },
  { title: "Weekly Serviced Room", location: "Gulshan 1, Dhaka", type: "Room", price: 9000, rentType: "Weekly", beds: 1, baths: 1, size: 220, status: "approved", image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800", description: "Serviced room with weekly cleaning included.", amenities: ["Wifi", "Furnished"], createdAt: new Date() },
];

async function seed() {
  await client.connect();
  const db = client.db("propertyRentalDB");
  const collection = db.collection("properties");

  const existingCount = await collection.countDocuments();
  if (existingCount > 0) {
    console.log(`⚠️  "properties" কালেকশনে আগে থেকেই ${existingCount}টা ডকুমেন্ট আছে। Duplicate এড়াতে স্কিপ করা হলো।`);
    console.log(`   নতুন করে সিড করতে চাইলে MongoDB Atlas/Compass থেকে কালেকশন খালি করে আবার চালাও।`);
  } else {
    const result = await collection.insertMany(sampleProperties);
    console.log(`✅ ${result.insertedCount}টা sample property যুক্ত হয়েছে।`);
  }

  await client.close();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});