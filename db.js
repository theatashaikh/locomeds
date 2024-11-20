const mongoose = require("mongoose");

async function connectToDB() {
  try {
    await mongoose.connect(process.env.DATABASE_CONNECTION_STRING);
    console.log("Connected to database");
  } catch (error) {
    console.log("Error connecting to database", error);
  }
}

module.exports = connectToDB;
