var gpsJsonLocator = function(gpsUrl) {

    var http = require('http');

    /**
     * Get GPS location from URL.
     */
    function getLocation(callback, error) {
        console.log("Getting GPS location...");

        downloadToString(gpsUrl, function(gpsData) { 
            try {                       
                gpsData = JSON.parse(gpsData);
                gpsData.lat = parseFloat(gpsData.lat);
                gpsData.lng = parseFloat(gpsData.lng);
                console.log("Downloaded GPS data: ", gpsData);

                // Extend original point data.
                var location = {lat: gpsData.lat, lng: gpsData.lng};           
                callback(location);           
            } catch(err) {
                error(err);
            } 
        }, error);
    }


    /**
     * Download web request to string.
     */
    function downloadToString(options, callback, error) {
        try {
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
        } catch(err) {
            error(err);
        } 
    } 

    // Return module object.
    return {
        getLocation: getLocation
    }
}

module.exports = gpsJsonLocator