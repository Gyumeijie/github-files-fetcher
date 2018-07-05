var url = require('url');


const AUTHOR = 1;
const REPOSITORY = 2;
const BRANCH = 4;


var parameters = {
    url: "https://github.com/reduxjs/redux/tree/master/examples/async",
    fileName: undefined,
    rootDirectory: undefined
};


function parseInfo(parameters) {
    var repoPath = url.parse(parameters.url, true).pathname;
    var splitPath = repoPath.split("/");
    var info = {};

    info.author = splitPath[AUTHOR];
    info.repository = splitPath[REPOSITORY];
    info.branch = splitPath[BRANCH];

    info.rootName = splitPath[splitPath.length-1];
    if(!!splitPath[BRANCH]){
        info.resPath = repoPath.substring(
            repoPath.indexOf(splitPath[BRANCH])+splitPath[BRANCH].length+1
        );
    }

    info.urlPrefix = "https://api.github.com/repos/"+ info.author+"/"+info.repository+"/contents/";
    info.urlPostfix = "?ref="+info.branch;

    if(!parameters.fileName || parameters.fileName == ""){
        info.downloadFileName = info.rootName;
    } else {
        info.downloadFileName = parameters.fileName;
    }

    if(parameters.rootDirectory == "false"){
        info.rootDirectoryName = "";
    } else if (!parameters.rootDirectory || parameters.rootDirectory == "" ||
        parameters.rootDirectory == "true"){
        info.rootDirectoryName = info.rootName+"/";
    } else {
        info.rootDirectoryName = parameters.rootDirectory+"/";
    }

    return info;
}

