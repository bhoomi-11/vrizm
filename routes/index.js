var express = require("express");
var router = express.Router();

/* GET home page. */
router.post("/", require("../modules/post").insertPost);
router.post("/categories", require("../modules/post").masterCategoriesFn);

router.get("/", require("../modules/post").getPosts);

router.post("/app-store", require("../modules/post").postAppStoreData);
router.get("/app-store", require("../modules/post").getAppStoreData);
router.get(
  "/app-store/search/:search?",
  require("../modules/post").searchAppStore
);

router.post("/play-store", require("../modules/post").postPlayStoreData);
router.get("/play-store", require("../modules/post").getPlayStoreData);
router.get(
  "/play-store/search/:search?",
  require("../modules/post").searchPlayStore
);
router.get("/podcast",require('../modules/post').podcastFn)
router.get("/summaries",require('../modules/post').getSummaries)
router.get("/counts",require('../modules/post').getCountOfBlogs)
router.get("/counts/tags",require('../modules/post').getCountOfBlogsInTags)
router.post("/post-to-wordpress",require('../modules/post').mongoToWordpressFn)
router.post("/single-post",require('../modules/post').fetchPostFromURL)
router.post("/post-tweet",require('../modules/post').postTweets)
router.post("/meta-link",require('../modules/post').postURL)
router.post("/stores/products",require('../modules/post').storeProducts)
router.post("/recent/posts",require('../modules/post').recentPosts)
router.post("/summary",require('../modules/post').summaryFn)

module.exports = router;
