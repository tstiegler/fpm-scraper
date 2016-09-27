var staticLocator = function(latlng) {

    /**
     * Get GPS location from URL.
     */
    function getLocation(callback, error) {
        console.log("Using static location:", latlng);
        callback(latlng);
    }

    // Return module object.
    return {
        getLocation: getLocation
    }    
}

module.exports = staticLocator