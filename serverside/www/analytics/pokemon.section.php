<?php
    // All this analysis code is VERY very crude. Hacked up as quick as possible, so the quality is not that great.

    global $minExpiration;
    
    $sql = "select * from pokemon_spawns where expiration > " . $minExpiration . " AND pokemonid LIKE :pid order by expiration desc;";    
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->bindParam(':pid', $_GET['id']);
    $stmt->execute();
    $pokemonById = $stmt->fetchAll();
?>

<div class="row">
    <div class="col s12">
        <h5 class="heading">Spawns for '<?php echo $GLOBALS["pokemon"][$_GET['id']]['name']; ?>'</h5>
        <table class="striped">
            <tr>
                <th>Spawnpoint ID</th>
                <th>Encounter ID</th>
                <th>Location</th>
                <th>Expiration</th>                
            </tr>
            <?php foreach($pokemonById as $pkmn) { $gpsstring = $pkmn['lat'] . "," .  $pkmn['lng']; ?>
                <tr>
                    <td><a href="index.php?section=spawnpoint&amp;id=<?php echo $pkmn['spawnpoint']; ?>"><?php echo $pkmn['spawnpoint']; ?></a></td>
                    <td><?php echo $pkmn['encounterid']; ?></td>                    
                    <td><a href="http://www.google.com/maps/place/<?php echo $gpsstring; ?>/@<?php echo $gpsstring; ?>,17z"><?php echo $pkmn['lat']; ?>, <?php echo $pkmn['lng']; ?></a></td>
                    <td><?php echo date("r", $pkmn['expiration'] / 1000); ?></td>
                </tr>
            <?php } ?>
        </table>
    </div>
</div>