/*
 * AutoIntegrate Full Script Test Runner
 * 
 * Usage:
 *   1. Run this script in PixInsight
 *   2. Check console for results
 */

// run  -a="autotest_tests_default.txt" --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestAutoIntegrate.js"
// run  --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestAutoIntegrate.js"

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

function runAllTests() {

      testutils.forceCloseAll();
      gc();

      TestRunner.reset();

      if (jsArguments.length > 0) {
            var testFileName = jsArguments[0];
      } else {
            var testFileName = "autotest_tests3.txt";
      }

      var tests = this.loadTestFile(this.testutils.testDir + testFileName);

      for (var i = 0; i < tests.length; i++) {
         var test = tests[i];
         console.writeln("Running test: " + test.name + " (" + test.script + ")");
         runTestCase(test.script, test.name);
         testutils.forceCloseAll();
         gc();
      }

      // Load final and reference images for all tests
      loadFinalAndReferenceImages();

      return TestRunner.summary();
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

   var deleteResult = test.testutils.deleteOldLogFiles(test.testutils.testResultsDir, 365);

   if (test.runAllTests()) {
      console.writeln("All tests passed successfully.");
   } else {
      console.criticalln("Some tests failed. See above for details.");
   }

   console.writeln("");
   console.writeln("Deleted " + deleteResult.deleted + " old log files, keeping " + deleteResult.kept + " files.");
   if (deleteResult.errors > 0) {
      console.writeln("Encountered " + deleteResult.errors + " errors while deleting old log files.");
   }

   test = null;
   gc();
}

main();
