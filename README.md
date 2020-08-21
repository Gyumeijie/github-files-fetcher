# Introduction [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

The `github-files-fetcher` is designed for downloading parts of a github repository. This is very useful if you have a low bandwidth network or only need a particular file or subdirectory from a large repository. If you want to download a whole repository, prefer `git clone`.

# Installation 

Run `npm install -g github-files-fetcher`

## Basic usage

```sh
fetcher --url=resource_url  --out=output_directory
```

For example:
```sh
fetcher --url="https://github.com/Gyumeijie/github-files-fetcher/blob/master/CHANGELOG.md" --out=/tmp
```
![](https://github.com/Gyumeijie/assets/blob/master/github-files-fetcher/fetcher-result.png)

## Authentication

The default unauthorized API access rate is **60** times per hour, which is usually enough.
You can surpass this with authentication, using one of the following three ways:

1. The --auth commandline option

   This option takes the form of `--auth=username:password`, where the password can be either the login password for your github account or the personal access token which can be generated in https://github.com/settings/tokens.

2. Default configuration file

   The default configuration file is `~/.download_github`, and the config file is a **json file**.

3. Designate via --file commandline option

   For example, you can use `~/config.json` as configuration file.
```sh
 # download a directory
 fetcher --file="~/config.json" --url="https://github.com/reduxjs/redux/tree/master/examples/async" --out="~/" 
 
 # download a single file
 fetcher --file="~/config.json" --url="https://github.com/Gyumeijie/github-files-fetcher/blob/master/index.js" --out="~/" 
```

This is a **template** for the configuration file:
```json
{
   "auth": {
        "username" : "your_github_name",
        "password" : "password_or_api_access_token"
   },
   "alwaysUseAuth" : true,
   "timeout" : 5000 
}
```

### Behavior

When the default unauthorized API access rate exceeded, `github-files-fetcher` will automatically switch to use authentication if provided through one of the ways above. 

`github-files-fetcher` requests resources without authentication by default to improve performance. However, this incurs a delay once the default unauthorized API access rate exceeded. To avoid this problem you can specify the `--alwaysUseAuth` option so `github-files-fetcher` always uses authentication.

# Environment
`node >= 6`

# Related works
There are some other good tools that function similarly:
- GitZip (Credits to Kino, Browser Extensions)
    - [Firefox Addon](https://addons.mozilla.org/en-US/firefox/addon/gitzip/)
    - [Chrome Extension](https://chrome.google.com/webstore/detail/gitzip-for-github/ffabmkklhbepgcgfonabamgnfafbdlkn)
- [DownGit](https://minhaskamal.github.io/DownGit/#/home) (Credits to Minhas Kamal, Web Page)
