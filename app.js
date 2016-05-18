// to read the secret env var for generating JWTs in user schema
require('dotenv').load();

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// must be required before models
var passport = require('passport');

// extra stuff after express framework generated
require('./app_api/models/db');

// must be required after models because strategy needs user model
require('./app_api/config/passport');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'app_server','views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded()); 
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// happens after static routs config but before api routs
app.use(passport.initialize());

// modified for MVC from express default
var routes = require('./app_server/routes/index');
app.use('/', routes);

// extra stuff after express framework generated
var routesApi = require('./app_api/routes/index');
app.use('/api', routesApi);


/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// Catch unauthorised errors
app.use(function (err, req, res, next) {

  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({"message" : err.name + ": " + err.message});
  }
});


/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
