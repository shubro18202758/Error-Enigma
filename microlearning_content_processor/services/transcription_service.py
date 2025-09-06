import whisper
import os
import tempfile
from typing import List, Tuple
from moviepy.editor import VideoFileClip
import logging
from models.data_models import TranscriptionResult, TimestampedSegment

class TranscriptionService:
    """Service for transcribing video/audio content using Whisper AI"""
    
    def __init__(self, model_size: str = "base"):
        """
        Initialize transcription service
        
        Args:
            model_size: Whisper model size (tiny, base, small, medium, large)
        """
        self.logger = logging.getLogger(__name__)
        self.model_size = model_size
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load Whisper model"""
        try:
            self.model = whisper.load_model(self.model_size)
            self.logger.info(f"Loaded Whisper model: {self.model_size}")
        except Exception as e:
            self.logger.error(f"Failed to load Whisper model: {e}")
            raise
    
    def extract_audio_from_video(self, video_path: str) -> str:
        """
        Extract audio from video file
        
        Args:
            video_path: Path to video file
            
        Returns:
            Path to extracted audio file
        """
        # If it's already an audio file, return as-is
        audio_extensions = ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac']
        if any(video_path.lower().endswith(ext) for ext in audio_extensions):
            self.logger.info(f"Input is already an audio file: {video_path}")
            return video_path
        
        # For video files, try to use ffmpeg with better detection
        video_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']
        if any(video_path.lower().endswith(ext) for ext in video_extensions):
            try:
                # Try to find and configure ffmpeg
                import subprocess
                import shutil
                
                # Try multiple ways to find ffmpeg
                ffmpeg_path = None
                
                # Method 1: Check if in PATH
                ffmpeg_path = shutil.which("ffmpeg")
                
                # Method 2: Try Windows 'where' command
                if not ffmpeg_path:
                    try:
                        result = subprocess.run(['where', 'ffmpeg'], capture_output=True, text=True, shell=True)
                        if result.returncode == 0 and result.stdout.strip():
                            ffmpeg_path = result.stdout.strip().split('\n')[0]
                    except:
                        pass
                
                # Method 3: Check common installation paths
                if not ffmpeg_path:
                    common_paths = [
                        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
                        r"C:\ffmpeg\bin\ffmpeg.exe", 
                        r"C:\tools\ffmpeg\bin\ffmpeg.exe",
                        r"C:\ProgramData\chocolatey\bin\ffmpeg.exe"
                    ]
                    for path in common_paths:
                        if os.path.exists(path):
                            ffmpeg_path = path
                            break
                
                if ffmpeg_path:
                    # Configure moviepy to use found ffmpeg
                    from moviepy.config import change_settings
                    change_settings({"FFMPEG_BINARY": ffmpeg_path})
                    self.logger.info(f"Found and configured ffmpeg: {ffmpeg_path}")
                    
                    # Extract audio
                    video_dir = os.path.dirname(os.path.abspath(video_path))
                    video_name = os.path.splitext(os.path.basename(video_path))[0]
                    temp_audio_path = os.path.join(video_dir, f"{video_name}_extracted_audio.wav")
                    
                    video = VideoFileClip(video_path)
                    audio = video.audio
                    audio.write_audiofile(temp_audio_path, verbose=False, logger=None)
                    
                    # Clean up
                    audio.close()
                    video.close()
                    
                    self.logger.info(f"Audio extracted to: {temp_audio_path}")
                    return temp_audio_path
                else:
                    raise Exception("FFmpeg not found in PATH or common installation directories")
                    
            except Exception as e:
                self.logger.error(f"Video processing failed: {e}")
                raise Exception(
                    f"Cannot process video file: {video_path}\n"
                    f"Error: {str(e)}\n"
                    f"Please ensure FFmpeg is properly installed and accessible."
                )
        
        # If we get here, it's an unknown format
        raise Exception(f"Unsupported file format: {video_path}")        
    
    def transcribe_audio(self, audio_path: str) -> TranscriptionResult:
        """
        Transcribe audio file to text
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            TranscriptionResult with full text and timestamped segments
        """
        try:
            import time
            start_time = time.time()
            
            # Transcribe with Whisper
            result = self.model.transcribe(
                audio_path,
                word_timestamps=True,
                verbose=False
            )
            
            processing_time = time.time() - start_time
            
            # Extract segments with timestamps
            segments = []
            for segment in result.get("segments", []):
                segments.append(TimestampedSegment(
                    start_time=segment["start"],
                    end_time=segment["end"],
                    text=segment["text"].strip(),
                    confidence=segment.get("avg_logprob", None)
                ))
            
            # Create transcription result
            transcription = TranscriptionResult(
                full_text=result["text"],
                segments=segments,
                language=result["language"],
                processing_time=processing_time,
                word_count=len(result["text"].split())
            )
            
            self.logger.info(f"Transcription completed in {processing_time:.2f}s")
            return transcription
            
        except Exception as e:
            self.logger.error(f"Transcription failed: {e}")
            raise
    
    def _fallback_transcription(self, audio_path: str) -> TranscriptionResult:
        """
        Fallback transcription when Whisper is not available
        This creates a dummy transcription for testing purposes
        """
        import time
        
        # Simulate processing time
        time.sleep(2)
        
        # Create dummy transcription based on filename
        filename = os.path.basename(audio_path)
        sample_text = f"""
        This is a sample transcription for {filename}. 
        In a real scenario, this would be the actual transcribed content from the audio file.
        The audio discusses various topics related to the course material.
        Key concepts include variables, functions, and programming fundamentals.
        Students will learn about data types, control structures, and best practices.
        The lecture covers practical examples and real-world applications.
        By the end of this module, learners should understand the core concepts.
        """
        
        # Create segments
        segments = []
        sentences = [s.strip() for s in sample_text.strip().split('.') if s.strip()]
        
        current_time = 0.0
        for i, sentence in enumerate(sentences):
            if sentence:
                segment_duration = len(sentence.split()) * 0.5  # ~0.5 seconds per word
                segments.append(TimestampedSegment(
                    start_time=current_time,
                    end_time=current_time + segment_duration,
                    text=sentence + ".",
                    confidence=0.85
                ))
                current_time += segment_duration + 1.0  # 1 second pause between segments
        
        return TranscriptionResult(
            full_text=sample_text.strip(),
            segments=segments,
            language="en",
            processing_time=2.0,
            word_count=len(sample_text.split())
        )
    
    def transcribe_video(self, video_path: str) -> TranscriptionResult:
        """
        Complete video transcription pipeline
        
        Args:
            video_path: Path to video file
            
        Returns:
            TranscriptionResult
        """
        audio_path = None
        try:
            # Extract audio
            audio_path = self.extract_audio_from_video(video_path)
            
            # Transcribe audio
            result = self.transcribe_audio(audio_path)
            
            return result
            
        finally:
            # Clean up extracted audio file (only if it was extracted, not original)
            if audio_path and os.path.exists(audio_path) and audio_path != video_path:
                # Only delete if it's an extracted audio file (contains "_extracted_audio")
                if "_extracted_audio" in audio_path:
                    try:
                        os.unlink(audio_path)
                        self.logger.info(f"Cleaned up extracted audio file: {audio_path}")
                    except Exception as e:
                        self.logger.warning(f"Failed to clean up audio file: {e}")
    
    def get_transcript_chunks(self, transcription: TranscriptionResult, 
                            chunk_duration: int = 60) -> List[TimestampedSegment]:
        """
        Split transcription into time-based chunks
        
        Args:
            transcription: TranscriptionResult to chunk
            chunk_duration: Duration of each chunk in seconds
            
        Returns:
            List of chunked segments
        """
        chunks = []
        current_chunk_text = []
        current_start = 0
        current_end = 0
        
        for segment in transcription.segments:
            if segment.start_time - current_start >= chunk_duration and current_chunk_text:
                # Create chunk
                chunks.append(TimestampedSegment(
                    start_time=current_start,
                    end_time=current_end,
                    text=" ".join(current_chunk_text)
                ))
                
                # Start new chunk
                current_chunk_text = [segment.text]
                current_start = segment.start_time
                current_end = segment.end_time
            else:
                current_chunk_text.append(segment.text)
                if not current_chunk_text or current_start == 0:
                    current_start = segment.start_time
                current_end = segment.end_time
        
        # Add final chunk
        if current_chunk_text:
            chunks.append(TimestampedSegment(
                start_time=current_start,
                end_time=current_end,
                text=" ".join(current_chunk_text)
            ))
        
        return chunks
