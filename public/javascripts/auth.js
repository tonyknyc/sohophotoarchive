$(document).ready(function() {

    setLoginNav();

    // this is really just for the detail page 
    // to remove jwt  in case the user bookmarks or emails link
    removeQueryString();



    $('a#logOut').on('click', function(event) {
        localStorage.removeItem('spgarchive-token');
        setLoginNav();
 
        // redirect back to homepage if necessary       
        if (location.pathname.length > 3) {
            window.location = location.protocol + "//" + location.host;
        }
        event.preventDefault();
    });

    $('form#loginForm').submit(function(event) {

        $("#usernameFG").removeClass("has-error");
        $("#passwordFG").removeClass("has-error");
        $("#usernameFG > span").text('');
        $("#passwordFG > span").text('');


        // get the form data
        var formData = {
            'email'     : $('input[id=username]').val(),
            'password'  : $('input[id=password]').val(),
        };

        // send info to backend
        var loginReq = $.ajax({
            type        : 'POST', // define the type of HTTP verb we want to use (POST for our form)
            url         : '/api/login', // the url where we want to POST
            data        : formData, // our data object
            dataType    : 'json', // what type of data do we expect back from the server
            encode      : true
        })
            // using the done promise callback
            .done(function(data) {
                console.log("data",data)
                localStorage['spgarchive-token'] = data.token;
                console.log('localStorage is...',localStorage);

                setLoginNav();
                // hide the login dropdown
                $('.dropdown-toggle').dropdown('toggle');
                // remove login warning
                $('#loginWarn').text('');
                $('#loginWarn').hide();


                // here we will handle errors and validation messages
            })
            .fail(function(res,status,err) {

                if (err == "Unauthorized") {
                    var respTxt = JSON.parse(res.responseText);

                    switch (respTxt.message) {
                        case 'Incorrect username.':
                            $("#usernameFG").addClass("has-error");
                            $("#usernameFG > span").text('Email not found');
                            break;
                        case 'Incorrect password.':
                            $("#passwordFG").addClass("has-error");
                            $("#passwordFG > span").text('Incorrect password');
                            break;
                    }

                } else {
                    console.log('login failed',err);
                }


            });

        event.preventDefault();
    });
});

function isLoggedIn(jwt) {

    if (jwt != undefined) {
        var jwtParts = jwt.split('.');
        var payload = JSON.parse( atob(jwtParts[1]) );
        // has it expired?
        var now = new Date();
        if (payload.enabled && (now.getTime() < (payload.exp * 1000)) ) {
            return true
        } else {
            localStorage.removeItem('spgarchive-token');
            return false
        }
    } else {
        return false
    }
}

function setLoginNav() {

    var jwt = localStorage['spgarchive-token'];

    if (isLoggedIn(jwt)) {

        var jwtParts = jwt.split('.');
        var payload = JSON.parse( atob(jwtParts[1]) );

        $('li#userName').text(payload.name);
        $('a#logIn').hide();
        $('a#logOut').show();
    } else {
        $('li#userName').text('');
        $('a#logIn').show();
        $('a#logOut').hide();
    }
}

function removeQueryString() {

    var clean_uri = location.protocol + "//" + location.host + location.pathname;
    window.history.replaceState({}, document.title, clean_uri);
}
