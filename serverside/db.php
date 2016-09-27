<?php

try {
    $GLOBALS['conn'] = new PDO("mysql:host=127.0.0.1;dbname=database_name", "database_user", "database_pass", array(PDO::ATTR_ERRMODE => PDO::ERRMODE_WARNING));
} catch (PDOException $e) {
    echo 'Connection failed: ' . $e->getMessage();
    exit;
}

$sql = "SHOW TABLES LIKE 'pokemon_spawns';";
$stmt = $GLOBALS['conn'] ->prepare($sql)
if(count($stmt->fetchAll()) < 1) {
    
}


