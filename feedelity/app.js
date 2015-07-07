																																																																																																																																																																																																																																																																																																																																																																																																									/**
 * Module dependencies
 */

var express = require('express'),
  routes = require('./routes'),
  api = require('./routes/api'),
  http = require('http'),
  path = require('path');

var app = module.exports = express();

/**
* Configuration
*/

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

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

// JSON API
app.get('/api/refresh', api.refreshFeeds);
app.get('/api/articles/pending', api.getUnreadArticles);
app.get('/api/articles/approved', api.getReadArticles);
app.get('/api/articles/starred', api.getStarredArticles);
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

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
