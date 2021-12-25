let mongoose = require("mongoose");

let SummarySchema = new mongoose.Schema({
  content: {
    type: String,
  },
  summary:{
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

module.exports = mongoose.model("summary", SummarySchema);
