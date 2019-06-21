/*
* @func doGet
* @brief GETされるとwikiの所望のページをhtml形式で返す
* @param e GETの引数
* @detail GETの引数は
              action ∈ {view, edit} : 動作
              title (as String) : 記事タイトル
*/
function doGet(e)
{
    var action = e.parameter.action;  // 動作
    var title = e.parameter.title;    // タイトル

    //appendLog("action = " + action + ", title = " + title + "\n");

    if (title == null) {  // メインページ
        if (action == "edit") {
            // 連絡ページの編集
            return getEditorPage('info', true);
        } else {
            return getTopPage();
        }
    } else {  // 一般のページ
        if (action == "edit") {
            return getEditorPage(title, false);
        } else {
            if (exist(title)) {
                // ページが存在するとき
                return getViewerPage(title);
            } else {
                // ページが存在しないとき
                return getNotFoundPage(title);
            }
        }
    }
}
