
var palmares = (function () {


    var doAjax = function (path, categorie, values) {
        values = values.slice(0, -1);
        console.log("/// "+values);
        if (categorie !== null){
            categorie = ',"cat":'+categorie;
        } else {
            categorie = '';
        }
        var params = $.parseJSON('{'+ values + categorie+'}');
        console.log(params);
        $.ajax({
            type: 'POST',
            url: '/ajax/'+path,
            dataType: "json",
            data: params,
            success:
                function(data) {
                    $('#resultat').html(data);
                }
        });

    };

    // TODO : Need refactoring .... pass a real array not strings...
    var ajaxCategorie = function (fields) {
        var values ="";
        $(fields).each(function(){
            values = values + '"' +$(this).data("id") +'":"'+ $(this).val() +'",';
        });

        doAjax("categories", null, values)
    };
    // TODO : Need refactoring .... pass a real array not strings...
    var ajaxTool = function (fields) {
        var values ="";
        var categorie =null;
        if(fields.length){
            categorie = $(fields[0]).parents(".box").data("cat");
        }
        $(fields).each(function(){
            values = values + '"' + $(this).data("id") +'":"'+ $(this).val() +'",';
        });
        doAjax("tools", categorie, values)
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
            addTool: addTool
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

$(function() {

    $(document).enhance();

});