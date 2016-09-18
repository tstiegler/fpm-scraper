/**
 * This is a really rudimentary promise/deferred module.
 * I don't doubt that it is... not the best.
 */
 
minidef = function() {

    var doneCallbacks = [];
    var resolved = false;
    var data;

    function resolve(indata) {
        data = indata;

        for(var i in doneCallbacks)
            doneCallbacks[i](data);

        resolved = true;
    }

    var promise = {
        done: function(callback) {
            if(resolved)
                callback(data);
            else
                doneCallbacks.push(callback);
        }
    }

    var m = {
        resolve: resolve,
        promise: promise,
    };
    return m;
}