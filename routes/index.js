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
        ajaxRefreshCat:ajaxRefreshCat
    };

    function index(req, res, next){
        //console.log("data", app.data);

        var next = function(){
            res.render('index', {   user: req.user, data: app.data, view: "user"    });
        };

        var userId = app.functions.getUserId(req.user);
        console.log("user : "+userId);
        app.functions.getData(userId, next);


    }
    function palmares(req, res, next){
        //console.log("data", app.data);

        var next = function(){
            res.render('index', {   user: req.user, data: app.data, view: "global"    });
        };

        var userId = app.functions.getUserId(req.user);
        console.log("user : "+userId);
        app.functions.getData(null, next);


    }
    function indexPost(req, res, next) {
        res.redirect('/');
    }
    function account(req, res, next){
        res.render('account', { user: req.user, view: null  });
    }
    function logIn(req, res, next){
        res.render('login', { user: req.user, message: req.flash('error'), view: null });
    }
    function loginPost(req, res, next){
        res.redirect('/');
    }
    function authRedirect(req, res, next){
        // The request will be redirected to Twitter for authentication, so this
        // function will not be called.
    }
    function logOut(req, res, next){
        req.logout();
        res.redirect('/');
    }

    function ajaxAddCategorie(req, res, next){
        var name = req.body.name;
        if(name !== "" && name !== undefined && name !== null ){

            app.categories.count( function(error, count){
                app.categories.insert({
                    id: count+1,
                    name: name
                });
                var next = function(){
                    var cat = count+1;
                    res.render('ajax', { result: "ok", cat:cat });
                };

                var userId = app.functions.getUserId(req.user);
                console.log("user : "+userId);
                app.functions.getData(userId, next);


            });
        } else {
            res.render('ajax', { result: "error", cat:null });
        }

    }

    function ajaxAddTool(req, res, next){
        var name = req.body.name;
        var url = req.body.url;
        var cat = req.body.cat;
        if(name !== "" && name !== undefined && name !== null && url !== "" && url !== undefined && url !== null && cat !== "" && cat !== undefined && cat !== null ){

            app.tools.count( function(error, count){
                app.tools.insert({
                    id: count+1,
                    name: name,
                    url:url,
                    categorie:parseInt(cat)
                });
                var next = function(){
                    res.render('ajax', { result: "ok", cat:null });
                };

                var userId = app.functions.getUserId(req.user);
                console.log("user : "+userId);
                app.functions.getData(userId, next);
            });
        } else {
            res.render('ajax', { result: "error", cat:null });
        }

    }

    function ajaxVotes(req, res, next){

        var userId = req.user.id;
        var order = req.body.order;
        var cat = req.body.cat;

        app.votes.remove({ cat:parseInt(cat), user:userId});

        if(cat !== "" && cat !== undefined && cat !== null  ){
            for(var i=0; i < order.length; i++ ){
                console.log("{ id:"+ order[i].id
                    +",pos:"+ (i+1)
                    +",cat:"+ cat
                    +",user:"+ userId
                    +"}");

                    app.votes.insert({
                        id: parseInt(order[i].id),
                        pos: (i+1),
                        cat:parseInt(cat),
                        user:userId
                    });

            }
            var next = function(){
                res.render('ajax', { result: "ok", cat:null });
            };
            console.log("user : "+userId);
            app.functions.getData(userId, next);
        }  else {
            res.render('ajax', { result: "error", cat:null });
        }

    }

    function ajaxRefreshCat(req, res, next){

        var cat = req.body.cat;

        var next = function(){
            res.render('cat', {   data: app.data, cat:cat-1    });
        };


        var userId = app.functions.getUserId(req.user);
        console.log("user : "+userId);
        app.functions.getData(userId,next);

    }
};
