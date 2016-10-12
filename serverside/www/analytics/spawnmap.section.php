<?php
    // All this analysis code is VERY very crude. Hacked up as quick as possible, so the quality is not that great.

    global $minExpiration;

    $sql = "select spawnpoint, lat, lng, expiration from pokemon_spawns where expiration > " . $minExpiration . " group by spawnpoint ORDER BY expiration DESC";    
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->bindParam(':pid', $_GET['id']);
    $stmt->execute();
    $spawnpoints = $stmt->fetchAll();

    echo "<script> var spawns = " . json_encode($spawnpoints) . ";</script>";    
?>

    <style>
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        #map {
            position: absolute;
            top: 0;
            left: 0;

            height: 100%;
            width: 100%;

            z-index: 1;
        }
        nav { z-index: 2; position: absolute; top: 0; left 0; width: 100%;}
        #dist { z-index: 3; position: absolute; bottom: 0; left: 0; width: 100%; background-color: #fff; }
        #controls { z-index: 3; position: absolute; top: 80px; left 0; width: 100%; }
    </style>

<div class="row">
    <div class="col s12">

    <div id="map"></div>

    <div id="controls">
        <div class="switch">
            <label>
            Use GPS JSON:
            <input type="checkbox" id="gpsjson" hecked="checked">
            <span class="lever"></span>
            </label>
        </div> 
    </div>

    <div id="dist"></div>

    <script>
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

