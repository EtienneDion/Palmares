
var palmares = (function () {
    var loadingIconList = [],
    loadingIconFn = {
        start: function($elem){
            //loadingIconList.push({ id:loadingIconList.length+1, elem:elem });
            if(!$elem.find(".loading").length){
                $elem.append("<div class='loading'></div>");
            }
        },
        stop: function($elem){
            $elem.find(".loading").remove();
        }
    },

    doAjax = function (path, values, refreshCat) {

        var $loadingAnchor;
        if (refreshCat === "last"){
            $loadingAnchor = $(".addcategorie .loadingAnchor");
        } else {
            $loadingAnchor = $(".box[data-cat="+refreshCat+"] .loadingAnchor");
        }

        loadingIconFn.start($loadingAnchor);

        $.ajax({
            type: 'POST',
            url: '/ajax/'+path,
            dataType: "json",
            data: values,
            success:
                function(data) {

                    if(data.result == "ok"){

                        if (refreshCat === "last"){
                            getCategorie(data.cat, $loadingAnchor);
                        } else {
                            if(path !== "sort"){
                                getCategorie(refreshCat, $loadingAnchor);
                            } else {
                                    loadingIconFn.stop($loadingAnchor);
                            }
                        }
                    } else {
                        $('#resultat').html(data);
                    }
                }
        });

    },

    getCategorie = function(cat, $loadingAnchor){
        var param = {cat:cat};
        $.ajax({
            type: 'POST',
            url: '/ajax/get_categorie',
            dataType: "html",
            data: param,
            success:
                function(data) {
                    if( $(".box[data-cat="+cat+"]").length ){
                        $(".box[data-cat="+cat+"]").replaceWith(data);
                        $(".box[data-cat="+cat+"]").addClass("enhance");

                        $(".box[data-cat="+cat+"]").clearEnhance();
                        $(".box[data-cat="+cat+"]").attr("data-enhance", $("#container").attr("data-enhance"));
                        //console.log($("#container").attr("data-enhance"));
                        $(".box[data-cat="+cat+"]").enhance();

                    } else {
                        //console.log($("#container").find(".box").filter(":last"), cat);
                        $("#container").find(".box").filter(":last").after("<div class='box' data-cat='"+cat+"'></div>");
                        $(".box[data-cat="+cat+"]").replaceWith(data);
                        $(".box[data-cat="+cat+"]").addClass("enhance");

                        $(".box[data-cat="+cat+"]").clearEnhance();
                        $(".box[data-cat="+cat+"]").attr("data-enhance", $("#container").attr("data-enhance"));
                        //console.log($("#container").attr("data-enhance"));
                        $(".box[data-cat="+cat+"]").enhance();
                    }
                    loadingIconFn.stop($loadingAnchor);
                }
        });
    },

    sortTools = function(){

        yepnope({
            test: Modernizr.draganddrop,
            yep: '/js/jquery.sortable.js',
            nope: '/js/jquery-ui-1.9.1.custom.min.js',
            complete: function() {

                var votes = {};
                $('.sortable').sortable({ handle: '.handle' }).bind('sortupdate', function() {

                    votes["cat"] = $(this).parents(".box").data("cat");
                    var order = [];

                    var $lis = $(this).find("li");
                    $lis.each(function(){

                        order.push({id:$(this).data("id")});

                    });
                    votes["order"] = order;
                    doAjax("sort", votes, votes["cat"]);
                });
            }
        });

    },

    ajaxCategorie = function (fields) {
        var values = {};
        $(fields).each(function(){
            values[ $(this).data("id") ] =  $(this).val();
        });

        doAjax("add_categorie", values, "last");
    },

    ajaxTool = function (fields) {
        var values = {};
        $(fields).each(function(){
            values[ $(this).data("id") ] =  $(this).val();
        });
        values["cat"] = $(fields[0]).parents(".box").data("cat");

        doAjax("add_tool", values, values["cat"]);

    },

    ajaxApproveCat = function ($cat){
        var values = {};
        values["cat"] =  $cat.data("cat");

        doAjax("approve_categorie", values, values["cat"]);

    },

    validate = function ($form, next){
        $form.submit(function(e) {
            e.preventDefault();
            var error = 0;
            var $this = $(e.target);
            var $inputs = $this.find("input[type=text]");
            var fields = [];
            $inputs.each(function(){
                if( $(this).val() !== "" && $(this).val() !== null && $(this).val() !== undefined ){
                    $(this).parents(".field").removeClass("error");
                    $(this).next(".errorMsg").remove();
                    fields.push(this);
                } else {
                    error =+ 1;
                    $(this).parents(".field").addClass("error");
                    if(!$(this).next(".errorMsg").length){
                        $(this).after('<div class="errorMsg">This field is required</div>');
                    }
                }
            });

            if(error){
                return false;
            } else {
                next( fields );
            }
        });
    },

    addCategorie = function (context) {
        var $form = $(context).find(".addcategorie");

        validate($form, ajaxCategorie);

    },

    addTool = function (context) {
        var $form = $(context).find(".addtool");

        validate($form, ajaxTool);

    },

    approveCategories = function (context) {
        var $btn = $(context).find(".box.notApproved h3 a");

        $btn.click(function(e){
            e.preventDefault();
            var $cat = $(this).parents(".box.notApproved");
            console.log($cat);
            ajaxApproveCat($cat);
        });
    },

    approveCategories = function (context) {
        var $btn = $(context).find(".box.notApproved h3 a");

        $btn.click(function(e){
            e.preventDefault();
            var $cat = $(this).parents(".box.notApproved");
            console.log($cat);
            ajaxApproveCat($cat);
        });
    },

    socketIO = function (context) {
        var socket = io.connect();
        var uniqueId = 0;
        function checkIfCurentUser(userId, cb){
            if( userId !== $("#container").attr("data-user-id") ){
                cb();
            }
        }

        function drawMessage(id, className, msg){
            $('#socketMsg').append("<span class='"+className+" uniqueId-"+id+"'>"+msg+"</span>");
            setTimeout(function(){
                $('#socketMsg').find(".uniqueId-"+id).addClass("active");
            },100);
            setTimeout(function(){
                $('#socketMsg').find(".uniqueId-"+id).addClass("removing");
                setTimeout(function(){
                    $('#socketMsg').find(".uniqueId-"+id).remove();
                },1000);
            },10000);
        }

        function userConnect(userId, connectMsg){
            uniqueId = uniqueId+1;
            console.log(connectMsg);
            if(connectMsg !== undefined){
                var cb = function(){
                    drawMessage(uniqueId, "connect", connectMsg);
                }
                checkIfCurentUser(userId, cb);
            }
        }
        function toolAdded(userId, toolAddedMsg){
            uniqueId = uniqueId+1;
            console.log(toolAddedMsg);
            if(toolAddedMsg !== undefined){
                var cb = function(){
                    drawMessage(uniqueId, "toolAdded", toolAddedMsg);
                }
                checkIfCurentUser(userId, cb);
            }
        }
        function catAdded(userId, catAddedMsg){
            uniqueId = uniqueId+1;
            console.log(catAddedMsg);
            if(catAddedMsg !== undefined){
                var cb = function(){
                    drawMessage(uniqueId, "catAdded", catAddedMsg);
                }
                checkIfCurentUser(userId, cb);
            }
        }
        function vote(userId, voteMsg){
            uniqueId = uniqueId+1;
            console.log(voteMsg);
            if(voteMsg !== undefined){
                var cb = function(){
                    drawMessage(uniqueId, "vote", voteMsg);
                }
                checkIfCurentUser(userId, cb);
            }
        }
        function updateUsers(usersArray){

            console.log(usersArray);
            var $currentUserEls = $("#socketUsers span");

            $currentUserEls.each(
                function(){
                    var toRemove = 1;
                    for(var i=0;i>usersArray.length;i++){
                        if(usersArray[i].id.toString() === $(this).attr("data-id") ){
                            toRemove = 0;
                            usersArray.splice(i,1);
                        }
                    }
                    if(toRemove){
                        console.log("remove "+ $(this).attr("data-id"));
                        $(this).addClass("removing");
                        setTimeout(function(){
                            $(this).remove();
                        },1000);
                    }
                }
            );

            console.log(usersArray, usersArray.length);

            for(var i=0;i<usersArray.length;i++){
                uniqueId = uniqueId+1;
                var id = uniqueId;
                $('#socketUsers').append("<span data-id='"+usersArray[i].id+"' class='uniqueId-"+id+"'><span class='icon'>Online</span>"+usersArray[i].username+"</span>");
                setTimeout(function(){
                    $('#socketUsers').find(".uniqueId-"+id).addClass("active");
                },100);
            }


        }



        socket.on('userConnect', $.debounce( 250, true, userConnect));
        socket.on('toolAdded', $.debounce( 250, true, toolAdded));
        socket.on('catAdded', $.debounce( 250, true, catAdded));
        socket.on('vote', $.debounce( 250, true, vote));
        socket.on('updateUsers', $.debounce( 250, true, updateUsers));
    };

    return {
        handler:{
            addCategorie: addCategorie,
            addTool: addTool,
            sortTools: sortTools,
            getCategorie: getCategorie,
            approveCategories: approveCategories,
            socketIO:socketIO
        }
    }
})();




$.enhance(palmares.handler.addCategorie, {
    id: "ajaxAddCategorie",
    title: "adding Categorie",
    group: "connected"
});

$.enhance(palmares.handler.addTool, {
    id: "ajaxAddTool",
    title: "adding tools",
    group: "connected"
});

$.enhance(palmares.handler.sortTools, {
    id: "sortTools",
    title: "Sort Tools",
    group: "connected"
});

$.enhance(palmares.handler.addCategorie, {
    id: "ajaxAddCategorie",
    title: "adding Categorie",
    group: "admin"
});

$.enhance(palmares.handler.approveCategories, {
    id: "approveCategories",
    title: "approving Categorie",
    group: "admin"
});

$.enhance(palmares.handler.socketIO, {
    id: "socketIO",
    title: "socketIO Initialisation",
    group: "socketIO"
});




$(function() {

    $(document).enhance();

});