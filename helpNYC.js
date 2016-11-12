var vis;
var layers;
var oldZoomLevel;
var oldLatLng;
var layerList = [
    {
        label: "poverty",
        pos: 1
    },{
        label: "graduation",
        pos: 0
    }
];
window.onload = function() {
    cartodb.createVis('map', 'https://paoloud.carto.com/api/v2/viz/0d4a4238-8741-11e6-bad8-0e8c56e2ffdb/viz.json', mapStartingParams()
        ).done(function(visualization, maplayers) {
            vis = visualization;
            layers = maplayers;

            vis.map.set({
                minZoom: 10,
                maxZoom: 15
            });

            layers[1].on('featureClick', function(e, latlng, pos, data, layer) {
                oldZoomLevel = vis.map.get('zoom');
                oldLatLng = vis.map.get('center');
                vis.map.set({center: latlng, zoom: 14});
                showInfoModal(data);
            });

            // This bit is all a terrible hack and will be fixed later
            layers[1].getSubLayer(1).show();
            layers[1].getSubLayer(0).hide();
            var headertext = $('.header .header-text');
            var headertextoptions = ['fight poverty.', 'improve education.'];
            var headertextbool = true;

            setInterval(function() {
                crossFadeLayers();
                headertext.fadeTo(1000, 0, function (){
                    headertext.text(headertextoptions[headertextbool ? 1 : 0]);
                    headertextbool = !headertextbool;
                }).fadeTo(1000, 1);
            }, 13500);
        }
    );

    $('.modal-info').on('click', function(e) {
        if (e.target === this) {
            hideInfoModal();
        }
    });

    // TODO: Use a real cross fade, but this will require adding all the data manually
    // http://gis.stackexchange.com/questions/150057/set-cartocss-ranges-dynamically-for-choropleth
    // http://bl.ocks.org/rgdonohue/d21239a488b5ab15dbbdf7567db1b086
    // Potential color schemes: C -> B, M -> R, Y -> G and Y -> R, M -> B, C -> G
    function crossFadeLayers() {
        var opacity = 1;
        var fadeOutTimer = setInterval(fadeOut, 20);
        var fadeInTimer;
        fadeOut();

        function fadeOut() {
            if (opacity >= 0) {
                layers[1].setOpacity(opacity);
                opacity = opacity - 0.02;
            } else {
                clearInterval(fadeOutTimer);
                opacity = 0;
                layers[1].getSubLayer(layerList[1].pos).show();
                layers[1].getSubLayer(layerList[0].pos).hide();
                fadeIn();
                fadeInTimer = setInterval(fadeIn, 20);
            }
        }

        function fadeIn() {
            if (opacity <= 1) {
                layers[1].setOpacity(opacity);
                opacity = opacity + 0.02;
            } else {
                clearInterval(fadeInTimer);
                // Cycle the layer list for next time
                layerList.push(layerList.shift());
            }
        }
    }

    function showInfoModal(data) {
        $('.cartodb-tooltip, .cartodb-legend-stack').fadeOut(100);
        var container = $('.modal-info');
        container.find('.modal-title').text(data.name);
        container.find('.stat-poverty').text(Math.round(
            data.poverty_percentage_2010_2014*(data.total_population/100)
        ).toLocaleString());
        container.find('.stat-no-diploma').text(data.no_diploma.toLocaleString());
        container.find('.stat-fluency').text(data.non_fluent_in_english.toLocaleString());
        container.fadeIn(1000);
    }

    function mapStartingParams() {
        var zoom = 11;
        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        if (windowHeight < 750) {
            zoom = 10;
        }

        return {
            zoom: zoom,
            center: [40.71, -73.93]
        };
    }

    $('.call-to-action-text .intro-2').delay(1000).fadeTo(2000, 1);
    $('.call-to-action-text .intro-3').delay(4000).fadeTo(2000, 1);
    $('.call-to-action-text .intro-4').delay(6500).fadeTo(2000, 1);
    $('.call-to-action-text .intro-5').delay(8750).fadeTo(2250, 1);
    $('.modal-call-to-action').on('click', function(e) {
        $('#map, .header .prompt, .footer').stop().fadeTo(1250, 1);
        $('.modal-call-to-action').stop().fadeOut(1);
    });
    $('#map, .header .prompt, .footer').delay(11750).fadeTo(1250, 1);
    $('.modal-call-to-action').delay(11750).fadeOut(1250);
};

function hideInfoModal() {
    $('.modal-info').fadeOut(1000);
    $('.cartodb-tooltip, .cartodb-legend-stack').delay(1001).fadeIn(1000);
    vis.map.set({center: oldLatLng, zoom: oldZoomLevel});
}
