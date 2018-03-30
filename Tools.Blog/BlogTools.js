function BT_init() {
    var databasePath = objDatabase.DatabasePath;
    //
    var iniFileName = databasePath + "BlogDownloader.ini";
    var autoRun = objCommon.GetValueFromIni(iniFileName, "Common", "AutoRun") == "1";
    if (!autoRun)
        return;

    //
    var pluginPath = objApp.GetPluginPathByScriptFileName("BlogTools.js");
    //
    var wizShellFileName = objApp.AppPath + "Wiz.exe";
    var wizKMControlsFileName = objApp.AppPath + "WizKMControls.dll";
    //
    var paramBase = "\"" + wizKMControlsFileName + "\" WizKMRunScript /ScriptFileName=" + pluginPath + "BlogDownloader.js /DatabasePath=" + objDatabase.DatabasePath + " /Password=" + objDatabase.GetUserPassword();
    //
    var count =  objCommon.GetValueFromIni(iniFileName, "Common", "FeedCount");
    for (var i = 0; i < count; i++) {
        var section = "Feed_" + i;
        //
        var params = paramBase + " /Section=" + section;
        //
        objCommon.RunExe(wizShellFileName, params, false);
    }
}
//
BT_init();


function BT_loadString(name) {
    var pluginPath = objApp.GetPluginPathByScriptFileName("BlogTools.js");
    //
    var iniFileName = pluginPath + "Plugin.ini";
    //
    return objApp.LoadStringFromFile(iniFileName, name);
}
