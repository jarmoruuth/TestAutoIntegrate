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



// Directory where to put the results, it is recommended to clean it before execution
// ** A directory in the source path, which must be in .gitignore. Make sure that it has enough free space
var autotest_result_directory = autotest_script_directory+"results/";
// ** The system directory is always present but may not be convenient and overload the system drive
// var autotest_result_directory = ensurePathEndSlash(File.systemTempDirectory)+"AutoIntergrateTestResults/";
// ** Use some specifc location, there should be nothing (except test results) in that directory
// var autotest_result_directory = "D:/AutoIntergrateTestResults";

// Where the autotest log file will be saved.  by default it will be created in the autotest_result_directory
var autotest_logfile_path = null;

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

            // --- Test specification
            this.test_name = test_name;
            this.test_directory = test_directory; // Root of test files
            this.autosetup_path = autosetup_path;
            this.command_list = command_list;  // Object or null

            // --- Test execution history and results
            // errors, an empty array if executed successfuly
            this.errors = [];

            this.addError = function(msg)
            {
                  this.errors[this.errors.length] = msg;  
            }
 
            this.toString = () => {
                  return this.test_name + "(" + this.autosetup_path +")";
            }
      }


      // -----------------------------------------------------------------------------------

      // Make path absolute relatively to rootPath if it is relative
      let resolveRelativePath = function(path, rootPath)
      {        
            // console.writeln("DEBUG: resolveRelativePath ( ",path, ",", rootPath,")");
            if (pathIsRelative(path))
            {
                  let resolvedPath = ensurePathEndSlash(rootPath) + path;
                  //console.writeln("DEBUG: resolveRelativePath resolved as ",resolvedPath);
                  return resolvedPath;
            } 
            else 
            {
                  //console.writeln("DEBUG: resolveRelativePath absolute ",path);
                  return path;
            }
      }


      // -----------------------------------------------------------------------------------

      // funnction loadTest loads the definition of a single test
      let loadTest = function(test_path)
      {
            //console.writeln("DEBUG: loadTest loading '",test_path, "'", typeof test_path);

            let test_directory = File.extractDrive(test_path) + File.extractDirectory(test_path);
            let test_name = File.extractName(test_path);

            let test_definition = null;
            try {
                  let test_text = File.readTextFile(test_path);
                  test_definition = JSON.parse(test_text);
            } catch (x)
            {
                  throw new Error("Test file '" + test_path + "' not a proper JSON file: ",x);
            }

            // Check if this is a control file or a json file
            let is_control = ('type' in test_definition) && (test_definition['type'] == 'control');

            let autosetup_path = null;
            let command_list = null;
            if (is_control)
            {
                  if (! 'commands' in test_definition || test_definition['commands'] == undefined)
                  {
                        throw new Error("Control file '" + test_path + "' has no 'command' property");
                  }
                  command_list = test_definition['commands'];
                  //console.writeln("DEBUG command ", JSON.stringify(command_list));

                  if (! 'autosetup' in test_definition || test_definition['autosetup'] == undefined)
                  {
                        throw new Error("Control file '" + test_path + "' has no 'autosetup' property");
                  }
                  let autosetup = test_definition['autosetup'];
                  
                  //console.writeln("DEBUG autosetup ", autosetup, " ", test_directory);

                  autosetup_path = resolveRelativePath(autosetup, test_directory);

                  // Check that autosetup is a valid json file
                  if (! File.exists(autosetup_path))
                  {
                        throw Error("Autosetup file '"+autosetup+ "' (full path '" + autosetup_path + "' does not exists");
                  }               
                  try {
                        let autosetup_text = File.readTextFile(autosetup_path);
                        JSON.parse(autosetup_text);
                  } catch (x)
                  {
                        throw new Error("Test file '" + autosetup_path + "' not a proper JSON file:" , x);
                  }

            } else {
                  autosetup_path = test_path;
                  command_list = [["execute", [["closeAllPrefix"],["run"], ["exit"]]]];
            }


            //console.writeln("DEBUG: Loaded ",test_name, " ", is_control, "\n    path: ", autosetup_path, "\n    Commands: ", 
            //      JSON.stringify(command_list));

            return new Test(test_name, test_directory, autosetup_path, command_list);
   
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
                  let test_path = resolveRelativePath(line, root_path);
                  console.writeln("DEBUG: Test full path " +File.fullPath(test_path));
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

      // ------------------------------------------------------------
      // Image and window manipulation

      let forceCloseAll = function()
      {
            console.noteln("Autotest: Force close all ", ImageWindow.windows.length, " windows");
            let windows = ImageWindow.windows.slice(); // make a copy
            for (let i=0; i<windows.length; i++)
            {
                  windows[i].forceClose();
            }           
      }


      // ------------------------------------------------------------
      // A reference state is a set of information about the state of the system
      // (currently the windows in the workspace) that may be saved and compared
      // with an expected or previous state.
      let referenceState = null;

      let buildReferenceState = function()
      {
            let window_ids = [];
            let ws = ImageWindow.windows;
            for (let i=0; i<ws.length; i++) 
            {
                  let w = ws[i]
                  //console.writeln("DEBUG: buildReferenceState ", w.mainView.id, " ", w.mainView.fullId);
                  window_ids[window_ids.length] = w.mainView.id;
            }
            // So that there is a canonical order for easier comparison
            window_ids = window_ids.sort();
            let state = {'windows': window_ids};
            //console.writeln("DEBUG: reference state: ", JSON.stringify(state));
            return state;
      }

      let saveReferenceState = function()
      {
            referenceState = buildReferenceState();;
      }

      let compareReferenceState = function()
      {
            let newReferenceState = buildReferenceState();
            let oldWindows = referenceState['windows'];
            let newWindows = newReferenceState['windows'];
            let createdWindows = newWindows.filter(id => oldWindows.indexOf(id)<0);
            let deletedWindows = oldWindows.filter(id => newWindows.indexOf(id)<0);
            console.noteln("Autotest: Test created the windows: ", createdWindows);
            if (deletedWindows.length>0) console.noteln("Autotest: and removed the windows: ", deletedWindows);
            return [createdWindows, deletedWindows];
      }

      // ------------------------------------------------------------

      // Parse the known log for errors, add them to test error
      let parse_log_for_errors = function(test, resultDirectory)
      {
            let logFilePath = ensurePathEndSlash(resultDirectory)+'/AutoProcessed/AutoIntegrate.log';
            if (! File.exists(logFilePath))
            {
                  test.addError("Log file '" + logFilePath + "' not found");
            }
            else 
            {
                  let log_lines = File.readLines( logFilePath);
                  for (let i in log_lines)
                  {
                        let line = log_lines[i];
                        let errorIndex = line.indexOf("Error: ");
                        if (errorIndex>0)
                        {
                              test.addError("log - " + line.substring(errorIndex));
                        }
                  }
            }
      }

      // ------------------------------------------------------------

      return {
            'Test': Test,
            'loadTest': loadTest,
            'loadTestList': loadTestList,
            'forceCloseAll': forceCloseAll,
            'buildReferenceState': buildReferenceState,
            'saveReferenceState': saveReferenceState,
            'compareReferenceState': compareReferenceState,
            'parse_log_for_errors': parse_log_for_errors,
            'resolveRelativePath': resolveRelativePath
      };
}) ();




