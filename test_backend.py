import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from adaptive_test_new import DataScienceMasterclassLoader
    print("SUCCESS: DataScienceMasterclassLoader imported")
    
    loader = DataScienceMasterclassLoader()
    print("SUCCESS: DataScienceMasterclassLoader initialized")
    
    # Test the new method
    modules = loader.get_available_modules()
    print(f"SUCCESS: Found {len(modules)} modules")
    
    for i, module in enumerate(modules, 1):
        name = module.get('name', f'Module {module.get("number", i)}')
        print(f"   {i}. {name}")
    
    print("SUCCESS: Python backend working correctly with get_available_modules method")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
