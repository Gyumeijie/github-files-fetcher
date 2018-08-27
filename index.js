const fs = require('fs');
const os = require('os');
const url = require('url');
const axios = require('axios');
const Promise = require('promise');
const shell = require('shelljs');
const save = require('save-file');
const argsParser = require('args-parser');

const AUTHOR = 1;
const REPOSITORY = 2;
const BRANCH = 4;

// A utility function for expand `~`
function tilde(pathString) {
  if (pathString[0] === '~') {
    return os.homedir() + pathString.substring(1);
  }
  return pathString;
}

// The default output directory is the current directory
let outputDirectory = './';
// Default authentication setting
let authentication = {};
let authenticationSwitch = {};
// Defalut configuration file
let configFile = tilde('~/.download_github');

function checkGithubRepoURLValidity(downloadUrl) {
  const { hostname, pathname } = url.parse(downloadUrl, true);

  if (hostname !== 'github.com') {
    throw new Error('Invalid domain: github.com is expected!');
  }

  if (pathname.split('/').length < 3) {
    throw new Error('Invalid url: https://github.com/user/repository is expected');
  }
}

const args = argsParser(process.argv);
(function tackleArgs() {
  if (args.help) {
    console.log(`
          Usage: download [OPTION]... 
          Example: download --url='https://github.com/user/repository'  --out='~/output'
          
          Resource URL:
          --url=URL                     the url of resource to be downloaded
          
          Output:
          --out=output_directory        the directory holds your download resource
          
          Authentication:
          --auth=username:password      the password can be either you login password of github account or access token
          --alwaysUseAuth               if set true, every request is authenticated and in this way we can have more API
                                        access rate
          
          Configuration file:
          --file=config_file            the default configuration file is the '~/download_github'
        `);

    return;
  }

  // The url is required and should be a valid github repository url
  if (!args.url) {
    throw new Error('input a url');
  } else {
    checkGithubRepoURLValidity(args.url);
  }

  if (args.out) {
    outputDirectory = tilde(args.out);
    if (outputDirectory[args.out.length - 1] !== '/') {
      outputDirectory = `${outputDirectory}/`;
    }
  }

  if (args.auth) {
    const { auth } = args;

    const colonPos = auth.indexOf(':');
    if (colonPos === -1 || colonPos === auth.length - 1) {
      throw new Error('Bad auth option: username:password is expected!');
    }

    const [username, password] = auth.split(':');
    authentication.auth = {
      username,
      password,
    };

    if (args.alwaysUseAuth) {
      authenticationSwitch = authentication;
    }
  }

  if (args.file) {
    configFile = tilde(args.file);
  }
}());

const parameters = {
  url: args.url,
  fileName: undefined,
  rootDirectory: undefined,
};

// If no command line authentication provided, read the configuration file
if (!authentication.auth) {
  (function parseConfig() {
    const isExistent = fs.existsSync(configFile);
    if (isExistent) {
      const data = fs.readFileSync(configFile, 'utf8');
      authentication = JSON.parse(data);

      if (args.alwaysUseAuth) {
        authenticationSwitch = authentication;
      }
    } else {
      console.warn('No configuration file provided!');
    }
  }());
}

function parseInfo(repoInfo) {
  const repoPath = url.parse(repoInfo.url, true).pathname;
  const splitPath = repoPath.split('/');
  const info = {};

  info.author = splitPath[AUTHOR];
  info.repository = splitPath[REPOSITORY];
  info.branch = splitPath[BRANCH];
  info.rootName = splitPath[splitPath.length - 1];

  // Common parts of url for downloading
  info.urlPrefix = `https://api.github.com/repos/${info.author}/${info.repository}/contents/`;
  info.urlPostfix = `?ref=${info.branch}`;

  if (splitPath[BRANCH]) {
    info.resPath = repoPath.substring(repoPath.indexOf(splitPath[BRANCH]) + splitPath[BRANCH].length + 1);
  }

  if (!repoInfo.fileName || repoInfo.fileName === '') {
    info.downloadFileName = info.rootName;
  } else {
    info.downloadFileName = repoInfo.fileName;
  }

  if (repoInfo.rootDirectory === 'false') {
    info.rootDirectoryName = '';
  } else if (!repoInfo.rootDirectory || repoInfo.rootDirectory === ''
  || repoInfo.rootDirectory === 'true') {
    info.rootDirectoryName = `${info.rootName}/`;
  } else {
    info.rootDirectoryName = `${parameters.rootDirectory}/`;
  }

  return info;
}

function extractFilenameAndDirectoryFrom(path) {
  const components = path.split('/');
  const filename = components[components.length - 1];
  const directory = path.substring(0, path.length - filename.length);

  return {
    filename,
    directory,
  };
}

const basicOptions = {
  method: 'get',
  responseType: 'arrayBuffer',
};
// Global variable
let repoInfo = {};

