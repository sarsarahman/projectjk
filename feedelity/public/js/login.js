'use strict';


$('#inputUsername').change(function() {
$('.alert.alert-danger').hide();
});

$('#inputPassword').change(function() {
$('.alert.alert-danger').hide();
});

$('#btnLogin').click(

    function(username, password) {

        console.log(username, password)
        $.post("/login", {
                "username": $('#inputUsername').val(),
                "password": $('#inputPassword').val()
            })
            .done(function(data) {
                window.location.href = "/";
            }).fail(function() {
                $('#loginError').html(' Sorry, Invalid credentials!!!');
                $('.alert.alert-danger').show();
            });


    }
);