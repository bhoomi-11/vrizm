let mongoose = require("mongoose");

let WebSiteSchema = new mongoose.Schema({
  website: {
    type: String,
  },
  created:{
      type: Date,
      default: new Date()
  },
  updated:{
      type: Date,
      default: new Date()
  }
});

module.exports = mongoose.model("websites", WebSiteSchema);