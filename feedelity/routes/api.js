// Imports

var request = require('request'),
    FeedParser = require('feedparser'),
    async = require('async'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    conf = require('../config.json'),
    fs = require('fs'),
    crypto = require('crypto'),
    http = require('http'),
    path = require('path'),
    https = require('https'),
    expressSession = require('express-session');

var deepPopulate = require('mongoose-deep-populate')(mongoose);

var shortMonth = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var longMonth = ['January','February','March','April','May','June','July','August','September','Octember','November','December'];


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
    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    location: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    addedOn: Date,
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    updatedOn: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    deletedOn: Date
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
    status: Boolean,
    registeredOn: {
        type: Date,
        default: Date.now
    }
});

var staffSchema = mongoose.Schema({
    name: String,
    username: String,
    password: String,
    email: String,
    gender: String,
    mobileNumber: String,
    location: String,
    dp: String,
    status: Boolean,
    isActive: {
        type: Boolean,
        default: true
    },
    isBlocked : {
        type: Boolean,
        default: false
    },
    adminLevel : {
        type: Number,
        default: 2
    },
    registeredOn: {
        type: Date,
        default: Date.now
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    addedOn: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    updatedOn: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    deletedOn: Date,
    addFeeds: {
        type: Boolean,
        default: false
    },
    updateFeeds: {
        type: Boolean,
        default: false
    },
    delFeeds: {
        type: Boolean,
        default: false
    },
    addArticles: {
        type: Boolean,
        default: false
    },
    updateArticles: {
        type: Boolean,
        default: false
    },
    delArticles: {
        type: Boolean,
        default: false
    },
    addCategories: {
        type: Boolean,
        default: false
    },
    updateCategories: {
        type: Boolean,
        default: false
    },
    delCategories: {
        type: Boolean,
        default: false
    },
    addLocations: {
        type: Boolean,
        default: false
    },
    updateLocations: {
        type: Boolean,
        default: false
    },
    delLocations: {
        type: Boolean,
        default: false
    },
    addTags: {
        type: Boolean,
        default: false
    },
    updateTags: {
        type: Boolean,
        default: false
    },
    delTags: {
        type: Boolean,
        default: false
    },
    addStaffs: {
        type: Boolean,
        default: false
    },
    updateStaffs: {
        type: Boolean,
        default: false
    },
    delStaffs: {
        type: Boolean,
        default: false
    }
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
    status: Boolean,
    adminLevel: {
        type: Number,
        default: 1
    }
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
    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    location: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    addedOn: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    updatedOn: Date,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    approvedOn: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    deletedOn: Date
});

var tagSchema = mongoose.Schema({
    name: String,
    boostValue: String,
    imgUrl: String,
    isActive: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    addedOn: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    updatedOn: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    deletedOn: Date
});

var catSchema = mongoose.Schema({
    name: String,
    imgUrl: String,
    isActive: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    addedOn: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    updatedOn: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    deletedOn: Date
});

var locationSchema = mongoose.Schema({
    name: String,
    details: Object,
    isActive: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    addedOn: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    updatedOn: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    deletedOn: Date
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

var staffRoleSchema = mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    addFeeds: {
        type: Boolean,
        default: false
    },
    updateFeeds: {
        type: Boolean,
        default: false
    },
    delFeeds: {
        type: Boolean,
        default: false
    },
    addArticles: {
        type: Boolean,
        default: false
    },
    updateArticles: {
        type: Boolean,
        default: false
    },
    delArticles: {
        type: Boolean,
        default: false
    },
    addCategories: {
        type: Boolean,
        default: false
    },
    updateCategories: {
        type: Boolean,
        default: false
    },
    delCategories: {
        type: Boolean,
        default: false
    },
    addLocations: {
        type: Boolean,
        default: false
    },
    updateLocations: {
        type: Boolean,
        default: false
    },
    delLocations: {
        type: Boolean,
        default: false
    },
    addTags: {
        type: Boolean,
        default: false
    },
    updateTags: {
        type: Boolean,
        default: false
    },
    delTags: {
        type: Boolean,
        default: false
    },
    addStaffs: {
        type: Boolean,
        default: false
    },
    updateStaffs: {
        type: Boolean,
        default: false
    },
    delStaffs: {
        type: Boolean,
        default: false
    }
});


Feed = mongoose.model('Feed', feedSchema);
Article = mongoose.model('Article', articleSchema);
Category = mongoose.model('Category', catSchema);
Tag = mongoose.model('Tag', tagSchema);
Local = mongoose.model('Location', locationSchema);
User = mongoose.model('User', userSchema);
Staff = mongoose.model('Staff', staffSchema);
AdminUser = mongoose.model('AdminUser', adminUserSchema);
Like = mongoose.model('Like', likeSchema);
Bookmark = mongoose.model('Bookmark', bookmarkSchema);
PreferredTag = mongoose.model('PreferredTag', preferredTagSchema);
StaffRole = mongoose.model('staffrole', staffRoleSchema);

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

// ^StaffRole
exports.getstaffRole = function(req, res) {
    StaffRole.find().exec(function(err, staffroles) {
        if(err) console.log('getstaffRole err:', err);
        else res.json(staffroles);
    });
}

exports.updatestaffRole = function(req, res) {
    StaffRole.findOneAndUpdate({
        staffId: req.params.staffid
    }, {
        staffId: req.body.staffId,
        addFeeds: req.body.addFeeds,
        updateFeeds: req.body.updateFeeds,
        delFeeds: req.body.delFeeds,
        addArticles: req.body.addArticles,
        updateArticles: req.body.updateArticles,
        delArticles: req.body.delArticles,
        addCategories: req.body.addCategories,
        updateCategories: req.body.updateCategories,
        delCategories: req.body.delCategories,
        addLocations: req.body.addLocations,
        updateLocations: req.body.updateLocations,
        delLocations: req.body.delLocations,
        addTags: req.body.addTags,
        updateTags: req.body.updateTags,
        delTags: req.body.delTags,
        addStaffs: req.body.addStaffs,
        updateStaffs: req.body.updateStaffs,
        delStaffs: req.body.delStaffs
    }, {new:true}).exec(function(err, staffroles) {
        if(err) console.log('updatestaffRole err:', err);
        else res.json(staffroles);
    });
}
// $StaffRole

// ^Staffs
exports.staffLogin = function(userData, callback) {
    // addStaff = new Staff({
    //     name: 'Abdur Rahman',
    //     username: 'admin',
    //     password: 'password',
    //     email: 'sarsarahman@gmail.com',
    //     gender: 'Male',
    //     mobileNumber: '9840903819',
    //     location: 'Chennai',
    //     dp: 'String',
    //     status: true,
    //     adminLevel: 1,
    //     addFeeds: true,
    //     updateFeeds: true,
    //     delFeeds: true,
    //     addArticles: true,
    //     updateArticles: true,
    //     delArticles: true,
    //     addCategories: true,
    //     updateCategories: true,
    //     delCategories: true,
    //     addLocations: true,
    //     updateLocations: true,
    //     delLocations: true,
    //     addTags: true,
    //     updateTags: true,
    //     delTags: true,
    //     addStaffs: true,
    //     updateStaffs: true,
    //     delStaffs: true
    // });

    // Staff.create(addStaff).then(function(addStaff) {
    //     // res.status(200).send(adduser);
    //       callback(addStaff);
    // });

    Staff.findOne({
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

exports.fetchStaffs = function(req, res) {
    var paginate = 20;
    var page = req.params.page;
    Staff.find({adminLevel:2}).sort({
        date: -1
    }).skip(page * paginate).limit(paginate).exec().then(function(staffs) {
        res.json(staffs);
    });
}

exports.getStaffs = function(req, res) {
    Staff.find({adminLevel:2}).sort({
        date: -1
    }).exec().then(function(staffs) {
        res.json(staffs);
    });
}

exports.addStaff = function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    addStaff = new Staff({
        name: "",
        username: username,
        password: password,
        email: '',
        gender: '',
        mobileNumber: '',
        location: 'Chennai',
        dp: '',
        status: true,
        addedBy: req.user._id,
        addedOn: Date.now()
    });
    Staff.create(addStaff).then(function(addStaff) {
        res.status(200).send(addStaff);
        // new StaffRole({
        //     staffId: addStaff._id
        // }).save();
    });
}

exports.getStaff = function(req, res) {
    var id = req.params.id;
    var staff = Staff.findById(id).exec();
    staff.then(function(staff) {
        res.json(staff);
    });
}

exports.updateStaff = function(req, res) {
    var query = {
        _id: req.body._id
    };
    var username = req.body.username;
    var name = req.body.name;
    var email = req.body.email;
    var gender = req.body.gender;
    var mobile = req.body.mobileNumber;
    var location = req.body.location;
    var update = {
        username: username,
        name: name,
        email: email,
        gender: gender,
        mobileNumber: mobile,
        location: location,
        updatedBy: req.user._id,
        updatedOn: Date.now(),
        addFeeds: req.body.addFeeds,
        updateFeeds: req.body.updateFeeds,
        delFeeds: req.body.delFeeds,
        addArticles: req.body.addArticles,
        updateArticles: req.body.updateArticles,
        delArticles: req.body.delArticles,
        addCategories: req.body.addCategories,
        updateCategories: req.body.updateCategories,
        delCategories: req.body.delCategories,
        addLocations: req.body.addLocations,
        updateLocations: req.body.updateLocations,
        delLocations: req.body.delLocations,
        addTags: req.body.addTags,
        updateTags: req.body.updateTags,
        delTags: req.body.delTags,
        addStaffs: req.body.addStaffs,
        updateStaffs: req.body.updateStaffs,
        delStaffs: req.body.delStaffs
    }
    Staff.findOneAndUpdate(query, update).exec().then(function(staff) {
        res.status(200).send(staff);
    });
}

exports.delStaff = function(req, res) {
    var id = req.params.id;
    // Staff.remove({
    //     _id: id
    // }).exec().then(function(staff) {
    //     res.status(200).send();
    // });
    Staff.findByIdAndUpdate(id, {
        isActive:false,
        deletedBy: req.user._id,
        deletedOn: Date.now()
    }).exec().then(function(staff) {
        res.status(200).send();
    });
}

exports.banStaff = function(req, res) {
    var id = req.params.id;
    Staff.findByIdAndUpdate(id, {$set:{isBlocked:true}}).exec().then(function(staff) {
        res.status(200).send(staff);
    });
}

exports.unbanStaff = function(req, res) {
    var id = req.params.id;
    Staff.findByIdAndUpdate(id, {$set:{isBlocked:false}}).exec().then(function(staff) {
        res.status(200).send(staff);
    });
}
// $Staffs

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
    userId = req.user._id;
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
            // } else res.json(feeds);
            } else {
                // Article.find().exec(function(err, articles) {
                //     if(err) console.log('refreshFeeds article err:', err);
                //     else res.json([feeds, articles]);
                // });

                var allCounts = {};
                async.parallel([
                    //Count approved articles
                    function(callback) {
                        Article.count({approved:true}, function(err, count) {
                            console.log('approved article count : ' + count);
                            if(err) return callback(err);
                            allCounts.approvedArticlesCount = count;
                            callback();
                        });
                    },
                    //Count pending articles
                    function(callback) {
                        Article.count({approved:false}, function(err, count) {
                            console.log('pending article count : ' + count);
                            if(err) return callback(err);
                            allCounts.pendingArticlesCount = count;
                            callback();
                        });
                    },
                    //Count starred articles
                    function(callback) {
                        Article.count({starred:true}, function(err, count) {
                            console.log('starred article count : ' + count);
                            if(err) return callback(err);
                            allCounts.starredArticlesCount = count;
                            callback();
                        });
                    },
                    //Count all articles
                    function(callback) {
                        Article.count({}, function(err, count) {
                            console.log('all articles count : ' + count);
                            if(err) return callback(err);
                            allCounts.allArticlesCount = count;
                            callback();
                        });
                    },
                    //Count all feeds
                    function(callback) {
                        Feed.count({}, function(err, count) {
                            console.log('all feeds count : ' + count);
                            if(err) return callback(err);
                            allCounts.allFeedsCount = count;
                            callback();
                        });
                    },
                    //Count feeds added today
                    function(callback) {
                        Feed.count({
                            $and:[{
                                addedOn:{$gte: moment.utc().startOf('day').toDate()}
                            },{
                                addedOn:{$lte: moment.utc().endOf('day').toDate()}
                            }]
                        }, function(err, count) {
                            console.log('feeds added today count : ' + count);
                            if(err) return callback(err);
                            allCounts.feedsAddedTodayCount = count;
                            callback();
                        });
                    },
                    //Count all staffs
                    function(callback) {
                        Staff.count({}, function(err, count) {
                            console.log('staff count : ' + count);
                            if(err) return callback(err);
                            allCounts.staffsCount = count;
                            callback();
                        });
                    },
                    //Count staffs registered today
                    function(callback) {
                        Staff.count({
                            $and:[{
                                registeredOn:{$gte: moment.utc().startOf('day').toDate()}
                            },{
                                registeredOn:{$lte: moment.utc().endOf('day').toDate()}
                            }]}, function(err, count) {
                            console.log('staffs registered count : ' + count);
                            if(err) return callback(err);
                            allCounts.staffRegisteredTodayCount = count;
                            callback();
                        });
                    },
                    //Count articles added today
                    function(callback) {
                        Article.count({
                            $and:[{
                                addedOn:{$gte: moment.utc().startOf('day').toDate()}
                            },{
                                addedOn:{$lte: moment.utc().endOf('day').toDate()}
                            }]}, function(err, count) {
                            console.log('articles added today count : ' + count);
                            if(err) return callback(err);
                            allCounts.articlesAddedTodayCount = count;
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) return next(err);
                    res.json([feeds, allCounts]);
                });
            } // end ifelse
        });
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
        console.log('candidate:', candidate);
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
                cur.addedBy = userId;
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

exports.getFeed = function(req, res) {
    var id = req.params.id;
    var feed = Feed.findById(id).populate('location', 'name').populate('category', 'name').exec();
    feed.then(function(feed) {
        res.json(feed);
    });
}

exports.getFeeds = function(req, res) {
    // Feed.find().populate('location', 'name').populate('category', 'name').exec().then(function(feeds) {
    Feed.find({isActive:true}).populate('location', 'name').populate('category', 'name').exec().then(function(feeds) {
        res.json(feeds);
    });
}

exports.delFeed = function(req, res) {
    var id = req.params.id;
    // Article.remove({
    //     _feed: id
    // }).exec().then(function(articles) {
    //     Feed.remove({
    //         _id: id
    //     }).exec().then(function(feed) {
    //         res.status(200).send();
    //     });
    // });
    Article.update({
        _feed: id
    }, {$set:{
        isActive:false,
        deletedBy: req.user._id,
        deletedOn: new Date()
    }}, {multi:true}).exec().then(function(articles) {
        Feed.findByIdAndUpdate({
            _id: id
        }, {$set:{
            isActive:false,
            deletedBy: req.user._id,
            deletedOn: new Date()
        }}).exec().then(function(feed) {
            res.status(200).send(feed);
        });
    });
}

exports.addFeed = function(req, res) {
    var url = req.body.url;

    var categoryId = [];
    var locationId = [];

    addFeed = new Feed({
        name: url,
        url: url,
        state: 'New',
        category: categoryId,
        location: locationId,
        lastFetched: 0,
        lastErrors: 0,
        lastOudated: 0,
        addedBy: req.user._id,
        addedOn: new Date()
    });
    Feed.create(addFeed).then(function(addFeed) {
        res.status(200).send(addFeed);
    });
}

exports.updateFeed = function(req, res) {
    var query = {
        _id: req.body._id
    };

    // var categoryId = '';
    var categoryId = [];
    var locationId = [];

    // if (req.body.category.hasOwnProperty('_id')) {
    //     categoryId = req.body.category._id;
    // };
    if(req.body.category) {
        for(var i in req.body.category) {
            categoryId.push(req.body.category[i]._id);
        }
    }

    if (req.body.location) {
        for(var i in req.body.location) {
            locationId.push(req.body.location[i]._id);
        }
    };

    var update = {
        name: req.body.name,
        url: req.body.url,
        category: categoryId,
        location: locationId,
        updatedBy: req.user._id,
        updatedOn: new Date()
    }
    // Feed.findOneAndUpdate(query, update).exec().then(function(feed) {
    //     res.status(200).send(feed);
    // });
    Feed.findOneAndUpdate(query, update).exec(function(err, feed) {
        if(err) console.log('update feed err:', err);
        else res.status(200).send(feed);
    });
}

// Articles functions

exports.getPendingArticles = function(req, res) {
    var paginate = 20;
    var page = req.params.page;
    // var page = 0;
    // if(req.user.adminLevel === 1) {
    //     Article.find({approved: false}).sort({
    //         date: -1
    //     }).skip(page * paginate).limit(paginate).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').exec().then(function(articles) {
    //         articles.sort(compareArticles);
    //         res.json(articles);
    //     });
    // } else {
        Article.find({
            approved: false,
            isActive: true
        }).sort({
            date: -1
        }).skip(page * paginate).limit(paginate).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').exec().then(function(articles) {
            articles.sort(compareArticles);
            res.json(articles);
        });
    // }
}

