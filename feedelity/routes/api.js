// Imports

var request = require('request'),
    FeedParser = require('feedparser'),
    async = require('async'),
    mongoose = require('mongoose'),
    conf = require('../config.json'),
    fs = require('fs'),
    crypto = require('crypto'),
    http = require('http'),
    https = require('https'),
    expressSession = require('express-session');











var genarateUniqueHash = function() {
    var hash = crypto.createHash('md5').update(new Date().toISOString()).digest('hex');
    console.log(hash)
    return hash;
}

// Security functions

exports.hasRights = function(req, res) {
    return req.password == conf.password;
}

// Mongoose functions

mongoose.connect('mongodb://localhost/feedelity');

var db = mongoose.connection;

var feedSchema = mongoose.Schema({
    name: String,
    url: String,
    lastChecked: Date,
    lastFetchedNb: Number,
    lastErrorNb: Number,
    lastOutdatedNb: Number,
    state: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
});

var userSchema = mongoose.Schema({
    id: String,
    firstName: String,
    lastName: String,
    url: String,
    username: String,
    access_token: String,
    email: String,
    gender: String,
    relationshipStatus: String,
    birthday: Date,
    mobileNumber: String,
    location: String,
    userFbLikes: [String],
    dp: String,
    status: Boolean
});

var adminUserSchema = mongoose.Schema({
    name: String,
    username: String,
    password: String,
    email: String,
    gender: String,
    mobileNumber: String,
    location: String,
    dp: String,
    status: Boolean
});

var articleSchema = mongoose.Schema({
    _feed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feed'
    }],
    guid: String,
    title: String,
    date: Date,
    summary: String,
    description: String,
    link: String,
    author: String,
    read: Boolean,
    starred: Boolean,
    imgUrl: String,
    likes: Number,
    dislikes: Number,
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    }
});

var tagSchema = mongoose.Schema({
    name: String,
    boostValue: String
});

var catSchema = mongoose.Schema({
    name: String,
    imgUrl: String
});

var locationSchema = mongoose.Schema({
    name: String
});

var likeSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    likes: [{
        article: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Article'
        },
        status: Boolean
    }]
});

var bookmarkSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    articles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article'
    }]
});




var preferredTagSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [{
        tag: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tag'
        },
        value: Number
    }]
});







Feed = mongoose.model('Feed', feedSchema);
Article = mongoose.model('Article', articleSchema);
Category = mongoose.model('Category', catSchema);
Tag = mongoose.model('Tag', tagSchema);
Local = mongoose.model('Location', locationSchema);
User = mongoose.model('User', userSchema);
AdminUser = mongoose.model('AdminUser', adminUserSchema);
Like = mongoose.model('Like', likeSchema);
Bookmark = mongoose.model('Bookmark', bookmarkSchema);
PreferredTag = mongoose.model('PreferredTag', preferredTagSchema);


// Login and Signup functions

// exports.testUserLogin = function(req, res) {

//     console.log(req.body)

//     var YOUR_APP_ID = '110406559309977',
//         YOUR_APP_SECRET = '95ce8ace2c4d35b132b7ad4a3411ddd6',
//         grant_type = 'client_credentials',
//         INPUT_TOKEN = req.body.access_token,
//         ACCESS_TOKEN = '',
//         debugResponse = '',
//         userData = req.body;


//     https.get("https://graph.facebook.com/oauth/access_token?client_id=" + YOUR_APP_ID + "&client_secret=" + YOUR_APP_SECRET + "&grant_type=" + grant_type, function(fb_1_res) {
//         fb_1_res.on("data", function(chunk) {
//             var textChunk = chunk + '';
//             if (textChunk.indexOf("access_token=") > -1) {
//                 ACCESS_TOKEN = textChunk.split("access_token=")[1]
//                 https.get("https://graph.facebook.com/debug_token?input_token=" + INPUT_TOKEN + "&access_token=" + ACCESS_TOKEN, function(fb_2_res) {
//                     fb_2_res.on("data", function(chunk) {
//                         debugResponse = JSON.parse(chunk + '');

