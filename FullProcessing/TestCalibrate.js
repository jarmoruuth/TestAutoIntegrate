// TestCalibrate.js
// run --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/FullProcessing/TestCalibrate.js"

#include "../../AutoIntegrate/AutoIntegrateGlobal.js"
#include "../../AutoIntegrate/AutoIntegrateUtil.js"
#include "../../AutoIntegrate/AutoIntegrateLDD.js"
#include "../../AutoIntegrate/AutoIntegrateBanding.js"

#include "../../AutoIntegrate/AutoIntegrateEngine.js"

try {

    var global = new AutoIntegrateGlobal();
    var util = new AutoIntegrateUtil(global);
    var engine = new AutoIntegrateEngine(global, util);

    global.lightFileNames = [
        "D:/Telescopes/test/Calibrate/OSC_engine/Light_001.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Light_002.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Light_003.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Light_004.fit"
    ];
    global.biasFileNames = [
        "D:/Telescopes/test/Calibrate/OSC_engine/Bias_001.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Bias_002.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Bias_003.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Bias_004.fit"
    ];
    global.darkFileNames = [
        "D:/Telescopes/test/Calibrate/OSC_engine/Dark_001.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Dark_002.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Dark_003.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Dark_004.fit"
    ];
    global.flatFileNames = [
        "D:/Telescopes/test/Calibrate/OSC_engine/Flat_001.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Flat_002.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Flat_003.fit",
        "D:/Telescopes/test/Calibrate/OSC_engine/Flat_004.fit"
    ];
    global.flatdarkFileNames = [
    ];

    global.par.debayer_pattern.val = "GRBG";

    engine.autointegrateProcessingEngine(null, false, false);

} catch (x) {

      console.noteln("TestCalibrate failed, catched error: " + x);
}
