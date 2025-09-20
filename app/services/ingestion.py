import PyPDF2
import docx
from typing import Optional

class DocumentProcessor:
    async def extract_text(self, file_path: str, file_type: str) -> Optional[str]:
        """Extract text from different document types"""
        try:
            if file_type == 'application/pdf':
                return self._extract_from_pdf(file_path)
            elif file_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
                return self._extract_from_docx(file_path)
            elif file_type.startswith('text/'):
                return self._extract_from_text(file_path)
            else:
                return None
        except Exception:
            return None

    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF"""
        text = ""
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text

    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        doc = docx.Document(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])

    def _extract_from_text(self, file_path: str) -> str:
        """Extract text from text file"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()