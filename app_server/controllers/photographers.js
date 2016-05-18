var request = require('request');
var apiOptions = {
  server : "http://localhost:3002"
};


if (process.env.NODE_ENV === 'production') {
  // change this when uploaded to heroku
  apiOptions.server = "http://enigmatic-waters-64682.herokuapp.com";
}


// present explanation to user if api fails
var _showError = function (req, res, status) {
  var title, content;
  if (status === 404) {
    title = "404, page not found";
    content = "Oh dear. Looks like we can't find this page. Sorry.";
  } else if (status === 500) {
    title = "500, internal server error";
    content = "How embarrassing. There's a problem with our server.";
  } else {
    title = status + ", something's gone wrong";
    content = "Something, somewhere, has gone just a little bit wrong.";
  }
  res.status(status);
  res.render('generic-text', {
    title : title,
    content : content
  });
};


var renderHomepage = function(req, res, responseBody){
  var message;
  var warning = '';
  if (!(responseBody instanceof Array)) {
    message = "API lookup error";
   // responseBody = [];
  } else if (!responseBody.length) {
    message = "no photographers found";
  } else if (Object.keys(req.query).length !== 0) {
    message = "user not authorized / please log in";
    warning = 'Please log in';
  } else {
    message = "found "+responseBody.length+" photographers";
  }

  console.log(message, req.query);

  res.render('photographers-list', {
    title: 'Our Photographers',
    photographers: responseBody,
    message: message,
    warning: warning
  });
};


/* GET 'home' page of all active photographers */
module.exports.homelist = function(req, res){
  console.log("module.exports.homelist",res.statusCode)

  var requestOptions, path;
  path = '/api/photographers';
  requestOptions = {
    url : apiOptions.server + path,
    method : "GET",
    json : {}
  };

  request(
    requestOptions,
    function(err, response, body) {

      	renderHomepage(req, res, body);
    }
  );
};


var renderPhotographerDetailPage = function(req, res, photog){

    var hasSoloshows, hasGroupprints = false;
    var sshow;
    if (photog.soloshows && photog.soloshows.length > 0) {
      hasSoloshows = true;
      photog.soloshows[0].prints.sort( function(a,b) {
              return a.position - b.position
            })
    }

    if (photog.groupprints && photog.groupprints.length > 0) {
      hasGroupprints = true;
    }

    var photogInfo = {};
    if (photog.bio != undefined) {
      photogInfo['bio'] = photog.bio.replace(/\n/g, '<br/>');;
    }


    if (photog.email != undefined) {
      photogInfo['email'] = photog.email;
    }

    if (photog.website != undefined) {
      photogInfo['website'] = (photog.website.indexOf('http://') < 0) ? 'http://'+photog.website : photog.website;
    }


    // this is to attach the correct Bootstrap column class
    // to the Jade template
    // depending on whether the photographer
    // has both solo shows and group prints or just one kind
    var soloshowPanelclass, groupprintPanelclass;
    if (hasSoloshows && hasGroupprints) {
      soloshowPanelclass = "col-lg-8";
      groupprintPanelclass = "col-lg-4";
    } else {
      soloshowPanelclass = hasSoloshows ? "col-lg-12" : "collapse";
      groupprintPanelclass = hasGroupprints ? "col-lg-12" : "collapse";
   }

    var dataObj = {
      title: photog.fname + " " + photog.lname,
      photogInfo:  photogInfo,
      bio: photog.bio,
      email: photog.email,
      website: photog.website,
      soloshowPanelclass: soloshowPanelclass,
      groupprintPanelclass: groupprintPanelclass,
      soloshows: photog.soloshows,
      clientJS_sshows: JSON.stringify(photog.soloshows),
      groupprints: photog.groupprints
    }

    res.render('photographer-detail', dataObj);
};

/* GET specific photographer's complete details */
module.exports.photographerDetails = function(req, res){
  console.log("calling api for details with auth token");

  var authheader = 'Bearer '+req.query.t;

  var requestOptions, path;
  path = '/api/photographer/'+req.params.photographerid;
  requestOptions = {
    url : apiOptions.server + path,
    method : "GET",
    json: {},
    headers: {
      'Authorization': authheader
    }
  };

  request(
    requestOptions,
    function(err, response, body) {
        // the api for details is protected so check user is authorized
        if (response.statusCode === 401 ) {
          res.redirect("/?0");
        } else {
          renderPhotographerDetailPage(req, res, body);
        }
    }
  );
};
