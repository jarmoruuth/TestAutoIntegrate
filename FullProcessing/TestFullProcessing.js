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
autotest_test_name_list = ["01-BasicMonochromeCrop"];

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
function AutoIntegrateTestDialog(test_file, command_list)
{
      this.__base__ = AutoIntegrateDialog;
      this.__base__();
      this.test_file = test_file;
      this.command_list = command_list;
      this.test_name = File.extractName(this.test_file);

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
      this.onExecute = function()
      {
            console.noteln("onExecute() for test '", this.test_name, '", loading file list and settings from ', this.test_file);
            var pagearray = parseJsonFile(this.test_file, false);

            for (var i = 0; i < pagearray.length; i++) {
                  if (pagearray[i] != null) {
                        addFilesToTreeBox(this, i, pagearray[i]);
                  }
            }
            updateInfoLabel(this);
 
            for (let command_index in this.command_list)
            {
                  let command = this.command_list[command_index];
                  let commandNmb = 1+parseInt(command_index);
                  console.noteln("Test: ", this.test_name, " executing ",commandNmb, ": ", command);
                  this.autotest_execute_command(command);
            }

      }

      this.autotest_commands = {
            'closeAllPrefix': function(autoIntegrateDialog, command) {
                  console.noteln("Test: Closing all prefix windows");
                  // Not in 'this', for whatever reason
                  closeAllPrefixButton.onClick();
            },

                  
            'setPar': function(autoIntegrateDialog, command) {
                  let param = command[1];
                  let value = param[2];
                  console.noteln("Test: Set parameter ", param, " to ", value);
                  if (par.hasOwnProperty(param))
                  {
                        // TODO check type
                        par[param].val = value;
                  }
                  else
                  {
                        // TODO Log to error, option to exit
                        console.warningln("Test: Unknown parameter '", param, "' set ignored");
                  }
            },
                  
            'setPrefix': function(autoIntegrateDialog, command) {
                  let prefix = command[1];
                  console.noteln("Test: Set prefix to ", prefix);
                  ppar.win_prefix = prefix;
            },

            'setLastDir': function(autoIntegrateDialog, command) {
                  let lastDir = command[1];
                  console.noteln("Test: Set lastDir to ", lastDir);
                  ppar.lastDir = lastDir;
            },

            'setOutputRootDir': function(autoIntegrateDialog, command) {
                  let outputDir = command[1];
                  console.noteln("Test: Set outputRootDir to ", outputDir);
                  outputRootDir = outputDir;
            },


            'run': function(autoIntegrateDialog, command) {
                  // TODO note that the log must be explored
                  console.noteln("Test: Executing 'Run' on test data");
                  autoIntegrateDialog.run_Button.onClick();
            },

            'continue': function(autoIntegrateDialog, command) {
                  // TODO note that the log must be explored
                  console.noteln("Test: Executing autoContinue on test data");
                  autoIntegrateDialog.autoContinueButton.onClick();
            },

            'exit': function(autoIntegrateDialog, command) {
                  console.noteln("Test: Run completed, removing window in 2 seconds");
                  autoIntegrateDialog.cancelTimer.start();
            },
      }

       this.autotest_execute_command = function(command)
      {
            let command_name = command[0];
            if (command_name in this.autotest_commands) {
                  let command_function = this.autotest_commands[command_name];
                  command_function(this, command);
            } else {
                  // TODO Log to error, option to exit
                  console.warningln("Test: Unknown command '", command_name, "' ignored");         
            }
      }

}

AutoIntegrateTestDialog.prototype = new AutoIntegrateDialog();


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
                  errors[errors.length]  = "log - " + line.substring(errorIndex);
            }
      }
      return errors;

}

// Load the list of commands if present, return a default list if missing
function load_command_list(control_file_path)
{
      if (control_file_path == null)
      {
            return [["closeAllPrefix"],["run"], ["exit"]];
      }

      try {
            let control_text = File.readTextFile(control_file_path);
            let control = JSON.parse(control_text);
            return control.commands;
      } catch (x)
      {
            console.warningln("Could not parse JSON in control file ", control_file_path);
            console.warningln("     error ", x);
            console.warningln("     test not executed");
            return [["error", "Error " + x + " loading " + control_file_path]];
      }
}

