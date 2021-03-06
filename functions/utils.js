module.exports = function(app){

    now = new Date();
    milliSecondSinceLastWeek = app.configs.milliSecondSinceLastWeek;

    return {
        //functions
        isAdmin:isAdmin,
        findById:findById,
        getUsername:getUsername,
        findByUsername:findByUsername,
        logInUser:logInUser,
        logOutUser:logOutUser,
        ensureAuthenticated:ensureAuthenticated,
        sortByProp:sortByProp,
        giveToolsPodium:giveToolsPodium,
        sortTools:sortTools,
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

    function logInUser(user){

        app.db_middleware.insert(app.users, {
            id: user.id,
            type: user.type,
            username: user.username,
            password: user.password,
            email: user.email
        });

        app.functions.socketEmit("userConnect", user.id, user.username +" has just connect");

        app.currentUsers.push({
            id: user.id,
            type: user.type,
            username: user.username
        });

        app.functions.socketUpdateUsers();
    }

    function logOutUser(id, cb){
        for(var i=0;i<app.currentUsers.length;i++){
            if(app.currentUsers[i].id.toString() === id.toString()){
                app.currentUsers.splice(i,1);
            }
        }
        cb();
    }

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/login')
    }



    //sort Array By Property
    function sortByProp(array, p){
        return array.sort(function(a,b){
            return (a[p] < b[p]) ? 1 : (a[p] > b[p]) ? -1 : 0;
        });
    }

    function giveToolsPodium(currentTools){
        currentTools = sortByProp(currentTools, "note");

        for(var i=0;i<currentTools.length;i++){
            currentTools[i].podium = "";
        }

        if( currentTools.length > 3){
            currentTools[0].podium = "first";
            currentTools[1].podium = "second";
            currentTools[2].podium = "third";
        }


        return currentTools;
    }

    function sortTools(userId, currentTools){

        currentTools = giveToolsPodium(currentTools);

        if(userId !== null){
            currentTools = sortByProp(currentTools, "mynote");
        } else {
            currentTools = sortByProp(currentTools, "note");
        }

        return currentTools;
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