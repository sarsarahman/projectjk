// Imports

var request = require('request'),
    FeedParser = require('feedparser'),
    async = require('async'),
    mongoose = require('mongoose'),
    conf = require('../config.json'),
    fs = require('fs'),
    crypto = require('crypto'),
    http = require('http'),
    path = require('path'),
    https = require('https'),
    expressSession = require('express-session');

var deepPopulate = require('mongoose-deep-populate')(mongoose);











var genarateUniqueHash = function() {
    var hash = crypto.createHash('md5').update(new Date().toISOString()).digest('hex');
    // console.log(hash)
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
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
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
    approved: Boolean,
    starred: Boolean,
    imgUrl: String,
    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
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
    }).lean().exec().then(function(user) {
        user.role = 'user';
        callback(user);
    });

}


exports.updateUserLocation = function(req, res) {

    var current_username = req.user.userData._id;
    var current_location = req.body._id;

    var update = {
        location: current_location,
    };

    User.findOneAndUpdate({
        _id: current_username
    }, update, {
        upsert: false
    }).lean().exec().then(function(user) {
        res.json({
            status: "success"
        });
    });

}




exports.fetchUsers = function(req, res) {

    var paginate = 20;
    var page = req.params.page;
    User.find().sort({
        date: -1
    }).skip(page * paginate).limit(paginate).exec().then(function(users) {
        res.json(users);
    });

}





exports.adminLogin = function(userData, callback) {



    // addUser = new AdminUser({
    //     name: 'Abdur Rahman',
    //     username: 'admin',
    //     password: 'password',
    //     email: 'sarsarahman@gmail.com',
    //     gender: 'Male',
    //     mobileNumber: '9840903819',
    //     location: 'Chennai',
    //     dp: 'String',
    //     status: true
    // });

    // AdminUser.create(addUser).then(function(addUser) {
    //     // res.status(200).send(adduser);
    //       callback(addUser);
    // });



    AdminUser.findOne({
        username: userData.username,
        password: userData.password
    }).lean().exec().then(function(user) {
        if (!!user) {
            user.role = 'admin';
            callback(user);
        } else {
            callback(false);
        };
    });
}



exports.updatePreferredTag = function(req, res) {
    var sellectedTags = req.body;
    sellectedTags = sellectedTags.map(function(tag) {
        return tag._id;
    });
    var current_username = req.user.userData._id;
    // console.log('test', sellectedTags);
    PreferredTag.findOneAndUpdate({
        user: current_username
    }, {
        user: current_username,
        tags: sellectedTags
    }, {
        upsert: true
    }).lean().exec().then(function(updatedPreferredTag) {
        // console.log(updatedPreferredTag);
        res.status(200).send({
            status: true
        });
    });

}



exports.getPreferredTag = function(req, res) {

    var current_username = req.user.userData._id;
    PreferredTag.findOne({
        user: current_username,
    }).lean().populate('tags', 'name').exec().then(function(preferredTag) {

        if (!!preferredTag) {
            res.status(200).send(preferredTag.tags);
        } else {
            res.status(200).send({
                error: 'no tags preffered'
            });
        };
    });
}



//Like and Dislike functions

exports.likeArticle = function(req, res) {

    var current_username = req.user.userData._id;
    var current_article = req.params.id;

    // console.log(current_article, current_username)

    Article.findOne({
        _id: current_article
    }).lean().exec().then(function(article) {

        if (!!article) {
            article.likes = article.likes.map(function(like) {
                return like + ''
            });
            var pos = article.likes.indexOf(current_username);

            if (pos > -1) {
                article.likes.splice(pos, 1);
            } else {
                article.likes.push(current_username);
            };

            article.dislikes = article.dislikes.map(function(dislike) {
                return dislike + ''
            });
            pos = article.dislikes.indexOf(current_username);
            if (pos > -1) {
                article.dislikes.splice(pos, 1);
            };

            delete article._id;

            Article.findOneAndUpdate({
                _id: current_article
            }, article).exec().then(function(updatedarticle) {
                var pos = updatedarticle.likes.indexOf(current_username);
                // console.log(article, updatedarticle)
                if (pos > -1) {
                    res.status(200).send({
                        like: true,
                        likes: updatedarticle.likes.length,
                        dislike: false,
                        dislikes: updatedarticle.dislikes.length,
                    });
                } else {
                    res.status(200).send({
                        like: false,
                        likes: updatedarticle.likes.length,
                        dislike: false,
                        dislikes: updatedarticle.dislikes.length,
                    });
                };
            });

        };
    });
}

