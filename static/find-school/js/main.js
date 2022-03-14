
(function ($) {
    "use strict";

    
    /*==================================================================
    [ Validate ]*/
    $('.validate-form').on('submit',function(event){
        var check = true;


        if ($('.validate-input input[name="name"]').val().trim() == '') check = true;
        if ($('.validate-input input[name="school"]').val().trim() == '') check = true;
        if ($('.validate-input input[name="grade"]').val().trim() == '' && $('.validate-input input[name="grade"]').val() > 0) check = true;
        if ($('.validate-input input[name="class"]').val().trim() == '' && $('.validate-input input[name="class"]').val() > 0) check = true;
        if ($('.validate-input input[name="number"]').val().trim() == '' && $('.validate-input input[name="number"]').val() > 0) check = true;


        return check;
    });


    $('.validate-form .input1').each(function(){
        $(this).focus(function(){
           hideValidate(this);
       });
    });

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }
    
    

})(jQuery);