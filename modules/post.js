const axios = require("axios");
const jsdom = require("jsdom");
const deepai = require("deepai");
deepai.setApiKey("bba0d214-23b4-4199-95a7-8ea630197fe0");
const { JSDOM } = jsdom;
let DOMParser = new JSDOM().window.DOMParser;
const store = require("app-store-scraper");
const gplay = require("google-play-scraper");
let Post = require("../models/post");
let Website = require("../models/website");
let Category = require("../models/category");
let PlayStore = require("../models/playStore");
let ProductStore = require("../models/productStore");
let AppStore = require("../models/appStore");
let Tag = require("../models/tag");
let PodCast = require("../models/podcast");
let Summary = require("../models/summary");
let Tweet = require("../models/tweet");
const download = require("image-downloader");
let fs = require("fs");
var FormData = require("form-data");
const contentDisposition = require("content-disposition");
const urlParser = require("url-parse");
var ProductAdvertisingAPIv1 = require("paapi5-nodejs-sdk");

let categoryFn = (cats, media) => {
  return new Promise((resolve) => {
    axios
      .get(`${media}categories/${cats}`)
      .then(async (cat) => {
        // let cate = await Category.findOne({ categoryID: cats });
        // if (!cate) {
        //   let category = new Category({
        //     categoryID: cats,
        //     name: cat.data.name,
        //   });
        //   await category.save();
        resolve(cat.data.name);
        // } else {
        //   resolve(cat.data.name);
        // }
      })
      .catch((error) => {
        resolve("");
      });
  });
};

let tagsFn = (tag, media) => {
  return new Promise((resolve) => {
    axios
      .get(`${media}tags/${tag}`)
      .then(async (tg) => {
        // let t = await Tag.findOne({ tagID: tag });
        // if (!t) {
        //   let ta = new Tag({
        //     tagID: tag,
        //     name: tg.data.name,
        //   });
        //   await ta.save();
        //   resolve(tg.data.name);
        // } else {
        resolve(tg.data.name);
        // }
      })
      .catch((error) => {
        resolve("");
      });
  });
};

const insertPost = async (req, res, next) => {
  let { url } = req.body;
  let website = new Website({
    website: url,
  });
  let mainUrl = url;
  let web = await Website.findOne({ website: url });
  console.log(web);
  if (!web) {
    await website.save(async (error, result) => {
      let flag = true;
      let x = 1;
      do {
        await axios
          .get(
            mainUrl.includes("?")
              ? `${mainUrl}&page=${x}&per_page=100`
              : `${mainUrl}?page=${x}&per_page=100`
          )
          .then(async (response) => {
            // console.log(response.data)
            if (response.data.length > 0) {
              // console.log(response)
              for (let r of response.data) {
                // console.log(r)
                let doc = await new DOMParser().parseFromString(
                  r.content.rendered,
                  "text/html"
                );
                let summaryArray = [];
                // let summaryArray = '';
                var selector, i;
                if (doc.querySelectorAll) {
                  selector = doc.querySelectorAll("p");
                  for (i = 0; i < selector.length; i++) {
                    summaryArray.push({
                      id: i,
                      text: selector[i].textContent,
                    });
                    // summaryArray = summaryArray.concat(selector[i].textContent);
                  }
                }
                let finalString = summaryArray[0].text;
                summaryArray.shift();
                for (let ind = 1; ind < 4; ind++) {
                  const random = Math.floor(
                    Math.random() * summaryArray.length
                  );
                  finalString = summaryArray[random]
                    ? finalString.concat(summaryArray[random].text)
                    : "";
                }
                // var resp = await deepai.callStandardApi("summarization", {
                //   text: summaryArray,
                // });
                // let c = resp.output.match("\n");
                // while (c) {
                //   resp.output = resp.output.replace("\n", " ");
                //   c = resp.output.match("\n");
                // }
                // let finalString = resp.output;
                url = url.includes("?") ? url.split("?")[0] : url;
                let media = url.substring(0, url.length - 5);
                axios
                  .get(`${media}media/${r.featured_media}`)
                  .then(async (featured_media) => {
                    console.log("poiopiouiou", x);
                    let promises = [];
                    let promiseTags = [];
                    for (let c of r.categories) {
                      promises.push(await categoryFn(c, media));
                    }
                    for (let t of r.tags) {
                      promiseTags.push(await tagsFn(t, media));
                    }
                    Promise.all([promises, promiseTags]).then(
                      async (categories) => {
                        let oldPost = await Post.findOne({
                          title: r.title.rendered,
                          link: r.link,
                        });
                        let post = new Post({
                          link: r.link,
                          postedDate: r.date,
                          content: r.content.rendered,
                          title: r.title.rendered,
                          summary: finalString,
                          websiteID: result._id,
                          featured_media: featured_media.data.guid.rendered,
                          categories: categories[0],
                          tags: categories[1],
                        });
                        if (!oldPost) {
                          await post.save();
                        }
                      }
                    );
                  })
                  .catch(async function (error) {
                    console.log("nbbbhjgjhgj");
                    if (error) {
                      let promises = [];
                      let promiseTags = [];
                      for (let c of r.categories) {
                        promises.push(await categoryFn(c, media));
                      }
                      for (let t of r.tags) {
                        promiseTags.push(await tagsFn(t, media));
                      }
                      Promise.all([promises, promiseTags]).then(
                        async (categories) => {
                          let oldPost = await Post.findOne({
                            title: r.title.rendered,
                            link: r.link,
                          });
                          let post = new Post({
                            link: r.link,
                            postedDate: r.date,
                            content: r.content.rendered,
                            title: r.title.rendered,
                            summary: finalString,
                            websiteID: result._id,
                            featured_media: "",
                            categories: categories[0],
                            tags: categories[1],
                          });
                          if (!oldPost) {
                            await post.save();
                          }
                        }
                      );
                    }
                  });
              }
            } else {
              flag = false;
            }
          })
          .catch((error) => {
            console.log(error);
            flag = false;
          });
        url = mainUrl;
        x = x + 1;
      } while (flag);
    });
  } else {
    // await website.save(async (error, result) => {
    let flag = true;
    let x = 1;
    do {
      await axios
        .get(
          mainUrl.includes("?")
            ? `${mainUrl}&page=${x}&per_page=100`
            : `${mainUrl}?page=${x}&per_page=100`
        )
        .then(async (response) => {
          // console.log(response.data)
          if (response.data.length > 0) {
            // console.log(response)
            for (let r of response.data) {
              // console.log(r)
              let doc = await new DOMParser().parseFromString(
                r.content.rendered,
                "text/html"
              );
              let summaryArray = [];
              // let summaryArray = "";
              var selector, i;
              if (doc.querySelectorAll) {
                selector = doc.querySelectorAll("p");
                for (i = 0; i < selector.length; i++) {
                  summaryArray.push({
                    id: i,
                    text: selector[i].textContent,
                  });
                  // summaryArray = summaryArray.concat(selector[i].textContent);
                }
              }
              // var resp = await deepai.callStandardApi("summarization", {
              //   text: summaryArray,
              // });
              let finalString = summaryArray[0].text;
              summaryArray.shift();
              for (let ind = 1; ind < 4; ind++) {
                const random = Math.floor(Math.random() * summaryArray.length);
                finalString = summaryArray[random]
                  ? finalString.concat(summaryArray[random].text)
                  : "";
              }
              // let c = resp.output.match("\n");
              // while (c) {
              //   resp.output = resp.output.replace("\n", " ");
              //   c = resp.output.match("\n");
              // }
              // let finalString = resp.output;
              url = url.includes("?") ? url.split("?")[0] : url;
              let media = url.substring(0, url.length - 5);
              axios
                .get(`${media}media/${r.featured_media}`)
                .then(async (featured_media) => {
                  console.log("poiopiouiou", x);
                  let promises = [];
                  let promiseTags = [];
                  for (let c of r.categories) {
                    promises.push(await categoryFn(c, media));
                  }
                  for (let t of r.tags) {
                    promiseTags.push(await tagsFn(t, media));
                  }
                  Promise.all([promises, promiseTags]).then(
                    async (categories) => {
                      let oldPost = await Post.findOne({
                        title: r.title.rendered,
                        link: r.link,
                      });
                      let post = new Post({
                        link: r.link,
                        postedDate: r.date,
                        content: r.content.rendered,
                        title: r.title.rendered,
                        summary: finalString,
                        websiteID: web._id,
                        featured_media: featured_media.data.guid.rendered,
                        categories: categories[0],
                        tags: categories[1],
                      });
                      if (!oldPost) {
                        await post.save();
                      }
                    }
                  );
                })
                .catch(async function (error) {
                  console.log("nbbbhjgjhgj");
                  if (error) {
                    let promises = [];
                    let promiseTags = [];
                    for (let c of r.categories) {
                      promises.push(await categoryFn(c, media));
                    }
                    for (let t of r.tags) {
                      promiseTags.push(await tagsFn(t, media));
                    }
                    Promise.all([promises, promiseTags]).then(
                      async (categories) => {
                        let oldPost = await Post.findOne({
                          title: r.title.rendered,
                          link: r.link,
                        });
                        let post = new Post({
                          link: r.link,
                          postedDate: r.date,
                          content: r.content.rendered,
                          title: r.title.rendered,
                          summary: finalString,
                          websiteID: web._id,
                          featured_media: "",
                          categories: categories[0],
                          tags: categories[1],
                        });
                        if (!oldPost) {
                          await post.save();
                        }
                      }
                    );
                  }
                });
            }
          } else {
            flag = false;
          }
        })
        .catch((error) => {
          console.log(error);
          flag = false;
        });
      url = mainUrl;
      x = x + 1;
    } while (flag);
    // });
  }
  res.json("done");
};

