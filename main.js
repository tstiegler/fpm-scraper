/**
 * FastPokeMap API scraper.
 */
 
// Spawns last for 15 minutes so theres not much point in making it less than this.
var timeBetweenChecks = 15 * 60 * 1000; 

// Cutoff for hitting the API, don't bother hitting it forever.
var maxTries = 200; 

// Send out all spawn data to an external server. 
// Set to blank to not use this feature.
var spawnCollectionEndpoint = "http://example.com/spawn.php"; 

// List of PokemonIds to notify for.
var pokemonIdsToNotify = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 23,
    24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
    34, 35, 36, 37, 38, 39, 40, 50, 51, 52, 
    53, 56, 57, 58, 59, 63, 64, 65, 66, 67, 
    68, 72, 73, 74, 75, 76, 77, 78, 81, 82, 
    83, 84, 85, 86, 87, 88, 89, 95, 100, 101, 
    104, 105, 106, 107, 108, 109, 110, 111, 112, 113,
    114, 115, 122, 123, 125, 126, 127, 130, 131, 132, 
    137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 
    147, 148, 149, 150, 151
];

// Email notification configuration.
var notifyConfig = {
    connectionString: 'smtps://example%40example.com:password@smtp.zoho.com:465',
    sendTo: "gimmespawnsnowplzthx@gmail.com",
    sendFrom: '"Your neighbourhood friendly Pokemon." <pokemon@example.com>'
};

// Array of points to check spawns at.
var pointChecks = [
    {
        gpsjson: {host: 'example.com', path: '/gps.json'}, 
        notifyProfile: pokemonIdsToNotify,
        notifyAt: notifyConfig,
        notify: true,
		maxDistance: 200
    },
    {
        lat: 34.0093515,
        lng: -118.49746820000001,
        notify: false
    }
];

// ---- NO NEED EDIT BEYOND THIS POINT ----

require("./synq.js");
require("./pokeTable.js");

var nodemailer = require('nodemailer');
var request = require('request');
var fs = require('fs');
var spawn = require('child_process').spawn;
var http = require('http');

// Kick everything off.
checkService();


/**
 * Iterate the map checks over and over.
 */
function checkService() {
    var chkTime = getTimestamp();

    checkAllPoints(function() {
        var sleepTime = 15 * 60 * 1000;

        try {
            chkTime = getTimestamp() - chkTime;
            console.log("Process took " + chkTime + " milliseconds");

            sleepTime = timeBetweenChecks - chkTime;
            if (sleepTime < 0) sleepTime = 0;

            console.log("Waiting " + (sleepTime / 1000 / 60).toFixed(2) + " minutes...");
        } catch(err) {
            console.log("Error in check service!");
        }

        setTimeout(checkService, sleepTime);
    });
}


/**
 * Convert nodejs time to basic int timestamp (It's not a unix timestamp, i dont think lol).
 */
function getTimestamp() {
    var t = process.hrtime();    
    return t[0] * 1000 + (t[1] / 1000000);
}


/**
 * Run through all checks.
 */
function checkAllPoints(callback) {
    // Iterate over all point checks.
    var iteration = synq();
    for(var i in pointChecks) {
        (function(pnt) {
            // Create a step check.
            iteration.step(function(msg, next) {
                try {
                    if("gpsjson" in pnt) {
                        downloadToString(pnt.gpsjson, function(gpsData) {                        
                            gpsData = JSON.parse(gpsData);
                            gpsData.lat = parseFloat(gpsData.lat);
                            gpsData.lng = parseFloat(gpsData.lng);
                            console.log("Downloaded GPS data: ", gpsData);

                            // Extend original point data.
                            pnt.lat = gpsData.lat;
                            pnt.lng = gpsData.lng;               

                            // Grab spawns near the point and pass them off to a handler.
                            fetch(gpsData.lat, gpsData.lng, function(content, tries) {
                                console.log("Took " + tries + " tries.");
                                handleResults(content.result, pnt, tries);                
                                next();
                            });
                        });                    
                    } else {
                        console.log("Starting check for spawns @ " + pnt.lat + "," + pnt.lng);

                        // Grab spawns near the point and pass them off to a handler.
                        fetch(pnt.lat, pnt.lng, function(content, tries) {
                            console.log("Took " + tries + " tries.");
                            handleResults(content.result, pnt, tries);                
                            next();
                        });
                    }
                } catch(err) {
                    console.log("Error in synq step!");
                    next();
                }
            });
        })(pointChecks[i]);
    }
    iteration.step(function(msg, next) {
        console.log("finished.");
        callback();
    });
}


/**
 * Send notification email.
 */
function sendNotification(notifications, pnt, info) {
    var subjectSpawns = "";
    var textSpawns = "";

    try {
        for(var i in notifications) {
            var noti = notifications[i];
            var expiryDate = new Date(parseInt(noti['expiration_timestamp_ms'], 10));

            subjectSpawns += noti["pokemon_id"] + " ";
            textSpawns += noti["pokemon_id"] + " @ http://maps.google.com/maps?z=12&t=m&q=loc:" + noti['latitude'] + '+' + noti['longitude'] + '\r\n' + 'Expires @ ' + formatDate(expiryDate) + '\r\n\r\n'; 
        }
        subjectSpawns = subjectSpawns.substr(0, subjectSpawns.length - 1);

        // create reusable transporter object using the default SMTP transport
        var transporter = nodemailer.createTransport(pnt.notifyAt.connectionString);

        // setup e-mail data,
        var mailOptions = {
            from: pnt.notifyAt.sendFrom, // sender address
            to: pnt.notifyAt.sendTo, // list of receivers
            subject: 'Spawns (' + subjectSpawns + ')', // Subject line
            text: textSpawns
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        });
    } catch(err) {
        console.log("Error in notification sending!");
    }
}