exports.getApprovedArticles = function(req, res) {
    var paginate = 20;
    var page = req.params.page;

    Article.find({
        approved: true,
        isActive: true
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
        starred: true,
        isActive: true
    }).sort({
        date: -1
    }).skip(page * paginate).limit(paginate).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').skip(0).limit(10).exec().then(function(articles) {
        articles.sort(compareArticles);
        res.json(articles);
    });
}

exports.getDeletedArticles = function(req, res) {
    var paginate = 20;
    var page = req.params.page;
    Article.find({
        isActive: false
    }).sort({
        date: -1
    }).skip(page * paginate).limit(paginate).populate('_feed', 'name').populate('tags', 'name').populate('location', 'name').populate('category', 'name').skip(0).limit(10).exec().then(function(articles) {
        articles.sort(compareArticles);
        res.json(articles);
    });
}

exports.getCounts = function(req, res) {
    var allCounts = {};
    async.parallel([
        //Count approved articles
        function(callback) {
            Article.count({approved:true}, function(err, count) {
                console.log('approved article count : ' + count);
                if(err) return callback(err);
                allCounts.approvedArticlesCount = count;
                callback();
            });
        },
        //Count pending articles
        function(callback) {
            Article.count({approved:false}, function(err, count) {
                console.log('pending article count : ' + count);
                if(err) return callback(err);
                allCounts.pendingArticlesCount = count;
                callback();
            });
        },
        //Count starred articles
        function(callback) {
            Article.count({starred:true}, function(err, count) {
                console.log('starred article count : ' + count);
                if(err) return callback(err);
                allCounts.starredArticlesCount = count;
                callback();
            });
        },
        //Count deleted articles
        function(callback) {
            Article.count({isActive:false}, function(err, count) {
                console.log('deleted article count : ' + count);
                if(err) return callback(err);
                allCounts.deletedArticlesCount = count;
                callback();
            });
        },
        //Count all articles
        function(callback) {
            Article.count({}, function(err, count) {
                console.log('all articles count : ' + count);
                if(err) return callback(err);
                allCounts.allArticlesCount = count;
                callback();
            });
        },
        //Count all feeds
        function(callback) {
            Feed.count({}, function(err, count) {
                console.log('all feeds count : ' + count);
                if(err) return callback(err);
                allCounts.allFeedsCount = count;
                callback();
            });
        },
        //Count feeds added today
        function(callback) {
            Feed.count({
                $and:[{
                    addedOn:{$gte: moment.utc().startOf('day').toDate()}
                },{
                    addedOn:{$lte: moment.utc().endOf('day').toDate()}
                }]
            }, function(err, count) {
                console.log('feeds added today count : ' + count);
                if(err) return callback(err);
                allCounts.feedsAddedTodayCount = count;
                callback();
            });
        },
        //Count all staffs
        function(callback) {
            Staff.count({}, function(err, count) {
                console.log('staff count : ' + count);
                if(err) return callback(err);
                allCounts.staffsCount = count;
                callback();
            });
        },
        //Count staffs registered today
        function(callback) {
            Staff.count({
                $and:[{
                    registeredOn:{$gte: moment.utc().startOf('day').toDate()}
                },{
                    registeredOn:{$lte: moment.utc().endOf('day').toDate()}
                }]}, function(err, count) {
                console.log('staffs registered count : ' + count);
                if(err) return callback(err);
                allCounts.staffRegisteredTodayCount = count;
                callback();
            });
        },
        //Count articles added today
        function(callback) {
            Article.count({
                $and:[{
                    addedOn:{$gte: moment.utc().startOf('day').toDate()}
                },{
                    addedOn:{$lte: moment.utc().endOf('day').toDate()}
                }]}, function(err, count) {
                console.log('articles added today count : ' + count);
                if(err) return callback(err);
                allCounts.articlesAddedTodayCount = count;
                callback();
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.json(allCounts);
    });
}

exports.getArticle = function(req, res) {
    var id = req.params.id;
    var article = Article.findById(id).populate({
        path: '_feed', match: {isActive: true}, select:'name'
    }).populate('tags', 'name').populate({path:'location', match:{isActive:true}, select:'name'}).populate('category', 'name').exec();
    article.then(function(article) {
        res.json(article);
    });
}

exports.addArticle = function(req, res) {
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
        bookmarks: [],
        addedBy: req.user._id,
        addedOn: new Date()
    });
    Article.create(addArticle).then(function(addArticle) {
        res.status(200).send(addArticle);
    });
}

exports.updateArticle = function(req, res) {
    var categoryId = [];
    var locationId = [];
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
        // if ('_id' in req.body.category) {
        //     categoryId = req.body.category._id;
        // } else {
        //     categoryId = '';
        // };
        // for(var i in req.body.category) {
        //     categoryId.push(req.body.category[i]._id);
        // }
        categoryId = req.body.category.map(function(cat) {
            return cat._id;
        });
    };

    if (req.body.location) {
        // if ('_id' in req.body.location) {
        //     locationId = req.body.location._id;
        // } else {
        //     locationId = '';
        // };
        // for(var i in req.body.location) {
        //     locationId.push(req.body.location[i]._id);
        // }
        locationId = req.body.location.map(function(loc) {
            return loc._id;
        });
    };


    // console.log(tagIds);

    if(req.body.approved) {
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
            approvedBy: req.user._id,
            approvedOn : new Date()
        }
        // Article.findOneAndUpdate(query, update).exec().then(function(article) {
        //     // console.log(article,update); 
        //     res.status(200).send(article);
        // });
    } else {
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
            updatedBy: req.user._id,
            updatedOn: new Date()
        }
        // Article.findOneAndUpdate(query, update).exec().then(function(article) {
        //     // console.log(article,update); 
        //     res.status(200).send(article);
        // });
    }
    Article.findOneAndUpdate(query, update).exec().then(function(article) {
        // console.log(article,update); 
        res.status(200).send(article);
    });
}

