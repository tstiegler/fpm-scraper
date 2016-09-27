/**
 * FastPokeMap API scraper. by Thomas Stiegler
 * http://thomasstiegler.com
 *
 * Edit the stuff below, make sure the CURL executable is accessible from the
 * working directory.
 */

// Includes for the notifiers we want to use.
var moduleReferences = {
    "locators": {
        gpsJsonLocator: require("./locator.gpsjson.js"),
        staticLocator: require("./locator.static.js")
    },
    "notifiers": {
        emailNotifier: require("./notifier.email.js")
    },
    "senders": {
        httpPostSender: require("./sender.httppost.js")
    },
    "receivers": {
        fpmReceiver: require("./receiver.fpm.js")
    }
};

var config = require("./config.js");
var synq = require("./lib/synq.js");
var encounters = {};

// Kick everything off.
checkService();


/**
 * Iterate the map checks over and over.
 */
function checkService() {
    var chkTime = getTimestamp();

    checkAllPoints(function() {
        cleanSpawnHistory();

        try {
            chkTime = getTimestamp() - chkTime;
            console.log("Process took " + chkTime + " milliseconds");

            var sleepTime = config.timeBetweenChecks - chkTime;
            if (sleepTime < 0) sleepTime = 0;

            console.log("Waiting " + (sleepTime / 1000 / 60).toFixed(2) + " minutes...");

            setTimeout(checkService, sleepTime);
        } catch(err) {
            console.log("Error in check service!");
            setTimeout(checkService, config.timeBetweenChecks);
        }        
    });
}


/**
 * Remove all old spawns from the spawn history.
 */
function cleanSpawnHistory() {
    var currentTime = getTimestamp();
    console.log("Cleaning old encounters (current time: " + currentTime + ")");

    for(var i in encounters) {
        if(encounters.hasOwnProperty(i)) {
            var timeSinceSeen = currentTime - encounters[i]['timestamp'];
            if (timeSinceSeen > (1000 * 60 * 60)) {
                delete encounters[i];
                console.log("Removed " + i + " (" + timeSinceSeen + " ms old)");                
            }    
        }
    }
}


/**
 * Convert nodejs time to basic int timestamp (It's not a unix timestamp, i dont think lol).
 */
function getTimestamp() {
    var t = process.hrtime();    
    return t[0] * 1000 + (t[1] / 1000000);
}


/**
 * Build the config with module instances.
 */
function buildConfig() {
    var result = [];

    for(var i in config.pointChecks) {
        if(!config.pointChecks.hasOwnProperty(i))
            continue;

        var cfg = config.pointChecks[i];

        var cfgEntry = {};

        if("notifyOnPokemonIds" in cfg)
            cfgEntry.notifyOnPokemonIds = cfg.notifyOnPokemonIds;

        if("maxDistance" in cfg)
            cfgEntry.maxDistance = cfg.maxDistance;

        if("locator" in cfg)
            cfgEntry.locator = moduleReferences.locators[cfg.locator.module](cfg.locator.config);
        
        if("notifier" in cfg)
            cfgEntry.notifier = moduleReferences.notifiers[cfg.notifier.module](cfg.notifier.config);
    
        if("spawnSender" in cfg)
            cfgEntry.spawnSender = moduleReferences.senders[cfg.spawnSender.module](cfg.spawnSender.config);

        if("receiver" in cfg)
            cfgEntry.receiver = moduleReferences.receivers[cfg.receiver.module](cfg.receiver.config);

        result.push(cfgEntry);
    }

    return result;
}


/**
 * Run through all checks.
 */
function checkAllPoints(callback) {
    var currentConfig = buildConfig();

    // Iterate over all point checks.
    var iteration = synq();
    for(var i in currentConfig) {
        (function(pnt) {
            iteration.step(function(msg, next) {
                try {
                    pnt.locator.getLocation(function(location) {
                        // Inject location back into the point (used in distance calculations).
                        pnt.location = location;

                        // Grab spawns near the point and pass them off to a handler.
                        pnt.receiver.fetch(location.lat, location.lng, function(content, tries) {
                            console.log("Took " + tries + " tries.");
                            handleResults(content, pnt, tries);                
                            next();
                        }, function(err) { throw {message: "Error while fetching spawns.", error: err}; });
                    }, function(err) { throw {message: "Error while getting location.", error: err} });
                } catch(err) {
                    console.log("Error in synq step!");
                    console.log(err)
                    next();
                }
            });
        })(currentConfig[i]);
    }
    iteration.step(function(msg, next) {
        console.log("finished.");
        callback();
    });
}


/**
 * Handle contents of spawn list.
 */
function handleResults(spawns, pnt, tries) {
    var notifications = [];

    for(var i in spawns) {
        var spawn = spawns[i];

        var expiryDate = new Date(spawn.expiration);
        var distanceFromPoke = distance(spawn.lat, spawn.lng, pnt.location.lat, pnt.location.lng);
        spawn['distance'] = distanceFromPoke.toFixed(2) + "m away";        

        // Check if we have information about this encounter.
        if(!(spawn.encounterId in encounters)) {
            // Save spawn info.
            encounters[spawn.encoutnerId] = {
                spawninfo: spawn,
                timestamp: getTimestamp()
            };

            console.log("[" + spawn.encounterId + "] " + spawn.name + "(" +  spawn.id + "): " + distanceFromPoke.toFixed(2) + "m away,  Expiring at: " + formatDate(expiryDate) + ".");        

            // Check if we even have IDs to check against.
            if("notifyOnPokemonIds" in pnt) {
                var notify = false;

                // Check if this pokemon is one we want, notify.
                for(var j in pnt.notifyOnPokemonIds) {
                    var notifyId = pnt.notifyOnPokemonIds[j];
                    if(notifyId == spawn.id)
                        notify = true;      
                }

                // If it is one we want, but it is outside of max distance, don't notify.
                if("maxDistance" in pnt && notify && distanceFromPoke > pnt.maxDistance)
                    notify = false; 
                
                if(notify)
                    notifications.push(spawn);
            }
        } else {
            console.log("[" + spawn.encounterId + "] " + spawn.name + "(" +  spawn.id + "): " + distanceFromPoke.toFixed(2) + "m away,  Expiring at: " + formatDate(expiryDate) + ". (OLD SPAWN)"); 
        }
    }

    // Sent spawns to external server.
    if("spawnSender" in pnt && pnt.spawnSender != null)
        pnt.spawnSender.sendSpawns(spawns, pnt);

    // Send notifications if we have some.
    if(notifications.length > 0 && "notifier" in pnt && pnt.notifier != null)
        pnt.notifier.sendNotification(notifications, pnt, {tries: tries});    
}



/**
 * Date fotmatting, ripped from somewhere.
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