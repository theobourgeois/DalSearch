from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from collections import defaultdict
import re
from typing import List, Dict, Any

class CourseSearchEngine:
    def __init__(self, model_name: str = 'paraphrase-MiniLM-L12-v2'):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.course_sections = []
        self.days_map = {
            "M": "Monday", "T": "Tuesday", "W": "Wednesday",
            "R": "Thursday", "F": "Friday", "S": "Saturday"
        }
        self.reverse_days_map = {v.lower(): k for k, v in self.days_map.items()}
        self.year_map = {str(i): f"{num} year" for i, num in 
                        enumerate(["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"], 1)}
        self.reverse_year_map = {v.lower(): k for k, v in self.year_map.items()}
        
    def preprocess_course_data(self, course_data: Dict, subjects_data: List[Dict]) -> None:
        """Enhanced preprocessing with better text representation and metadata"""
        self.course_sections = []
        
        for course_code, course_info in course_data.items():
            title = course_info.get("title", "")
            description = course_info.get("description", "")
            year = course_code[4]
            subject_code = course_code[:4]
            
            subject_info = next((subject for subject in subjects_data if subject["code"] == subject_code), None)
            subject_desc = subject_info.get("description", "") if subject_info else ""
            subject_name = subject_info.get("name", "") if subject_info else ""
            
            for term_class in course_info.get("termClasses", []):
                day_codes = term_class.get("days", [])
                days = [self.days_map.get(day, "") for day in day_codes]
                time_info = term_class.get("time", {})
                time_str = (f"{time_info.get('start', '')}-{time_info.get('end', '')}" 
                           if time_info else "TBD")
                
                # Improved searchable text with better context and weights
                section_text = (
                    # Core course information (heavily weighted)
                    f"{title} {title} {title} " +
                    f"{course_code} {course_code} " +
                    f"{subject_code} {subject_name} {subject_name} " +
                    
                    # Year information with variations
                    f"{self.year_map.get(year, '')} year {year} level {year} " +
                    
                    # Subject context
                    f"{subject_desc} " +
                    
                    # Schedule information (include both codes and full names)
                    f"{' '.join(day_codes)} {' '.join(days)} {time_str} " +
                    
                    # Full description
                    f"{description}"
                )
                
                self.course_sections.append({
                    "text": section_text,
                    "metadata": {
                        "course_code": course_code,
                        "title": title,
                        "year": year,
                        "days": days,
                        "day_codes": day_codes,
                        "time": time_str,
                        "subject": subject_name,
                        "subject_code": subject_code,
                        "description": description,
                        "instructors": term_class.get("instructors", [])
                    }
                })
    
    def build_index(self) -> None:
        """Build FAISS index with normalized embeddings"""
        texts = [section["text"] for section in self.course_sections]
        embeddings = self.model.encode(texts)
        faiss.normalize_L2(embeddings)
        
        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(embeddings.astype('float32'))

    def parse_constraints(self, query: str) -> Dict[str, Any]:
        """Extract search constraints from query"""
        constraints = {
            "year": None,
            "day": None,
            "subject": None
        }
        
        query_lower = query.lower()
        
        # Extract year constraints
        for year_name, year_num in self.reverse_year_map.items():
            if year_name in query_lower:
                constraints["year"] = year_num
                query = re.sub(r'\b' + re.escape(year_name) + r'\b', '', query, flags=re.IGNORECASE)
        
        # Extract day constraints (more flexible matching)
        for day_name, day_code in self.reverse_days_map.items():
            if day_name in query_lower or (day_name[:-1] in query_lower):  # Match "tuesday" or "tues"
                constraints["day"] = day_code
                query = re.sub(r'\b' + re.escape(day_name) + r'\b', '', query, flags=re.IGNORECASE)
                query = re.sub(r'\b' + re.escape(day_name[:-1]) + r'\b', '', query, flags=re.IGNORECASE)
        
        # Extract subject constraints
        subject_keywords = {
            "comp sci": "CSCI",
            "computer science": "CSCI",
            "math": "MATH",
            "statistics": "STAT",
            "gender studies": "GWST",
            "gwst": "GWST"
        }
        
        for keyword, code in subject_keywords.items():
            if keyword.lower() in query_lower:
                constraints["subject"] = code
                query = re.sub(r'\b' + re.escape(keyword) + r'\b', '', query, flags=re.IGNORECASE)
        
        return constraints, query.strip()

    def enhance_query(self, query: str) -> str:
        """Enhanced query expansion with better context understanding"""
        enhanced_terms = []
        
        term_expansions = {
            "programming": ["coding", "development", "software engineering"],
            "math": ["mathematics", "calculus", "algebra"],
            "stats": ["statistics", "probability", "data analysis"],
            "ai": ["artificial intelligence", "machine learning"],
            "systems": ["operating systems", "computer systems", "architecture"],
            "gender": ["gender studies", "gwst", "women studies"],
        }
        
        query_terms = query.lower().split()
        for term in query_terms:
            enhanced_terms.append(term)
            for key, expansions in term_expansions.items():
                if term == key:
                    enhanced_terms.extend(expansions)
        
        return " ".join(enhanced_terms)

    def filter_results(self, results: List[Dict], constraints: Dict) -> List[Dict]:
        """Filter results based on extracted constraints"""
        filtered_results = []
        
        for result in results:
            metadata = result["metadata"]
            matches_constraints = True
            
            print(f"Checking year: {metadata['year']} == {constraints['year']}")
            # Year filtering
            if constraints["year"] and metadata["year"] != constraints["year"]:
                matches_constraints = False
            
            # Day filtering - check against day_codes
            if constraints["day"] and matches_constraints:
                if constraints["day"] not in metadata["day_codes"]:
                    matches_constraints = False
            
            # Subject filtering
            if constraints["subject"] and matches_constraints:
                if metadata["subject_code"] != constraints["subject"]:
                    matches_constraints = False
            
            if matches_constraints:
                filtered_results.append(result)
        
        return filtered_results

    def search(self, query: str, top_k: int = 100) -> List[Dict[str, Any]]:
        """Improved search with constraint filtering and better scoring"""
        # Extract constraints and clean query
        constraints, clean_query = self.parse_constraints(query)
        
        # Enhance remaining query terms
        enhanced_query = self.enhance_query(clean_query)
        
        # Perform semantic search
        query_embedding = self.model.encode([enhanced_query])
        faiss.normalize_L2(query_embedding)
        distances, indices = self.index.search(query_embedding.astype('float32'), top_k)
        
        # Process results with constraints
        results = []
        for i, idx in enumerate(indices[0]):
            score = float(distances[0][i])
            section = self.course_sections[idx]
            
            # Apply exact matching boost
            query_terms = clean_query.lower().split()
            text_lower = section["text"].lower()
            exact_matches = sum(1 for term in query_terms if term in text_lower)
            
            # Additional boost for subject matches
            if constraints["subject"] and section["metadata"]["subject_code"] == constraints["subject"]:
                score *= 1.2
            
            # Calculate final score
            final_score = score + (exact_matches * 0.15)
            
            results.append({
                "score": final_score,
                "metadata": section["metadata"]
            })
        
        print(f"Query: {query}, Enhanced: {enhanced_query}, Constraints: {constraints}")
        # Filter results based on constraints
        filtered_results = self.filter_results(results, constraints)
        
        # If no results after filtering, try relaxing constraints
        if not filtered_results and constraints["day"]:
            # Try searching without day constraint
            temp_constraints = constraints.copy()
            temp_constraints["day"] = None
            filtered_results = self.filter_results(results, temp_constraints)
        
        # Sort by score and return top results
        filtered_results.sort(key=lambda x: x["score"], reverse=True)
        print(f"Results: {filtered_results}")
        return filtered_results[:3]

app = Flask(__name__)
CORS(app)

# Initialize search engine
search_engine = CourseSearchEngine()

@app.route('/query', methods=['POST'])
def handle_query():
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({"error": "Invalid query"}), 400
            
        results = search_engine.search(data['query'])
        
        # Format results for response
        formatted_results = []
        for result in results:
            metadata = result["metadata"]
            formatted_results.append(
                f"{metadata['course_code']} - {metadata['title']}\n"
                f"Year: {metadata['year']}, Days: {', '.join(metadata['days'])}\n"
                f"Time: {metadata['time']}\n"
                f"Description: {metadata['description']}"
            )
            
        return jsonify({"relevant_sections": formatted_results})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Load data and initialize search engine
    json_path = os.path.join(os.path.dirname(__file__), "../../../../database/search.json")
    subjects_path = os.path.join(os.path.dirname(__file__), "../../../../database/subjects.json")
    
    with open(json_path, "r", encoding="utf-8") as f:
        course_data = json.load(f)
    with open(subjects_path, "r", encoding="utf-8") as f:
        subjects_data = json.load(f)
        
    search_engine.preprocess_course_data(course_data, subjects_data)
    search_engine.build_index()
    app.run(host='0.0.0.0', port=5003)