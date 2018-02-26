import requests
import re
import codecs 
import urllib, base64, json
from bs4 import BeautifulSoup
#from urlparse import urljoin

def getFoods():
	baseUrl='http://stilltasty.com/fooditems/index/'

	foundFoods=[]

	#url of food items are sequential with {.../index/16334 : .../index/18913}
	for i in range(16334,18914): 
		
		url = urljoin(baseUrl,str(i))
		#print url
		html=requests.get(url).content

		soup=BeautifulSoup(html,"html.parser")
		title =soup.find("strong")
		if(title is None):
			continue
		title = title.getText()
		title = re.split(',|-|/|\(',title)[0]
		title = re.split(u"\u2014", title)

		daysList = soup.find_all('td',class_="days")
		lastDays= 10000
		#convert each text representation of date into number of days
		#use the lowest value of each of these
		for days in daysList:
			daysText = days.getText()
			timeUnit = re.search(r'(week)[s]?|(month)[s]?|(day)[s]?|(year)[s]?',daysText)
			if(timeUnit):
				timeUnit = timeUnit.group()
			else:
				daysfresh = 10000
				continue
			values = re.findall(r'(\d+)',daysText)
			if(len(values)>1):
				value =  (int(values[0]) +int(values[1]))/2
			else:
				value = int(values[0])
			daysfresh = 0
			if(timeUnit=="days" or timeUnit == "day"):
				daysfresh=value
			if(timeUnit=="weeks" or timeUnit == "week"):
				daysfresh = 7*value
			if(timeUnit =="months" or timeUnit =="month"):
				daysfresh=30*value
			if(timeUnit == "years" or timeUnit =="year"):
				daysfresh = 365 * value
			daysfresh = min(lastDays,daysfresh)
			lastDays = daysfresh
		foundFoods.append([title[0].strip(),daysfresh])
		#print title[0].strip()
	return foundFoods

def pruneData(foundFoods):
	prunedData = []
	dup = False
	for i in range(len(foundFoods)):
		food = foundFoods[i]
		food[0] = re.split('\sOR\s',food[0])[0]
		if(len(food[0])>25):
			continue
		if(int(food[1])> 500):
			continue
		for j in range(len(prunedData)):
			if (food[0]==prunedData[j][0]):
				prunedData[j][1]=min(int(food[1]),int(prunedData[j][1]))
				dup = True
				continue
		if(dup):
			dup = False
			continue
		prunedData.append(food)


	return prunedData
	

#wrote this first because I wanted to do in in O(n) time, later realize O(n^2) is worth it for the sake of clarity
def removeDuplicates(foundFoods):
	foundFoodsND = [foundFoods[0]]

	dupFood = []
	for x in range(1,len(foundFoods)):
		curFood = foundFoods[x]
		prevFood = foundFoods[x-1]

		if (curFood[0]==prevFood[0]):
			if(len(dupFood)==0):
				foundFoodsND.pop()
				dupFood.append(curFood)
				dupFood.append(prevFood)
				continue
			else:
				dupFood.append(curFood)
				continue
		if(len(dupFood)>0):
			minDays = 100000
			minIndex = -1
			for i in range(len(dupFood)):
				if(dupFood[i][1]<minDays):
					minDays= dupFood[i][1]
					minIndex = i
			foundFoodsND.append(dupFood[minIndex])
			dupFood = []

		foundFoodsND.append(curFood)
	return foundFoodsND


def sortHelper(food):
	return len(food[0])

#sort list of regex by length of string, allows to match longest, most descriptive string first
def sortByLength(foods):
	foods.sort(key = sortHelper)
	foods = foods[::-1]
	return foods

def loadData(file):
	data_file = codecs.open(file,encoding = 'utf-8')
	foodList = data_file.read().split('-')
	newList = []
	for food in foodList:
		newList.append(food.split(','))
	data_file.close()
	return newList[:-1]

def storeData(foundFoods):
	full_data_file = codecs.open("Data.txt", "w",encoding='utf-8')
	for food in foundFoods:
		full_data_file.write(food[0] + "," + str(food[1]) + "-")
	full_data_file.close()

#write data to txt file that I then copied into my .js files 
#also
def writeDataRegex(foundFoods,fileName):
	text_file = codecs.open(fileName, "w",encoding='utf-8')
	#write the url for each food item 
	text_file.write("[")
	for food in foundFoods:
		text_file.write("\"" + getFoodUrl(food[0]) + "\",")
	text_file.write("]")

	#write regex for each food item 	
	text_file.write("\n")
	text_file.write("[")
	for food in foundFoods:
		food[0] = re.sub('\'','',food[0])
		if(food[0][-1] == 'S'):
			food[0] = food[0][:-1] + '(S?)'
		text_file.write("[/\\b" + food[0] + "\\b/i," + str(food[1]) + "],")
	text_file.close()

#deprecated, 
def writeUrlList(foundFoods):
	for food in foundFoods:
		"\"" + getFoodUrl(food[0]) + "\""

#get a url for an image of each item from bing image search 
#adapted from bing imge search sample at:
#https://dev.cognitive.microsoft.com/docs/services/56b43f0ccf5ff8098cef3808/operations/571fab09dbe2d933e891028f
def getFoodUrl(item):
	headers = {
    # Request headers
    'Ocp-Apim-Subscription-Key': 'c51d7949ff1d476bb9731a5f45676a08',
	}

	params = urllib.urlencode({
    # Request parameters
    'q': item.encode('ascii',errors='ignore'),
    'count': '1',
    'offset': '0',
    'mkt': 'en-us',
    'safeSearch': 'Moderate',
    'size':'Large'
	})

	conn = httplib.HTTPSConnection('api.cognitive.microsoft.com')

	conn.request("GET", "/bing/v5.0/images/search?%s" % params, "{body}", headers)
	response = conn.getresponse()
	data = response.read()
	json_obj = json.loads(data)
	if(not 'value' in json_obj):
		return "badURL"
	url= json_obj['value'][0]['contentUrl']
	conn.close()
	return url


foundFood = loadData("Data.txt")
foundFood = pruneData(foundFood)
foundFood = sortByLength(foundFood)
print(len(foundFood))
#writeDataRegex(foundFood,"output.txt")




	
	