<?php
    // All this analysis code is VERY very crude. Hacked up as quick as possible, so the quality is not that great.

    global $minExpiration;

    $sql = "select count(*) as encounters from pokemon_spawns where expiration > " . $minExpiration . ";";
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->execute();
    $spawnCount = $stmt->fetchAll()[0][0];

    $sql = "select count(*) as encounters, pokemonid from pokemon_spawns where expiration > ". $minExpiration . " group by pokemonid order by encounters asc;";
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->execute();
    $pokemonById = $stmt->fetchAll();

    $sql = "select count(*) as encounters, spawnpoint from pokemon_spawns where expiration > " . $minExpiration . " group by spawnpoint order by encounters asc;";
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->execute();
    $spawnpoints = $stmt->fetchAll();

    $spawnpointRarity = Array();

    foreach($spawnpoints as $spnpt) {
        $sql = "select * from pokemon_spawns where expiration > " . $minExpiration . " AND spawnpoint = :pt;";        
        $stmt = $GLOBALS['conn']->prepare($sql);
        $stmt->bindParam(":pt", $spnpt['spawnpoint']);
        $stmt->execute();
        $pointEncounters = $stmt->fetchAll();
        
        $total = 0;
        $min = 1;
        foreach($pointEncounters as $pte) {
            $total += $GLOBALS['rarity'][$pte['pokemonid']];

            if($GLOBALS['rarity'][$pte['pokemonid']] < $min)
                $min = $GLOBALS['rarity'][$pte['pokemonid']];
        }
        $avg = $total / count($pointEncounters);

        $spawnpointRarity[$pte['spawnpoint']] = Array(
            'encounters' => count($pointEncounters),
            'avg_rarity' => $avg,
            'min_rarity' => $min
        );
    }

    $sql = "select * from pokemon_spawns order by expiration desc LIMIT 5;";
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->execute();
    $recent = $stmt->fetchAll();
?>

<div class="row">
    <div class="cop m12">
	    <h6 class="heading">Showing data on <?php echo $spawnCount; ?> spawns.</h6>
	</div>

    <div class="col s12">
        <h5 class="heading">5 Most recent spawns</h5>
        <table class="striped">
            <tr>
                <th>Pokemon</th>
                <th>Spawnpoint ID</th>
                <th>Location</th>
                <th>Expiration</th>                
            </tr>
            <?php foreach($recent as $pkmn) { $gpsstring = $pkmn['lat'] . "," .  $pkmn['lng']; ?>
                <tr>
                    <td><a href="index.php?section=pokemon&amp;id=<?php echo $pkmn['pokemonid']; ?>"><?php echo $GLOBALS["pokemon"][$pkmn['pokemonid']]['name']; ?></a></td>
                    <td><a href="index.php?section=spawnpoint&amp;id=<?php echo $pkmn['spawnpoint']; ?>"><?php echo $pkmn['spawnpoint']; ?></a></td>               
                    <td><a href="http://www.google.com/maps/place/<?php echo $gpsstring; ?>/@<?php echo $gpsstring; ?>,17z"><?php echo $pkmn['lat']; ?>, <?php echo $pkmn['lng']; ?></a></td>
                    <td><?php echo date("d M g:i a", $pkmn['expiration'] / 1000); ?></td>
                </tr>
            <?php } ?>
        </table>
    </div>    

    <div class="col m6 s12">
        <h5 class="heading">Pokemon by rarity</h5>
        <table class="striped">
            <tr>
                <th>Pokemon ID</th>
                <th>Rarity</th>
                <th>Encounters</th>
            </tr>
            <?php foreach($pokemonById as $pkmn) { ?>
                <tr>
                    <td><a href="index.php?section=pokemon&amp;id=<?php echo $pkmn['pokemonid']; ?>"><?php echo $GLOBALS["pokemon"][$pkmn['pokemonid']]['name']; ?></a></td>
                    <td><?php echo round($GLOBALS['rarity'][$pkmn['pokemonid']] * 100, 2); ?>%</td>
                    <td><?php echo $pkmn['encounters']; ?></td>
                </tr>
            <?php } ?>
        </table>
    </div>

    <div class="col m6 s12">
        <h5 class="heading">Spawnpoints by occurence</h5>
        <table class="striped">
            <tr>
                <th>Pokemon ID</th>
                <th>Avg. Rarity</th>
                <th>Min. Rarity</th>
                <th>Encounters</th>
            </tr>
            <?php foreach($spawnpoints as $pt) { ?>
                <tr>
                    <td><a href="index.php?section=spawnpoint&amp;id=<?php echo $pt['spawnpoint']; ?>"><?php echo $pt['spawnpoint']; ?></a></td>
                    <td><?php echo round($spawnpointRarity[$pt['spawnpoint']]['min_rarity'] * 100, 2); ?>%</td>
                    <td><?php echo round($spawnpointRarity[$pt['spawnpoint']]['avg_rarity'] * 100, 2); ?>%</td>
                    <td><?php echo $pt['encounters']; ?></td>
                </tr>
            <?php } ?>
        </table>
    </div>        
</div>