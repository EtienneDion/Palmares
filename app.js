var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , util = require('util')
  , lessMiddleware = require('less-middleware')
  , flash = require('connect-flash')
  , configs = require('./conf.js')
  , Mongolian = require("mongolian")
  , mongolian = new Mongolian(configs.DB_URL)
  , app = express();


// Get database
bd = mongolian.db(configs.DB);
bd.auth(configs.DB_USER, configs.DB_PASS);

app.tools = bd.collection("tools");
app.categories = bd.collection("categories");
var users = bd.collection("users");
app.votes = bd.collection("votes");

// functions
var functions = require('./functions')(app);
// auth
var passport = require('./passport')(app, configs, users, functions);


var categoriesArray = [];
var categoriesList = app.categories.find();

categoriesList.forEach(function(x){

    var toolsArray = [];
    var toolsList = app.tools.find({ categorie: x.id });
    var nbOfTools = 0;

    toolsList.forEach(function(y){
        nbOfTools++;
    });

    toolsList.forEach(function(y){

        var note = 0,
        votesList = app.votes.find({ id: y.id });
        votesList.forEach(function(z){

            var tempNote = nbOfTools+1 - z.pos;
            note = note + tempNote;

        }, function(){
            toolsArray.push({name:y.name, id:y.id, note: note });
        });

    },function(){
        setTimeout(function(){

            functions.sortByProp(toolsArray, "note");
            console.log(toolsArray);
            categoriesArray.push({name:x.name, id:x.id, tools: toolsArray });

        },200);
    });

});

app.data = categoriesArray;
app.users = users;



// configure Express
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.engine('ejs', require('ejs-locals'));
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({ secret: 'keyboard cat' }));
    app.use(flash());
    // Initialize Passport!  Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(lessMiddleware({
        dest: __dirname + '/public/css',
        src: __dirname + '/less',
        prefix: '/css',
        compress: true
    }));
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
});

var routes = require('./routes')(app);

app.get('/', routes.index);
app.get('/account', functions.ensureAuthenticated, routes.account);
app.get('/login', routes.logIn);
app.post('/', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), routes.indexPost);
app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),routes.loginPost);
app.get('/auth/twitter', passport.authenticate('twitter'), routes.authRedirect);
app.get('/auth/twitter/callback',passport.authenticate('twitter', { failureRedirect: '/', failureFlash: true }), routes.indexPost);
app.get('/auth/facebook', passport.authenticate('facebook'), routes.authRedirect);
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/', failureFlash: true }), routes.indexPost);
app.get('/auth/google', passport.authenticate('google', { failureRedirect: '/login' }), routes.indexPost);
app.get('/auth/google/return', passport.authenticate('google', { failureRedirect: '/login' }), routes.indexPost);
app.get('/auth/linkedin', passport.authenticate('linkedin'), routes.authRedirect);
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), routes.indexPost);
app.get('/auth/github', passport.authenticate('github'), routes.authRedirect);
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), routes.indexPost);
app.get('/logout', routes.logOut);

app.post('/ajax/categories', functions.ensureAuthenticated, routes.ajaxCategorie);
app.post('/ajax/tools', functions.ensureAuthenticated, routes.ajaxTool);
app.post('/ajax/votes', functions.ensureAuthenticated, routes.ajaxVotes);

app.listen(3000);

console.log('Node Version: ' + process.version);
console.log(configs);