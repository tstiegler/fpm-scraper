var httpPostSender = function(config) {

    var request = require('request');
    
    var outputName = config.exportName || "";

    /**
     * Send spawn data to a server.
     */
    function sendSpawns(spawns, pnt) {
        console.log("Sending spawns to spawn collector.");
        
        var formData = {spawns: JSON.stringify(spawns)};

        if(outputName != "")
            formData.outname = outputName;

        request.post(
            config.url,
            { form: formData},
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("Spend spawn: " + body)
                } else {
                    console.log("Send spawn error!");
                    console.log(error);
                }
            }
        );
    }

    // Return module object.
    return {
        sendSpawns: sendSpawns
    };
}

module.exports = httpPostSender;