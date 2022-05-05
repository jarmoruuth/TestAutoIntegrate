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

## Specification of files to integrate

See the mentionned file for clarification and example

```code
    # autotest_perf_files.EXAMPLE.txt
    #
    # Copy and adapt file to autotest_perf_files.txt in same diretory.
    # Each line can be a wild card search (with ,true at end to search directories recursively)
    # or a single file path. All files are used to integrate for the crop area.
    # The file autotest_perf_files.txt is in .gitignore, as it is local to the test environment,
    # as data for for performance test would be too large.

    # As example, one of these lines is used (uncommented) depending on the numebr of files to test
    D:/202004-T09-IC2872/wbpp/registered/Light_BIN-1_EXPOSURE-180.00s_FILTER-Blue_Mono/*.xisf,true
    # D:/202004-T09-IC2872/wbpp/registered/*.xisf,true
```