// -----------------------------------------------------------------------------------------
// These commands can be execute outside of the Dialog (and also in the dialog),
// they change values that can be changed by settings and do commands
// not processed by Autointegrate, like closing all windows.
let autotest_control_commands = {
                  
      'setPar': function(test, command) {
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
            
      'setPrefix': function(test, command) {
            let prefix = command[1];
            console.noteln("Autotest: Set prefix to ", prefix);
            ppar.win_prefix = prefix;
      },

      'setLastDir': function(test, command) {
            let lastDir = command[1];
            console.noteln("Autotest: Set lastDir to ", lastDir);
            ppar.lastDir = lastDir;
      },

      'setOutputRootDir': function(test, command) {
            let outputDir = command[1];
            console.noteln("Autotest: Set outputRootDir to ", outputDir);
            outputRootDir = outputDir;
      },
      'forceCloseAll': function(test, command) {
                  Autotest.forceCloseAll();
      },
      'loadImage': function(test, command) {
            //console.writeln("DEBUG: loadImage exec ", JSON.stringify(command));
            let name = command[1];
            let path = command[2];
            let resolved_path = Autotest.resolveRelativePath(path, autotest_result_directory);
            try {
                  let window = ImageWindow.open(resolved_path)[0];
                  window.mainView.id = name;
                  window.show();
            } catch (x) {
                  console.warningln("Autotest: Cannot load image '", name, "' from '", resolved_path, "' error: " + x);
                  test.addError(" Cannot load image '", name, "' from '", resolved_path, "' error: " + x);
            }
      },
      'saveImage': function(test, command) {
            let name = command[1];
            let path = command[2];
            let resolved_path = Autotest.resolveRelativePath(path, autotest_result_directory);        
            try {
                  let window = ImageWindow.windowById(name);
                  // Save image. No format options, no warning messages, 
                  // no strict mode, no overwrite checks.
                  let success = window.saveAs(resolved_path, false, false, false, false);
                  if (!success)
                  {
                        console.warningln("Autotest: image '", name, "' not saved to '", resolved_path);
                        test.addError(" Cannot image '", name, "' not saved to '", resolved_path);      
                  }
            } catch (x) {
                  console.warningln("Autotest: Cannot save image '", name, "' to '", resolved_path, "' error: " + x);
                  test.addError(" Cannot save image '", name, "' to '", resolved_path, "' error: " + x);
            }

      },
      'noteln': function(test, command) {
            let text = command[1];
            console.noteln(text);
      },
      'warningln': function(test, command) {
            let text = command[1];
            console.warningln(text);
      },
      'writeln': function(test, command) {
            let text = command[1];
            console.writeln(text);
      },
 
}

// These commands are executed outside of the dialog execute context but
// requires the dialog as a parameter, for example to execute the dialog.
let autotest_launch_commands = {
                  
      'execute': function(dialog, test, command) {
            //console.writeln("DEBUG: autotest_launch_commands, execute command: ",command.length," ", JSON.stringify(command));
            let command_list = [["run"]];  // default command if none is specified
            if (command.length > 1)
            {
                  command_list = command[1]; 
            }
            console.noteln("Autotest: execute dialog with commands: ", JSON.stringify(command_list));
            // Update the command list to the parameter of 'execute'
            dialog.command_list = command_list;
            dialog.execute();

      },
            

}

// -----------------------------------------------------------------------------------------

// A subclass of AutoIntegrateDialog created for each test to execute the specific test file
function AutoIntegrateTestDialog(test)
{
      this.__base__ = AutoIntegrateDialog;
      this.__base__();
      this.command_list = ["run"]; // Default command, updated at test creation
      this.current_test = test;
      this.test_name = test.test_name;
      this.exit_requested = false;

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
            try {
                  let autosetup_file = this.current_test.autosetup_path;
                  console.noteln("Autotest: onExecute() for test '", this.test_name, '", loading file list and settings from ', autosetup_file);
                  var pagearray = parseJsonFile(autosetup_file, false);

                  for (var i = 0; i < pagearray.length; i++) {
                        if (pagearray[i] != null) {
                              addFilesToTreeBox(this, i, pagearray[i]);
                        }
                  }
                  updateInfoLabel(this);
      
                  for (let command_index=0; command_index<this.command_list.length; command_index++)
                  {
                        let command = this.command_list[command_index];
                        let commandNmb = command_index+1;
                        console.noteln("Autotest: ", this.test_name, " command ",commandNmb, ": ", JSON.stringify(command));
                        this.autotest_execute_dialog_command(this.current_test, command);
                        //console.writeln("DEBUG: execution of command '", command[0], "' terminated");
                        // Nothing to do after exit at this level
                        if (this.exit_requested) {
                              if (command_index<this.command_list.length-1)
                              {
                                    console.warningln("Autotest: Exiting before end of command list due to 'exit'");
                              }
                              break;
                        }
                  }
                  if (!this.exit_requested)
                  {
                        console.warningln("Autotest: Exiting window at end of command list");
                        this.exit_requested = true;
                        this.cancelTimer.start();  
                  }
            } catch(x) {
                  console.criticalln("Autotest: Exception in onExecute: " + x);
                  this.current_test.addError("Exception in onExecute: " + x);
                  console.warningln("Autotest: losing window due to error");
                  this.exit_requested = true;
                  this.cancelTimer.start();
            }

      }



      // The following commands must be executed in the context of onExecute of autoIntegrateDialog,
      // the first parameter is the dialog, the second the full command array
      // with the name of the command as the first element.
      this.dialog_commands = {

            // Must be in context of dialog because execute a button
            'closeAllPrefix': function(autoIntegrateDialog, test, command) {
                  console.noteln("Autotest: Closing all prefix windows");
                  // Not in 'this', for whatever reason
                  closeAllPrefixButton.onClick();
            },

            // Execute the 'run' command
            'run': function(autoIntegrateDialog, test, command) {

                  Autotest.saveReferenceState();

                  // The next beginLog will save the autoexex console log.
                  AutotestLog.trapBeginLog();

                  // TODO note that the log must be explored
                  console.noteln("Autotest: Executing 'Run' on test data");
                  autoIntegrateDialog.run_Button.onClick();
                  AutotestLog.ensureAutotestLog();
                  Autotest.compareReferenceState();
            },

            // Execute the 'continue' command
            'continue': function(autoIntegrateDialog, test, command) {
                  Autotest.saveReferenceState();

                  // The next beginLog will save the autoexex console log.
                  AutotestLog.trapBeginLog();

                   // TODO note that the log must be explored
                  console.noteln("Autotest: Executing autoContinue on test data");
                  autoIntegrateDialog.autoContinueButton.onClick();
                  AutotestLog.ensureAutotestLog();
                  Autotest.compareReferenceState();
            },

            // execute the exit dialog command, this closes the dialog and exit
            // the onExecute environment.
            // Must be called aysychronously to avoid some deadlock
            'exit': function(autoIntegrateDialog, test, command) {
                  console.noteln("Autotest: Run completed, removing window in 2 seconds");
                  autoIntegrateDialog.exit_requested = true;
                  autoIntegrateDialog.cancelTimer.start();
            },
      }

      this.autotest_execute_dialog_command = function(test, command)
      {
            let command_name = command[0];
            // First check commands specific to dialog
            if (command_name in this.dialog_commands) {
                  let command_function = this.dialog_commands[command_name];
                  command_function(this, test, command);

            // Then commands generic
            } else if (command_name in autotest_control_commands) {
                  let command_function = autotest_control_commands[command_name];
                  command_function(test, command);
            } else {
                  // TODO Log to error, option to exit
                  console.warningln("Autotest: Unknown dialog or control command '", command_name, "' ignored");         
            }
      }

}

