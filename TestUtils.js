/*
 * AutoIntegrate Test Utils
 */

#engine v8
#feature-id    Testing > Test Progress Monitor

// ============================================================================
//    AutoIntegrateTestUtils
// ============================================================================

class AutoIntegrateTestProgressDialog extends Dialog
{
   constructor(TestRunner) {
      super();

      this.TestRunner = TestRunner;
      this.testResults = [];
      this.currentTestIndex = 0;
      this.startTime = new Date();

      // Title
      this.titleLabel = new Label(this);
      this.titleLabel.text = "Test Execution Progress";
      this.titleLabel.styleSheet = "font-weight: bold; font-size: 14pt;";

      // Current test info
      this.currentTestLabel = new Label(this);
      this.currentTestLabel.text = "Current test: ";
      this.currentTestLabel.styleSheet = "font-weight: bold;";
      this.currentTestLabel.minWidth = 500;

      // Progress bar
      this.progressBar = new Control(this);
      this.progressBar.setFixedHeight(20);
      this.progressBar.backgroundColor = 0xFF202020;
      this.progressBar.onPaint = function() {
         var g = new Graphics(this);
         g.fillRect(0, 0, this.width, this.height, new Brush(0xFF202020));

         if (this.dialog.totalTests > 0) {
            var progress = this.dialog.completedTests / this.dialog.totalTests;
            var progressWidth = Math.floor(this.width * progress);
            g.fillRect(0, 0, progressWidth, this.height, new Brush(0xFF4CAF50));
         }
         g.end();
      };

      // Progress text
      this.progressLabel = new Label(this);
      this.progressLabel.text = "0 / 0 tests completed";
      this.statusLabel = new Label(this);
      this.statusLabel.text = "";

      // Results list
      this.resultsTreeBox = new TreeBox(this);
      this.resultsTreeBox.setMinSize(600, 500);
      this.resultsTreeBox.numberOfColumns = 3;
      this.resultsTreeBox.headerVisible = true;
      this.resultsTreeBox.setHeaderText(0, "Test Name");
      this.resultsTreeBox.setHeaderText(1, "Status");
      this.resultsTreeBox.setHeaderText(2, "Time (s)");
      this.resultsTreeBox.setColumnWidth(0, 350);
      this.resultsTreeBox.setColumnWidth(1, 100);
      this.resultsTreeBox.setColumnWidth(2, 100);

      // Elapsed time
      this.elapsedTimeLabel = new Label(this);
      this.elapsedTimeLabel.text = "Elapsed time: 0s";

      // Close button (initially disabled)
      this.closeButton = new PushButton(this);
      this.closeButton.text = "Close";
      this.closeButton.enabled = false;
      this.closeButton.onClick = function() {
         this.dialog.ok();
      };

      // Cancel button
      this.cancelButton = new PushButton(this);
      this.cancelButton.text = "Cancel";
      this.cancelButton.onClick = () => {
         this.cancel();
      };

      this.buttonSizer = new HorizontalSizer;
      this.buttonSizer.margin = 10;
      this.buttonSizer.spacing = 8;
      this.buttonSizer.add(this.cancelButton);
      this.buttonSizer.add(this.closeButton);

      // Layout
      this.sizer = new VerticalSizer;
      this.sizer.margin = 10;
      this.sizer.spacing = 8;
      this.sizer.add(this.titleLabel);
      this.sizer.addSpacing(10);
      this.sizer.add(this.currentTestLabel);
      this.sizer.add(this.progressBar);
      this.sizer.add(this.progressLabel);
      this.sizer.add(this.statusLabel);
      this.sizer.addSpacing(10);
      this.sizer.add(this.resultsTreeBox, 100);
      this.sizer.add(this.elapsedTimeLabel);
      this.sizer.addSpacing(10);
      this.sizer.add(this.buttonSizer);

      this.windowTitle = "Test Progress";
      this.adjustToContents();
   } // End of constructor

   initializeTests(testNames) {
      this.testResults = [];
      this.totalTests = testNames.length;
      this.completedTests = 0;
      this.currentTestIndex = 0;

      for (var i = 0; i < testNames.length; i++) {
         var node = new TreeBoxNode(this.resultsTreeBox);
         node.setText(0, testNames[i]);
         node.setText(1, "Pending");
         node.setText(2, "-");
         this.testResults.push({
            name: testNames[i],
            node: node,
            status: "pending"
         });
      }

      this.updateProgress();
   }

   startTest(testIndex) {
      this.currentTestIndex = testIndex;
      var testName = this.testResults[testIndex].name;
      this.currentTestLabel.text = "Current test: " + testName;
      this.testResults[testIndex].startTime = new Date();
      this.testResults[testIndex].node.setText(1, "Running...");
      this.updateProgress();
      CoreApplication.processEvents();  // Force UI update
   }

