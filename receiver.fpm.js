var fpmReceiver = function(config) {

    var spawn = require('child_process').spawn;
    var pokeTable = require("./lib/pokeTable.js");
    var fs = require('fs');
    var secretReversed = require("./fpmSecret.js")(config.fingerprint);

    config.maxTries = config.maxTries || 200;

    // Attempt the security authorize
    var prcSec = spawn('curl', [
        '--insecure',
        'https://fastpokemap.se/sec?authorize=' + Math.random() + '.fpmSecretToken',  
        '-H', "pragma: no-cache",
        '-H', "accept-encoding: gzip, deflate, sdch, br",
        '-H', "x-requested-with: XMLHttpRequest" ,
        '-H', "accept-language: en-US,en;q=0.8" ,
        '-H', "user-agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36",
        '-H', "accept: */*", 
        '-H', "cache-control: no-cache", 
        '-H', "authority: fastpokemap.se", 
        '-H', "referer: https://fastpokemap.se/", 
        '--compressed'        
    ]);    
    prcSec.on('close', function (code) {
        prcSec.stdout.resume(); 
        prcSec.kill();
    });

    /**
     * Attempt a single spawn point fetch by hitting the fastpokemap API.
     */
    function attemptFetch(lat, lng, callback) {
        try {
            fs.unlinkSync("output.json");
        } catch(err) {
            console.log("Couldn't delete output.json");
        }

        var url = secretReversed.generateKeyCheck('https://api.fastpokemap.se/?&lat=' + lat + '&lng=' + lng);
        console.log("Using URL:", url);

        var prc = spawn('curl', [
            '--insecure',
            url,  
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
            prc.stdout.resume(); 
            prc.kill();

            var contents = "";

            try {       
                contents = fs.readFileSync('output.json').toString();
            } catch(err) {
                callback({ error: err });
                return;
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
    function fetch(lat, lng, callback, error, tries) {
        tries = tries || 1;

        if(tries > config.maxTries) {
            console.log("Took too long D:");
            error();
        }        

        attemptFetch(lat, lng, function(contents) {
            if("error" in contents && contents.error === "overload") {
                console.log("Overloaded, waiting (" + tries + " " + ((tries == 1) ? "try" : "tries") + ")...");
                setTimeout(function() { fetch(lat, lng, callback, error, tries + 1); }, 0);
            } else if("error" in contents) {
                console.log("Unexpected error!");
                console.log(contents);
                setTimeout(function() { fetch(lat, lng, callback, error, tries + 1); }, 0);
            } else {                
		if(contents.result.length == 0) {
			console.log("0 results, try aain. (" + tries + " " + ((tries == 1) ? "try" : "tries") + ")...");
			setTimeout(function() { fetch(lat, lng, callback, error, tries + 1); }, 0);
		} else
	                callback(filterSpawns(contents.result), tries);
            }            
        });
    }


    /**
     * Filter spawns
     */
    function filterSpawns(spawns) {
        var result = [];

        for(var i in spawns) {
            if(!spawns.hasOwnProperty(i) || !("pokemon_id" in spawns[i]))
                continue;

            var spawn = spawns[i];
            var filteredSpawn = {
                id: nameToId(spawn['pokemon_id']),
                name: pokeTable[nameToId(spawn['pokemon_id'])].name,
                expiration: parseInt(spawn["expiration_timestamp_ms"], 10),
                lat: parseFloat(spawn["latitude"]),
                lng: parseFloat(spawn["longitude"]),
                encounterId: "" + spawn['encounter_id'],
                spawnPointId: spawn["spawn_point_id"]
            };

            result.push(filteredSpawn);
        }
    
        return result;
    }


    /**
     * Convert pokemon name to ID.
     */
    function nameToId(name) {
        name = name.trim().toLowerCase();

        for(var i in pokeTable) {
            if(i != "0" && pokeTable.hasOwnProperty(i)) {
                if(pokeTable[i].name.toLowerCase() == name)
                    return pokeTable[i].id;
            }
        }

        return -1;
    }

    // Return module object.
    return {
        fetch: fetch
    };
}

module.exports = fpmReceiver;
