"""
Content Library Processor
Process MP4 files in content library using the microlearning content processor
Automatically stores results in the same folder as the source MP4 file
"""

import os
import sys
import json
from pathlib import Path
import subprocess

# Add the microlearning processor to the path
sys.path.append(str(Path(__file__).parent.parent / "microlearning_content_processor"))

try:
    from processor import MicrolearningProcessor
except ImportError:
    print("❌ Could not import MicrolearningProcessor. Make sure the microlearning_content_processor is available.")
    sys.exit(1)

class ContentLibraryProcessor:
    """Process MP4 files in content library structure"""
    
    def __init__(self):
        self.processor = MicrolearningProcessor(whisper_model="base")
        self.content_library_path = Path(__file__).parent.parent / "content_library"
    
    def find_mp4_files(self):
        """Find all MP4 files in content library"""
        mp4_files = []
        for mp4_file in self.content_library_path.rglob("*.mp4"):
            mp4_files.append(mp4_file)
        return mp4_files
    
    def extract_lesson_info_from_path(self, mp4_path: Path):
        """Extract course, module, and lesson info from file path"""
        try:
            # Path structure: content_library/course_name/Module_XX_name/Lesson_XX_name/lesson_video.mp4
            parts = mp4_path.parts
            
            # Find course name (should be the directory under content_library)
            content_lib_index = -1
            for i, part in enumerate(parts):
                if part == "content_library":
                    content_lib_index = i
                    break
            
            if content_lib_index == -1 or content_lib_index + 3 >= len(parts):
                return None, None, None, None
            
            course_name = parts[content_lib_index + 1]
            module_name = parts[content_lib_index + 2]
            lesson_name = parts[content_lib_index + 3]
            
            # Clean up names
            course_display = course_name.replace("_", " ").title()
            module_display = module_name.replace("Module_", "").replace("_", " ").title()
            lesson_display = lesson_name.replace("Lesson_", "").replace("_", " ").title()
            
            # Try to get instructor from course metadata
            instructor = self.get_instructor_from_metadata(mp4_path.parents[3])
            
            return course_display, module_display, lesson_display, instructor
            
        except Exception as e:
            print(f"❌ Error extracting info from path: {e}")
            return None, None, None, None
    
    def get_instructor_from_metadata(self, course_path: Path):
        """Get instructor name from course metadata"""
        try:
            metadata_file = course_path / "course_metadata.json"
            if metadata_file.exists():
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                return metadata.get("instructor", "AI Generated Content")
        except:
            pass
        return "AI Generated Content"
    
    def process_mp4_file(self, mp4_path: Path):
        """Process a single MP4 file and store results in same folder"""
        
        print(f"\n🎬 Processing: {mp4_path.name}")
        print(f"📁 Location: {mp4_path.parent}")
        
        # Extract lesson information
        course_name, module_name, lesson_name, instructor = self.extract_lesson_info_from_path(mp4_path)
        
        if not all([course_name, module_name, lesson_name]):
            print("❌ Could not extract lesson information from path structure")
            return False
        
        print(f"📚 Course: {course_name}")
        print(f"📖 Module: {module_name}")
        print(f"📝 Lesson: {lesson_name}")
        print(f"👨‍🏫 Instructor: {instructor}")
        
        try:
            # Process the video
            result = self.processor.process_video(
                video_path=str(mp4_path),
                course_name=course_name,
                module_name=module_name,
                instructor=instructor
            )
            
            # Save results in the same folder as the MP4
            output_folder = mp4_path.parent
            
            # Create processed content filename
            processed_filename = f"processed_{result.content_id}.json"
            output_path = output_folder / processed_filename
            
            # Export the results
            from utils.helpers import export_to_json
            success = export_to_json(result.dict(), str(output_path))
            
            if success:
                print(f"✅ Processing complete!")
                print(f"📄 Results saved: {processed_filename}")
                print(f"🆔 Content ID: {result.content_id}")
                print(f"⏱️  Processing time: {getattr(result, 'processing_time', 'N/A')} seconds")
                print(f"📊 Words transcribed: {result.transcription.word_count}")
                print(f"🏷️  Subtopics found: {len(result.subtopics)}")
                return True
            else:
                print("❌ Failed to save results")
                return False
                
        except Exception as e:
            print(f"❌ Processing failed: {e}")
            return False
    
    def process_all_mp4_files(self):
        """Process all MP4 files in content library"""
        mp4_files = self.find_mp4_files()
        
        if not mp4_files:
            print("❌ No MP4 files found in content library")
            return
        
        print(f"🔍 Found {len(mp4_files)} MP4 files in content library")
        
        processed = 0
        failed = 0
        
        for mp4_file in mp4_files:
            success = self.process_mp4_file(mp4_file)
            if success:
                processed += 1
            else:
                failed += 1
        
        print(f"\n📊 Processing Summary:")
        print(f"✅ Successfully processed: {processed}")
        print(f"❌ Failed: {failed}")
        print(f"📁 Total files: {len(mp4_files)}")
    
    def process_specific_file(self, file_path: str):
        """Process a specific MP4 file by path"""
        mp4_path = Path(file_path)
        
        if not mp4_path.exists():
            print(f"❌ File not found: {file_path}")
            return False
        
        if not mp4_path.suffix.lower() == '.mp4':
            print(f"❌ Not an MP4 file: {file_path}")
            return False
        
        return self.process_mp4_file(mp4_path)


def main():
    """Main command line interface"""
    
    print("🎓 Content Library Processor")
    print("=" * 50)
    print("Process MP4 files with microlearning content processor")
    print("Results are saved in the same folder as the MP4 file")
    print("=" * 50)
    
    processor = ContentLibraryProcessor()
    
    if len(sys.argv) > 1:
        # Process specific file
        file_path = sys.argv[1]
        print(f"🎯 Processing specific file: {file_path}")
        processor.process_specific_file(file_path)
    else:
        # Interactive mode
        print("\nOptions:")
        print("1. Process all MP4 files in content library")
        print("2. Process specific MP4 file")
        print("3. List available MP4 files")
        
        choice = input("\nEnter choice (1-3): ").strip()
        
        if choice == "1":
            processor.process_all_mp4_files()
        
        elif choice == "2":
            file_path = input("Enter MP4 file path: ").strip().strip('"')
            processor.process_specific_file(file_path)
        
        elif choice == "3":
            mp4_files = processor.find_mp4_files()
            print(f"\n📁 Found {len(mp4_files)} MP4 files:")
            for i, mp4_file in enumerate(mp4_files, 1):
                rel_path = mp4_file.relative_to(processor.content_library_path)
                print(f"  {i}. {rel_path}")
        
        else:
            print("❌ Invalid choice")


if __name__ == "__main__":
    main()
