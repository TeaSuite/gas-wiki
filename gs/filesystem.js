/*
* @brief 拡張子を外す
*/
function removeExtension(filename)
{
    var pattern_match = filename.match(/(.*)(?:\.([^.]+$))/);
    if (pattern_match != null) {
        return pattern_match[1];
    } else {
        return filename;
    }
}

/*
* @brief ツリーの配列からファイル名を返す
* @param ファイルのツリーを配列にしたもの (eg. ['Drama18', 'SummerProduction2018', 'Set', 'plan'])
*/
function makeFilenameFromTree(tree)
{
    return tree.reverse().reduce(function(branch, filename) {
        return filename + (filename != '' ? '/' : '') + branch;
    }) + '.md';
}


/*
* @brief ファイル名からツリーを返す
* @param filename 記事名
* @detail 親ページが存在しない場合、スラッシュを含めてひとつの階層名となる
*/
function makeTreeFromFilename(filename)
{
    var database = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty("DATABASE_ID"));

    var keywords = removeExtension(filename).split('/');
    var tree = [];
    var is_leaf = false;
    keywords.forEach(function(keyword) {
        if (is_leaf) {
            // 親が存在しないので文字列連結だけしていく
            tree.push(tree.pop() + '/' + keyword);
            return;
        }
        if (!database.getFilesByName(makeFilenameFromTree(tree.concat([ keyword ]))).hasNext()) {
            // 階層が存在しないとき
            is_leaf = true;
        }
        tree.push(keyword);
    });
    return tree;
}

/*
* @brief 親階層へのリンクをhtmlで返す
* @param filename : String 記事へのパス
* @example 'Drama18/TIAFProduction2018/Set/Plan' -> [Drama18] | [TIAFProduction2018] | [Set]
* @time 驚きの1.44ms (努力前は690ms)
*/
function makeTreeLinksHtml(filename)
{
    /*
     * 悲しいこと
     *
     *      関数呼び出しはやめた(手動inline化)
     *      forEachもやめた
     *      文字列連結は+=にした
     *
     * 仕様
     *      これが遅いのは辛いので記事名にスラッシュは使えないことにする(必ず親が作られる)
     *
     *      汚いのは仕様
     */

    const link_url = ScriptApp.getService().getUrl();

    const a_head = '<a href="';
    const param_head = '?title=';
    const a_foot = '">[';
    const a_tail = ']</a>';

    var keywords = removeExtension(filename).split('/');
    var title = keywords[0];
    var html = a_head + link_url + param_head + title + a_foot + keywords[0] + a_tail;
    var is_leaf = false;
    for (var i = 1; i < keywords.length; i++) {
        title += '/';
        title += keywords[i];
        html += ' | ';
        html += a_head;
        html += link_url;
        html += param_head;
        html += title;
        html += a_foot;
        html += keywords[i];
        html += a_tail;
    }

    return html;
}

/*
* @brief お探しの記事が存在するか調べる
* @param filename : String 記事のパス
*/
function exist(filename)
{
    return DatabaseManager().database.getFilesByName(filename + '.md').hasNext();
}

/*
* @brief Markdown形式のままファイルの中身を返す
* @param filename : String 記事へのパス
* @return マークダウン形式での文字列
*/
function getMarkdownContent(filename)
{
    return DatabaseManager().database.getFilesByName(filename + '.md').next().getBlob().getDataAsString('utf-8');
}


/*
* @brief ファイルを上書きする
* @param filename : String 記事へのパス
* @param content : String 上書きする内容
* @detail 存在しないファイルの場合は新たに作成する
*/
function overwriteFile(filename, content)
{
    var database = DatabaseManager().database;
    if (exist(filename)) {
        // 存在するときは上書き
        database.getFilesByName(filename + '.md').next().setContent(content);
    } else {
        // 存在しなければ作る
        var newfile = DriveApp.createFile(filename + '.md', content);
        database.addFile(newfile);
    }

    updateLatest32(filename);
}

/*
* @brief 指定した記事の1つ下の階層にある記事の一覧を返す
* @param fildename 記事パス
* @time  14.5ms程度
*/
function getChildLinks(filename)
{
    const link_url = ScriptApp.getService().getUrl();
    var files = DatabaseManager().database.getFiles();


    var links = [];

    // パターンマッチは "filename/hoge.md"となるものを探す。ただし一番上の階層filename==''のときスラッシュはない
    const match_condition = new RegExp('^' + filename + (filename == '' ? '' : '/') + '[^\s/]+\.md$');

    while (files.hasNext()) {
        var filename = files.next().getName();
        if (filename.match(match_condition) != null) {
            var filename_noext = removeExtension(filename);
            links.push('<a href="' + link_url + '?title=' + filename_noext + '">' + filename_noext + '</a>');
        }
    }

    return links;
}

/*
* @brief 指定した記事の1つ下の階層にある記事の一覧を箇条書きにして返す
* @time 300ms程度(努力する前は500ms程度だった)
*/
function getChildLinksHtml(filename)
{
    const link_url = ScriptApp.getService().getUrl();

    // パターンマッチは "filename/hoge"となるものを探す。ただし一番上の階層filename==''のときスラッシュはない
    const match_condition = new RegExp('^' + filename + (filename == '' ? '' : '/') + '[^\s/]+$');

    /*
   * DriveAppのAPIを呼ぶ回数を減らすため、ページリストをテキスト形式で置いておいて、それを文字列処理する
   * ページリストはトリガーで回して更新しつづける
   */

    /*
   * 本当は
   *   var links = getChildLinks(filename);
   *   var html = '<ul><li>' + links.join('</li><li>') + '</li></ul>';
   * としたいところだけど、悲しいかな、速度の問題から配列のpushより文字列連結のほうがよく、
   * 文字列連結はjoinより自分で文字列連結するほうがよく、
   * さらに、+で結合して
   *   html += '<li><a href="' + link_url + '?title=' + filename_noext + '">' + filename_noext + '</a></li>';
   * とするより、+=で結合するほうが速い
  */

    var pagelist_file = DriveApp.getFileById(PropertiesService.getScriptProperties().getProperty("PAGELIST_FILE_ID"));
    var files = pagelist_file.getBlob().getDataAsString().split('\n');

    const li_head = '<li><a href="';
    const param_head = '?title=';
    const a_foot = '">';
    const li_tail = '</a></li>';

    var html = '<ul>';

    for (var i = 0; i < files.length; i++) {
        if (files[i].match(match_condition) != null) {
            html += li_head;
            html += link_url;
            html += param_head;
            html += files[i];
            html += a_foot;
            html += files[i];
            html += li_tail;
        }
    }

    html += '</ul>';

    return html;
}
