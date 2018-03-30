var objCommon = WizCommonUI;
//
var scriptFileName = objCommon.GetScriptParamValue("ScriptFileName");
var databasePath = objCommon.GetScriptParamValue("DatabasePath");
var password = objCommon.GetScriptParamValue("Password");
//
var objDownloader = objCommon.CreateWizObject("WizKMControls.WizBatchDownloader");
//
var objDatabase = objCommon.CreateWizObject("WizKMCore.WizDatabase");
objDatabase.Open2(databasePath, password, 0);
//
var iniFileName = databasePath + "BlogDownloader.ini";
//
var myDate = new Date();
var year = myDate.getFullYear();
var month = myDate.getMonth() + 1;
var day = myDate.getDate();
//
var needDownload = false;
var downloaded = false;

function jsAlert(msg) {
    var objShell = objCommon.CreateActiveXObject("WScript.Shell");
    return objShell.Popup(msg, 10000, "Wiz", 0);
}
function formatInt(val) {
    if (val < 10)
        return "0" + val;
    else
        return "" + val;
}
function encodeURLForGoogleReader(url) {
    url = url.replace(/\?/g, "%3F");
    return url;
}

function extractFilePath(filename) {
    var pos = filename.lastIndexOf("\\");
    if (pos == -1)
        return filename;
    //
    return filename.substr(0, pos + 1);
}

function loadString(name) {
    var languageFileName = extractFilePath(scriptFileName) + "plugin.ini";
    //
    return objCommon.LoadStringFromFile(languageFileName, name);
}

function downloadCore(url) {
    //
    /*
    var xml = "";
    try {
        xml = objCommon.URLDownloadToText(url);
    }
    catch (err) {
        jsAlert("Can not download: " + url);
        return;
    }
    //
    var objXml = objCommon.CreateActiveXObject("MSXML.DOMDocument");
    objXml.async = false;
    //
    if (!objXml.loadXML(xml)) {
        if (objXml.parseError.errorCode != 0) {
            var err = objXml.parseError;
        }
        return null;
    }
    return objXml;*/
    var objXml;
    var xhr = new XMLHttpRequest();
    if (xhr) {
        xhr.onload = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                objXml = xhr.responseXML;
            }
        }
        xhr.open("GET", url, false);
        xhr.setRequestHeader("Charset", "GB2312");
        xhr.setRequestHeader("Content-Type","text/xml");
        //
        xhr.send();
    }
    //
    return objXml;
}
//
function downloadAtom(location, feedURL, flags, useContentInFeed, progress) {
    //
    var objXml = downloadCore(feedURL);
    if (!objXml) {
        return false;
    }
    //
    var root = objXml.documentElement;
    //
    var children = root.childNodes;
    progress.Max = children.length;
    //
     for (var i = children.length-1; i >-1; i--) {
        var node = children.item(i);
        //
        if (node.tagName != "entry")
            continue;
        //
        var nodeURL = node.selectSingleNode("link");
        if (!nodeURL)
            continue;
        //
        var urlAttr = nodeURL.attributes.getNamedItem("href");
        if (!urlAttr)
            continue;
        //
        var url = urlAttr.value;
        if (!url || url == "")
            continue;

        var title = "";

        var nodeTitle = node.selectSingleNode("title");
        if (nodeTitle) {
            title = nodeTitle.text;
        }
        if (!title)
            title = "";
        //
        //
        try {
            var documents = objDatabase.DocumentsFromURL(url);
            if (documents != null && documents.Count > 0)
                continue;
        }
        catch (e) {
        }
        //
        if (useContentInFeed == "1") {
            var replaceReturn = false;
            var nodeContent = node.selectSingleNode("content");
            if (!nodeContent) {
                nodeContent = node.selectSingleNode("summary");
                replaceReturn = true;
            }
            //
            if (nodeContent) {
                //
                progress.Text = title;
                //
                //
                var text = nodeContent.text;
                //
                text = text.replace(/\xA0/g, "&#160;");
                if (replaceReturn) {
                    text = text.replace(/\r\n/g, "\n");
                    text = text.replace(/\r/g, "\n");
                    text = text.replace(/\n/g, "<br />\n");
                }
                //
                text = "<!--WizHtmlContentBegin-->" + text + "<!--WizHtmlContentBegin-->";
                //
                var folder = objDatabase.GetFolderByLocation(location, true);
                var doc = folder.CreateDocument2(title, url);
                doc.UpdateDocument4(text, url, flags);
                //
                doc.Type = "webclip";
                //
                progress.Pos = i + 1;
                //
                downloaded = true;
                //
                continue;
            }
        }

        objDownloader.AddJob(databasePath, location, url, title, flags, true, true);
        needDownload = true;
    }
    //
    return true;
}

