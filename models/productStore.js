let mongoose = require("mongoose");

let StoreSchema = new mongoose.Schema({
 ASIN: {
    type: String,
  },
  BrowseNodeInfo: {
    type: Object,
  },
  DetailPageURL: {
    type: String,
  },
  Images: {
    type: Object,
  },
  ItemInfo: {
    type: Object,
  },
  Offers: {
    type: Object,
  },
  ParentASIN:{
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

module.exports = mongoose.model("stores", StoreSchema);
