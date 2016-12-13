'use strict';

//Google Cloud Engine Vision Sample code taken from:
//https://github.com/GoogleCloudPlatform/web-docs-samples/tree/master/vision/explore-api
//
//Google Sheets Authentication Sample code take from:
//https://developers.google.com/sheets/api/quickstart/js

var CV_URL = 'https://vision.googleapis.com/v1/images:annotate?key=' + window.apiKey;

var apiKey = 'AIzaSyArDF3GHuVKoCAL8hRkDFFCOQ7NqmICQjQ';

var discoveryDocs = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

var clientId = '730754927773-52c3bj4309k9co16t4mjrlppe1ujvqr9.apps.googleusercontent.com';

var scopes = 'https://www.googleapis.com/auth/spreadsheets';

var storedFoodId= []
var outputDiv
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');


$(function () {
  $('#fileform').on('submit', uploadFiles);
});
/**
 *  Method in its entireity from Google Cloud Engine Vision Sample 
 * 'submit' event handler - reads the image bytes and sends it to the Cloud
 * Vision API.
 */
function uploadFiles (event) {
  console.log("uploadFiles")
  event.preventDefault(); // Prevent the default form post

  // Grab the file and asynchronously convert to base64.
  var file = $('#fileform [name=fileField]')[0].files[0];
  var reader = new FileReader();
  reader.onloadend = processFile;
  reader.readAsDataURL(file);
  console.log("here")
}
/**
 * Method in its entireity from Google Cloud Engine Vision Sample 
 * Event handler for a file's data url - extract the image data and pass it off.
 */
function processFile (event) {
  console.log("processFile")
  var content = event.target.result;
  sendFileToCloudVision(content.replace('data:image/jpeg;base64,', ''));
}

/**
 * Method in its entireity from Google Cloud Engine Vision Sample 
 * Sends the given file contents to the Cloud Vision API and outputs the
 * results.
 */
function sendFileToCloudVision (content) {
  console.log("processFile")
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

/**
* 
* Parse food items from the text output from google cloud engine text detection
*/
function parseReceiptData(data){
  console.log(parseReceiptData)
  console.log(storedFoodId)
  outputDiv = document.createElement('div')
  var recieptContent = data.responses[0].textAnnotations[0].description
  var foundFood = []
  var regexList = window.foodList
  var match
  var date = new Date()
  //split receipt content into rows 
  var listRows = recieptContent.split('\n')
  for(var i = 0; i < listRows.length; i++){
    for( var k = 0; k < regexList.length; k++){
      //attempt to match each row with entire regex list of foods
      match = listRows[i].match(regexList[k][0])
      if(match){
        console.log(storedFoodId.indexOf(k))
        if(storedFoodId.indexOf(k)!=-1){
          continue
        }
        foundFood.push([match[0],regexList[k][1], date , k])
        console.log([match[0],regexList[k][1], date , k])
        //continue to avoid multiple matches 
        continue
      }
    }
  }
  storeData(foundFood);
  loadContents()
}
/*
* Method written by hand, drawing from google sheets sample code
* Store contents of found Food list in google sheet
*/
function storeData(foundFood){
  console.log("storeData")
  gapi.client.sheets.spreadsheets.values.append({
    "spreadsheetId": '1VZwr1nCFcEs7Cnr2u-Gq-92ayhf3QWAtlPiUdeOn7e8',
    "range": 'Sheet1!A1:D1',
    'valueInputOption':"RAW",
    "majorDimension": "ROWS",
    "values":foundFood,
  }).then(function(response) {
    //console.log(response)
  });
}

/*
* Method written by hand, drawing from google sheets sample code
* Load contents of google sheet and display on page
*/
function loadContents(){
  console.log("loadContents")
  gapi.client.sheets.spreadsheets.values.get({
    "spreadsheetId": '1VZwr1nCFcEs7Cnr2u-Gq-92ayhf3QWAtlPiUdeOn7e8',
    "range": 'Sheet1!A2:D300',
    "majorDimension": "ROWS",
  }).then(function(response) {
    //appendPre('Error: ' + response.error.message);
    console.log(response)
    if(!response.result.values){
      return
    }
    var fridgeContents = response.result.values
    var purchaseDate;
    var date = new Date()
    var daysFresh = 0
    var url = " "
    for(var i = 0; i < fridgeContents.length;i++){
      //console.log(fridgeContents[i.toString()])
      //pull data from json response
      purchaseDate = new Date(fridgeContents[i.toString()]["2"])
      daysFresh = parseInt(fridgeContents[i.toString()]["1"])
      url = window.urlList[fridgeContents[i.toString()]["3"]]
      //date addition to get eat by date
      purchaseDate.setDate(purchaseDate.getDate() + daysFresh)
      //purchaseDate now refers to eat by date
      //if item has yet to go bad, display on page
      if(purchaseDate>date){
        appendItem(url,fridgeContents[i.toString()][0],purchaseDate.toDateString())
        storedFoodId.push(parseInt(fridgeContents[i.toString()]["3"]))
      }
    }
  });
}
/*
*method in its entirity take from good sheets authenticatin code
*/
function handleClientLoad() {
  // Load the API client and auth2 library
  console.log("handleClientLoad")
  gapi.load('client:auth2', initClient);
}

/*
*method in its entirity take from good sheets authenticatin code
*/
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
    //submitButton.onclick = handleSubmitClick;
    loadContents()
    initDiv()
  });
}

/*
*method in its entirity take from good sheets authenticatin code
*/
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

/*
*method in its entirity take from good sheets authenticatin code
*/
function handleAuthClick(event) {
  console.log("handleAuthClick")
  gapi.auth2.getAuthInstance().signIn();
}
/*
*method in its entirity take from good sheets authenticatin code
*/
function handleSignoutClick(event) {
  console.log("handleSignoutClick")
  gapi.auth2.getAuthInstance().signOut();
}
/*
*method in its entirity take from good sheets authenticatin code
*/
function handleSubmitClick(event) {
  uploadFiles(event)
}

function initDiv(){
  outputDiv = document.createElement('div')
  outputDiv.style.display = "inline-block"
  document.getElementsByTagName('body')[0].appendChild(outputDiv);
}


/*
*method inspired by 
*http://thenewcode.com/834/Auto-Generate-Image-Captions-With-Progressive-JavaScript
*/
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

  // outputDiv = document.createElement('div')
  // outputDiv.style.display = "inline-block"
  // document.getElementsByTagName('body')[0].appendChild(outputDiv);
  outputDiv.appendChild(fig)
  fig.appendChild(img)
  fig.appendChild(caption)

}

//http://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
function capitalizeFirstLetter(string) {
    return string.charAt(0) + string.slice(1).toLowerCase();
}

/**
 * method adapted from google Computer Vision Sample Code
 */
function displayJSON (data) {
  console.log("displayJSON")
  $('#results').text("");
  parseReceiptData(data);
}
