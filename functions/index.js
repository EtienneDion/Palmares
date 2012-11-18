module.exports = function(app, bd){

    return {
        //auth functions
        findById:findById,
        findByUsername:findByUsername,
        sortByProp:sortByProp,
        ensureAuthenticated:ensureAuthenticated,
        getData:getData
    };

    //auth functions
    function findById(id, fn, done) {
        var type="";
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

    // TODO: need refactoring without timeout
    function getData( ) {

        console.log("allo");
        app.tools = bd.collection("tools");
        app.categories = bd.collection("categories");
        app.votes = bd.collection("votes");
        var categoriesArray = [];
        var categoriesList = app.categories.find();



        categoriesList.forEach(function(x){

            var toolsArray = [];
            var toolsList = app.tools.find({ categorie: x.id });
            var nbOfTools = 0;
            var currentTool=0;

            toolsList.forEach(function(y){
                nbOfTools++;
            }, function(){
                toolsList = app.tools.find({ categorie: x.id });
                toolsList.forEach(function(y){

                    var note = 0,
                        votesList = app.votes.find({ id: y.id });

                    votesList.forEach(function(z){

                        var tempNote = nbOfTools+1 - z.pos;
                        note = note + tempNote;

                    }, function(){
                        toolsArray.push({name:y.name, id:y.id, note: note });

                    });

                },function(){
                    setTimeout(function(){

                        sortByProp(toolsArray, "note");

                        categoriesArray.push({name:x.name, id:x.id, tools: toolsArray });

                    },300);
                });
            });

        });
        console.log("Listing:",categoriesArray);
        return categoriesArray;

    }


}
