/*
 * AutoIntegrate Standalone Test Runner
 * 
 * Simple smoke tests for all AutoIntegrate standalone scripts.
 * 
 * Usage:
 *   1. Run this script in PixInsight
 *   2. Check console for results
 */

// run --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/TestStandalone.js"

#define AUTOINTEGRATE_NO_MAIN

#include "../AutoIntegrate/ImageEnhancements.js"
#include "../AutoIntegrate/ImageStretching.js"
#include "../AutoIntegrate/NarrowbandCombinations.js"
#include "../AutoIntegrate/GradientCorrection.js"

#include "TestUtils.js"

// ============================================================================
//    AutoIntegrateTestStandalone
// ============================================================================

function AutoIntegrateTestStandalone()
{

this.__base__ = Object;
this.__base__();

var testutils = new AutoIntegrateTestUtils();
this.testutils = testutils;

var TestRunner = testutils.TestRunner;

var autoIntegrateDir = testutils.testRootDir + "/AutoIntegrate/";

// ============================================================================
// Script Definitions
// ============================================================================

/*
 * Define all your standalone scripts here.
 * 
 * Each entry:
 *   name: Display name
 *   dialogClass: Constructor function name for the dialog
 *   includes: Files to include (relative to script path)
 *   constructors: Constructor names that must exist before testing
 */

var Scripts = [
   {
      name: "ImageStretching",
      dialogClass: "AutoIntegrateImageStretchingDialog",
      includes: [
         autoIntegrateDir + "AutoIntegrateGlobal.js",
         autoIntegrateDir + "AutoIntegrateUtil.js",
         autoIntegrateDir + "AutoIntegrateEngine.js",
         autoIntegrateDir + "AutoIntegrateGUITools.js",
         autoIntegrateDir + "AutoIntegratePreview.js",
         autoIntegrateDir + "AutoIntegrateEnhancementsGUI.js",
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
         autoIntegrateDir + "AutoIntegrateGlobal.js",
         autoIntegrateDir + "AutoIntegrateUtil.js",
         autoIntegrateDir + "AutoIntegrateEngine.js",
         autoIntegrateDir + "AutoIntegrateGUITools.js",
         autoIntegrateDir + "AutoIntegratePreview.js",
         autoIntegrateDir + "AutoIntegrateEnhancementsGUI.js",
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
         autoIntegrateDir + "AutoIntegrateGlobal.js",
         autoIntegrateDir + "AutoIntegrateUtil.js",
         autoIntegrateDir + "AutoIntegrateEngine.js",
         autoIntegrateDir + "AutoIntegrateGUITools.js",
         autoIntegrateDir + "AutoIntegratePreview.js"
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
         autoIntegrateDir + "AutoIntegrateGlobal.js",
         autoIntegrateDir + "AutoIntegrateUtil.js",
         autoIntegrateDir + "AutoIntegrateEngine.js",
         autoIntegrateDir + "AutoIntegrateGUITools.js",
         autoIntegrateDir + "AutoIntegratePreview.js"
      ],
      constructors: [
         "AutoIntegrateGlobal",
         "AutoIntegrateUtil",
         "AutoIntegrateEngine",
         "AutoIntegrateGUITools",
         "AutoIntegratePreviewControl",
         "AutoIntegrateGradientCorrectionDialog"
      ]
   }
];

// ============================================================================
// Core Test Functions
// ============================================================================

// Check if a constructor exists
function constructorExists(name) {
   try {
      return eval("typeof " + name + " === 'function'");
   } catch (e) {
      return false;
   }
}

// Try to instantiate a dialog
function tryInstantiate(dialogClass) {
   try {
      var dialog = eval("new " + dialogClass + "()");
      return { success: true, dialog: dialog };
   } catch (e) {
      return { success: false, error: e.message || String(e) };
   }
}

// Test a single script
function testScript(script) {
   // Check if required constructors exist
   if (script.constructors) {
      for (var i = 0; i < script.constructors.length; i++) {
         if (!constructorExists(script.constructors[i])) {
            TestRunner.skip(script.name, "Missing: " + script.constructors[i]);
            return;
         }
      }
   }
   
   // Try to instantiate dialog
   var result = tryInstantiate(script.dialogClass);
   
   if (result.success) {
      TestRunner.pass(script.name);
   } else {
      TestRunner.fail(script.name, result.error);
   }
   result = null;

   gc();
}

// ============================================================================
// Instantiation tests
// ============================================================================

/*
 * Run tests on all scripts.
 * Assumes scripts are already loaded via #include.
 */
function runInstantiationTests() {
      TestRunner.beginLog("InstantiationTests");

      console.writeln("");
      console.writeln("═".repeat(50));
      console.writeln("AutoIntegrate Instantiation Tests");
      console.writeln("═".repeat(50));
      console.writeln("");
      
      for (var i = 0; i < Scripts.length; i++) {
         testScript(Scripts[i]);
      }
      TestRunner.endLog();
}

// ============================================================================
// Detailed Test (checks more than just instantiation)
// ============================================================================

function TestGradientCorrection() {
      var testname = "GradientCorrection";
      
      TestRunner.beginLog(testname);

      console.writeln("Testing Gradient Correction methods...");

      try {
         var methods = [ 'ABE', 'DBE', 'GradientCorrection' ];

         var dialog = new AutoIntegrateGradientCorrectionDialog();

         var image = testutils.testDir + "testimages/TestGradientCorrection.xisf";
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
         TestRunner.pass(testname);
      } catch (e) {
         TestRunner.fail(testname, "Exception: " + (e.message || String(e)));
      }

      TestRunner.endLog();

      gc();
}

function TestImageStretching() {
      var testname = "ImageStretching";
      
      TestRunner.beginLog(testname);

      console.writeln("Testing Image Stretching methods...");

      try {
         var methods = [ 'Auto STF', 'MultiscaleAdaptiveStretch', 'Masked Stretch', 'VeraLuxHMS' ];

         var dialog = new AutoIntegrateImageStretchingDialog();

         var image = testutils.testDir + "testimages/TestImageStretching.xisf";
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
         TestRunner.pass(testname);
      } catch (e) {
         TestRunner.fail(testname, "Exception: " + (e.message || String(e)));
      }

      TestRunner.endLog();

      gc();
}

function TestImageEnhancements() {
      var testname = "ImageEnhancements";
      
      TestRunner.beginLog(testname);

      console.writeln("Testing Image Enhancements methods...");

      try {
         var dialog = new AutoIntegrateImageEnhancementsDialog();

         var parameters = [ 
            dialog.global.par.enhancements_darker_background,
            dialog.global.par.enhancements_clarity
         ];

         var image = testutils.testDir + "testimages/TestImageEnhancements.xisf";
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
         TestRunner.pass(testname);
      } catch (e) {
         TestRunner.fail(testname, "Exception: " + (e.message || String(e)));
      }

      TestRunner.endLog();

      gc();
}

function TestNarrowbandCombinations() {
      var testname = "NarrowbandCombinations";
      
      TestRunner.beginLog(testname);

      console.writeln("Testing Narrowband Combinations methods...");

      try {
         var dialog = new AutoIntegrateNarrowbandCombinationsDialog();

         var channels = [ 'H', 'S', 'O' ];
         dialog.testMappings = [];

         for (var i = 0; i < channels.length; i++) {
            let channel = channels[i];
            let image = testutils.testDir + "testimages/TestNarrowbandCombinations_" + channel + ".xisf";
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
         TestRunner.pass(testname);
      } catch (e) {
         TestRunner.fail(testname, "Exception: " + (e.message || String(e)));
      }

      TestRunner.endLog();

      gc();
}

function runDetailedTests() {
      console.writeln("");
      console.writeln("═".repeat(50));
      console.writeln("AutoIntegrate Detailed Tests");
      console.writeln("═".repeat(50));
      console.writeln("");

      TestGradientCorrection();
      TestImageStretching();
      TestImageEnhancements();
      TestNarrowbandCombinations();
}

// ============================================================================
// Run All Tests
// ============================================================================

function runAllTests() {
   testutils.forceCloseAll();
   gc();

   TestRunner.reset();

   runInstantiationTests();
   runDetailedTests();

   return TestRunner.summary();
}

this.runAllTests = runAllTests;

} // AutoIntegrateTestStandalone

AutoIntegrateTestStandalone.prototype = new Object;

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
