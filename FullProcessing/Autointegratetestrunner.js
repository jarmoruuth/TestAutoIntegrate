/*
 * AutoIntegrate Multi-Script Test Runner
 * 
 * Simple smoke tests for all AutoIntegrate standalone scripts.
 * Just tries to instantiate each dialog - if constructor uses
 * a renamed/missing method, it will fail.
 * 
 * Usage:
 *   1. Edit SCRIPT_BASE_PATH below
 *   2. Run this script in PixInsight
 *   3. Check console for results
 */

// run --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/FullProcessing/Autointegratetestrunner.js"

#feature-id    AutoIntegrate > Test Runner
#feature-info  Run integration tests on all AutoIntegrate scripts

#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#define AUTOINTEGRATE_NO_MAIN

#include "../../AutoIntegrate/ImageEnhancements.js"
#include "../../AutoIntegrate/ImageStretching.js"
#include "../../AutoIntegrate/NarrowbandCombinations.js"
#include "../../AutoIntegrate/GradientCorrection.js"

// ============================================================================
// CONFIGURATION - Edit this path to match your setup
// ============================================================================

#define SCRIPT_BASE_PATH    "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/"
#define AUTOINTEGRATE_PATH  "C:/Users/jarmo_000/GitHub/AutoIntegrate/"

// ============================================================================
// Test Framework
// ============================================================================

var TestRunner = {
   passed: 0,
   failed: 0,
   skipped: 0,
   errors: [],
   
   reset: function() {
      this.passed = 0;
      this.failed = 0;
      this.skipped = 0;
      this.errors = [];
   },
   
   skip: function(scriptName, reason) {
      this.skipped++;
      this.failed++;
      this.errors.push({ script: scriptName, error: "  ⊘ SKIP: " + scriptName + " - " + reason });
      console.criticalln("  ⊘ SKIP: " + scriptName + " - " + reason);
   },
   
   pass: function(scriptName) {
      this.passed++;
      console.writeln("  ✓ PASS: " + scriptName);
   },
   
   fail: function(scriptName, error) {
      this.failed++;
      this.errors.push({ script: scriptName, error: error });
      console.criticalln("  ✗ FAIL: " + scriptName);
      console.criticalln("         " + error);
   },
   
   summary: function() {
      console.writeln("");
      console.writeln("═".repeat(50));
      console.writeln("TEST RESULTS");
      console.writeln("═".repeat(50));
      console.writeln(format("  Passed:  %d", this.passed));
      console.writeln(format("  Failed:  %d", this.failed));
      console.writeln(format("  Skipped: %d", this.skipped));
      console.writeln("─".repeat(50));
      
      if (this.failed > 0) {
        if (this.failed > 0) {
            console.criticalln("\nFAILURES:");
            for (var i = 0; i < this.errors.length; i++) {
                var e = this.errors[i];
                console.criticalln("  " + e.script + ":");
                console.criticalln("    " + e.error);
            }
            console.writeln("");
            console.criticalln("*** " + this.failed + " TEST(S) FAILED ***");
            console.criticalln("*** Errors ***");
        }
      } else if (this.passed > 0) {
         console.writeln("");
         console.noteln("*** ALL TESTS PASSED ***");
      }
      
      console.writeln("═".repeat(50));
      return this.failed === 0;
   }
};

// ============================================================================
// Script Definitions
// ============================================================================

/*
 * Define all your standalone scripts here.
 * 
 * Each entry:
 *   name: Display name
 *   dialogClass: Constructor function name for the dialog
 *   includes: Files to include (relative to SCRIPT_BASE_PATH)
 *   constructors: Constructor names that must exist before testing
 */

