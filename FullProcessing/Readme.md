# Test of full processing of AutoIntegrate

## Test support mechanism

The test script includes the source of `AutoIntegrate` but disable the execution of `main()` by using a `#define`.

It makes its own initialization (restoring the default parameter values and directories) and
creates a subclass of the main Dialog of AutoIntegrate that contains the code to automatically populate the file list and
parameters and execute the test.

The code relies as much as possible on the standard methods of AutoIntegrate. Especialy it uses the format of the
`AutoSetup.json` to load the file list and parameters of a test. 
Therefore `AutoIntegrate` can be used to create the `AutoSetup.json` specifying the test environment.

A test can be defined either by:

- A json file in the format of the `AutoSetup.json`. The file will be loaded and the a Run executed. The parameters
of the fiel specifies all characteristis of the test.
- A json file in the format of an Autotest, as explained below. Such a file will load an Autosetup file and specifies
additional configurations and actions.

The list of test to execute must be in a file named `autotest_tests.txt`, with one test file in each line.
The line may include comments indicated by a `#` at the beginning of the line.

All tests are run without human intervention, with a new AutoIntegrateDialog created for each test.
A log file of all actions and results of the test script is created and saved in the result directory.

*BEWARE* Currently the global variables that are not the parameters are not restored to their default (usually `null`)
value between tests, this may impact some test results, hopefully this will be changed in the future.

It is not a goal to test the correctnes or performance of the PixInsight processes, only that the proper sequence of
operations is successfuly applied. Therefore the images of the testing set can be small and the set may include few exposures.


### Example of auto_test_tests.txt

```
    # auto_test_tests.txt

    # List of tests files, absolute or relative to the path of this file.

    01-BasicMonochromeCrop_control.json
    02-BasicLRGBcrop.json
```

### Example of AutoSetup.json

`01-BasicMonochromeCrop.json`, using relative path

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