// Execute a single test sequence
function execute_test(test_name, work_directory, autosetup_file_path, control_file_path)
{
      let resultDirectory = ensurePathEndSlash((work_directory+test_name).trim());
      console.noteln("===================================================");
      console.noteln("Executing test '", test_name, "' with results in ", resultDirectory);

      let command_list = load_command_list(control_file_path);

      let errors = ["Unknown"];

      try {

            autotest_initialize(work_directory);
      
            var dialog = new AutoIntegrateTestDialog(autosetup_file_path, command_list);
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


// -----------------------------------------------------------------------------------------

function load_test_specifications(autotest_tests_directory)
{
      if (!File.directoryExists(autotest_tests_directory))
      {
            throwFatalError("Test directory '", autotest_tests_directory,"' does not exists");
      }

 
      let all_autotest_test_files = searchDirectory( autotest_tests_directory+"/*.json", false );
      if (all_autotest_test_files.length == 0) 
      {
            console.warningln("No '*.json' file in '", autotest_tests_directory, "'");
      }

 
      // Separate test files from control files
      let autotest_test_files = {}; // test name -> path
      let autotest_control_files = {}; // test name -> path
      let all_test_names = []; // in order

      for (let test_index in all_autotest_test_files)
      {
            let test_test_file_path = all_autotest_test_files[test_index];
            let test_file_name = File.extractName(test_test_file_path);
            if (test_file_name.endsWith('_control'))
            {
                  let test_name = test_file_name.substring(0, test_file_name.length-'_control'.length); // Name of file without _control
                  autotest_control_files[test_name] = test_test_file_path;
            }
            else 
            {
                  let test_name = test_file_name;  // Name of file
                  autotest_test_files[test_name] = test_test_file_path;
                  all_test_names[all_test_names.length] = test_name;
            }

      }

      if (all_test_names.length == 0) 
      {
            console.warningln("No test '*.json' file in '", autotest_tests_directory, "', likely only *_control.json");
      }

      all_test_names.sort(); // Ensure default is sorted independ of the operating system

      // Check that all _control file have a matching test file
      let autotest_control_keys = autotest_control_files.keys;
      for (let control_index in autotest_control_keys)
      {
            let control_test_name = autotest_control_keys[control_index];
            if (! control_test_name in autotest_test_files)
            {
                  console.warningln("Control file '", autotest_control_files[control_test_name], 
                  " does not have matching test file, control file will be ignored");
            }
      }

      // autotest_test_name_list, may be in a specific order
      let requested_test_name_list = [];
      if (autotest_test_name_list == null)
      {
            console.noteln("'autotest_test_name_list' not defined, selecting all tests");
            requested_test_name_list = all_test_names;
      }
      else {
            requested_test_name_list = autotest_test_name_list;
      }

      let tests_to_execute = {}; // test_name -> [autosetup, control or null]
      console.noteln("The following tests will be executed:");
      for (let test_index in requested_test_name_list)          {
            let requested_test_name = requested_test_name_list[test_index];
            let control_file_path = (requested_test_name in autotest_control_files) ? autotest_control_files[requested_test_name] : null;
            let with_control = (control_file_path==null ? "": " WITH CONTROL");
            console.noteln("    ", requested_test_name, " ", with_control);
            if (! requested_test_name in all_test_names)
            {
                  throwFatalError("Requested test '"+ requested_test_name + "' not in '" + autotest_tests_directory + "'")
            }
            let test_specification = [autotest_test_files[requested_test_name],  control_file_path];
            tests_to_execute[requested_test_name] = test_specification;
      }

      // Return list of test names to keep desired order
      return [requested_test_name_list, tests_to_execute];


}
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


      let [requested_test_name_list, tests_to_execute] = load_test_specifications(autotest_tests_directory);
     
      // Prepare result array
      let test_results = {};
      for (let test_index in requested_test_name_list) 
      {
            let test_name = requested_test_name_list[test_index];
            test_results[test_name] = 'Unknown';
      }

 
      // Execute tests
      for (let test_index in requested_test_name_list)
      {
            let test_name = requested_test_name_list[test_index];
            let test_specification = tests_to_execute[test_name];
            let [autosetup_file_path,  control_file_path] = test_specification;
 
            let result = execute_test(test_name, autotest_result_directory, autosetup_file_path, control_file_path);
            test_results[test_name] = result;
      }

      console.noteln("-----------------------------------------------------");
      console.noteln("Test results in directory ", autotest_result_directory);
      for (let test_index in requested_test_name_list)          {
            let test_name = requested_test_name_list[test_index];
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
catch (x) {
      console.writeln( "Error: " + x );
}

console.noteln("TestAutoIntegrate terminated");