//                         if (debugResponse.data) {
//                             // console.log(debugResponse);
//                             // console.log(req.body);


//                             if (YOUR_APP_ID == debugResponse.data.app_id && userData.id == debugResponse.data.user_id) {

//                                 res.status(200).send({
//                                     debugResponse: debugResponse,
//                                     userData: userData
//                                 });

//                             } else {

//                                 res.status(200).send({
//                                     error: 'invalid_details'
//                                 });
//                             };

//                         } else {
//                             res.status(200).send({
//                                 debugResponse: debugResponse
//                             });
//                         };

//                     });
//                 });
//             }
//         });



//     }).on('error', function(e) {
//         console.log("Got error: " + e.message);
//     });









// }





exports.userLogin = function(userData, callback) {


    var update = {
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        // url: userData.url,
        // username: userData.username,
        access_token: userData.access_token,
        email: userData.email,
        // gender: userData.gender,
        // relationshipStatus: userData.relationshipStatus,
        // birthday: new Date(userData.birthday),
        // mobileNumber: userData.mobileNumber,
        // location: userData.location,
        // userFbLikes: [userData.userFbLikes],
        // dp: userData.dp,
        status: true
    };


    User.findOneAndUpdate({
        email: userData.email
    }, update, {
        upsert: true
    }).exec().then(function(user) {
        callback(user);
    });

}





exports.adminLogin = function(userData) {

    AdminUser.findOne({
        email: userData.email
    }).exec().then(function(err, like) {
        if (err) {
            // Call Signup
            // loginForAdmin(userData);
            return ''
        } else {
            // Call Login
            // signupForAdmin(userData)
            return like.status;
        };
    });
}


function loginForAdmin(userData) {

}


// function signupForAdmin(userData) {

// }






//Like and Dislike functions

exports.likeArticle = function(req, res) {

    console.log('inside like')

    var current_username = req.user.userData._id;
    var current_article = req.params.id;

    Article.findOneAndUpdate({
        _id: current_article
    }, {
        $inc: {
            likes: 1
        }
    }).exec().then(function(article) {


        Like.findOne({
            user: current_username,
        }).lean().exec().then(function(like) {

            if (!!like) {


                if (like.likes.length < 1) {

                    console.log('testsw', like);
                    like.likes.push({
                        article: current_article,
                        status: true
                    });
                } else {
                    console.log('testsw2', like);
                    var likes = like.likes;
                    console.log(likes);
                    var mapedLikes = like.likes.map(function(likes) {
                        return likes.article + '';
                    });
                    console.log(mapedLikes);
                    console.log(current_article);
                    var pos = mapedLikes.indexOf(current_article);

                    console.log(pos);


                    if (pos > -1) {
                        if (likes[pos].status == true) {

                            likes.splice(pos, 1);
                            console.log('splice');
                        } else {
                            likes[pos].status = !likes[pos].status;
                        };

                    } else {
                        likes.push({
                            article: current_article,
                            status: true
                        });
                        console.log('push');
                    };
                };

                console.log(like);
                Like.findOneAndUpdate({
                    user: current_username
                }, {
                    likes: like.likes
                }, {
                    upsert: true
                }).exec().then(function(updatedlike) {

                    res.status(200).send(updatedlike);
                });

            } else {

                like = new Like({
                    user: current_username,
                    likes: [{
                        article: current_article,
                        status: true
                    }]
                });


                like.save(function(err) {
                    if (err) {
                        console.error('ERROR!');
                    }
                    res.status(200).send(like);
                });


            };



        });
    });
}

