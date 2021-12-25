let mongoose = require("mongoose");

let PostSchema = new mongoose.Schema({
  link: {
    type: String,
  },
  postedDate: {
    type: Date,
  },
  content: {
    type: String,
  },
  title: {
    type: String,
  },
  websiteID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  summary: {
    type: String,
  },
  featured_media:{
    type: String,
  },
  categories:{
    type: Array
  },
  tags:{
    type: Array
  },
  featured:{
    type: Boolean,
    default: false
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

module.exports = mongoose.model("posts", PostSchema);
