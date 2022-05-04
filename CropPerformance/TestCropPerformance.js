"use strict"; 

// TestCropPerformance


// -----------------------------------------------------------------------------------------
// Parameterize the included main script, overloading
// the debug parameters and disabling main()

#define TEST_AUTO_INTEGRATE

var debug = false;
var get_process_defaults = false;

// By default assume that repository is a sibling of AutoIntegrate
// ************* Adapt if needed ********************
#include "../../AutoIntegrate/AutoIntegrate.js"

// -----------------------------------------------------------------------------------------

// DESIGN NOTE: All global variables are prefixed by 'autotest_' to avoid conflicts with AutoIntegrate.j


// -----------------------------------------------------------------------------------------

// Automatic configuration of directories relative to the location of the script file.

// The directory containing the test xisf files (LowRejectionMap_ALL)
let autotest_script_path = ( #__FILE__ );        // Absolute path of the current script file
let autotest_script_directory = autotest_script_path.substring(0,autotest_script_path.lastIndexOf('/')+1);
//let autotest_test_rejection_maps_directory = autotest_script_directory + "TestRejectionMaps";

// There is no result directory, results are on the screen

let rejection_window_name = "LowRejectionMap_ALL";

// -----------------------------------------------------------------------------------------


// Print an identifier header
function autotest_logheader()
{
      pixinsight_version_str = CoreApplication.versionMajor + '.' + CoreApplication.versionMinor + '.' + 
      CoreApplication.versionRelease + '-' + CoreApplication.versionRevision;
      pixinsight_version_num = CoreApplication.versionMajor * 1e6 + 
            CoreApplication.versionMinor * 1e4 + 
            CoreApplication.versionRelease * 1e2 + 
            CoreApplication.versionRevision;
      console.noteln("======================================================");
      console.noteln("Automatic test for AutoIntegrate");
      console.noteln("Script ", File.extractName(autotest_script_path));
      console.noteln("Script directory ", autotest_script_directory);
      //console.noteln("Test data file directory ", autotest_test_rejection_maps_directory);
      console.noteln("Testing the calculation of the crop bounding box");
      console.noteln("for AutoIntegrate " + autointegrate_version + ", PixInsight v" + pixinsight_version_str + ' (' + pixinsight_version_num + ')');
      console.noteln("======================================================");
}

 
function autotest_load_registered_file_paths(path_pattern, recursive)
{
      console.noteln("Searching " + (recursive ? "recursively" : "") + " file pattern '" + path_pattern + "'");
      let image_files = searchDirectory(path_pattern, recursive);
      console.noteln("Found " + image_files.length + " files, assume registered images of the same size");
      let image_file_descriptors = [];
      for (let i in image_files)
      {
         image_file_descriptors[image_file_descriptors.length] = [true, image_files[i], "", ""]; // [ enabled, path, drizzlePath, localNormalizationDataPath ]
      }

      return image_file_descriptors;
}

// Execute the test on al ltest files
function autotest_execute()

{
      let images = autotest_load_registered_file_paths("D:/202004-T09-IC2872/wbpp/registered/Light_BIN-1_EXPOSURE-180.00s_FILTER-Blue_Mono/*.xisf",true);
      //console.writeln("Found " + images.length + " images");

      let rejection_window = findWindow(rejection_window_name);
      if (rejection_window != null)
      {
            console.noteln("Closing previous window ", rejection_window_name);
            rejection_window.forceClose();
      }


      console.noteln("===================================================");
      // Measure execution from start of testing
      let start_time = Date.now();
      let lowClipImageName = runImageIntegrationForCrop(images);
      console.writeln("lowClipImageName ",lowClipImageName);
      let lowClipImageWindow = findWindow(lowClipImageName);
      console.writeln("lowClipImageWindow ",lowClipImageWindow);
      let integration_time = Date.now();

      let bounding_box = findBounding_box(lowClipImageWindow);
  
      let [left_col, right_col, top_row, bottom_row] = bounding_box;
      lowClipImageWindow.createPreview( left_col, top_row, right_col, bottom_row, "crop" );
      

      // To end of testing
      let end_time = Date.now();

      console.writeln("Bounding box: left_col ", left_col, ", top_row, ", 
      top_row, ", right_col ", right_col, ", right ",bottom_row);

      console.noteln("Generated " + lowClipImageName);

      console.noteln("===================================================");
      console.noteln("TestCropPerformance terminated");
      console.noteln("   integration execution time "+(integration_time-start_time)/1000+" sec");
      console.noteln("   crop calculation execution time "+(end_time-integration_time)/1000+" sec");
      console.noteln("   total execution time "+(end_time-start_time)/1000+" sec");
      console.noteln("For proper results, clean the Integration caches and run twice to see cache effect");
 }

autotest_logheader();

autotest_execute();
