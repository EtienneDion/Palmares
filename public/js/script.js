
var palmares = (function () {

    var doAjax = function (path, values, refreshCat) {

        console.log(values, refreshCat);
        //var params = JSON.stringify( values );
        //console.log(params);
        $.ajax({
            type: 'POST',
            url: '/ajax/'+path,
            dataType: "json",
            data: values,
            success:
                function(data) {
                    $('#resultat').html(data);

                    if (refreshCat === "last"){
                        getCategorie({cat:data.cat});
                    } else {
                        if(refreshCat !== null){
                            getCategorie({cat:refreshCat})
                        }
                    }

                }
        });

    };
    var getCategorie = function(cat){

        $.ajax({
            type: 'POST',
            url: '/ajax/get_categorie',
            dataType: "html",
            data: cat,
            success:
                function(data) {
                    if( $(".box[data-cat="+cat.cat+"]").length ){
                        $(".box[data-cat="+cat.cat+"]").replaceWith(data);
                        $(".box[data-cat="+cat.cat+"]").addClass("enhance");

                        $(".box[data-cat="+cat.cat+"]").clearEnhance();
                        $(".box[data-cat="+cat.cat+"]").attr("data-enhance", $("#container").attr("data-enhance"));
                        console.log($("#container").attr("data-enhance"));
                        $(".box[data-cat="+cat.cat+"]").enhance();
                    } else {
                        console.log($("#container").find(".box").filter(":last"), cat.cat);
                        $("#container").find(".box").filter(":last").after("<div class='box' data-cat='"+cat.cat+"'></div>");
                        $(".box[data-cat="+cat.cat+"]").replaceWith(data);
                        $(".box[data-cat="+cat.cat+"]").addClass("enhance");

                        $(".box[data-cat="+cat.cat+"]").clearEnhance();
                        $(".box[data-cat="+cat.cat+"]").attr("data-enhance", $("#container").attr("data-enhance"));
                        console.log($("#container").attr("data-enhance"));
                        $(".box[data-cat="+cat.cat+"]").enhance();
                    }

                }
        });
    };

    var sortTools = function(){

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
                    doAjax("sort", votes, null);
                });
            }
        });

    };

    var ajaxCategorie = function (fields) {
        var values = {};
        $(fields).each(function(){
            values[ $(this).data("id") ] =  $(this).val();
        });

        doAjax("add_categorie", values, "last");
    };

    var ajaxTool = function (fields) {
        var values = {};
        $(fields).each(function(){
            values[ $(this).data("id") ] =  $(this).val();
        });
        values["cat"] = $(fields[0]).parents(".box").data("cat");

        doAjax("add_tool", values, values["cat"]);

    };

    var ajaxApproveCat = function ($cat){
        var values = {};
        values["cat"] =  $cat.data("cat");

        doAjax("approve_categorie", values, values["cat"]);

    };

    var validate = function ($form, next){
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
    };

    var addCategorie = function (context) {
        var $form = $(context).find(".addcategorie");

        validate($form, ajaxCategorie);

    };

    var addTool = function (context) {
        var $form = $(context).find(".addtool");

        validate($form, ajaxTool);

    };

    var approveCategories = function (context) {
        var $btn = $(context).find(".box.notApproved h3 a");

        $btn.click(function(e){
            e.preventDefault();
            var $cat = $(this).parents(".box.notApproved");
            console.log($cat);
            ajaxApproveCat($cat);
        });
    };

    return {
        handler:{
            addCategorie: addCategorie,
            addTool: addTool,
            sortTools: sortTools,
            getCategorie: getCategorie,
            approveCategories: approveCategories
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





$(function() {

    $(document).enhance();

});