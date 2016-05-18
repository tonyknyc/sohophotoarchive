/*

	this bulk imports WordPress CPTs and their relationships
	- photographers should be imported first
	- groupprints should be imported before groupshows
	TODO : 
	put soloshow refs in Phtotgrapher docs - how to sort? should be be startdate
	put groupprint refs in Photographer docs  - how to sort? should be by startdate of show they belong to, then position within show

curl http://localhost:3002/api/wpimport/photographers
curl http://localhost:3002/api/wpimport/soloshows
curl http://localhost:3002/api/wpimport/memberprints
curl http://localhost:3002/api/wpimport/groupprints
curl http://localhost:3002/api/wpimport/groupshows
curl http://localhost:3002/api/wpimport/xrefphotographerlists

*/

var feedparser = require('ortoo-feedparser')
var async = require('async')
var mongoose = require('mongoose');

var Photog = mongoose.model('Photographer');
var SoloShow = mongoose.model('SoloShow');
var MemberPrint = mongoose.model('MemberPrint');
var GroupShow = mongoose.model('GroupShow');
var GroupPrint = mongoose.model('GroupPrint');

var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};


// this is used when importing/creating soloshows and memberprints
// also create global lu
var createPhotogsIDlookup = function(res, callback) {

  Photog.find({},'wpid _id', function(err, docs) {

		if (err) {
			console.error(err);
			sendJSONresponse(res, 500, {
      			"message": error
    		});
		} else {
			var luh = {}
			docs.forEach(function(photog, i){
				luh[photog.wpid] = photog._id
			});
			callback(res, luh)
		}
  });
};


// this is used when importing/creating groupshows
// key = photog's id ::  Value = list of groupprint ids
var createGroupPrintsIDlookup = function(res, callback) {

  GroupPrint.find({},'wpid_photog wpid_groupshow _id', function(err, docs) {

		if (err) {
			console.error(err);
			sendJSONresponse(res, 500, {
      			"message": error
    		});
		} else {
			var luh = {}
			docs.forEach(function(gp, i){

				// this lookup hash can be used by the callback function
				if (gp.wpid_groupshow in luh) {
					var tmpList = luh[gp.wpid_groupshow];
					tmpList.push(gp._id)
				} else {
					luh[gp.wpid_groupshow] = [gp._id]
				}

			});
			callback(res, luh)
		}
  });
};

// this is used  post-insertion of WP data to populate  
// soloshows array of photographer doc - see photographersoloshowsgroupprintsXRef
// key = photog's id ::  Value = list of thier soloshows ids (sorted by startdate)
var soloShowlistByPhotographerlookup = function(res, callback) {

  SoloShow.find({},'photographer_id _id', function(err, docs) {

		if (err) {
			console.error(err);
			sendJSONresponse(res, 500, {
      			"message": error
    		});
		} else {
			var luh = {}
			docs.forEach(function(sshow, i){

				// this lookup hash can be used by the callback function
				if (sshow.photographer_id in luh) {
					var tmpList = luh[sshow.photographer_id];
					tmpList.push(sshow._id)
				} else {
					luh[sshow.photographer_id] = [sshow._id]
				}

			});
			callback(res, luh)
		}
  });
};

// this is used  post-insertion of WP data to populate  
// groupprints array of photographer doc - see photographersoloshowsgroupprintsXRef
// key = photog's id ::  Value = list of thier groupprint ids (sorted by ?)
var groupPrintlistByPhotographerlookup = function(res, callback) {

  GroupPrint.find({},'photographer_id _id', function(err, docs) {

		if (err) {
			console.error(err);
			sendJSONresponse(res, 500, {
      			"message": error
    		});
		} else {
			var luh = {}
			docs.forEach(function(gp, i){

				// this lookup hash can be used by the callback function
				if (gp.photographer_id in luh) {
					var tmpList = luh[gp.photographer_id];
					tmpList.push(gp._id)
				} else {
					luh[gp.photographer_id] = [gp._id]
				}

			});
			callback(res, luh)
		}
  });
};


/*	
	parses WordPress Custom Post Type RSS export XML file
	creates photographer in db
 	/api//wpimport/photographers 
 */