exports.dislikeArticle = function(req, res) {
    var current_username = req.user.userData._id;
    var current_article = req.params.id;

    Article.findOne({
        _id: current_article
    }).lean().exec().then(function(article) {

        if (!!article) {
            article.dislikes = article.dislikes.map(function(dislike) {
                return dislike + ''
            });

            var pos = article.dislikes.indexOf(current_username);

            // console.log(pos)

            if (pos > -1) {
                article.dislikes.splice(pos, 1);
            } else {
                article.dislikes.push(current_username);
            };

            article.likes = article.likes.map(function(like) {
                return like + ''
            });

            pos = article.likes.indexOf(current_username);

            if (pos > -1) {
                article.likes.splice(pos, 1);
            };

            delete article._id;
            // console.log(article)

            Article.findOneAndUpdate({
                _id: current_article
            }, article).exec().then(function(updatedarticle) {
                var pos = updatedarticle.dislikes.indexOf(current_username);
                if (pos > -1) {
                    res.status(200).send({
                        dislike: true,
                        dislikes: updatedarticle.dislikes.length,
                        like: false,
                        likes: updatedarticle.likes.length,
                    });
                } else {
                    res.status(200).send({
                        dislike: false,
                        dislikes: updatedarticle.dislikes.length,
                        like: false,
                        likes: updatedarticle.likes.length,
                    });
                };
            });

        };



    });

}




exports.likedArticles = function(req, res) {
    var current_username = req.user.userData._id;
    Article.find({
        likes: [current_username]
    }).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').lean().exec().then(function(articles) {
        if (!!articles) {
            articles.sort(compareArticles);
            articles = processRawArticles(articles, current_username);
            // console.log(articles)
            res.status(200).send(articles);
        };
    });
}


exports.dislikedArticles = function(req, res) {
    var current_username = req.user.userData._id;
    Article.find({
        dislikes: [current_username]
    }).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').lean().exec().then(function(articles) {
        if (!!articles) {
            articles.sort(compareArticles);
            articles = processRawArticles(articles, current_username);
            res.status(200).send(articles);
        };
    });
}











//Bookmark functions

exports.bookmarkArticle = function(req, res) {

    var current_username = req.user.userData._id;
    var current_article = req.params.id;

    Article.findOne({
        _id: current_article
    }).lean().exec().then(function(article) {
        if (!!article) {
            article.bookmarks = article.bookmarks.map(function(bookmark) {
                return bookmark + ''
            });

            var pos = article.bookmarks.indexOf(current_username);
            if (pos > -1) {
                article.bookmarks.splice(pos, 1);
            } else {
                article.bookmarks.push(current_username);
            };


            delete article._id;

            Article.findOneAndUpdate({
                _id: current_article
            }, article).exec().then(function(updatedarticle) {
                var pos = article.bookmarks.indexOf(current_username);
                if (pos > -1) {
                    res.status(200).send({
                        bookmark: true,
                    });
                } else {
                    res.status(200).send({
                        bookmark: false
                    });
                };
            });
        };
    });
}





exports.bookmarkedArticles = function(req, res) {
    var current_username = req.user.userData._id;
    Article.find({
        bookmarks: [current_username]
    }).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').lean().exec().then(function(articles) {
        if (!!articles) {
            articles.sort(compareArticles);
            articles = processRawArticles(articles, current_username);
            res.status(200).send(articles);
        };
    });
}


