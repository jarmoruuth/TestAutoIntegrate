/*
 * AutoIntegrate Full Script Test Runner
 *
 * Usage:
 *   1. Run this script in PixInsight
 *   2. Check console for results
 */

// All tests
// run  -a="autotest_tests_default.txt" --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestAutoIntegrate.js"

// One test
// run  -a="autotest_tests1.txt" --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestAutoIntegrate.js"

// Show final and reference images side by side in a single image, add argument side_by_side
// run  -a="autotest_tests_default.txt" -a="side_by_side" --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestAutoIntegrate.js"

// Calibrate test
// run  -a="autotest_tests_calibrate.txt" --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestAutoIntegrate.js"

// Standalone tests
// run --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestStandalone.js"

// Start AutoIntegrate script with defaults
// run -a="do_not_read_settings" -a="do_not_write_settings" --execute-mode=auto "C:/Users/jarmo_000/GitHub/AutoIntegrate/AutoIntegrate.js"

#engine v8
#feature-id    TestAutoIntegrate
#feature-info  Automated testing for AutoIntegrate full script

#define TEST_AUTO_INTEGRATE

#include "../AutoIntegrate/AutoIntegrate.js"

#include "TestUtils.js"

// ============================================================================
//    AutoIntegrateTestFullProcessing
// ============================================================================

