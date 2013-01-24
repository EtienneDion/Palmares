module.exports = function(app, bd){

    return {
        getCollection:getCollection,
        findOne:findOne,
        find:find,
        count:count,
        insert:insert,
        remove:remove,
        forEach:forEach
    };

    function getCollection(collection){
       var data = bd.collection(collection);
       return data;
    }

    function findOne(data, id, param, cb, next, next2){
        data.findOne(param, function(err, user) {
            cb(err, user);
        });
    }

    function find( table, param ){
        return table.find(param);
    }

    function count(data, cb, cb_vars){
        data.count(function(error, count){
            cb(error, count, cb_vars);
        });
    }

    function insert(table, param){
        console.log(param);
        table.insert(param);
    }

    function remove(table, param){
         table.remove(param);
    }

    function forEach(userId, list, process, complete, next, vars){
        var array = [];
        list.forEach(function(x){
            process(array, x, vars);
        }, function(){
            complete(userId, array, next, vars);
        });
    }

}