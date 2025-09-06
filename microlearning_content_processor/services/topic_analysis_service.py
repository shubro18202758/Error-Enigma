import nltk
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from transformers import pipeline
from typing import List, Dict, Any, Tuple
import re
import logging
from collections import Counter
from models.data_models import Subtopic, TranscriptionResult

class TopicAnalysisService:
    """Service for analyzing content and identifying topics/subtopics"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.nlp = None
        self.summarizer = None
        self._setup_nlp()
    
    def _setup_nlp(self):
        """Setup NLP models and tools"""
        try:
            # Load spacy model
            self.nlp = spacy.load("en_core_web_sm")
            
            # Load summarization pipeline
            self.summarizer = pipeline("summarization", 
                                     model="facebook/bart-large-cnn",
                                     max_length=150, 
                                     min_length=30)
            
            # Download required NLTK data
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('wordnet', quiet=True)
            
            self.logger.info("NLP setup completed successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to setup NLP: {e}")
            # Fallback without advanced features
            self.nlp = None
            self.summarizer = None
    
    def extract_key_phrases(self, text: str, max_phrases: int = 20) -> List[str]:
        """
        Extract key phrases from text using NLP
        
        Args:
            text: Input text
            max_phrases: Maximum number of phrases to extract
            
        Returns:
            List of key phrases
        """
        if not self.nlp:
            return self._fallback_key_phrases(text, max_phrases)
        
        try:
            doc = self.nlp(text)
            
            # Extract noun phrases and named entities
            phrases = []
            
            # Noun phrases
            for chunk in doc.noun_chunks:
                if len(chunk.text.split()) <= 4 and len(chunk.text) > 3:
                    phrases.append(chunk.text.lower().strip())
            
            # Named entities
            for ent in doc.ents:
                if ent.label_ in ['PERSON', 'ORG', 'GPE', 'PRODUCT', 'EVENT']:
                    phrases.append(ent.text.lower().strip())
            
            # Remove duplicates and filter
            phrases = list(set(phrases))
            phrases = [p for p in phrases if len(p) > 3 and not p.isdigit()]
            
            # Sort by frequency in text (simple approach)
            phrase_counts = [(p, text.lower().count(p)) for p in phrases]
            phrase_counts.sort(key=lambda x: x[1], reverse=True)
            
            return [p[0] for p in phrase_counts[:max_phrases]]
            
        except Exception as e:
            self.logger.warning(f"Key phrase extraction failed: {e}")
            return self._fallback_key_phrases(text, max_phrases)
    
    def _fallback_key_phrases(self, text: str, max_phrases: int) -> List[str]:
        """Fallback key phrase extraction using simple methods"""
        # Simple approach: extract common multi-word terms
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Create bigrams and trigrams
        phrases = []
        for i in range(len(words) - 1):
            bigram = f"{words[i]} {words[i+1]}"
            phrases.append(bigram)
            
            if i < len(words) - 2:
                trigram = f"{words[i]} {words[i+1]} {words[i+2]}"
                phrases.append(trigram)
        
        # Count and return most common
        phrase_counts = Counter(phrases)
        return [phrase for phrase, count in phrase_counts.most_common(max_phrases)]
    
    def identify_subtopics(self, transcription: TranscriptionResult, 
                          min_duration: int = 30) -> List[Subtopic]:
        """
        Identify subtopics within the transcribed content
        
        Args:
            transcription: TranscriptionResult to analyze
            min_duration: Minimum duration for a subtopic in seconds
            
        Returns:
            List of identified subtopics
        """
        try:
            # Group segments into potential subtopics based on time gaps
            subtopic_groups = self._group_segments_by_topic(
                transcription.segments, min_duration
            )
            
            subtopics = []
            for i, group in enumerate(subtopic_groups):
                # Combine text from segments in group
                combined_text = " ".join([seg.text for seg in group])
                
                # Extract key phrases for this subtopic
                keywords = self.extract_key_phrases(combined_text, 10)
                
                # Generate subtopic name from keywords or summary
                name = self._generate_subtopic_name(combined_text, keywords)
                
                # Calculate importance score based on length and keyword density
                importance_score = self._calculate_importance_score(
                    combined_text, keywords, transcription.full_text
                )
                
                subtopic = Subtopic(
                    subtopic_id=f"subtopic_{i+1}",
                    name=name,
                    keywords=keywords[:5],  # Top 5 keywords
                    start_time=group[0].start_time,
                    end_time=group[-1].end_time,
                    importance_score=importance_score,
                    related_concepts=keywords[5:10]  # Additional related concepts
                )
                
                subtopics.append(subtopic)
            
            return subtopics
            
        except Exception as e:
            self.logger.error(f"Subtopic identification failed: {e}")
            return []
    
    def _group_segments_by_topic(self, segments: List, min_duration: int) -> List[List]:
        """Group segments into potential subtopic clusters"""
        if not segments:
            return []
        
        groups = []
        current_group = [segments[0]]
        
        for i in range(1, len(segments)):
            segment = segments[i]
            prev_segment = segments[i-1]
            
            # If there's a significant gap or the group is getting long, start new group
            time_gap = segment.start_time - prev_segment.end_time
            group_duration = current_group[-1].end_time - current_group[0].start_time
            
            if time_gap > 10 or group_duration > 300:  # 10s gap or 5min duration
                if self._get_group_duration(current_group) >= min_duration:
                    groups.append(current_group)
                current_group = [segment]
            else:
                current_group.append(segment)
        
        # Add final group
        if current_group and self._get_group_duration(current_group) >= min_duration:
            groups.append(current_group)
        
        return groups
    
    def _get_group_duration(self, group: List) -> float:
        """Calculate total duration of a segment group"""
        if not group:
            return 0
        return group[-1].end_time - group[0].start_time
    
    def _generate_subtopic_name(self, text: str, keywords: List[str]) -> str:
        """Generate a name for a subtopic based on content"""
        if not keywords:
            return "General Topic"
        
        # Use the most relevant keyword as base
        primary_keyword = keywords[0] if keywords else "topic"
        
        # Try to create a more descriptive name
        if self.summarizer and len(text) > 100:
            try:
                # Generate summary and extract key concept
                summary = self.summarizer(text[:1000])[0]['summary_text']
                # Use first few words of summary as name
                name_words = summary.split()[:4]
                return " ".join(name_words).title()
            except:
                pass
        
        # Fallback to keyword-based naming
        return primary_keyword.title().replace("_", " ")
    
    def _calculate_importance_score(self, text: str, keywords: List[str], 
                                  full_text: str) -> float:
        """Calculate importance score for a subtopic"""
        try:
            # Factors for importance:
            # 1. Length of content
            length_score = min(len(text) / 1000, 1.0)  # Normalize to 0-1
            
            # 2. Keyword density
            keyword_count = sum([text.lower().count(kw.lower()) for kw in keywords])
            keyword_score = min(keyword_count / 10, 1.0)
            
            # 3. Uniqueness (how much this content appears elsewhere)
            uniqueness_score = 1.0 - (full_text.lower().count(text.lower()[:100]) - 1) * 0.1
            uniqueness_score = max(uniqueness_score, 0.1)
            
            # Weighted average
            importance = (length_score * 0.3 + keyword_score * 0.4 + uniqueness_score * 0.3)
            return min(max(importance, 0.0), 1.0)
            
        except:
            return 0.5  # Default score
    
    def extract_main_topics(self, transcription: TranscriptionResult, 
                           max_topics: int = 5) -> List[str]:
        """Extract main topics from the entire transcription"""
        try:
            # Use TF-IDF to identify important terms
            vectorizer = TfidfVectorizer(
                max_features=50,
                stop_words='english',
                ngram_range=(1, 2)
            )
            
            # Split text into sentences for analysis
            sentences = re.split(r'[.!?]+', transcription.full_text)
            sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
            
            if len(sentences) < 2:
                return ["General Content"]
            
            # Fit TF-IDF
            tfidf_matrix = vectorizer.fit_transform(sentences)
            feature_names = vectorizer.get_feature_names_out()
            
            # Get top features
            tfidf_scores = tfidf_matrix.sum(axis=0).A1
            top_indices = tfidf_scores.argsort()[-max_topics:][::-1]
            
            main_topics = [feature_names[i].title() for i in top_indices]
            return main_topics
            
        except Exception as e:
            self.logger.warning(f"Main topic extraction failed: {e}")
            # Fallback to key phrase extraction
            return self.extract_key_phrases(transcription.full_text, max_topics)
