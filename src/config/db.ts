import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI is missing in environment variables");
}

let isConnected = false;

/* ================= CONNECT DB ================= */
export const connectDB = async () => {
  if (isConnected) {
    console.log("🟢 MongoDB already connected");
    return;
  }

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast if Atlas is slow
      socketTimeoutMS: 45000,         // keep socket alive longer
      maxPoolSize: 10,                // better connection handling
      retryWrites: true,
    });

    isConnected = conn.connections[0].readyState === 1;

    console.log(
      `🚀 MongoDB connected: ${conn.connection.host}`
    );
  } catch (error) {
    console.error("❌ DB connection failed:", error);

    console.log("🔁 Retrying MongoDB connection in 3s...");

    setTimeout(connectDB, 3000);
  }
};

/* ================= HANDLE PROCESS CRASH ================= */
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
  isConnected = false;
});

mongoose.connection.on("reconnected", () => {
  console.log("♻️ MongoDB reconnected");
}); 