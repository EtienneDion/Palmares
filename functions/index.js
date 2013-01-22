module.exports = function(app, bd){

    now = new Date();
    milliSecondSinceLastWeek = 10000; //604800000

    return {
        //functions
        findById:findById,
        getUsername:getUsername,
        findByUsername:findByUsername,
        ensureAuthenticated:ensureAuthenticated,
        logoutUser:logoutUser,
        sortByProp:sortByProp,
        getCatName:getCatName,
        getUserId:getUserId,
        getData:getData,
        addCategorie:addCategorie,
        addTool:addTool,
        vote:vote,
        socketInit:socketInit,
        socketEmit:socketEmit,
        socketUpdateUsers:socketUpdateUsers
    };


    function isAdmin(id, next) {
        app.users.findOne({ id:id }, function(err, user) {
            if(err === null) {
                console.log(user);
                if(user !== null && user !== undefined){
                    if(user.admin){
                        next(true);
                    } else {
                        next(false);
                    }
                } else {
                    next(false);
                }
            }  else {
                next(false);
            }

        });
    }

    //auth functions
    function findById(id, fn, done) {

        app.users.findOne({ id:id }, function(err, user) {
            if(err === null)       {
                fn(null, user);
            }  else {
                fn(new Error('User ' + id + ' does not exist'));
                done(null, id);
            }

        });
    }

    function getUsername(id){

        for(var i=0;i<=app.currentUsers.length;i++){
            if(app.currentUsers[i]["id"].toString() === id.toString()){
              return app.currentUsers[i]["username"];
            }
        }
    }

    function findByUsername(username, fn) {
        app.users.findOne({ username:username }, function(err, user) {

            if(err !== null)       {
                return fn(null, null);
            }  else {
                return fn(null, user);
            }

        });
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

            //console.log(app.data[i]["id"] ,app.data[i]["name"], cat, ( app.data[i]["id"].toString() === cat.toString() ) );
            if(app.data[i]["id"].toString() === cat.toString()){
                return app.data[i]["name"];
            }
        }
    }

    function getToolName(id){

        for(var i=0;i<app.data.length;i++){
            for(var y=0;y<app.data[i].tools.length;y++){
                //console.log(app.data[i].tools[y]["id"] ,app.data[i].tools[y]["name"], cat, ( app.data[i].tools[y].toString() === cat.toString() ) );
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

    function getData( userId, next ) {
        app.tools = bd.collection("tools");
        app.categories = bd.collection("categories");
        app.votes = bd.collection("votes");
        var categoriesArray = [];

        var categoriesList;
        var toolsList = app.tools.find();
        var votesList;

        function process(admin){
            console.log("isAdmin: "+admin, " / userId: "+userId);
            if(admin){
                categoriesList = app.categories.find();
            } else {
                categoriesList = app.categories.find({ $or:[ { approved:1 }, { $and:[{ approved:0, createdby:userId || 0 }] } ] });
            }

            if(userId !== null){
                votesList = app.votes.find({ user:userId });
            } else {
                votesList = app.votes.find();
            }

            categoriesList.forEach(function(x){
                categoriesArray.push({name:x.name, id:x.id, approved:x.approved, createdtime:x.createdtime });
            }, function(){

                var toolsArray = [];


                toolsList.forEach(function(y){
                    toolsArray.push({name:y.name, id:y.id, cat:y.categorie, createdtime:y.createdtime });
                }, function(){
                    var note = 0,
                        votesArray = [];


                    votesList.forEach(function(z){

                        votesArray.push({ id:z.id, pos: z.pos, time:z.time });

                            //console.log("/// " +new Date( z.time - milliSecondSinceLastWeek) );


                    }, function(){

                        for(var i=0;i < categoriesArray.length; i++){
                            var currentTools =[];
                            var nbOfTools = 0;
                            var nbOfLastWeekTools = 0;
                            //console.log("i:", i);
                            for(var j=0;j < toolsArray.length; j++){

                                if(toolsArray[j].cat === categoriesArray[i].id){
                                    nbOfTools++;
                                    console.log(toolsArray[j].createdtime,  new Date(toolsArray[j].createdtime ), new Date(now - milliSecondSinceLastWeek)  , ( new Date( toolsArray[j].createdtime  ) < new Date(now - milliSecondSinceLastWeek) ) );
                                    if( new Date( toolsArray[j].createdtime  ) < new Date(now - milliSecondSinceLastWeek)){
                                        nbOfLastWeekTools++;
                                    }
                                }

                            }

                            for(var l=0;l < toolsArray.length; l++){


                                if(toolsArray[l].cat === categoriesArray[i].id){

                                    var note=0;
                                    var lastWeekNote = 0;
                                    for(var m=0;m < votesArray.length; m++){
                                        if(toolsArray[l].id === votesArray[m].id){
                                            var tempNote = nbOfTools+1 - votesArray[m].pos;
                                            var lastWeekTempNote = nbOfLastWeekTools+1 - votesArray[m].pos;

                                            note = note + tempNote;

                                            if( new Date(votesArray[m].time) < new Date(now - milliSecondSinceLastWeek)){
                                                    // this is incorrect we need to calculate from the nmber of tool taht was there last week
                                                    lastWeekNote = lastWeekNote + lastWeekTempNote;

                                            }


                                        }

                                    }
                                    toolsArray[l].note = note;
                                    toolsArray[l].status = "normal";

                                    if( new Date( toolsArray[l].createdtime  ) < new Date(now - milliSecondSinceLastWeek)){

                                        if(note-4 > lastWeekNote){
                                            toolsArray[l].status = "hot";
                                        }
                                        if(note+4 < lastWeekNote){
                                            toolsArray[l].status = "cold";
                                        }
                                        console.log(toolsArray[l].note, lastWeekNote, toolsArray[l].status);
                                    }
                                    currentTools.push(toolsArray[l]);
                                }
                            }

                            currentTools = sortByProp(currentTools, "note");

                            categoriesArray[i].tools = currentTools;

                        }
                        // console.log(categoriesArray);
                        app.data = categoriesArray;

                        next();


                    });
                });
            });
        }

        isAdmin(userId, process);

    }


    function addCategorie(name, userId, cb){
        app.categories.count( function(error, count){
            app.categories.insert({
                id: count+1,
                name: name,
                approved:0,
                createdby: userId,
                createdtime:now
            });
            cb(userId, count);
        });
    }

    function addTool(cat, name, url, userId, cb){
        app.tools.count( function(error, count){
            app.tools.insert({
                id: count+1,
                name: name,
                url:url,
                categorie:parseInt(cat),
                createdby: userId,
                createdtime:now
            });

            cb(userId);
        });
    }

    function vote(userId, cat, order, cb){
        app.votes = bd.collection("votes");

        // send socket message if change of more than 3 pos
        var beforeAllUserList = [];
        var beforeMyList = [];
        var beforeList = [];
        var before = app.votes.find({ cat:parseInt(cat) });


        before.forEach(function(x){

            beforeAllUserList.push({pos:x.pos, id:x.id});
            if(x.user === userId){
                beforeMyList.push({pos:x.pos, id:x.id});
            }
        }, function(){


            if(beforeMyList.length > 0){
                beforeList = beforeMyList;
            } else {
                beforeList = beforeAllUserList;
            }

            var beforeSorted = sortByProp(beforeList, "pos");
            beforeList.reverse();

            for(var i=0; i < order.length; i++ ){
                //console.log( beforeSorted[i].id.toString(), order[i].id.toString(), (beforeSorted[i].id.toString() !== order[i].id.toString()) );

                if(beforeSorted[i]){

                    if(beforeSorted[i].id.toString() !== order[i].id.toString()){

                        for(var y=0; y < order.length; y++ ){

                               if(beforeSorted[y]){
                                   if(beforeSorted[y].id.toString() === order[i].id.toString()){

                                       if( (i+1 - beforeSorted[y].pos) > 3 ){
                                           app.functions.socketEmit("vote", userId, getUsername(userId) +" has just lower '"+ getToolName(beforeSorted[y].id) +"' of "+ (i+1 - beforeSorted[y].pos) +" positions" );
                                       }

                                       if( (i+1 - beforeSorted[y].pos) < -3 ){
                                           app.functions.socketEmit("vote", userId, getUsername(userId) +" has just raise '"+ getToolName(beforeSorted[y].id) +"' of "+ (-(i+1 - beforeSorted[y].pos)) +" positions" );
                                       }
                                   }
                               }
                        }

                    }
                }
            }
        });

        app.votes.remove({ cat:parseInt(cat), user:userId });

        for(var i=0; i < order.length; i++ ){
            /*
            console.log("{ id:"+ order[i].id
                +",pos:"+ (i+1)
                +",cat:"+ cat
                +",user:"+ userId
                +",time:"+now
                +"}");

              */
            app.votes.insert({
                id: parseInt(order[i].id),
                pos: (i+1),
                cat:parseInt(cat),
                user:userId,
                time:now
            });

        }



        cb(userId);
    }


    var socketInitiated = 0;
    var socketConnection;
    function socketInit(cb){
        app.io.sockets.on('connection', function (socket) {
            socketInitiated = 1;
            socketConnection = socket;
            socketUpdateUsers();
            cb();

        });
    }

    function socketEmit(event, user, msg){
        if (socketInitiated){
            socketConnection.broadcast.emit(event, user, msg);
        } else {
            var cb = function(){
                socketConnection.broadcast.emit(event, user, msg);
            }
            socketInit(cb);
        }
    }

    function socketUpdateUsers(){
        socketConnection.broadcast.emit("updateUsers", app.currentUsers );
    }

}