module.exports.photographersImport = function(req, res) {

  feedparser.parseFile('./app_api/importdata/Photographers.xml', function(error, meta, articles) {

		if (error) {
			console.error(error);
			sendJSONresponse(res, 500, {
      			"message": error
    		});
		} else {
		    
		    articles.forEach(function (photog){	

		    	var wpid, fname, lname, email, website, bio;

		    	wpid = photog["wp:post_id"]['#'];

		    	var allMetas = photog["wp:postmeta"];
		    	allMetas.forEach(function (meta){	

					switch (meta['wp:meta_key']['#']) {
						case 'wpcf-first-name':
							fname = meta['wp:meta_value']['#'];
							break;
						case 'wpcf-last-name':
							lname = meta['wp:meta_value']['#'];
							break;
						case 'wpcf-email':
							email = meta['wp:meta_value']['#'];
							break;
						case 'wpcf-website':
							website = meta['wp:meta_value']['#'];
							break;
						case 'wpcf-biography':
							bio = meta['wp:meta_value']['#'];
							break;
					}
		    	})

				//console.log(wpid, fname, lname, email, website, bio)
				Photog.create({
				    wpid: wpid,
				    fname: fname,
				    lname: lname,
				    bio: bio,
				    email: email,
				    website: website,
				    soloshows: [],
				    groupprints: []
				  }, function(err, photog) {
				    if (err) {
				      console.log(err);
				    } else {
				      console.log(photog.wpid, photog.id, "photographer created");
				    }
				  });
		    });
		    sendJSONresponse(res, 200, {"message": meta.title});
		  }
  })
};


/*	
	- parses WordPress Custom Post Type RSS export XML file
	- retrieves photographer from db via wpid_photog
	- creates soloshow in db
 	/api/wpimport/soloshows 
 */
module.exports.soloShowsImport = function(req, res) {


	// create a hash lookup of photographers
	// key = WordPress id
	// value = Mongo ObjectId
	// so that refs can be added when Soloshows are created
	createPhotogsIDlookup(res, function(res, luh){

	  feedparser.parseFile('./app_api/importdata/SoloShows.xml', function(error, meta, articles) {

			if (error) {
				console.error(error);
				sendJSONresponse(res, 500, {
	      			"message": error
	    		});
			} else {
			    
			    articles.forEach(function (soloshow){	

			    	var wpid, wpid_photog, photog_oid, title, statement, baylocation, startdate, enddate;

			    	wpid = soloshow["wp:post_id"]['#'];
			    	title = soloshow["title"];

			    	var allMetas = soloshow["wp:postmeta"];
			    	allMetas.forEach(function (meta){	

						switch (meta['wp:meta_key']['#']) {
							case '_wpcf_belongs_photographer_id':
								wpid_photog = meta['wp:meta_value']['#'];
								break;
							case 'wpcf-statement':
								statement = meta['wp:meta_value']['#'];
								break;
							case 'wpcf-gallery-location':
								baylocation = meta['wp:meta_value']['#'];
								break;
							case 'wpcf-start-date':
								var ms = meta['wp:meta_value']['#'];
								startdate = new Date(1000 * ms);
								break;
							case 'wpcf-end-date':
								var ms = meta['wp:meta_value']['#'];
								enddate = new Date(1000 * ms);
								break;
						}
			    	})


					SoloShow.create({
					    wpid: wpid,
					    wpid_photog: wpid_photog,
					    title: title,
					    statement: statement,
					    photographer_id: luh[wpid_photog],
					    baylocation: baylocation,
					    prints: [],
					    startdate: startdate,
					    enddate: enddate
					  }, function(err, sshow) {
					    if (err) {
					    	console.log(err);
					    } else {
					      	console.log(sshow);
					    }
					  });

				});
    
				sendJSONresponse(res, 200, {"message": meta.title});
			}
		});
	});
};

/*	
	- parses WordPress Custom Post Type RSS export XML file
	- creates a hash and sorts print lists per membershow
	- asynchronously retrieves soloshows from db & updates
 	/api/wpimport/memberprints', ctrlWPimport. 
 */
