/*
 * AutoIntegrate Standalone Test Runner
 * 
 * Simple smoke tests for all AutoIntegrate standalone scripts.
 * 
 * Usage:
 *   1. Run this script in PixInsight
 *   2. Check console for results
 */

// Run this test:
// run --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestStandalone.js"

// Run standalone scripts without tests:
// run -a="do_not_read_settings" --execute-mode=auto "C:/Users/jarmo_000/GitHub/AutoIntegrate/ImageEnhancements.js"
// run -a="do_not_read_settings" --execute-mode=auto "C:/Users/jarmo_000/GitHub/AutoIntegrate/ImageStretching.js"
// run -a="do_not_read_settings" --execute-mode=auto "C:/Users/jarmo_000/GitHub/AutoIntegrate/NarrowbandCombinations.js"
// run -a="do_not_read_settings" --execute-mode=auto "C:/Users/jarmo_000/GitHub/AutoIntegrate/GradientCorrection.js"

// Full processing, all tests
// run  -a="autotest_tests_default.txt" --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestAutoIntegrate.js"

// Full processing, one test
// run  -a="autotest_tests1.txt" --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestAutoIntegrate.js"

#engine v8
#feature-id    TestStandalone
#feature-info  Automated testing for AutoIntegrate standalone tools

#define AUTOINTEGRATE_NO_MAIN

#include "../AutoIntegrate/ImageEnhancements.js"
#include "../AutoIntegrate/ImageStretching.js"
#include "../AutoIntegrate/NarrowbandCombinations.js"
#include "../AutoIntegrate/GradientCorrection.js"
#include "../AutoIntegrate/SelectiveColor.js"

#include "TestUtils.js"

// ============================================================================
//    AutoIntegrateTestStandalone
// ============================================================================

class AutoIntegrateTestStandalone extends Object
{

