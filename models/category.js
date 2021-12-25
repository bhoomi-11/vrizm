let mongoose = require("mongoose");

let CategorySchema = new mongoose.Schema({
  categoryID: {
    type: Number,
  },
  name: {
    type: String,
  },
  created: {
    type: Date,
    default: new Date(),
  },
  updated: {
    type: Date,
    default: new Date(),
  },
});

module.exports = mongoose.model("categories", CategorySchema);
