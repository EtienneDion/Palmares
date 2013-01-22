var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , util = require('util')
  , lessMiddleware = require('less-middleware')
  , flash = require('connect-flash')
  , configs = require('./conf.js')
  , Mongolian = require("mongolian")
  , mongolian = new Mongolian(configs.DB_URL)
  , app = express()
  , FB = require('fb')
  , io = require('socket.io')
  , server = http.createServer(app)
  , events = require('events')
  , eventEmitter = new events.EventEmitter;

app.FB =FB;
app.io = io;
app.eventEmitter = eventEmitter;

// Get database
bd = mongolian.db(configs.DB);
bd.auth(configs.DB_USER, configs.DB_PASS);

var users = bd.collection("users");
app.users = users;
app.currentUsers=[];
// functions
app.functions = require('./functions')(app, bd);
// auth
var passport = require('./passport')(app, configs);
//console.log(app);


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

// normal routes
app.get('/', routes.index);
app.get('/palmares', routes.palmares);
app.get('/account', app.functions.ensureAuthenticated, routes.account);
app.post('/', passport.authenticate('local', { failureRedirect: '/admin', failureFlash: true }), routes.indexPost);

// login
app.get('/admin', routes.logIn);
app.post('/admin', passport.authenticate('local', { failureRedirect: '/admin', failureFlash: true }),routes.loginPost);
app.get('/auth/twitter', passport.authenticate('twitter'), routes.authRedirect);
app.get('/auth/twitter/callback',passport.authenticate('twitter', { failureRedirect: '/', failureFlash: true }), routes.indexPost);
app.get('/auth/facebook', passport.authenticate('facebook',
    { scope: ['user_birthday','user_education_history', 'user_work_history', 'email','user_likes','user_groups','read_friendlists','user_religion_politics' ] }),
    routes.authRedirect);
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/', failureFlash: true }), routes.indexPost);
app.get('/auth/google', passport.authenticate('google', { failureRedirect: '/login' }), routes.indexPost);
app.get('/auth/google/return', passport.authenticate('google', { failureRedirect: '/login' }), routes.indexPost);
app.get('/auth/linkedin', passport.authenticate('linkedin'), routes.authRedirect);
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), routes.indexPost);
app.get('/auth/github', passport.authenticate('github'), routes.authRedirect);
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), routes.indexPost);
//logout
app.get('/logout', app.functions.ensureAuthenticated, routes.logOut);

//ajax
app.post('/ajax/add_categorie', app.functions.ensureAuthenticated, routes.ajaxAddCategorie);
app.post('/ajax/add_tool', app.functions.ensureAuthenticated, routes.ajaxAddTool);
app.post('/ajax/sort', app.functions.ensureAuthenticated, routes.ajaxVotes);
app.post('/ajax/get_categorie', app.functions.ensureAuthenticated, routes.ajaxRefreshCat);
app.post('/ajax/approve_categorie', app.functions.ensureAuthenticated, routes.ajaxApproveCat);



app.io = app.io.listen(server);

app.functions.socketInit(function(){});

server.listen(3000);
console.log('Express app started on port 3000');

console.log('Node Version: ' + process.version);
console.log(configs);