var minidef = require("./minidef.js");

/**
 * This is a really rudimentary asynchronous flow control module.
 * I don't doubt that it is... not the best.
 */
var synq = function () {    

    // Setup the initial promise and immediately resolve it.
    var currentDeferred = minidef();
    currentDeferred.resolve();
    
    var gateDeferred;

    /**
     * Handle adding in new sequential steps.
     */
    function step(action) {
        var newDeferred = minidef();

        currentDeferred.promise.done(function (data) {
            action(data, function (msg) {
                newDeferred.resolve(msg);
            });
        });

        currentDeferred = newDeferred;

        return m;
    }


    /**
     * Set up a gate to prevent steps from immediately running.
     */
    function gate() {
        gateDeferred = minidef();
        currentDeferred = gateDeferred;
    }


    /**
     * Open the gate, allowing queued steps to run.
     */
    function unGate() {
        gateDeferred.resolve();
    }


    // Create and return module.
    var m = {
        step: step,
        gate: gate,
        unGate: unGate
    };

    return m;
};

module.exports = synq;