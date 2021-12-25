let mongoose = require("mongoose");

let PlayStoreSchema = new mongoose.Schema({
  link: {
    type: String,
  },
  released: {
    type: String,
  },
  description: {
    type: String,
  },
  title: {
    type: String,
  },
  summary: {
    type: String,
  },
  icon:{
    type: String,
  },
  appId:{
    type: String
  },
  url:{
    type: String
  },
  reviews:{
    type: Array
  },
  ratings:{
    type: Object
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

module.exports = mongoose.model("play-store", PlayStoreSchema);