exports.bulkupdateArticle = function(req, res) {
    var tagIds = [],
        categoryIds = [],
        locationIds = [];
    if (req.body[0].tags.length > 0) {
        tagIds = req.body[0].tags.map(function(tag) {
            return tag._id;
        });
    };

    if (req.body[0].category.length > 0) {
        categoryIds = req.body[0].category.map(function(category) {
            return category._id;
        });
    };

    if (req.body[0].location.length > 0) {
        locationIds = req.body[0].location.map(function(location) {
            return location._id;
        });
    };
    var bulkupdatedArticles = [];
    async.eachSeries(req.body, function(article, cb) {
        Article.findByIdAndUpdate(article._id, {
            starred: article.starred,
            approved: article.approved,
            name: article.name,
            title: article.title,
            summary: article.summary,
            date: Date.parse(article.date),
            imgUrl: article.imgUrl,
            // category: categoryIds,
            // tags: tagIds,
            // location: locationIds,
            description: article.description,
            author: article.author,
            link: article.link,
            guid: article.guid,
            updatedBy: req.user._id,
            updatedOn: new Date()
        }, {new:true}).exec(function(err, article) {
            if(err) console.log('bulkupdate findByIdAndUpdate err:', err);
            // else bulkupdatedArticles.push(article);
            cb();
        });
    }, function(err) {
        if(err) console.log('async bulkupdateArticle err:', err);
        // res.status(200).send(bulkupdatedArticles);
    });

    async.eachSeries(req.body, function(article, cb) {
        Article.findByIdAndUpdate(article._id, {
            $addToSet:{category:{$each:categoryIds}},
            $addToSet:{tags:{$each:tagIds}},
            $addToSet:{location:{$each:locationIds}}
        }, {new:true}).exec(function(err, article) {
            if(err) console.log('addtoset bulkupdate findByIdAndUpdate err:', err);
            else bulkupdatedArticles.push(article);
            cb();
        });
    }, function(err) {
        if(err) console.log('addtoset async bulkupdateArticle err:', err);
        res.status(200).send(bulkupdatedArticles);
    });
}

