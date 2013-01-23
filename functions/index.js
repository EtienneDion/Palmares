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


    function isAdmin(id, next, next2) {

        app.users.findOne({ id:id }, function(err, user) {
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

        for(var i=0;i<app.currentUsers.length;i++){
            if(app.currentUsers[i]["id"] === id){
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

    /* functions to get and process data */

    function chooseCategorieSearchParam(userId, cb, next){
        var param;

        var go = function(admin, cb2){
            if(admin){
                param  = { $or:[ { approved:1 }, { $and:[{ approved:0, createdby:userId || 0 }] } ] };
            } else {
                param = {};
            }

            cb2(userId, param, next);
        }

        isAdmin(userId, go, cb);

    }

    function getCategories(userId, param, next){

        var categoriesArray = [];

        app.categories = bd.collection("categories");

        var categoriesList;

        categoriesList = app.categories.find( param );

        categoriesList.forEach(function(x){
            categoriesArray.push({name:x.name, id:x.id, approved:x.approved, createdtime:x.createdtime });
        }, function(){

            getTools(userId, categoriesArray, next);

        });
    }

    function getTools(userId, categoriesArray, next){

        app.tools = bd.collection("tools");
        var toolsList = app.tools.find();

        var toolsArray = [];
        toolsList.forEach(function(y){
            toolsArray.push({name:y.name, id:y.id, cat:y.categorie, createdtime:y.createdtime });
        }, function(){
            var note = 0,
                votesArray = [];

            getVotes(userId, categoriesArray, toolsArray, next);

        });
    }

    function chooseVotesSearchParam(userId){
        var param;

        if(userId !== null){
            param  = { user:userId };
        } else {
            param = {};
        }

        return param;
    }

    function getVotes(userId, categoriesArray, toolsArray, next){

        app.votes = bd.collection("votes");
        var votesList;
        var votesArray = [];

        votesList = app.votes.find( chooseVotesSearchParam(userId) );

        votesList.forEach(function(z){

            votesArray.push({ id:z.id, pos: z.pos, time:z.time });

        }, function(){

            saveData(categoriesArray, toolsArray, votesArray, next);

        });
    }


    function processCategories(categoriesArray, toolsArray, votesArray){
        for(var i=0;i < categoriesArray.length; i++){

            var nbOfToolsValues = getNbOfTools(categoriesArray[i], toolsArray);
            var nbOfTools = nbOfToolsValues.current;
            var nbOfLastWeekTools = nbOfToolsValues.lastweek;

            var currentTools = processTools(categoriesArray[i], toolsArray, nbOfTools, nbOfLastWeekTools, votesArray);
            currentTools = sortByProp(currentTools, "note");

            categoriesArray[i].tools = currentTools;

        }

        return categoriesArray;
    }

    function processTools(categorie, toolsArray, nbOfTools, nbOfLastWeekTools, votesArray){
        var currentTools =[];
        for(var l=0;l < toolsArray.length; l++){

            if(toolsArray[l].cat === categorie.id){

                var notes = calculateNote(toolsArray[l], votesArray, nbOfTools, nbOfLastWeekTools);
                toolsArray[l].note = notes.current;

                toolsArray[l].status = checkStatus(toolsArray[l], notes.current, notes.lastweek);

                currentTools.push(toolsArray[l]);
            }
        }
        return currentTools;
    }

    function getNbOfTools(categorie, toolsArray){
        var nbOfTools = 0;
        var nbOfLastWeekTools = 0;

        for(var j=0;j < toolsArray.length; j++){

            if(toolsArray[j].cat === categorie.id){
                nbOfTools++;
                if( new Date( toolsArray[j].createdtime  ) < new Date(now - milliSecondSinceLastWeek)){
                    nbOfLastWeekTools++;
                }
            }
        }
        var nbOfTools = { current:nbOfTools, lastweek:nbOfLastWeekTools };
        return nbOfTools;
    }

    function calculateNote(tool, votesArray, nbOfTools, nbOfLastWeekTools){
        var note=0;
        var lastWeekNote = 0;
        for(var m=0;m < votesArray.length; m++){
            if(tool.id === votesArray[m].id){

                var vote = calculateVoteValues(nbOfTools,nbOfLastWeekTools, votesArray[m]);
                note = note + vote.current;
                if(vote.lastweek !== null){
                    lastWeekNote = lastWeekNote + vote.lastweek;
                }
            }
        }
        var notes = { current:note, lastweek:lastWeekNote };
        return notes;
    }

    function calculateVoteValues(nbOfTools,nbOfLastWeekTools, vote){
        var tempNote = nbOfTools+1 - vote.pos;
        var lastWeekTempNote = nbOfLastWeekTools+1 - vote.pos;

        if( new Date(vote.time) > new Date(now - milliSecondSinceLastWeek) ){
            lastWeekTempNote = null;
        }

        var voteValues = { current:tempNote, lastweek:lastWeekTempNote };
        return voteValues;
    }

    function checkStatus(tool, note, lastWeekNote){
        var status = "normal";

        if( new Date( tool.createdtime  ) < new Date(now - milliSecondSinceLastWeek)){

            if(note-4 > lastWeekNote){
                status = "hot";
            }
            if(note+4 < lastWeekNote){
                status = "cold";
            }
        }

        return status;
    }

    function saveData(categoriesArray, toolsArray, votesArray, next){

        app.data = processCategories(categoriesArray, toolsArray, votesArray);

        next();
    }

    function getData( userId, next ) {

        chooseCategorieSearchParam(userId, getCategories, next);

    }
    /* End functions to get and process data */

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

    /* functions for voting */
    function processVotes(userId, cat, votes, allPreviousVotes, cb){

        var previousVotesAllUsers = [];

        allPreviousVotes.forEach(function(x){

            previousVotesAllUsers.push({ id:x.id, pos:x.pos, user:x.user });

        }, function(){

            var previousVotes = processPreviousVotes(userId, previousVotesAllUsers);

            sortVotes(previousVotes);

            var highlights = findHighlightsVotes( userId, votes, previousVotes );

            processHighlights(highlights);

            cb();
        });
    }

    function checkIfUserAlreadyVote(previousVotesAllUsers, previousVotesCurrentUser){
        var previousVotes = [];
        if(previousVotesCurrentUser.length > 0){
            previousVotes = previousVotesCurrentUser;
        } else {
            previousVotes = previousVotesAllUsers;
        }
        return previousVotes;
    }

    function processPreviousVotes(userId, previousVotesAllUsers){
        var previousVotesCurrentUser = [];

        for(var i=0;i<previousVotesAllUsers.length;i++){

            var vote = previousVotesAllUsers[i];
            if(vote.user === userId){
                previousVotesCurrentUser.push({ id:vote.id, pos:vote.pos, user:vote.user});
            }
        }

        return checkIfUserAlreadyVote(previousVotesAllUsers, previousVotesCurrentUser);
    }

    function sortVotes(previousVotes){
        sortedVotes = sortByProp(previousVotes, "pos");
        sortedVotes.reverse();
        return sortedVotes
    }

    function findHighlightsVotes(userId, votes, previousVotes){
        var highlights = [];
        for(var currentPosition=0; currentPosition < votes.length; currentPosition++ ){

            if(previousVotes[currentPosition]){
                if(previousVotes[currentPosition].id.toString() !== votes[currentPosition].id.toString()){

                    var highlight = findBeforeAndAfterVotesToCompare(userId, votes, previousVotes, currentPosition );
                    if(highlight.length > 0){
                        highlights.push( highlight );
                    }
                }
            }
        }
        return highlights;
    }

    function findBeforeAndAfterVotesToCompare(userId, currentTools, previousTools, currentPosition){
        var highlights = [];
        for(var y=0; y <= currentTools.length; y++ ){
            if(previousTools[y]){
                if(previousTools[y].id.toString() === currentTools[currentPosition].id.toString()){


                    var highlight = comparePositions(userId, previousTools[y].id, (currentPosition+1 - previousTools[y].pos) );
                    if(highlight.length > 0){
                        highlights.push( highlight );
                    }
                }
            }
        }
        return highlights;
    }

    function comparePositions(userId, id, positionOffset){

        var highlights = [];
        if( positionOffset > 3 ){
            highlights.push({user:userId, change:"lower", name:getToolName(id), positions:positionOffset });
        }

        if( positionOffset < -3 ){
            highlights.push({user:userId, change:"raise", name:getToolName(id), positions:-positionOffset });
        }

        return highlights;
    }

    function processHighlights(highlights){
        console.log("@@@",highlights);
        var preventDuplicate ="";

        for(var x=0;x<highlights.length;x++){
            for(var y=0;y<highlights[x].length;y++){
                for(var i=0;i<highlights[x][y].length;i++){

                    if( preventDuplicate !== highlights[x][y][i].name ){
                        emitVotesHighlight(highlights[x][y][i].user, highlights[x][y][i].change, highlights[x][y][i].name, highlights[x][y][i].positions);
                        preventDuplicate = highlights[x][y][i].name;
                    }
                }
            }
        }
    }

    function vote(userId, cat, votes, cb){

        app.votes = bd.collection("votes");

        var   allPreviousVotes = app.votes.find({ cat:parseInt(cat) });

        var callback2 = function(){
            saveVotes(userId, votes, cat);
        }

        var callback = function(){
            clearCurrentUserVotes( userId, cat, callback2);
        }

        processVotes(userId, cat, votes, allPreviousVotes, callback );

        cb(userId);
    }

    /* End functions for voting */

    /* functions for socket.io */
    function emitVotesHighlight(userId, change, name, position){
        socketEmit("vote", userId, getUsername(userId) +" has just "+change+" '"+ name +"' of "+ position +" positions" );
    }

    function clearCurrentUserVotes(userId, cat, cb){
        app.votes.remove({ cat:parseInt(cat), user:userId });

        cb();
    }

    function saveVotes(userId, votes, cat){
        for(var i=0; i < votes.length; i++ ){

            console.log("vote", {
                id: parseInt(votes[i].id),
                pos: (i+1),
                cat:parseInt(cat),
                user:userId,
                time:now
            });

            app.votes.insert({
                id: parseInt(votes[i].id),
                pos: (i+1),
                cat:parseInt(cat),
                user:userId,
                time:now
            });

        }
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
    /* End functions for socket.io */


}
