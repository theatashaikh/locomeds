const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema({
  state: { type: String, required: true, lowercase: true },
  district: { type: String, required: true, lowercase: true },
  city: { type: String, required: true, lowercase: true },
  zoneName: { type: String, required: true, unique: true, lowercase: true },
});

module.exports = mongoose.model("Zone", zoneSchema);
