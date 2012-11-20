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
    function getData( next ) {
        app.tools = bd.collection("tools");
        app.categories = bd.collection("categories");
        app.votes = bd.collection("votes");
        var categoriesArray = [];
        var categoriesList = app.categories.find();

        categoriesList.forEach(function(x){
            categoriesArray.push({name:x.name, id:x.id });
        }, function(){

            var toolsArray = [];
            var toolsList = app.tools.find();
            var nbOfTools = 0;
            toolsList.forEach(function(y){
                toolsArray.push({name:y.name, id:y.id, cat:y.categorie });
            }, function(){
                var note = 0,
                votesArray = [];
                votesList = app.votes.find();

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

                        categoriesArray[i].tools = currentTools;

                    }

                    app.data = categoriesArray;

                    next();


                });
            });
        });

    }

}