function downloadRss(location, feedURL, flags, useContentInFeed, progress) {

    var objXml = downloadCore(feedURL);
    if (!objXml) {
        return false;
    }
    var channelNode = objXml.getElementsByTagName('channel')[0];
    if (!channelNode)
        return false;
    //
    var children = channelNode.childNodes;
    progress.Max = children.length;
    //
    for (var i = children.length-1; i >-1; i--){
        var node = children.item(i);
        //
        if (node.nodeType != 1)
            continue;
        //
        if (node.nodeName != "item")
            continue;
        //
        var linkNode = node.getElementsByTagName("link")[0];
        if (null == linkNode)
            continue;
        //
        //
        var url = linkNode.textContent;
        if (url == null || url.length == 0)
            continue;
        //
        try {
            var documents = objDatabase.DocumentsFromURL(url);
            if (documents != null && documents.Count > 0)
                continue;
        }
        catch (e) {
        }
        //
        var titleNode = node.getElementsByTagName("title")[0];
        var title = null;
        if (titleNode != null)
            title = titleNode.textContent;
        if (title == null)
            title = "";
        //
        if (useContentInFeed == "1") {
            var nodeContent = node.getElementsByTagName("description")[0];
            if (nodeContent) {
                //
                progress.Text = title;
                //
                //
                var text = nodeContent.textContent;
                //
                text = text.replace(/\xA0/g, "&#160;");
                text = text.replace(/\r\n/g, "\n");
                text = text.replace(/\r/g, "\n");
                text = text.replace(/\n/g, "<br />\n");
                //
                text = "<!--WizHtmlContentBegin-->" + text + "<!--WizHtmlContentBegin-->";
                //
                var folder = objDatabase.GetFolderByLocation(location, true);
                var doc = folder.CreateDocument2(title, url);
                doc.UpdateDocument4(text, url, flags);
                //
                doc.Type = "webclip";
                //
                progress.Pos = i + 1;
                //
                downloaded = true;
                //
                continue;
            }
        }
        //
        objDownloader.AddJob(databasePath, location, url, title, flags, true, true);
        needDownload = true;
    }
    //
    return true;
}

function getIni(section, key, def) {
    try {
        return objCommon.GetValueFromIni(iniFileName, section, key);
    }
    catch (err) {
        if (def == null)
            return "";
        return def;
    }
}

function downloadFeed(section, progress) {
    var name = getIni(section, "Name");
    var url = getIni(section, "Feed");
    var contentOnly = getIni(section, "SaveContent");
    var useContentInFeed = getIni(section, "UseContentInFeed");
    var googleReader = ""; //getIni(section, "DownloadByGoogleReader");
    var count = getIni(section, "DownloadCount");
    //
    progress.Title = name;
    objDownloader.Title = name;
    //
    var flags = 0;
    if (contentOnly) {
        flags |= 0x08;
    }
    else {
        useContentInFeed = "0";
    }
    //
    name = name.replace(/\\/g, "-");
    name = name.replace(/\//g, "-");
    //
    var baseLocation = getIni("Common", "BaseLocation", "/Blogs/");
    if (baseLocation == null || baseLocation == "") {
        baseLocation = "/Blogs/";
    }
    var location = baseLocation + name + "/" + year + "/";
    //
    var rssDownloaded = false;
    //
    var feedURL = url;
    if (googleReader == "1") {
        feedURL = "https://www.google.com/reader/atom/feed/" + encodeURLForGoogleReader(feedURL) + "?n=" + count;
        rssDownloaded = downloadAtom(location, feedURL, flags, useContentInFeed, progress);
    }
    //
    if (rssDownloaded)
        return;
    //
    downloadRss(location, feedURL, flags, useContentInFeed, progress);
}

function showBubbleMessage(title, msg) {
    var appPath = objCommon.GetScriptParamValue("AppPath");
    //
    var wizShellFileName = appPath + "Wiz.exe";
    var dllFileName = appPath + "WizTools.dll";
    //
    var params = "\"" + dllFileName + "\" WizToolsShowBubbleWindow2Ex /Title=" + title + " /LinkText=" + msg + " /LinkURL=@ /Color=#FFFA9D /Delay=3";
    //
    objCommon.RunExe(wizShellFileName, params, false);
}

function downloadFeeds() {
    //
    var progress = objCommon.CreateWizObject("WizKMControls.WizProgressWindow");
    progress.Title = loadString("strBlogTools");
    progress.Show();
    //
    var section = objCommon.GetScriptParamValue("Section");
    downloadFeed(section, progress);
    //
    progress.Hide();
    progress.Destroy();
    //
    if (needDownload) {
        objDownloader.ShowWindow(true);
    }
    else {
        if (downloaded) {
        }
        else {
            showBubbleMessage(getIni(section, "Name"), loadString("strNoNewItems"));
        }
    }
}

downloadFeeds();
