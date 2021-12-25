let mongoose = require("mongoose");

let TagSchema = new mongoose.Schema({
  tagID: {
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

module.exports = mongoose.model("tags", TagSchema);
