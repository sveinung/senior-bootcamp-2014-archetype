var express = require('express');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var app = express();

app.use(express.bodyParser());

var ansattListe = require('./app/ansattListe');
var messageDB = require('./app/messageDB');

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
                    async.each(messageListWithLikes, messageDB.saveMessage, function() {
                        res.json(messageListWithLikes);
                    });
                });
            }
        }
    );

});

function retrieveMessageFromSC(id, res) {
    request.get({
            url: url + "/api/messages/" + id,
            json: true,
            'auth': {
                'user': username,
                'pass': password,
                'sendImmediately': false
            }
        },
        function (error, response, message) {
            if (error) {
                console.log("Feil:" + error);
            } else {
                getLikesForMessage(message, function (err, messageWithLikes) {
                    var name = messageWithLikes.user.name;

                    ansattListe.findAnsatt(name, function (ansatt) {
                        if (!_.isUndefined(ansatt)) {
                            messageWithLikes.user.senioritet = ansatt.Seniority;
                            messageWithLikes.user.avdeling = ansatt.Department;
                        }

                        messageDB.saveMessage(messageWithLikes, function() {
                            res.json(messageWithLikes);
                        });
                    });
                });
            }
        }
    );
}
app.get('/message/:id', function(req, res) {

    var id = req.params.id;

    messageDB.findMessageById(id, function(err, message) {
        if (message) {
            console.log("message with id " + id + " found in db, returning that doc");
            res.json(message);
        } else {
            console.log("message with id " + id + " not found in db, fetching from SC");
            retrieveMessageFromSC(id, res);
        }
    });
});


app.post('/push', function(req, res) {

    var messageFromPost = JSON.parse(req.body.data);

    messageDB.saveMessage(messageFromPost, function() {
        res.send(200);
    })
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
