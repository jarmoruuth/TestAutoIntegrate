// "use strict"; // Requires adding a 'var' and removing a 'owth' in AutoIntegrate.js

// TestFullProcessing.js

// -----------------------------------------------------------------------------------------
// Parameterize the included main script, overloading
// the debug parameters and disabling main()

#define TEST_AUTO_INTEGRATE

var debug = true;
var get_process_defaults = false;

// By default assume that repository is a sibling of AutoIntegrate
// ************* Adapt if needed ********************
#include "../../AutoIntegrate/AutoIntegrate.js"

// -----------------------------------------------------------------------------------------

// DESIGN NOTE: All global variables are prefixed by 'autotest_' to avoid conflicts with AutoIntegrate.j

// Automatic configuration of directories relative to the location of the script file.

// The directory containing the test xisf files (LowRejectionMap_ALL)
let autotest_script_path = ( #__FILE__ );        // Absolute path of the current script file
let autotest_script_directory = autotest_script_path.substring(0,autotest_script_path.lastIndexOf('/')+1);

// *********************************************************************************************
// *** User overridable parameters
// *********************************************************************************************
// the root directoy containng the directories of the tests
var autotest_test_directory = autotest_script_directory + "tests";
//var autotest_test_directory = "D:/AI_TESTS"

// The root directoy containng the directories of the images
// ** By default the images are in a directory structure sibling of the tests
var autotest_image_directory = autotest_script_directory + "images";
// ** But they can be rooted at any arbizrary location
// var autotest_image_directory = "D:/AI_TESTS";
// ** Or even use the absolute path fro the AutoSetup.json (which must be valid !)
// var autotest_image_directory = null;



// The list of names of test to run
// ** if null, all tests are run in sequence
var autotest_test_name_list = null;
// ** Or an array of test names must be given, they will be executed in order
// var autotest_test_name_list = ["02-BasicLRGBcrop"];

// Directory where to put the results, it is recommended to clean it before execution
// ** The system directory is always present but may not be convenient and overload the system drive
// var autotest_work_directory = ensurePathEndSlash(File.systemTempDirectory)+"AutoIntergrateTestResults/";
// ** Use some specifc location, there should be nothing (except test results) in that directory
var autotest_work_directory = ensurePathEndSlash("D:/AutoIntergrateTestResults");
// *********************************************************************************************




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
      console.noteln("Test data file directory ", autotest_test_directory);
      console.noteln("Test work and result directory ", autotest_work_directory);
      console.noteln("Testing complete sequence of operations");
      console.noteln("for AutoIntegrate " + autointegrate_version + ", PixInsight v" + pixinsight_version_str + ' (' + pixinsight_version_num + ')');
      console.noteln("======================================================");
}



// Initialize various global variables using the functions of AutoIntegrate
// Executed at the beginnig of each test.
function autotest_initialize(test_directory)
{

      setDefaultDirs();

      setParameterDefaults();

      // A default directory
      ppar.win_prefix = '';
      ppar.lastDir = test_directory;

      // prefix_array ?
      ppar.userColumnCount = -1; 
}

function remap_filepath_directory(image_file_name)
{
      // At this point we should only receive arrays of length 2 [file_path, boolean]
      // Just make sure it is the case
      if (Array.isArray(image_file_name)) {
            if (image_file_name.length != 2)
            {
                  throwFatalError("Unexpected arrays length for image_file_name");
            }
       } else {
            throwFatalError("Unexpected treebox object for image_file_name");;
      }
      [file_path, selection] = image_file_name;

      // Extract the file and the last directory
      let name_and_extension = File.extractNameAndExtension(file_path);
      let last_directory = File.extractName(File.extractDirectory(file_path));
      if (debug) console.writeln("DEBUG remap_filepath_directory ",last_directory, " / ",name_and_extension);

      let new_file_path = ensurePathEndSlash(autotest_image_directory) + ensurePathEndSlash(last_directory) + name_and_extension;

      console.writeln("Remap path '", file_path, "' to '", new_file_path, "'");
      return [new_file_path, selection];
}



// Remap the directory of all image files to support relative directories
function remap_pagearray_directory(pagearray)
{
      for (let i = 0; i < pagearray.length; i++) {
            if (pagearray[i] != null) {
                  let filelist = pagearray[i];
                  for (let j = 0; j < filelist.length; j++)
                  {
                        let imageFileName = filelist[j];
                        filelist[j] = remap_filepath_directory(imageFileName);                        
                  }
            }
      }
}

