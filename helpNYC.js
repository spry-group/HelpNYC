 'use strict';
/************************************************************
* TODO:                                                     *
* Refactor into Angular 2                                   *
* Host on github pages and enable gzip                      *
* Webpack                                                   *
* Use chronjob to auto publish new opportunities via git    *
* Turn css into sass and DRY it out                         *
* Work on more opportunties and foodbank links              *
* Spellcheck all of the things                              *
* Find a solution for overly long descriptions              *
* Prevent one org from taking over all the listings         *
* Release and promote                                       *
* More social media tie ins and feedback                    *
* Rewrite map to enable proper crossfade                    *
************************************************************/

var vis;
var layers;
var oldZoomLevel;
var oldLatLng;
var opportunitiesDatedPromise = $.getJSON('./opportunityJson/opportunitiesDated.json');
var opportunitiesOngoingPromise = $.getJSON('./opportunityJson/opportunitiesOngoing.json');
var layerList = [
    {
        pos: 0,
        label: 'improve education.'
    },
    {
        pos: 1,
        label: 'fight poverty.'
    },
    {
        pos: 2,
        label: 'learn English.'
    }
];

// Use page visibility api to prevent ugly choropleth flickering when tabbing out and back
var hidden, visibilityChange, choroplethTransitionInterval;
if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
  hidden = 'hidden';
  visibilityChange = 'visibilitychange';
} else if (typeof document.msHidden !== 'undefined') {
  hidden = 'msHidden';
  visibilityChange = 'msvisibilitychange';
} else if (typeof document.webkitHidden !== 'undefined') {
  hidden = 'webkitHidden';
  visibilityChange = 'webkitvisibilitychange';
}

window.onload = function() {
    window.cartodb.createVis('map',
        'https://paoloud.carto.com/api/v2/viz/0d4a4238-8741-11e6-bad8-0e8c56e2ffdb/viz.json',
        mapStartingParams()
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
            layers[1].getSubLayer(2).hide();
            layers[1].getSubLayer(1).hide();
            layers[1].getSubLayer(0).show();
            var headerText = $('.header .header-text');
            headerText.text(layerList[0].label);

            // Use page visibility api to prevent ugly choropleth flickering when tabbing out and back
            if (typeof document.addEventListener !== 'undefined' || typeof document[hidden] !== 'undefined') {
                document.addEventListener(visibilityChange, toggleChoroplethTransitions, false);
            }

            function toggleChoroplethTransitions() {
                if (document[hidden]) {
                    clearInterval(choroplethTransitionInterval);
                } else {
                    choroplethTransitionInterval = startChoroplethTransitions();
                }
            }

            choroplethTransitionInterval = startChoroplethTransitions();

            function startChoroplethTransitions() {
                return setInterval(function() {
                    crossFadeLayers(headerText);
                }, 15000);
            }
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
    function crossFadeLayers(headerText) {
        var opacity = 1;
        var fadeOutTimer = setInterval(fadeOut, 20);
        var fadeInTimer;
        headerText.fadeTo(1000, 0, function (){
            headerText.text(layerList[1].label);
        }).fadeTo(1000, 1);
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
        // Scroll back to the top of the modal
        window.scrollTo(0, 0);
        var container = $('.modal-info');
        container.find('.modal-title').text(data.name);
        container.find('.stat-poverty').text(Math.round(
            data.poverty_percentage_2010_2014*(data.total_population/100)
        ).toLocaleString());
        container.find('.stat-no-diploma').text(data.no_diploma.toLocaleString());
        container.find('.stat-fluency').text(data.non_fluent_in_english.toLocaleString());
        container.fadeIn(1000);
        _getOpportunities(data);
        _loadTwitterButton();
    }

    function mapStartingParams() {
        var zoom = 11;
        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        if (windowHeight < 750) {
            zoom = 10;
        }

        return {
            zoom: zoom,
            center: [40.71, -73.95]
        };
    }

    $('.call-to-action-text .intro-2').delay(1000).fadeTo(2000, 1);
    $('.call-to-action-text .intro-3').delay(4000).fadeTo(2000, 1);
    $('.call-to-action-text .intro-4').delay(6500).fadeTo(2000, 1);
    $('.call-to-action-text .intro-5').delay(8750).fadeTo(2250, 1);
    $('.modal-call-to-action').on('click', function() {
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

function _getOpportunities(data) {
    var zips = data.zipcodes.split(', ');
    // Update foodbank and get more opportunities link
    $('.organization-foodbank h3 a, .organization-foodbank .more a').attr('href',
        'http://volunteer.foodbanknyc.org/HOC__Volunteer_Opportunity_Search_Page?dstnc=10&k=&p=Se&z=' + zips[0]
    );
    $('.more-opportunities a').attr('href',
        'https://www.volunteermatch.org/search#k=&v=false&s=1&o=recency&l=' + zips[0] + '&r=20&sk=&na=' +
        '&categories=7&categories=11&categories=12&categories=14&categories=15&categories=17' +
        '&categories=22&categories=23&categories=39&categories=41&categories=42'
    );

    // List opportunities
    var opportunities = [];
    $('.volunteer-matches').html('<h3>Loading...</h3>');

    // TODO make this dry and have the appending happen in a called function
    opportunitiesDatedPromise.then(function(opportunitiesDated) {
        zips.forEach(function(zip) {
            if (zip in opportunitiesDated) {
                opportunities.push(...opportunitiesDated[zip] || []);
            }
        });
        if (opportunities.length < 7) {
            opportunitiesOngoingPromise.then(function(opportunitiesOngoing) {
                zips.forEach(function(zip) {
                    if (zip in opportunitiesOngoing) {
                        opportunities.push(...opportunitiesOngoing[zip]);
                    }
                });
                _appendOpportunities(opportunities);
            });
        } else {
            _appendOpportunities(opportunities);
        }
    });
}

function _appendOpportunities(opportunities) {
    // TODO: after switching to angular 2 just use an *ngFor instead of this crap
    var matchesContainer = $('.volunteer-matches');
    matchesContainer.empty();
    opportunities.slice(0, 7).forEach(function(opportunity) {
        // Truncate after approximately 5 lines
        if (opportunity.description.length > 590) {
            opportunity.description = opportunity.description.slice(0, 590) + '...';
        }
        matchesContainer.append(
            '<div class="volunteer-match">' +
                '<h3 class="margin-none">' +
                    '<a href="' + decodeURIComponent(opportunity.link) + '" target="_blank">' +
                        opportunity.title +
                    '</a>' +
                '</h3>' +
                '<h4 class="margin-none">' + opportunity.org + '</h4>' +
                '<p class="margin-none opportunity-description">' + opportunity.description + '</p>' +
                '<div class="more"><a href="' + decodeURIComponent(opportunity.link) + '" target="_blank">' +
                    'More' +
                '</a></div>' +
            '</div>'
        )
    });

    // Scroll back to the top of the modal
    $('.modal-info-content').scrollTop(0)
}

function _loadTwitterButton() {
    // The twitter button is obnoxiously fragile.
    // It never appears on FF or edge if it's inside a hidden div the first time it loads.
    // So to get around this stupidity we just dynamically insert the first time we load a modal.
    if ($('div.social-media .twitter-share-button').length === 0) {
        $('.social-media').append(
            '<a href="https://twitter.com/share" class="twitter-share-button" data-size="large" ' +
            'data-text="I&#39;m helping to end poverty in my neighborhood. You can too!" ' +
            'data-url="http://helpnyc.spry-group.com" data-hashtags="HelpNYC" data-dnt="true" data-show-count="false">Tweet</a>'
        );
        window.twttr.widgets.load();
    }
}
