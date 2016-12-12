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
        foundFood.push([match[0],regexList[k][1], date , k])
        console.log([match[0],regexList[k][1], date , k])
        //console.log([match[0],(j*4 + 3).toString(), date])
        continue
      }
    }
  }
  // for(var i = 0; i < foundFood.length; i++){
  //   console.log(foundFood[i])
  // }
  storeData(foundFood);
}

function storeData(foundFood){
  console.log("storeData")
  gapi.client.sheets.spreadsheets.values.append({
    "spreadsheetId": '1VZwr1nCFcEs7Cnr2u-Gq-92ayhf3QWAtlPiUdeOn7e8',
    "range": 'Sheet1!A1:D1',
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
    "range": 'Sheet1!A2:D100',
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
    var url = " "
    for(var i = 0; i < fridgeContents.length;i++){
      console.log(fridgeContents[i.toString()])
      purchaseDate = new Date(fridgeContents[i.toString()]["2"])
      daysFresh = fridgeContents[i.toString()]["1"]
      url = window.urlList[fridgeContents[i.toString()]["3"]]
      purchaseDate.setDate(purchaseDate.getDate() + daysFresh)
      if(purchaseDate>date){
        appendItem(url,fridgeContents[i.toString()][0],purchaseDate.toDateString())
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

//http://thenewcode.com/834/Auto-Generate-Image-Captions-With-Progressive-JavaScript
function appendItem(src,item,date){
  var fig = document.createElement('figure')
  fig.style.display = 'table;'

  var img = document.createElement("img");
  img.src = src;
  img.width = 300;
  img.height = 200;

  var caption = document.createElement( 'figcaption' );
  caption.innerHTML = capitalizeFirstLetter(item) + " Fresh Until: " + date
  caption.style.textAlign = 'center';

  var outputDiv = document.createElement('div')
  outputDiv.style.display = "inline-block"
  document.getElementsByTagName('body')[0].appendChild(outputDiv);
  outputDiv.appendChild(fig)
  fig.appendChild(img)
  fig.appendChild(caption)

}

//http://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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