var Scripts = [
   {
      name: "ImageStretching",
      dialogClass: "AutoIntegrateImageStretchingDialog",
      includes: [
         AUTOINTEGRATE_PATH + "AutoIntegrateGlobal.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateUtil.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateEngine.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateGUITools.js",
         AUTOINTEGRATE_PATH + "AutoIntegratePreview.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateEnhancementsGUI.js",
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
         AUTOINTEGRATE_PATH + "AutoIntegrateGlobal.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateUtil.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateEngine.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateGUITools.js",
         AUTOINTEGRATE_PATH + "AutoIntegratePreview.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateEnhancementsGUI.js",
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
         AUTOINTEGRATE_PATH + "AutoIntegrateGlobal.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateUtil.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateEngine.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateGUITools.js",
         AUTOINTEGRATE_PATH + "AutoIntegratePreview.js"
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
         AUTOINTEGRATE_PATH + "AutoIntegrateGlobal.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateUtil.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateEngine.js",
         AUTOINTEGRATE_PATH + "AutoIntegrateGUITools.js",
         AUTOINTEGRATE_PATH + "AutoIntegratePreview.js"
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
}

// ============================================================================
// Main Test Runners
// ============================================================================

/*
 * Run tests on all scripts.
 * Assumes scripts are already loaded via #include.
 */
function runAllTests() {
   console.writeln("");
   console.writeln("═".repeat(50));
   console.writeln("AutoIntegrate Integration Tests");
   console.writeln("═".repeat(50));
   console.writeln("");
   
   TestRunner.reset();
   
   for (var i = 0; i < Scripts.length; i++) {
      testScript(Scripts[i]);
   }
   
   return TestRunner.summary();
}

/*
 * Run test on a specific script by name.
 */
function testByName(name) {
   for (var i = 0; i < Scripts.length; i++) {
      if (Scripts[i].name === name) {
         TestRunner.reset();
         console.writeln("\nTesting: " + name);
         testScript(Scripts[i]);
         return TestRunner.summary();
      }
   }
   console.writeln("Unknown script: " + name);
   return false;
}

/*
 * List all registered scripts.
 */
function listScripts() {
   console.writeln("\nRegistered scripts:");
   for (var i = 0; i < Scripts.length; i++) {
      console.writeln("  " + (i + 1) + ". " + Scripts[i].name);
   }
}

// ============================================================================
// Detailed Test (checks more than just instantiation)
// ============================================================================

function runDetailedTests() {
   console.writeln("");
   console.writeln("═".repeat(50));
   console.writeln("AutoIntegrate Detailed Tests");
   console.writeln("═".repeat(50));
   console.writeln("");
   
   TestRunner.reset();
   
   for (var i = 0; i < Scripts.length; i++) {
      var script = Scripts[i];
      console.writeln("\n── " + script.name + " ──");
      
      // Check constructors
      var allExist = true;
      if (script.constructors) {
         for (var j = 0; j < script.constructors.length; j++) {
            var name = script.constructors[j];
            var exists = constructorExists(name);
            console.writeln("  " + (exists ? "✓" : "✗") + " " + name);
            if (!exists) allExist = false;
         }
      }
      
      if (!allExist) {
         TestRunner.skip(script.name, "Missing constructors");
         continue;
      }
      
      // Instantiate dialog
      console.writeln("  Instantiating " + script.dialogClass + "...");
      var result = tryInstantiate(script.dialogClass);
      
      if (result.success) {
         TestRunner.pass(script.name);
         
         // Check dialog has expected members
         var dialog = result.dialog;
         var members = ["global", "util", "engine"];
         for (var j = 0; j < members.length; j++) {
            var hasMember = typeof dialog[members[j]] !== 'undefined';
            console.writeln("    " + (hasMember ? "✓" : "✗") + " dialog." + members[j]);
         }
      } else {
         TestRunner.fail(script.name, result.error);
      }
   }
   
   return TestRunner.summary();
}

// ============================================================================
// Interactive Dialog for Running Tests
// ============================================================================

function TestRunnerDialog() {
   this.__base__ = Dialog;
   this.__base__();
   
   var self = this;
   
   this.windowTitle = "AutoIntegrate Test Runner";
   this.minWidth = 400;
   
   // Title
   this.titleLabel = new Label(this);
   this.titleLabel.text = "AutoIntegrate Integration Tests";
   this.titleLabel.textAlignment = TextAlign_Center;
   this.titleLabel.styleSheet = "font-weight: bold; font-size: 12pt;";
   
   // Info
   this.infoLabel = new Label(this);
   this.infoLabel.text = Scripts.length + " script(s) registered for testing";
   this.infoLabel.textAlignment = TextAlign_Center;
   
   // Buttons
   this.runAllButton = new PushButton(this);
   this.runAllButton.text = "Run All Tests";
   this.runAllButton.icon = this.scaledResource(":/icons/execute.png");
   this.runAllButton.onClick = function() {
      console.show();
      runAllTests();
   };
   
   this.runDetailedButton = new PushButton(this);
   this.runDetailedButton.text = "Run Detailed Tests";
   this.runDetailedButton.icon = this.scaledResource(":/icons/document-text.png");
   this.runDetailedButton.onClick = function() {
      console.show();
      runDetailedTests();
   };
   
   this.closeButton = new PushButton(this);
   this.closeButton.text = "Close";
   this.closeButton.icon = this.scaledResource(":/icons/close.png");
   this.closeButton.onClick = function() {
      self.ok();
   };
   
   // Layout
   this.buttonSizer = new VerticalSizer;
   this.buttonSizer.spacing = 8;
   this.buttonSizer.add(this.runAllButton);
   this.buttonSizer.add(this.runDetailedButton);
   this.buttonSizer.addSpacing(16);
   this.buttonSizer.add(this.closeButton);
   
   this.sizer = new VerticalSizer;
   this.sizer.margin = 16;
   this.sizer.spacing = 12;
   this.sizer.add(this.titleLabel);
   this.sizer.add(this.infoLabel);
   this.sizer.addSpacing(8);
   this.sizer.add(this.buttonSizer);
   
   this.adjustToContents();
}

TestRunnerDialog.prototype = new Dialog;

// ============================================================================
// Main Entry Point
// ============================================================================

function main() {
   console.show();
   console.writeln("AutoIntegrate Test Runner");
   console.writeln("─".repeat(30));
   console.writeln("");
   console.writeln("Functions available:");
   console.writeln("  runAllTests()      - Quick smoke test all scripts");
   console.writeln("  runDetailedTests() - More thorough testing");
   console.writeln("  testByName('Name') - Test specific script");
   console.writeln("  listScripts()      - Show registered scripts");
   console.writeln("");
   
   // Uncomment ONE of these:
   
   // Option 1: Run tests automatically
   runAllTests();
   
   // Option 2: Show dialog
   // var dialog = new TestRunnerDialog();
   // dialog.execute();
   
   // Option 3: Just load framework, run manually from console
   // console.writeln("Framework loaded. Call runAllTests() to start.");
}

main();
