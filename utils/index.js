module.exports = function(app){

    now = new Date();
    milliSecondSinceLastWeek = 10000; //604800000

    return {
        //functions
        isAdmin:isAdmin,
        findById:findById,
        getUsername:getUsername,
        findByUsername:findByUsername,
        ensureAuthenticated:ensureAuthenticated,
        logoutUser:logoutUser,
        sortByProp:sortByProp,
        getCatName:getCatName,
        getToolName:getToolName,
        getUserId:getUserId
    };

    function isAdmin(id, next, next2) {

        app.db_middleware.findOne(app.users, id, { id:id }, function(err, user) {
            if(err === null) {
                //console.log(user);
                if(user !== null && user !== undefined){
                    if(user.admin){
                        next(true, next2);
                    } else {
                        next(false, next2);
                    }
                } else {
                    next(false, next2);
                }
            }  else {
                next(false, next2);
            }

        }, next, next2);
    }

    //auth functions
    function findById(id, fn, done) {

        app.db_middleware.findOne(app.users, id, { id:id}, function(err, user) {
            if(err === null)       {
                fn(null, user);
            }  else {
                fn(new Error('User ' + id + ' does not exist'));
                done(null, id);
            }

        }, fn, done);

    }

    function getUsername(id){

        for(var i=0;i<app.currentUsers.length;i++){
            if(app.currentUsers[i]["id"] === id){
                return app.currentUsers[i]["username"];
            }
        }
    }

    function findByUsername(username, fn) {
        app.db_middleware.findOne(app.users, null, { username:username }, function(err, user) {

            if(err !== null)       {
                return fn(null, null);
            }  else {
                return fn(null, user);
            }

        }, fn, null);

    }

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/login')
    }

    function logoutUser(id, cb){
        for(var i=0;i<app.currentUsers.length;i++){
            if(app.currentUsers[i].id.toString() === id.toString()){
                app.currentUsers.splice(i,1);
            }
        }
        cb();
    }

    //sortByProp
    function sortByProp(array, p){
        return array.sort(function(a,b){
            return (a[p] < b[p]) ? 1 : (a[p] > b[p]) ? -1 : 0;
        });
    }

    function getCatName(cat){

        for(var i=0;i<app.data.length;i++){

            if(app.data[i]["id"].toString() === cat.toString()){
                return app.data[i]["name"];
            }
        }
    }

    function getToolName(id){

        for(var i=0;i<app.data.length;i++){
            for(var y=0;y<app.data[i].tools.length;y++){

                if(app.data[i].tools[y]["id"].toString() === id.toString()){
                    return app.data[i].tools[y]["name"];
                }
            }
        }
    }

    function getUserId(user){
        var userId = null;
        if(user !== undefined ){
            userId = user.id;
        }

        return userId;
    }

}