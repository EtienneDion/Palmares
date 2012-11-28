
var palmares = (function () {

    var doAjax = function (path, values, refreshCat) {

        console.log(values);
        var params = JSON.stringify( values );
        console.log(params);
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
            url: '/ajax/get_categories',
            dataType: "html",
            data: cat,
            success:
                function(data) {
                    if( $(".box[data-cat="+cat.cat+"]").length ){
                        $(".box[data-cat="+cat.cat+"]").html(data);
                        $(".box[data-cat="+cat.cat+"]").addClass("enhance");

                        $(".box[data-cat="+cat.cat+"]").clearEnhance();
                        $(".box[data-cat="+cat.cat+"]").attr("data-enhance", $("#container").attr("data-enhance"));
                        console.log($("#container").attr("data-enhance"));
                        $(".box[data-cat="+cat.cat+"]").enhance();
                    } else {
                        console.log($("#container").find(".box").filter(":last"), cat.cat);
                        $("#container").find(".box").filter(":last").after("<div class='box' data-cat='"+cat.cat+"'></div>");
                        $(".box[data-cat="+cat.cat+"]").html(data);
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

        doAjax("add_categories", values, "last");
    };

    var ajaxTool = function (fields) {
        var values = {};
        $(fields).each(function(){
            values[ $(this).data("id") ] =  $(this).val();
        });
        values["cat"] = $(fields[0]).parents(".box").data("cat");

        doAjax("add_tools", values, values["cat"]);


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

    return {
        handler:{
            addCategorie: addCategorie,
            addTool: addTool,
            sortTools: sortTools,
            getCategorie: getCategorie
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

$.enhance(palmares.handler.addTool, {
    id: "ajaxAddTool",
    title: "adding tools",
    group: "admin"
});





$(function() {

    $(document).enhance();

});