// -----------------------------------------------------------------------------------------

// A subclass of AutoIntegrateDialog created for each test to execute the specific test file
function AutoIntegrateTestDialog(test_file)
{
      this.__base__ = AutoIntegrateDialog;
      this.__base__();
      this.test_file = test_file;

      // Time used to close the window as a direct call does not work
      this.cancelTimer = new Timer( 2, false );
      let dlg = this.dialog;
      this.cancelTimer.onTimeout = function()
      {
         dlg.cancelTimer = null;
         //console.writeln("Cancelling dlg", dlg);
         dlg.cancel();
      };


      // Called when the Dialo is executed and take over control
      this.onExecute = function(h)
      {
            console.noteln("onExecute() for test '", this.test_file, '", loading parameters and file list');
            var pagearray = parseJsonFile(this.test_file, false);

            if (autotest_image_directory != null)
            {
                  remap_pagearray_directory(pagearray);
            }

            for (var i = 0; i < pagearray.length; i++) {
                  if (pagearray[i] != null) {
                        addFilesToTreeBox(this, i, pagearray[i]);
                  }
            }
            updateInfoLabel(this);

            console.noteln("Closing all prefix windows");
            closeAllPrefixButton.onClick();

            console.noteln("Executing Run on test data");
            this.run_Button.onClick();

            console.noteln("Test run completed, removing window in 2 seconds");

            this.cancelTimer.start();
      }

}


// Execute a single test sequence
function execute_test(test_name, work_directory, test_specification_file)
{
      let resultDirectory = ensurePathEndSlash((work_directory+test_name).trim());
      console.noteln("===================================================");
      console.noteln("Executing test '", test_name, "' with results in ", resultDirectory);

      try {

            autotest_initialize(work_directory);
      
            var dialog = new AutoIntegrateTestDialog(test_specification_file);
            outputRootDir = resultDirectory;
       
            dialog.execute();
      
            console.noteln("Test '", test_name, "' completed normally");
      }
       catch (x) {
            console.warnln("Test '", test_name, "in error: ",  x );
      }
}


AutoIntegrateTestDialog.prototype = new AutoIntegrateDialog();

// -----------------------------------------------------------------------------------------

try
      {
      autotest_logheader();

      // Create or check directories
      // Output directory
      if (!File.directoryExists(autotest_work_directory))
      {
            File.createDirectory(autotest_work_directory,false);
            console.noteln("Directory '", autotest_work_directory,"' created");
      }

      if (!File.directoryExists(autotest_test_directory))
      {
            throwFatalError("Test directory '", autotest_test_directory,"' does not exists");
      }

      let autotest_test_directories = searchDirectory( autotest_test_directory+"/AutoSetup.json", true );
      if (autotest_test_directories.length == 0) 
      {
            console.warnln("No subdirectory with file 'AutoSetup.json' in '", autotest_test_directory, "'");
      }
      else 
      {
            console.noteln(autotest_test_directories.length, " test in ", autotest_test_directory);
 
            // Get list of all known tests
            let all_test_names = [];
            for (let test_index in autotest_test_directories)
            {
                  let test_specification = autotest_test_directories[test_index];
                  let test_directory = File.extractDirectory(test_specification);
                  let test_name = File.extractName(test_directory);
                  all_test_names[all_test_names.length] = test_name;
                  if (debug) console.writeln("DEBUG - known test: ", test_name);
            }

            // If we have no specified test to execute, execute all known tests
            if (autotest_test_name_list == null)
            {
                  console.writeln("autotest_test_name_list not defined, executing all tests");
                  autotest_test_name_list = all_test_names;
            }

            console.noteln("The following tests will be executed:");
            for (let test_index in autotest_test_name_list)          {
                  let test_name = autotest_test_name_list[test_index];
                  console.noteln("    ", test_name);
                  if (! test_name in all_test_names)
                  {
                        throwFatalError("Requested test '"+ test_name + "' not in '" + autotest_test_directory + "'")
                  }
            }

            // Execute tests
            for (let test_index in autotest_test_name_list)
            {
                  let test_name = autotest_test_name_list[test_index];
                  let test_specification = autotest_test_directory +"/" + test_name + "/" + "/AutoSetup.json";
                  execute_test(test_name, autotest_work_directory, test_specification);
            }

            console.noteln("-----------------------------------------------------");
            console.noteln("Test results in directory ", autotest_work_directory);

      }

}
catch (x) {
      console.writeln( x );
}

console.noteln("TestAutoIntegrate terminated");