exports.approveArticles = function(req, res) {
    var approvedArticles = [];
    async.eachSeries(req.body, function(articleId, cb) {
        Article.findByIdAndUpdate(articleId, {
            $set:{
                approved:true,
                updatedBy: req.user._id,
                updatedOn: Date.now()
            }
        }).exec(function(err, article) {
            if(err) console.log('approve articles err:', err);
            else approvedArticles.push(article);
            cb();
        });
    }, function(err) {
        if(err) console.log('approveArticles async err:', err);
        res.status(200).send(approvedArticles);
    });
}

exports.disapproveArticles = function(req, res) {
    var disapprovedArticles = [];
    async.eachSeries(req.body, function(articleId, cb) {
        Article.findByIdAndUpdate(articleId, {
            $set:{
                approved:false,
                updatedBy: req.user._id,
                updatedOn: Date.now()
            }
        }).exec(function(err, article) {
            if(err) console.log('disapprove articles err:', err);
            else disapprovedArticles.push(article);
            cb();
        });
    }, function(err) {
        if(err) console.log('disapproveArticles async err:', err);
        res.status(200).send(disapprovedArticles);
    });
}

exports.starArticle = function(req, res) {
    var id = req.params.id;
    Article.findByIdAndUpdate(id, { $set: {
        starred: req.body.starred
    }} ).exec().then(function(article) {
        res.status(200).send(article);
    });
}