exports.dislikeArticle = function(req, res) {

    console.log('inside like')

    var current_username = req.user.userData._id;
    var current_article = req.params.id;

    Article.findOneAndUpdate({
        _id: current_article
    }, {
        $inc: {
            dislikes: 1
        }
    }).exec().then(function(article) {


        Like.findOne({
            user: current_username,
        }).lean().exec().then(function(like) {

            if (!!like) {


                if (like.likes.length < 1) {

                    console.log('testsw', like);
                    like.likes.push({
                        article: current_article,
                        status: false
                    });
                } else {
                    console.log('testsw2', like);
                    var likes = like.likes;
                    console.log(likes);
                    var mapedLikes = like.likes.map(function(likes) {
                        return likes.article + '';
                    });
                    console.log(mapedLikes);
                    console.log(current_article);
                    var pos = mapedLikes.indexOf(current_article);

                    console.log(pos);


                    if (pos > -1) {
                        if (likes[pos].status == false) {

                            likes.splice(pos, 1);
                            console.log('splice');
                        } else {
                            likes[pos].status = !likes[pos].status;
                        };

                    } else {
                        likes.push({
                            article: current_article,
                            status: false
                        });
                        console.log('push');
                    };
                };

                console.log(like);
                Like.findOneAndUpdate({
                    user: current_username
                }, {
                    likes: like.likes
                }, {
                    upsert: true
                }).exec().then(function(updatedlike) {

                    res.status(200).send(updatedlike);
                });

            } else {

                like = new Like({
                    user: current_username,
                    likes: [{
                        article: current_article,
                        status: false
                    }]
                });


                like.save(function(err) {
                    if (err) {
                        console.error('ERROR!');
                    }
                    res.status(200).send(like);
                });


            };



        });
    });

}




exports.likedArticles = function(req, res) {

    var current_username = req.user.userData._id;

    Like.find({
        user: current_username,
        'likes.status': true
    }).populate('article', 'name').exec().then(function(err, likes) {
        if (err) {
            res.status(200).send({
                error: 'error'
            })
        } else {
            res.status(200).send(likes);
        };
    });

}


exports.dislikedArticles = function(req, res) {

    var current_username = req.user.userData._id;

    Like.find({
        user: current_username,
        'likes.status': true
    }).populate('article', 'name').exec().then(function(err, likes) {
        if (err) {
            res.status(200).send({
                error: 'error'
            })
        } else {
            res.status(200).send(likes);
        };
    });

}











//Bookmark functions

exports.bookmarkArticle = function(req, res) {
    var current_username = req.user.userData._id;
    var current_article = req.params.id;

    var query = {
        user: current_username,
    };

    var update = {};

    Bookmark.findOne(query).exec().then(function(bookmark) {
        if (!!bookmark) {

            var pos = bookmark.articles.indexOf(current_article);

            if (pos > -1) {
                bookmark.articles.splice(pos, 1);
            } else {
                bookmark.articles.push(current_article);
            };

            update = {
                articles: bookmark.articles
            }

        } else {
            update = {
                articles: [current_article]
            }

        };

        var options = {
            upsert: true
        };

        Bookmark.findOneAndUpdate(query, update, options).exec().then(function(updated_bookmark) {
            res.status(200).send(updated_bookmark);
        });
    });
}





exports.bookmarkedArticles = function(req, res) {
    Bookmark.find({
        user: req.user.userData._id,
    }).populate('articles', 'name').exec().then(function(err, bookmarks) {
        if (err) {
            res.json({
                error: 'error'
            })
        } else {
            res.json(bookmarks)
        };
    });
}







// Feeds functions

exports.refreshFeeds = function(req, res) {
    Feed.find().exec().then(function(feeds) {
        async.map(feeds, refreshFeed, function(err, feeds) {
            if (conf.activePeriod != -1) {
                var now = new Date();
                var bound = new Date();
                bound.setMonth(bound.getMonth() - conf.activePeriod);
                Article.remove({
                    starred: false
                }).where('date').lt(bound).exec().then(function(nbArticles) {
                    res.json(feeds);
                });
            } else res.json(feeds);
        });
    });
}

exports.getFeed = function(req, res) {
    var id = req.params.id;
    var feed = Feed.findById(id).populate('location', 'name').populate('category', 'name').exec();
    feed.then(function(feed) {
        res.json(feed);
    });
}

