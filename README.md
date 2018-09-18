# What is the github-files-fetcher for?

The `github-files-fetcher` is mainly designed for downloading part file(s) from a github repository. This is very useful if you  have a low bandwidth network and/or just need particular file(s) from a repository. But if you want to download the whole repository, the `git clone` command is preferred.

# Installation 

Run `npm install -g github-files-fetcher`

## Basic usage

```bash
fetcher --url=resource_url  --out=output_directory
```
for example
```bash
fetcher --url="https://github.com/reduxjs/redux/tree/master/examples/async" --out="~/"
```

## Authentication

The default unauthorized API access rate is **60** times per hour, and usually this is enough. When the access rate exceeded,
you can still achieve higher access rate by authentication, which can be done in the following three ways:

1. The --auth commandline option 

This option take the form of `--auth=username:password`, where the password can be either the login password for your github account or the personal access token which can be generated in https://github.com/settings/tokens.

2. Default configuration file

The default configuration file is `~/.download_github`, and the config file is a **json file**.

3. Designate via --file commandline option

For example, you can have the `~/config.json` be the configuration file.
```bash
 # download a directory
 fetcher --file="~/config.json" --url="https://github.com/reduxjs/redux/tree/master/examples/async" --out="~/" 
 
 # download a single file
 fetcher --file="~/config.json" --url="https://github.com/Gyumeijie/github-files-fetcher/blob/master/index.js" --out="~/" 
```
The following is the **template** of the configuration file:

```json
{
   "auth": {
        "username" : "your_github_name",
        "password" : "password_or_api_access_token"
   },
   "alwaysUseAuth" : true
}
```

When the default unauthorized API access rate exceeded, the `github-files-fetcher` will automatically switch to use authentication if one is provided through the three ways above. 

Since the `github-files-fetcher` request resource without authentication in default for performance consideration, and switch to use authentication if necessary, this causes unnecessary cost once the default unauthorized API access rate exceeded. To avoid this problem you can have the `github-files-fetcher` always use authentication by specify `--alwaysUseAuth` option.

# Other resources
There are some other good tools that can do the same thing for you:
- GitZip (Credits to Kino, Browser Extensions)
    - [Firefox Addon](https://addons.mozilla.org/en-US/firefox/addon/gitzip/)
    - [Chrome Extension](https://chrome.google.com/webstore/detail/gitzip-for-github/ffabmkklhbepgcgfonabamgnfafbdlkn)
- [DownGit](https://minhaskamal.github.io/DownGit/#/home) (Credits to Minhas Kamal, Web Page)
