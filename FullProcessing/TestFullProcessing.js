//"use strict"; 

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
var autotest_tests_directory = autotest_script_directory + "tests/";
//var autotest_tests_directory = "D:/AI_TESTS/"

// The images must be in a subdirectory of tests

var autotest_logfile_path = null;


// Directory where to put the results, it is recommended to clean it before execution
// ** A directory in the source path, which must be in .gitignore. Make sure that it has enough free space
var autotest_result_directory = autotest_script_directory+"results/";
// ** The system directory is always present but may not be convenient and overload the system drive
// var autotest_result_directory = ensurePathEndSlash(File.systemTempDirectory)+"AutoIntergrateTestResults/";
// ** Use some specifc location, there should be nothing (except test results) in that directory
// var autotest_result_directory = "D:/AutoIntergrateTestResults";

// *********************************************************************************************

// ----------------------------------------------------------------------------------------
// autottest log control  namespace
// Must be initialized early to save the original console methods.
// This is somehwat tricky, it dynamically replace the methods beginLog and endLog
// to trap the actions of AutoIntegrate (while not modifiying the original code),
// it save all logs that are not saved by AutoIntegrate to its own Autotest log file.
let AutotestLog = (function() {
     
      let originalBeginLog = console.beginLog;
      let originalEndLog = console.endLog;
      let logToAutotestLog = false;

      // Restore the original methods, should be called in all case before exiting
      let restoreOriginalConsoleLog = function ()
      {
            console.beginLog = originalBeginLog;
            console.endLog = originalEndLog;      
      }

      // Save (append) the autotest log at end or before switching to AutoIntegrate log
      let saveAutotestLog = function()
      {
            if (logToAutotestLog)
            {
                  let log = originalEndLog();

                  logToAutotestLog = false;
                  console.flush();
 
                  if (autotest_logfile_path != null)
                  {
                  try
                        {
                        let logFile = new File;
                        logFile.openOrCreate( autotest_logfile_path );
                        logFile.seekEnd();
                        logFile.write(log);
                        logFile.close();
                        }                      
                        catch ( error )
                        {
                        // Unable to create file.
                        console.warningln( "Autotest: Unable to append log to file: '" + autotest_logfile_path + "'  (" + error.message + ")." );
                        autotest_logfile_path = null;
                        }
                  }
                  else {
                        console.warningln("Autotest log not saved, path is null or previous error");
                  }
            }

      }

      // endLog has been called by AutoIntegrate,
      // save the log and switch to autotest log
      // Called as a substitute of endLog() established by switchToAutoIntegrateLog()
      let restoreAutotestLog = function()
      {
            // close Autointegrate log
            // console.noteln("DEBUG: === Log will switch to AutoTest log");
            restoreOriginalConsoleLog();
            console.flush();
            let log = console.endLog();

            // Enable autoexe clog
            logToAutotestLog = true;
            console.beginLog();
            console.noteln("=== Log switched to AutoTest log");

            // return Autointegrate log to caller of console.begingLog
            return log;
      }

      // Called after run() or continue() to ensure that it switched back to 
      // autotest log, force it if not done
      let ensureAutotestLog = function()
      {
            if (! logToAutotestLog)
            {
                  // close Autointegrate log
                  // console.noteln("DEBUG: === ensureAutotestLog - Log will switch to AutoTest log");
                  restoreOriginalConsoleLog();
                  console.flush();
                  // Likely the proper endLog was not called
                  console.endLog();

                  // Enable autoexec log
                  logToAutotestLog = true;
                  console.beginLog();
                  console.warningln("=== Log forced switched to AutoTest log (run() or continue() did not close log)");
            }
      }


      // We close and save the current AutotestLog, if needed, and do logBegin in name of AutoIntegrate
      // Must be called by trapBeginLog() when we are in AutoIntegrate log
      let switchToAutoIntegrateLog = function()
      {
            console.noteln("=== Log will switch to AutoIntegrate.log");
            saveAutotestLog();
            originalBeginLog();
            // console.noteln("DEBUG: === Log switched to AutoIntegrate.log");
            // The next endLog will switch back to Autotest log
            console.endLog = restoreAutotestLog;
      }

      // Request  the next console.begingLog to switch from autotest log to AutoIntergrate log
      let trapBeginLog = function()
      {
            console.beginLog = switchToAutoIntegrateLog;            
      }

      // Initialize autotest log and start it
      let initializeAutotestLog = function()
      {
            logToAutotestLog = true;
            originalBeginLog();
            console.noteln("Autotest: Begin logging to Autotest log");
      }


      return {
            'restoreOriginalConsoleLog': restoreOriginalConsoleLog,
            'saveAutotestLog': saveAutotestLog,
            'trapBeginLog': trapBeginLog,
            'initializeAutotestLog': initializeAutotestLog,
            'ensureAutotestLog': ensureAutotestLog
      };
}) ();

