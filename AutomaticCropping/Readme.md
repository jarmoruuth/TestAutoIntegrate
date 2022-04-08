# Test of calculation of bounding box for Automatic Cropping

This directoriy contains a script `TestFindBindingBoxForCrop.js` and test data files
(in directory `TestRejectionMaps/`) that can be used to automatically test or debug
the automatic cropping of `AutoIntegrate`.

## Usage

The script can be executed by `Script/Execute script file` in the PixInsight menu,
the execution cab be repeated (it will clear the required windows). It will automatically
calculate and show the bounding box of all xisf files in `TestRejectionMaps/`.

The log
will include debug information not usually present in normal execution and
log a warning if the source image contains a preview named `ReferenceCrop` that does
not match the generated preview.

By default the script assumes that the `AutoIntegrate.js` is in a sibling git repository
clone, but his can be changed at the start of the script.

There is an option `autotest_do_delete_referencecrop_after_check` that can be changed to 
remove the `ReferenceCrop` to better see the resulting `crop` preview.

## Generation of test files

The test files can be generated either from the `LowRejectionMap_ALL` of a processing by
`AutoIntegrate` or by the creating a grayscale image with a black area for the valid area
and a gray area for the back ground. Such an image can be created by Photoshop or Paint.net
and saved as `png`, loaded in PixInsight and saved as `xisf` in `TestRejectionMaps/`. The
image ust be grayscale (not black and white). 

The you can run `TestFindBindingBoxForCrop.js` and examine the result. If you are happy with it,
rename the preview `crop` to `ReferenceCrop` and replace the image. It will be used and
compared on the next run.

It is recommended to use synthetic images of 800x600 to keep the size reasonable while having readable
results.