function initMap() {

    var maxDistance = 200;

    $(document).ready(function() {
        $('#gpsjson').prop('checked', true);   
        $('#gpsjson').change(function() {
            var checked = $(this).is(":checked");

            if(checked) {
                maxDistance = 200;
                getNearestMarkers();
            } else {
                maxDistance = -1;
                showPosition({
                    coords: { 
                        latitude: 0,
                        longitude: 0
                    }
                });
            }
        });    
    });

    var cMarkerId = 0;

    function CustomMarker(latlng, map, args) {
        this.latlng = latlng;	
        this.args = args;	
        this.setMap(map);	

        cMarkerId++;
        this.markerId = cMarkerId;
    }

    CustomMarker.prototype = new google.maps.OverlayView();

    CustomMarker.prototype.draw = function() {
        
        var self = this;
        
        var div = this.div;
        
        if (!div) {
        
            div = this.div = document.createElement('div');
            
            div.className = 'marker';
            
            div.style.position = 'absolute';
            div.style.cursor = 'pointer';
            div.style.width = '40px';
            div.style.height = '20px';
            div.style.background = 'rgba(0, 0, 0, 0.8)';
            div.style['border-radius'] = "5px";
            div.style['text-align'] = "center";
            div.style['font-size'] = "12px";
            div.style['color'] = "#FFF";

            div.id = "mrk-" + self.markerId;
            
            if (typeof(self.args.marker_id) !== 'undefined') {
                div.dataset.marker_id = self.args.marker_id;
            }
            
            google.maps.event.addDomListener(div, "click", function(event) {			
                google.maps.event.trigger(self, "click");
            });
            
            var panes = this.getPanes();
            panes.overlayImage.appendChild(div);
        }
        
        var point = this.getProjection().fromLatLngToDivPixel(this.latlng);
        
        if (point) {
            div.style.left = (point.x - 20) + 'px';
            div.style.top = (point.y + 3) + 'px';
        }
    };

    CustomMarker.prototype.remove = function() {
        if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
        }	
    };

    CustomMarker.prototype.getPosition = function() {
        return this.latlng;	
    };

    console.log("initmap");

    var pLine;
    var originLocation = {lat: 0, lng: 0};        
    var pLineData = [
        originLocation,
        originLocation
    ]

    var timeMarkers = {};

    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 18,
        center: {lat: 0, lng: 0}
    });

    map.addListener('click', function(evt) { originLocation.lat = evt.latLng.lat(); originLocation.lng = evt.latLng.lng(); });

    function pad(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
    }

    window.setInterval(function() {
        var cDate = new Date();

        for(var i in timeMarkers) {
            (function(sid) {
                var spawn = timeMarkers[sid];

                var st = spawn.min * 60 + spawn.sec;
                var ct = cDate.getMinutes() * 60 + cDate.getSeconds();

                var mt = st - ct;
                if(mt < 0)
                    mt += 3600;

                var mins = Math.floor(mt / 60);
                var secs = (mt - (mins * 60));

                var textClass = "red-text text-lighten-1";
                if(mins < 20) textClass = "orange-text text-lighten-1"; 
                if(mins < 15) textClass = "green-text text-lighten-1";                

                $("#mrk-" + sid).html("<span class='" + textClass + "'>" + mins + ":" + pad(secs, 2) + "</span>");                
            })(i);
        }         
    }, 1000);    

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        }
    }
    
    var allMarkers = [];
    var allOverlays = [];

    function showPosition(position) {
        map.setCenter({lat: position.coords.latitude, lng: position.coords.longitude});
        cMarkerId = 0;

        for(var i = 0; i < allMarkers.length; i++) {
            allMarkers[i].setMap(null);
        }

        for(var i = 0; i < allOverlays.length; i++) {
            allOverlays[i].remove();
            allOverlays[i].setMap(null);
        }

        allMarkers = [];
        allOverlays = [];
        timeMarkers = {};

        for(var i in spawns) {
            (function(sid) {    

                var d = distance(position.coords.latitude, position.coords.longitude, parseFloat(spawns[sid]['lat']), parseFloat(spawns[sid]['lng']));
                if(maxDistance != -1 && d > maxDistance)
                    return;

                var myLatLng = {lat: parseFloat(spawns[sid]['lat']), lng: parseFloat(spawns[sid]['lng'])};
                var marker = new google.maps.Marker({
                    position: myLatLng,
                    map: map,
                    title: spawns[sid]['spawnpoint']
                });
                allMarkers.push(marker);

                var overlay = new CustomMarker(
                    new google.maps.LatLng(myLatLng.lat, myLatLng.lng), 
                    map,
                    {
                        marker_id: '123',
                        colour: 'Red'
                    }
                );
                allOverlays.push(overlay);

                var sd = new Date(parseInt(spawns[sid]['expiration'], 10));
                timeMarkers[cMarkerId] = spawns[sid];                
                timeMarkers[cMarkerId].min = sd.getMinutes();
                timeMarkers[cMarkerId].sec = sd.getSeconds();

                marker.addListener('click', function(evt) {
                    var infowindow = new google.maps.InfoWindow({
                        content: "<a href='index.php?section=spawnpoint&id=" + spawns[sid]['spawnpoint'] + "'>Spawn point: " + spawns[sid]['spawnpoint']+ "</a>"
                    });

                    pLineData[0] = {lat: evt.latLng.lat(), lng: evt.latLng.lng()};
                    console.log(pLineData);

                    if(pLine != null) pLine.setMap(null);

                    pLine = new google.maps.Polyline({
                        path: pLineData,
                        geodesic: true,
                        strokeColor: '#FF0000',
                        strokeOpacity: 1.0,
                        strokeWeight: 2
                    });	

                    pLine.setMap(map);
                    var d = distance(pLineData[0].lat, pLineData[0].lng, pLineData[1].lat, pLineData[1].lng);
                    $("#dist").text("Distance: " + d.toFixed(2) + "m");

                    infowindow.open(map, marker);
                });
            })(i);
        }        
    }

    function getNearestMarkers() {
        $.get("/gps.json", function(data) { 
            if(maxDistance != -1) {
                showPosition({
                    coords: { 
                        latitude: parseFloat(data.lat),
                        longitude: parseFloat(data.lng)
                    }
                });
            }
        }, "json"); 
    }

    window.setInterval(getNearestMarkers, 60000);
    window.setTimeout(getNearestMarkers, 3000);
}
    </script>
	
    </div>
</div>