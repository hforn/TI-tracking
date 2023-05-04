const sheetID = "1qWYJ6vM_5ppYT73OSQZr64jLyYYhMyKnIFuBv9qwcBI";
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?`;
const sheetName = "Cattle";
const qu = "Select A,C,D,E,F OFFSET 295"; //select collumns from google sheet(* for all)
const query = encodeURIComponent(qu);
const url = `${base}&sheet=${sheetName}&tq=${query}`;

const CLIENT_ID = '910856571495-mausloaug88d7vcf41tiptg705nbhrkl.apps.googleusercontent.com';

const output = document.querySelector(".output");
const div = document.createElement("div");

let markersVisible = true;
const stationaryDelay = 50;

var map,
  drawingManager,
  selectedShape,
  colors = ["#1E90FF", "#FF1493", "#32CD32", "#FF8C00", "#4B0082"],
  selectedColor,
  colorButtons = {};

var oldestTimeStamp;
var newestTimeStamp;
var sliderMin;
var sliderMax;
var heatmap;
let sliderVal;
let sliderModeChck = false;
let infoWindow;
const data = [];
const allLatLng = [];
const Cattle = {};
const markers = {};

//MAIN FLOW
setInterval(function () {
  updateTime(sliderVal);
}, 1000);
getSheetData()
  .then((sheetData) => {
    sheetData.forEach(formatSheetData);
    return Cattle;
  })
  .then(() => {
    startingMarkers();
    setupTimeSlider();
    setupButtons();
    setupGeofencing();
    cattleListWindow();
    initHeatMap();
  })
  .then(() => {
    
  });


function setupButtons() {
  const toggleButton = document.querySelector("#toggle-btn");

  toggleButton.addEventListener("click", () => {
    sliderModeChck = !sliderModeChck;
  });
}
/* function smoothMarkers() {
  for (key in Cattle) {
    const curIndex = Cattle[key].timestamp.findIndex(
      (timestamp) => Date.parse(timestamp) < sliderVal * 60000
    );
    //console.log(curIndex);
    if (curIndex > 0) {
      const newerPos = new google.maps.LatLng(
        Cattle[key].latitude[curIndex - 1],
        Cattle[key].longitude[curIndex - 1]
      );
      const olderPos = new google.maps.LatLng(
        Cattle[key].latitude[curIndex],
        Cattle[key].longitude[curIndex]
      );
      const fraction =
        (sliderVal * 60000 - Date.parse(Cattle[key].timestamp[curIndex])) /
        (Date.parse(Cattle[key].timestamp[curIndex - 1]) -
          Date.parse(Cattle[key].timestamp[curIndex]));

      const delayStart =
        curIndex > 1
          ? Date.parse(Cattle[key].timestamp[curIndex - 2])
          : Date.parse(Cattle[key].timestamp[0]);
      const delayEnd = Date.parse(Cattle[key].timestamp[curIndex - 1]);
      const timeDiff = delayEnd - delayStart;
      const stationaryDelayMs = stationaryDelay * 60000;

      let stationaryStartMs = delayEnd - timeDiff / 2 - stationaryDelayMs / 2;
      let stationaryEndMs = delayEnd - timeDiff / 2 + stationaryDelayMs / 2;

      if (stationaryStartMs < delayStart) {
        stationaryStartMs = delayStart;
        stationaryEndMs = stationaryStartMs + stationaryDelayMs;
      } else if (stationaryEndMs > delayEnd) {
        stationaryEndMs = delayEnd;
        stationaryStartMs = stationaryEndMs - stationaryDelayMs;
      }

      const curTime = Date.parse(Cattle[key].timestamp[curIndex]);
      if (curTime < stationaryStartMs || curTime > stationaryEndMs) {
        getCoordinateInRangeWithDelay(olderPos, newerPos, fraction, Cattle[key].deveui);
      }
    }
  }
}
function getCoordinateInRangeWithDelay(a, b, f, startTime, endTime, deveui) {
  const distance = google.maps.geometry.spherical.computeDistanceBetween(a, b);
  const latLng = google.maps.geometry.spherical.interpolate(a, b, f);
  const currentTime = sliderVal * 60000;
  const delayStart = new Date(startTime.getTime() - stationaryDelay * 1000 / 2);
  const delayEnd = new Date(endTime.getTime() + stationaryDelay * 1000 / 2);

  if (currentTime >= delayStart && currentTime <= delayEnd) {
    markers[deveui].setPosition(a);
  } else {
    markers[deveui].setPosition(latLng);
  }
} */
function smoothMarkers() {
  for (key in Cattle) {
    const curIndex = Cattle[key].timestamp.findIndex(
      (timestamp) => Date.parse(timestamp) < sliderVal * 60000
    );
    //console.log(curIndex);
    if (curIndex > 0) {
      const newerPos = new google.maps.LatLng(
        Cattle[key].latitude[curIndex - 1],
        Cattle[key].longitude[curIndex - 1]
      );
      const olderPos = new google.maps.LatLng(
        Cattle[key].latitude[curIndex],
        Cattle[key].longitude[curIndex]
      );
      if (
        (newerPos.lat() === 0 && newerPos.lng() === 0) ||
        (olderPos.lat() === 0 && olderPos.lng() === 0)
      ) {
        continue; // skip updating marker position for this timestamp
      }
      const fraction =
        (sliderVal * 60000 - Date.parse(Cattle[key].timestamp[curIndex])) /
        (Date.parse(Cattle[key].timestamp[curIndex - 1]) -
          Date.parse(Cattle[key].timestamp[curIndex]));

      getCoordinateInRange(olderPos, newerPos, fraction, Cattle[key].deveui);
    }
  }
}
function getCoordinateInRange(a, b, f, deveui) {
  //console.log(deveui, "used in spherical");
  // Calculate the distance between the two coordinates
  //const distance = google.maps.geometry.spherical.computeDistanceBetween(a, b);
  // Calculate the coordinates for the given fraction of distance
  const latLng = google.maps.geometry.spherical.interpolate(a, b, f);
  markers[deveui].setPosition(latLng);
}
function toggleMarkersVisibility() {
  markersVisible = !markersVisible;
  for (key in markers) {
    markers[key].setVisible(markersVisible);
  }
}
function updateTime(slider) {
  //console.log("slider: ", slider, ", newestTimeStamp: ", newestTimeStamp)
  var dayOfWeek;
  if (sliderVal == newestTimeStamp) {
    clock.style.border = "3px solid rgb(147, 208, 255)";
    clock.style.width = "auto";
    var now = new Date();
  } else {
    clock.style.border = "4px solid rgb(255, 17, 17)";
    clock.style.width = "auto";
    let litSlider = slider * 60000;
    var now = new Date(litSlider);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    var dayOfWeek = daysOfWeek[now.getDay()];
  }

  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  var amPm = hours < 12 ? "AM" : "PM"; // determine AM or PM

  // convert hours to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12;

  // add leading zeros to minutes and seconds
  let padZero = (num) => (num < 10 ? "0" : "") + num;
  minutes = padZero(minutes);
  seconds = padZero(seconds);

  // update the clock display with the new time

  const clockText =
    (dayOfWeek ? dayOfWeek + " " : "") + hours + ":" + minutes + " " + amPm;
  clock.textContent = clockText;
}
function getSheetData() {
  return new Promise((resolve, reject) => {
    //make sure data and cattle are empty for live reload                         {}{}{}{}{}
    fetch(url)
      .then((res) => res.text())
      .then((rep) => {
        const jsData = JSON.parse(rep.substring(47).slice(0, -2));
        const colz = [];
        jsData.table.cols.forEach((heading) => {
          if (heading.label) {
            colz.push(heading.label.toLowerCase().replace(/\s/g, ""));
          }
        });

        jsData.table.rows.forEach((main) => {
          const row = {};
          colz.forEach((ele, ind) => {
            row[ele] =
              main.c[ind] != null
                ? ind == 0
                  ? main.c[ind].f
                  : main.c[ind].v
                : "";
          });
          data.unshift(row);
        });
        oldestTimeStamp = new Date(data[data.length - 1].timestamp) / 60000;
        newestTimeStamp = new Date(data[0].timestamp) / 60000;
        oldestTimeStamp = Math.floor(oldestTimeStamp);
        newestTimeStamp = Math.floor(newestTimeStamp);
        //console.log(Math.floor(newestTimeStamp / 10000));
        if (data[0] != null) {
          //console.log("successfully retreived google sheet data");
          //console.log(data);
          resolve(data);
        } else {
          reject("ERROR from getSheetData()");
        }
      });
  });
}
function formatSheetData(sheetData) {
  let key = sheetData.deveui.slice(-5);
  if (Cattle.hasOwnProperty(key)) {
    Cattle[key].latitude.push(sheetData.latitude);
    Cattle[key].longitude.push(sheetData.longitude);
    Cattle[key].timestamp.push(sheetData.timestamp);
  } else {
    let cow = {
      deveui: sheetData.deveui,
      batlvl: sheetData.battery,
      latitude: [sheetData.latitude],
      longitude: [sheetData.longitude],
      timestamp: [sheetData.timestamp],
    };
    Cattle[key] = cow;
  }
}
function initMap() {
  var bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(35.19067186, -119.01663431), // Southwest corner
    new google.maps.LatLng(35.6076537, -118.08004984) // Northeast corner
  );

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 35.393682, lng: -118.61472259 },
    zoom: 13.3,
    //minZoom: 4,
    maxZoom: 20,
    /* restriction: {
      latLngBounds: bounds,
      strictBounds: true,
    }, */
    fullscreenControl: false,
    streetViewControl: false,
    zoomControl: false,
    mapTypeControl: false,
    mapTypeId: google.maps.MapTypeId.HYBRID,
    backgroundColor: "#245", //map rendering background
    styles: [
      {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#deeeff" }],
      },
      {
        featureType: "all",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#000000" }, { lightness: 13 }],
      },
    ],
  });

  //CLICK MAP FOR COORDS ALERT
  /* google.maps.event.addListener(map, "click", function (event) {
    // Get the latitude and longitude coordinates of the clicked location
    var latitude = event.latLng.lat();
    var longitude = event.latLng.lng();

    // Display the latitude and longitude coordinates in an alert box
    alert("Latitude: " + latitude + "\nLongitude: " + longitude);
  }); */
}
function initHeatMap() {
  for (key in Cattle) {
    for (let index = 0; index < Cattle[key].latitude.length; index++) {
      let hmLatLng = {
        location: new google.maps.LatLng(
          Cattle[key].latitude[index],
          Cattle[key].longitude[index]
        ),
        weight: 1,
      };
      allLatLng.push(hmLatLng);
    }
  }
  //console.log("allLatLng data", allLatLng);
  heatmap = new google.maps.visualization.HeatmapLayer({
    map: map,
    data: allLatLng,
    dissipating: false,
    maxIntensity: 40,
  });
  //heatmap.set("gradient", ["blue", "red"]);
  heatmap.set("radius", 0.0018);
  heatmap.set("opacity", 0.7);
  heatmap.setMap(null);
  const heatmapButton = document.getElementById("toggle-heatmap");
  heatmapButton.addEventListener("click", function () {
    toggleMarkersVisibility();
    if (infoWindow) {
      infoWindow.close();
    }
    if (heatmap.getMap()) {
      heatmap.setMap(null);
    } else {
      heatmap.setMap(map);
    }
  });
}
function setupGeofencing() {
  var polygon = new google.maps.Polygon({
    editable: true,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
  });

  map.addListener("click", function (event) {
    console.log("still listening from polygons");
    var path = polygon.getPath();
    path.push(event.latLng);
  });

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.null,
    drawingControl: false,
    polygonOptions: {
      strokeColor: "#FA10FF",
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: "#9050FF",
      fillOpacity: 0.15,
      editable: true,
      draggable: false,
      setClickable: false,
    },
  });

  drawingManager.setMap(map);

  var shape = [];

  // Start drawing button click event
  document.getElementById("create-zone").addEventListener("click", function () {
    drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
  });

  // Stop drawing button click event
  document.getElementById("save-zone").addEventListener("click", function () {
    drawingManager.setDrawingMode(null);
    shape[shape.length - 1].setEditable(false);
    //shape[shape.length - 1].setClickable(false);
  });

  // Clear shape button click event
  document.getElementById("delete-zone").addEventListener("click", function () {
    console.log(shape);
    if (shape.length > 0) {
      var lastShape = shape.pop();
      lastShape.setMap(null);
    }
  });

  google.maps.event.addListener(
    drawingManager,
    "polygoncomplete",
    function (polygon) {
      shape.push(polygon);
      console.log("polygonecomplete");
      // Get the polygon's path
      /* var path = shape[0].getPath();
      // Convert the path to an array of LatLng objects
      var coords = [];
      for (var i = 0; i < path.getLength(); i++) {
        var point = path.getAt(i);
        coords.push({ lat: point.lat(), lng: point.lng() });
      }
      // Do something with the coords array here, such as sending it to a server for geofencing purposes
      console.log("coords", coords); */
    }
  );

  google.maps.event.addListener(
    drawingManager,
    "overlaycomplete",
    function (event) {
      console.log("overlaycomplete");
      var polygon = event.overlay;
      polygon.setEditable(true);
      //var path = polygon.getPath();
      drawingManager.setDrawingMode(null);
      /* google.maps.event.addListener(polygon, "mouseup", function () {
        var coordinates = [];
        for (var i = 0; i < path.getLength(); i++) {
          coordinates.push({
            lat: path.getAt(i).lat(),
            lng: path.getAt(i).lng(),
          });
        }
      }); */
    }
  );
}
function startingMarkers() {
  const zoneColors = [
    "white",
    "red",
    "green",
    "blue",
    "yellow",
    "purple",
    "pink",
    "orange",
    "brown",
    "grey",
    "silver",
    "gold",
    "beige",
    "maroon",
    "navy",
    "olive",
    "teal",
    "aqua",
    "coral",
    "crimson",
    "indigo",
    "lavender",
    "lime",
    "magenta",
    "plum",
    "turquoise",
    "violet",
    "chocolate",
    "peru",
    "sienna",
  ];
  var zindex = Math.floor(Math.random() * 30);
  // Loop through the cattle object and create markers for each deveui
  for (const key in Cattle) {
    const deveui = Cattle[key].deveui;
    markers[deveui] = new google.maps.Marker({
      position: { lat: Cattle[key].latitude[0], lng: Cattle[key].longitude[0] },
      map: map,
      title: key,
      icon: {
        path: "M11.5,20.6652q-2.04518.1463-2.87108-.551t-.4909-2.3723q.009299-.4663-.041401-.8992t-2.0931-6.7486q-.8397,1.1332-1.8036.8753t-2.9724-1.20203q-.1823-.08051,0-.26976c.1823-.18925,1.6353-1.03182,2.0085-1.0716q.3732-.03978,1.7319.04135-2.1392-1.3733-2.6725-3.20884c-.5333-1.83554-.4978-2.5889.0147-3.92371s.8754,2.7419,2.9254,3.72456q2.05.98266,3.1334.55701.159501-.30833.260001-.30833t2.871079-.06979h-.089239q2.770579.06979,2.871079.06979t.260001.30833q1.0834.42565,3.1334-.55701c2.05-.98266,2.4129-5.05937,2.9254-3.72456s.548,2.08817.0147,3.92371q-.5333,1.83554-2.6725,3.20884q1.3587-.08113,1.7319-.04135c.3732.03978,1.8262.88235,2.0085,1.0716q.1823.18925,0,.26976-2.0085.94413-2.9724,1.20203t-1.8036-.8753q-2.0424,6.3157-2.0931,6.7486t-.041401.8992q.335,1.675-.4909,2.3723t-2.87108.551h.089241Z",
        fillColor: zoneColors[zindex],
        fillOpacity: 1,
        strokeWeight: 1.4,
        strokeColor: "#000",
        scale: 2,
        anchor: { x: 11.5, y: 12 },
      },
    });
    //console.log(markers[deveui]);
    zindex++;
    if (zindex == zoneColors.length) {
      zindex = 0;
    }
  }
}
function updateMarkers(sliderValue) {
  // Convert the slider value to a timestamp
  const sliderTimestamp = sliderValue;
  // Loop through the Cattle object and update the markers
  for (const key in Cattle) {
    const deveui = Cattle[key].deveui;
    const timestamps = Cattle[key].timestamp.map((t) =>
      Math.floor(Date.parse(t) / 60000)
    );
    // Find the index of the newest timestamp that is less than or equal to the slider timestamp
    let index = timestamps.findIndex((t) => t < sliderTimestamp);
    if (index === -1) {
      // If all timestamps are greater than the slider timestamp, use the first index
      index = 0;
      return;
    } else if (index < timestamps.length - 1) {
      // If the timestamp at the found index is greater than the slider timestamp,
      // use the previous index
      if (index != 0) {
        index--;
      }
    }

    if (Cattle[key].latitude[index] != 0) {
      // Update the marker position
      const latLng = new google.maps.LatLng(
        Cattle[key].latitude[index],
        Cattle[key].longitude[index]
      );
      markers[deveui].setPosition(latLng);
    }
  }
}
function setupTimeSlider() {
  sliderVal = newestTimeStamp;
  // Add an event listener to the slider
  const slider = document.createElement("input");
  slider.className = "actual-slider";
  slider.type = "range";
  slider.min = oldestTimestamp;/*newestTimeStamp - 10080;*/ //previous x minutes (10080 = 7days)
  slider.max = newestTimeStamp;
  //console.log("newest timestamp: ", newestTimeStamp);
  slider.value = slider.max;
  sliderVal = newestTimeStamp;
  slider.addEventListener("input", function () {
    sliderVal = this.value;
    updateTime(sliderVal);
    if (sliderModeChck) {
      updateMarkers(sliderVal);
    } else {
      smoothMarkers();
    }
  });
  document.getElementById("slider-container").appendChild(slider);
}
function cattleListWindow() {
  const cattleListContainer = document.getElementById("cattle-list-container");
  const cattleList = document.getElementById("cattle-list");

  let lastKey;
  const sortedKeys = Object.keys(Cattle).sort();
  //console.log("sortedKeys: ", sortedKeys);
  const sortedIndexes = {};
  sortedKeys.forEach((key, index) => {
    sortedIndexes[key] = index + 1;
  });
  map.addListener("click", () => {
    // Get all list items
    const listItems = document.querySelectorAll("#cattle-list-container li");
    // Loop through list items and remove 'selected' class if it exists
    listItems.forEach((item) => {
      if (item.classList.contains("selected")) {
        item.classList.remove("selected");
        if (infoWindow) {
          infoWindow.close();
        }
      }
    });
  });
  for (const key of sortedKeys) {
    const listItem = document.createElement("li");
    listItem.innerHTML = key;
    //add listener to Cattle List buttons
    listItem.addEventListener("click", () => {
      if (!markersVisible) {
        toggleMarkersVisibility();
        heatmap.setMap(null);
      }
      selectCattle(key);
      recenterMap(key);
    });
    //add listener to Cattle Markers
    markers[Cattle[key].deveui].addListener("click", () => {
      selectCattle(key);
      recenterMap(key);
    });
    cattleList.appendChild(listItem);
  }

  function selectCattle(key) {
    // Deselect any previously selected cattle
    const previousSelection = cattleList.querySelector(".selected");
    if (previousSelection) {
      previousSelection.classList.remove("selected");
    }

    // Select the clicked cattle
    const selectedCattle = cattleList.querySelector(
      `li:nth-of-type(${sortedIndexes[key]})`
    );
    selectedCattle.classList.add("selected");
  }

  function recenterMap(key) {
    const marker = markers[Cattle[key].deveui];
    if (marker) {
      map.panTo(markers[Cattle[key].deveui].getPosition());
      if (infoWindow) {
        infoWindow.close();
      }
      if (key !== lastKey) {
        const cow = Cattle[key];
        console.log(Cattle[key]);
        const contentString = `<div><h3>${key}</h3><p>Battery Level: ${Cattle[key].batlvl}%</p><p>Last Seen: ${Cattle[key].timestamp[0]}</p></div>`;
        infoWindow = new google.maps.InfoWindow({
          content: contentString,
        });
        infoWindow.open(map, marker);
        lastKey = key;
      } else {
        lastKey = "";
      }
    }
  }
}
function createMarkers(data) {
  // Loop through the object keys and create markers for each key
  for (const key in data) {
    const latitudeArr = data[key].latitude;
    const longitudeArr = data[key].longitude;
    const timestampArr = data[key].timestamp;

    // Get the distance, time difference, and trajectory between each pair of adjacent points
    for (let i = 0; i < latitudeArr.length - 1; i++) {
      const lat1 = latitudeArr[i];
      const lon1 = longitudeArr[i];
      const time1 = new Date(timestampArr[i]).getTime();
      const lat2 = latitudeArr[i + 1];
      const lon2 = longitudeArr[i + 1];
      const time2 = new Date(timestampArr[i + 1]).getTime();

      // Calculate the time difference between the two points
      const timeDiff = (time2 - time1) / 1000; // in seconds

      // Calculate the distance between the two points using the Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Calculate the trajectory between the two points
      const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
      const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
      const trajectory = (Math.atan2(y, x) * 180) / Math.PI;

      // Create a marker at the first point
      if (i === 0) {
        const marker = new google.maps.Marker({
          position: { lat: lat1, lng: lon1 },
          map: map,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: "#00F",
            fillOpacity: 1,
            scale: 4,
            rotation: trajectory,
            strokeWeight: 1,
            strokeColor: "#00F",
          },
        });

        // Save the marker to the markers object
        markers[key] = marker;
      }
      function animateMarker(key) {
        // Animate the marker to move from the first point to the second point
        const step = distance / timeDiff; // distance to travel per second
        let fraction = 0; // fraction of distance traveled
        let elapsed = 0; // time elapsed
        const interval = setInterval(() => {
          elapsed += 1;
          fraction += step;

          // Get the current position of the marker
          const latlng = markers[key].getPosition();

          // Calculate the new position of the marker based on the fraction of distance traveled
          const lat = lat1 + (lat2 - lat1) * (fraction / distance);
          const lon = lon1 + (lon2 - lon1) * (fraction / distance);
          const newLatLng = new google.maps.LatLng(lat, lon);

          // Update the marker position
          markers[key].setPosition(newLatLng);

          // Update the timestamp label
          const timestamp = Cattle[key].timestamp[index];
          const formattedTimestamp = formatTimestamp(timestamp);
          const infoWindowContent = `<div><strong>${key}</strong></div><div>Last updated: ${formattedTimestamp}</div>`;
          infoWindows[key].setContent(infoWindowContent);

          // If the marker has reached the end of the route, remove it from the map and delete the marker and infoWindow objects
          if (fraction >= 1) {
            markers[key].setMap(null);
            delete markers[key];
            /* infoWindows[key].close();
          delete infoWindows[key];
          continue; */
          }

          // Schedule the next animation frame
          requestAnimationFrame(
            animateMarker.bind(null, key, startTime, endTime)
          );
        });
      }
    }
  }
  // Call the animateMarker function for each marker
  for (const key in Cattle) {
    animateMarker(key);
  }
}