const getPosts = (req, res, next) => {
  Post.find((error, result) => {
    res.json(result);
  });
};

const appStoreReviews = async (appId) => {
  return new Promise((resolve) => {
    store
      .reviews({
        appId: appId,
      })
      .then((response) => {
        resolve(response);
      })
      .catch((err) => console.log(err));
  });
};

const appStoreRatings = async (id) => {
  return new Promise((resolve) => {
    store
      .ratings({
        id: id,
      })
      .then((response) => {
        resolve(response);
      })
      .catch((err) => console.log(err));
  });
};

const postAppStoreData = async (req, res, next) => {
  const { id } = req.body;
  store
    .app({ id: id })
    .then(async (result) => {
      appStoreReviews(result.appId).then(async (reviews) => {
        appStoreRatings(result.id).then(async (ratings) => {
          let appStore = new AppStore({
            link: result.link,
            released: result.released,
            description: result.description,
            title: result.title,
            icon: result.icon,
            appId: result.appId,
            url: result.url,
            reviews: reviews,
            ratings: ratings,
          });
          await appStore.save();
          res.json(result);
        });
      });
    })
    .catch((err) => console.log(err));
};

const playStoreReviews = async (appId) => {
  return new Promise((resolve) => {
    gplay
      .reviews({
        appId: appId,
      })
      .then((response) => {
        resolve(response.data);
      })
      .catch((err) => console.log(err));
  });
};

const postPlayStoreData = async (req, res, next) => {
  const { appId } = req.body;
  gplay.app({ appId: appId }).then(async (result) => {
    playStoreReviews(appId).then(async (reviews) => {
      let playStore = new PlayStore({
        link: result.link,
        released: result.released,
        description: result.description,
        title: result.title,
        icon: result.icon,
        appId: result.appId,
        url: result.url,
        summary: result.summary,
        ratings: {
          ratings: result.ratings,
          histogram: result.histogram,
        },
        reviews: reviews,
      });
      await playStore.save();
      res.json(result);
    });
  });
};

const getAppStoreData = (req, res, next) => {
  AppStore.find((error, result) => {
    res.json(result);
  });
};

const getPlayStoreData = (req, res, next) => {
  PlayStore.find((error, result) => {
    res.json(result);
  });
};

const searchPlayStore = async (req, res, next) => {
  let { search } = req.params;
  gplay
    .search({
      term: search,
    })
    .then((result) => {
      for (let app of result) {
        gplay.app({ appId: app.appId }).then(async (result) => {
          playStoreReviews(app.appId).then(async (reviews) => {
            let playStore = new PlayStore({
              link: result.link,
              released: result.released,
              description: result.description,
              title: result.title,
              icon: result.icon,
              appId: result.appId,
              url: result.url,
              summary: result.summary,
              ratings: {
                ratings: result.ratings,
                histogram: result.histogram,
              },
              reviews: reviews,
            });
            await playStore.save();
          });
        });
      }
      res.json(result);
    });
};

const searchAppStore = async (req, res, next) => {
  let { search } = req.params;
  store
    .search({
      term: search,
      lang: "en-us",
    })
    .then((result) => {
      for (let app of result) {
        store.app({ id: app.id }).then(async (result) => {
          appStoreReviews(result.appId).then(async (reviews) => {
            appStoreRatings(result.id).then(async (ratings) => {
              let appStore = new AppStore({
                link: result.link,
                released: result.released,
                description: result.description,
                title: result.title,
                icon: result.icon,
                appId: result.appId,
                url: result.url,
                reviews: reviews,
                ratings: ratings,
              });
              await appStore.save();
            });
          });
        });
      }
      res.json(result);
    })
    .catch((err) => console.log(err));
};

const masterCategoriesFn = async (req, res, next) => {
  const { url } = req.body;

  axios.get(url).then(async (response) => {
    for (let category of response.data) {
      let cat = await Category.findOne({ categoryID: category.id });
      if (!cat) {
        let cate = new Category({
          categoryID: category.id,
          name: category.name,
        });
        await cate.save();
      }
    }
    res.json(response.data);
  });
};

const podcastFn = async (req, res, next) => {
  const { url } = req.body;

  axios.get(url).then(async (response) => {
    let iframes = [];
    for (let podcast of response.data) {
      let doc = new DOMParser().parseFromString(
        podcast.content.rendered,
        "text/html"
      );
      iframes.push(
        doc.querySelector("iframe")
          ? doc.querySelector("iframe").getAttribute("src")
          : doc.querySelector("iframe")
      );
      let pod = new PodCast({
        podcast: doc.querySelector("iframe")
          ? doc.querySelector("iframe").getAttribute("src")
          : null,
      });
      await pod.save();
    }
    res.json(iframes);
  });
};