exports.getFeeds = function(req, res) {
    Feed.find().populate('location', 'name').populate('category', 'name').exec().then(function(feeds) {
        res.json(feeds);
    });
}

exports.delFeed = function(req, res) {
    var id = req.params.id;
    Article.remove({
        _feed: id
    }).exec().then(function(articles) {
        Feed.remove({
            _id: id
        }).exec().then(function(feed) {
            res.status(200).send();
        });
    });
}

exports.addFeed = function(req, res) {
    var url = req.body.url;


    var categoryId = '';
    var locationId = '';

    // if (req.body.category.hasOwnProperty('_id')) {
    //     categoryId = req.body.category._id;
    // };

    // if (req.body.location.hasOwnProperty('_id')) {
    //     locationId = req.body.location._id;
    // };


    addFeed = new Feed({
        name: url,
        url: url,
        state: 'New',
        category: categoryId,
        location: locationId,
        lastFetched: 0,
        lastErrors: 0,
        lastOudated: 0
    });
    Feed.create(addFeed).then(function(addFeed) {
        res.status(200).send(addFeed);
    });
}

exports.updateFeed = function(req, res) {
    var query = {
        _id: req.body._id
    };

    var categoryId = '';
    var locationId = '';

    if (req.body.category.hasOwnProperty('_id')) {
        categoryId = req.body.category._id;
    };

    if (req.body.location.hasOwnProperty('_id')) {
        locationId = req.body.location._id;
    };

    var update = {
        name: req.body.name,
        url: req.body.url,
        category: categoryId,
        location: locationId,
    }
    Feed.findOneAndUpdate(query, update).exec().then(function(feed) {
        res.status(200).send(feed);
    });
}

function refreshFeed(feed, callBack) {
    var articles = [];
    var feedMeta;
    var errors = 0;
    var outdated = 0;
    var req = request(feed.url);
    var feedParser = new FeedParser();
    req.on('error', function(error) {
        callBack(error);
    });
    req.on('response', function(res) {
        var stream = this;
        if (res.statusCode != 200) callback(new Error('Bad status code'));
        stream.pipe(feedParser);
    });
    feedParser.on('error', function(error) {
        callBack(error);
    });
    feedParser.on('meta', function(meta) {
        feedMeta = this.meta;
    });
    feedParser.on('readable', function() {
        var stream = this;
        var item
        while (item = stream.read()) {
            var candidate = extractArticle(item, feed);
            if (checkValues(candidate)) {
                if (checkPeriod(candidate)) articles.push(candidate);
                else outdated++;
            } else errors++;
        }
    });
    feedParser.on('end', function() {
        var guids = articles.map(function(article) {
            return article.guid;
        });
        Article.find({
            _feed: feed._id
        }).where('guid').in(guids).exec().then(function(existingArticles) {
            var existingGuids = existingArticles.map(function(article) {
                return article.guid;
            });
            var newArticles = [];
            for (var i = 0; i < articles.length; i++) {
                var cur = articles[i];
                if (existingGuids.indexOf(cur.guid) == -1) newArticles.push(cur);
            }

            Article.create(newArticles, function(err) {
                var state = (errors > 0) ? 'Incomplete' : 'OK';
                var values = {
                    lastChecked: new Date(),
                    lastFetchedNb: newArticles.length,
                    lastErrorNb: errors,
                    lastOutdatedNb: outdated,
                    state: state,
                    likes: 0,
                    dislikes: 0
                };
                Feed.findOneAndUpdate({
                    _id: feed._id
                }, values).exec().then(function(feed) {
                    callBack(null, feed);
                });
            });
        });
    });
}

// Articles functions

exports.getUnreadArticles = function(req, res) {
    Article.find({
        read: false
    }).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').exec().then(function(articles) {
        articles.sort(compareArticles);
        res.json(articles);
    });
}

exports.getReadArticles = function(req, res) {
    Article.find({
        read: true
    }).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').skip(0).limit(10).exec().then(function(articles) {
        articles.sort(compareArticles);
        res.json(articles);
    });
}

