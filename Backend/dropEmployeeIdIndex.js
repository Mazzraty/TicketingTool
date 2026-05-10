import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

const dbName = uri.includes("/") ? uri.split("/").pop().split("?")[0] : "";

async function run() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection.db;
    const collectionName = "employeemasters";
    const indexes = await db.collection(collectionName).indexes();

    console.log(`Indexes on ${collectionName}:`);
    indexes.forEach((idx) => console.log(`- ${idx.name}`));

    const indexName = "employeeId_1";
    const hasIndex = indexes.some((idx) => idx.name === indexName);

    if (!hasIndex) {
      console.log(`Index '${indexName}' does not exist. Nothing to drop.`);
    } else {
      await db.collection(collectionName).dropIndex(indexName);
      console.log(`Dropped index '${indexName}' from ${collectionName}.`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