const summaryFn = async (req, res, next) => {
  let { content } = req.body;
  let doc = await new DOMParser().parseFromString(content, "text/html");
  let summaryArray = "";
  var selector, i;
  if (doc.querySelectorAll) {
    selector = doc.querySelectorAll("p");
    for (i = 0; i < selector.length; i++) {
      summaryArray = summaryArray.concat(selector[i].textContent);
    }
  }
  var resp = await deepai.callStandardApi("summarization", {
    text: summaryArray,
  });
  let c = resp.output.match("\n");
  while (c) {
    resp.output = resp.output.replace("\n", " ");
    c = resp.output.match("\n");
  }
  let sum = new Summary({
    content: summaryArray,
    summary: resp.output,
  });
  await sum.save();
  res.json(resp.output);
};

const getSummaries = async (req, res, next) => {
  let summaries = await Summary.find();
  res.json(summaries);
};

const getCountOfBlogs = async (req, res, next) => {
  let categories = await Category.find();
  let counts = [];
  for (let category of categories) {
    let posts = await Post.find({ categories: { $in: [category.name] } });
    counts.push({ category: category.name, count: posts.length });
  }
  counts = counts.sort((a, b) => b.count - a.count);
  res.json(counts);
};

const getCountOfBlogsInTags = async (req, res, next) => {
  let tags = await Tag.find();
  let counts = [];
  let x = 1;
  for (let tag of tags) {
    let posts = await Post.find({ tags: { $in: [tag.name] } });
    counts.push({ tag: tag.name, count: posts.length });
    console.log(x);
    x = x + 1;
  }
  counts = counts.sort((a, b) => b.count - a.count);
  res.json(counts);
};

const mongoToWordpressFn = async (req, res, next) => {
  let posts = await Post.find({ summary: "" });
  let URL = "http://localhost:8888";
  let postedPosts = [];
  console.log(posts.length);
  let post = posts[0];
  let count = 1;
  for (let post of posts) {
    console.log(post._id);
    await axios({
      url: `${URL}/wordpress/wp-json/wp/v2/posts?status=[private]&search=${encodeURI(
        post.title
      )}`,
      method: "GET",
      headers: {
        Authorization:
          "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvd29yZHByZXNzIiwiaWF0IjoxNjM4OTcxNjMzLCJuYmYiOjE2Mzg5NzE2MzMsImV4cCI6MTYzOTU3NjQzMywiZGF0YSI6eyJ1c2VyIjp7ImlkIjoiMSJ9fX0.IoNyxtMZct3JlBAiP3qX9PcVWtrOuDrlEeZnzZCYryI",
      },
    })
      .then(async (alreadyPosted) => {
        if (alreadyPosted.data.length > 0) {
          console.log("already added post");
          postedPosts.push(post);
        } else {
          let length = post.featured_media.split("/").length;
          let file = post.featured_media.split("/")[length - 1];
          let dNow = new Date(post.postedDate.getTime() + 5 * 60000);
          // console.log(post.featured_media);
          options = {
            url: post.featured_media,
            dest: `${__dirname}/files/${file}`,
          };
          let doc = await new DOMParser().parseFromString(
            post.content,
            "text/html"
          );
          let summaryArray = "";
          var selector, i;
          if (doc.querySelectorAll) {
            selector = doc.querySelectorAll("p");
            for (i = 0; i < selector.length; i++) {
              summaryArray = summaryArray.concat(selector[i].textContent);
            }
          }
          var resp = await deepai.callStandardApi("summarization", {
            text: summaryArray,
          });
          let c = resp.output.match("\n");
          while (c) {
            resp.output = resp.output.replace("\n", " ");
            c = resp.output.match("\n");
          }
          let finalString = resp.output;
          if (finalString === "") {
            finalString = summaryArray;
          }
          let postUpdate = Post.findByIdAndUpdate(
            { _id: post._id },
            { $set: { summary: finalString } },
            { new: true },
            (error, result) => {}
          );
          await download
            .image(options)
            .then(({ filename }) => {
              console.log("Saved to", filename);
            })
            .catch((err) => console.error("image", err));
          let categories = [];
          for (let category of post.categories) {
            var categoryFormData = new FormData();
            categoryFormData.append("name", category);
            await axios
              .get(
                `${URL}/wordpress/wp-json/wp/v2/categories?search=${category}`
              )
              .then(async (cat) => {
                if (cat.data.length > 0) {
                  categories.push(cat.data[0].id);
                } else {
                  await axios({
                    url: `${URL}/wordpress/wp-json/wp/v2/categories`,
                    method: "POST",
                    headers: {
                      Authorization:
                        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvd29yZHByZXNzIiwiaWF0IjoxNjM4OTcxNjMzLCJuYmYiOjE2Mzg5NzE2MzMsImV4cCI6MTYzOTU3NjQzMywiZGF0YSI6eyJ1c2VyIjp7ImlkIjoiMSJ9fX0.IoNyxtMZct3JlBAiP3qX9PcVWtrOuDrlEeZnzZCYryI",
                      ...categoryFormData.getHeaders(),
                    },
                    data: categoryFormData,
                  })
                    .then((resCategory) => {
                      categories.push(resCategory.data.id);
                    })
                    .catch((error) => {
                      console.log(error);
                    });
                }
              });
          }
          let tags = [];
          for (let tag of post.tags) {
            var tagObject = new FormData();
            tagObject.append("name", tag);
            await axios
              .get(`${URL}/wordpress/wp-json/wp/v2/tags?search=${tag}`)
              .then(async (tg) => {
                if (tg.data.length > 0) {
                  tags.push(tg.data[0].id);
                } else {
                  await axios({
                    url: `${URL}/wordpress/wp-json/wp/v2/tags`,
                    method: "POST",
                    headers: {
                      Authorization:
                        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvd29yZHByZXNzIiwiaWF0IjoxNjM4OTcxNjMzLCJuYmYiOjE2Mzg5NzE2MzMsImV4cCI6MTYzOTU3NjQzMywiZGF0YSI6eyJ1c2VyIjp7ImlkIjoiMSJ9fX0.IoNyxtMZct3JlBAiP3qX9PcVWtrOuDrlEeZnzZCYryI",
                      ...tagObject.getHeaders(),
                    },
                    data: tagObject,
                  }).then((resTag) => {
                    tags.push(resTag.data.id);
                  });
                }
              });
          }
          await axios({
            url: `${URL}/wordpress/wp-json/wp/v2/media`,
            method: "POST",
            headers: {
              "Cache-Control": "no-cache",
              "Content-Disposition": contentDisposition(file),
              "Content-Type": "multipart/form-data",
              Authorization:
                "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvd29yZHByZXNzIiwiaWF0IjoxNjM4OTcxNjMzLCJuYmYiOjE2Mzg5NzE2MzMsImV4cCI6MTYzOTU3NjQzMywiZGF0YSI6eyJ1c2VyIjp7ImlkIjoiMSJ9fX0.IoNyxtMZct3JlBAiP3qX9PcVWtrOuDrlEeZnzZCYryI",
            },
            data: fs.createReadStream(`${__dirname}/files/${file}`),
          })
            .then(async (response) => {
              var bodyFormData = new FormData();
              bodyFormData.append("date", dNow.toISOString().split(".")[0]);
              bodyFormData.append("date_gmt", dNow.toISOString().split(".")[0]);
              bodyFormData.append("status", "private");
              bodyFormData.append("comment_status", "closed");
              bodyFormData.append("ping_status", "closed");
              bodyFormData.append("alt_text", file);
              var config = {
                method: "POST",
                url: `${URL}/wordpress/wp-json/wp/v2/media/${response.data.id}`,
                headers: {
                  Authorization:
                    "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvd29yZHByZXNzIiwiaWF0IjoxNjM4OTcxNjMzLCJuYmYiOjE2Mzg5NzE2MzMsImV4cCI6MTYzOTU3NjQzMywiZGF0YSI6eyJ1c2VyIjp7ImlkIjoiMSJ9fX0.IoNyxtMZct3JlBAiP3qX9PcVWtrOuDrlEeZnzZCYryI",
                  ...bodyFormData.getHeaders(),
                },
                data: bodyFormData,
              };

              await axios(config)
                .then(async (media) => {
                  console.log("featured media id", response.data.id, count);
                  let postObject = {
                    date: dNow,
                    date_gmt: dNow,
                    status: "private",
                    title: post.title,
                    content: post.summary,
                    featured_media: response.data.id,
                    comment_status: "closed",
                    ping_status: "closed",
                    format: "standard",
                    categories: categories,
                    tags: tags,
                    link: post.link,
                  };
                  await axios({
                    url: `${URL}/wordpress/wp-json/wp/v2/posts`,
                    method: "POST",
                    headers: {
                      Authorization:
                        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvd29yZHByZXNzIiwiaWF0IjoxNjM4OTcxNjMzLCJuYmYiOjE2Mzg5NzE2MzMsImV4cCI6MTYzOTU3NjQzMywiZGF0YSI6eyJ1c2VyIjp7ImlkIjoiMSJ9fX0.IoNyxtMZct3JlBAiP3qX9PcVWtrOuDrlEeZnzZCYryI",
                    },
                    data: postObject,
                  })
                    .then((resp) => {
                      console.log("post id", resp.data.id);
                      // res.json(postObject);
                      postedPosts.push(resp.data);
                    })
                    .catch((err) => console.log("post error", err));
                })
                .catch(function (error) {
                  console.log(error);
                });
            })
            .catch((error) => console.log("error", error));
        }
      })
      .catch((error) => {
        console.log("unauthorised", error);
      });
    count = count + 1;
  }
  res.json(postedPosts);
};

