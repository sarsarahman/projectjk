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
                            console.log(user)

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



function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.json({
        error: "Not Authenticated!!!"
    });
}




var app = module.exports = express();

/**
 * Configuration
 */

// all environments
app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.logger('dev'));
    app.use(cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());


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





// passport.use('adminlogin', new LocalStrategy({
//         passReqToCallback: true
//     },
//     function(req, username, password, done) {
//         // check in mongo if a user with username exists or not
//         User.findOne({
//                 'username': username
//             },
//             function(err, user) {
//                 // In case of any error, return using the done method
//                 if (err)
//                     return done(err);
//                 // Username does not exist, log error & redirect back
//                 if (!user) {
//                     console.log('User Not Found with username ' + username);
//                     return done(null, false,
//                         req.flash('message', 'User Not found.'));
//                 }
//                 // User exists but wrong password, log the error 
//                 if (!isValidPassword(user, password)) {
//                     console.log('Invalid Password');
//                     return done(null, false,
//                         req.flash('message', 'Invalid Password'));
//                 }
//                 // User and password both match, return user from 
//                 // done method which will be treated like success
//                 return done(null, user);
//             }
//         );
//     }));


// development only
if (app.get('env') === 'development') {
    app.use(express.errorHandler());
};

// production only
if (app.get('env') === 'production') {
    // TODO
};

// Routes
app.get('/', routes.index);
app.get('/partial/:name', routes.partial);




// Login
app.post('/api/login',
    passport.authenticate('userlogin'),
    function(req, res) {
        console.log(req.user);
        res.status(200).send(req.user);

    });
// Mobile App API
app.get('/api/categoryarticles/:cat',
    ensureAuthenticated, 
    api.getCategoryArticles);

app.get('/api/like/:id', api.likeArticle);
app.get('/api/dislike/:id', api.dislikeArticle);
app.get('/api/bookmark/:id', api.bookmarkArticle);


app.get('/api/liked', api.likedArticles);
app.get('/api/disliked', api.dislikedArticles);
app.get('/api/bookmarked', api.bookmarkedArticles);





// JSON API
app.get('/api/refresh', api.refreshFeeds);


app.get('/api/articles/pending', api.getUnreadArticles);
app.get('/api/articles/approved', api.getReadArticles);
app.get('/api/articles/starred', api.getStarredArticles);
app.post('/api/articles', api.addArticle);
app.post('/api/articles/:id', api.updateArticle);
app.delete('/api/articles/:id', api.delArticle);
app.get('/api/articles/:id', api.getArticle);

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


app.post('/api/images', api.singleImageUpload);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

/**
 * Start Server
 */

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});