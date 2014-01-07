var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON;

var mongourl = process.env.MONGOLAB_URI;

function saveMessage(message, callback) {

    MongoClient.connect(mongourl, function(err, db) {
        var collection = db.collection("messagesCollection");
        collection.update({id: parseInt(message.id)}, message, {upsert: true}, function(err, res) {
        });
        callback();
    });
}

module.exports = {
    saveMessage: saveMessage
};