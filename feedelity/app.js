/**
 * Module dependencies
 */

var express = require('express'),
    routes = require('./routes'),
    api = require('./routes/api'),
    http = require('http'),
    https = require('https'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    flash = require('connect-flash'),
    LocalStrategy = require('passport-local').Strategy;


passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use('userlogin', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'access_token',
        passReqToCallback: true
    },
    function(req, username, password, done) {

        var YOUR_APP_ID = '110406559309977',
            YOUR_APP_SECRET = '95ce8ace2c4d35b132b7ad4a3411ddd6',
            grant_type = 'client_credentials',
            INPUT_TOKEN = req.body.access_token,
            ACCESS_TOKEN = '110406559309977|p0yNFQU5M_GtxAyak3TCWBdGqWY',
            debugResponse = '',
            userData = req.body;

        https.get("https://graph.facebook.com/debug_token?input_token=" + INPUT_TOKEN + "&access_token=" + ACCESS_TOKEN, function(fb_2_res) {
            fb_2_res.on("data", function(chunk) {

                try {
                    debugResponse = JSON.parse(chunk + '');
                } catch (err) {
                    debugResponse = {
                        error: err
                    }
                }

                if (debugResponse.data) {

                    if (YOUR_APP_ID == debugResponse.data.app_id && userData.id == debugResponse.data.user_id) {

                        var resUserData = api.userLogin(userData, function(user) {
                            // console.log(user)

                            return done(null, {
                                debugResponse: debugResponse,
                                userData: user
                            });
                        });

                    } else {
                        return done(null, false, {
                            debugResponse: debugResponse,
                            error: 'invalid_details'
                        });
                    };
                } else {
                    return done(null, false, {
                        debugResponse: debugResponse,
                        error: 'invalid_details'

                    });
                };
            });
        });
    }));

// passport.use('adminlogin', new LocalStrategy({
passport.use('stafflogin', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
    },
    function(req, username, password, done) {
        // console.log(req.body)
        // var resUserData = api.adminLogin(req.body, function(user) {
        var resUserData = api.staffLogin(req.body, function(user) {
            // console.log(user)

            if (!!user) {
                return done(null, user);

            } else {

                return done(null, false, {
                    error: 'Invalid credentials!!!'
                });
            };

        });

    }));

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.role = 'user') {
            return next();
        } else {
            res.json({
                error: "Not Authenticated!!!"
            });
        }
    } else {
        res.json({
            error: "Not Authenticated!!!"
        });
    }
}

function ensureAdminAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.role = 'admin') {
            return next();
        } else {
            res.redirect('/login');
        }
    } else {
        res.redirect('/login');
    }

}




var app = module.exports = express();

/**
 * Configuration
 */

// all environments
app.configure(function() {
    process.env.TMPDIR = '.'; //for defining temp folder to rename image while uploading
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.logger('dev'));
    app.use(cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    // app.use(express.json());


    app.use(express.static(path.join(__dirname, 'public')));

    //Passport config
    app.use(express.session({
        secret: 'keyboard cat'
    }));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);

});


// development only
if (app.get('env') === 'development') {
    app.use(express.errorHandler());
};

// production only
if (app.get('env') === 'production') {
    // TODO
};

// Routes
app.get('/', ensureAdminAuthenticated, routes.index);

app.get('/partial/:name', routes.partial);

app.get('/login', routes.login);

app.post('/login',
    // passport.authenticate('adminlogin', {
    passport.authenticate('stafflogin', {
        successRedirect: '/'
    }),
    function(req, res) {
        // console.log(req.user);
        res.status(200).send('req');

    });

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// Login
app.post('/api/login',
    passport.authenticate('userlogin'),
    function(req, res) {
        // console.log(req.user);
        res.status(200).send(req.user);

    });

// Mobile App API
app.get('/api/searcharticles/:searchdata/:page',
    api.getSearchArticles);

app.get('/api/categoryarticles/:cat/:page',
    api.getCategoryArticles);

app.get('/api/recentarticles/:page',
    api.getRecentArticles);

app.get('/api/trendarticles/:page',
    api.getTrendArticles);

app.get('/api/bookmarked/:page',
    api.bookmarkedArticles);


app.get('/api/maxlimit/searcharticles/:searchdata',
    api.getSearchArticlesMaxLimit);

app.get('/api/maxlimit/categoryarticles/:cat',
    api.getCategoryArticlesMaxLimit);

app.get('/api/maxlimit/recentarticles',
    api.getRecentArticlesMaxLimit);

app.get('/api/maxlimit/trendarticles',
    api.getTrendArticlesMaxLimit);

