# DalSearch
A course search tool for Dalhousie students. Allows students to view course information like prerequisites, instructors and the course schedule.

# Course API Reference

This document provides detailed information about the available endpoints in the Course API.

## Table of Contents
- [Get Course by Code](#get-course-by-code)
- [Filter Courses](#filter-courses)
- [Search Courses](#search-courses)

## Get Course by Code

Retrieves detailed information about a specific course by its course code.

### Endpoint

```
GET /api/course/{course}
```

### Parameters

| Parameter | Type   | Description                    |
|-----------|--------|--------------------------------|
| course    | string | The course code (e.g., "CSCI2122") |

### Response

#### Success (200 OK)
Returns a JSON object containing the course details.

Example:
```json
{
  "courseCode": "2122",
  "subjectCode": "CSCI",
  "title": "Systems Programming",
  "creditHours": 3,
  "prerequisites": ["CSCI1110", "CSCI1120"],
  "description": "This course presents tools, techniques, and concepts for systems programming. Students will be exposed to assembly and will be introduced to the C programming language. The course also discusses memory hierarchies, performance measurement, exception control flow, and performance related issues.",
  "termClasses": [
    {
      "term": "202510",
      "section": "01",
      "type": "Lec",
      "days": ["M", "T", "W"],
      "time": {
        "start": "1305",
        "end": "1425"
      },
      "location": "Carleton COLLABORATIVE HEALTH EDUC BLDG C170",
      "crn": "10823"
    }
  ],
  "enrollement": {
    "enrolled": 193,
    "capacity": 200
  },
  "instructorsByTerm": {
    "202510": ["Kalyaniwalla N.", "Rathnayake D.", "Staff"]
  }
}
```

#### Error (404 Not Found)
Returns if the course code is not found.

## Filter Courses

Retrieves a filtered list of courses based on specified criteria.

### Endpoint

```
GET /api/filter
```

### Query Parameters

| Parameter | Type   | Description                           | Required |
|-----------|--------|---------------------------------------|----------|
| filter    | JSON   | Filter criteria for courses           | No       |
| orderBy   | JSON   | Sorting criteria for results          | No       |
| limit     | number | Maximum number of results (default: 100) | No    |

### Filter Properties

The filter parameter accepts a JSON object with course properties to filter by. Default filters will be applied if not specified.
#### Default Filter:
```json
{
  "terms": ["202510", "202520"],
  "courseLevels": ALL_COURSE_LEVELS,
  "subjectCodes": ALL_SUBJECT_CODES,
  "searchTerm": "",
  "creditHours": ALL_CREDIT_HOURS
}
```

### OrderBy Properties

The orderBy parameter accepts a JSON object specifying the sorting criteria. Default sorting will be applied if not specified.
#### Default OrderBy:
```json
{
  "key": "title",
  "direction": "asc",
}
```

### Response

#### Success (200 OK)
Returns a JSON array of courses matching the filter criteria.

Example:
```json
[
  {
    "courseCode": "2122",
    "subjectCode": "CSCI",
    "title": "Systems Programming",
    "creditHours": 3,
    "prerequisites": ["CSCI1110", "CSCI1120"]
  }
]
```

## Search Courses

Performs a fuzzy search across courses based on course code, subject code, and title.

### Endpoint

```
GET /api/search
```

### Query Parameters

| Parameter  | Type   | Description                              | Required |
|------------|--------|------------------------------------------|----------|
| searchTerm | string | The term to search for                   | Yes      |
| limit      | number | Maximum number of results to return      | No       |
| offset     | number | Number of results to skip (for pagination) | No     |

### Response

#### Success (200 OK)
Returns a JSON array of search results with relevance scores.

Example:
```json
[
  {
    "item": {
      "courseCode": "2122",
      "subjectCode": "CSCI",
      "title": "Systems Programming",
      "creditHours": 3,
      "prerequisites": ["CSCI1110", "CSCI1120"]
    },
    "score": 0.123
  }
]
```

#### Error (404 Not Found)
Returns if no search term is provided.

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Successful request
- 404: Resource not found
- 413: Payload too large

## Content Type

All responses are returned with the `Content-Type: application/json` header.