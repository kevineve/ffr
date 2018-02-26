Fresh Food Reminder: Built by Kevin Eve 

index.html: framework of website that displays images and expiration date of food items in database(google sheet API) along with an image of the food item taken from Bing image search API.

main.js: Back end to allow users to load images from their smartphone camera. Gets text from the image with Google Could Vision API. Uses Regular Expressions to match text from grocery store receipts with a list of food items and their expiration dates. 

key.js: Contains a list of 935 food items that expire in less than 30 days. 

webScraping.py: Python file used to scrape food item list from http://www.stilltasty.com/ and process for matching with grocery store receipt text

This directory contains samples using the [Google Cloud Vision
API](https://cloud.google.com/vision/).

Please find this site hosted at https://kevineve.github.io/ffr/ 
To delete items, you must remove them from the google spreadsheet that stores data for the site.

You will need access from me kevin_eve@brown.edu to interact with the site
