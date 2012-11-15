module.exports = function(app){

    return {
        //auth functions
        findById:findById,
        findByUsername:findByUsername,
        sortByProp:sortByProp,
        ensureAuthenticated:ensureAuthenticated
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
}