exports.delArticle = function(req, res) {
    var id = req.params.id;
    Article.findByIdAndUpdate(id, { $set: {
        isActive: false,
        deletedBy: req.user._id,
        deletedOn: new Date()
    }} ).exec().then(function(article) {
        res.status(200).send(article);
    });
}

exports.delselectedArticles = function(req, res) {
    var delselectedArticles = [];
    async.eachSeries(req.body, function(articleId, cb) {
        Article.findByIdAndUpdate(articleId, {
            $set:{
                isActive: false,
                deletedBy: req.user._id,
                deletedOn: Date.now()
            }
        }).exec(function(err, article) {
            if(err) console.log('delselected articles err:', err);
            else delselectedArticles.push(article);
            cb();
        });
    }, function(err) {
        if(err) console.log('delselectedArticles async err:', err);
        res.status(200).send(delselectedArticles);
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

                articles.sort(compareArticles);
                articles = processRawArticles(articles, current_username);
                res.json(articles);
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
    Category.find({isActive:true}).exec().then(function(categorys) {
        res.json(categorys);
    });
}

exports.delCategory = function(req, res) {
    var id = req.params.id;
    // Category.remove({
    //     _id: id
    // }).exec().then(function(category) {
    //     res.status(200).send();
    // });
    Category.findByIdAndUpdate(id, {
        isActive:false,
        deletedBy: req.user._id,
        deletedOn: Date.now()
    }).exec().then(function(category) {
        res.status(200).send();
    });
}

exports.addCategory = function(req, res) {
    var name = req.body.name;
    addCategory = new Category({
        name: name,
        addedBy: req.user._id,
        addedOn: Date.now()
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
    var imgUrl = req.body.imgUrl || '';
    var update = {
        name: name,
        imgUrl: imgUrl,
        updatedBy: req.user._id,
        updatedOn: Date.now()
    }
    // Category.findOneAndUpdate(query, update).exec().then(function(category) {
    //     res.status(200).send(category);
    // });
    Category.findOneAndUpdate(query, update).exec(function(err, category) {
        if(err) console.log('update category err:', err);
        else res.status(200).send(category);
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
    Tag.find({isActive:true}).exec().then(function(tags) {
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
    // Tag.remove({
    //     _id: id
    // }).exec().then(function(tag) {
    //     res.status(200).send();
    // });
    Tag.findByIdAndUpdate(id, {
        isActive:false,
        deletedBy: req.user._id,
        deletedOn: Date.now()
    }).exec().then(function(tag) {
        res.status(200).send();
    });
}

exports.addTag = function(req, res) {
    var name = req.body.name;
    var boostValue = req.body.boostValue;
    addTag = new Tag({
        name: name,
        boostValue: boostValue,
        addedBy: req.user._id,
        addedOn: Date.now()
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
    var imgUrl = req.body.imgUrl;
    var update = {
        name: name,
        boostValue: boostValue,
        imgUrl: imgUrl,
        updatedBy: req.user._id,
        updatedOn: Date.now()
    }
    // Tag.findOneAndUpdate(query, update).exec().then(function(tag) {
    Tag.findOneAndUpdate(query, update).exec(function(err, tag) {
        if(err) console.log('updateTag err:', err);
        else res.status(200).send(tag);
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
    Local.find({isActive:true}).exec().then(function(locations) {
        res.json(locations);
    });
}

exports.delLocation = function(req, res) {
    var id = req.params.id;
    // Local.remove({
    //     _id: id
    // }).exec().then(function(location) {
    //     res.status(200).send();
    // });
    Local.findByIdAndUpdate(id, {
        isActive:false,
        deletedBy: req.user._id,
        deletedOn: Date.now()
    }).exec().then(function(location) {
        res.status(200).send();
    });
}

exports.addLocation = function(req, res) {
    var name = req.body.name;
    var details = req.body.details;
    // console.log(req,'add location with details');
    addLocation = new Local({
        name: name,
        details: details,
        addedBy: req.user._id,
        addedOn: Date.now()
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
    var details = req.body.details;
    console.log(req,'request');
    var update = {
       name: name,
       details: details,
       updatedBy: req.user._id,
       updatedOn: Date.now()
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
    
    //Create folder to store image as per year and month
    if (! fs.existsSync(path.resolve(__dirname, '..') + "/public/images/" + shortMonth[new Date().getMonth()] + "_" + new Date().getFullYear())) {
        fs.mkdir(path.resolve(__dirname, '..') + "/public/images/" + shortMonth[new Date().getMonth()] + "_" + new Date().getFullYear());
        //console.log("Folder Created");
    }

    var tempPath = req.files.file.path,
        ext = path.extname(req.files.file.name).toLowerCase(),
        //newFileName = '/images/uploads/' + genarateUniqueHash() + ext;
        //newFileName = '/images/' + new Date().getFullYear() + "" + (new Date().getMonth() + 1) + "/" + genarateUniqueHash() + ext;
        newFileName = '/images/' + shortMonth[new Date().getMonth()] + "_" + new Date().getFullYear() + "/" + genarateUniqueHash() + ext;
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

    //Create folder to store image as per year and month
    if (! fs.existsSync(path.resolve(__dirname, '..') + "/public/images/" + shortMonth[new Date().getMonth()] + "_" + new Date().getFullYear())) {
        fs.mkdir(path.resolve(__dirname, '..') + "/public/images/" + shortMonth[new Date().getMonth()] + "_" + new Date().getFullYear());
        //console.log("Folder Created");
    }

    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    var length = req.files.file.length;
    // Checks to see if multiple files were uploaded
    if (length != undefined) {
        var location = [];
        req.files.file.forEach(function(value, index, array) {
            //Default location files will be stored. The path will start at the location relative to this script. make sure you have an images folder.
            //var serverPath = __dirname + '/images/' + value.name;
            var serverPath = __dirname + '/images/' + shortMonth[new Date().getMonth()] + "_" + new Date().getFullYear() + "/"+ value.name;

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