class AutoIntegrateTestFullProcessing extends Object
{

constructor() {
   super();

   this.testutils = new AutoIntegrateTestUtils();
   this.run_results = [];
   this.test_start_time = new Date();
   this.autointegrate = null;
   this.side_by_side = false;    // show final and reference images combined into one image
}

// ============================================================================
// Helper functions
// ============================================================================

// Load a test file. Test file has one text on each line in the format: test-script, test-name
loadTestFile(testFilePath) {

      if (!File.exists(testFilePath)) {
         this.testutils.fail("LoadTestFile", "Test file does not exist: " + testFilePath);
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
         if (parts.length < 2) {
            console.writeln("Invalid test line (skipping): " + line);
            this.testutils.fail("LoadTestFile", "Invalid test line: " + line);
            continue;
         }
         var scriptPath = parts[0].trim();
         var testName = parts[1].trim();
         // Optional third part for test type
         var testType = parts.length >= 3 ? parts[2].trim().toLowerCase() : null;
         tests.push( { script: scriptPath, name: testName, type: testType } );
      }
      return tests;
}

openImageWindowFromFile(fileName)
{
      var id = File.extractName(fileName);
      var imageWindows = ImageWindow.open(fileName);
      if (!imageWindows || imageWindows.length == 0) {
            this.testutils.addError("*** openImageWindowFromFile Error: imageWindows.length: " + imageWindows.length + ", file " + fileName);
            return null;
      }
      var imageWindow = imageWindows[0];
      if (imageWindow == null) {
            this.testutils.addError("*** openImageWindowFromFile Error: Can't read file: " + fileName);
            return null;
      }
      return imageWindow;
}

// Copy source image into target image at point. A grayscale source is copied
// to every channel of a color target.
copyImageAt(target, source, point)
{
      if (source.numberOfChannels == 1 && target.numberOfChannels > 1) {
         for (var c = 0; c < target.numberOfChannels; c++) {
            target.apply(source, ImageOp.Mov, point, c);
         }
      } else {
         target.apply(source, ImageOp.Mov, point, 0);
      }
}

// Combine final (left) and reference (right) images into a single new image
// so there is only one window to check and close. Original windows are closed.
// Returns false if combining failed, then the original windows are kept.
showSideBySide(final_img, reference_img, id)
{
      var combined = null;
      try {
         var fimg = final_img.mainView.image;
         var rimg = reference_img.mainView.image;
         var gap = 20;
         var channels = Math.max(fimg.numberOfChannels, rimg.numberOfChannels);
         var width = fimg.width + gap + rimg.width;
         var height = Math.max(fimg.height, rimg.height);

         combined = new ImageWindow(width, height, channels, 32, true, channels > 1, id);
         var view = combined.mainView;
         view.beginProcess(UndoFlag.NoSwapFile);
         view.image.fill(0.5);   // gray gap and borders if image sizes differ
         this.copyImageAt(view.image, fimg, new Point(0, 0));
         this.copyImageAt(view.image, rimg, new Point(fimg.width + gap, 0));
         view.endProcess();
      } catch (e) {
         console.warningln("Could not combine final and reference images for " + id + ", showing them separately: " + e);
         if (combined) {
            combined.forceClose();
         }
         return false;
      }
      final_img.forceClose();
      reference_img.forceClose();
      combined.position = new Point(5, 5);
      combined.show();
      return true;
}

loadFinalAndReferenceImages()
{
      try {
         // Go through run_results and load final and reference images for all tests
         console.writeln("Loading final and reference images for all tests...");
         for (var i = 0; i < this.run_results.length; i++) {
            var run = this.run_results[i];
            if (run.final_image_file != undefined && run.final_image_file && run.final_image_file != '' && File.exists(run.final_image_file)) {
               let reference_image = File.extractDrive(run.final_image_file) + File.extractDirectory(run.final_image_file) +
                                       "/reference_" + File.extractName(run.final_image_file) + ".xisf";
               if (File.exists(reference_image)) {
                  console.writeln("Loading final and reference images for test: " + run.test_name);
                  // Check that file date is later than test start time
                  var fileInfo = new FileInfo(run.final_image_file);
                  var fileTime = fileInfo.lastModified;
                  if (fileTime < this.test_start_time) {
                     this.testutils.addError("Final image file is older than test start time for test: " + run.test_name);
                  }
                  let final_img = this.openImageWindowFromFile(run.final_image_file);
                  if (final_img) {
                     final_img.mainView.id = run.test_name + "_" + File.extractName(run.final_image_file);
                  }
                  let reference_img = this.openImageWindowFromFile(reference_image);
                  if (reference_img) {
                     reference_img.mainView.id = run.test_name + "_" + File.extractName(reference_image);
                  }
                  if (this.side_by_side && final_img && reference_img
                      && this.showSideBySide(final_img, reference_img, run.test_name + "_final_vs_reference"))
                  {
                     continue;
                  }
                  if (final_img) {
                     // Final image on the upper left corner
                     final_img.position = new Point(5, 5);
                     final_img.show();
                  }
                  if (reference_img) {
                     // Reference image on the right of the final image
                     reference_img.position = new Point(final_img ? final_img.width + 20 : 5, 5);
                     reference_img.show();
                  }

               } else {
                  this.testutils.addError("Reference image not found for test: " + run.test_name);
               }

            } else {
               this.testutils.addError("Final image not found for test: " + run.test_name);
            }
         }
      } catch (e) {
         this.testutils.addError("Error loading final and reference images: " + e.message);
      }
}

// ============================================================================
// Detailed Tests
// ============================================================================

runTestCase(testscript, testname, testtype) {

      this.testutils.beginLog(testname);
      this.testutils.progress("Test begin, script " + testscript);

      console.writeln("Testing " + testname + " ...");

      try {
         var autointegrate = new AutoIntegrate();
         this.autointegrate = autointegrate;

         autointegrate.test_initialize_new();
         autointegrate.test_set_progress_callback((txt) => this.testutils.progress(txt));

         if (testtype == "nopreview") {
            autointegrate.test_nopreview();
         }

         this.testutils.set_cancel_callback(() => this.autointegrate.test_cancel());

         autointegrate.autointegrate_main(testscript);

         this.testutils.set_cancel_callback(null);

         var this_run = autointegrate.test_get_run_results();
         this_run.test_name = testname;

         this.run_results.push(this_run);

         // Parse the testmode log only once, it adds an error for every problem it finds.
         var testmode_log_ok = this.testutils.parseTestmodeLogForErrors(this_run.testmode_log_name);

         if (this_run.fatal_error != '') {
            this.testutils.fail(testname, "Fatal error during processing: " + this_run.fatal_error);
         } else if (!testmode_log_ok) {
            this.testutils.fail(testname, "Errors found in testmode log file " + this_run.testmode_log_name);
         } else {
            this.testutils.pass(testname);
         }

         autointegrate.test_set_progress_callback(null);
         autointegrate.test_done();
         autointegrate = null;
         this.autointegrate = null;

      } catch (e) {
         this.testutils.fail(testname, "Exception: " + (e.message || String(e)));
      }

      console.writeln("Finished test: " + testname);

      this.testutils.endLog();
      this.testutils.progress("Test end, " + (this.testutils.islastsuccess() ? "PASS" : "FAIL"));
}

// ============================================================================
// Run All Tests
// ============================================================================

runAllTests() {

      var deleteResult = this.testutils.deleteOldLogFiles(this.testutils.testResultsDir, 365);
      this.testutils.forceCloseAll();

      this.testutils.reset();
      this.testutils.startProgress();

      var testFileName = "autotest_tests_default.txt";
      for (var i = 0; i < Runtime.jsArguments.length; i++) {
            if (Runtime.jsArguments[i] == "side_by_side") {
                  this.side_by_side = true;
            } else {
                  testFileName = Runtime.jsArguments[i];
            }
      }

      var tests = this.loadTestFile(this.testutils.testDir + testFileName);

      var testNames = [];
      for (var i = 0; i < tests.length; i++) {
         testNames.push(tests[i].name);
      }

      var progressDialog = new AutoIntegrateTestProgressDialog(this.testutils);
      progressDialog.initializeTests(testNames);
      progressDialog.show();
      CoreApplication.processEvents();

      for (var i = 0; i < tests.length; i++) {

         if (this.testutils.iscanceled()) {
            this.testutils.fail("RunAllTests", "Test run canceled by user.");
            break;
         }

         var test = tests[i];

         progressDialog.startTest(i);

         console.writeln("Running test: " + test.name + " (" + test.script + ")");
         this.runTestCase(test.script, test.name, test.type);

         progressDialog.completeTest(i, this.testutils.islastsuccess(), this.testutils.lasterror());

         this.testutils.forceCloseAll();
      }

      this.testutils.progress("All tests done, loading final and reference images", "autotest");

      // Load final and reference images for all tests
      this.loadFinalAndReferenceImages();

      this.testutils.progress("Test run finished", "autotest");

      // Get summary
      var summary = progressDialog.getSummary();
      console.writeln(format("\n=== Test Summary ==="));
      console.writeln(format("Total: %d, Passed: %d, Failed: %d",
                           summary.total, summary.passed, summary.failed));
      console.writeln(format("Total time: %.2fs", summary.totalTime));
      this.testutils.progressSummary(summary);

      if (this.testutils.summary()) {
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

} // AutoIntegrateTestFullProcessing

// ============================================================================
// Main Entry Point
// ============================================================================

function main() {
   console.show();
   console.writeln("AutoIntegrate Full Processing Test Runner");
   console.writeln("─".repeat(30));
   console.writeln("");

   var test = new AutoIntegrateTestFullProcessing();

   test.runAllTests();

   test = null;
}

main();
