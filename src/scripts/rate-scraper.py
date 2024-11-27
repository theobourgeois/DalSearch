import requests
import re
import json
import time
from bs4 import BeautifulSoup

def scrape(prof_name):
    time.sleep(0.25)
    url = 'https://www.ratemyprofessors.com/search/professors/1423?q=' + prof_name
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    rating_div = soup.find_all('div', class_=re.compile('.*CardNumRating__CardNumRatingNumber.*'))
    count_div = soup.find_all('div', class_=re.compile('.*CardNumRating__CardNumRatingCount.*'))
    name_div = soup.find_all('div',class_=re.compile('.*CardName__StyledCardName.*'))
    feedback_div = soup.find_all('div',class_=re.compile('.*CardFeedback__CardFeedbackNumber.*'))
    link_href = soup.find_all('a', href=True, class_=re.compile('.*TeacherCard__StyledTeacherCard.*'))

    rating = "null"
    link = "null"
    first_name = "null"
    last_name = "null"
    take_again = "null"
    difficulty_level = "null"
    number_of_ratings = "null"

    if rating_div:
        rating = rating_div[0].get_text(strip=True)
    if count_div:
        number_of_ratings = count_div[0].get_text(separator=' ', strip=True).split()[0]
    if name_div:
        full_name = name_div[0].get_text(separator=' ',strip=True).split()
        first_name = full_name[0]
        last_name = full_name[1]
    if link_href:
        link = 'https://www.ratemyprofessors.com' + (link_href[0]['href'])
    if feedback_div:
        take_again = feedback_div[0].get_text(strip=True)
        difficulty_level = feedback_div[1].get_text(strip=True)

    data = {
        f"{last_name} {first_name[0]}.": {
            "firstName":first_name,
            "lastName":last_name,
            "rateMyProfLink":link,
            "overallRating":rating,
            "takeAgainRating":take_again,
            "difficultyLevel":difficulty_level,
            "numberOfRatings":number_of_ratings
        }
    }

    return data

def main():
    with open('dal_profs.json','r') as json_file:
        dal_profs = json.load(json_file)

    data = {}

    for prof in dal_profs:
        data.update(scrape(prof))

    with open('output.json','w') as file:
         json.dump(data,file,indent=4)

if __name__ == "__main__":
    main()