///MaxLimit
exports.bookmarkedArticlesMaxLimit = function(req, res) {
    var current_username = req.user.userData._id;
    Article.find({
        bookmarks: [current_username]
    }).exec().then(function(articles) {
        if (!!articles) {
            res.json({
                pagelimit: Math.ceil(articles.length / 20)
            })
        } else {
            res.json({
                error: 'No articles found!!!'
            });
        }
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

exports.getPendingArticles = function(req, res) {
    var paginate = 20;
    var page = req.params.page;
    // var page = 0;
    Article.find({
        approved: false
    }).sort({
        date: -1
    }).skip(page * paginate).limit(paginate).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').exec().then(function(articles) {
        articles.sort(compareArticles);
        res.json(articles);
    });
}

exports.getApprovedArticles = function(req, res) {
    var paginate = 20;
    var page = req.params.page;

    Article.find({
        approved: true
    }).sort({
        date: -1
    }).skip(page * paginate).limit(paginate).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').exec().then(function(articles) {
        articles.sort(compareArticles);


        res.json(articles);
    });
}

exports.getStarredArticles = function(req, res) {

    var paginate = 20;
    var page = req.params.page;
    Article.find({
        starred: true
    }).sort({
        date: -1
    }).skip(page * paginate).limit(paginate).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').skip(0).limit(10).exec().then(function(articles) {
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
    // console.log('aad');
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
        approved: false,
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
        likes: [],
        dislikes: [],
        bookmarks: []
    });
    Article.create(addArticle).then(function(addArticle) {
        res.status(200).send(addArticle);
    });
}

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
        approved: req.body.approved,
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

function processRawArticles(articles, username) {


    articles.map(function(article) {
        var like = false;
        var dislike = false;
        var bookmark = false;


        article.likes = article.likes.map(function(like) {
            return like + ''
        });

        article.dislikes = article.dislikes.map(function(dislike) {
            return dislike + ''
        });

        article.bookmarks = article.bookmarks.map(function(bookmark) {
            return bookmark + ''
        });


        if (article.likes.indexOf(username) > -1) {
            like = true;
        };

        if (article.dislikes.indexOf(username) > -1) {
            dislike = true;
        };

        if (article.bookmarks.indexOf(username) > -1) {
            bookmark = true;
        };

        article.like = like;
        article.dislike = dislike;
        article.bookmark = bookmark;

        article.likes = article.likes.length;
        article.dislikes = article.dislikes.length;
        delete article.bookmarks;
        return article;
    });

    return articles;
}

function extractArticle(item, feed) {

    var categoryId = '';
    var locationId = '';


    if (feed.category != '') {
        categoryId = feed.category;
        // console.log(feed.category)
    };

    if (feed.location != '') {
        locationId = feed.location;
        // console.log(feed)

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
        approved: false,
        starred: false
    });
}




exports.getSearchArticles = function(req, res) {

    var searchdata = req.params.searchdata;
    var paginate = 20;
    var page = req.params.page;
    var current_username = req.user.userData._id;

    Article.find({
        approved: true,
        $or: [{
            'title': new RegExp(searchdata, "i")
        }, {
            'summary': new RegExp(searchdata, "i")
        }, {
            'description': new RegExp(searchdata, "i")
        }]

    }).sort({
        date: -1
    }).skip(page * paginate).limit(paginate).populate('tags', 'name').populate('location', 'name').populate('category', 'name').lean().exec().then(function(articles) {

        articles.sort(compareArticles);
        articles = processRawArticles(articles, current_username);

        res.json(articles);
    });
}


exports.getSearchArticlesMaxLimit = function(req, res) {

    var searchdata = req.params.searchdata;

    Article.find({
        approved: true,
        $or: [{
            'title': new RegExp(searchdata, "i")
        }, {
            'summary': new RegExp(searchdata, "i")
        }, {
            'description': new RegExp(searchdata, "i")
        }]

    }).lean().exec().then(function(articles) {
        if (!!articles) {
            articles.sort(compareArticles);
            res.json({
                pagelimit: Math.ceil(articles.length / 20)
            })
        } else {
            res.json({
                error: "No articles found!!!"
            });
        };

    });
}



exports.getCategoryArticles = function(req, res) {

    var paginate = 20;
    var page = req.params.page;
    var reqCategory = req.params.cat;
    var current_username = req.user.userData._id;


    Category.findOne({
        name: reqCategory,
    }, function(err, cat) {
        // console.log(cat);
        if (!!cat) {
            Article.find({
                approved: true,
                category: cat._id
            }).sort({
                date: -1
            }).skip(page * paginate).limit(paginate).populate('tags', 'name').populate('location', 'name').populate('category', 'name').lean().exec().then(function(articles) {
                articles.sort(compareArticles);
                articles = processRawArticles(articles, current_username);
                res.json(articles);
            });
        } else {
            res.json({
                error: "No articles found!!!"
            });
        }
    });
}




