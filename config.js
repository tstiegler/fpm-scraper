
// Time to wait between checking spawn points.
module.exports.timeBetweenChecks = 5 * 60000; 

// Array of points to check spawns at.
module.exports.pointChecks = [
    {        
        maxDistance: 200,         
        notifyOnPokemonIds: [
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
        ],
        locator: {
            module: "gpsJsonLocator",
            config: {host: 'example.com', path: '/gps.json'}
        },        
        notifier: {
            module: "emailNotifier",
            config: {
                connectionString: 'smtps://example%40example.com:password@smtp.zoho.com:465',
                sendTo: "gimmespawnsnowplzthx@gmail.com",
                sendFrom: '"Your friendly neighbourhood Pokemon." <pokemon@example.com>'
            }
        },
        spawnSender: {
            module: "httpPostSender",
            config: {
                url: "http://example.com/spawn.php", 
                exportName: "nearby"
            }
        },
        receiver: {
            module: "fpmReceiver",
            config: {}
        }
    },
    {
        locator: {
            module: "staticLocator",
            config: {lat: 34.0093515, lng: -118.49746820000001},
        },
        spawnSender: {
            module: "httpPostSender",
            config: {
                url: "http://example.com/spawn.php"
            }
        },
        receiver: {
            module: "fpmReceiver",
            config: {}
        }
    }
];