   completeTest(testIndex, success, errortxt) {
      var result = this.testResults[testIndex];
      var endTime = new Date();
      var duration = (endTime.getTime() - result.startTime.getTime()) / 1000;

      result.status = success ? "passed" : "failed";
      result.duration = duration;

      result.node.setText(1, success ? "PASS" : "FAIL");
      result.node.setText(2, duration.toFixed(2));

      // Color code the status
      if (success) {
         result.node.setIcon(1, this.scaledResource(":/icons/ok.png"));
      } else {
         result.node.setIcon(1, this.scaledResource(":/icons/error.png"));
      }

      if (!success) {
         if (errortxt == null || errortxt == '') {
            errortxt = "Unknown error";
         }
         this.statusLabel.text = "Last error: " + errortxt;
      }

      this.updateProgress();
      CoreApplication.processEvents();  // Force UI update
   }

   updateProgress() {
      var completed = 0;
      var passed = 0;
      var failed = 0;

      for (var i = 0; i < this.testResults.length; i++) {
         if (this.testResults[i].status == "passed") {
            completed++;
            passed++;
         } else if (this.testResults[i].status == "failed") {
            completed++;
            failed++;
         }
      }
      this.completedTests = completed;
      this.progressLabel.text = format("%d / %d tests completed (%d passed, %d failed)",
                                        completed, this.totalTests, passed, failed);

      var elapsed = (new Date().getTime() - this.startTime.getTime()) / 1000;
      this.elapsedTimeLabel.text = format("Elapsed time: %.1fs", elapsed);

      this.progressBar.repaint();

      // Enable close button when all tests are done
      if (completed == this.totalTests) {
         this.closeButton.enabled = true;
         this.currentTestLabel.text = "All tests completed!";
      }
   }

   getSummary() {
      var passed = 0;
      var failed = 0;
      var totalTime = 0;

      for (var i = 0; i < this.testResults.length; i++) {
         if (this.testResults[i].status == "passed") passed++;
         if (this.testResults[i].status == "failed") failed++;
         if (this.testResults[i].duration) totalTime += this.testResults[i].duration;
      }

      return {
         total: this.testResults.length,
         passed: passed,
         failed: failed,
         totalTime: totalTime,
         results: this.testResults
      };
   }
}

// ============================================================================
//    AutoIntegrateTestUtils
// ============================================================================

class AutoIntegrateTestUtils
{

constructor()
{

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

// Directories, all end with /
this.testRootDir = testScriptRootPath + "/";
this.testDir = testDir;
this.testResultsDir = testResultsDir;

this.passed = 0;
this.failed = 0;
this.skipped = 0;
this.errors = [];
this.name = "autotest";
this.canceled = false;
this.lastsuccess = true;
this.cancelFunc = null;


} // End of constructor

// ============================================================================
// TestRunner functions
// ============================================================================

   reset() {
      this.passed = 0;
      this.failed = 0;
      this.skipped = 0;
      this.errors = [];
      this.canceled = false;
      this.lastsuccess = true;
   }

   skip(scriptName, reason) {
      this.skipped++;
      this.failed++;
      this.errors.push({ script: scriptName, error: "  ⊘ SKIP: " + scriptName + " - " + reason });
      console.criticalln("  ⊘ SKIP: " + scriptName + " - " + reason);
   }

   pass(scriptName) {
      this.passed++;
      console.writeln("  ✓ PASS: " + scriptName);
   }

   fail(scriptName, error) {
      this.failed++;
      this.errors.push({ script: scriptName, error: error });
      console.criticalln("  ✗ FAIL: " + scriptName);
      console.criticalln("         " + error);
      this.lastsuccess = false;
   }

   addError(error) {
      this.fail(this.name, error);
   }

   beginLog(testname = "autotest") {
      this.name = testname;
      console.writeln("this.TestRunner: Begin log for test: " + this.name);
      console.beginLog();
      this.start_time = Date.now();
      this.lastsuccess = true;
   }

   set_cancel_callback(cancelFunc) {
      this.cancelFunc = cancelFunc;
   }

   cancel() {
      console.writeln("this.TestRunner: Cancel requested");
      this.canceled = true;
      if (this.cancelFunc != null) {
         this.cancelFunc();
      }
   }

   iscanceled() {
      return this.canceled;
   }

   islastsuccess() {
      return this.lastsuccess;
   }

   lasterror() {
      if (this.errors.length == 0) {
         return "";
      }
      let error = this.errors[this.errors.length - 1];
      return error.error;
   }