exports.getCategoryArticlesMaxLimit = function(req, res) {

    var reqCategory = req.params.cat;

    Category.findOne({
        name: reqCategory,
    }, function(err, cat) {
        if (!!cat) {
            Article.find({
                approved: true,
                category: cat._id
            }).lean().exec().then(function(articles) {

                if (!!articles) {
                    articles.sort(compareArticles);
                    res.json({
                        pagelimit: Math.ceil(articles.length / 20)
                    })
                } else {

                    res.json({
                        error: "No articles found!!!"
                    });

                };
            });
        } else {
            res.json({
                error: "No articles found!!!"
            });
        }
    });
}



exports.getRecentArticles = function(req, res) {
    // console.log('yes')

    var paginate = 20;
    var page = req.params.page;
    var current_username = req.user.userData._id;


    Article.find({
        approved: true,
    }).sort({
        date: -1
    }).skip(page * paginate).limit(paginate).populate('tags', 'name').populate('location', 'name').populate('category', 'name').lean().exec().then(function(articles) {
        articles.sort(compareArticles);
        articles = processRawArticles(articles, current_username);
        res.json(articles);

    });


}


exports.getRecentArticlesMaxLimit = function(req, res) {
    Article.find({
        approved: true,
    }).lean().exec().then(function(articles) {
        if (!!articles) {
            res.json({
                pagelimit: Math.ceil(articles.length / 20)
            })
        } else {
            res.json({
                error: "No articles found!!!"
            });
        };
    });
}



exports.getTrendArticles = function(req, res) {

    var current_username = req.user.userData._id;

    var paginate = 20;
    var page = req.params.page;


    PreferredTag.findOne({
        user: current_username,
    }).lean().exec().then(function(preferredTag) {
        // console.log(preferredTag)

        if (!!preferredTag) {

            var mapedPreferredTag = preferredTag.tags.map(function(tag) {
                return tag + '';
            });

            // console.log(mapedPreferredTag)

            Article.find({
                approved: true,
                tags: {
                    $in: mapedPreferredTag
                }
            }).sort({
                date: -1
            }).skip(page * paginate).limit(paginate).populate('tags', 'name').populate('location', 'name').populate('category', 'name').lean().exec().then(function(articles) {

                res.json(articles);
                articles.sort(compareArticles);
                articles = processRawArticles(articles, current_username);
            });

        } else {
            res.status(200).send({
                error: 'no articles found'
            });
        };
    });
}



exports.getTrendArticlesMaxLimit = function(req, res) {

    var current_username = req.user.userData._id;

    PreferredTag.findOne({
        user: current_username,
    }).lean().exec().then(function(preferredTag) {

        if (!!preferredTag) {
            var mapedPreferredTag = preferredTag.tags.map(function(tag) {
                return tag.tag + '';
            });

            Article.find({
                approved: true,
                tags: {
                    $in: mapedPreferredTag
                }
            }).lean().exec().then(function(articles) {
                if (!!articles) {
                    res.json({
                        pagelimit: Math.ceil(articles.length / 20)
                    })
                } else {
                    res.json({
                        error: "No articles found!!!"
                    });
                };
            });
        } else {
            res.json({
                error: "No articles found!!!"
            });
        };
    });
}









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

exports.getAllTags = function(req, res) {
    Tag.find().lean().exec().then(function(tags) {
        tags.map(function(tag) {
            delete tag.boostValue;
        });
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
    var name = req.body.name;
    var boostValue = req.body.boostValue;
    var update = {
        name: name,
        boostValue: boostValue,
    }
    Tag.findOneAndUpdate(query, update).exec().then(function(tag) {
        res.status(200).send(tag);
    });
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
    var tempPath = req.files.file.path,
        ext = path.extname(req.files.file.name).toLowerCase(),
        newFileName = '/images/uploads/' + genarateUniqueHash() + ext;
    targetPath = path.resolve('./public' + newFileName);
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