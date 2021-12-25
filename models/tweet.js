let mongoose = require("mongoose");

let TweetSchema = new mongoose.Schema({
  tweetID: {
    type: Number,
  },
  text: {
    type: String,
  },
  media: {
    type:Array,
  },
  tweetTimeStamp:{
    type:String,
  },
  userID:{
    type:String,
  },
  username:{
    type:String,
  },
  profileImageUrl:{
    type:String,
  },
  userDescription:{
    type:String
  },
  authorName:{
    type:String
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

module.exports = mongoose.model("tweets", TweetSchema);
