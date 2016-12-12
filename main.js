// Copyright 2015, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License")
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var CV_URL = 'https://vision.googleapis.com/v1/images:annotate?key=' + window.apiKey;

// Enter an API key from the Google API Console:
//   https://console.developers.google.com/apis/credentials
var apiKey = 'AIzaSyArDF3GHuVKoCAL8hRkDFFCOQ7NqmICQjQ';
// Enter the API Discovery Docs that describes the APIs you want to
// access. In this example, we are accessing the People API, so we load
// Discovery Doc found here: https://developers.google.com/people/api/rest/
var discoveryDocs = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
// Enter a client ID for a web application from the Google API Console:
//   https://console.developers.google.com/apis/credentials?project=_
// In your API Console project, add a JavaScript origin that corresponds
//   to the domain where you will be running the script.
var clientId = '730754927773-52c3bj4309k9co16t4mjrlppe1ujvqr9.apps.googleusercontent.com';
// Enter one or more authorization scopes. Refer to the documentation for
// the API or https://developers.google.com/people/v1/how-tos/authorizing
// for details.
var scopes = 'https://www.googleapis.com/auth/spreadsheets';
var authorizeButton = document.getElementById('authorize-button');
console.log(authorizeButton)
var signoutButton = document.getElementById('signout-button');
console.log(signoutButton)
var submitButton = document.getElementById('submit-button');
console.log(submitButton)

// $(function () {
//   $('#fileform').on('submit', uploadFiles);
// });



/**
 * 'submit' event handler - reads the image bytes and sends it to the Cloud
 * Vision API.
 */
function uploadFiles (event) {
  console.log("uploadFiles")
  console.log(window.receiptText)
  parseReceiptData(window.receiptText)
  // event.preventDefault(); // Prevent the default form post

  // // Grab the file and asynchronously convert to base64.
  // var file = $('#fileform [name=fileField]')[0].files[0];
  // var reader = new FileReader();
  // reader.onloadend = processFile;
  // reader.readAsDataURL(file);
}

/**
 * Event handler for a file's data url - extract the image data and pass it off.
 */
function processFile (event) {
  var content = event.target.result;
  sendFileToCloudVision(content.replace('data:image/jpeg;base64,', ''));
}

/**
 * Sends the given file contents to the Cloud Vision API and outputs the
 * results.
 */
function sendFileToCloudVision (content) {
  var type = $('#fileform [name=type]').val();

  // Strip out the file prefix when you convert to json.
  var request = {
    requests: [{
      image: {
        content: content
      },
      features: [{
        type: "TEXT_DETECTION",
        maxResults: 200
      }]
    }]
  };

  $('#results').text('Loading...');
  $.post({
    url: CV_URL,
    data: JSON.stringify(request),
    contentType: 'application/json'
  }).fail(function (jqXHR, textStatus, errorThrown) {
    $('#results').text('ERRORS: ' + textStatus + ' ' + errorThrown);
  }).done(displayJSON);
}

function parseReceiptData(data){
  //console.log(data)
  //var recieptContent = data.responses[0].textAnnotations[0].description
  var foundFood = []
  var recieptContent = data
  var regexList = window.foodList
  var match
  var date = new Date()
  //console.log(recieptContent)
  var listRows = recieptContent.split('\n')
  for(var i = 0; i < listRows.length; i++){
    for( var k = 0; k < regexList.length; k++){
      //console.log(listRows[i])
      match = listRows[i].match(regexList[k][0])
      if(match){
        foundFood.push([match[0],regexList[k][1].toString(), date])
        //console.log([match[0],(j*4 + 3).toString(), date])
        continue
      }
    }

  }
  
  for(var i = 0; i < foundFood.length; i++){
    console.log(foundFood[i])
  }
  storeData(foundFood);
}

function storeData(foundFood){
  console.log("storeData")
  gapi.client.sheets.spreadsheets.values.append({
    "spreadsheetId": '1VZwr1nCFcEs7Cnr2u-Gq-92ayhf3QWAtlPiUdeOn7e8',
    "range": 'Sheet1!A1:C1',
    'valueInputOption':"RAW",
    "majorDimension": "ROWS",
    "values":foundFood,
  }).then(function(response) {
    //appendPre('Error: ' + response.error.message);
    console.log(response)
    loadContents();
  });
}

