# Test of full processing of AutoIntegrate


## Test support mechanism

The test script includes the source of `AutoIntegrate` but disable the execution of `main()` (for example by using a `#define`).

It makes its own initialization (restoring the default parameter values and directories) and
creates a subclass of the main Dialog of AutoIntegrate that contains the code to automatically populate the file list and
parameters and execute the test.

The code relies as much as possible on the standard methods of AutoIntegrate. Especialy it uses the format of the
`AutoSetup.json` to load the file list and parameters. 
Therefore `AutoIntegrate` can be used to create the `AutoSetup.json` specifying the test environment.

The source images are relative to the test definitions, in a subdirectory `images`.

All tests (or a specific sequence of test) can be run without human intervention, with a new AutoIntegrateDialog
created for each test.

The limitation of this approach are

- It tests the processing but not the user interface, although the user inerfaces
is properly updated by the file list and options.
- Currently the only operation is 'run', autocontinue is not yet supported.

There is currently no specific test of the results, the user should examine the resulting files or log.

It is not a goal to test the correctnes or performance of the PixInsight processes, only that the proper sequence of
operations is successfuly applied. Therefore the images of the testing set can be small and the set may include few exposures.

## Test structure

The tests are in the subdirectory `tests`, each test is a json file in the format of `AutoSetup.json`, but with a name
describing the test.

The source images can be shared between tests, they are in subdirectories of `tests/images`, so that relative paths can be used.

The location of the result/work files can be configured, by default it is a subdirectory named `results`which is in
`.gitignore`,  so that the configuration can be immediately used.


### TODO

A configuration file specify which ations must be done after configuration. This may include:

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
Look at the structure of the project

### Test configuration file

The test configuration file is a JSON file with the following structure TBD

## JSon parameters and file liste files


### Example 01-BasicMonochromeCrop.json

Use relative paths

```json
    {
    "version": 2,
    "fileinfo": [
        {
        "pageindex": 0,
        "pagename": "Lights",
        "files": [
            [
            "images/much_reduced/calibrated-test1-20201111-020312-Luminance-BIN2-W-300-001.fit",
            true
            ],
            [
            "images/much_reduced/calibrated-test1-20201111-031231-Luminance-BIN2-W-300-009.fit",
            true
            ],
            [
            "images/much_reduced/calibrated-test1-20201111-045850-Luminance-BIN2-W-300-010.fit",
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
        "Monochrome",
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