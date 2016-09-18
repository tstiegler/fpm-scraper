<?php
    include("../db.php");

    if(!isset($_POST['spawns']))
        die("Bad request");
        
    $spawns = json_decode($_POST['spawns'], true);

    foreach($spawns as $spawn) {
        $sql = "
                INSERT INTO  pokemon_spawns (spawnpoint, encounterid, pokemonid, lat, lng, expiration)
                VALUES (:spawnpoint, :encounterid, :pokemonid, :lat, :lng, :expiration);
        ";
        $stmt = $GLOBALS['conn'] ->prepare($sql);
        $stmt->bindParam(':spawnpoint', $spawn['spawn_point_id']);
        $stmt->bindParam(':encounterid', $spawn['encounter_id']);
        $stmt->bindParam(':pokemonid', $spawn['id']);
        $stmt->bindParam(':lat', $spawn['latitude']);
        $stmt->bindParam(':lng', $spawn['longitude']);
        $stmt->bindParam(':expiration', $spawn['expiration_timestamp_ms']);
        $stmt->execute();
    }

    echo "OK";
	