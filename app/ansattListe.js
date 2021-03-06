var request = require('request');
var _ = require('underscore');

var ansattliste_url = process.env.ANSATTLISTE_URL;

var ansattListe = "Hah";

var findAnsatt = function (name, callback) {
    var temp = name.split(" ");
    var fornavn = temp[0];
    var etternavn = temp[temp.length - 1];
    
    var ansatt = _.find(ansattListe, function (ansatt) {        
        return ansatt.Name.indexOf(fornavn) > -1 && ansatt.Name.indexOf(etternavn) > -1;
	});

    if (_.isUndefined(ansatt)) {
        callback(undefined);
        return;
    }

	request.get({
		url: ansattliste_url + "/employee/" + ansatt.Id,
		json: true

	}, function(error, response, body) {
        if(error) {
          console.log("Feil: " + error);
        } else {
          callback(body[0]);
        }
    });

	if (_.isUndefined(ansatt)) {
		console.log("findAnsatt failed");
	}
};

var cacheAnsattliste = function() {
	console.log("Starter å hente ansattliste ...");

	request.get({
		url: ansattliste_url + "/all",
		json: true

	}, function(error, response, body) {
        if(error) {
          console.log("Feil cacheAnsattliste:" + error);
        } else {
          ansattListe = body;
          console.log("Ansattliste henta");
        }
    });
};

module.exports = {
    findAnsatt: findAnsatt,
    cacheAnsattliste: cacheAnsattliste
};