const fetchPostFromURL = async (req, res, next) => {
  let { url } = req.body;
  if (url.charAt(url.length - 1) === "/") {
    url = url.substring(0, url.length - 1);
  }
  let parts = urlParser(url);
  await axios
    .get(`${parts.origin}/wp-json/wp/v2`)
    .then(async (response) => {
      if (response.data.namespace) {
        let slugs = parts.pathname.split("/");
        let slug = slugs[slugs.length - 1];
        await axios
          .get(`${parts.origin}/wp-json/wp/v2/posts?slug=${encodeURI(slug)}`)
          .then(async (result) => {
            await axios
              .get(
                `${parts.origin}/wp-json/wp/v2/media/${result.data[0].featured_media}`
              )
              .then(async (featured_media) => {
                console.log(
                  "featured_media",
                  featured_media.data.guid.rendered
                );
                let length =
                  featured_media.data.guid.rendered.split("/").length;
                let file =
                  featured_media.data.guid.rendered.split("/")[length - 1];
                let options = {
                  url: featured_media.data.guid.rendered,
                  dest: `${__dirname}/files/${file}`,
                };
                await download
                  .image(options)
                  .then(({ filename }) => {
                    console.log("Saved to", filename);
                  })
                  .catch((err) => console.error("image", err));
                await axios({
                  url: `http://localhost:8888/vrizm/wp-json/wp/v2/media`,
                  method: "POST",
                  headers: {
                    "Cache-Control": "no-cache",
                    "Content-Disposition": contentDisposition(file),
                    "Content-Type": "multipart/form-data",
                    Authorization:
                      "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2MzkwNDI5MzYsIm5iZiI6MTYzOTA0MjkzNiwiZXhwIjoxNjM5NjQ3NzM2LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.MQem8qWkMTAOhoaqtcWMdtC2hz8OSO5xBxiju-NeNuY",
                  },
                  data: fs.createReadStream(`${__dirname}/files/${file}`),
                }).then(async (media) => {
                  var bodyFormData = new FormData();
                  // bodyFormData.append("date", dNow.toISOString().split(".")[0]);
                  // bodyFormData.append(
                  //   "date_gmt",
                  //   dNow.toISOString().split(".")[0]
                  // );
                  bodyFormData.append("status", "private");
                  bodyFormData.append("comment_status", "closed");
                  bodyFormData.append("ping_status", "closed");
                  bodyFormData.append("alt_text", file);
                  var config = {
                    method: "POST",
                    url: `http://localhost:8888/vrizm/wp-json/wp/v2/media/${media.data.id}`,
                    headers: {
                      Authorization:
                        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2MzkwNDI5MzYsIm5iZiI6MTYzOTA0MjkzNiwiZXhwIjoxNjM5NjQ3NzM2LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.MQem8qWkMTAOhoaqtcWMdtC2hz8OSO5xBxiju-NeNuY",
                      ...bodyFormData.getHeaders(),
                    },
                    data: bodyFormData,
                  };

                  await axios(config).then(async (media1) => {});

                  let promises = [];
                  let promiseTags = [];
                  for (let c of result.data[0].categories) {
                    promises.push(
                      await categoryFn(c, `${parts.origin}/wp-json/wp/v2/`)
                    );
                  }
                  for (let t of result.data[0].tags) {
                    promiseTags.push(
                      await tagsFn(t, `${parts.origin}/wp-json/wp/v2/`)
                    );
                  }
                  Promise.all([promises, promiseTags]).then(
                    async (categories) => {
                      let categoryIDs = [];
                      let tagIDs = [];
                      await axios({
                        url: `http://localhost:8888/vrizm/wp-json/wp/v2/posts?status=[private]&slug=${encodeURI(
                          slug
                        )}`,
                        method: "GET",
                        headers: {
                          Authorization:
                            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2MzkwNDI5MzYsIm5iZiI6MTYzOTA0MjkzNiwiZXhwIjoxNjM5NjQ3NzM2LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.MQem8qWkMTAOhoaqtcWMdtC2hz8OSO5xBxiju-NeNuY",
                        },
                      }).then(async (alreadyPosted) => {
                        if (alreadyPosted.data.length > 0) {
                          res.json("Post is already posted");
                        } else {
                          for (let cat of categories[0]) {
                            await axios({
                              url: `http://localhost:8888/vrizm/wp-json/wp/v2/categories?search=${cat}`,
                              method: `GET`,
                              headers: {
                                Authorization:
                                  "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2MzkwNDI5MzYsIm5iZiI6MTYzOTA0MjkzNiwiZXhwIjoxNjM5NjQ3NzM2LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.MQem8qWkMTAOhoaqtcWMdtC2hz8OSO5xBxiju-NeNuY",
                              },
                            }).then(async (category) => {
                              if (category.data.length > 0) {
                                categoryIDs.push(category.data[0].id);
                              } else {
                                var categoryFormData = new FormData();
                                categoryFormData.append("name", cat);
                                await axios({
                                  url: `http://localhost:8888/vrizm/wp-json/wp/v2/categories`,
                                  method: `POST`,
                                  headers: {
                                    Authorization:
                                      "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2MzkwNDI5MzYsIm5iZiI6MTYzOTA0MjkzNiwiZXhwIjoxNjM5NjQ3NzM2LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.MQem8qWkMTAOhoaqtcWMdtC2hz8OSO5xBxiju-NeNuY",
                                    ...categoryFormData.getHeaders(),
                                  },
                                  data: categoryFormData,
                                })
                                  .then((resCategory) => {
                                    categoryIDs.push(resCategory.data.id);
                                  })
                                  .catch((error) => {
                                    // res.json(`can't add new category`);
                                    console.log(error);
                                  });
                              }
                            });
                          }
                          for (let tg of categories[1]) {
                            await axios({
                              url: `http://localhost:8888/vrizm/wp-json/wp/v2/tags?search=${tg}`,
                              method: `GET`,
                              headers: {
                                Authorization:
                                  "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2MzkwNDI5MzYsIm5iZiI6MTYzOTA0MjkzNiwiZXhwIjoxNjM5NjQ3NzM2LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.MQem8qWkMTAOhoaqtcWMdtC2hz8OSO5xBxiju-NeNuY",
                              },
                            }).then(async (tag) => {
                              if (tag.data.length > 0) {
                                tagIDs.push(tag.data[0].id);
                              } else {
                                var tagObject = new FormData();
                                tagObject.append("name", tg);
                                await axios({
                                  url: `http://localhost:8888/vrizm/wp-json/wp/v2/tags`,
                                  method: `POST`,
                                  headers: {
                                    Authorization:
                                      "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2MzkwNDI5MzYsIm5iZiI6MTYzOTA0MjkzNiwiZXhwIjoxNjM5NjQ3NzM2LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.MQem8qWkMTAOhoaqtcWMdtC2hz8OSO5xBxiju-NeNuY",
                                    ...tagObject.getHeaders(),
                                  },
                                  data: tagObject,
                                })
                                  .then((resTag) => {
                                    tagIDs.push(resTag.data.id);
                                  })
                                  .catch((error) => {
                                    // res.json(`can't add new category`);
                                    console.log(error);
                                  });
                              }
                            });
                          }
                          let doc = await new DOMParser().parseFromString(
                            result.data[0].content.rendered,
                            "text/html"
                          );
                          let summaryArray = "";
                          var selector, i;
                          if (doc.querySelectorAll) {
                            selector = doc.querySelectorAll("p");
                            for (i = 0; i < selector.length; i++) {
                              summaryArray = summaryArray.concat(
                                selector[i].textContent
                              );
                            }
                          }
                          var resp = await deepai.callStandardApi(
                            "summarization",
                            {
                              text: summaryArray,
                            }
                          );
                          let c = resp.output.match("\n");
                          while (c) {
                            resp.output = resp.output.replace("\n", " ");
                            c = resp.output.match("\n");
                          }
                          let finalString = resp.output;
                          if (finalString === "") {
                            finalString = summaryArray;
                          }
                          let postObject = {
                            // date: dNow,
                            // date_gmt: dNow,
                            status: "private",
                            title: result.data[0].title.rendered,
                            content: finalString,
                            featured_media: media.data.id,
                            comment_status: "closed",
                            ping_status: "closed",
                            format: "standard",
                            categories: categoryIDs,
                            tags: tagIDs,
                            meta_box: { link: url },
                          };
                          await axios({
                            url: `http://localhost:8888/vrizm/wp-json/wp/v2/posts`,
                            method: "POST",
                            headers: {
                              Authorization:
                                "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2MzkwNDI5MzYsIm5iZiI6MTYzOTA0MjkzNiwiZXhwIjoxNjM5NjQ3NzM2LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.MQem8qWkMTAOhoaqtcWMdtC2hz8OSO5xBxiju-NeNuY",
                            },
                            data: postObject,
                          })
                            .then((resp) => {
                              console.log("post id", resp.data.id);
                              res.json(resp.data);
                            })
                            .catch((err) => console.log("post error"));
                        }
                      });
                    }
                  );
                });
              })
              .catch((error) => {
                res.json("can't download featured media");
              });
          });
      } else {
        res.json("can't fetch data from this url");
      }
    })
    .catch((error) => {
      console.log("error", error);
    });
  // console.log(parts);
};

