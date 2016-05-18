var request = require('request');
var apiOptions = {
  server : "http://localhost:3002"
};


if (process.env.NODE_ENV === 'production') {
  // change this when uploaded to heroku
  apiOptions.server = "https://getting-mean-loc8r.herokuapp.com";
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


var renderSoloshows = function(req, res){

  res.render('soloshows-list', {
    title: 'Member Shows TBD'
  });
};


/* GET 'home' page of all active photographers */
module.exports.soloshowlist = function(req, res){
  // TBD create and call api
  renderSoloshows(req, res);
};


var renderGroupshows = function(req, res){

    var dataObj = {
      title: "Group Shows TBD"
    }

    res.render('groupshows-list', dataObj);
};

/* GET specific photographer's complete details */
module.exports.groupshowsList = function(req, res) {
  // TBD create and call api
  renderGroupshows(req, res);
};
