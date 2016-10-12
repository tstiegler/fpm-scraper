<?php
    // All this analysis code is VERY very crude. Hacked up as quick as possible, so the quality is not that great.

    $sql = "select * from pokemon_spawns where expiration > " . $minExpiration . " AND spawnpoint LIKE :pid order by expiration desc;";    
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->bindParam(':pid', $_GET['id']);
    $stmt->execute();
    $pokemonById = $stmt->fetchAll();

    $hours = Array();
    for($i = 0; $i < 23; $i++) {
        $hours[$i] = Array();
    }

    foreach($pokemonById as $pkmn) {
        $hour = date("G", $pkmn['expiration'] / 1000);
        $hours[$hour][] = $GLOBALS['rarity'][$pkmn['pokemonid']];
    }
	
	$commonSpawn = 0;
	foreach($GLOBALS['rarity'] as $k => $v) {
		if($v > $commonSpawn)
			$commonSpawn = $v;
	}

    $hourRarity = Array();
    foreach($hours as $k => $hr) {
        $total = 0;
        foreach($hr as $r)
            $total += $r;

        if(count($hours[$k]) == 0)
            $hourRarity[$k] = Array('rarity' => 0, 'encounters' => 0);
        else
            $hourRarity[$k] = Array('rarity' => 1 - (($total / count($hours[$k])) / $commonSpawn), 'encounters' => count($hours[$k])); 
    }

    function hourTo12($hr) {
        if($hr == 0)
            return "12am";
        if($hr < 12)
            return $hr . "am";
        if($hr == 12)
            return $hr . "pm";
        
        return ($hr - 12) . "pm";
    }

?>

<div class="row">
    <div class="col s12">
        <h5 class="heading">Hour by hour rarirty analysis for '<?php echo $_GET['id']; ?>'</h5>
    </div>
    <div class="col s12">
        <div>
        <?php foreach($hourRarity as $hnum => $hrr) { ?>
            <div style='float: left; width: 4.1%; margin-top: <?php echo ceil((1 - $hrr['rarity']) * 150); ?>px; text-align: center; color: #fff; height: <?php echo ceil($hrr['rarity'] * 150); ?>px; background-color: #0c9;'>
            </div>
        <?php } ?>
        </div>

        <div class="clearfix">
	    <?php foreach($hourRarity as $hnum => $hrr) { ?>
            <div style='float: left; width: 4.1%; text-align: center;'>
                <?php echo hourTo12($hnum); ?><br />
                <span style="font-size: 10px;">(<?php echo $hrr['encounters']; ?>)</span>
                <span style="font-size: 9px;">[<?php echo round((1 - $hrr['rarity']) * 100, 2); ?>%]</span>
            </div>
        <?php } ?>
        </div>
    </div>

    <div class="col s12">    
        <h5 class="heading">Spawns @ '<?php echo $_GET['id']; ?>'</h5>
        <table class="striped">
            <tr>
                <th>Pokemon</th>
                <th>Encounter ID</th>
                <th>Location</th>
                <th>Expiration</th>                
            </tr>
            <?php foreach($pokemonById as $pkmn) { $gpsstring = $pkmn['lat'] . "," .  $pkmn['lng']; ?>
                <tr>
                    <td><a href="index.php?section=pokemon&amp;id=<?php echo $pkmn['pokemonid']; ?>"><?php echo $GLOBALS["pokemon"][$pkmn['pokemonid']]['name']; ?> (<?php echo round($GLOBALS['rarity'][$pkmn['pokemonid']] * 100, 2); ?>%)</a></td>
                    <td><?php echo $pkmn['encounterid']; ?></td>                    
                    <td><a href="http://www.google.com/maps/place/<?php echo $gpsstring; ?>/@<?php echo $gpsstring; ?>,17z"><?php echo $pkmn['lat']; ?>, <?php echo $pkmn['lng']; ?></a></td>
                    <td><?php echo date("r", $pkmn['expiration'] / 1000); ?></td>
                </tr>
            <?php } ?>
        </table>
    </div>
</div>