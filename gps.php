<?php

    if(isset($_GET['lat']) && isset($_GET['lon'])) {
        $data = Array(
            "lat" => $_GET['lat'],
            "lng" => $_GET['lon']
        );
        file_put_contents("gps.json", json_encode($data));
    }

    echo file_get_contents("gps.json");