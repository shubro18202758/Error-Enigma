
import sys
sys.path.append('D:\\error_404\\backend')

try:
    from adaptive_test_new import DataScienceMasterclassLoader
    loader = DataScienceMasterclassLoader()
    
    # Test the new method
    modules = loader.get_available_modules()
    print(f"✅ Found {len(modules)} modules in Python backend")
    
    for i, module in enumerate(modules, 1):
        print(f"   {i}. {module.get('name', 'Unknown Module')}")
    
    print("✅ Python backend working correctly")
    
except Exception as e:
    print(f"❌ Python backend error: {e}")
    import traceback
    traceback.print_exc()