/**
 * Ripped date fotmatting.
 */
function formatDate(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
}


/**
 * Handle contents of spawn list.
 */
function handleResults(spawns, pnt, tries) {
    var notifications = [];

    for(var i in spawns) {
        var spawn = spawns[i];
        var id = nameToId(spawn['pokemon_id'].toLowerCase());
        var expiryDate = new Date(parseInt(spawn['expiration_timestamp_ms'], 10));
        var distanceFromPoke = distance(spawn['latitude'], spawn['longitude'], pnt.lat, pnt.lng);

        console.log(spawn['pokemon_id'] + "(" +  id + "): " + distanceFromPoke.toFixed(2) + "m away,  Expiring at: " + formatDate(expiryDate)) + ".";        
        spawn['id'] = id;

        var notify = false;

        // Check if this pokemon is one we want, notify.
        for(var j in pnt.notifyProfile) {
            var notifyId = pnt.notifyProfile[j];
            if(notifyId == id)
                notify = true;      
        }

        // If it is one we want, but it is outside of max distance, don't notify.
        if("maxDistance" in pnt && notify && distanceFromPoke > pnt.maxDistance)
            notify = false; 
        
        if(notify)
            notifications.push(spawn);        
    }

    sendSpawns(spawns);

    if(notifications.length > 0 && pnt.notify)
        sendNotification(notifications, pnt, {tries: tries});    
}


/**
 * Send spawn data to a server.
 */
function sendSpawns(spawns) {
	if(spawnCollectionEndpoint == "")
		return;

    console.log("Sending spawns to spawn collector.");
	
    request.post(
        spawnCollectionEndpoint,
        { form: {spawns: JSON.stringify(spawns)} },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Spend spawn: " + body)
            } else {
                console.log("Send spawn error!");
            }
        }
    );
}


/**
 * Convert pokemon name to ID.
 */
function nameToId(name) {
    for(var i in pokeTable) {
        if(i != "0" && pokeTable.hasOwnProperty(i)) {
            if(pokeTable[i].name.toLowerCase() == name)
                return pokeTable[i].id;
        }
    }

    return -1;
}


/**
 * Attempt a single spawn point fetch by hitting the fastpokemap API.
 */
function attemptFetch(lat, lng, callback) {
	try {
		fs.unlinkSync("output.json");
	} catch(err) {
		console.log("Couldn't delete output.json");
	}

    var prc = spawn('curl', [
        '--insecure',
        'https://api.fastpokemap.se/?key=allow-all&ts=0&lat=' + lat + '&lng=' + lng,  
        '-H', 'pragma: no-cache',  
        '-H', 'origin: https://fastpokemap.se', 
        '-H', 'accept-encoding: gzip, deflate, sdch, br', 
        '-H', 'accept-language: en-US,en;q=0.8', 
        '-H', 'user-agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36', 
        '-H', 'accept: application/json, text/javascript, */*; q=0.01', 
        '-H', 'cache-control: no-cache', 
        '-H', 'authority: api.fastpokemap.se', 
        '--compressed',  
        '-o', 'output.json'
    ]);

    prc.on('close', function (code) { 
        try {       
            var contents = fs.readFileSync('output.json').toString();
        } catch(err) {
             callback({ error: err });
        }

        try {                        
            callback(JSON.parse(contents));
        } catch(err) {
            callback({ error: err, originalContents: contents });
        }
    });
}


/**
 * Fetch spawn points at a given location by repeatedly attempting calls to the API.
 */
function fetch(lat, lng, callback, tries) {
    tries = tries || 1;

    if(tries > maxTries) {
        console.log("Took too long D:");
        return;
    }        

    attemptFetch(lat, lng, function(contents) {
        if("error" in contents && contents.error === "overload") {
            console.log("Overloaded, waiting (" + tries + " " + ((tries == 1) ? "try" : "tries") + ")...");
            setTimeout(function() { fetch(lat, lng, callback, tries + 1); }, 0);
        } else if("error" in contents) {
            console.log("Unexpected error!");
            console.log(contents);
            setTimeout(function() { fetch(lat, lng, callback, tries + 1); }, 0);
        } else {
            callback(contents, tries);
        }            
    });
}


/**
 * Download web request to string.
 */
function downloadToString(options, callback) {
    var req = http.request(options, function (response) {
        var str = ''
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            callback(str);
        });
    });

    req.end();
} 


/**
 * Get distance between two points.
 */
Number.prototype.toRad = function() {
    return this * Math.PI / 180;
}
function distance(lat1, lon1, lat2, lon2) {
    var R = 6371; // km 
    //has a problem with the .toRad() method below.
    var x1 = lat2-lat1;
    var dLat = x1.toRad();  
    var x2 = lon2-lon1;
    var dLon = x2.toRad();  
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                    Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);  
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; 

    return d * 1000;
}