module.exports = function(app){


    return {index:index,
        indexPost:indexPost,
        account:account,
        logIn:logIn,
        loginPost:loginPost,
        authRedirect:authRedirect,
        logOut:logOut,
        ajaxCategorie:ajaxCategorie,
        ajaxTool:ajaxTool,
        ajaxVotes:ajaxVotes
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

    function ajaxCategorie(req, res, next){
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

    }

    function ajaxTool(req, res, next){
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

    }

    function ajaxVotes(req, res, next){
    }



};
