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


var renderSoloshows = function(req, res, body){

  var message;
  var warning = '';
  if (!(body instanceof Array)) {
    message = "API lookup error";
   // responseBody = [];
  } else if (!body.length) {
    message = "no solo shows found";
  } else {
    message = "found "+body.length+" shows";
  }

  res.render('soloshows-list', {
    title: 'Recent Member Shows',
    shows: body,
    message: message,
    warning: warning
  });
};


/* GET 'home' page of all active photographers */
module.exports.soloshowsList = function(req, res){

  console.log("module.exports.soloshowsList",res.statusCode)

  var requestOptions, path;
  path = '/api/soloshows';
  requestOptions = {
    url : apiOptions.server + path,
    method : "GET",
    json : {}
  };

  request(
    requestOptions,
    function(err, response, body) {
        if (err) {
          console.log("request for soloshows failed",err);
        } else {
          console.log("request returned stuff from api for soloshows");
          renderSoloshows(req, res, body);
        }
    }
  );
};


var renderGroupshows = function(req, res, body){

  var message;
  var warning = '';
  if (!(body instanceof Array)) {
    message = "API lookup error";
   // responseBody = [];
  } else if (!body.length) {
    message = "no solo shows found";
  } else {
    message = "found "+body.length+" shows";
  }
  console.log(message);
  res.render('groupshows-list', {
    title: 'Recent Group Shows',
    shows: body,
    message: message,
    warning: warning
  });
};

/* GET specific photographer's complete details */
module.exports.groupshowsList = function(req, res) {
  console.log("module.exports.groupshowsList",res.statusCode)

  var requestOptions, path;
  path = '/api/groupshows';
  requestOptions = {
    url : apiOptions.server + path,
    method : "GET",
    json : {}
  };
  console.log(requestOptions);
  request(
    requestOptions,
    function(err, response, body) {
        if (err) {
          console.log("request for groupshows failed",err);
        } else {
          console.log("request returned stuff from api for groupshows");
          renderGroupshows(req, res, body);
        }
    }
  );
};
