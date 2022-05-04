# Test of performance for cropping (only)

This directoriy contains a script `TestCropPerformance.js` to test the performance
of the integration and calculation of cropping.

It does NOT contain data, as significant data would take too much space on the GIT
repository. Instead you have to provide the location of a set of registered files
and use it for your performance tests.  

This is not an issue, as the goal is to check performance when changing the implementation,
not to test performance of various installations.

## Usage

The script can be executed by `Script/Execute script file` in the PixInsight menu,
the execution cab be repeated (it will clear the required windows). 

The log
will include debug information not usually present in normal execution.

By default the script assumes that the `AutoIntegrate.js` is in a sibling git repository
clone, but his can be changed at the start of the script.

## Specification of test files

TODO

