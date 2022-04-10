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
// the directoy containing json files of the tests
// They must be in the format AutoSetup.json but named after the test
var autotest_tests_directory = autotest_script_directory + "tests";
//var autotest_tests_directory = "D:/AI_TESTS"

// The images must be in a subdirectory of tests


// The list of tests to run
// ** if null, all tests are run in sequence
var autotest_test_name_list = null;
// ** Or an array of test names must be given, they will be executed in order
// var autotest_test_name_list = ["01-BasicMonochromeCrop","02-BasicLRGBcrop"];

// Directory where to put the results, it is recommended to clean it before execution
// ** A directory in the source path, which must be in .gitignore. Make sure that it has enough free space
var autotest_result_directory = autotest_script_directory+"results/";
// ** The system directory is always present but may not be convenient and overload the system drive
// var autotest_result_directory = ensurePathEndSlash(File.systemTempDirectory)+"AutoIntergrateTestResults/";
// ** Use some specifc location, there should be nothing (except test results) in that directory
// var autotest_result_directory = "D:/AutoIntergrateTestResults";

autotest_script_directory = ensurePathEndSlash(autotest_script_directory);
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
      console.noteln("Test data file directory ", autotest_tests_directory);
      console.noteln("Test work and result directory ", autotest_result_directory);
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

            // if (autotest_image_directory != null)
            // {
            //       remap_pagearray_directory(pagearray);
            // }

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

function look_for_errors(resultDirectory)
{
      let errors = [];
      let logFilePath = ensurePathEndSlash(resultDirectory)+'/AutoProcessed/AutoIntegrate.log';
      if (! File.exists(logFilePath))
      {
            errors[errors.length] = "Log file '" + logFilePath + "' not found";
            return errors;
      }

      let log_lines = File.readLines( logFilePath);
      for (let i in log_lines)
      {
            let line = log_lines[i];
            let errorIndex = line.indexOf("Error: ");
            if (errorIndex>0)
            {
                  errors[errors.length]  = line.substring(errorIndex);
            }
      }
      return errors;

}


// Execute a single test sequence
function execute_test(test_name, work_directory, test_specification_file)
{
      let resultDirectory = ensurePathEndSlash((work_directory+test_name).trim());
      console.noteln("===================================================");
      console.noteln("Executing test '", test_name, "' with results in ", resultDirectory);

      let errors = ["Unknown"];

      try {

            autotest_initialize(work_directory);
      
            var dialog = new AutoIntegrateTestDialog(test_specification_file);
            outputRootDir = resultDirectory;
       
            dialog.execute();

            errors = look_for_errors(resultDirectory);
      
            console.noteln("Test '", test_name, "' completed normally");
      }
       catch (x) {
            console.warningln("Test '", test_name, "in error: ",  x );
            errors = ["Exception: " + x];
      }
      return errors;
}


AutoIntegrateTestDialog.prototype = new AutoIntegrateDialog();

// -----------------------------------------------------------------------------------------

try
      {
      autotest_logheader();

      // Create or check directories
      // Output directory
      if (!File.directoryExists(autotest_result_directory))
      {
            File.createDirectory(autotest_result_directory,false);
            console.noteln("Directory '", autotest_result_directory,"' created");
      }

      if (!File.directoryExists(autotest_tests_directory))
      {
            throwFatalError("Test directory '", autotest_tests_directory,"' does not exists");
      }

 
      let autotest_test_files = searchDirectory( autotest_tests_directory+"/*.json", false );
      if (autotest_test_files.length == 0) 
      {
            console.warningln("No '*.json' file in '", autotest_tests_directory, "'");
      }
      else 
      {
            console.noteln(autotest_test_files.length, " test in ", autotest_tests_directory);
 
            // Get list of all known tests
            let all_test_names = [];
            for (let test_index in autotest_test_files)
            {
                  let test_specification = autotest_test_files[test_index];
                  let test_name = File.extractName(test_specification);
                  all_test_names[all_test_names.length] = test_name;
                  if (debug) console.writeln("DEBUG - known test: ", test_name);
            }


            // If we have no specified test to execute, execute all known tests
            if (autotest_test_name_list == null)
            {
                  console.writeln("'autotest_test_name_list' not defined, executing all tests");
                  autotest_test_name_list = all_test_names;
            }

            let test_results = {};
            console.noteln("The following tests will be executed:");
            for (let test_index in autotest_test_name_list)          {
                  let test_name = autotest_test_name_list[test_index];
                  test_results[test_name] = 'Unknown';
                  console.noteln("    ", test_name);
                  if (! test_name in all_test_names)
                  {
                        throwFatalError("Requested test '"+ test_name + "' not in '" + autotest_tests_directory + "'")
                  }
            }

            // Execute tests
            for (let test_index in autotest_test_name_list)
            {
                  let test_name = autotest_test_name_list[test_index];
                  let test_specification = autotest_tests_directory +"/" + test_name +  ".json";
                  result = execute_test(test_name, autotest_result_directory, test_specification);
                  test_results[test_name] = result;
            }

            console.noteln("-----------------------------------------------------");
            console.noteln("Test results in directory ", autotest_result_directory);
            for (let test_index in autotest_test_name_list)          {
                  let test_name = autotest_test_name_list[test_index];
                  let results =  test_results[test_name];
                  if (results.length == 0)
                  {
                        console.noteln("    ",test_name, " ok");
                  } else {
                        console.noteln("    ",test_name, ": errors");
                        for (let error_index in results)
                        {
                              console.noteln("         ", results[error_index]);
                        }
                  }
            }


      }

}
catch (x) {
      console.writeln( x );
}

console.noteln("TestAutoIntegrate terminated");

