/**
 * HackGT 6 (2019)
 * Crime Map
 * Author: Logan Bussell
 */

const WALK_METHOD = JSON.stringify({"attributeParameterValues":[
  {
      "attributeName":"Avoid Private Roads",
      "parameterName":"Restriction Usage",
      "value":"AVOID_MEDIUM"
  },
  {
      "attributeName":"Walking",
      "parameterName":"Restriction Usage",
      "value":"PROHIBITED"
  },
  {
      "attributeName":"Preferred for Pedestrians",
      "parameterName":"Restriction Usage",
      "value":"PREFER_LOW"
  },
  {
      "attributeName":"WalkTime",
      "parameterName":"Walking Speed (km/h)",
      "value":5
  },
  {
      "attributeName":"Avoid Roads Unsuitable for Pedestrians",
      "parameterName":"Restriction Usage",
      "value":"AVOID_HIGH"
  }
],
"description":"Follows paths and roads that allow pedestrian traffic and finds solutions that optimize travel time. The walking speed is set to 5 kilometers per hour.",
"distanceAttributeName":"Kilometers",
"id":"caFAgoThrvUpkFBW",
"impedanceAttributeName":"WalkTime",
"name":"Walking Time",
"restrictionAttributeNames":[
  "Avoid Private Roads",
  "Avoid Roads Unsuitable for Pedestrians",
  "Preferred for Pedestrians",
  "Walking"
],
"simplificationTolerance":2,
"simplificationToleranceUnits":"esriMeters",
"timeAttributeName":"WalkTime",
"type":"WALK",
"useHierarchy":false,
"uturnAtJunctions":"esriNFSBAllowBacktrack"

});

const ROUTE_TASK_URL =
"https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

const CRIME_FILTER = [
  "",
  "crime_type = 'HOMICIDE'",
  "crime_type = 'AGG ASSAULT'",
  "crime_type = 'AUTO THEFT'",
  "crime_type = 'BURGLARY-NONRES'",
  "crime_type = 'BURGLARY-RESIDENCE'",
  "crime_type = 'LARCENY-FROM VEHICLE'",
  "crime_type = 'LARCENY-NON VEHICLE'",
  "crime_type = 'MANSLAUGHTER'",
  "crime_type = 'ROBBERY-COMMERCIAL'",
  "crime_type = 'ROBBERY-PEDESTRIAN'",
  "crime_type = 'ROBBERY-RESIDENCE'"
];

const CRIME_FILTER_MAP = {
  "": "All crimes",
  "crime_type = 'HOMICIDE'": "Homicide",
  "crime_type = 'AGG ASSAULT'": "Aggravated Assault",
  "crime_type = 'AUTO THEFT'": "Auto Theft",
  "crime_type = 'BURGLARY-NONRES'": "Non-Residential Burglary",
  "crime_type = 'BURGLARY-RESIDENCE'": "Residential Burglary",
  "crime_type = 'LARCENY-FROM VEHICLE'": "Car Break-in",
  "crime_type = 'LARCENY-NON VEHICLE'": "Theft",
  "crime_type = 'MANSLAUGHTER'": "Manslaughter",
  "crime_type = 'ROBBERY-COMMERCIAL'": "Commercial Robbery",
  "crime_type = 'ROBBERY-PEDESTRIAN'": "Pedestrian Robbery",
  "crime_type = 'ROBBERY-RESIDENCE'": "Residential Robbery"
};

const DATE_FILTER = [
  "",
  "occur_time > 600 AND occur_time < 1200",
  "occur_time > 1200 AND occur_time < 2000",
  "occur_time > 2000 OR occur_time < 600"
];

const DATE_FILTER_MAP = {
  "": "All times",
  "occur_time > 600 AND occur_time < 1200": "Morning (6 - 12 AM)",
  "occur_time > 1200 AND occur_time < 2000": "Mid-day (12 - 8 PM)",
  "occur_time > 2000 OR occur_time < 600": "Night (8 PM - 6 AM)"
};

const TIMES = {
  morning: "Morning",
  midDay: "Mid-Day",
  night: "Night"
};

const getCurrentTime = () => {
  const date = new Date();
  const currentHours = date.getHours();
  if (currentHours >= 6 && currentHours < 12) {
    return TIMES.morning;
  } else if (currentHours >= 12 && currentHours < 20) {
    return TIMES.midDay;
  } else {
    return TIMES.night;
  }
};