module.exports.memberprintsImport = function(req, res) {

  feedparser.parseFile('./app_api/importdata/MemberPrints.xml', function(error, meta, articles) {

		if (error) {
			console.error(error);
			sendJSONresponse(res, 500, {
      			"message": error
    		});
		} else {
		    
			// in the loop we construct a lookup hash
			// key = wpid of the SoloShow
			// value = array of MemberPrints sorted by position
			// then we can pull the shows out of the db and embed th array & resave
			var showprintsLookup = {};

		    articles.forEach(function (mprint){	

		    	var wpid, wpid_soloshow, position, imgpath, title, width, height, medium, priceunframed, priceframed

		    	wpid = mprint["wp:post_id"]['#'];
		    	title = mprint["title"];

		    	var allMetas = mprint["wp:postmeta"];
		    	allMetas.forEach(function (meta){	

					switch (meta['wp:meta_key']['#']) {
						case '_wpcf_belongs_member-show_id':
							wpid_soloshow = meta['wp:meta_value']['#'];
							break;
						case 'wpcf-position':
							position = meta['wp:meta_value']['#'];
							break;
						case 'wpcf-jpg-file':
							var str = meta['wp:meta_value']['#'];
							var strmatch = "http://localhost/wp-content/uploads";
							imgpath = str.replace(strmatch,'/images');
							break;
						case 'wpcf-width':
							width = meta['wp:meta_value']['#'];
							break;
						case 'wpcf-height':
							height = meta['wp:meta_value']['#'];
							break;
						case 'wpcf-medium':
							medium = meta['wp:meta_value']['#'];
							break;
						case 'wpcf-price-framed':
							priceframed = meta['wp:meta_value']['#'];
							break;
						case 'wpcf-price-unframed':
							priceunframed = meta['wp:meta_value']['#'];
							break;
					}
		    	}) 

		    	var memberprint = {
				    imgpath: imgpath,
    				position: position,
				    title: title,
				    medium: medium,
				    width: width,
				    height: height,
				    priceunframed: priceunframed,
				    priceframed: priceframed
				}

				if (wpid_soloshow in showprintsLookup) {
					var tmpList = showprintsLookup[wpid_soloshow];
					tmpList.push(memberprint)
				} else {
					showprintsLookup[wpid_soloshow] = [memberprint]
				}


		    });

		    // sort the arrays of prints
		    for (var key in showprintsLookup) {

		    	var prints = showprintsLookup[key];

		    	prints.sort( function(a,b) {
		    		return a.position - b.position
		    	})
		    }

		    // find each soloshow and add the prints
		    // this works but probably better functional way of doing it...
		    async.each(Object.keys(showprintsLookup), function(k, next){

		    	SoloShow
		    		.findOne({"wpid":Number(k)})
		    		.select('wpid title prints')
					.exec(function(err, sshow) {
					        if (!sshow) {
							  	console.log(k, "no soloshow found with this wpid");
					        } else if (err) {
					    		console.log(k, err);
					        } else {
					        	//sshow.prints = new Array();
					        	sshow.prints = showprintsLookup[k];
								sshow.save(function(err, sshow) {
								    if (err) {
								    	console.log(sshow.wpid, sshow.title, err);
								    } else {
								      	console.log(sshow.wpid, sshow.title, "save successful");
								    }
								  });
							}
				 });
		    })

		    sendJSONresponse(res, 200, {"message": meta.title});
		  }
  })
};




/*	
	parses WordPress Custom Post Type RSS export XML file
	inserts into MongoDB
 	/api/wpimport/groupprints', ctrlWPimport. 
 */
