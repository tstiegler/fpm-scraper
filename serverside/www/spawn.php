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
        $stmt->bindParam(':spawnpoint', $spawn['spawnPointId']);
        $stmt->bindParam(':encounterid', $spawn['encounterId']);
        $stmt->bindParam(':pokemonid', $spawn['id']);
        $stmt->bindParam(':lat', $spawn['lat']);
        $stmt->bindParam(':lng', $spawn['lng']);
        $stmt->bindParam(':expiration', $spawn['expiration']);
        $stmt->execute();
    }

    
    if(!isset($_POST['outname']) || empty(trim($_POST['outname']))) {
	    echo "OK";
	    exit();
    }

    ob_start();
?>

<html>
    <head>
        <meta http-equiv='refresh' content='30'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/css/materialize.min.css' />
        <style>

.pokename { font-size: 20px; }

        </style>
    </head>
    <body>
        <?php $i = true; foreach($spawns as $spawn) { $i = !$i; ?>
            <div class='row <?php echo ($i ? 'grey lighten-5' : 'grey lighten-3'); ?>' style='padding: 5px 0 5px 0; margin: 0 !important;'>
                <div class='col s8 pokerow'>
                    <span class='pokename'><?php echo $spawn['name']; ?></span><br />
                    <span>Expires: <?php echo date("g:ia", ($spawn['expiration'] / 1000)); ?></span><br />
                    <span><?php echo $spawn['distance']; ?></span>
                </div>
                <div class='col s4 center-align'>
                    <a class='btn btn-small' style='position: relative; top: 20px' href='http://maps.google.com/maps?z=12&t=m&q=loc:<?php echo $spawn['lat'] . "," . $spawn['lng']; ?>'>MAP</a>
                </div>
            </div>
        <?php } ?>
        <script type='text/javascript' src='https://code.jquery.com/jquery-2.1.1.min.js'></script>
        <script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/js/materialize.min.js'></script>
    </body>
</html>

<?php
    
    $nbout = ob_get_clean();
    ob_end_clean();

    $filename = preg_replace("/[^A-Za-z0-9 ]/", '', $_POST['outname']);
    if(strlen($filename) > 20) $filename = substr($filename, 0, 20);

    file_put_contents($filename . ".html", $nbout);

    echo "OK (Saved to: " . $filename . ".html)";
?>
