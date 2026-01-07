from flask import Blueprint, render_template, request, current_app
import os
from .services.pdf_service import PDFService
from .services.ai_service import AIService

main = Blueprint('main', __name__)

@main.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        resume_file = request.files.get('resume')
        job_description = request.form.get('job_description')
        
        if resume_file and resume_file.filename.endswith('.pdf'):
            # Save file using absolute path from config
            filename = resume_file.filename
            pdf_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            resume_file.save(pdf_path)
            
            # Analyze
            resume_text = PDFService.extract_text(pdf_path)
            ai_service = AIService(current_app.config['GOOGLE_API_KEY'])
            result = ai_service.analyze_resume(resume_text, job_description)
            
            return render_template('index.html', result=result, job_description=job_description)
            
    return render_template('index.html', result=None, job_description="")
