from flask import Blueprint, render_template, request, current_app
import os
from .services.pdf_service import PDFService
from .services.ai_service import AIService

main = Blueprint('main', __name__)

@main.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        try:
            resume_file = request.files.get('resume')
            job_description = request.form.get('job_description')
            user_api_key = request.form.get('api_key')
            existing_filename = request.form.get('existing_filename')
            
            pdf_path = None
            filename = None

            # Handle new upload
            if resume_file and resume_file.filename and resume_file.filename.endswith('.pdf'):
                filename = resume_file.filename
                pdf_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                resume_file.save(pdf_path)
            # Handle retry with existing file
            elif existing_filename:
                filename = existing_filename
                pdf_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                if not os.path.exists(pdf_path):
                     return render_template('index.html', result={"error": "File not found. Please upload again."}, job_description=job_description)
            
            if pdf_path:
                # Analyze
                resume_text = PDFService.extract_text(pdf_path)
                ai_service = AIService(current_app.config['GOOGLE_API_KEY'])
                
                # Use user api key if provided, otherwise default
                result = ai_service.analyze_resume(resume_text, job_description, api_key=user_api_key)
                
                # If resource exhausted, pass back the filename so we can retry
                if result.get('error') == 'RESOURCE_EXHAUSTED':
                    return render_template('index.html', result=result, job_description=job_description, existing_filename=filename)
                
                return render_template('index.html', result=result, job_description=job_description)
            else:
                 return render_template('index.html', result={"error": "Please upload a PDF resume."}, job_description=job_description)

        except Exception as e:
            import sys
            import traceback
            print(f"SYSTEM BREACH: Internal Error: {str(e)}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return render_template('index.html', result={"error": f"Internal System Error: {str(e)}"}, job_description=job_description if job_description else "")
            
    return render_template('index.html', result=None, job_description="")
