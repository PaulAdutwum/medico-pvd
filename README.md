# Leaflet Storymaps with Google Sheets

This is a storymap of community resources in Providence, Rhode Island, built using the [HandsOnDataViz/leaflet-storymaps-with-google-sheets](https://github.com/HandsOnDataViz/leaflet-storymaps-with-google-sheets) repository.

## Build Process

The regular version requires:
1. Create a `.env` file where you define the `googleApiKey` and `googleDocURL`.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to create the main `index.html` file to serve statically.
4. Install Live Server extension, then you can open index.html with "Live View" in the lower left

For this file, go to actions menu in the top of the github and then build. 

## Description

Customize your Leaflet story map with linked Google Sheets template and scrolling narrative. Supports images, audio and video embeddings, and Leaflet TileLayer/geojson overlays.

### Live Links (Replace with your own)
- Leaflet Map: https://handsondataviz.github.io/leaflet-storymaps-with-google-sheets/
- Google Sheets Template: https://docs.google.com/spreadsheets/d/1AO6XHL_0JafWZF4KEejkdDNqfuZWUk3SlNlQ6MjlRFM/edit#gid=0
- Our Sheet: [insert your own Google Sheets ID here]

### Create Your Own
See step-by-step tutorial in [Hands-On Data Visualization](https://HandsOnDataViz.org/leaflet-storymaps-with-google-sheets.html).

### Geocode your address data with Google Sheets add-on
To geocode (find latitude and longitude coordinates), we recommend installing the free Geocoding by SmartMonkey add-on for Google Sheets. Insert your addresses in place of the samples in the Geocoding Details tab, then use Add-Ons > Geocoding > Geocode Details menu. Learn more in [Hands-On Data Visualization](https://handsondataviz.org/geocode.html).

### Geocoding

To finalize your map, you need to either:
- Download each Google Sheets tab as a CSV file and upload into a `csv` subfolder in your GitHub repo.
- Get your own Google Sheets API Key to insert into `google-doc-url.js`.

See more in the tutorial https://handsondataviz.org/leaflet-storymaps-with-google-sheets.html.

### Update your code for any pre-October 2020 storymaps before January 2021

If you used our code to create a storymap prior to October 2020, you will need to update your version before January 26, 2021 for it to continue to work. Google announced that it will migrate from Google Sheets API v3 to v4 in Jan 2021, and we released our update of Leaflet storymaps code v1.2 on September 29th to address Google's changes.

Three options to update your code:
- Option A: If you understand (or are willing to learn about) GitHub Desktop, use it to move copies of the newer code (index.html, scripts folder, markers folder, style.css, etc.) into your repo via your local computer. In the `google-doc-url.js` file, copy and paste the Google Sheets API key that appears in the lower half of our code, but keep your own Google Sheets ID that appears in the upper-half of your code.
- Option B: If you originally "forked" a copy of our code, create a GitHub "pull request" to update your repo with our code revisions, including the Google Sheets API key. We recommend this option only if you understand (or are willing to learn about) GitHub pull requests, and can deal with resolving conflicts between your code and our updated code. Warning: Since this operation might overwrite some of your code,