exports.getStarredArticles = function(req, res) {
    Article.find({
        starred: true
    }).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').skip(0).limit(10).exec().then(function(articles) {
        articles.sort(compareArticles);
        res.json(articles);
    });
}

exports.getArticle = function(req, res) {
    var id = req.params.id;
    var article = Article.findById(id).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').exec();
    article.then(function(article) {
        res.json(article);
    });
}

exports.addArticle = function(req, res) {
    console.log('aad');
    var article = req.body;

    if (req.body.tags.length > 0) {
        var tagIds = req.body.tags.map(function(tag) {
            return tag._id;
        });
    };

    if (req.body.category) {
        if ('_id' in req.body.category) {
            categoryId = req.body.category._id;
        };
    };

    if (req.body.location) {
        if ('_id' in req.body.location) {
            locationId = req.body.location._id;
        };
    };


    addArticle = new Article({
        starred: false,
        read: false,
        name: req.body.name,
        title: req.body.title,
        summary: req.body.summary,
        date: Date.parse(req.body.date),
        tags: tagIds,
        imgUrl: req.body.imgUrl,
        category: categoryId,
        location: locationId,
        description: req.body.description,
        author: req.body.author,
        link: req.body.link,
        guid: req.body.guid,
        likes: 0,
        dislikes: 0
    });
    Article.create(addArticle).then(function(addArticle) {
        res.status(200).send(addArticle);
    });
}

// exports.updateArticle = function(req, res) {
//     var query = {
//         _id: req.body._id
//     };
//     var update = {
//         name: req.body.name,
//         title: req.body.title,
//         summary: req.body.summary,
//         description: req.body.description,
//         author: req.body.author,
//         link: req.body.link,
//         guid: req.body.guid,        
//     }
//     Feed.findOneAndUpdate(query, update).exec().then(function(feed) {
//         res.status(200).send(feed);
//     });
// }


exports.updateArticle = function(req, res) {

    var categoryId = '';
    var locationId = '';
    var tagIds = [];

    // console.log(req.body)

    var query = {
        _id: req.body._id
    };

    if (req.body.tags.length > 0) {
        tagIds = req.body.tags.map(function(tag) {
            return tag._id;
        });
    };

    if (req.body.category) {
        if ('_id' in req.body.category) {
            categoryId = req.body.category._id;
        } else {
            categoryId = '';
        };
    };

    if (req.body.location) {
        if ('_id' in req.body.location) {
            locationId = req.body.location._id;
        } else {
            locationId = '';
        };
    };


    // console.log(tagIds);

    var update = {
        starred: req.body.starred,
        read: req.body.read,
        name: req.body.name,
        title: req.body.title,
        summary: req.body.summary,
        date: Date.parse(req.body.date),
        tags: tagIds,
        imgUrl: req.body.imgUrl,
        category: categoryId,
        location: locationId,
        description: req.body.description,
        author: req.body.author,
        link: req.body.link,
        guid: req.body.guid,
    }
    Article.findOneAndUpdate(query, update).exec().then(function(article) {
        // console.log(article,update); 
        res.status(200).send(article);
    });
}

exports.delArticle = function(req, res) {
    var id = req.params.id;
    Article.remove({
        _id: id
    }).exec().then(function(article) {
        res.status(200).send();
    });
}

function checkValues(article) {
    if (article.date == undefined) return false;
    else if (article.title == undefined) return false;
    else if (article.link == undefined) return false;
    else return true;
}

function checkPeriod(article) {
    if (conf.activePeriod == -1) return true;
    else if (monthsDiff(article.date, new Date()) > conf.activePeriod) return false;
    else return true;
}

function compareArticles(a1, a2) {
    return new Date(a2.date).getTime() - new Date(a1.date).getTime();
}

