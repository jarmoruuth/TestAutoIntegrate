/*
 * AutoIntegrate Test Utils
 */

// ============================================================================
//    AutoIntegrateTestUtils
// ============================================================================

function AutoIntegrateTestUtils()
{

this.__base__ = Object;
this.__base__();

// The directory of the script file, used as a default base directory for other directories
var testScriptFile = ( #__FILE__ );        // Absolute path of the current script file
console.writeln("TestUtils: testScriptFile: " + testScriptFile);

var testScriptPath = testScriptFile.substring(0, testScriptFile.lastIndexOf('/'));
console.writeln("TestUtils: testScriptPath: " + testScriptPath);

var testScriptRootPath = testScriptPath.substring(0, testScriptPath.lastIndexOf('/'));
console.writeln("TestUtils: testScriptRootPath: " + testScriptRootPath);

// testDir always ends with a /
var testDir = testScriptPath + "/";
var testResultsDir = testDir + "results/";

// ============================================================================
// Test Runner Utility
// ============================================================================

var TestRunner = {
   passed: 0,
   failed: 0,
   skipped: 0,
   errors: [],
   name: "autotest",
   
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

   addError: function(error) {
      this.fail(this.name, error);
   },

   beginLog: function(testname = "autotest") {
      this.name = testname;
      console.beginLog();
      this.start_time = Date.now();
   },

   endLog: function() {
      let runtime_sec = (Date.now() - this.start_time) / 1000;
      console.writeln("");
      console.writeln(format("Test runtime: %.2f seconds", runtime_sec));
      let logDate = new Date;
      let uniqueFilenamePart = format( "_%04d%02d%02d_%02d%02d%02d",
                                 logDate.getFullYear(), logDate.getMonth() + 1, logDate.getDate(),
                                 logDate.getHours(), logDate.getMinutes(), logDate.getSeconds());
      let logFileName = testResultsDir + this.name +  uniqueFilenamePart + ".log";

      var file = new File();
      file.createForWriting(logFileName);
      file.write(console.endLog());
      file.outTextLn("======================================");
      file.outTextLn(format("Test runtime: %.2f seconds", runtime_sec));
      file.close();

      parseLogForErrors(logFileName);

      return logFileName;
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

// Parse the known log for errors, add them to test error
function parseLogForErrors(logFilePath)
{
      console.writeln("Parsing log for errors: " + logFilePath);
      if (logFilePath == null || logFilePath == '') { 
            TestRunner.addError("Log file not defined, likely not created");
            return;
      }
      if (!File.exists(logFilePath)) {
            TestRunner.addError("Log file '" + logFilePath + "' not found");
            return;
      }
      let log_lines = File.readLines(logFilePath);
      for (let i in log_lines) {
            let line = log_lines[i];
            let error_txt = "Error:";
            let errorIndex = line.indexOf(error_txt);
            if (errorIndex > 0) {
               if (line.indexOf("Parsing ISOSPEED FITS keyword: Parsing 64-bit floating point expression: conversion error") >= 0) {
                     // This is a known error that can be ignored
                     continue;
               }
               errorIndex += error_txt.length ; // Skip 'Error:'
               if (line.indexOf("FileDataCache::Load(): Corrupted cache data") >= 0) {
                     TestRunner.addError("Error in log: " + line.substring(errorIndex) + 
                                         "\nTo clear the cache, open ImageIntegration, select the tool (at bottom right) and clean both caches");
               } else {
                     TestRunner.addError("Error in log: " + line.substring(errorIndex));
               }
            }
            // Catch some warnings as errors
            let warning_txt = "Warning [";
            let warningIndex = line.indexOf(warning_txt);
            if (warningIndex > 0) {
                  warningIndex += warning_txt.length - 1; // Skip 'Warning '
                  TestRunner.addError("Warning in log: " + line.substring(warningIndex));
            }
      }
}

// Load TestMode.log and reference_TestMode.log and compare them
function parseTestmodeLogForErrors(logFilePath)
{
      console.writeln("Parsing testmode log for errors: " + logFilePath);
      if (logFilePath == null || logFilePath == '') { 
            TestRunner.addError("Test mode log file not defined, likely not created");
            return false;
      }
      if (!File.exists(logFilePath)) {
            TestRunner.addError("Log file '" + logFilePath + "' not found");
            return;
      }
      let referenceLogFilePath = File.extractDrive(logFilePath) +
                                 File.extractDirectory(logFilePath) + 
                                 "/reference_" + 
                                 File.extractName(logFilePath) + 
                                 File.extractExtension(logFilePath);
      if (!File.exists(referenceLogFilePath)) {
            TestRunner.addError("Reference log file '" + referenceLogFilePath + "' not found");
            return false;
      }

      let log_lines = File.readLines(logFilePath);
      let reference_log_lines = File.readLines(referenceLogFilePath);
      // Compare the log lines
      let min_lines = Math.min(log_lines.length, reference_log_lines.length);
      let first_difference = -1;
      for (let j = 0; j < min_lines; j++) {
            if (log_lines[j] != reference_log_lines[j]) {
                  if (log_lines[j].startsWith("PixInsight version")) {
                        continue;
                  }
                  if (log_lines[j].startsWith("AutoIntegrate v")) {
                        continue;
                  }
                  if (log_lines[j].startsWith("Processing date")) {
                        continue;
                  }
                  if (log_lines[j].startsWith("StarXTerminator AI model")) {
                        continue;
                  }
                  if (log_lines[j].startsWith("Script completed")) {
                        continue;
                  }
                  if (log_lines[j].startsWith("best_ssweight")) {
                        continue;
                  }
                  // Skip lines with text "best ssweight"
                  if (log_lines[j].indexOf("best ssweight") >= 0) {
                        continue;
                  }
                  if (log_lines[j].startsWith("SSWEIGHT") && !log_lines[j].startsWith("SSWEIGHT limit")) {
                        continue;
                  }
                  first_difference = j;
                  break;
            }
      }
      if (first_difference != -1) {
            TestRunner.addError(logFilePath + ": First difference in log files at line " + first_difference);
            return false
      } else if (log_lines.length != reference_log_lines.length) {
            TestRunner.addError(logFilePath + ": Log files have different number of lines: " + log_lines.length + " vs " + reference_log_lines.length);
            return false;
      } else {
            // No differences
            return true;
      }
}

function forceCloseAll () {
      console.noteln("Autotest: Force close all ", ImageWindow.windows.length, " windows");
      let windows = ImageWindow.windows.slice(); // make a copy
      for (let i=0; i<windows.length; i++) {
            windows[i].forceClose();
      }           
}

function deleteOldLogFiles(directory, daysOld) {
      var now = new Date();
      var cutoffTime = now.getTime() - (daysOld * 24 * 60 * 60 * 1000);
      
      var fileFind = new FileFind();
      var deletedCount = 0;
      var errorCount = 0;
      var keepCount = 0;
      
      if (fileFind.begin(directory + "/*")) {
         do {
            if (!fileFind.isDirectory) {
               var fullPath = directory + "/" + fileFind.name;
               if (File.extractExtension(fileFind.name).toLowerCase() != ".log") {
                  console.writeln("Keep file: " + fileFind.name);
                  keepCount++;
                  continue;
               }
               var file = new File();
               file.openForReading(fullPath);
               
               // Get file modification time
               var fileInfo = new FileInfo(fullPath);
               var fileTime = fileInfo.lastModified.getTime();
               
               file.close();
               
               if (fileTime < cutoffTime) {
                  try {
                     File.remove(fullPath);
                     console.writeln("Deleted: " + fileFind.name);
                     deletedCount++;
                  } catch (error) {
                     console.warningln("Failed to delete: " + fileFind.name + " - " + error);
                     errorCount++;
                  }
               } else {
                  console.writeln("Skip file: " + fileFind.name);
                   keepCount++;
               }
            }
         } while (fileFind.next());
      }
      
      console.writeln("\nSummary:");
      console.writeln("Files deleted: " + deletedCount);
      if (errorCount > 0) {
         console.warningln("Errors: " + errorCount);
      }
      return { deleted: deletedCount, errors: errorCount, kept: keepCount };
}

// Directories, all end with /
this.testRootDir = testScriptRootPath + "/";
this.testDir = testDir;
this.testResultsDir = testResultsDir;

this.TestRunner = TestRunner;

this.parseTestmodeLogForErrors = parseTestmodeLogForErrors;
this.forceCloseAll = forceCloseAll;
this.deleteOldLogFiles = deleteOldLogFiles;

} // AutoIntegrateTestUtils

AutoIntegrateTestUtils.prototype = new Object;