app.get('/api/maxlimit/bookmarked',
    api.bookmarkedArticlesMaxLimit);




app.get('/api/like/:id', api.likeArticle);
app.get('/api/dislike/:id', api.dislikeArticle);
app.get('/api/bookmark/:id', api.bookmarkArticle);

app.get('/api/preferredtags', api.getPreferredTag);
app.get('/api/alltags', api.getAllTags);
app.post('/api/preferredtags', api.updatePreferredTag);
app.post('/api/updateuserlocation', api.updateUserLocation);

app.get('/api/liked', api.likedArticles);
app.get('/api/disliked', api.dislikedArticles);

// JSON API
app.get('/api/refresh', api.refreshFeeds);

app.get('/api/users/:page', api.fetchUsers);
app.get('/api/getlikes', api.fetchLikes);

app.get('/api/getuserlocations', api.getUserLocations);
app.post('/api/filterlocations', api.filterLocations);

app.get('/api/fetchstaffs/:page', api.fetchStaffs);
app.get('/api/getstaffs', api.getStaffs);
app.post('/api/staffs', api.addStaff);
app.get('/api/staffs/:id', api.getStaff);
app.put('/api/staffs/:id', api.updateStaff);
app.delete('/api/staffs/:id', api.delStaff);
app.put('/api/banstaffs/:id', api.banStaff);
app.put('/api/unbanstaffs/:id', api.unbanStaff);

// app.get('/api/getstaffrole', api.getstaffRole);
// app.put('/api/staffrole/:staffid', api.updatestaffRole);

app.get('/api/counts', api.getCounts);
app.get('/api/articles/pending/:page', api.getPendingArticles);
app.get('/api/articles/approved/:page', api.getApprovedArticles);
app.get('/api/articles/starred/:page', api.getStarredArticles);
app.get('/api/articles/deleted/:page', api.getDeletedArticles);
app.post('/api/articles', api.addArticle);
app.post('/api/articles/:id', api.updateArticle);
app.post('/api/bulkupdatearticles', api.bulkupdateArticle);
app.post('/api/approveselectedarticles', api.approveArticles);
app.post('/api/disapproveselectedarticles', api.disapproveArticles);
app.put('/api/stararticle/:id', api.starArticle);
app.delete('/api/articles/:id', api.delArticle);
app.delete('/api/deleteselectedarticles', api.delselectedArticles);
app.get('/api/articles/:id', api.getArticle);

app.get('/api/dashboardarticles', api.getArticlesDashboard);
app.get('/api/recentdashboardarticles', api.getRecentArticlesDashboard);
app.post('/api/approvearticle/:id', api.approveArticleDashboard); // Dashboard

app.get('/api/trendings/:latlng', api.getTrendingTags);
app.post('/api/trendingarticles', api.getTrendingArticles);
app.get('/api/articles/tag/:tagId', api.getTrendingTagArticles);

app.get('/api/fetchtrendings', api.getTrendings);
app.get('/api/fetchtrending/:id', api.getTrending);
app.put('/api/trending', api.addTrending);
app.post('/api/trending/:id', api.updateTrending);
app.delete('/api/trending/:id', api.delTrending);
app.post('/api/enabletrending/:id', api.enableTrending);

app.get('/api/feeds', api.getFeeds);
app.post('/api/feeds', api.addFeed);
app.post('/api/feeds/:id', api.updateFeed);
app.delete('/api/feeds/:id', api.delFeed);
app.get('/api/feeds/:id', api.getFeed);

app.get('/api/categorys', api.getCategorys);
app.post('/api/categorys', api.addCategory);
app.post('/api/categorys/:id', api.updateCategory);
app.delete('/api/categorys/:id', api.delCategory);
app.get('/api/categorys/:id', api.getCategory);


app.get('/api/tags', api.getTags);
app.post('/api/tags', api.addTag);
app.post('/api/tags/:id', api.updateTag);
app.delete('/api/tags/:id', api.delTag);
app.get('/api/tags/:id', api.getTag);

app.get('/api/locations', api.getLocations);
app.post('/api/locations', api.addLocation);
app.post('/api/locations/:id', api.updateLocation);
app.delete('/api/locations/:id', api.delLocation);
app.get('/api/locations/:id', api.getLocation);

// ^GCM
app.get('/api/devices', api.getDevices);
app.post('/api/devices', api.addDevice);
app.delete('/api/devices/:registrationId', api.delDevice);
app.post('/api/sendmessage', api.sendMessage);
// $GCM


app.post('/api/images', api.singleImageUpload);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

/**
 * Start Server
 */

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});