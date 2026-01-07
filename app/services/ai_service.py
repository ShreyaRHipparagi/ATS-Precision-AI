import google.generativeai as genai
import json
import os

# Define the schema once to keep the service clean
RESUME_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "candidate_info": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "title": {"type": "string"},
                "career_persona": {"type": "string"},
                "readiness_score": {"type": "integer"}
            },
            "required": ["name", "title", "career_persona", "readiness_score"]
        },
        "ats_analysis": {
            "type": "object",
            "properties": {
                "overall_score": {"type": "integer"},
                "section_scores": {
                    "type": "object",
                    "properties": {
                        "quantification": {"type": "integer"},
                        "experience": {"type": "integer"},
                        "tech_stack": {"type": "integer"},
                        "education": {"type": "integer"}
                    },
                    "required": ["quantification", "experience", "tech_stack", "education"]
                },
                "breakdown": {
                    "type": "object",
                    "properties": {
                        "skill_match": {"type": "integer"},
                        "keyword_match": {"type": "integer"},
                        "experience_relevance": {"type": "integer"},
                        "formatting_quality": {"type": "integer"}
                    },
                    "required": ["skill_match", "keyword_match", "experience_relevance", "formatting_quality"]
                },
                "explanation": {
                    "type": "object",
                    "properties": {
                        "executive_summary": {"type": "string"},
                        "keyword_parity": {"type": "string"},
                        "quantification_review": {"type": "string"},
                        "structural_feedback": {"type": "string"}
                    },
                    "required": ["executive_summary", "keyword_parity", "quantification_review", "structural_feedback"]
                }
            },
            "required": ["overall_score", "section_scores", "breakdown", "explanation"]
        },
        "market_intel": {
            "type": "object",
            "properties": {
                "salary_range_usd": {"type": "string"},
                "salary_range_inr": {"type": "string"},
                "market_demand": {"type": "string", "enum": ["High", "Medium", "Low"]},
                "top_competencies": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["salary_range_usd", "salary_range_inr", "market_demand", "top_competencies"]
        },
        "advanced_insights": {
            "type": "object",
            "properties": {
                "technical_depth_scouter": {"type": "string"},
                "culture_fit_predictor": {"type": "string"},
                "faang_matchmaker": {"type": "string"},
                "skill_radar": {
                    "type": "object",
                    "properties": {
                        "Technical": {"type": "integer"},
                        "Leadership": {"type": "integer"},
                        "Communication": {"type": "integer"},
                        "Problem Solving": {"type": "integer"},
                        "Innovation": {"type": "integer"}
                    },
                    "required": ["Technical", "Leadership", "Communication", "Problem Solving", "Innovation"]
                },
                "skills_gap_chart": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "skill": {"type": "string"},
                            "required": {"type": "integer"},
                            "possessed": {"type": "integer"}
                        },
                        "required": ["skill", "required", "possessed"]
                    }
                }
            },
            "required": ["technical_depth_scouter", "culture_fit_predictor", "faang_matchmaker", "skill_radar", "skills_gap_chart"]
        },
        "recruiter_review": {
            "type": "object",
            "properties": {
                "decision": {"type": "string", "enum": ["Shortlisted", "Rejected", "Maybe"]},
                "honest_feedback": {"type": "string"},
                "critical_fail_points": {"type": "array", "items": {"type": "string"}},
                "key_strengths": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["decision", "honest_feedback", "critical_fail_points", "key_strengths"]
        },
        "resume_tailoring": {
            "type": "object",
            "properties": {
                "new_summary": {"type": "string"},
                "optimized_skills": {"type": "array", "items": {"type": "string"}},
                "enhanced_bullets": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "original": {"type": "string"},
                            "improved": {"type": "string"},
                            "impact": {"type": "string"}
                        },
                        "required": ["original", "improved", "impact"]
                    }
                },
                "linkedin_tips": {"type": "array", "items": {"type": "string"}},
                "cover_letter": {"type": "string"}
            },
            "required": ["new_summary", "optimized_skills", "enhanced_bullets", "linkedin_tips", "cover_letter"]
        },
        "skill_gap_analysis": {
            "type": "object",
            "properties": {
                "missing_technical_skills": {"type": "array", "items": {"type": "string"}},
                "missing_soft_skills": {"type": "array", "items": {"type": "string"}},
                "recommended_projects": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "tech_stack": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["title", "description", "tech_stack"]
                    }
                },
                "certifications": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["missing_technical_skills", "missing_soft_skills", "recommended_projects", "certifications"]
        },
        "interview_prep": {
            "type": "object",
            "properties": {
                "technical_questions": {"type": "array", "items": {"type": "string"}},
                "behavioral_questions": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["technical_questions", "behavioral_questions"]
        },
        "career_roadmap": {
            "type": "object",
            "properties": {
                "learning_plan_6_months": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "month": {"type": "integer"},
                            "focus": {"type": "string"}
                        },
                        "required": ["month", "focus"]
                    }
                },
                "final_advice": {"type": "string"}
            },
            "required": ["learning_plan_6_months", "final_advice"]
        }
    },
    "required": [
        "candidate_info", "ats_analysis", "market_intel", "advanced_insights", 
        "recruiter_review", "resume_tailoring", "skill_gap_analysis", 
        "interview_prep", "career_roadmap"
    ]
}

class AIService:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash-lite",
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": RESUME_ANALYSIS_SCHEMA,
                "temperature": 0.7,
            }
        )

    def analyze_resume(self, resume_content, job_description):
        prompt = f"""
        You are the 'Supreme AI Career Architect' - an ensemble of elite personas acting as one mind:
        1. THE CYNICAL SCANNER (ATS): A cold algorithm that calculates keyword density and formatting parsing.
        2. THE GOOGLE BAR RAISER: A Principal Engineer who demands 'zero tolerance' for fluff and enforces the X-Y-Z bullet point formula.
        3. THE VISIONARY MENTOR: A Silicon Valley growth-hacker focused on 'Adjacent Mastery'.

        INPUT DATA:
        - Candidate Resume: {resume_content}
        - Target Job Description (JD): {job_description}

        MISSION:
        Perform a ruthlessly detailed analysis of the candidate's fit for the role. 
        
        CRITICAL THINKING RULES:
        1. CONTEXTUAL SOVEREIGNTY: Do NOT recommend skills irrelevant to the specific JD.
        2. QUANTIFICATION OBSESSION: If the resume lacks numbers, the score must drop significantly.
        3. CONTENT DEPTH: 
           - 'honest_feedback' must be a brutal reality check (200+ words).
           - 'explanation' fields must collectively provide a granular breakdown: executive_summary (100+), keyword_parity (75+), quantification_review (75+), and structural_feedback (50+).
           - 'technical_depth_scouter', 'culture_fit_predictor', and 'faang_matchmaker' must be comprehensive, multi-paragraph deep dives (MINIMUM 150 words each).
        4. STRUCTURED FLOW: Use professional markdown (bullet points, numbered lists, sub-headers).
        5. NO BOLDING: Do NOT use bolding (**) in any part of the response text.
        6. COVER LETTER: Must follow strict High-Fidelity Business Format (Date, Salutation, 3-Paragraph Body, Sign-off).
        
        Generate the response filling the provided JSON schema.
        """
        try:
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
        except Exception as e:
            return {"error": f"AI Analysis Failed: {str(e)}"}
