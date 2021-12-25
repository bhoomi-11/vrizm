let mongoose = require("mongoose");

let PodCastSchema = new mongoose.Schema({
  podcast: {
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

module.exports = mongoose.model("podcasts", PodCastSchema);