module.exports.groupprintsImport = function(req, res) {

	// create a hash lookup of photographers
	// key = WordPress id
	// value = Mongo ObjectId
	// so that refs can be added when GroupPrints are created
	createPhotogsIDlookup(res, function(res, luh){

		  feedparser.parseFile('./app_api/importdata/GroupPrints.xml', function(error, meta, articles) {

				if (error) {
					console.error(error);
					sendJSONresponse(res, 500, {
		      			"message": error
		    		});
				} else {


				    articles.forEach(function (gprint){	

				    	var wpid, wpid_photog, wpid_groupshow, position, imgpath, title, desc, width, height, medium, priceunframed, priceframed

				    	wpid = gprint["wp:post_id"]['#'];
				    	title = gprint["title"];
				    	console.log(wpid, title);

				    	var allMetas = gprint["wp:postmeta"];

				    	allMetas.forEach(function (meta){	

							switch (meta['wp:meta_key']['#']) {
								case '_wpcf_belongs_photographer_id':
									wpid_photog = meta['wp:meta_value']['#'];
									break;
								case '_wpcf_belongs_group-show_id':
									wpid_groupshow = meta['wp:meta_value']['#'];
									break;
								case 'wpcf-grp-position':
									position = meta['wp:meta_value']['#'];
									break;
								case 'wpcf-grp-jpg-file':
									var str = meta['wp:meta_value']['#'];
									var strmatch = "http://localhost/wp-content/uploads";
									imgpath = str.replace(strmatch,'/images');
									break;
								case 'wpcf-grp-width':
									width = meta['wp:meta_value']['#'];
									break;
								case 'wpcf-grp-height':
									height = meta['wp:meta_value']['#'];
									break;
								case 'wpcf-rp-medium':
									medium = meta['wp:meta_value']['#'];
									break;
								case 'wpcf-group-show-print-desc':
									desc = meta['wp:meta_value']['#'];
									break;
								case 'wpcf-rp-gprice-framed':
									priceframed = meta['wp:meta_value']['#'];
									break;
								case 'wpcf-grp-price-unframed':
									priceunframed = meta['wp:meta_value']['#'];
									break;
							}
				    	}) 

				    	console.log("looking up photog id",wpid_photog,luh[wpid_photog])

						GroupPrint.create({
							    wpid: wpid,
							    wpid_photog: wpid_photog,
							    wpid_groupshow: wpid_groupshow,
							    photographer_id: luh[wpid_photog],
							    imgpath: imgpath,
							    position: position,
							    title: title,
							    desc: desc,
							    medium: medium,
							    width: width,
							    height: height,
							    priceunframed: priceunframed,
							    priceframed: priceframed
							}, function(err, gprint) {
							    if (err) {
							      console.log(err);
							    } else {
							      console.log(gprint.title);
							    }
							 });
				    });

				    sendJSONresponse(res, 200, {"message": meta.title});
				  }
		  })

	});
};



/*	
	parses WordPress Custom Post Type RSS export XML file
	inserts into MongoDB
 	/api/wpimport/grouphows 
 */
module.exports.groupshowsImport = function(req, res) {

	// create a hash lookup of photographers
	// key = WordPress id of GroupShow
	// value = list of Mongo ObjectIds of GroupPrints
	// so that refs can be added when GroupShows are created
	createGroupPrintsIDlookup(res, function(res, luh){

		  feedparser.parseFile('./app_api/importdata/GroupShows.xml', function(error, meta, articles) {

				if (error) {
					console.error(error);
					sendJSONresponse(res, 500, {
		      			"message": error
		    		});
				} else {
				    
				    articles.forEach(function (gshow){	

				    	var wpid, title, baylocation, startdate, enddate;

				    	wpid = gshow["wp:post_id"]['#'];
				    	title = gshow["title"];

				    	var allMetas = gshow["wp:postmeta"];
				    	allMetas.forEach(function (meta){	

							switch (meta['wp:meta_key']['#']) {

								case 'wpcf-grp-gallery-location':
									baylocation = meta['wp:meta_value']['#'];
									break;
								case 'wpcf-group-start-date':
									var ms = meta['wp:meta_value']['#'];
									startdate = new Date(1000 * ms);
									break;
								case 'wpcf-group-end-date':
									var ms = meta['wp:meta_value']['#'];
									enddate = new Date(1000 * ms);
									break;
							}
				    	})

						GroupShow.create({
						    wpid: wpid,
						    title: title,
						    baylocation: baylocation,
						    prints: luh[wpid],
						    startdate: startdate,
						    enddate: enddate
						  }, function(err, gshow) {
						    if (err) {
						    	console.log(err);
						    } else {
						      	console.log(gshow.wpid, gshow.title);
						    }
						  });
					});
		    
		    		sendJSONresponse(res, 200, {"message": meta.title});
				}
		  })
	});
};


/*	
	run after importing all data from WP
	inserts 2 lists of ObjectID into photographers'' 
 	/api/wpimport/xrefphotographerlists 
 */
module.exports.photographersoloshowsgroupprintsXRef = function(req, res) {

	soloShowlistByPhotographerlookup(res, function(res, sshowLUH){

		groupPrintlistByPhotographerlookup(res, function(res, gprintLUH){

			Photog.find({},'soloshows groupprints _id', function(err, docs) {

				if (err) {
					console.error(err);
					sendJSONresponse(res, 500, {
		      			"message": error
		    		});
				} else {

					docs.forEach(function(photog, i){

						photog.soloshows = sshowLUH[photog._id];
						photog.groupprints = gprintLUH[photog._id];
						photog.save(function(err, photog) {
						    if (err) {
						    	console.log(err);
						    } else {
						      	console.log("saved lists to photog doc successful");
						    }
						});
					});
				}
		  	});

			sendJSONresponse(res, 200, {"message": "yoyo"});
		});
	});
};