function loadContents(){
  console.log("loadContents")
  gapi.client.sheets.spreadsheets.values.get({
    "spreadsheetId": '1VZwr1nCFcEs7Cnr2u-Gq-92ayhf3QWAtlPiUdeOn7e8',
    "range": 'Sheet1!A2:C100',
    "majorDimension": "ROWS",
  }).then(function(response) {
    //appendPre('Error: ' + response.error.message);
    console.log(response)
    if(!response.result.values){
      return
    }
    var fridgeContents = response.result.values
    //console.log(fridgeContents)
    var purchaseDate;
    var date = new Date()
    var daysFresh = 0
    for(var i = 0; i < fridgeContents.length;i++){
      console.log(fridgeContents[i.toString()])
      purchaseDate = new Date(fridgeContents[i.toString()]["2"])
      daysFresh = parseInt(fridgeContents[i.toString()]["1"])
      console.log(purchaseDate, date)
      purchaseDate.setDate(purchaseDate.getDate() + daysFresh)
      console.log(purchaseDate)
      if(purchaseDate>date){
        appendPre(fridgeContents[i.toString()][0],purchaseDate)
        appendPre(purchaseDate.toDateString())
        httpGetAsync(fridgeContents[i.toString()][0], function(response){
          console.log(response)
        })
      }
    }
  });
}

 function handleClientLoad() {
  // Load the API client and auth2 library
  console.log("handleClientLoad")
  gapi.load('client:auth2', initClient);
}

function initClient() {
  console.log("initClient")
  gapi.client.init({
      apiKey: apiKey,
      discoveryDocs: discoveryDocs,
      clientId: clientId,
      scope: scopes
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
    submitButton.onclick = handleSubmitClick;
    loadContents()
    //submitButton.stle.display = 'block';
  });
}

function updateSigninStatus(isSignedIn) {
  console.log("updateSigninStatus")
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

function handleAuthClick(event) {
  console.log("handleAuthClick")
  gapi.auth2.getAuthInstance().signIn();
}
function handleSignoutClick(event) {
  console.log("handleSignoutClick")
  gapi.auth2.getAuthInstance().signOut();
}
function handleSubmitClick(event) {
  uploadFiles()
}
// Load the API and make an API call.  Display the results on the screen.
function makeApiCall() {
  console.log("makeApiCall")
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1VZwr1nCFcEs7Cnr2u-Gq-92ayhf3QWAtlPiUdeOn7e8',
    range: 'Sheet1!A1:E1',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      appendPre('Name, Major:');
      for (var i = 0; i < range.values.length; i++) {
        var row = range.values[i];
        // Print columns A and E, which correspond to indices 0 and 4.
        appendPre(row);
      }
    } else {
      appendPre('No data found.');
    }
  }, function(response) {
    appendPre('Error: ' + response.result.error.message);
  });
}

/**
 * Append a pre element to the body containing the given message
 * as its text node.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('output');
  //pre.empty()
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

// http://stackoverflow.com/questions/5451445/how-to-display-image-with-javascript
function show_image(src, width, height, alt) {
    var img = document.createElement("img");
    img.src = src;
    img.width = width;
    img.height = height;
    img.alt = alt;

    // This next line will just add it to the <body> tag
    document.body.appendChild(img);
}

//http://stackoverflow.com/questions/247483/http-get-request-in-javascript
function httpGetAsync(item, callback) {
  item = item.split(' ').join('+')
 $(function() {
      var params = {
          // Request parameters
          "q": item,
          "count": "1",
          "offset": "0",
          "mkt": "en-us",
          "safeSearch": "Moderate",
      };
    
      $.ajax({
          url: "https://api.cognitive.microsoft.com/bing/v5.0/images/search?" + $.param(params),
          beforeSend: function(xhrObj){
              // Request headers
              xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","{MDU2NTQxMzM3ODJlNDIxYjg2OGQ4YzM4ZTI5MjRlMzY=}");
          },
          type: "GET",
          // Request body
          data: "{Host: api.cognitive.microsoft.com,Ocp-Apim-Subscription-Key: ••••••••••••••••••••••••••••••••}",
      })
      .done(function(data) {
          alert("success");
      })
      .fail(function() {
          alert("error");
      });
  });
}
/**
 * Displays the results.
 */
function displayJSON (data) {
  var contents = JSON.stringify(data, null, 4);
  $('#results').text(contents);
  var evt = new Event('results-displayed');
  parseReceiptData(data);
  evt.results = contents;
  //document.dispatchEvent(evt);
  //document.write(data);
  // var levt = new Event('list-displayed');
  // levt.results = window.foodList;
  // document.dispatchEvent(levt);
}
