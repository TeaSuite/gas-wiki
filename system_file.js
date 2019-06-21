function appendLog(str)
{
  var logfile = DriveApp.getFileById(PropertiesService.getScriptProperties().getProperty("LOG_FILE_ID"));
  var log = logfile.getBlob().getDataAsString();
  logfile.setContent(log + str);
}

function viewLog()
{
  var logfile = DriveApp.getFileById(PropertiesService.getScriptProperties().getProperty("LOG_FILE_ID"));
  Logger.log(logfile.getBlob().getDataAsString());
}

function viewLatest32()
{
  const link_url = PropertiesService.getScriptProperties().getProperty("INDEX_URL");
  var latest32_file = DriveApp.getFileById(PropertiesService.getScriptProperties().getProperty("LATEST32_FILE_ID"));
  // 記事は下が新しいもの
  var articles = latest32_file.getBlob().getDataAsString().split('\n');
  Logger.log(articles);
}

function getLatest32Html()
{
  const link_url = PropertiesService.getScriptProperties().getProperty("INDEX_URL");
  var latest32_file = DriveApp.getFileById(PropertiesService.getScriptProperties().getProperty("LATEST32_FILE_ID"));
  // 記事は下が新しいもの
  var articles = latest32_file.getBlob().getDataAsString().split('\n');
  
  var html = '<ul>';
  articles.forEach(function (article) {
          html += '<li><a href="' +  link_url + '?title=' + article + '">' + article + '</a></li>';
        });
  html += '</ul>';
  return html;
}

function updateLatest32(title)
{
  var latest32_file = DriveApp.getFileById(PropertiesService.getScriptProperties().getProperty("LATEST32_FILE_ID"));
  // 記事は下が新しいもの
  var articles = latest32_file.getBlob().getDataAsString().split('\n').reverse();
  
  var article_index = articles.indexOf(title);
  
  if( title != -1) {
    // 既にあるときはその要素を削除
    articles = articles.filter(function(article) { return article !== title});
  }
  // 末尾(最新)に追加
  articles.push(title);
  
  latest32_file.setContent(articles.reduce(function (article, str) { return str + (str == '' ? '' : '\n') + article; }));
}

function updatePageList()
{
  const files = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty("DATABASE_ID")).getFiles();
  var pagelist_file = DriveApp.getFileById(PropertiesService.getScriptProperties().getProperty("PAGELIST_FILE_ID"));
  
  var pagelist = "";
  
  while(files.hasNext()){ 
    pagelist += removeExtension(files.next().getName());  
    pagelist += '\n';
  }
  pagelist_file.setContent(pagelist);
}
