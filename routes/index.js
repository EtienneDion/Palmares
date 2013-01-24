module.exports = function(app){


    return {
        index:index,
        palmares:palmares,
        indexPost:indexPost,
        account:account,
        logIn:logIn,
        loginPost:loginPost,
        authRedirect:authRedirect,
        logOut:logOut,
        ajaxAddCategorie:ajaxAddCategorie,
        ajaxAddTool:ajaxAddTool,
        ajaxVotes:ajaxVotes,
        ajaxRefreshCat:ajaxRefreshCat,
        ajaxApproveCat:ajaxApproveCat
    };

    function index(req, res, next){

        var userId = app.utils.getUserId(req.user);

        var next = function(){
            res.render('index', {   user: req.user, data: app.data, view: "user"    });
        };

        app.functions.getData(userId, next);

    }
    function palmares(req, res, next){

        var next = function(){
            res.render('index', {   user: req.user, data: app.data, view: "global"    });
        };

        var userId = app.utils.getUserId(req.user);
        //console.log("user : "+userId);
        app.functions.getData(null, next);

    }
    function indexPost(req, res, next) {
        res.redirect('/');
    }
    function account(req, res, next){
        res.render('account', { user: req.user, view: null  });
    }
    function logIn(req, res, next){
        res.render('admin', { user: req.user, message: req.flash('error'), view: null });
    }
    function loginPost(req, res, next){
        res.redirect('/');
    }
    function authRedirect(req, res, next){
        // The request will be redirected to Twitter for authentication, so this
        // function will not be called.
    }
    function logOut(req, res, next){

        var cb = function(){
            app.functions.socketUpdateUsers();
            req.logout();
            res.redirect('/');
        }

        var userId = app.utils.getUserId(req.user);

        app.utils.logoutUser(userId, cb);

    }

    function ajaxAddCategorie(req, res, next){
        var name = req.body.name;
        if(name !== "" && name !== undefined && name !== null ){

            var userId = app.utils.getUserId(req.user);

            var cb = function(userId, count){
                var next = function(){
                    var cat = count+1;
                    res.render('ajax', { result: "ok", cat:cat });

                    app.functions.socketEmit("catAdded", userId, req.user.username +" has just suggest '"+ name +"' as a new category." );
                };

                app.functions.getData(userId, next);
            }

            app.functions.addCategorie(name, userId, cb);


        } else {
            res.render('ajax', { result: "error", cat:null });
        }

    }

    function ajaxAddTool(req, res, next){
        var name = req.body.name;
        var url = req.body.url;
        var cat = req.body.cat;
        var userId = app.utils.getUserId(req.user);

        if(name !== "" && name !== undefined && name !== null && url !== "" && url !== undefined && url !== null && cat !== "" && cat !== undefined && cat !== null ){

            var cb = function(userId){
                var next = function(){
                    res.render('ajax', { result: "ok", cat:null });

                    app.functions.socketEmit("toolAdded", userId, req.user.username +" has just added '"+ name +"' in " + app.utils.getCatName(cat) );

                };

                console.log("user : "+userId);
                app.functions.getData(userId, next);

            }

            app.functions.addTool(cat, name, url, userId, cb);


        } else {
            res.render('ajax', { result: "error", cat:null });
        }

    }

    function ajaxVotes(req, res, next){

        var userId = req.user.id;
        var order = req.body.order;
        var cat = req.body.cat;

        if(cat !== "" && cat !== undefined && cat !== null  ){

            var cb = function(userId){
                var next = function(){
                    res.render('ajax', { result: "ok", cat:null });
                };
                console.log("user : "+userId);
                app.functions.getData(userId, next);
            }

            app.functions.vote(userId, cat, order, cb);

        }  else {
            res.render('ajax', { result: "error", cat:null });
        }

    }

    function ajaxRefreshCat(req, res, next){

        var cat = req.body.cat;

        var next = function(){
            res.render('cat', { user: req.user, data: app.data, cat:parseInt(cat) });
        };

        var userId = app.utils.getUserId(req.user);

        app.functions.getData(userId,next);

    }

    function ajaxApproveCat(req, res, next){

        var cat = req.body.cat;

        var userId = app.utils.getUserId(req.user);

        var next = function(cat){
            res.render('ajax', { result: "ok", cat:parseInt(cat) });
        };

        app.functions.approuveCat(userId, cat, next);
    }
};