AutoIntegrateTestDialog.prototype = new AutoIntegrateDialog();




function autotest_execute_launch_command(dialog, test, command)
{
      let command_name = command[0];
      if (command_name in autotest_control_commands) {
            let command_function = autotest_control_commands[command_name];
            command_function(test, command);
      } else if (command_name in autotest_launch_commands) {
            let command_function = autotest_launch_commands[command_name];
            command_function(dialog, test, command);
      } else {
            // TODO Log to error, option to exit
            console.warningln("Autotest: Unknown launch or control command '", command_name, "' ignored");         
      }
}

// Execute a single test sequence
function execute_test(test, resultRootDirectory)
{
      let test_name = test.test_name;
      let autosetup_file_path = test.autosetup_path;
      let command_list = test.command_list;

      let resultDirectory = ensurePathEndSlash((resultRootDirectory+test_name).trim());
      console.noteln("===================================================");
      console.noteln("Autotest: Executing test '", test_name, "' with results in ", resultDirectory);
      console.noteln("Autotest: Commands to execute: ")
      for (let i=0; i<command_list.length; i++)
      {
            console.noteln("    ", JSON.stringify(command_list[i]));
      }

      try {

            outputRootDir = resultDirectory;

            let dialog = new AutoIntegrateTestDialog(test);

            for (let command_index in command_list)
            {
                  let command = command_list[command_index];
                  let commandNmb = 1+parseInt(command_index);
                  console.noteln("Autotest: ", test_name, " command ",commandNmb, ": ", JSON.stringify(command));
                  autotest_execute_launch_command(dialog, test, command);
                  //console.writeln("DEBUG: top level command '", command[0], "' completed")
            }

            Autotest.parse_log_for_errors(test, resultDirectory);
      
            console.noteln("Autotest: ", test_name, "' completed normally");
      }
       catch (x) {
            console.criticalln("Autotest: '", test_name, " Exception in execute_test(): ",  x );
            test.addError("Exception in execute_test(): " + x);
      }
}




