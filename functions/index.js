module.exports = function(app, bd){

    return {
        //auth functions
        findById:findById,
        findByUsername:findByUsername,
        sortByProp:sortByProp,
        ensureAuthenticated:ensureAuthenticated,
        getData:getData,
        getUserId:getUserId
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

    function getUserId(user){

        var userId = null;
        if(user !== undefined ){
            userId = user.id;
        }

        return userId;
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

    function findByUsername(username, fn) {
        app.users.findOne({ username:username }, function(err, user) {

            if(err !== null)       {
                return fn(null, null);
            }  else {
                return fn(null, user);
            }

        });
    }

    //sortByProp
    function sortByProp(array, p){
        return array.sort(function(a,b){
            return (a[p] < b[p]) ? 1 : (a[p] > b[p]) ? -1 : 0;
        });
    };

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/login')
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
                categoriesArray.push({name:x.name, id:x.id, approved:x.approved });
            }, function(){

                var toolsArray = [];

                var nbOfTools = 0;
                toolsList.forEach(function(y){
                    toolsArray.push({name:y.name, id:y.id, cat:y.categorie });
                }, function(){
                    var note = 0,
                        votesArray = [];


                    votesList.forEach(function(z){

                        votesArray.push({ id:z.id, pos: z.pos });
                    }, function(){

                        for(var i=0;i < categoriesArray.length; i++){
                            var currentTools =[];
                            var nbOfTools = 0;
                            //console.log("i:", i);
                            for(var j=0;j < toolsArray.length; j++){

                                if(toolsArray[j].cat === categoriesArray[i].id){
                                    nbOfTools++;
                                }
                            }

                            for(var l=0;l < toolsArray.length; l++){


                                if(toolsArray[l].cat === categoriesArray[i].id){

                                    var note=0;

                                    for(var m=0;m < votesArray.length; m++){
                                        if(toolsArray[l].id === votesArray[m].id){
                                            var tempNote = nbOfTools+1 - votesArray[m].pos;
                                            note = note + tempNote;
                                        }
                                    }
                                    toolsArray[l].note = note;

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

}
