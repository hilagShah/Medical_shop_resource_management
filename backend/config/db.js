const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Warning: ${error.message}. Retrying in background...`);
    // Attempt background reconnects without crashing the Express server
    setTimeout(() => connectDB(), 5000);
    return null;
  }
};

module.exports = connectDB;