function extractArticle(item, feed) {

    var categoryId = '';
    var locationId = '';


    if (feed.category != '') {
        categoryId = feed.category;
        console.log(feed.category)
    };

    if (feed.location != '') {
        locationId = feed.location;
        console.log(feed)

    };



    return new Article({
        title: item.title,
        summary: item.summary,
        description: item.description,
        author: item.author,
        date: Date.parse(item.date),
        link: item.link,
        guid: item.guid,
        category: categoryId,
        location: locationId,
        imgUrl: '',
        _feed: feed._id,
        read: false,
        starred: false
    });
}





exports.getCategoryArticles = function(req, res) {

    // console.log('catarticles');
    var reqCategory = req.params.cat;
    // var category = '';

    Category.findOne({
        name: reqCategory
    }, function(err, cat) {
        // console.log(cat);
        if (!!cat) {
            Article.find({
                read: true,
                category: cat._id
            }).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').lean().exec().then(function(articles) {

                articles.sort(compareArticles);




                Bookmark.findOne({
                    user: req.user.userData._id
                }).exec().then(function(bookmark) {



                    if (!!bookmark) {
                        // callback(bookmark.status);

                        for (var i = 0; i < articles.length; i++) {



                            console.log('yes bks', bookmark.articles.indexOf(articles[i]._id))

                            if (bookmark.articles.indexOf(articles[i]._id) > -1) {
                                articles[i]['bookmark'] = true;
                            } else {
                                articles[i]['bookmark'] = false;
                            };
                        };

                    } else {
                        for (var i = 0; i < articles.length; i++) {
                            articles[i].bookmark = false;
                        };
                    };

                    Like.findOne({
                        user: req.user.userData._id,
                    }).lean().exec().then(function(like) {
                        if (!!like) {
                            console.log('yes likes')
                            for (var i = 0; i < articles.length; i++) {
                                console.log(like)
                                for (var j = 0; j < like.likes.length; j++) {
                                    // console.log('wow', like.likes[j].article, articles[i]._id)
                                    if (JSON.stringify(like.likes[j].article) == JSON.stringify(articles[i]._id)) {
                                        articles[i].like = like.likes[j].status;
                                    };
                                };
                            };
                        }
                        res.json(articles);
                    });
                });
            });
        } else {
            res.json({
                error: "No articles found!!!"
            });
        }
    });
}



// function hasBookmarked(current_article, current_username, callback) {


//     Bookmark.findOne({
//         username: current_username,
//         article: current_article
//     }).exec().then(function(err, bookmark) {
//         if (!!bookmark) {
//             callback(bookmark.status);
//         } else {
//             callback(false);
//         };
//     });

// }



// Category
exports.getCategory = function(req, res) {
    var id = req.params.id;
    var category = Category.findById(id).exec();
    category.then(function(category) {
        res.json(category);
    });
}

exports.getCategorys = function(req, res) {
    Category.find().exec().then(function(categorys) {
        res.json(categorys);
    });
}

exports.delCategory = function(req, res) {
    var id = req.params.id;
    Category.remove({
        _id: id
    }).exec().then(function(category) {
        res.status(200).send();
    });
}

exports.addCategory = function(req, res) {
    console.log(req.body)
    var name = req.body.name;
    addCategory = new Category({
        name: name
    });
    Category.create(addCategory).then(function(addCategory) {
        res.status(200).send(addCategory);
    });
}

exports.updateCategory = function(req, res) {
    var query = {
        _id: req.body._id
    };
    var name = req.body.name;
    var imgUrl = req.body.imgUrl;
    var update = {
        name: name,
        imgUrl: imgUrl
    }
    Category.findOneAndUpdate(query, update).exec().then(function(category) {
        res.status(200).send(category);
    });
}

// Tag
exports.getTag = function(req, res) {
    var id = req.params.id;
    var tag = Tag.findById(id).exec();
    tag.then(function(tag) {
        res.json(tag);
    });
}

exports.getTags = function(req, res) {
    Tag.find().exec().then(function(tags) {
        res.json(tags);
    });
}

exports.delTag = function(req, res) {
    var id = req.params.id;
    Tag.remove({
        _id: id
    }).exec().then(function(tag) {
        res.status(200).send();
    });
}