function saveFiles(files, requestPromises) {
  const rootDir = outputDirectory + repoInfo.rootDirectoryName;
  shell.mkdir('-p', rootDir);

  Promise.all(requestPromises).then(() => {
    for (let i = 0; i < files.length; i++) {
      const pathForSave = extractFilenameAndDirectoryFrom(files[i].path.substring(decodeURI(repoInfo.resPath).length + 1));
      const dir = rootDir + pathForSave.directory;
      fs.exists(dir, ((i, dir, pathForSave, exists) => {
        if (!exists) {
          shell.mkdir('-p', dir);
        }
        save(files[i].data, dir + pathForSave.filename, (err) => {
          if (err) throw err;
        });
      }).bind(null, i, dir, pathForSave));
    }
  });
}

function processClientError(error, retryCallback) {
  if (error.response.status === '401') {
    // Unauthorized
    console.error('Bad credentials, please check your username or password(or access token)!');
  } else if (error.response.status === '403') {
    if (authentication.auth) {
      // If the default API access rate without authentication exceeds and the command line
      // authentication is provided, then we switch to use authentication
      console.warn('The unauthorized API access rate exceeded, we are now retrying with authentication......');
      authenticationSwitch = authentication;
      retryCallback();
    } else {
      // API rate limit exceeded
      console.error('API rate limit exceeded, Authenticated requests get a higher rate limit.'
                  + ' Check out the documentation for more details. https://developer.github.com/v3/#rate-limiting');
    }
  } else {
    console.error(error.message);
  }
}

function fetchFile(path, url, files) {
  return axios({
    ...basicOptions,
    url,
    ...authenticationSwitch,
  }).then((file) => {
    console.log('downloading ', path);
    files.push({ path, data: file.data });
  }).catch((error) => {
    processClientError(error, fetchFile.bind(null, path, url, files));
  });
}

function downloadFile(url) {
  console.log('downloading ', repoInfo.resPath);

  axios({
    ...basicOptions,
    url,
    ...authenticationSwitch,
  }).then((file) => {
    shell.mkdir('-p', outputDirectory);
    const pathForSave = extractFilenameAndDirectoryFrom(decodeURI(repoInfo.resPath));

    save(file.data, outputDirectory + pathForSave.filename, (err) => {
      if (err) throw err;
    });
  }).catch((error) => {
    processClientError(error, downloadFile.bind(null, url));
  });
}

function iterateDirectory(dirPaths, files, requestPromises) {
  axios({
    ...basicOptions,
    url: repoInfo.urlPrefix + dirPaths.pop() + repoInfo.urlPostfix,
    ...authenticationSwitch,
  }).then((response) => {
    const { data } = response;
    for (let i = 0; i < data.length; i++) {
      if (data[i].type === 'dir') {
        dirPaths.push(data[i].path);
      } else if (data[i].download_url) {
        const promise = fetchFile(data[i].path, data[i].download_url, files);
        requestPromises.push(promise);
      } else {
        console.log(data[i]);
      }
    }

    // Save files after we iterate all the directories
    if (dirPaths.length === 0) {
      saveFiles(files, requestPromises);
    } else {
      iterateDirectory(dirPaths, files, requestPromises);
    }
  }).catch((error) => {
    processClientError(error, iterateDirectory.bind(null, dirPaths, files, requestPromises));
  });
}

function downloadDirectory() {
  const dirPaths = [];
  const files = [];
  const requestPromises = [];

  dirPaths.push(repoInfo.resPath);
  iterateDirectory(dirPaths, files, requestPromises);
}

function initializeDownload(para) {
  repoInfo = parseInfo(para);

  if (!repoInfo.resPath || repoInfo.resPath === '') {
    if (!repoInfo.branch || repoInfo.branch === '') {
      repoInfo.branch = 'master';
    }

    // Download the whole repository
    const repoURL = `https://github.com/${repoInfo.author}/${repoInfo.repository}/archive/${repoInfo.branch}.zip`;

    axios({
      ...basicOptions,
      responseType: 'stream',
      url: repoURL,
      ...authenticationSwitch,
    }).then((response) => {
      shell.mkdir('-p', outputDirectory);
      const filename = `${outputDirectory}${repoInfo.repository}.zip`;
      response.data.pipe(fs.createWriteStream(filename))
        .on('close', () => {
          console.log(`${filename} downloaded.`);
        });
    }).catch((error) => {
      processClientError(error, initializeDownload.bind(null, parameters));
    });
  } else {
    // Download part(s) of repository
    axios({
      ...basicOptions,
      url: repoInfo.urlPrefix + repoInfo.resPath + repoInfo.urlPostfix,
      ...authenticationSwitch,
    }).then((response) => {
      if (response.data instanceof Array) {
        downloadDirectory();
      } else {
        downloadFile(response.data.download_url);
      }
    }).catch((error) => {
      processClientError(error, initializeDownload.bind(null, parameters));
    });
  }
}

if (!args.help) {
  initializeDownload(parameters);
}
