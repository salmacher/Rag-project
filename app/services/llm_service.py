import os
from typing import Dict, List, Optional
import openai
from openai import AsyncOpenAI

class LLMService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.client = AsyncOpenAI(api_key=self.openai_api_key if self.openai_api_key else "dummy-key")
        self.chat_model = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
        self.max_tokens = int(os.getenv("LLM_MAX_TOKENS", "1000"))
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.1"))
        self.use_mock = not (self.openai_api_key and self.openai_api_key.startswith("sk-"))

    def _generate_mock_response(self, query: str, context: str) -> Dict:
        mock_responses = [
            f"According to the documents, {query} is addressed in the context of emerging technologies. [Document.pdf]",
            f"The documents indicate that {query} refers to the company's innovative practices. [Report_2024.pdf]",
            f"I didn't find specific information about {query} in the provided documents.",
            f"The document context shows that {query} is a central topic for the company strategy. [Strategic_note.pdf]"
        ]
        
        return {
            "answer": mock_responses[len(query) % len(mock_responses)],
            "sources": ["Document.pdf", "Report_2024.pdf"],
            "success": True,
            "is_mock": True
        }

    async def generate_answer(
        self, 
        query: str, 
        context: str, 
        response_style: str = "concise"
    ) -> Dict:
        try:
            if not query.strip():
                return {
                    "answer": "Please ask a specific question.",
                    "sources": [],
                    "success": False,
                    "error": "Empty question"
                }
            
            if self.use_mock:
                return self._generate_mock_response(query, context)

            style_instruction = self._get_style_instruction(response_style)
            
            system_prompt = f"""# ROLE
You are an expert document analysis assistant. You answer exclusively based on the documents provided by the user.

# INSTRUCTIONS
1. Use ONLY the provided document context to answer
2. Be precise and factual
3. Cite your sources with the format [Filename] for each information
4. {style_instruction}
5. If the information is not in the context, say so clearly
6. Never invent information

# RESPONSE FORMAT
- Structured and clear response
- Precise citations for each claim
- Professional and informative tone"""

            user_message = f"""## QUESTION TO ANSWER:
{query}

## DOCUMENT CONTEXT:
{context}

## TASK:
Answer the question relying exclusively on the document context above.
Precisely cite your sources with the format [Filename] for each information."""

            response = await self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                timeout=30.0
            )

            answer = response.choices[0].message.content.strip()
            
            sources = self._extract_sources(answer)
            
            return {
                "answer": answer,
                "sources": sources,
                "success": True,
                "is_mock": False,
                "model": self.chat_model
            }

        except Exception as e:
            return {
                "answer": f"I couldn't generate a response for the question '{query}'. Please try again.",
                "sources": [],
                "success": False,
                "error": str(e)
            }

    def _get_style_instruction(self, style: str) -> str:
        styles = {
            "concise": "Be concise and to the point. Answer in 2-3 sentences maximum.",
            "detailed": "Be detailed and exhaustive. Provide a complete answer with explanations.",
            "technical": "Use technical and precise language. Include specific details.",
            "simple": "Use simple language accessible to everyone. Avoid technical jargon.",
            "professional": "Maintain a professional and formal tone. Structure your answer clearly."
        }
        return styles.get(style, styles["concise"])

    def _extract_sources(self, answer: str) -> List[str]:
        import re
        sources = re.findall(r'\[([^\]]+)\]', answer)
        return [source for source in sources if len(source) > 3 and ('.' in source or len(source) > 8)]

    async def generate_summary(
        self, 
        contexts: List[Dict], 
        focus: str = "key_points"
    ) -> Dict:
        try:
            if not contexts:
                return {
                    "summary": "No documents to summarize.",
                    "success": False
                }

            context_text = "## DOCUMENTS TO SUMMARIZE:\n\n"
            for i, context in enumerate(contexts, 1):
                context_text += f"### Document {i}: {context.get('title', 'Untitled')}\n"
                context_text += f"{context.get('text', '')}\n\n"
                context_text += "---\n\n"

            focus_instructions = {
                "key_points": "Extract key points and main ideas.",
                "technical": "Focus on technical aspects and specifications.",
                "business": "Focus on business and strategic aspects.",
                "comprehensive": "Provide a complete and detailed summary."
            }

            system_prompt = f"""# ROLE
You are a document synthesis expert.

# INSTRUCTIONS
{focus_instructions.get(focus, focus_instructions['key_points'])}
Be concise but informative.
Organize your response in a structured way."""

            if self.use_mock:
                return {
                    "summary": "Mock summary: The documents cover various technical and strategic topics with relevant information for the company.",
                    "success": True,
                    "is_mock": True
                }

            response = await self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": context_text}
                ],
                max_tokens=800,
                temperature=0.3
            )

            summary = response.choices[0].message.content.strip()
            
            return {
                "summary": summary,
                "success": True,
                "is_mock": False
            }

        except Exception as e:
            return {
                "summary": f"Error generating summary: {str(e)}",
                "success": False
            }


llm_service = LLMService()