var express = require('express');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var app = express();

var Db = require('mongodb').Db,
   MongoClient = require('mongodb').MongoClient,
   Server = require('mongodb').Server,
   ReplSetServers = require('mongodb').ReplSetServers,
   ObjectID = require('mongodb').ObjectID,
   Binary = require('mongodb').Binary,
   GridStore = require('mongodb').GridStore,
   Grid = require('mongodb').Grid,
   Code = require('mongodb').Code,
   BSON = require('mongodb').pure().BSON;

var ansattListe = require('./app/ansattListe');

var username = process.env.SOCIALCAST_USERNAME;
var password = process.env.SOCIALCAST_PASSWORD;
var url = process.env.SOCIALCAST_URL;

process.setMaxListeners(0);
console.log(username, password, url);

ansattListe.cacheAnsattliste();

var likesCache = {};

var demo_url = "https://api.github.com/users/bekkopen/repos";
app.get('/', function(req, res) {
  request.get({
    url: demo_url,
    json: true,
    headers: {
            'User-Agent': 'request'
                }
    }, function(error, response, body) {
      if(error) {
        console.log("an error has occured. keep calm and carry on.");
      }
      res.json(body);
    });


});

app.get('/messages', function(req, res) {
    request.get({
            url: url + "/api/messages",
            json: true,
            'auth': {
                'user': username,
                'pass': password,
                'sendImmediately': false
            }
        },
        function(error, response, messageList) {
            if(error) {
                console.log("Feil:" + error);
            } else {
                async.map(messageList, getLikesForMessage, function(err, messageListWithLikes) {
                    res.json(messageListWithLikes);
                });
            }
        }
    );

});

app.get('/message/:id', function(req, res) {

    var id = req.params.id;

    request.get({
            url: url + "/api/messages/" + id,
            json: true,
            'auth': {
                'user': username,
                'pass': password,
                'sendImmediately': false
            }
        },
        function(error, response, message) {
            if (error) {
                console.log("Feil:" + error);
            } else {
                getLikesForMessage(message, function(err, messageWithLikes) {
                    var name = messageWithLikes.user.name;

                    ansattListe.findAnsatt(name, function (ansatt) {
                        if (!_.isUndefined(ansatt)) {
                            messageWithLikes.user.senioritet = ansatt.Seniority;
                            messageWithLikes.user.avdeling = ansatt.Department;
                        }

                        res.json(messageWithLikes);
                    });
                });
            }
        }
    );

});

// if on heroku use heroku port.
var port = process.env.PORT || 1339;
app.listen(port);

function getLikesForMessage(message, callback) {

    var cachedLikes = likesCache[message.id];
    if (_.isUndefined(cachedLikes)) {
        request.get({
            url: url + "/api/messages/" + message.id + "/likes",
            json: true,
            'auth': {
                'user': username,
                'pass': password,
                'sendImmediately': false
            }
        },
        function (error, response, likesForMessage) {
            if (error) {
                console.log("Feil:" + error);
            }
            message.likes = likesForMessage;

            console.log("Caching: ", message.id);
            likesCache[message.id] = likesForMessage;

            callback(error, message);
        }
        );

    } else {
        console.log("Henter fra cache ", message.id);

        message.likes = cachedLikes;

        callback(undefined, message);
    }
}
