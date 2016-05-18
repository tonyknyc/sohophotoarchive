var mongoose = require('mongoose'), Schema = mongoose.Schema;

var memberprintSchema = Schema({
    wpid: Number,
    imgpath: String,
    position: Number,
    title: String,
    medium: String,
    width: Number,
    height: Number,
    priceunframed: Number,
    priceframed: Number
});

var soloshowSchema = Schema({
    wpid: Number,
    wpid_photog: Number,
    title: String,
    statement: String,
    photographer_id: { type: Schema.Types.ObjectId, ref: 'Photographer' },
    baylocation: Number,
    prints: [memberprintSchema],
    startdate: Date,
    enddate: Date
});

var groupprintSchema = Schema({
    wpid: Number,
    wpid_photog: Number,
    wpid_groupshow: Number,
    photographer_id: { type: Schema.Types.ObjectId, ref: 'Photographer' },
    imgpath: String,
    position: Number,
    title: String,
    desc: String,
    medium: String,
    width: Number,
    height: Number,
    priceunframed: Number,
    priceframed: Number
});

var groupshowSchema = Schema({
    wpid: Number,
    title: String,
    baylocation: String,
    prints: [{ type: Schema.Types.ObjectId, ref: 'GroupPrint' }],
    startdate: Date,
    enddate: Date
});

var photographerSchema = Schema({
    wpid: Number,
    fname: String,
    lname: String,
    bio: String,
    email: String,
    website: String,
    soloshows: [{ type: Schema.Types.ObjectId, ref: 'SoloShow' }],
    groupprints: [{ type: Schema.Types.ObjectId, ref: 'GroupPrint' }]
});



mongoose.model('MemberPrint', memberprintSchema);
mongoose.model('SoloShow', soloshowSchema);
mongoose.model('GroupPrint', groupprintSchema);
mongoose.model('GroupShow', groupshowSchema);
mongoose.model('Photographer', photographerSchema);
