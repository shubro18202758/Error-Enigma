"""
RAG Engine - Retrieval-Augmented Generation for Educational Content
Provides intelligent content search and contextual AI responses
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
import os
import json
from datetime import datetime
import numpy as np

# Vector database and embeddings
try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    chromadb = None

# LLM integrations
try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    import openai
except ImportError:
    openai = None

from app.core.config import settings
from app.core.logger import ai_logger

logger = logging.getLogger(__name__)


class RAGEngine:
    """
    Retrieval-Augmented Generation Engine for educational content
    Combines semantic search with LLM generation for intelligent responses
    """
    
    def __init__(self):
        self.is_initialized = False
        self.vector_db = None
        self.collection = None
        self.embeddings_model = None
        self.llm_client = None
        
        # Content indexing
        self.indexed_content = {}
        self.content_metadata = {}
        
        logger.info("🔍 RAG Engine initialized")
    
    async def initialize(self):
        """Initialize RAG engine components"""
        try:
            logger.info("🚀 Initializing RAG Engine...")
            
            # Initialize vector database
            await self._init_vector_db()
            
            # Initialize LLM client
            await self._init_llm_client()
            
            # Load and index content
            await self._load_content_library()
            
            self.is_initialized = True
            logger.info("✅ RAG Engine fully initialized")
            
        except Exception as e:
            logger.error(f"❌ RAG Engine initialization failed: {e}")
            raise
    
    async def _init_vector_db(self):
        """Initialize ChromaDB for vector storage"""
        try:
            if chromadb is None:
                logger.warning("ChromaDB not available, using in-memory fallback")
                self.vector_db = {}
                return
            
            # Create ChromaDB client
            self.vector_db = chromadb.Client(Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory=settings.VECTOR_DB_PATH
            ))
            
            # Get or create collection for educational content
            try:
                self.collection = self.vector_db.get_collection(
                    name="educational_content"
                )
                logger.info("📚 Loaded existing content collection")
            except:
                self.collection = self.vector_db.create_collection(
                    name="educational_content",
                    metadata={"description": "Educational content for RAG"}
                )
                logger.info("📚 Created new content collection")
            
        except Exception as e:
            logger.error(f"Vector DB initialization error: {e}")
            # Fallback to simple dictionary
            self.vector_db = {}
            self.collection = None
    
    async def _init_llm_client(self):
        """Initialize LLM client (Google Gemini or OpenAI)"""
        try:
            # Try Google Gemini first
            if settings.GOOGLE_API_KEY and genai:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self.llm_client = genai.GenerativeModel('gemini-pro')
                logger.info("🤖 Google Gemini initialized")
                return
            
            # Fallback to OpenAI
            if settings.OPENAI_API_KEY and openai:
                openai.api_key = settings.OPENAI_API_KEY
                self.llm_client = openai
                logger.info("🤖 OpenAI initialized")
                return
            
            logger.warning("No LLM client available - responses will be template-based")
            self.llm_client = None
            
        except Exception as e:
            logger.error(f"LLM client initialization error: {e}")
            self.llm_client = None
    
    async def _load_content_library(self):
        """Load and index educational content"""
        try:
            content_path = settings.CONTENT_STORAGE_PATH
            
            if not os.path.exists(content_path):
                os.makedirs(content_path, exist_ok=True)
                logger.info(f"Created content directory: {content_path}")
            
            # Load content files
            content_count = 0
            for root, dirs, files in os.walk(content_path):
                for file in files:
                    if file.endswith(('.txt', '.md', '.json')):
                        file_path = os.path.join(root, file)
                        await self._index_content_file(file_path)
                        content_count += 1
            
            logger.info(f"📚 Indexed {content_count} content files")
            
            # If no content found, create sample content
            if content_count == 0:
                await self._create_sample_content()
            
        except Exception as e:
            logger.error(f"Content loading error: {e}")
    
    async def _index_content_file(self, file_path: str):
        """Index a single content file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract metadata from filename and content
            filename = os.path.basename(file_path)
            content_id = f"content_{hash(file_path) % 1000000}"
            
            # Simple chunking (split by paragraphs)
            chunks = self._chunk_content(content)
            
            # Store content metadata
            self.content_metadata[content_id] = {
                "title": filename.replace('.txt', '').replace('.md', ''),
                "file_path": file_path,
                "chunks_count": len(chunks),
                "indexed_at": datetime.utcnow().isoformat()
            }
            
            # Index chunks in vector database
            for i, chunk in enumerate(chunks):
                chunk_id = f"{content_id}_chunk_{i}"
                await self._add_to_vector_db(chunk_id, chunk, {
                    "content_id": content_id,
                    "chunk_index": i,
                    "file_path": file_path
                })
            
        except Exception as e:
            logger.error(f"Content indexing error for {file_path}: {e}")
    
    def _chunk_content(self, content: str, chunk_size: int = None) -> List[str]:
        """Split content into chunks for indexing"""
        chunk_size = chunk_size or settings.CHUNK_SIZE
        
        # Simple paragraph-based chunking
        paragraphs = content.split('\n\n')
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            if len(current_chunk) + len(paragraph) < chunk_size:
                current_chunk += paragraph + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = paragraph + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    async def _add_to_vector_db(self, chunk_id: str, content: str, metadata: Dict[str, Any]):
        """Add content chunk to vector database"""
        try:
            if self.collection is not None:
                # Use ChromaDB
                self.collection.add(
                    documents=[content],
                    metadatas=[metadata],
                    ids=[chunk_id]
                )
            else:
                # Use simple dictionary fallback
                if not hasattr(self, 'simple_db'):
                    self.simple_db = {}
                self.simple_db[chunk_id] = {
                    "content": content,
                    "metadata": metadata
                }
            
        except Exception as e:
            logger.error(f"Vector DB addition error: {e}")
    
    async def search_content(self, query: str, user_id: str, context: Dict[str, Any] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant content using semantic similarity"""
        try:
            context = context or {}
            
            if self.collection is not None:
                # Use ChromaDB semantic search
                results = self.collection.query(
                    query_texts=[query],
                    n_results=limit
                )
                
                search_results = []
                for i in range(len(results['ids'][0])):
                    result = {
                        "content_id": results['ids'][0][i],
                        "content": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i],
                        "similarity_score": 1.0 - (results['distances'][0][i] if results['distances'] else 0.5)
                    }
                    search_results.append(result)
                
                return search_results
            
            else:
                # Simple text search fallback
                return await self._simple_text_search(query, limit)
            
        except Exception as e:
            logger.error(f"Content search error: {e}")
            return []
    
    async def _simple_text_search(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Simple text-based search fallback"""
        try:
            if not hasattr(self, 'simple_db'):
                return []
            
            query_words = query.lower().split()
            results = []
            
            for chunk_id, chunk_data in self.simple_db.items():
                content = chunk_data["content"].lower()
                score = sum(1 for word in query_words if word in content)
                
                if score > 0:
                    results.append({
                        "content_id": chunk_id,
                        "content": chunk_data["content"],
                        "metadata": chunk_data["metadata"],
                        "similarity_score": score / len(query_words)
                    })
            
            # Sort by score and return top results
            results.sort(key=lambda x: x["similarity_score"], reverse=True)
            return results[:limit]
            
        except Exception as e:
            logger.error(f"Simple search error: {e}")
            return []
    
    async def generate_response(self, query: str, context_docs: List[str], user_context: Dict[str, Any] = None) -> str:
        """Generate AI response using retrieved documents"""
        try:
            user_context = user_context or {}
            
            # Prepare context for LLM
            context_text = "\n\n".join(context_docs[:3])  # Limit context length
            
            # Create prompt
            prompt = self._create_educational_prompt(query, context_text, user_context)
            
            if self.llm_client and hasattr(self.llm_client, 'generate_content'):
                # Google Gemini
                response = await self._generate_with_gemini(prompt)
            elif self.llm_client and hasattr(self.llm_client, 'Completion'):
                # OpenAI
                response = await self._generate_with_openai(prompt)
            else:
                # Template-based fallback
                response = self._generate_template_response(query, context_docs)
            
            return response
            
        except Exception as e:
            logger.error(f"Response generation error: {e}")
            return "I'm sorry, I encountered an error while generating a response."
    
    def _create_educational_prompt(self, query: str, context: str, user_context: Dict[str, Any]) -> str:
        """Create an educational prompt for the LLM"""
        learning_style = user_context.get("learning_style", "balanced")
        difficulty = user_context.get("difficulty_preference", "intermediate")
        
        prompt = f"""
You are an expert educational AI tutor. Answer the student's question using the provided context.

Context Information:
{context}

Student Question: {query}

Learning Preferences:
- Learning Style: {learning_style}
- Difficulty Level: {difficulty}

Please provide a comprehensive, educational response that:
1. Directly answers the question
2. Explains concepts clearly for {difficulty} level
3. Uses examples and analogies appropriate for {learning_style} learners
4. Suggests follow-up learning activities
5. Maintains an encouraging and supportive tone

Response:
"""
        return prompt
    
    async def _generate_with_gemini(self, prompt: str) -> str:
        """Generate response using Google Gemini"""
        try:
            response = self.llm_client.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            return "I'm experiencing technical difficulties. Please try again."
    
    async def _generate_with_openai(self, prompt: str) -> str:
        """Generate response using OpenAI"""
        try:
            response = await openai.Completion.acreate(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=500,
                temperature=0.7
            )
            return response.choices[0].text.strip()
        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            return "I'm experiencing technical difficulties. Please try again."
    
    def _generate_template_response(self, query: str, context_docs: List[str]) -> str:
        """Generate template-based response when LLM is not available"""
        if not context_docs:
            return f"I found your question about '{query}' interesting. While I don't have specific information available right now, I recommend exploring our course library for related content."
        
        return f"""
Based on the available content, here's what I can tell you about '{query}':

{context_docs[0][:300]}...

This is a foundational concept that connects to broader learning objectives. I recommend:
1. Reviewing the full content for deeper understanding
2. Practicing with related exercises
3. Connecting this to your current learning goals

Would you like me to find more specific resources or help you create a study plan around this topic?
"""
    
    async def find_related_resources(self, query: str, user_id: str) -> List[Dict[str, Any]]:
        """Find additional learning resources related to the query"""
        try:
            # Search for related content
            results = await self.search_content(query, user_id, limit=10)
            
            # Group by content source
            resources = []
            seen_content = set()
            
            for result in results:
                content_id = result["metadata"].get("content_id")
                if content_id not in seen_content:
                    seen_content.add(content_id)
                    
                    # Get content metadata
                    metadata = self.content_metadata.get(content_id, {})
                    
                    resources.append({
                        "title": metadata.get("title", "Unknown Content"),
                        "type": "educational_content",
                        "relevance_score": result["similarity_score"],
                        "content_preview": result["content"][:200] + "...",
                        "estimated_duration": "10-15 minutes"
                    })
            
            return resources[:5]  # Return top 5 resources
            
        except Exception as e:
            logger.error(f"Resource finding error: {e}")
            return []
    
    async def _create_sample_content(self):
        """Create sample educational content for testing"""
        try:
            sample_contents = [
                {
                    "title": "Introduction to Machine Learning",
                    "content": """
Machine Learning is a subset of artificial intelligence that enables computers to learn and make decisions without explicit programming. 

Key Concepts:
- Supervised Learning: Learning from labeled examples
- Unsupervised Learning: Finding patterns in unlabeled data  
- Reinforcement Learning: Learning through interaction and feedback

Applications:
Machine learning powers recommendation systems, image recognition, natural language processing, and predictive analytics across industries.

Getting Started:
1. Learn basic statistics and linear algebra
2. Practice with Python and libraries like scikit-learn
3. Work on small projects with real datasets
4. Understand different algorithm types and when to use them
"""
                },
                {
                    "title": "Python Programming Fundamentals",
                    "content": """
Python is a versatile, beginner-friendly programming language widely used in data science, web development, and automation.

Core Concepts:
- Variables and Data Types: Store and manipulate different kinds of information
- Control Structures: if/else statements, loops for program flow
- Functions: Reusable blocks of code that perform specific tasks
- Data Structures: Lists, dictionaries, and sets for organizing data

Best Practices:
- Write readable code with meaningful variable names
- Use comments to explain complex logic
- Follow PEP 8 style guidelines
- Test your code regularly

Learning Path:
1. Master basic syntax and data types
2. Practice with control structures and functions
3. Learn about modules and packages
4. Build small projects to apply your knowledge
"""
                },
                {
                    "title": "Study Techniques and Learning Science",
                    "content": """
Effective learning requires understanding how the brain processes and retains information.

Evidence-Based Techniques:
- Spaced Repetition: Review material at increasing intervals
- Active Recall: Test yourself instead of just re-reading
- Interleaving: Mix different topics in study sessions
- Elaborative Interrogation: Ask "why" and "how" questions

Memory and Retention:
The forgetting curve shows we lose information rapidly without review. Combat this with:
- Regular review sessions
- Connecting new information to existing knowledge
- Using multiple senses in learning
- Taking breaks to consolidate memory

Metacognition:
Monitor your own learning by:
- Assessing your understanding honestly
- Identifying knowledge gaps
- Adjusting study strategies based on results
- Setting specific, measurable learning goals
"""
                }
            ]
            
            content_dir = settings.CONTENT_STORAGE_PATH
            os.makedirs(content_dir, exist_ok=True)
            
            for i, content_data in enumerate(sample_contents):
                file_path = os.path.join(content_dir, f"{content_data['title'].replace(' ', '_').lower()}.txt")
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content_data['content'])
                
                await self._index_content_file(file_path)
            
            logger.info("📚 Created and indexed sample educational content")
            
        except Exception as e:
            logger.error(f"Sample content creation error: {e}")
    
    def is_healthy(self) -> bool:
        """Check if RAG engine is healthy"""
        return self.is_initialized
    
    async def cleanup(self):
        """Cleanup RAG engine resources"""
        try:
            if self.vector_db and hasattr(self.vector_db, 'persist'):
                self.vector_db.persist()
            
            logger.info("✅ RAG Engine cleanup complete")
        except Exception as e:
            logger.error(f"RAG cleanup error: {e}")
