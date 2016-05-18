var express = require('express');
var router = express.Router();
var ctrlSohoPhotographers = require('../controllers/photographers');
var ctrlSohoShows = require('../controllers/shows');

/* Locations pages */
router.get('/', ctrlSohoPhotographers.homelist);
router.get('/photographer/:photographerid', ctrlSohoPhotographers.photographerDetails);

router.get('/soloshows', ctrlSohoShows.soloshowlist);
router.get('/groupshows', ctrlSohoShows.groupshowsList);



module.exports = router;
