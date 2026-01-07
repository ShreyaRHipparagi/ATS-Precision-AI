import fitz  # PyMuPDF

class PDFService:
    @staticmethod
    def extract_text(pdf_path):
        """Extracts plain text from a PDF file."""
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
