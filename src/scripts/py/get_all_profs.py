import requests
import json
from config import Config
import base64

config = Config()

def fetch_all_teachers(school_id):
    
    # get base_url
    base_url = config.get_property("rateprofessor_graphql_endpoint", None)
    
    # check if base_url is set
    if base_url == None:
        raise Exception("base_url not set in config.json")
    
    # Headers based on the request you provided
    headers = config.get_property("headers")

    all_teachers = {}
    has_next_page = True
    cursor = None

    while has_next_page:
        # payload to be sent
        payload = {
            "query": config.get_property("query"),
            "variables": {
                "count": config.get_property("count", 100),
                "cursor": cursor,
                "query": {
                    "text": "",
                    "schoolID": school_id,
                    "fallback": True
                }
            }
        }

        try:
            response = requests.post(base_url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

            # Extract teachers from this page
            teachers_data = data['data']['search']['teachers']
            
            # Process and extract specific fields
            for edge in teachers_data['edges']:
                teacher = edge['node']
                processed_teacher = {
                    "firstName": teacher.get('firstName', ''),
                    "lastName": teacher.get('lastName', ''),
                    "rateMyProfLink": config.get_property("BASE_URL").format(path=teacher.get('legacyId', '')),
                    "overallRating": str(teacher.get('avgRating', '')),
                    "takeAgainRating": f"{teacher.get('wouldTakeAgainPercent', '')}%",
                    "difficultyLevel": str(teacher.get('avgDifficulty', '')),
                    "numberOfRatings": str(teacher.get('numRatings', ''))
                }
                all_teachers[f"{teacher.get('lastName', '')} {teacher.get('firstName', '')[0]}."] = processed_teacher

            # Update pagination info
            page_info = teachers_data['pageInfo']
            has_next_page = page_info['hasNextPage']
            cursor = page_info['endCursor']

        except requests.RequestException as e:
            print(f"An error occurred: {e}")
            break

    return all_teachers

# get school_id from config.json
school_id: str = config.get_property("school_id")

# convert to base64 string
school_id = base64.b64encode(school_id.encode('utf-8')).decode()

# fetch all the professors
all_teachers = fetch_all_teachers(school_id)

# Save to JSON file
output_name = config.get_property("output_name", "ratemyprofessor.json")
with open(output_name, 'w', encoding='utf-8') as f:
    json.dump(all_teachers, f, indent=2, ensure_ascii=False)

# give some stats
print(f"Total teachers retrieved: {len(all_teachers)}")
print(f"Professors data saved to {output_name}")