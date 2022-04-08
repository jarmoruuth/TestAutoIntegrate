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



function autotest_logheader()
{
      pixinsight_version_str = CoreApplication.versionMajor + '.' + CoreApplication.versionMinor + '.' + 
      CoreApplication.versionRelease + '-' + CoreApplication.versionRevision;
      pixinsight_version_num = CoreApplication.versionMajor * 1e6 + 
            CoreApplication.versionMinor * 1e4 + 
            CoreApplication.versionRelease * 1e2 + 
            CoreApplication.versionRevision;
      console.noteln("======================================================");
      console.noteln("Automatic test of AutoIntegrate");
      console.noteln(autointegrate_version + ", PixInsight v" + pixinsight_version_str + ' (' + pixinsight_version_num + ')');

      console.noteln("======================================================");
}


function autotest_initialize(test_directory)
{


      setDefaultDirs();

      setParameterDefaults();

      ppar.win_prefix = '';
      ppar.lastDir = test_directory;

      // prefix_array ?
      ppar.userColumnCount = -1; 
}



function AutoIntegrateTestDialog(test_file)
{
      this.__base__ = AutoIntegrateDialog;
      this.__base__();
      this.test_file = test_file;

      this.cancelTimer = new Timer( 2, false );
      var dlg = this.dialog;
      this.cancelTimer.onTimeout = function()
      {
         dlg.cancelTimer = null;
         //console.writeln("Cancelling dlg", dlg);
         dlg.cancel();
      };


      this.onExecute = function(h)
      {
            console.noteln("onExecute() for test '", this.test_file, '", loading parameters and file list');
            var pagearray = parseJsonFile(this.test_file, false);
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
            //exitFromDialog();

            this.cancelTimer.start();
            //this.dialog.cancel();
            //console.writeln("DEBUG timer started");
        }

}

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
            console.writeln("Test '", test_name, "in error: ",  x );
      }
}

AutoIntegrateTestDialog.prototype = new AutoIntegrateDialog();

autotest_logheader();

var autotest_test_directory = "D:/AI_TESTS"
var autotest_work_directory = ensurePathEndSlash("D:/AI_WORK");

let autotest_test_directories = searchDirectory( autotest_test_directory+"/AutoSetup.json", true );
console.noteln(autotest_test_directories.length, " test in ", autotest_test_directory);

for (let test_index in autotest_test_directories)
{
      let test_specification = autotest_test_directories[test_index];
      let test_directory = File.extractDirectory(test_specification);
      let test_name = File.extractName(test_directory);
      execute_test(test_name, autotest_work_directory, test_specification);
}


console.noteln("TestAutoIntegrate terminated");

