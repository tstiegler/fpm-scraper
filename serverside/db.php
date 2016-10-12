<?php

// Database configuration.
$dbName = "";
$dbUser = "";
$dbPass = "";

// Google maps API key.
$GLOBALS['gmapsKey'] = "<INSERT GOOGLE MAPS KEY HERE>";

// Attempt a connection to our database.
try {
    $GLOBALS['conn'] = new PDO("mysql:host=127.0.0.1;dbname=" . $dbName, $dbUser, $dbPass, array(PDO::ATTR_ERRMODE => PDO::ERRMODE_WARNING));
} catch (PDOException $e) {
    echo 'Connection failed: ' . $e->getMessage();
    exit;
}

// Make sure the table exists.
$sql = "SHOW TABLES LIKE 'pokemon_spawns';";
$stmt = $GLOBALS['conn']->prepare($sql);
$stmt->execute();
if(count($stmt->fetchAll()) < 1) {
    $createSql = "CREATE TABLE pokemon_spawns(id int(11) NOT NULL AUTO_INCREMENT, spawnpoint varchar(24), encounterid varchar(128), pokemonid int(11), lat double, lng double, expiration decimal(65, 0), UNIQUE(encounterid), PRIMARY KEY (id));";
    $cStmt = $GLOBALS['conn']->prepare($createSql);
    $cStmt->execute();
}