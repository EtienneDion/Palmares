module.exports = function(app, configs, bd){

    var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , TwitterStrategy = require('passport-twitter').Strategy
    , FacebookStrategy = require('passport-facebook').Strategy
    , GoogleStrategy = require('passport-google').Strategy
    , LinkedInStrategy = require('passport-linkedin').Strategy
    , GitHubStrategy = require('passport-github').Strategy;

    // Passport session setup.
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.  Typically,
    //   this will be as simple as storing the user ID when serializing, and finding
    //   the user by ID when deserializing.
    passport.serializeUser(function(user, done) {
        done(null, user.id);

    });

    passport.deserializeUser(function(id, done) {
        app.functions.findById(id, function (err, user) {
            done(err, user);
        }, done);
    });

    // Use the LocalStrategy within Passport.
    //   Strategies in passport require a `verify` function, which accept
    //   credentials (in this case, a username and password), and invoke a callback
    //   with a user object.  In the real world, this would query a database;
    //   however, in this example we are using a baked-in set of users.
    passport.use(new LocalStrategy(
        function(username, password, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {

                // Find the user by username.  If there is no user with the given
                // username, or the password is not correct, set the user to `false` to
                // indicate failure and set a flash message.  Otherwise, return the
                // authenticated `user`.
                app.functions.findByUsername(username, function(err, user) {
                    if (err) { return done(err); }
                    if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
                    if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
                    return done(null, user);
                })
            });
        }
    ));

    passport.use(new TwitterStrategy({
            consumerKey: configs.TWITTER_CONSUMER_KEY,
            consumerSecret: configs.TWITTER_CONSUMER_SECRET,
            callbackURL: configs.BASE_URL+"auth/twitter/callback"
        },
        function(token, tokenSecret, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {

                // To keep the example simple, the user's Twitter profile is returned to
                // represent the logged-in user.  In a typical application, you would want
                // to associate the Twitter account with a user record in your database,
                // and return that user instead

                app.users.insert({
                    id: profile.id,
                    type: "twitter",
                    username: profile.username,
                    password: "login_twitter",
                    email: "Non disponible"
                });

                app.functions.socketEmit("userConnect", profile.id, profile.username +" has just connect");

                app.currentUsers.push({
                    id: profile.id,
                    type: "twitter",
                    username: profile.username
                });

                app.functions.socketUpdateUsers();

                return done(null, profile);
            });
        }
    ));

    //   Use the FacebookStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, an accessToken, refreshToken, and Facebook
    //   profile), and invoke a callback with a user object.
    passport.use(new FacebookStrategy({
            clientID: configs.FACEBOOK_APP_ID,
            clientSecret: configs.FACEBOOK_APP_SECRET,
            callbackURL: configs.BASE_URL+"auth/facebook/callback"
        },
        function(accessToken, refreshToken, profile, done) {


            app.accessToken = accessToken;
            app.refreshToken = refreshToken;
            app.profile = profile;




            // asynchronous verification, for effect...
            process.nextTick(function () {

                // To keep the example simple, the user's Facebook profile is returned to
                // represent the logged-in user.  In a typical application, you would want
                // to associate the Facebook account with a user record in your database,
                // and return that user instead.


                var access_token = app.FB.setAccessToken(app.accessToken);
                app.FB.api('me', { fields: ['name', 'location', 'id', 'gender', 'birthday', 'education', 'work', 'email', 'likes', 'groups', 'political', 'friends'] }, function (res) {
                    if(!res || res.error) {
                        console.log(!res ? 'error occurred' : res.error);
                        return;
                    }
                     /*
                    console.log("@ graph name :",res.name);
                    console.log("@ graph location :",res.location);
                    console.log("@ graph id :",res.id);
                    console.log("@ graph gender :",res.gender);
                    console.log("@ graph birthday :",res.birthday);
                    console.log("@ graph education :",res.education);
                    console.log("@ graph work :",res.work);
                    console.log("@ graph email :",res.email);
                    console.log("@ graph likes :",res.likes.data);
                    console.log("@ graph groups :",res.groups.data);
                    console.log("@ graph friends :",res.friends.data);
                    console.log("@ graph political :",res.political);

                    */
                    app.users.insert({
                        id: profile.id,
                        type: "facebook",
                        username: profile.username,
                        password: "login_facebook",
                        email: res.email
                    });

                    app.functions.socketEmit("userConnect", profile.id, profile.username +" has just connect");

                    app.currentUsers.push({
                        id: profile.id,
                        type: "facebook",
                        username: profile.username
                    });

                    app.functions.socketUpdateUsers();

                    return done(null, profile);
                });





            });
        }
    ));

    passport.use(new GoogleStrategy({
            returnURL: configs.BASE_URL+"auth/google/return",
            realm: configs.BASE_URL
        },
        function(identifier, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {

                // To keep the example simple, the user's Google profile is returned to
                // represent the logged-in user.  In a typical application, you would want
                // to associate the Google account with a user record in your database,
                // and return that user instead.
                profile.id = identifier;

                app.users.insert({
                    id: profile.id,
                    type: "google",
                    username: profile.displayName,
                    password: "login_google",
                    email: profile.emails[0].value
                });

                app.functions.socketEmit("userConnect", profile.id, profile.displayName +" has just connect");

                app.currentUsers.push({
                    id: profile.id,
                    type: "google",
                    username: profile.displayName
                });

                app.functions.socketUpdateUsers();

                return done(null, profile);
            });
        }
    ));

    // Use the LinkedInStrategy within Passport.
    //   Strategies in passport require a `verify` function, which accept
    //   credentials (in this case, a token, tokenSecret, and LinkedIn profile), and
    //   invoke a callback with a user object.
    passport.use(new LinkedInStrategy({
            consumerKey: configs.LINKEDIN_API_KEY,
            consumerSecret: configs.LINKEDIN_SECRET_KEY,
            callbackURL: configs.BASE_URL+"auth/linkedin/callback"
        },
        function(token, tokenSecret, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {

                // To keep the example simple, the user's LinkedIn profile is returned to
                // represent the logged-in user.  In a typical application, you would want
                // to associate the LinkedIn account with a user record in your database,
                // and return that user instead.

                app.users.insert({
                    id: profile.id,
                    type: "linkedin",
                    username: profile.displayName,
                    password: "login_linkedin",
                    email: "Non disponible"
                });

                app.functions.socketEmit("userConnect", profile.id, profile.displayName +" has just connect");

                app.currentUsers.push({
                    id: profile.id,
                    type: "linkedin",
                    username: profile.displayName
                });

                app.functions.socketUpdateUsers();

                return done(null, profile);
            });
        }
    ));

    // Use the GitHubStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, an accessToken, refreshToken, and GitHub
    //   profile), and invoke a callback with a user object.
    passport.use(new GitHubStrategy({
            clientID: configs.GITHUB_CLIENT_ID,
            clientSecret: configs.GITHUB_CLIENT_SECRET,
            callbackURL: configs.BASE_URL+"auth/github/callback"
        },
        function(accessToken, refreshToken, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {

                // To keep the example simple, the user's GitHub profile is returned to
                // represent the logged-in user.  In a typical application, you would want
                // to associate the GitHub account with a user record in your database,
                // and return that user instead.
                //console.log(profile);
                app.users.insert({
                    id: profile.id,
                    type: "github",
                    username: profile.username,
                    password: "login_github",
                    email: profile.emails[0].value
                });

                app.functions.socketEmit("userConnect", profile.id, profile.username +" has just connect");

                app.currentUsers.push({
                    id: profile.id,
                    type: "github",
                    username: profile.username
                });

                app.functions.socketUpdateUsers();

                return done(null, profile);
            });
        }
    ));


    return passport;
}