const postTweets = async (req, res, next) => {
  const {hashtag} = req.body;
  let mediaFn = (media_keys, media) => {
    return new Promise((resolve) => {
      let images = [];
      for (let m of media_keys) {
        let temp = media.find((x) => x.media_key === m);
        if (temp) {
          images.push({
            mediaKey: temp.media_key,
            imageURL: temp.url,
            mediaType: temp.type,
          });
        }
      }
      resolve(images);
    });
  };
  let usersFn = (userID, authors)=>{
    return new  Promise((resolve)=>{
      let temp = authors.find((x)=>x.id === userID);
      if(temp){
        resolve(temp);
      }else {
        resolve({})
      }
    })
  }
  await axios({
    url: `https://api.twitter.com/2/tweets/search/recent?query=%23${hashtag}&max_results=100&expansions=attachments.media_keys,author_id&media.fields=preview_image_url,url&user.fields=created_at,username,description,profile_image_url,entities`,
    method: "GET",
    headers: {
      Authorization:
        "Bearer AAAAAAAAAAAAAAAAAAAAAP%2B%2BWgEAAAAAqixDURtlI7ZZiiX2jM8nqhJMsWA%3DOGT4cA4MFrJjz6WjwyDwZ8dwNtEfBdN8Bn3C9BF0j05g0U9BeH",
    },
  }).then(async (response) => {
    for (let tweet of response.data.data) {
      let promises = [];
      let userPromises = [];
      if (tweet.attachments) {
        promises.push(
          await mediaFn(
            tweet.attachments.media_keys,
            response.data.includes.media
          )
        );
      }
      if(tweet.author_id){
        userPromises.push(await usersFn(tweet.author_id, response.data.includes.users))
      }
      Promise.all([promises,userPromises]).then(async (media) => {
        let t = new Tweet({
          tweetID: tweet.id,
          text: tweet.text,
          media: media[0],
          tweetTimeStamp: tweet.created_at,
          userID: tweet.author_id,
          username: media[1][0].username,
          profileImageUrl: media[1][0].profile_image_url,
          userDescription: media[1][0].description,
          authorName: media[1][0].name
        });
        await t.save();
      });
    }
    res.json(response.data);
  });
};