require([
  "esri/layers/FeatureLayer",
  "esri/layers/Layer",
  "esri/Map",
  "esri/views/MapView",
  "esri/Graphic",
  "esri/tasks/RouteTask",
  "esri/tasks/support/RouteParameters",
  "esri/tasks/support/FeatureSet",
  "esri/widgets/Search",
  "esri/geometry/geometryEngineAsync",
  "esri/geometry/Point",
  "esri/tasks/support/FeatureSet",
  "esri/tasks/support/DataLayer",
  "esri/config",
  "esri/core/watchUtils"
], function(
  FeatureLayer,
  Layer,
  Map,
  MapView,
  Graphic,
  RouteTask,
  RouteParameters,
  FeatureSet,
  Search,
  geometryEngineAsync,
  Point,
  FeatureSet,
  DataLayer,
  esriConfig,
  watchUtils
) {
  var map = new Map({
    basemap: "streets-night-vector"
  });

  var view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-84.399144, 33.772951],
    zoom: 13
  });

  var search = new Search({
    view: view
  });

  // function addLayer(layerItemPromise, index) {
  //   return layerItemPromise.then(function(layer) {
  //     map.add(layer, index);
  //   });
  // }

  // var crimesPortalItem = Layer.fromPortalItem({
  //   portalItem: {
  //     id: "73a7540674ff44e3b243e5b8e63c9a15"
  //   }
  // });

  var featureLayer = new FeatureLayer({
    url:
      "https://services6.arcgis.com/8PWl0yTIua00jYKF/arcgis/rest/services/Crime_data/FeatureServer/0",
    outFields: ["*"], // Return all fields so it can be queried client-side
    popupTemplate: {
      // Enable a popup
      title: "{crime_type}", // Show attribute value
      content: "{occur_time}" // Display in pop-up
    },
    renderer: {
      type: "heatmap",
      colorStops: [
        // { ratio: 0, color: "rgba(255, 133, 51, 0)" },
        // { ratio: 0.1, color: "rgba(255, 153/2, 51/2, 0.1)" },
        // { ratio: 0.4, color: "rgba(255, 204/2, 102/2, 0.1)" },
        // { ratio: 0.5, color: "rgba(255, 204/2, 153/2, 0.1)" },
        // { ratio: 1, color: "rgba(255, 230/2, 204/2, 0.1)" }
        { ratio: 0, color: "rgba(179, 216, 222, 0)" },
        { ratio: 0.1, color: "rgba(201, 157, 201, 0.1)" },
        { ratio: 0.4, color: "rgba(220, 90, 93, 0.1)" },
        { ratio: 0.5, color: "rgba(233, 150, 87, 0.1)" },
        { ratio: 1, color: "rgba(255, 253, 87, 0.5)" }
      ],
      blurRadius: 10,
      maxPixelIntensity: 300
    }
  });

  var crimeBlockerFeatureLayer = new FeatureLayer({
    url:
      // "https://services6.arcgis.com/4UCoYHnjdXoJ6mNn/arcgis/rest/services/crime_area_polygons/FeatureServer/0",
      // "https://services6.arcgis.com/4UCoYHnjdXoJ6mNn/arcgis/rest/services/ALT_POLYGON/FeatureServer/0",
      "https://services6.arcgis.com/4UCoYHnjdXoJ6mNn/arcgis/rest/services/GATECH_POLYS/FeatureServer/0",
    outFields: ["*"]
  });

  var routeTask = new RouteTask({
    url: ROUTE_TASK_URL
  });

  var currentCrimeFilter = "";
  var currentTimeFilter = "";

  var crimeSelectFilter = document.createElement("select");
  crimeSelectFilter.setAttribute("class", "esri-widget esri-select");
  crimeSelectFilter.setAttribute(
    "style",
    "width: 240px; font-family: Avenir Next W00; font-size: 1em;"
  );

  var timeSelectFilter = document.createElement("select");
  timeSelectFilter.setAttribute("class", "esri-widget esri-select");
  timeSelectFilter.setAttribute(
    "style",
    "width: 240px; font-family: Avenir Next W00; font-size: 1em;"
  );

  /*
   * ☑️ Use definitionExpression on featureLayer
   * Geometry engine async
   * Some sort of clustering analysis tools
   * generate polygons
   * barriers is a property of the route task
   * polygon barrier
   */

  function addGraphic(type, point) {
    var graphic = new Graphic({
      symbol: {
        type: "picture-marker",
        url: "http://esricrime.azurewebsites.net/image",
        width: "64px",
        height: "64px",
        yoffset: "32px"
      },
      geometry: point
    });
    view.graphics.add(graphic);
  }

  function setFeatureLayerViewFilter(expression, expType) {
    view.whenLayerView(featureLayer).then(function(featureLayerView) {
        newFilter = "";
        filters = [];
        if (expType == 0) {
            currentTimeFilter = expression;
            if (expression != "") {
                filters.push(expression);
            }
        } else if (currentTimeFilter != "") {
            filters.push(currentTimeFilter);
        }
 
        if (expType == 1) {
            currentCrimeFilter = expression;
            if (expression != "") {
                filters.push(expression);
            }
        } else if (currentCrimeFilter != "") {
            filters.push(currentCrimeFilter);
        }
 
        if (filters.length > 0) {
            for (i = 0; i < filters.length - 1; i++) {
                newFilter += "(" + filters[i] + ") AND ";
            }
            newFilter += "(" + filters[filters.length - 1] + ")";
            console.log(newFilter);
        } else {
            newFilter = "1 = 1";
        }
        featureLayer.definitionExpression = newFilter;    
    });
}

  DATE_FILTER.forEach(function(sql) {
    var option = document.createElement("option");
    option.value = sql;
    option.innerHTML = DATE_FILTER_MAP[sql];
    timeSelectFilter.appendChild(option);
  });

  CRIME_FILTER.forEach(function(sql) {
    var option = document.createElement("option");
    option.value = sql;
    option.innerHTML = CRIME_FILTER_MAP[sql];
    crimeSelectFilter.appendChild(option);
  });

  crimeSelectFilter.addEventListener("change", function(event) {
    // setFeatureLayerFilter(event.target.value);
    setFeatureLayerViewFilter(event.target.value, 1);
  });

  timeSelectFilter.addEventListener("change", function(event) {
    // setFeatureLayerFilter(event.target.value);
    setFeatureLayerViewFilter(event.target.value, 0);
  });

  var routeInfo = document.createElement('div');
  var text = document.createElement('p');
  text.innerHTML = "Distance: <br> Expected Time: ";
  routeInfo.style.backgroundColor = "white";
  routeInfo.style.width = "200px";
  routeInfo.style.height = "40px";
  text.style.fontFamily = "Avenir Next W00";
  text.style.fontSize = "1em";
  text.style.wordWrap = "break-word";
  text.style.marginLeft = "10px";
  routeInfo.appendChild(text);
  routeInfo.style.display = "none";

  view.ui.add(timeSelectFilter, "top-right");
  view.ui.add(crimeSelectFilter, "top-right");
  view.ui.add(search, "top-right");
  view.ui.add(routeInfo, "bottom-right");

  view.on("click", function(event) {
    if (view.graphics.length === 0) {
      addGraphic("start", event.mapPoint);
    } else if (view.graphics.length === 1) {
      addGraphic("finish", event.mapPoint);
      //*** ADD ***//
      getRoute();
    } else {
      view.graphics.removeAll();
      routeInfo.style.display = "none";
      addGraphic("start", event.mapPoint);
    }
  });

  function getRoute() {
    console.log("in getroute");
    // Setup the route parameters
    var query = crimeBlockerFeatureLayer.createQuery();
    var curTime = new Date();
    var features = crimeBlockerFeatureLayer.queryFeatures(query).then(
      features => {
        console.log("features", features);
        var routeParams = new RouteParameters({
          stops: new FeatureSet({
            features: view.graphics.toArray() // Pass the array of graphics
          }),
          returnDirections: true,
          polygonBarriers: features,
          startTime: curTime,
          startTimeIsUTC: true,
          travelMode: WALK_METHOD
        });
        // Get the route
        routeTask.solve(routeParams).then(function(data) {
          console.log("route task solved data", data);
          d = data.routeResults[0].route.attributes;
          miles = Math.round(10*d.Total_Miles)/10;
          minutes = Math.round(d.Total_WalkTime);
          text.innerHTML = "Distance: " + miles + " miles <br>Expected Time: "
              + minutes + " minutes";
          routeInfo.style.display = "block";
          data.routeResults.forEach(function(result) {
            result.route.symbol = {
              type: "simple-line",
              color: [255, 255, 255],
              width: 3
            };
            console.log("adding gfx");
            view.graphics.add(result.route);
          });
        });
      },
      err => {
        console.log("ERROR", err);
      }
    );
  }

  // esriConfig.request.interceptors.push({
  //   urls: routeTask.url,
  //   before: function(params) {
  //     params.requestOptions.query.polygonBarriers = JSON.stringify(
  //       crimeBlockerFeatureLayer
  //     );
  //   }
  // });

  map.add(featureLayer);
  // map.add(crimeBlockerFeatureLayer);
});
