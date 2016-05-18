var mongoose = require('mongoose');

var Photog = mongoose.model('Photographer');

var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};


/*	
	get all photographers from db
 	/api/photographers 
 */
module.exports.photographerList = function(req, res) {

  Photog.find().sort('lname').select('fname lname _id').exec(function(err, docs) {

		if (err) {
			console.error(err);
			sendJSONresponse(res, 500, {
      			"message": error
    		});
		} else {
			sendJSONresponse(res, 200, docs);
		}
  });

}

/*	
	get all info about a specific photographer 
 	/api/photographer/[photog_id]
 */
module.exports.photographerDetail = function(req, res) {

  console.log('authorizing with payload ', req.body);


  getUser(req, res, function(req, res){

    console.log('authorization successful...finding photog details', req.params.id);

    if (req.params && req.params.id) {
      Photog
        .findById(req.params.id)
        .populate('groupprints soloshows')
        .exec(function(err, photog) {
          if (!photog) {
            sendJSONresponse(res, 404, { "message": "photographer not found with id "+req.params.id });
            return;
          } else if (err) {
            console.log(err);
            sendJSONresponse(res, 404, err);
            return;
          }
          sendJSONresponse(res, 200, photog);
        });
    } else {
      console.log('No photographerid specified');
      sendJSONresponse(res, 404, { "message": "No photographerid in request" });
    }
  });
}


// authentication method used when details page accessed
var User = mongoose.model('User');
var getUser = function(req, res, callback) {
  console.log("trying to findin user with email " + req.payload.email);
  if (req.payload.email) {
    User
      .findOne({ email : req.payload.email })
      .exec(function(err, user) {
        if (!user) {
          sendJSONresponse(res, 404, {
            "message": "User not found"
          });
          return;
        } else if (err) {
          console.log(err);
          sendJSONresponse(res, 404, err);
          return;
        }
        console.log(user);
        callback(req, res, user.name);
      });

  } else {
    sendJSONresponse(res, 404, {
      "message": "User not found"
    });
    return;
  }

};


