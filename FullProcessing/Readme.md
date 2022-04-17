# Test of full processing of AutoIntegrate

## Test support mechanism

The test script includes the source of `AutoIntegrate` but disable the execution of `main()` by using a `#define`.

It makes its own initialization (restoring the default parameter values and directories) and
creates a subclass of the main Dialog of AutoIntegrate that contains the code to automatically populate the file list and
parameters and execute the test.
Persistent settings are neither loaded nor saved.

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

## Control file

The control file is a json file that has the keys "type": "control", and "version": 1" at top level.

It must specify the autosetup fiel to use by the key "autosetup": "absoluteorrelativeautosetup.json",
which is relative to the control file if not absolute.

The it has a list of commands.  A list of command is an array of arrays.
Each array ahs a string that identify the command to execute followed by parameters. 
The parameters depend on the comamand.

A special case for the "execute" command (htat execute the dialog) is that it has a list of commands
as parameters (and arra of arrays again).

The top level commands are executed before the DialogBox is executed or after it exited.

All other commands are executed in the context of the dialog box.

The command "run" and "continue" launch the processing.
The command "exit" must be the last one in "run" and exits the dialog.

### Launch command

Executable only in the global context and launching subcommands execution

- ["execute", [list of command]] - execute the dialog box and execute the subcommands in the dialogbox context

### Control commands

They can be exectued in the run context or in the global context. They are:

- ["setPar", "name", value] - Set the specified `par` parameter to the specified value.
- ["setPrefix", prefix] - Set `ppar.winprefix` to the specified value
- ["setLastDir", dir] - Set `ppar.lastDir` to the specified value
- ["setOutputRootDir", dir] - Set `outputRootDir` to the specified value
- ["forceCloseAll"] - Force close all image windows.
- ["writeln", msg] - console.writeln of the msg
- ["noteln", msg] - console.noteln of the msg
- ["warningln", msg] - console.warningln of the msg

### Dialog commands

They can be executed only as subcommands of `execute`.

- ["closeAllPrefix"] - click the button *close all prefix*
- ["run"] - click the *run* button, the actions will run to completion before the command returns
- ["continue"] - click the **continue* button, the actions will run to completion before the command returns
- ["exit"] - click the *exit* button (after 2 seconds, asynchronously), this wil exit the execution context  and
proceed to the next command after `execute`.
  
## Sample files

### Example of auto_test_tests.txt

```
    # auto_test_tests.txt

    # List of tests files, absolute or relative to the path of this file.

    01-BasicMonochromeCrop_control.json
    02-BasicLRGBcrop.json
```

### Example of control file

01-BasicMonochromeCrop_control.json

```json
    {
    "type": "control",
    "version": 1,
    "autosetup": "01-BasicMonochromeCrop.json",
    "commands": [
        ["forceCloseAll"],
        ["execute", 
        [
            ["run"],
            ["setPar", "extra_darker_background", true],
            ["setPar", "crop_to_common_area", false],
            ["setPrefix", "cont"],
            ["continue"],
            ["noteln", "Continue did not create a log"],
            ["closeAllPrefix"],
            ["exit"]
        ]
        ]
    ]
    }
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