// ----------------------------------------------------------------------------------------



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


// Emulate the initialization done by main() in AutoIntegrate, must be called before creating 
// or recreating) the AutoIntegrateTestDialog.

// Initialize various global variables using the functions of AutoIntegrate
// Executed at the beginnig of each test.
function autotest_initialize()
{

      console.noteln("Autotest: No module or icon setting is loaded in automatic mode, starting from defaults.");

      setDefaultDirs();

      // Initialize ppar to the default values they have when the script is started
      ppar.win_prefix = '';
      ppar.prefixArray = [];
      ppar.userColumnCount = -1;    
      ppar.lastDir = '';  

      // Hopefully remove the prefixes of a previous run
      fixAllWindowArrays(ppar.win_prefix);

      // Reset the parameters to the default they would have when the program is loaded
      setParameterDefaults();

      // TODO All other global variables hould be reinitialiezd to their defauld values if AutoIntegrateTestDialog
      // is recreated.

}


// ----------------------------------------------------------------------------------------
// autottest namespace
let Autotest = (function() {


      // -----------------------------------------------------------------------------------

      // class Test describes a single test
      let Test = function(test_name, test_directory, autosetup_path, command_list)
      {
            this.__base__ = Object;
            this.__base__();   

            this.test_name = test_name;
            this.test_directory = test_directory; // Root of test files
            this.autosetup_path = autosetup_path;
            this.command_list = command_list;  // Object or null

            this.result = ['Not executed'];
 
            this.toString = () => {
                  return this.name + "(" + this.test_name +")";
            }
      }


      // -----------------------------------------------------------------------------------

      // class TestManager keeps track of all the tests being processed
      let TestManager = function()
      {
            this.__base__ = Object;
            this.__base__();   

            this.init = () => {
                  if  (! File.isFile(this.filePath))
                  {
                        throw new Error("File not found: " + thisl.filePath);
                  }
            }
      }

      // -----------------------------------------------------------------------------------

      // funnction loadTest loads the definition of a single test
      let loadTest = function(test_path)
      {
            let test_directory = extractDirectory(test_path);
            let test_name = File.extractName(test_path);

            console.writeln("DEBUG: Loading ",test_path);

            // Check if this is a control file or a json file
            let is_control = test_name.endsWith("_control");

            let autosetup_path = test_path; // assume autosetup json file
            let command_list = null;
            if (is_control)
            {
                  test_name = test_name.substring(0,test_name.length-"_control".length);
                  try {
                        command_list = load_command_list(test_path);
                  } catch (x)
                  {
                        throw (Error("Control file '" + test_path + "' not a proper JSON file"));
                  }
                  autosetup_path = ensurePathEndSlash(test_directory)+test_name+".json";
            } else {
                  command_list = [["closeAllPrefix"],["run"], ["exit"]];
            }

            // Load autosetup.json to check that it is properly formatted
            if (! File.exists(autosetup_path))
            {
                  throw Error("No file '"+test_name+".json"+ "' corresponding to '" + 
                        File.extractNameAndExtension(test_path) + "' in " + test_directory);
            }
            
            try {
                  let autosetup_text = File.readTextFile(autosetup_path);
                  JSON.parse(autosetup_text);
            } catch (x)
            {
                  throw (Error("Test file '" + autosetup_path + "' not a proper JSON file"));
            }

            console.writeln("DEBUG: Loaded ",test_name, " ", is_control, "\n    path: ", autosetup_path, "\n    Commands: ", command_list);

            return new Test(test_name, test_directory, autosetup_path, command_list);
   
      }
    // -----------------------------------------------------------------------------------

      let resolvePath = function(root_path, path)
      {
            if (pathIsRelative(path))
            {
                  return ensurePathEndSlash(root_path) + path;
            } else {
                  return path;
            }
      }

      let extractDirectory = function(path) 
      {
            return path.substring(0,path.lastIndexOf('/')+1);
      }

      // function loadTestList fin the list of text to execute
      let loadTestList = function(test_list_path)
      {
            let test_paths = []
            let root_path = test_list_path.substring(0,test_list_path.lastIndexOf('/')+1);
            if (! File.exists(test_list_path))
            {
                  throw Error("File '" + test_list_path + "' does not exist");
            }
            let lines = File.readLines(test_list_path);
            //console.writeln("Autotest: Loaded " + lines.length + " lines from '" + test_list_path +"'");
            for (let i=0; i<lines.length; i++) {
                  let line = lines[i].trim();
                  if (line.length == 0) continue; // skip empty line
                  if (line.startsWith('#')) continue; // skip comment
                  let test_path = resolvePath(root_path,line);
                  console.writeln(File.fullPath(test_path));
                  if (File.exists(test_path)) {
                        test_paths[test_paths.length] = test_path;
                  } else if (File.directoryExists(test_path)) {
                        throw Error("Test in directory not supported '" + test_path + "', line " + (i+1));
                  } else {
                        throw Error("Test file '" + test_path + "' does not exsist");
                  }
            }
            console.writeln("" + test_paths.length + " tests found");
            return test_paths;
      }


      let forceCloseAll = function()
      {
            console.noteln("Autotest: Force close all ", ImageWindow.windows.length, " windows");
            let windows = ImageWindow.windows.slice(); // make a copy
            for (let i=0; i<windows.length; i++)
            {
                  windows[i].forceClose();
            }
            
      }


 

      return {
            'Test': Test,
            'TestManager': TestManager,
            'loadTest': loadTest,
            'loadTestList': loadTestList,
            'forceCloseAll': forceCloseAll
      };
}) ();




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
            console.noteln("Autotest: onExecute() for test '", this.test_name, '", loading file list and settings from ', this.test_file);
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
                  console.noteln("Autotest: ", this.test_name, " command ",commandNmb, ": ", command);
                  this.autotest_execute_command(command);
            }

      }

      this.autotest_commands = {
            'closeAllPrefix': function(autoIntegrateDialog, command) {
                  console.noteln("Autotest: Closing all prefix windows");
                  // Not in 'this', for whatever reason
                  closeAllPrefixButton.onClick();
            },

                  
            'setPar': function(autoIntegrateDialog, command) {
                  let name = command[1];
                  let value = command[2];
                  console.noteln("Autotest: Set parameter ", name, " to ", value, " (", typeof value, ")");
                  if (par.hasOwnProperty(name))
                  {
                        let param = par[name];
                        // TODO check type
                        param.val = value;
                        if (param.reset != undefined) {
                              param.reset();
                        }
                  }
                  else
                  {
                        // TODO Log to error, option to exit
                        console.warningln("Autotest: Unknown parameter '", name, "' set ignored");
                  }
            },
                  
            'setPrefix': function(autoIntegrateDialog, command) {
                  let prefix = command[1];
                  console.noteln("Autotest: Set prefix to ", prefix);
                  ppar.win_prefix = prefix;
            },

            'setLastDir': function(autoIntegrateDialog, command) {
                  let lastDir = command[1];
                  console.noteln("Autotest: Set lastDir to ", lastDir);
                  ppar.lastDir = lastDir;
            },

            'setOutputRootDir': function(autoIntegrateDialog, command) {
                  let outputDir = command[1];
                  console.noteln("Autotest: Set outputRootDir to ", outputDir);
                  outputRootDir = outputDir;
            },


            'run': function(autoIntegrateDialog, command) {
                  // The next beginLog will save the autoexex console log.
                  AutotestLog.trapBeginLog();

                  // TODO note that the log must be explored
                  console.noteln("Autotest: Executing 'Run' on test data");
                  autoIntegrateDialog.run_Button.onClick();
                  AutotestLog.ensureAutotestLog();
            },

            'continue': function(autoIntegrateDialog, command) {
                  // The next beginLog will save the autoexex console log.
                  AutotestLog.trapBeginLog();

                   // TODO note that the log must be explored
                  console.noteln("Autotest: Executing autoContinue on test data");
                  autoIntegrateDialog.autoContinueButton.onClick();
                  AutotestLog.ensureAutotestLog();
            },

            'exit': function(autoIntegrateDialog, command) {
                  console.noteln("Autotest: Run completed, removing window in 2 seconds");
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
                  console.warningln("Autotest: Unknown command '", command_name, "' ignored");         
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
      try {
            let control_text = File.readTextFile(control_file_path);
            let control = JSON.parse(control_text);
            return control.commands;
      } catch (x)
      {
            console.warningln("Autotest: Could not parse JSON in control file ", control_file_path);
            console.warningln("             error ", x);
            console.warningln("             test not executed");
            return [["error", "Error " + x + " loading " + control_file_path]];
      }
}

// Execute a single test sequence
function execute_test(test_name, resultRootDirectory, autosetup_file_path, command_list)
{
      let resultDirectory = ensurePathEndSlash((resultRootDirectory+test_name).trim());
      console.noteln("===================================================");
      console.noteln("Autotest: Executing test '", test_name, "' with results in ", resultDirectory);
      console.noteln("Autotest: Commands to execute: ")
      for (let i=0; i<command_list.length; i++)
      {
            console.noteln("    ", command_list[i]);
      }

      let errors = ["Unknown"];

      try {

            outputRootDir = resultDirectory;

            var dialog = new AutoIntegrateTestDialog(autosetup_file_path, command_list);
            dialog.execute();

            errors = look_for_errors(resultDirectory);
      
            console.noteln("Autotest; ", test_name, "' completed normally");
      }
       catch (x) {
            console.warningln("Autotest '", test_name, " terminated with error: ",  x );
            errors = ["Exception: " + x];
      }
      return errors;
}




// -----------------------------------------------------------------------------------------
// The try block also open a local scope for let variables to avoid conflicts with the main script
try
      {

      AutotestLog.initializeAutotestLog();

      Autotest.forceCloseAll();

      autotest_logheader();

      autotest_initialize();  

      // Load all test definitions
      let test_list = Autotest.loadTestList(autotest_tests_directory+"autotest_tests.txt")
      let tests = []
      for (let i=0; i<test_list.length; i++)
      {
            let test_path = test_list[i];
            let test = Autotest.loadTest(test_path);
            tests[tests.length] = test;
      }

      // Create or check directories
      // Output directory
      if (!File.directoryExists(autotest_result_directory))
      {
            File.createDirectory(autotest_result_directory,false);
            console.noteln("Autotest: Directory '", autotest_result_directory,"' created");
      }
      let log_date = new Date;
      let uniqueFilenamePart = 
       format( "_%04d%02d%02d_%02d%02d%02d",
                              log_date.getFullYear(), log_date.getMonth() + 1, log_date.getDate(),
                              log_date.getHours(), log_date.getMinutes(), log_date.getSeconds());
      autotest_logfile_path = ensurePathEndSlash(autotest_result_directory) + "autotest" +  uniqueFilenamePart + ".log";

 
      // Execute tests
      for (let i =0; i<tests.length; i++)  
      {
            let test = tests[i];
            let test_name = test.test_name;
            let autosetup_file_path = test.autosetup_path;
            let command_list = test.command_list;
 
            test.result = execute_test(test_name, autotest_result_directory, autosetup_file_path, command_list);
      }

      console.noteln("-----------------------------------------------------");
      console.noteln("Autotest: Test results in directory ", autotest_result_directory);
      for (let i =0; i<tests.length; i++)  
      {
            let test = tests[i];
            let test_name = test.test_name;
            let results =  test.result;
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

      AutotestLog.saveAutotestLog();
      console.noteln("Autotest: logfile written to " + autotest_logfile_path);

      console.noteln("TestAutoIntegrate terminated");
 
}
catch (x) {
      AutotestLog.restoreOriginalConsoleLog();
      console.noteln("TestAutoIntegrate terminated");
      console.writeln( "Autotest: Error: " + x );
}