exports.addTag = function(req, res) {
    console.log(req.body)
    var name = req.body.name;
    var boostValue = req.body.boostValue;
    addTag = new Tag({
        name: name,
        boostValue: boostValue
    });
    Tag.create(addTag).then(function(addTag) {
        res.status(200).send(addTag);
    });
}

exports.updateTag = function(req, res) {
    var query = {
        _id: req.body._id
    };
    console.log(req.body)
    var name = req.body.name;
    var boostValue = req.body.boostValue;
    var update = {
        name: name,
        boostValue: boostValue,
    }
    Tag.findOneAndUpdate(query, update).exec().then(function(tag) {
        res.status(200).send(tag);
    });
    console.log('testing again');
}


// Location
exports.getLocation = function(req, res) {
    var id = req.params.id;
    var location = Local.findById(id).exec();
    location.then(function(location) {
        res.json(location);
    });
}

exports.getLocations = function(req, res) {
    Local.find().exec().then(function(locations) {
        res.json(locations);
    });
}

exports.delLocation = function(req, res) {
    var id = req.params.id;
    Local.remove({
        _id: id
    }).exec().then(function(location) {
        res.status(200).send();
    });
}

exports.addLocation = function(req, res) {
    console.log(req.body)
    var name = req.body.name;
    addLocation = new Local({
        name: name
    });
    Local.create(addLocation).then(function(addLocation) {
        res.status(200).send(addLocation);
    });
}

exports.updateLocation = function(req, res) {
    var query = {
        _id: req.body._id
    };
    var name = req.body.name;
    var update = {
        name: name,
    }
    Local.findOneAndUpdate(query, update).exec().then(function(location) {
        res.status(200).send(location);
    });
}

// Utility functions

function monthsDiff(d1, d2) {
    return d2.getMonth() - d1.getMonth() + (12 * (d2.getFullYear() - d1.getFullYear()));
}

// ImageUpload functions

exports.singleImageUpload = function(req, res) {
    // console.log(req.files.file)
    var tempPath = req.files.file.path,
        ext = path.extname(req.files.file.name).toLowerCase(),
        newFileName = '/images/uploads/' + genarateUniqueHash() + ext;
    targetPath = path.resolve('./public' + newFileName);
    console.log(tempPath, ext, targetPath)
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
        fs.rename(tempPath, targetPath, function(err) {
            if (err) {
                throw err;
            }
            res.send(200, {
                path: newFileName
            });
        });
    } else {
        fs.unlink(tempPath, function() {
            if (err) {
                throw err;
            }
            res.json(500, {
                error: 'Only image files are allowed.'
            });
        });
    }
}

exports.multipleImagesUpload = function(req, res) {

    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    var length = req.files.file.length;
    // Checks to see if multiple files were uploaded
    if (length != undefined) {
        var location = [];
        req.files.file.forEach(function(value, index, array) {
            //Default location files will be stored. The path will start at the location relative to this script. make sure you have an images folder.
            var serverPath = __dirname + '/images/' + value.name;

            // Where you want your files to be saved too
            var serverLocation = '/var/www/server.com/public_html/images/'

            // Where you want your files to be moved too
            var publicLocation = 'http://servername.com/images/'

            var newPath = serverPath + value.name.replace(/ /g, '-');
            var newFile = publicLocation + value.name.replace(/ /g, '-');

            fs.rename(value.path, serverPath, function(error) {
                if (error) {
                    res.send({
                        error: error
                    })
                    return;
                }
                fs.readFile(serverPath, function(err, data) {
                    fs.writeFile(newPath, data, function(err) {
                        if (err) throw err;
                        fs.unlink(serverPath, function() {
                            if (err) throw err;
                            location.push(newFile);
                            if (location.length == array.length) {
                                res.send({
                                    data: location
                                });
                            }
                        })
                    })
                });
            });
        });
    } else {
        res.status(400).send({
            error: 1,
            details: 'Must upload at lease 3 images'
        });
    }
}