// -----------------------------------------------------------------------------------------
// The try block also open a local scope for let variables to avoid conflicts with the main script
try
      {

      AutotestLog.initializeAutotestLog();

      // Autotest.forceCloseAll();

      autotest_logheader();

      autotest_initialize();  

      // Override function to disable persistent settings
      savePersistentSettings = function()
      {
            console.noteln("Autotest: Persistent setting are not saved during Autotest")
      }

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

      // If not sepecified
      if (autotest_logfile_path == null)
      {
            let log_date = new Date;
            let uniqueFilenamePart = 
            format( "_%04d%02d%02d_%02d%02d%02d",
                                    log_date.getFullYear(), log_date.getMonth() + 1, log_date.getDate(),
                                    log_date.getHours(), log_date.getMinutes(), log_date.getSeconds());
            autotest_logfile_path = ensurePathEndSlash(autotest_result_directory) + "autotest" +  uniqueFilenamePart + ".log";
      }

 
      // Execute tests
      for (let i =0; i<tests.length; i++)  
      {
            let test = tests[i];
            execute_test(test, autotest_result_directory);
      }

      console.noteln("-----------------------------------------------------");
      console.noteln("Autotest: Test results in directory ", autotest_result_directory);
      for (let i =0; i<tests.length; i++)  
      {
            let test = tests[i];
            let test_name = test.test_name;
            let errors =  test.errors;
            if (errors.length == 0)
            {
                  console.noteln("    ",test_name, " ok");
            } else {
                  console.noteln("    ",test_name, ": errors");
                  for (let error_index in errors)
                  {
                        console.noteln("         ", errors[error_index]);
                  }
            }
      }

      AutotestLog.saveAutotestLog();
      // null in case of error writing
      if (autotest_logfile_path != null) console.noteln("Autotest: logfile written to " + autotest_logfile_path);

      console.noteln("TestAutoIntegrate terminated");
 
}
catch (x) {
      AutotestLog.restoreOriginalConsoleLog();
      console.noteln("TestAutoIntegrate terminated");
      console.writeln( "Autotest: Error: " + x );
}



