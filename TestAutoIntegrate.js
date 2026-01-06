/*
 * AutoIntegrate Full Script Test Runner
 * 
 * Usage:
 *   1. Run this script in PixInsight
 *   2. Check console for results
 */

// run  -a="autotest_tests_default.txt" --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestAutoIntegrate.js"
// run  -a="autotest_tests1.txt" --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestAutoIntegrate.js"

#define TEST_AUTO_INTEGRATE

#include "../AutoIntegrate/AutoIntegrate.js"

#include "TestUtils.js"

// ============================================================================
//    AutoIntegrateTestFullProcessing
// ============================================================================

function AutoIntegrateTestFullProcessing()
{

this.__base__ = Object;
this.__base__();

var testutils = new AutoIntegrateTestUtils();
this.testutils = testutils;

var TestRunner = testutils.TestRunner;

var run_results = [];

var test_start_time = new Date();

// ============================================================================
// Helper functions
// ============================================================================

// Load a test file. Test file has one text on each line in the format: test-script, test-name
this.loadTestFile = function(testFilePath) {

      if (!File.exists(testFilePath)) {
         TestRunner.fail("LoadTestFile", "Test file does not exist: " + testFilePath);
         throw new Error("Test file does not exist: " + testFilePath);
      }
      let lines = File.readLines(testFilePath);
      var tests = [];
      for (let line of lines) {
         line = line.trim();
         if (line === "" || line.startsWith("#")) {
            continue; // Skip empty lines and comments
         }
         var parts = line.split(",");
         if (parts.length !== 2) {
            console.writeln("Invalid test line (skipping): " + line);
            TestRunner.fail("LoadTestFile", "Invalid test line: " + line);
            continue;
         }
         var scriptPath = parts[0].trim();
         var testName = parts[1].trim();
         tests.push( { script: scriptPath, name: testName } );
      }
      return tests;
};

function openImageWindowFromFile(fileName)
{
      var id = File.extractName(fileName);
      var imageWindows = ImageWindow.open(fileName);
      if (!imageWindows || imageWindows.length == 0) {
            TestRunner.addError("*** openImageWindowFromFile Error: imageWindows.length: " + imageWindows.length + ", file " + fileName);
            return null;
      }
      var imageWindow = imageWindows[0];
      if (imageWindow == null) {
            TestRunner.addError("*** openImageWindowFromFile Error: Can't read file: " + fileName);
            return null;
      }
      return imageWindow;
}

function loadFinalAndReferenceImages()
{
      // Go through run_results and loaf final and reference images for all tests
      console.writeln("Loading final and reference images for all tests...");
      for (var i = 0; i < run_results.length; i++) {
         var run = run_results[i];
         if (run.final_image_file != '' && File.exists(run.final_image_file)) {
            let reference_image = File.extractDrive(run.final_image_file) + File.extractDirectory(run.final_image_file) +
                                    "/reference_" + File.extractName(run.final_image_file) + ".xisf";
            if (File.exists(reference_image)) {
               console.writeln("Loading final and reference images for test: " + run.test_name);
               // Check that file date is later than test start time
               // Get file modification time
               var fileInfo = new FileInfo(run.final_image_file);
               var fileTime = fileInfo.lastModified;
               if (fileTime < test_start_time) {
                  TestRunner.addError("Final image file is older than test start time for test: " + run.test_name);
               }
               let final_img = openImageWindowFromFile(run.final_image_file);
               if (final_img) {
                  final_img.mainView.id = run.test_name + "_" + File.extractName(run.final_image_file);
                  // Final image on the upper left corner
                  final_img.position = new Point(5, 5);
                  final_img.show();
               }
               let reference_img = openImageWindowFromFile(reference_image);
               if (reference_img) {
                  reference_img.mainView.id = run.test_name + "_" + File.extractName(reference_image);
                  // Reference image on the right of the final image
                  reference_img.position = new Point(final_img.width + 20, 5);
                  reference_img.show();
               }

            } else {
               TestRunner.addError("Reference image not found for test: " + run.test_name);
            }

         } else {
            TestRunner.addError("Final image not found for test: " + run.test_name);
         }
      }
}

// ============================================================================
// Detailed Tests
// ============================================================================

function runTestCase(testscript, testname) {
      
      TestRunner.beginLog(testname);

      console.writeln("Testing " + testname + " ...");

      try {
         var autointegrate = new AutoIntegrate();

         autointegrate.test_initialize_new();

         autointegrate.autointegrate_main(testscript);

         var this_run = autointegrate.get_run_results();
         this_run.test_name = testname;

         run_results.push(this_run);

         testutils.parseTestmodeLogForErrors(this_run.testmode_log_name);

         if (this_run.fatal_error != '') {
            TestRunner.fail(testname, "Fatal error during processing: " + this_run.fatal_error);
         } else if (!testutils.parseTestmodeLogForErrors(this_run.testmode_log_name)) {
            TestRunner.fail(testname, "Errors found in testmode log file " + this_run.testmode_log_name);
         } else {
            TestRunner.pass(testname);
         }

         autointegrate = null;
      } catch (e) {
         TestRunner.fail(testname, "Exception: " + (e.message || String(e)));
      }

      console.writeln("Finished test: " + testname);

      TestRunner.endLog();

      gc();
}

// ============================================================================
// Run All Tests
// ============================================================================

function runAllTests(testInstance) {

      var deleteResult = testInstance.testutils.deleteOldLogFiles(testInstance.testutils.testResultsDir, 365);
      testutils.forceCloseAll();
      gc();

      TestRunner.reset();

      if (jsArguments.length > 0) {
            var testFileName = jsArguments[0];
      } else {
            var testFileName = "autotest_tests_default.txt";
      }

      var tests = this.loadTestFile(this.testutils.testDir + testFileName);

      var testNames = []
      for (var i = 0; i < tests.length; i++) {
         testNames.push(tests[i].name);
      }

      var progressDialog = new AutoIntegrateTestProgressDialog(TestRunner);
      progressDialog.initializeTests(testNames);
      progressDialog.show();
      processEvents();

      for (var i = 0; i < tests.length; i++) {

         if (TestRunner.iscanceled()) {
            TestRunner.fail("RunAllTests", "Test run canceled by user.");
            break;
         }

         var test = tests[i];

         progressDialog.startTest(i);

         console.writeln("Running test: " + test.name + " (" + test.script + ")");
         runTestCase(test.script, test.name);

         progressDialog.completeTest(i, TestRunner.islastsuccess());

         testutils.forceCloseAll();
         gc();
      }

      // Load final and reference images for all tests
      loadFinalAndReferenceImages();

      // Get summary
      var summary = progressDialog.getSummary();
      console.writeln(format("\n=== Test Summary ==="));
      console.writeln(format("Total: %d, Passed: %d, Failed: %d", 
                           summary.total, summary.passed, summary.failed));
      console.writeln(format("Total time: %.2fs", summary.totalTime));

      if (TestRunner.summary()) {
         console.writeln("All tests passed.");
      } else {
         console.criticalln("Some tests failed. See above for details.");
      }
      console.writeln("");
      console.writeln("Deleted " + deleteResult.deleted + " old log files, keeping " + deleteResult.kept + " files.");
      if (deleteResult.errors > 0) {
         console.writeln("Encountered " + deleteResult.errors + " errors while deleting old log files.");
      }

      // Dialog stays open for user to review results
      progressDialog.execute();

}

this.runAllTests = runAllTests;

} // AutoIntegrateTestFullProcessing

AutoIntegrateTestFullProcessing.prototype = new Object;

// ============================================================================
// Main Entry Point
// ============================================================================

function main() {
   console.show();
   console.writeln("AutoIntegrate Full Processing Test Runner");
   console.writeln("─".repeat(30));
   console.writeln("");

   var test = new AutoIntegrateTestFullProcessing();

   test.runAllTests(test);

   test = null;
   gc();
}

main();