    constructor() {
        super();

this.testutils = new AutoIntegrateTestUtils();

this.TestRunner = this.testutils;

this.autoIntegrateDir = this.testutils.testRootDir + "/AutoIntegrate/";

// ============================================================================
// Script Definitions
// ============================================================================

/*
 * Define all your standalone scripts here.
 * 
 * Each entry:
 *   name: Display name
 *   dialogClass: Constructor name for the dialog
 *   includes: Files to include (relative to script path)
 *   constructors: Constructor names that must exist before testing
 */

this.scripts = [
   {
      name: "ImageStretching",
      dialogClass: "AutoIntegrateImageStretchingDialog",
      includes: [
         this.autoIntegrateDir + "AutoIntegrateGlobal.js",
         this.autoIntegrateDir + "AutoIntegrateUtil.js",
         this.autoIntegrateDir + "AutoIntegrateEngine.js",
         this.autoIntegrateDir + "AutoIntegrateGUITools.js",
         this.autoIntegrateDir + "AutoIntegratePreview.js",
         this.autoIntegrateDir + "AutoIntegrateEnhancementsGUI.js",
      ],
      constructors: [
         "AutoIntegrateGlobal",
         "AutoIntegrateUtil",
         "AutoIntegrateEngine",
         "AutoIntegrateGUITools",
         "AutoIntegratePreviewControl",
         "AutoIntegrateEnhancementsGUI",
         "AutoIntegrateImageStretchingDialog"
      ]
   },
   
   {
      name: "ImageEnhancements",
      dialogClass: "AutoIntegrateImageEnhancementsDialog",
      includes: [
         this.autoIntegrateDir + "AutoIntegrateGlobal.js",
         this.autoIntegrateDir + "AutoIntegrateUtil.js",
         this.autoIntegrateDir + "AutoIntegrateEngine.js",
         this.autoIntegrateDir + "AutoIntegrateGUITools.js",
         this.autoIntegrateDir + "AutoIntegratePreview.js",
         this.autoIntegrateDir + "AutoIntegrateEnhancementsGUI.js",
      ],
      constructors: [
         "AutoIntegrateGlobal",
         "AutoIntegrateUtil",
         "AutoIntegrateEngine",
         "AutoIntegrateGUITools",
         "AutoIntegratePreviewControl",
         "AutoIntegrateEnhancementsGUI",
         "AutoIntegrateImageEnhancementsDialog"
      ]
   },

   {
      name: "NarrowbandCombinations",
      dialogClass: "AutoIntegrateNarrowbandCombinationsDialog",
      includes: [
         this.autoIntegrateDir + "AutoIntegrateGlobal.js",
         this.autoIntegrateDir + "AutoIntegrateUtil.js",
         this.autoIntegrateDir + "AutoIntegrateEngine.js",
         this.autoIntegrateDir + "AutoIntegrateGUITools.js",
         this.autoIntegrateDir + "AutoIntegratePreview.js"
      ],
      constructors: [
         "AutoIntegrateGlobal",
         "AutoIntegrateUtil",
         "AutoIntegrateEngine",
         "AutoIntegrateGUITools",
         "AutoIntegratePreviewControl",
         "AutoIntegrateNarrowbandCombinationsDialog"
      ]
   },

   {
      name: "GradientCorrection",
      dialogClass: "AutoIntegrateGradientCorrectionDialog",
      includes: [
         this.autoIntegrateDir + "AutoIntegrateGlobal.js",
         this.autoIntegrateDir + "AutoIntegrateUtil.js",
         this.autoIntegrateDir + "AutoIntegrateEngine.js",
         this.autoIntegrateDir + "AutoIntegrateGUITools.js",
         this.autoIntegrateDir + "AutoIntegratePreview.js"
      ],
      constructors: [
         "AutoIntegrateGlobal",
         "AutoIntegrateUtil",
         "AutoIntegrateEngine",
         "AutoIntegrateGUITools",
         "AutoIntegratePreviewControl",
         "AutoIntegrateGradientCorrectionDialog"
      ]
   },

   {
      name: "SelectiveColor",
      dialogClass: "AutoIntegrateSelectiveColorDialog",
      includes: [
         this.autoIntegrateDir + "AutoIntegrateGlobal.js",
         this.autoIntegrateDir + "AutoIntegrateUtil.js",
         this.autoIntegrateDir + "AutoIntegrateEngine.js",
         this.autoIntegrateDir + "AutoIntegrateGUITools.js",
         this.autoIntegrateDir + "AutoIntegratePreview.js"
      ],
      constructors: [
         "AutoIntegrateGlobal",
         "AutoIntegrateUtil",
         "AutoIntegrateEngine",
         "AutoIntegrateGUITools",
         "AutoIntegratePreviewControl",
         "AutoIntegrateSelectiveColorDialog"
      ]
   }

];

} // constructor

// ============================================================================
// Core Test Functions
// ============================================================================

// Check if a constructor exists
constructorExists(name) {
   try {
      return eval("typeof " + name + " === 'function'");
   } catch (e) {
      return false;
   }
}

// Try to instantiate a dialog
tryInstantiate(dialogClass) {
   try {
      var dialog = eval("new " + dialogClass + "()");
      return { success: true, dialog: dialog };
   } catch (e) {
      return { success: false, error: e.message || String(e) };
   }
}

// Test a single script
testScript(script) {
   // Check if required constructors exist
   if (script.constructors) {
      for (var i = 0; i < script.constructors.length; i++) {
         if (!this.constructorExists(script.constructors[i])) {
            this.TestRunner.skip(script.name, "Missing: " + script.constructors[i]);
            return;
         }
      }
   }
   
   // Try to instantiate dialog
   var result = this.tryInstantiate(script.dialogClass);
   
   if (result.success) {
      this.TestRunner.pass(script.name);
   } else {
      this.TestRunner.fail(script.name, result.error);
   }
   result = null;
}

// ============================================================================
// Instantiation tests
// ============================================================================

/*
 * Run tests on all scripts.
 * Assumes scripts are already loaded via #include.
 */
runInstantiationTests() {
      this.TestRunner.beginLog("InstantiationTests");

      for (var i = 0; i < this.scripts.length; i++) {
         this.testScript(this.scripts[i]);
      }
      this.TestRunner.endLog();
}

// ============================================================================
// Detailed Test (checks more than just instantiation)
// ============================================================================

TestGradientCorrection() {
      var testname = "GradientCorrection";
      
      this.TestRunner.beginLog(testname);

      console.writeln("Testing Gradient Correction methods...");

      try {
         var methods = [ 'ABE', 'DBE', 'GradientCorrection' ];

         var dialog = new AutoIntegrateGradientCorrectionDialog();

         var image = this.testutils.testDir + "testimages/TestGradientCorrection.xisf";
         var imageWindow = dialog.util.openImageWindowFromFile(image);
         imageWindow.mainView.id = testname;
         imageWindow.show();

         for (var i = 0; i < methods.length; i++) {
            var method = methods[i];
            console.writeln("  Method " + method);
            dialog.global.par.enhancements_GC_method.val = method;
            dialog.enhancements_gui.createTargetImageSizerOnItemSelected(imageWindow.mainView.id);
            dialog.enhancements_gui.enhancementsApplyButtonOnClick();
         }
         dialog = null;
         this.TestRunner.pass(testname);
      } catch (e) {
         this.TestRunner.fail(testname, "Exception: " + (e.message || String(e)));
      }

      this.TestRunner.endLog();
}

TestImageStretching() {
      var testname = "ImageStretching";
      
      this.TestRunner.beginLog(testname);

      console.writeln("Testing Image Stretching methods...");

      try {
         var methods = [ 'Auto STF', 'MultiscaleAdaptiveStretch', 'Masked Stretch', 'VeraLuxHMS' ];

         var dialog = new AutoIntegrateImageStretchingDialog();

         var image = this.testutils.testDir + "testimages/TestImageStretching.xisf";
         var imageWindow = dialog.util.openImageWindowFromFile(image);
         imageWindow.mainView.id = testname;
         imageWindow.show();

         for (var i = 0; i < methods.length; i++) {
            var method = methods[i];
            console.writeln("  Method " + method);
            dialog.global.par.image_stretching.val = method;
            dialog.enhancements_gui.createTargetImageSizerOnItemSelected(imageWindow.mainView.id);
            dialog.enhancements_gui.enhancementsApplyButtonOnClick();
         }
         dialog = null;
         this.TestRunner.pass(testname);
      } catch (e) {
         this.TestRunner.fail(testname, "Exception: " + (e.message || String(e)));
      }

      this.TestRunner.endLog();
}

TestImageEnhancements() {
      var testname = "ImageEnhancements";
      
      this.TestRunner.beginLog(testname);

      console.writeln("Testing Image Enhancements methods...");

      try {
         var dialog = new AutoIntegrateImageEnhancementsDialog();

         var parameters = [ 
            dialog.global.par.enhancements_darker_background,
            dialog.global.par.enhancements_clarity
         ];

         var image = this.testutils.testDir + "testimages/TestImageEnhancements.xisf";
         var imageWindow = dialog.util.openImageWindowFromFile(image);
         imageWindow.mainView.id = testname;
         imageWindow.show();

         dialog.enhancements_gui.createTargetImageSizerOnItemSelected(imageWindow.mainView.id);
         
         for (var i = 0; i < parameters.length; i++) {
            var parameter = parameters[i];
            console.writeln("  Parameter " + parameter);
            parameter.val = true;
            dialog.enhancements_gui.enhancementsApplyButtonOnClick();
            parameter.val = false;
         }
         dialog = null;
         this.TestRunner.pass(testname);
      } catch (e) {
         this.TestRunner.fail(testname, "Exception: " + (e.message || String(e)));
      }

      this.TestRunner.endLog();
}

TestNarrowbandCombinations() {
      var testname = "NarrowbandCombinations";
      
      this.TestRunner.beginLog(testname);

      console.writeln("Testing Narrowband Combinations methods...");

      try {
         var dialog = new AutoIntegrateNarrowbandCombinationsDialog();

         var channels = [ 'H', 'S', 'O' ];
         dialog.testMappings = [];

         for (var i = 0; i < channels.length; i++) {
            let channel = channels[i];
            let image = this.testutils.testDir + "testimages/TestNarrowbandCombinations_" + channel + ".xisf";
            let imageWindow = dialog.util.openImageWindowFromFile(image);
            imageWindow.mainView.id = testname + "_" + channel;
            imageWindow.show();
            dialog.testMappings.push( [ channel, imageWindow.mainView.id ] );
         }

         var palettes = [ 'SHO', '3-channel HOO' ];

         for (var i = 0; i < palettes.length; i++) {
            var palette = palettes[i];
            console.writeln("  Palette " + palette);
            // Find palette from global.narrowBandPalettes
            for (var j = 0; j < dialog.global.narrowBandPalettes.length; j++) {
               var p = dialog.global.narrowBandPalettes[j];
               if (p.name === palette) {
                  dialog.global.par.narrowband_mapping.val = p.name;
                  dialog.global.par.custom_R_mapping.val = p.R;
                  dialog.global.par.custom_G_mapping.val = p.G;
                  dialog.global.par.custom_B_mapping.val = p.B;
                  break;
               }
            }

            dialog.applyPreview();
            dialog.processFinal();
         }
         dialog = null;
         this.TestRunner.pass(testname);
      } catch (e) {
         this.TestRunner.fail(testname, "Exception: " + (e.message || String(e)));
      }

      this.TestRunner.endLog();
}

TestSelectiveColor() {
      var testname = "SelectiveColor";
      
      this.TestRunner.beginLog(testname);

      console.writeln("Testing Selective Color methods...");

      try {
         var methods = [ 'Gold and Blue' ];

         var dialog = new AutoIntegrateSelectiveColorDialog();

         var image = this.testutils.testDir + "testimages/TestSelectiveColor.xisf";
         var imageWindow = dialog.util.openImageWindowFromFile(image);
         imageWindow.mainView.id = testname;
         imageWindow.show();

         dialog.enhancements_gui.createTargetImageSizerOnItemSelected(imageWindow.mainView.id);

         for (var i = 0; i < methods.length; i++) {
            var method = methods[i];
            console.writeln("  Method " + method);
            dialog.selectiveColor.setPreset(method);
            dialog.enhancements_gui.enhancementsApplyButtonOnClick();
         }
         dialog = null;
         this.TestRunner.pass(testname);
      } catch (e) {
         this.TestRunner.fail(testname, "Exception: " + (e.message || String(e)));
      }

      this.TestRunner.endLog();
}

// ============================================================================
// Run All Tests
// ============================================================================

runAllTests(progressDialog) {
   this.testutils.forceCloseAll();

   this.TestRunner.reset();

   var tests = []
   tests.push({ name:"runInstantiationTests", func:this.runInstantiationTests });
   tests.push({ name:"SelectiveColor", func:this.TestSelectiveColor });
   tests.push({ name:"GradientCorrection", func:this.TestGradientCorrection });
   tests.push({ name:"ImageStretching", func:this.TestImageStretching });
   tests.push({ name:"ImageEnhancements", func:this.TestImageEnhancements });
   tests.push({ name:"NarrowbandCombinations", func:this.TestNarrowbandCombinations });

   var testNames = []
   for (var i = 0; i < tests.length; i++) {
      testNames.push(tests[i].name);
   }

   progressDialog.initializeTests(testNames);
   progressDialog.show();
   CoreApplication.processEvents();

   for (var i = 0; i < tests.length; i++) {
      if (this.TestRunner.iscanceled()) {
         this.TestRunner.fail("RunAllTests", "Test run canceled by user.");
         break;
      }

      console.writeln("");
      console.writeln("═".repeat(50));
      console.writeln("Test: " + tests[i].name);
      console.writeln("═".repeat(50));
      console.writeln("");
      
      progressDialog.startTest(i);

      tests[i].func.call(this);
      
      progressDialog.completeTest(i, this.TestRunner.islastsuccess(), this.TestRunner.lasterror());
      CoreApplication.processEvents();
   }

   var success = this.TestRunner.summary();

   return success;
}

} // AutoIntegrateTestStandalone

// ============================================================================
// Main Entry Point
// ============================================================================

function main() {
   console.show();
   console.writeln("AutoIntegrate Standalone Script Test Runner");
   console.writeln("─".repeat(30));
   console.writeln("");

   var test = new AutoIntegrateTestStandalone();

   var deleteResult = test.testutils.deleteOldLogFiles(test.testutils.testResultsDir, 365);

   var progressDialog = new AutoIntegrateTestProgressDialog(test.TestRunner);

   if (test.runAllTests(progressDialog)) {
      console.writeln("All tests passed successfully.");
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

   progressDialog = null;
   test = null;
}

main();