const postURL = async (req, res, next) => {
  let count = 1;
  let updatedPosts = [];
  for (let i = 1; i < 138; i++) {
    await axios({
      url: `http://localhost:8888/wordpress/wp-json/wp/v2/posts?status=[private]&page=${i}&per_page=100`,
      method: `GET`,
      headers: {
        Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvd29yZHByZXNzIiwiaWF0IjoxNjM5MTEzMDM3LCJuYmYiOjE2MzkxMTMwMzcsImV4cCI6MTYzOTcxNzgzNywiZGF0YSI6eyJ1c2VyIjp7ImlkIjoiMSJ9fX0.7YbhszhAboA4SdorIvxbEZSQftzabctgorfggEKaA2Y`,
      },
    }).then(async (response) => {
      for (let post of response.data) {
        let mongoPost = await Post.findOne({
          title: post.title.rendered.substring(9),
        });
        if (mongoPost) {
          await axios({
            url: `http://localhost:8888/wordpress/wp-json/wp/v2/posts/${post.id}`,
            method: `POST`,
            headers: {
              Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvd29yZHByZXNzIiwiaWF0IjoxNjM5MTEzMDM3LCJuYmYiOjE2MzkxMTMwMzcsImV4cCI6MTYzOTcxNzgzNywiZGF0YSI6eyJ1c2VyIjp7ImlkIjoiMSJ9fX0.7YbhszhAboA4SdorIvxbEZSQftzabctgorfggEKaA2Y`,
            },
            data: { meta_box: { link: mongoPost.link } },
          }).then((result) => {
            console.log("count", count, mongoPost.link);
            count = count + 1;
            updatedPosts.push(result.data);
          });
        } else {
          updatedPosts.push(post);
        }
      }
    });
  }
  res.json("update links");
};

const storeProducts = async (req, res, next) => {
  function parseResponse(itemsResponseList) {
    var mappedResponse = {};
    for (var i in itemsResponseList) {
      if (itemsResponseList.hasOwnProperty(i)) {
        mappedResponse[itemsResponseList[i]["ASIN"]] = itemsResponseList[i];
      }
    }
    return mappedResponse;
  }
  var defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;

  defaultClient.accessKey = "AKIAIAQ3KNV6AYCFRWCA";
  defaultClient.secretKey = "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";
  defaultClient.host = "webservices.amazon.com";
  defaultClient.region = "us-east-1";

  var api = new ProductAdvertisingAPIv1.DefaultApi();
  var getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest();

  getItemsRequest["PartnerTag"] = "igeek0f-20";
  getItemsRequest["PartnerType"] = "Associates";
  getItemsRequest["ItemIds"] = req.body.ASINs;
  getItemsRequest["Condition"] = "New";
  getItemsRequest["Resources"] = [
    "BrowseNodeInfo.BrowseNodes",
    "BrowseNodeInfo.BrowseNodes.Ancestor",
    "BrowseNodeInfo.BrowseNodes.SalesRank",
    "BrowseNodeInfo.WebsiteSalesRank",
    "Images.Primary.Small",
    "Images.Primary.Medium",
    "Images.Primary.Large",
    "Images.Variants.Small",
    "Images.Variants.Medium",
    "Images.Variants.Large",
    "ItemInfo.ByLineInfo",
    "ItemInfo.Classifications",
    "ItemInfo.ContentInfo",
    "ItemInfo.ContentRating",
    "ItemInfo.ExternalIds",
    "ItemInfo.Features",
    "ItemInfo.ManufactureInfo",
    "ItemInfo.ProductInfo",
    "ItemInfo.TechnicalInfo",
    "ItemInfo.Title",
    "ItemInfo.TradeInInfo",
    "Offers.Listings.Availability.MaxOrderQuantity",
    "Offers.Listings.Availability.Message",
    "Offers.Listings.Availability.MinOrderQuantity",
    "Offers.Listings.Availability.Type",
    "Offers.Listings.Condition",
    "Offers.Listings.Condition.ConditionNote",
    "Offers.Listings.Condition.SubCondition",
    "Offers.Listings.DeliveryInfo.IsAmazonFulfilled",
    "Offers.Listings.DeliveryInfo.IsFreeShippingEligible",
    "Offers.Listings.DeliveryInfo.IsPrimeEligible",
    "Offers.Listings.IsBuyBoxWinner",
    "Offers.Listings.LoyaltyPoints.Points",
    "Offers.Listings.MerchantInfo",
    "Offers.Listings.Price",
    "Offers.Listings.ProgramEligibility.IsPrimeExclusive",
    "Offers.Listings.ProgramEligibility.IsPrimePantry",
    "Offers.Listings.Promotions",
    "Offers.Listings.SavingBasis",
    "Offers.Summaries.HighestPrice",
    "Offers.Summaries.LowestPrice",
    "Offers.Summaries.OfferCount",
    "ParentASIN",
  ];

  var callback = async function (error, data, response) {
    if (error) {
      console.log("Error calling PA-API 5.0!");
      console.log(
        "Printing Full Error Object:\n" + JSON.stringify(error, null, 1)
      );
      console.log("Status Code: " + error["status"]);
      if (
        error["response"] !== undefined &&
        error["response"]["text"] !== undefined
      ) {
        console.log(
          "Error Object: " + JSON.stringify(error["response"]["text"], null, 1)
        );
      }
    } else {
      console.log("API called successfully.");
      var getItemsResponse =
        ProductAdvertisingAPIv1.GetItemsResponse.constructFromObject(data);
      if (getItemsResponse["ItemsResult"] !== undefined) {
        var response_list = parseResponse(
          getItemsResponse["ItemsResult"]["Items"]
        );
        for (var i in getItemsRequest["ItemIds"]) {
          if (getItemsRequest["ItemIds"].hasOwnProperty(i)) {
            var itemId = getItemsRequest["ItemIds"][i];
            console.log(
              "\nPrinting information about the Item with Id: " + itemId
            );
            if (itemId in response_list) {
              var item = response_list[itemId];
              let product = {};
              if (item !== undefined) {
                if (item["ASIN"] !== undefined) {
                  product.ASIN = item["ASIN"];
                }
                if (item["DetailPageURL"] !== undefined) {
                  product.DetailPageURL = item["DetailPageURL"];
                }
                if (item["BrowseNodeInfo"] !== undefined) {
                  product.BrowseNodeInfo = item["BrowseNodeInfo"];
                }
                if (item["Images"] !== undefined) {
                  product.Images = item["Images"];
                }
                if (item["ItemInfo"] !== undefined) {
                  product.ItemInfo = item["ItemInfo"];
                }
                if (item["Offers"] !== undefined) {
                  product.Offers = item["Offers"];
                }
                if (item["ParentASIN"] !== undefined) {
                  product.Offers = item["ParentASIN"];
                }
              }
              let productStore = new ProductStore({
                ASIN: product.ASIN,
                BrowseNodeInfo: product.BrowseNodeInfo,
                DetailPageURL: product.DetailPageURL,
                Images: product.Images,
                ItemInfo: product.ItemInfo,
                Offers: product.Offers,
                ParentASIN: product.ParentASIN,
              });
              await productStore.save();
            } else {
              console.log("Item not found, check errors");
            }
          }
        }
        res.json(response_list);
      }
      if (getItemsResponse["Errors"] !== undefined) {
        console.log("Errors:");
        console.log(
          "Complete Error Response: " +
            JSON.stringify(getItemsResponse["Errors"], null, 1)
        );
        console.log("Printing 1st Error:");
        var error_0 = getItemsResponse["Errors"][0];
        console.log("Error Code: " + error_0["Code"]);
        console.log("Error Message: " + error_0["Message"]);
      }
    }
  };

  try {
    api.getItems(getItemsRequest, callback);
  } catch (ex) {
    console.log("Exception: " + ex);
  }
};

const recentPosts = async (req, res, next) => {
  let categoryFunc = (cats, media) => {
    return new Promise((resolve) => {
      axios
        .get(`${media}categories/${cats}`)
        .then(async (cat) => {
          let cate = await Category.findOne({ categoryID: cats });
          if (!cate) {
            let category = new Category({
              categoryID: cats,
              name: cat.data.name,
            });
            await category.save();
            resolve(cat.data.name);
          } else {
            resolve(cat.data.name);
          }
        })
        .catch((error) => {
          resolve("");
        });
    });
  };
  let tagFunc = (tag, media) => {
    return new Promise((resolve) => {
      axios
        .get(`${media}tags/${tag}`)
        .then(async (tg) => {
          let t = await Tag.findOne({ tagID: tag });
          if (!t) {
            let ta = new Tag({
              tagID: tag,
              name: tg.data.name,
            });
            await ta.save();
            resolve(tg.data.name);
          } else {
            resolve(tg.data.name);
          }
        })
        .catch((error) => {
          resolve("");
        });
    });
  };

  let websites = await Website.find({ _id: "619f3da8aa7a22d6257ef61c" });
  for (let website of websites) {
    let postedDates = [];
    let posts = await Post.find({ websiteID: website._id })
      .sort([["postedDate", -1]])
      .exec();
    let post = posts[0];
    let flag = true;
    let x = 1;
    do {
      console.log(flag);
      let url = website.website.includes("?")
        ? `${website.website}&page=${x}&per_page=100`
        : `${website.website}?page=${x}&per_page=100`;
      await axios
        .get(`${url}&filter[orderby]=date&order=desc`)
        .then(async (response) => {
          if (response.data.length > 0) {
            for (let blog of response.data) {
              if (
                blog.date.split("T")[0] ===
                post.postedDate.toISOString().split("T")[0]
              ) {
                flag = false;
                console.log("New Blogs Posted");
                // res.json("");
              } else {
                let doc = await new DOMParser().parseFromString(
                  blog.content.rendered,
                  "text/html"
                );
                let summaryArray = "";
                var selector, i;
                if (doc.querySelectorAll) {
                  selector = doc.querySelectorAll("p");
                  for (i = 0; i < selector.length; i++) {
                    summaryArray = summaryArray.concat(selector[i].textContent);
                  }
                }
                var resp = await deepai.callStandardApi("summarization", {
                  text: summaryArray,
                });
                // let resp = {
                //   output: `For this reason, it is becoming more difficult for businesses and the public to decide on suitable technology for their purposes and to understand the strengths and limitations of each, especially with each technology constantly evolving.In this article, we will explore seven XR trends that have been taking shape over the past year to be the top trends in not only 2022, but within the long-term future of AR, VR and MR.With AR reaching a stage of relative maturity in both device reach and development tools, there are still many areas that AR is continuing to improve to make it more useful. All forms of VR are experimenting with gesture-based and wireless technology and we will, over the coming years, see which form of the technology the public adopts and in which use cases specialist requirements manifest themselves.With one of the principal avenues for the latest hardware deployments being tradeshows and conferences alongside the changes, the COVID-19 pandemic has introduced to society, gesture technology and hologram technology have seen an unanticipated boost in development with the desire for contactless interactive experiences being greater than ever.All XR platforms are seeing more gesture-based interaction introduced, such as Ultraleap, as well as more wireless technology integration, such as HTC’s wireless adapter for their VR headsets, and you can expect this trend to continue over the next few years as we will see fewer wires, controllers and physical limitations.Another term fairly new to this growing tech space is the ‘metaverse’, the promise of a connected digital space where realities overlap. But what does it really take for it to all work, and for us to get to that point?We have OpenXR from Khronos Group, a common standard for virtual reality and augmented reality applications to support any suitable hardware, however, this solution is still in its infancy and has not yet become the default target for AR/VR apps.Friction in using VR/AR needs to be reduced, users need to be educated on how to scan and detect surfaces in their physical space to orient themselves, and controller layouts need to be learned.`,
                // };
                let c = resp.output.match("\n");
                while (c) {
                  resp.output = resp.output.replace("\n", " ");
                  c = resp.output.match("\n");
                }
                let finalString = resp.output;
                let api = website.website.includes("?")
                  ? website.website.split("?")[0]
                  : website.website;
                let media = api.substring(0, api.length - 5);
                await axios
                  .get(`${media}media/${blog.featured_media}`)
                  .then(async (featured_media) => {
                    let promises = [];
                    let promisesTags = [];
                    for (let c of blog.categories) {
                      promises.push(await categoryFunc(c, media));
                    }
                    for (let t of blog.tags) {
                      promisesTags.push(await tagFunc(t, media));
                    }
                    Promise.all([promises, promisesTags]).then(
                      async (categories) => {
                        let oldPost = await Post.findOne({
                          title: blog.title.rendered,
                          link: blog.link,
                        });
                        let newPost = new Post({
                          link: blog.link,
                          postedDate: blog.date,
                          content: blog.content.rendered,
                          title: blog.title.rendered,
                          summary: finalString,
                          websiteID: website._id,
                          featured_media: featured_media.data.guid.rendered,
                          categories: categories[0],
                          tags: categories[1],
                        });
                        if (!oldPost) {
                          await newPost.save(async (err, post1) => {
                            // console.log("post1", post1)
                            await axios({
                              url: `http://localhost:8888/vrizm/wp-json/wp/v2/posts?status=[private]&search=${encodeURI(
                                post1.title
                              )}`,
                              method: "GET",
                              headers: {
                                Authorization:
                                  "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2Mzk1NjYxNjEsIm5iZiI6MTYzOTU2NjE2MSwiZXhwIjoxNjQwMTcwOTYxLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.coFYL7roGSEdae64pZwSHq7v1uExG4mp3Lro8Ksg5SU",
                              },
                            }).then(async (alreadyPosted) => {
                              if (alreadyPosted.data.length > 0) {
                                console.log("already added post");
                                // postedPosts.push(post);
                              } else {
                                let length =
                                  post1.featured_media.split("/").length;
                                let file =
                                  post1.featured_media.split("/")[length - 1];
                                let dNow = new Date(
                                  post1.postedDate.getTime() + 5 * 60000
                                );
                                options = {
                                  url: post1.featured_media,
                                  dest: `${__dirname}/files/${file}`,
                                };
                                await download
                                  .image(options)
                                  .then(({ filename }) => {
                                    console.log("Saved to", filename);
                                  })
                                  .catch((err) => console.error("image", err));
                                let postCategories = [];
                                for (let category of post1.categories) {
                                  var categoryFormData = new FormData();
                                  categoryFormData.append("name", category);
                                  await axios
                                    .get(
                                      `http://localhost:8888/vrizm/wp-json/wp/v2/categories?search=${category}`
                                    )
                                    .then(async (cat) => {
                                      if (cat.data.length > 0) {
                                        postCategories.push(cat.data[0].id);
                                      } else {
                                        await axios({
                                          url: `http://localhost:8888/vrizm/wp-json/wp/v2/categories`,
                                          method: "POST",
                                          headers: {
                                            Authorization:
                                              "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2Mzk1NjYxNjEsIm5iZiI6MTYzOTU2NjE2MSwiZXhwIjoxNjQwMTcwOTYxLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.coFYL7roGSEdae64pZwSHq7v1uExG4mp3Lro8Ksg5SU",
                                            ...categoryFormData.getHeaders(),
                                          },
                                          data: categoryFormData,
                                        })
                                          .then((resCategory) => {
                                            postCategories.push(
                                              resCategory.data.id
                                            );
                                          })
                                          .catch((error) => {
                                            console.log(error);
                                          });
                                      }
                                    });
                                }
                                let postTags = [];
                                for (let tag of post1.tags) {
                                  var tagObject = new FormData();
                                  tagObject.append("name", tag);
                                  await axios
                                    .get(
                                      `http://localhost:8888/vrizm/wp-json/wp/v2/tags?search=${tag}`
                                    )
                                    .then(async (tg) => {
                                      if (tg.data.length > 0) {
                                        postTags.push(tg.data[0].id);
                                      } else {
                                        await axios({
                                          url: `http://localhost:8888/vrizm/wp-json/wp/v2/tags`,
                                          method: "POST",
                                          headers: {
                                            Authorization:
                                              "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2Mzk1NjYxNjEsIm5iZiI6MTYzOTU2NjE2MSwiZXhwIjoxNjQwMTcwOTYxLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.coFYL7roGSEdae64pZwSHq7v1uExG4mp3Lro8Ksg5SU",
                                            ...tagObject.getHeaders(),
                                          },
                                          data: tagObject,
                                        }).then((resTag) => {
                                          postTags.push(resTag.data.id);
                                        });
                                      }
                                    });
                                }
                                await axios({
                                  url: `http://localhost:8888/vrizm/wp-json/wp/v2/media`,
                                  method: "POST",
                                  headers: {
                                    "Cache-Control": "no-cache",
                                    "Content-Disposition":
                                      contentDisposition(file),
                                    "Content-Type": "multipart/form-data",
                                    Authorization:
                                      "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2Mzk1NjYxNjEsIm5iZiI6MTYzOTU2NjE2MSwiZXhwIjoxNjQwMTcwOTYxLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.coFYL7roGSEdae64pZwSHq7v1uExG4mp3Lro8Ksg5SU",
                                  },
                                  data: fs.createReadStream(
                                    `${__dirname}/files/${file}`
                                  ),
                                })
                                  .then(async (response) => {
                                    var bodyFormData = new FormData();
                                    bodyFormData.append(
                                      "date",
                                      dNow.toISOString().split(".")[0]
                                    );
                                    bodyFormData.append(
                                      "date_gmt",
                                      dNow.toISOString().split(".")[0]
                                    );
                                    bodyFormData.append("status", "private");
                                    bodyFormData.append(
                                      "comment_status",
                                      "closed"
                                    );
                                    bodyFormData.append(
                                      "ping_status",
                                      "closed"
                                    );
                                    bodyFormData.append("alt_text", file);
                                    var config = {
                                      method: "POST",
                                      url: `http://localhost:8888/vrizm/wp-json/wp/v2/media/${response.data.id}`,
                                      headers: {
                                        Authorization:
                                          "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2Mzk1NjYxNjEsIm5iZiI6MTYzOTU2NjE2MSwiZXhwIjoxNjQwMTcwOTYxLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.coFYL7roGSEdae64pZwSHq7v1uExG4mp3Lro8Ksg5SU",
                                        ...bodyFormData.getHeaders(),
                                      },
                                      data: bodyFormData,
                                    };
                                    await axios(config)
                                      .then(async (media) => {
                                        console.log(
                                          "featured media id",
                                          response.data.id
                                        );
                                        let postObject = {
                                          date: dNow,
                                          date_gmt: dNow,
                                          status: "private",
                                          title: post1.title,
                                          content: post1.summary,
                                          featured_media: response.data.id,
                                          comment_status: "closed",
                                          ping_status: "closed",
                                          format: "standard",
                                          categories: postCategories,
                                          tags: postTags,
                                          link: post1.link,
                                        };
                                        await axios({
                                          url: `http://localhost:8888/vrizm/wp-json/wp/v2/posts`,
                                          method: "POST",
                                          headers: {
                                            Authorization:
                                              "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb2NhbGhvc3Q6ODg4OFwvdnJpem0iLCJpYXQiOjE2Mzk1NjYxNjEsIm5iZiI6MTYzOTU2NjE2MSwiZXhwIjoxNjQwMTcwOTYxLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.coFYL7roGSEdae64pZwSHq7v1uExG4mp3Lro8Ksg5SU",
                                          },
                                          data: postObject,
                                        })
                                          .then((resp) => {
                                            console.log(
                                              "post id",
                                              resp.data.id
                                            );
                                            // res.json(postObject);
                                            // postedPosts.push(resp.data);
                                          })
                                          .catch((err) =>
                                            console.log("post error", err)
                                          );
                                      })
                                      .catch(function (error) {
                                        console.log(error);
                                      });
                                  })
                                  .catch((error) =>
                                    console.log("error", error)
                                  );
                              }
                            });
                            postedDates.push(post1);
                          });
                        }
                      }
                    );
                  })
                  .catch(async (error) => {
                    console.log("media error", error);
                    if (Object.keys(error).length > 0) {
                      let promises = [];
                      let promisesTags = [];
                      for (let c of blog.categories) {
                        promises.push(await categoryFunc(c, media));
                      }
                      for (let t of blog.tags) {
                        promisesTags(await tagsFn(t, media));
                      }
                      Promise.all([promises, promisesTags]).then(
                        async (categories) => {
                          let oldPost = await Post.findOne({
                            title: blog.title.rendered,
                            link: blog.link,
                          });
                          let newPost = new Post({
                            link: blog.link,
                            postedDate: blog.date,
                            content: blog.content.rendered,
                            title: blog.title.rendered,
                            summary: finalString,
                            websiteID: website._id,
                            featured_media: "",
                            categories: categories[0],
                            tags: categories[1],
                          });
                          if (!oldPost) {
                            await newPost.save((err, post1) => {
                              // console.log("error post1", post1);
                              postedDates.push(post1);
                            });
                          }
                        }
                      );
                    } else {
                      flag = false;
                    }
                  });
              }
            }
          } else {
            res.json("Something went wrong");
          }
        })
        .catch((error) => {
          flag = false;
          res.json("Something went wrong", error);
        });
      x = x + 1;
    } while (flag);
    res.json(postedDates);
  }
};

module.exports = {
  insertPost,
  getPosts,
  postAppStoreData,
  postPlayStoreData,
  getAppStoreData,
  getPlayStoreData,
  searchPlayStore,
  searchAppStore,
  masterCategoriesFn,
  podcastFn,
  summaryFn,
  getSummaries,
  getCountOfBlogs,
  getCountOfBlogsInTags,
  mongoToWordpressFn,
  fetchPostFromURL,
  postTweets,
  postURL,
  storeProducts,
  recentPosts,
};
