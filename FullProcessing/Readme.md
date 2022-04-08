# Test of full processing of AutoIntegrate


## Test support mechanism

The test script includes the source of `AutoIntegrate`but disable the execution of `main()` (for example by using a `#define`).

It makes its own initialization (restoring the default parameter values and directories) and
creates a subclass of the main Dialog of AutoIntegrate that contains the code to automatically populate the file list and
parameters and execute the test.

The code relies as much as possible on the standard methods of AutoIntegrate. Especialy it uses the `AutoSetup.json` to
load the file list and parameters. Therefore AutoIntegrate can be used to create the `Autosetup.json` specifying the test
environment.

It is possible to automatically run a sequence of tests without human intervention.

The limitation of this approach are

- It tests the processing but not the user interface, although the user inerfaces
is properly updated by the file list and options.
- The current `Autosetup.json` specifies the location of the files by absolute paths, this makes the test difficult
to move (this could be changed in `AutoIntegrate`)

To automatically run a sequence of tests it is required that the tests are either in a well defined structure or are
described by a file. For maximum flexibility it should be possible to select if the test shoul be in `Run` mode
or `Continue` mode. Finally there must be a way to check if the test is successful, either by making some specific checks
or by comparing the result with an initial run assume to be successful.

It is not a goal to test the correctnes or performance of the PixInsight processes, only that the proper sequence of
operations is successfuly applied. Therefore the images of the testing set can be small and the set may include few exposures.

## Test structure

For maximal flexibility, the image files and the test specifications are normally in different directories, so the same
images can be used for multiple tests. The directory containing the test specification also contains the output files
of the nominal (correct) result, typically the log and the AutoProcessed files (what need to be kept depends on the
tests on the results). These reference files could be under version control.
The execution result must go to a work directory (specific to the test), typically on some temporary storage.

In addition a configuration file specify which cations must be done after configuration. This may include:

- Selecting the output file format.
- Close all, close all prefixes
- Autocontinue or Run

The configuration file must also defines what must be tested at the end of the operation. This may include:

- The existence of the same image as on the reference project
- The existence and some attributes of some images in the workspace
- The presence or absence of some emssages in the log
- The detection of an exception or error during execution.

### Specifying the tests to execute

The tests specifications are in a directory tree and, in a first approach, all tests in the directory tree are executed.
The source images are normally in a sibling of the directory tree.
The location of the work directory is in another place and configurable.

### Test configuration file

The test configuration file is a JSON file with the following structure TBD

## JSon parameters and file liste files

### Example AutoFiles.json

```json
    {
    "version": 1,
    "fileinfo": [
        {
        "pageindex": 0,
        "pagename": "Lights",
        "files": [
            [
            "D:/Temp/calibrated/luminance-bin1-w/calibrated-T20-jmatit-IC410-20201111-020312-Luminance-BIN1-W-300-001.fit",
            true
            ],
            [
            "D:/Temp/calibrated/luminance-bin1-w/calibrated-T20-jmatit-IC410-20201111-033805-Luminance-BIN1-W-300-001.fit",
            true
            ],
            [
            "D:/Temp/calibrated/luminance-bin1-w/calibrated-T20-jmatit-IC410-20201111-045850-Luminance-BIN1-W-300-010.fit",
            true
            ],
            [
            "D:/Temp/calibrated/blue-bin2-w/calibrated-T20-jmatit-IC410-20201119-033710-Blue-BIN2-W-300-010.fit",
            true
            ]
        ],
        "filterset": null
        }
    ]
    }
```

### Example AutoSetup.json

```json
    {
    "version": 2,
    "fileinfo": [
        {
        "pageindex": 0,
        "pagename": "Lights",
        "files": [
            [
            "D:/AITestSmall/calibrated-test1-20201111-020312-Luminance-BIN2-W-300-001.fit",
            true
            ],
            [
            "D:/AITestSmall/calibrated-test1-20201111-031231-Luminance-BIN2-W-300-009.fit",
            true
            ],
            [
            "D:/AITestSmall/calibrated-test1-20201111-045850-Luminance-BIN2-W-300-010.fit",
            true
            ]
        ],
        "filterset": null
        }
    ],
    "settings": [
        [
        "Cosmetic correction",
        true
        ],
        [
        "SubframeSelector",
        true
        ],
        [
        "Crop to common area",
        true
        ],
        [
        "Extra Darker background",
        true
        ],
        [
        "Debayer",
        "None"
        ]
    ]
    }
```

### Result of load of AutoSetup.json

```
    loadJsonFile
    Save lastDir 'D:/AITestSmall'
    parseJsonFile D:/AITestSmall/AutoSetup.json lights_only false
    Restore 5 settings
    getSettingsFromJson, save Cosmetic correction=true
    getSettingsFromJson, save SubframeSelector=true
    getSettingsFromJson, save Crop to common area=true
    getSettingsFromJson, save Extra Darker background=true
    getSettingsFromJson, save Debayer=None
    parseJsonFile Lights
    parseJsonFile, return files for pages
    addFilteredFilesToTreeBox 0
    getNewTreeBoxFiles 0
    getFilterFiles file D:/AITestSmall/calibrated-test1-20201111-020312-Luminance-BIN2-W-300-001.fit
    getFileKeywords D:/AITestSmall/calibrated-test1-20201111-020312-Luminance-BIN2-W-300-001.fit
    NAXIS1=2004
    EXPTIME=300.
    EXPOSURE=300.
    FILTER=Luminance
    TELESCOP=iTelescope 20
    Found L files (D:/AITestSmall/calibrated-test1-20201111-020312-Luminance-BIN2-W-300-001.fit)
    getFilterFiles file D:/AITestSmall/calibrated-test1-20201111-031231-Luminance-BIN2-W-300-009.fit
    getFileKeywords D:/AITestSmall/calibrated-test1-20201111-031231-Luminance-BIN2-W-300-009.fit
    NAXIS1=2004
    EXPTIME=300.
    EXPOSURE=300.
    FILTER=Luminance
    TELESCOP=iTelescope 20
    getFilterFiles file D:/AITestSmall/calibrated-test1-20201111-045850-Luminance-BIN2-W-300-010.fit
    getFileKeywords D:/AITestSmall/calibrated-test1-20201111-045850-Luminance-BIN2-W-300-010.fit
    NAXIS1=2004
    EXPTIME=300.
    EXPOSURE=300.
    FILTER=Luminance
    TELESCOP=iTelescope 20
    addFilteredFilesToTreeBox 8 files
    addFilteredFilesToTreeBox filterName L, 3 files
    3 light files
```
