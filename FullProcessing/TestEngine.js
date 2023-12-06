// TestEngine.js
// run --execute-mode=auto "C:/Users/jarmo_000/GitHub/TestAutoIntegrate/FullProcessing/TestEngine.js"

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
        "D:/Telescopes/test/LRGB_engine/2020-09-14T01-34-48_M20_Luminance_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T01-38-33_M20_Luminance_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T01-42-16_M20_Luminance_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T01-57-12_M20_Red_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T02-00-55_M20_Red_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T02-04-39_M20_Red_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T02-32-24_M20_Green_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T02-36-08_M20_Green_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T02-39-51_M20_Green_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T02-54-45_M20_Blue_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T02-58-29_M20_Blue_T-25_180s_cal_b2.xisf",
        "D:/Telescopes/test/LRGB_engine/2020-09-14T03-02-11_M20_Blue_T-25_180s_cal_b2.xisf"
    ];

    engine.autointegrateProcessingEngine(null, false, false);

} catch (x) {

      console.noteln("TestEngine failed, catch error: " + x);
}
