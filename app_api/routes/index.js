var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var auth = jwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'payload'
});


var ctrlPhotographers = require('../controllers/photographers');
var ctrlAuth = require('../controllers/authentication');
var ctrlWPimport = require('../controllers/wpimport');


// the routes used by the app_server controllers to get data 
router.get('/photographers', ctrlPhotographers.photographerList);
router.get('/photographer/:id', auth, ctrlPhotographers.photographerDetail);

// authentication
router.post('/register', ctrlAuth.register);
router.post('/login', ctrlAuth.login);


// these are for initial import from WordPress
router.get('/wpimport/photographers', ctrlWPimport.photographersImport);
router.get('/wpimport/soloshows', ctrlWPimport.soloShowsImport);
router.get('/wpimport/memberprints', ctrlWPimport.memberprintsImport);
router.get('/wpimport/groupshows', ctrlWPimport.groupshowsImport);
router.get('/wpimport/groupprints', ctrlWPimport.groupprintsImport);
router.get('/wpimport/xrefphotographerlists', ctrlWPimport.photographersoloshowsgroupprintsXRef);


module.exports = router;