   endLog() {
      let runtime_sec = (Date.now() - this.start_time) / 1000;
      console.writeln("");
      console.writeln(format("Test runtime: %.2f seconds", runtime_sec));
      let logDate = new Date;
      let uniqueFilenamePart = format( "_%04d%02d%02d_%02d%02d%02d",
                                 logDate.getFullYear(), logDate.getMonth() + 1, logDate.getDate(),
                                 logDate.getHours(), logDate.getMinutes(), logDate.getSeconds());
      let logFileName = this.testResultsDir + this.name +  uniqueFilenamePart + ".log";
      console.writeln("this.TestRunner: Ending log, saving to file: " + logFileName);

      var file = new File();
      file.createForWriting(logFileName);
      file.write(console.endLog());
      file.outTextLn("======================================");
      file.outTextLn(format("Test runtime: %.2f seconds", runtime_sec));
      file.close();

      this.parseLogForErrors(logFileName);

      return logFileName;
   }

   summary() {
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

// End TestRunner functions

// Parse the known log for errors, add them to test error
parseLogForErrors(logFilePath)
{
      console.writeln("Parsing log for errors: " + logFilePath);
      if (logFilePath == null || logFilePath == '') {
            this.addError("Log file not defined, likely not created");
            return;
      }
      if (!File.exists(logFilePath)) {
            this.addError("Log file '" + logFilePath + "' not found");
            return;
      }
      let log_lines = File.readLines(logFilePath);
      for (let line of log_lines) {
            let error_txt = "Error:";
            let errorIndex = line.indexOf(error_txt);
            if (errorIndex > 0) {
               if (line.indexOf("Parsing ISOSPEED FITS keyword: Parsing 64-bit floating point expression: conversion error") >= 0) {
                     // This is a known error that can be ignored
                     continue;
               }
               errorIndex += error_txt.length ; // Skip 'Error:'
               if (line.indexOf("FileDataCache::Load(): Corrupted cache data") >= 0) {
                     this.addError("Error in log: " + line.substring(errorIndex) +
                                         "\nTo clear the cache, open ImageIntegration, select the tool (at bottom right) and clean both caches");
               } else {
                     this.addError("Error in log: " + line.substring(errorIndex));
               }
            }
            // Catch some warnings as errors
            let warning_txt = "Warning [";
            let warningIndex = line.indexOf(warning_txt);
            if (warningIndex > 0) {
                  warningIndex += warning_txt.length - 1; // Skip 'Warning '
                  this.addError("Warning in log: " + line.substring(warningIndex));
            }
      }
}

// Load TestMode.log and reference_TestMode.log and compare them
parseTestmodeLogForErrors(logFilePath)
{
      console.writeln("Parsing testmode log for errors: " + logFilePath);
      if (logFilePath == null || logFilePath == '') {
            this.addError("Test mode log file not defined, likely not created");
            return false;
      }
      if (!File.exists(logFilePath)) {
            this.addError("Log file '" + logFilePath + "' not found");
            return false;
      }
      let referenceLogFilePath = File.extractDrive(logFilePath) +
                                 File.extractDirectory(logFilePath) +
                                 "/reference_" +
                                 File.extractName(logFilePath) +
                                 File.extractExtension(logFilePath);
      if (!File.exists(referenceLogFilePath)) {
            this.addError("Reference log file '" + referenceLogFilePath + "' not found");
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
            this.addError(logFilePath + ": First difference in log files at line " + first_difference);
            // Replace slash with windows backslash in file paths for better readability on windows
            let displayLogFilePath = logFilePath.replaceAll('/', '\\');
            let displayReferenceLogFilePath = referenceLogFilePath.replaceAll('/', '\\');
            this.addError("diff " + displayLogFilePath + " " + displayReferenceLogFilePath);
            return false
      } else if (log_lines.length != reference_log_lines.length) {
            this.addError(logFilePath + ": Log files have different number of lines: " + log_lines.length + " vs " + reference_log_lines.length);
            // Replace slash with windows backslash in file paths for better readability on windows
            let displayLogFilePath = logFilePath.replaceAll('/', '\\');
            let displayReferenceLogFilePath = referenceLogFilePath.replaceAll('/', '\\');
            this.addError("diff " + displayLogFilePath + " " + displayReferenceLogFilePath);
            return false;
      } else {
            // No differences
            return true;
      }
}

forceCloseAll () {
      console.noteln("Autotest: Force close all ", ImageWindow.windows.length, " windows");
      let windows = ImageWindow.windows.slice(); // make a copy
      for (let i=0; i<windows.length; i++) {
            windows[i].forceClose();
      }
}

deleteOldLogFiles(directory, daysOld) {
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

} // AutoIntegrateTestUtils
