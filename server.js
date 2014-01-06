var express = require('express');
var request = require('request');
var app = express();

var ansattListe = require('./app/ansattListe');

var username = process.env.SOCIALCAST_USERNAME;
var password = process.env.SOCIALCAST_PASSWORD;
var url = process.env.SOCIALCAST_URL;

console.log(username, password, url);

ansattListe.cacheAnsattliste();

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
        function(error, response, body) {
            if(error) {
                console.log("Feil:" + error);
            }
            res.json(body);
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
        function(error, response, body) {
            if(error) {
                console.log("Feil:" + error);
            } else {
                getLikesForMessage(id,function(likes) {
                    body.likes = likes;

                    var name = body.user.name;

                    ansattListe.findAnsatt(name, function(ansatt) {
                        body.user.senioritet = ansatt.Seniority;
                        body.user.avdeling = ansatt.Department;

                        res.json(body);
                    });
                });
            }
        }
    );

});

// if on heroku use heroku port.
var port = process.env.PORT || 1339;
app.listen(port);

function getLikesForMessage(id, callback) {
    request.get({
            url: url + "/api/messages/" + id + "/likes",
            json: true,
            'auth': {
                'user': username,
                'pass': password,
                'sendImmediately': false
            }
        },
        function (error, response, body) {
            if (error) {
                console.log("Feil:" + error);
            }
            callback(body);
        }
    );
}
