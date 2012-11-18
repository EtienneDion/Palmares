module.exports = function(app){


    return {index:index,
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
        console.log(app.data);
        res.render('index', {   user: req.user, data: app.data    });
    }
    function indexPost(req, res, next) {
        res.redirect('/');
    }
    function account(req, res, next){
        res.render('account', { user: req.user });
    }
    function logIn(req, res, next){
        res.render('login', { user: req.user, message: req.flash('error') });
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
                res.render('ajax', { result: "ok" });
            });
        } else {
            res.render('ajax', { result: "error" });
        }
        app.data = app.functions.getData();
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
                res.render('ajax', { result: "ok" });
            });
        } else {
            res.render('ajax', { result: "error" });
        }
        app.data = app.functions.getData();
    }

    function ajaxVotes(req, res, next){

        var userId = req.user.id;
        var order = req.body.order;
        var cat = req.body.cat;

        app.votes.remove({ cat:parseInt(cat), user:userId});

        if(cat !== "" && cat !== undefined && cat !== null  ){
            for(var i=0; i < order.length; i++ ){
                console.log("{ id:"+ order[i].id
                    +",pos:"+ i+1
                    +",cat:"+ cat
                    +",user:"+ userId
                    +"}");

                    app.votes.insert({
                        id: parseInt(order[i].id),
                        pos: i+1,
                        cat:parseInt(cat),
                        user:userId
                    });

            }
            res.render('ajax', { result: "ok" });
        }  else {
            res.render('ajax', { result: "error" });
        }
        app.data = app.functions.getData();
    }

    function ajaxRefreshCat(req, res, next){

        var cat = req.body.cat;

        app.data = app.functions.getData();

        // TODO : refactoring without timeout
        setTimeout(function(){

            res.render('cat', {   data: app.data, cat:cat-1    });

        },600);
    }
};
