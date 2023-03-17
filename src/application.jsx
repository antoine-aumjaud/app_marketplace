import { invoke } from "@tauri-apps/api/tauri";

let _targetPath = null;
async function getTargetPath() {
    if(_targetPath == null) {
        _targetPath = await invoke("get_target_path");
    }
    return _targetPath;
}
async function getAppsUrl() {
    return await invoke("get_apps_url");
}

async function getUriContent(uri) {
    console.debug("fetch", uri);
    if(uri.startsWith("file:///") || uri.charAt(1) === ':') {
        const path = uri.replaceAll("file:///", "");
        const content = await invoke("get_local_file_content", {path: path});
        if(content.startsWith("error")) { 
            throw Error("Can't get file " + path + ", error: " + content);
        }
        return content;
    }
    else if(uri.startsWith("https://")) {
        const content = await invoke("get_url_content", {url: uri});
        const contentSplit = content.split("-|-"); //custom protocol: status-|-content
        const status = parseInt(contentSplit[0]);
        if(!(status >= 200 && status < 300)) { 
            throw Error("Can't get URL content, code: " + contentSplit[0] + ", message: " + contentSplit[1]);
        }
        return contentSplit[1];
    }
    else {
        const response = await fetch(uri);
        if(!response.ok) {
            throw Error("Can't get URL content, code: " + response.status + ", message: " +  + await response.text());
        }
        return await response.text();
    }
}
async function getUrlContentJson(url) {
    const content = await getUriContent(url);
    try {
        return JSON.parse(content);
    }
    catch(e) {
        console.debug("Can't parse to JSON:", content);
        throw e;
    }
}

async function install(apps, targetApp) {
    const appsToInstall = await getAppToInstall(apps, targetApp);
    console.debug("Apps to install", appsToInstall);
    const vars = {};
    for(const app of appsToInstall) {
        console.info("Install app", app.name, "with installer", app.installUri);
        if(!app.installUri.endsWith(".bat")) {
            throw Error("Can't install application, only bat file are managed", app.installUri);
        }
        const remoteVersion        = await getUriContent(app.versionUri);
        const installScriptContent = await getUriContent(app.installUri);
        const installScriptPath    = await getTargetPath() + '/' + app.code + "_install.bat";
        const appPath              = await getTargetPath() + '/' + app.code;
        const appVersionPath       = await getTargetPath() + '/' + app.code + ".version";
        const scriptSaveMessage    = await invoke("save_local_file_content", {path: installScriptPath, content: installScriptContent} );
        if(scriptSaveMessage !== "true") {
            throw Error("Can't save installation script to file", installScriptPath, "error: " + scriptSaveMessage)
        }
        try {
            vars["APP_PATH"] = appPath;
            await launch(await getTargetPath(), installScriptPath, vars);
        }
        catch(e) {
            throw Error("Can't install application " + app.name + ", message: " + e);
        }
        if(!await invoke("is_path_exist", { path: appPath })) { //create dir in case of installation is somewhere else
            await invoke("create_dir", { path: appPath }); 
            console.warn("Installation in another folder, the application could not be UN-installed.");
        }
        const versionSaveMessage = await invoke("save_local_file_content", {path: appVersionPath, content: remoteVersion});
        if(versionSaveMessage !== "true") {
            throw Error("Can't save version to file", appVersionPath)
        }
        vars[app.code.toUpperCase() + "_HOME"] = appPath;
    }
}
async function getAppToInstall(apps, app) {
    try {  
        let appsToInstall = [];
        //check tools
        if(app.deps) for(const dep of app.deps) {
            const depSplit = dep.split(".");
            const depType = depSplit[0];
            const depCode = depSplit[1];
            const depApp = apps.value[depType].apps.find(t => t.code === depCode);
            if(!depApp) log.error("Dependency App not found: " + dep)
            else {
                const depsAppToInstall = await getAppToInstall(apps, depApp);
                appsToInstall = appsToInstall.concat(depsAppToInstall);
            }
        }
        //check app
        if(await isInstalled(app)) {
            const pathVersion = await getTargetPath() + '/' + app.code + ".version";
            const localVersion  = await invoke("get_local_file_content", { path: pathVersion} );
            const remoteVersion = await getUriContent(app.versionUri);
            console.debug(`App '${app.code}': versions ${localVersion}/${remoteVersion}`);
            if(remoteVersion != localVersion) {
                appsToInstall.push(app);
            } 
        } 
        else {
            appsToInstall.push(app);
        }
        return appsToInstall;
    } 
    catch(e) {
        console.error("Can't get apps to install", e);
        throw e;
    }
}

async function open(app) {
    const path = await getTargetPath() + '/' + app.code;
    const command = app.launchCommand;
    try {
        await launch(path, command, {});
    }
    catch(e) {
        throw Error("Can't open application " + app.name);
    }
}

async function launch(path, launchCommand, vars) {
    let args = [];
    let command = launchCommand;
    if(command.includes(" ")) {
        const commandSplit = command.split(" ");
        command = commandSplit[0];
        args = commandSplit.slice(1);
    }
    if(command.endsWith(".bat") || command.endsWith(".cmd")) {
        command = "cmd";
        args = ["/c", launchCommand]; //all args in first arg
    }
    const out = await invoke("launch", { path: path, command: command, args: args, vars: vars });
    const outSplit = out.split("-|-"); //internal protocol: status-|-stdout-|-stderr
    console.info("launch", path, command, args, vars);
    if(outSplit[1].trim().length > 0) console.info("launch output: ",       outSplit[1]);
    if(outSplit[2].trim().length > 0) console.info("launch error output: ", outSplit[2]);
    if(outSplit[0] !== "true") { 
        throw Error("Can't launch " + launchCommand);
    }
}

async function isInstalled(app) {
    const pathVersion = await getTargetPath() + '/' + app.code + ".version";
    const isInstalled = await invoke("is_path_exist", { path: pathVersion });
    console.info("isInstalled", pathVersion, isInstalled);
    return isInstalled;
}  

async function remove(app) {
    const pathVersion = await getTargetPath() + '/' + app.code + ".version";
    const pathApp     = await getTargetPath() + '/' + app.code;
    const scriptPath  = await getTargetPath() + '/' + app.code + "_install.bat";
    if(await invoke("delete_dir",  { path: pathApp     })
    && await invoke("delete_file", { path: pathVersion })
    && await invoke("delete_file", { path: scriptPath  })) {
            console.info("remove", pathVersion, pathApp);
        return true;
    } else {
        console.error("remove", pathVersion, pathApp);
        return false;
    }
}  

export {
    getUrlContentJson  as getUrlContentJson,
    getAppsUrl         as getApplicationsUrl, 
    install            as installApplication,
    isInstalled        as isApplicationInstalled, 
    open               as openApplication,
    remove             as removeApplication
  };