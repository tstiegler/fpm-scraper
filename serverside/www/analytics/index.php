<!DOCTYPE html>
<?php  
    // All this analysis code is VERY very crude. Hacked up as quick as possible, so the quality is not that great.

    $minExpiration = 1474913012172;

    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    include("../../db.php");

    $GLOBALS["pokemon"] = json_decode(file_get_contents("pokemon.json"), true);

    function rebuildRarityChart() {
        global $minExpiration;

        $sql = "select count(id) as amount, pokemonid from pokemon_spawns where expiration > " . $minExpiration . " group by pokemonid;";    
        $stmt = $GLOBALS['conn']->prepare($sql);
        $stmt->execute();
        $pokemonamounts = $stmt->fetchAll();

        $rarityChart = Array();
        $total = 0;
        foreach($pokemonamounts as $amt) {
            $total += $amt['amount'];
            $rarityChart[$amt['pokemonid']] = $amt['amount'];
        }  

        foreach($rarityChart as $k => &$v) {
            $v = $v / $total;
        }

        return $rarityChart;
    }
    $GLOBALS["rarity"] = rebuildRarityChart();
?>
<html>
    <head>
        <title>FPM Scraper Analytics.</title>  
        <meta charset="UTF-8">    

        <link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/css/materialize.min.css" rel="stylesheet" type="text/css" />        
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/css/font-awesome.min.css" rel="stylesheet" type="text/css" />
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:200,300,400" rel="stylesheet">
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        <link href="app.css" rel="stylesheet">

        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width" />    
    </head>
    <body>
        <div id='pin-top'>
            <nav>
                <div class="nav-wrapper">
                    <a href="#" data-activates="slide-out" class="button-collapse hamburger"><i class="material-icons">menu</i></a>

                    <a href="#" class="brand-logo" style="margin-left: 20px;">FPM Scraper Analytics</a>
                    <ul id="nav-mobile" class="right hide-on-med-and-down">
                        <li><a href="index.php?section=index">Home</a></li>
                        <li><a href="index.php?section=spawnmap">Spawn Map</a></li>
                    </ul>
                </div>
            </nav>
        </div>

        <div id="global">
            <div class="container" style="margin-top: 30px;">
                <?php
                    $section = "index";
                    $availableSections = Array(
                        "index",
                        "pokemon",
                        "spawnmap",
                        "spawnpoint"
                    );

                    if(isset($_GET['section']) && in_array($_GET['section'], $availableSections))
                        $section = $_GET['section'];

                    include($section . ".section.php");                    
                ?>
            </div>
        </div>

        <ul id="slide-out" class="side-nav">
            <li class="right-align">
                <a href="#!" style="position: relative; left: 260px; width: 30px; padding: 0; overflow: hidden;" class="nohover"><i class="fa fa-close"></i></a>
            </li>

            <li><a class="waves-effect modal-trigger" href="index.php?section=index"><i style='font-size: 35px;' class="fa fa-home"></i>Home</a></li>
            <li><a class="waves-effect modal-trigger" href="index.php?section=spawnmap"><i style='font-size: 35px;' class="fa fa-map-marker"></i>Spawn Map</a></li>
        </ul>

        <script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>        
        <script src="https://code.jquery.com/ui/1.12.0/jquery-ui.min.js" integrity="sha256-eGE6blurk5sHj+rmkfsGYeKyZx3M4bG+ZlFyA7Kns7E=" crossorigin="anonymous"></script>
        <script src="https://code.jquery.com/color/jquery.color-2.1.2.min.js"></script>        
        <script src="https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.0/knockout-min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/numeral.js/1.5.3/numeral.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/js/materialize.min.js"></script>
        <script src="app.js"></script>   
        
        <script async defer src="https://maps.googleapis.com/maps/api/js?key=<?php echo $GLOBALS['gmapsKey']; ?>&callback=initMap"></script>     
    </body>
</html>