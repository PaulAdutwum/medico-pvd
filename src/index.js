$(window).on("load", function () {
  //Trying to focus on the first item during scrolling
  // function isElementInView(element) {
  //   var rect = element.getBoundingClientRect();
  //   return (
  //     rect.top >= 0 &&
  //     rect.left >= 0 &&
  //     rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
  //     rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  //   );
  // }

  // // Scroll event to update focus based on the first element in view
  // $(window).on('scroll', function() {
  //   var found = false;
  //   $('.chapter-container:visible').each(function() {
  //     if (isElementInView(this) && !found) {
  //       $('.chapter-container').removeClass("in-focus").addClass("out-focus");
  //       $(this).addClass("in-focus").removeClass("out-focus");
  //       found = true;
  //     }
  //   });
  // });


  //Add the search bar
  $(document).ready(function() {
      $('#search-input').on('keyup', function() {
        var value = $(this).val().toLowerCase();
        $('.chapter-container').filter(function() {
          $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
      });
    });



  const descArray = [];
  let msg = new SpeechSynthesisUtterance();
  var documentSettings = {};

  var googleDocURL = process.env.googleDocURL;

  // insert your own Google Sheets API key from https://console.developers.google.com
  // their key that we know works
  // Carrie's key
  //
  var googleApiKey = process.env.googleApiKey;
  // console.log(googleDocURL, googleApiKey);

  // Some constants, such as default settings
  const CHAPTER_ZOOM = 15;

  // First, try reading Options.csv
  $.get("csv/Options.csv", function (options) {
    $.get("csv/Chapters.csv", function (chapters) {
      initMap($.csv.toObjects(options), $.csv.toObjects(chapters));
    }).fail(function (e) {
      alert("Found Options.csv, but could not read Chapters.csv");
    });

    // If not available, try from the Google Sheet
  }).fail(function (e) {
    var parse = function (res) {
      return Papa.parse(Papa.unparse(res[0].values), { header: true }).data;
    };

    // First, try reading data from the Google Sheet
    if (typeof googleDocURL !== "undefined" && googleDocURL) {
      if (typeof googleApiKey !== "undefined" && googleApiKey) {
        var apiUrl = "https://sheets.googleapis.com/v4/spreadsheets/";
        var spreadsheetId = googleDocURL.split("/d/")[1].split("/")[0];

        $.when(
          $.getJSON(
            apiUrl + spreadsheetId + "/values/Options?key=" + googleApiKey
          ),
          $.getJSON(
            apiUrl + spreadsheetId + "/values/Chapters?key=" + googleApiKey
          )
        ).then(function (options, chapters) {
          initMap(parse(options), parse(chapters));
        });
      } else {
        alert(
          "You load data from a Google Sheet, you need to add a free Google API key"
        );
      }
    } else {
      alert("You need to specify a valid Google Sheet (googleDocURL)");
    }
  });

  /**
   * Reformulates documentSettings as a dictionary, e.g.
   * {"webpageTitle": "Leaflet Boilerplate", "infoPopupText": "Stuff"}
   */
  function createDocumentSettings(settings) {
    for (var i in settings) {
      var setting = settings[i];
      documentSettings[setting.Setting] = setting.Customize;
    }
  }

  /**
   * Returns the value of a setting s
   * getSetting(s) is equivalent to documentSettings[constants.s]
   */
  function getSetting(s) {
    return documentSettings[constants[s]];
  }

  /**
   * Returns the value of setting named s from constants.js
   * or def if setting is either not set or does not exist
   * Both arguments are strings
   * e.g. trySetting('_authorName', 'No Author')
   */
  function trySetting(s, def) {
    s = getSetting(s);
    if (!s || s.trim() === "") {
      return def;
    }
    return s;
  }

  /**
   * Loads the basemap and adds it to the map
   */
  function addBaseMap() {
    var basemap = trySetting("_tileProvider", "Stamen.TonerLite");
    L.tileLayer
      .provider(basemap, {
        maxZoom: 18,
      })
      .addTo(map);
  }

  function initMap(options, chapters) {


    createDocumentSettings(options);

    var chapterContainerMargin = 70;

    document.title = getSetting("_mapTitle");
    $("#header").append("<h1>" + (getSetting("_mapTitle") || "") + "</h1>");
    $("#header").append("<h2>" + (getSetting("_mapSubtitle") || "") + "</h2>");


    // Add logo
    if (getSetting("_mapLogo")) {
      $("#logo").append('<img src="' + getSetting("_mapLogo") + '" />');
      $("#top").css("height", "150px");
    } else {
      $("#logo").css("display", "none");
      $("#header").css("padding-top", "25px");
    }

    // Load tiles
    addBaseMap();

    // Add zoom controls if needed
    if (getSetting("_zoomControls") !== "off") {
      L.control
        .zoom({
          position: getSetting("_zoomControls"),
        })
        .addTo(map);
    }

    var markers = [];

    var markActiveColor = function (k) {
      /* Removes marker-active class from all markers */
      for (var i = 0; i < markers.length; i++) {
        if (markers[i] && markers[i]._icon) {
          markers[i]._icon.className = markers[i]._icon.className.replace(
            " marker-active",
            ""
          );

          if (i == k) {
            /* Adds marker-active class, which is orange, to marker k */
            markers[k]._icon.className += " marker-active";
          }
        }
      }
    };

    var pixelsAbove = [];
    var chapterCount = 0;

    var currentlyInFocus; // integer to specify each chapter is currently in focus
    var overlay; // URL of the overlay for in-focus chapter
    var geoJsonOverlay;

    // Add search bar
    // var searchBar = $('<div id="search-bar"><input type="text" id="search-input" placeholder="Search..."></div>');
    // $("#contents").before(searchBar);


    for (i in chapters) {
      var c = chapters[i];
      console.log(chapters);

      if (
        !isNaN(parseFloat(c["Latitude"])) &&
        !isNaN(parseFloat(c["Longitude"]))
      ) {
        var lat = parseFloat(c["Latitude"]);
        var lon = parseFloat(c["Longitude"]);

        chapterCount += 1;


        markers.push(
          L.marker([lat, lon], {
            icon: L.ExtraMarkers.icon({
              icon: "fa-number",
              number: chapterCount,
                // c["Marker"] === "Numbered" Currently just comment this out because not sure how to set it
                //   ? chapterCount
                //   : c["Marker"] === "Plain"
                //   ? ""
                //   : c["Marker"],
              markerColor: c["Marker Color"] || "blue",
            }),
            opacity: c["Marker"] === "Hidden" ? 0 : 0.9,
            interactive: c["Marker"] === "Hidden" ? false : true,
          })
        );
      } else {
        markers.push(null);
      }

      // Add chapter container

      var container = $("<div></div>", {
        id: "container" + i,
        class: "chapter-container",
      });

      // Media 1

      // Add media and credits: YouTube, audio, or image
      var media = null;
      var mediaContainer = null;
      var sourcename = null;
      var sourcelink = null;
      var medialink = null;
      var media2 = null;
      var mediaContainer2 = null;
      var sourcename2 = null;
      var sourcelink2 = null;
      var medialink2 = null;

      sourcename = "Media Credit"
      sourcelink = "Media Credit Link"
      medialink = "Media Link"

      sourcename2 = "Services Media Credit"
      sourcelink2 = "Services Media Credit Link"
      medialink2 = "Media Link 2"

      // If not YouTube: either audio or image
      var mediaTypes = {
        jpg: "img",
        jpeg: "img",
        png: "img",
        tiff: "img",
        gif: "img",
        mp3: "audio",
        ogg: "audio",
        wav: "audio",
      };

      // Begin of adding the FIRST media source that can be either image or video =======================================
      var source = "";
      if (c[sourcename]) {
        source = $("<a>", {
          text: c[sourcename],
          href: c[sourcelink],
          target: "_blank",
          class: "source",
        });
      } else {
        source = $("<div>", {
          text: c[sourcename],
          class: "source",
        });
      }

      var mediaExt = c[medialink] ? c[medialink].split(".").pop().toLowerCase() : "";
      console.log("First Media link:", c[medialink]); // Log the first media link for troubleshooting
      var mediaType = mediaTypes[mediaExt] || "img";

      if (mediaType) {
        media = $("<" + mediaType + ">", {
          src: c[medialink],
          controls: mediaType === "audio" ? "controls" : "",
          alt: c["Chapter"],
        });

        var enableLightbox =
          getSetting("_enableLightbox") === "yes" ? true : false;
        if (enableLightbox && mediaType === "img") {
          var lightboxWrapper = $("<a></a>", {
            "data-lightbox": c[medialink],
            href: c[medialink],
            "data-title": c["Chapter"],
            "data-alt": c["Chapter"],
          });
          media = lightboxWrapper.append(media);
        }

        mediaContainer = $("<div></div>", {
          class: mediaType + "-container",
        })
          .append(media)
          .after(source);
        }

      // YouTube
      if (c[medialink] && c[medialink].indexOf("youtube.com/") > -1) {
        var videoId = c[medialink].split('v=')[1];
        var ampersandPosition = videoId.indexOf('&');
        if(ampersandPosition != -1) {
          videoId = videoId.substring(0, ampersandPosition);
        }

        // Construct the embed URL
        var embedUrl = "https://www.youtube.com/embed/" + videoId + "/";

        media = $("<iframe></iframe>", {
          src: embedUrl,
          width: "100%",
          height: "100%",
          frameborder: "0",
          allow: "autoplay; encrypted-media",
          allowfullscreen: "allowfullscreen",
        });

        mediaContainer = $("<div></div>", {
          class: "img-container",
        })
          .append(media)
          .after(source);
        }

      // END of adding the FIRST media source that can be either image or video =======================================


      // Begin of adding the SECOND media source that can be either image or video =======================================
      var source2 = "";
      if (c[sourcename2]) {
        source2 = $("<a>", {
          text: c[sourcename2],
          href: c[sourcelink2],
          target: "_blank",
          class: "source",
        });
      } else {
        source2 = $("<div>", {
          text: c[sourcename2],
          class: "source",
        });
      }

      var mediaExt2 = c[medialink2] ? c[medialink2].split(".").pop().toLowerCase() : "";
      var mediaType2 = mediaTypes[mediaExt2] || "img";

      if (mediaType2) {
        media2 = $("<" + mediaType2 + ">", {
          src: c[medialink2],
          controls: mediaType2 === "audio" ? "controls" : "",
          alt: c["Chapter"],
        });

        var enableLightbox =
          getSetting("_enableLightbox") === "yes" ? true : false;
        if (enableLightbox && mediaType2 === "img") {
          var lightboxWrapper = $("<a></a>", {
            "data-lightbox": c[medialink2],
            href: c[medialink2],
            "data-title": c["Chapter"],
            "data-alt": c["Chapter"],
          });
          media2 = lightboxWrapper.append(media2);
        }

        mediaContainer2 = $("<div></div", {
          class: mediaType2 + "-container",
        })
          .append(media2)
          .after(source2);
        

      }

      // YouTube
      if (c[medialink2] && c[medialink2].indexOf("youtube.com/") > -1) {

        console.log("Will this thing display")
        var videoId = c[medialink2].split('v=')[1];
        var ampersandPosition = videoId.indexOf('&');
        if(ampersandPosition != -1) {
          videoId = videoId.substring(0, ampersandPosition);
        }

        // Construct the embed URL
        var embedUrl = "https://www.youtube.com/embed/" + videoId + "/";

        media2 = $("<iframe></iframe>", {
          src: embedUrl,
          width: "100%",
          height: "100%",
          frameborder: "0",
          allow: "autoplay; encrypted-media",
          allowfullscreen: "allowfullscreen",
        });

        mediaContainer2 = $("<div></div>", {
          class: "img-container",
        })
          .append(media2)
          .after(source2);
      }
      // END of adding the SECOND media source that can be either image or video =======================================

      descArray.push(c["Descripcion"]);

      function playAudio() {
        // const voices = window.speechSynthesis.getVoices();
        // msg.voice = voices[10];
        // msg.volume = 1; // From 0 to 1
        // msg.rate = 1; // From 0.1 to 10
        // msg.pitch = 2; // From 0 to 2
        msg.text = descArray[i];

        msg.lang = "es";
        console.log(i, msg.text);
        speechSynthesis.speak(msg);
      }


      console.log(media && c[medialink] ? mediaContainer: "no","xxxxxxxxxxxxx")
      container
        .append('<p class="chapter-header">' + c["Resource"] + "</p>")
        .append('<p class="chapter-address">' + c["Address"] + "</p>")
        .append('<p class="chapter-phone">' + c["Phone Number"] + "</p>")
        .append(media && c[medialink] ? mediaContainer : "")
        .append(media ? source : "")
        .append(media2 && c[medialink2] ? mediaContainer2 : "")
        .append(media2 ? source2 : "")
        .append('<h2 class="translate-title"> Descripción </h2>')
        .append(
          `<button class='listen listen-${i} ' ><span>Escucha</span> <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path d="M6 7l8-5v20l-8-5v-10zm-6 10h4v-10h-4v10zm20.264-13.264l-1.497 1.497c1.847 1.783 2.983 4.157 2.983 6.767 0 2.61-1.135 4.984-2.983 6.766l1.498 1.498c2.305-2.153 3.735-5.055 3.735-8.264s-1.43-6.11-3.736-8.264zm-.489 8.264c0-2.084-.915-3.967-2.384-5.391l-1.503 1.503c1.011 1.049 1.637 2.401 1.637 3.888 0 1.488-.623 2.841-1.634 3.891l1.503 1.503c1.468-1.424 2.381-3.309 2.381-5.394z"/></svg></button>`
        )
        .append(`<button class='stop stop-${i}' >Parar Escuchando</button>`)
        .append('<p class="description">' + c["Descripcion"] + "</p>")

        .append('<h2 class="translate-title">English Translation</h2>')
        .append('<p class="description">' + c["Description"] + "</p>");

      $("#contents").append(container);
    }

    descArray.forEach((text, i) => {
      $(`.stop-${i}`).hide();
      $(`.listen-${i}`).on("click", function () {
        msg.text = text;
        msg.lang = "es";
        console.log(i, msg.text);
        speechSynthesis.speak(msg);
        $(`.stop-${i}`).show();
      });

      $(`.stop-${i}`).on("click", function () {
        $(`.stop-${i}`).hide();
        speechSynthesis.cancel();
      });
    });

    changeAttribution();

    /* Change image container heights */
    imgContainerHeight = parseInt(getSetting("_imgContainerHeight"));
    if (imgContainerHeight > 0) {
      $(".img-container").css({
        height: imgContainerHeight + "px",
        "max-height": imgContainerHeight + "px",
      });
    }

    // For each block (chapter), calculate how many pixels above it
    pixelsAbove[0] = -100;
    for (i = 1; i < chapters.length; i++) {
      pixelsAbove[i] =
        pixelsAbove[i - 1] +
        $("div#container" + (i - 1)).height() +
        chapterContainerMargin;
    }
    pixelsAbove.push(Number.MAX_VALUE);

    $("div#contents").scroll(function () {
      var currentPosition = $(this).scrollTop();

      // Make title disappear on scroll
      if (currentPosition < 200) {
        $("#title").css("opacity", 1 - Math.min(1, currentPosition / 100));
      }

      for (var i = 0; i < pixelsAbove.length - 1; i++) {
        if (
          currentPosition >= pixelsAbove[i] &&
          currentPosition < pixelsAbove[i + 1] - 2 * chapterContainerMargin &&
          currentlyInFocus != i
        ) {
          // Update URL hash
          location.hash = i + 1;

          // Remove styling for the old in-focus chapter and
          // add it to the new active chapter

          $(".chapter-container").removeClass("in-focus")
          // .addClass("out-focus");
          $("div#container" + i)
            .addClass("in-focus")
            .removeClass("out-focus");

          currentlyInFocus = i;
          markActiveColor(currentlyInFocus);

          // Remove overlay tile layer if needed
          if (map.hasLayer(overlay)) {
            map.removeLayer(overlay);
          }

          // Remove GeoJson Overlay tile layer if needed
          if (map.hasLayer(geoJsonOverlay)) {
            map.removeLayer(geoJsonOverlay);
          }

          var c = chapters[i];

          // Add chapter's overlay tiles if specified in options
          if (c["Overlay"]) {
            var opacity = parseFloat(c["Overlay Transparency"]) || 1;
            var url = c["Overlay"];

            if (url.split(".").pop() === "geojson") {
              $.getJSON(url, function (geojson) {
                overlay = L.geoJson(geojson, {
                  style: function (feature) {
                    return {
                      fillColor: feature.properties.fillColor || "#ffffff",
                      weight: feature.properties.weight || 1,
                      opacity: feature.properties.opacity || opacity,
                      color: feature.properties.color || "#cccccc",
                      fillOpacity: feature.properties.fillOpacity || 0.5,
                    };
                  },
                }).addTo(map);
              });
            } else {
              overlay = L.tileLayer(c["Overlay"], { opacity: opacity }).addTo(
                map
              );
            }
          }

          if (c["GeoJSON Overlay"]) {
            $.getJSON(c["GeoJSON Overlay"], function (geojson) {
              // Parse properties string into a JS object
              var props = {};

              if (c["GeoJSON Feature Properties"]) {
                var propsArray = c["GeoJSON Feature Properties"].split(";");
                var props = {};
                for (var p in propsArray) {
                  if (propsArray[p].split(":").length === 2) {
                    props[propsArray[p].split(":")[0].trim()] = propsArray[p]
                      .split(":")[1]
                      .trim();
                  }
                } 
              }

              geoJsonOverlay = L.geoJson(geojson, {
                style: function (feature) {
                  return {
                    fillColor:
                      feature.properties.fillColor ||
                      props.fillColor ||
                      "#ffffff",
                    weight: feature.properties.weight || props.weight || 1,
                    opacity: feature.properties.opacity || props.opacity || 0.5,
                    color: feature.properties.color || props.color || "#cccccc",
                    fillOpacity:
                      feature.properties.fillOpacity ||
                      props.fillOpacity ||
                      0.5,
                  };
                },
              }).addTo(map);
            });
          }

          // Fly to the new marker destination if latitude and longitude exist
          if (c["Latitude"] && c["Longitude"]) {
            var zoom = c["Zoom"] ? c["Zoom"] : CHAPTER_ZOOM;
            map.flyTo([c["Latitude"], c["Longitude"]], zoom, {
              animate: true,
              duration: 2, // default is 2 seconds
            });
          }

          // No need to iterate through the following chapters
          break;
        }
      }
    });

    $("#contents").append(
      " \
      <div id='space-at-the-bottom'> \
        <a href='#top'>  \
          <i class='fa fa-chevron-up'></i></br> \
          <small>Top</small>  \
        </a> \
      </div> \
    "
    );

    /* Generate a CSS sheet with cosmetic changes */
    $("<style>")
      .prop("type", "text/css")
      .html(
        "\
      #narration, #title {\
        background-color: " +
          trySetting("_narrativeBackground", "white") +
          "; \
        color: " +
          trySetting("_narrativeText", "black") +
          "; \
      }\
      a, a:visited, a:hover {\
        color: " +
          trySetting("_narrativeLink", "blue") +
          " \
      }\
      .in-focus {\
        background-color: " +
          trySetting("_narrativeActive", "#f0f0f0") +
          " \
      }"
      )
      .appendTo("head");

    endPixels = parseInt(getSetting("_pixelsAfterFinalChapter"));
    if (endPixels > 100) {
      $("#space-at-the-bottom").css({
        height: endPixels / 2 + "px",
        "padding-top": endPixels / 2 + "px",
      });
    }

    //=================== Add markers to the map ================================
    var bounds = [];
    for (i in markers) {
      if (markers[i]) {
        markers[i].addTo(map);
        markers[i]["_pixelsAbove"] = pixelsAbove[i];
        markers[i].on("click", function () {
          var pixels = parseInt($(this)[0]["_pixelsAbove"]) + 5;
          $("div#contents").animate({
            scrollTop: pixels + "px",
          });
        });
        bounds.push(markers[i].getLatLng());
      }
    }
    map.fitBounds(bounds);

    $("#map, #narration, #title").css("visibility", "visible");
    $("div.loader").css("visibility", "hidden");

    $("div#container0").addClass("in-focus");
    $("div#contents").animate({ scrollTop: "1px" });

    // On first load, check hash and if it contains an number, scroll down
    if (parseInt(location.hash.substr(1))) {
      var containerId = parseInt(location.hash.substr(1)) - 1;
      $("#contents").animate(
        {
          scrollTop: $("#container" + containerId).offset().top,
        },
        2000
      );
    }

    // Add Google Analytics if the ID exists
    var ga = getSetting("_googleAnalytics");
    if (ga && ga.length >= 10) {
      var gaScript = document.createElement("script");
      gaScript.setAttribute(
        "src",
        "https://www.googletagmanager.com/gtag/js?id=" + ga
      );
      document.head.appendChild(gaScript);

      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", ga);
    }

    // Add scroll handler for mobile
    $(window).on('scroll', function() {
      if (window.innerWidth <= 768) {
        if ($(window).scrollTop() > 20) { // Reduced threshold for faster response
          $('body').addClass('scrolled');
        } else {
          $('body').removeClass('scrolled');
        }
      }
    });
  }

  /**
   * Changes map attribution (author, GitHub repo, email etc.) in bottom-right
   */
  function changeAttribution() {
    var attributionHTML = $(".leaflet-control-attribution")[0].innerHTML;
    var credit =
      'View <a href="' +
      // Show Google Sheet URL if the variable exists and is not empty, otherwise link to Chapters.csv
      (typeof googleDocURL !== "undefined" && googleDocURL
        ? googleDocURL
        : "./csv/Chapters.csv") +
      '" target="_blank">data</a>';

    var name = getSetting("_authorName");
    var url = getSetting("_authorURL");

    if (name && url) {
      if (url.indexOf("@") > 0) {
        url = "mailto:" + url;
      }
      credit += ' by <a href="' + url + '">' + name + "</a> | ";
    } else if (name) {
      credit += " by " + name + " | ";
    } else {
      credit += " | ";
    }

    credit += 'View <a href="' + getSetting("_githubRepo") + '">code</a>';
    if (getSetting("_codeCredit")) credit += " by " + getSetting("_codeCredit");
    credit += " with ";
    $(".leaflet-control-attribution")[0].innerHTML = credit + attributionHTML;
  }
});
