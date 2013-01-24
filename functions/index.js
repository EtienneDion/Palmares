module.exports = function(app){

    now = new Date();
    milliSecondSinceLastWeek = 10000; //604800000

    return {
        //functions
        getData:getData,
        addCategorie:addCategorie,
        addTool:addTool,
        vote:vote,
        approuveCat:approuveCat,
        socketInit:socketInit,
        socketEmit:socketEmit,
        socketUpdateUsers:socketUpdateUsers
    };



    /* functions to get and process data */

    function chooseCategorieSearchParam(userId, cb, next){
        var param;

        var go = function(admin, cb2){
            if(!admin){
                param  = { $or:[ { approved:1 }, { $and:[{ approved:0, createdby:userId || 0 }] } ] };
            } else {
                param = {};
            }
            console.log(param);
            cb2(userId, param, next);
        }

        app.utils.isAdmin(userId, go, cb);

    }

    function getCategories(userId, param, next){

        var categoriesArray = [];

        app.categories = app.db_middleware.getCollection("categories");

        var categoriesList;

        categoriesList = app.db_middleware.find( app.categories, param );

        var process = function(array, x){
            array.push({name:x.name, id:x.id, approved:x.approved, createdtime:x.createdtime });
        }

        var complete = function(userId, array, next){
            getTools(userId, array, next);
        }

        app.db_middleware.forEach(userId, categoriesList, process, complete, next);

    }

    function getTools(userId, categoriesArray, next){

        app.tools = app.db_middleware.getCollection("tools");
        var toolsList = app.db_middleware.find( app.tools, {} );

        var vars = { categoriesArray:categoriesArray };

        var process = function(array, x){
            array.push({name:x.name, id:x.id, cat:x.categorie, createdtime:x.createdtime });
        }

        var complete = function(userId, array, next, vars){
            getVotes(userId, categoriesArray, array, next, vars.categoriesArray);
        }

        app.db_middleware.forEach(userId, toolsList, process, complete, next, vars);

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

        app.votes = app.db_middleware.getCollection("votes");
        var votesList;
        var votesArray = [];

        votesList = app.db_middleware.find( app.votes, chooseVotesSearchParam(userId) );

        var vars = { categoriesArray:categoriesArray, toolsArray:toolsArray };
        var process = function(array, x){
            array.push({ id:x.id, pos: x.pos, time:x.time });
        }

        var complete = function(userId, array, next, vars){
            saveData(vars.categoriesArray, vars.toolsArray, array, next);
        }

        app.db_middleware.forEach(userId, votesList, process, complete, next, vars);


    }


    function processCategories(categoriesArray, toolsArray, votesArray){
        for(var i=0;i < categoriesArray.length; i++){

            var nbOfToolsValues = getNbOfTools(categoriesArray[i], toolsArray);
            var nbOfTools = nbOfToolsValues.current;
            var nbOfLastWeekTools = nbOfToolsValues.lastweek;

            var currentTools = processTools(categoriesArray[i], toolsArray, nbOfTools, nbOfLastWeekTools, votesArray);
            currentTools = app.utils.sortByProp(currentTools, "note");

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

    function addCategorie(name, userId, next){

        var cb_vars = {};
        cb_vars.name = name;
        cb_vars.userId = userId;
        cb_vars.next = next;
        cb_vars.now = now;

        var cb = function(error, count, vars){

            app.db_middleware.insert(app.categories, {
                                                    id: count+1,
                                                    name: vars.name,
                                                    approved:0,
                                                    createdby: vars.userId,
                                                    createdtime:vars.now
                                                });

            vars.next(vars.userId, count);
        }
        app.db_middleware.count( app.categories, cb, cb_vars );
    }

    function addTool(cat, name, url, userId, cb){

        var cb_vars = {};
        cb_vars.name = name;
        cb_vars.url = url;
        cb_vars.userId = userId;
        cb_vars.cat = cat;
        cb_vars.next = cb;
        cb_vars.now = now;

        var cb2 = function(error, count, vars){

            app.db_middleware.insert(app.tools, {
                                                    id: count+1,
                                                    name: vars.name,
                                                    url:vars.url,
                                                    categorie:parseInt(vars.cat),
                                                    createdby: vars.userId,
                                                    createdtime: vars.now
                                                });

            vars.next(vars.userId);
        }

        app.db_middleware.count( app.tools, cb2, cb_vars );

    }

    /* functions for voting */
    function processVotes(userId, cat, votes, allPreviousVotes, next){

        var vars = { cat:cat, votes:votes };
        var process = function(array, x){
            array.push({ id:x.id, pos:x.pos, user:x.user });
        }
        var complete = function(userId, array, next, vars){

            var previousVotes = processPreviousVotes(userId, array);

            sortVotes(previousVotes);

            var highlights = findHighlightsVotes( userId, votes, previousVotes );

            processHighlights(highlights);

            next();

        }

        app.db_middleware.forEach(userId, allPreviousVotes, process, complete, next, vars);

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
        sortedVotes = app.utils.sortByProp(previousVotes, "pos");
        sortedVotes.reverse();
        return sortedVotes;
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
            highlights.push({user:userId, change:"lower", name:app.utils.getToolName(id), positions:positionOffset });
        }

        if( positionOffset < -3 ){
            highlights.push({user:userId, change:"raise", name:app.utils.getToolName(id), positions:-positionOffset });
        }

        return highlights;
    }

    function processHighlights(highlights){

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

        app.votes = app.db_middleware.getCollection("votes");

        var allPreviousVotes = app.db_middleware.find( app.votes, { cat:parseInt(cat) });

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


    function approuveCat(userId, cat, next, next){

        var vars = { userId:userId, cat:cat, next:next}
        var cb = function(vars){

            var userId = vars.userId;
            var cat = vars.cat;

            var cb2 = function(userId, cat, next){
                next(cat);
            }

            app.functions.getData(userId, cb2);
        }

        app.db_middleware.update(app.categories, { id: parseInt(cat) },{ $set: { approved:1 }}, vars, cb);
        app.categories.update({ id: parseInt(cat) },{ $set: { approved:1 }}, null, cb);

    }

    /* functions for socket.io */
    function emitVotesHighlight(userId, change, name, position){
        socketEmit("vote", userId, app.utils.getUsername(userId) +" has just "+change+" '"+ name +"' of "+ position +" positions" );
    }

    function clearCurrentUserVotes(userId, cat, cb){

        app.db_middleware.remove(app.votes, { cat:parseInt(cat), user:userId });
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

            app.db_middleware.insert(app.votes, {
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
