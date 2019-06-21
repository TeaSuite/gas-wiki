function getTopPage()
{
    var html = HtmlService.createTemplateFromFile('toppage');
    html.latest_articles = getLatest32Html();
    
    var htmlOutput = html.evaluate();
    htmlOutput
        .setTitle('ESS Drama Wiki');
        //.addMetaTag('viewport', 'width=device-width, initial-scale=1');
    appendLog('TOP Page Created \n');
    return htmlOutput;
}

function getViewerPage(title)
{
    var duration = [];
    var time1 = new Date();
    var html = HtmlService.createTemplateFromFile('subpage');
    var time2 = new Date();
    duration.push(time2-time1);
    html.title = title;
    time1 = new Date();
    duration.push(time1-time2);
    html.tree = makeTreeLinksHtml(title);
    time2 = new Date();
    duration.push(time2-time1);
    html.content = getMarkdownContent(title);
    time1 = new Date();
    duration.push(time1-time2);
    html.child_links = getChildLinksHtml(title);
    time2 = new Date();
    duration.push(time2-time1);
    var htmlOutput = html.evaluate();
    time1 = new Date();
    duration.push(time1-time2);
    htmlOutput
        .setTitle('ESS Drama Wiki ' + title);
    time2 = new Date();
    duration.push(time2-time1);
    appendLog("Viewer Page Created : " + title + '\n');
    appendLog(duration.join('ms, ') + 'ms');
    return htmlOutput;
}

/*
* @brief 編集ページを返す
* @param title 記事パス
* @param spracial 特別ページかどうか
* TODO specialの分岐を書く
*/
function getEditorPage(title, special)
{
    var html = HtmlService.createTemplateFromFile('editor');
    html.title = title;
    if (exist(title)) {
        // ページが存在するとき
        html.content = getMarkdownContent(title);
    } else {
        // ページが存在しないとき
        html.content = '';
    }
    var htmlOutput = html.evaluate();
    htmlOutput
        .setTitle('ESS Drama Wiki: Edit [' + title + ']')
        //.addMetaTag('viewport', 'width=device-width, initial-scale=1');
    appendLog("Editor Page Created : " + title + '\n');
    return htmlOutput;
}

function getNotFoundPage(title)
{
    var html = HtmlService.createTemplateFromFile('notfound');
    html.title = title;
    html.tree = makeTreeLinksHtml(title);
    var htmlOutput = html.evaluate();
    htmlOutput
        .setTitle('ESS Drama Wiki: Page Not Found')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    appendLog("NotFound Page Created : " + title + '\n');
    return htmlOutput;
}