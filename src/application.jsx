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
            throw new Error("Can't get file " + path + ", error: " + content);
        }
        return content;
    }
    else if(uri.startsWith("https://")) {
        const content = await invoke("get_url_content", {url: uri});
        const contentSplit = content.split("-|-"); //custom protocol: status-|-content
        const status = parseInt(contentSplit[0]);
        if(!(status >= 200 && status < 300)) { 
            throw new Error("Can't get URL content, code: " + contentSplit[0] + ", message: " + contentSplit[1]);
        }
        return contentSplit[1];
    }
    else {
        const response = await fetch(uri);
        if(!response.ok) {
            throw new Error("Can't get URL content, code: " + response.status + ", message: " +  + await response.text());
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

async function install(apps, targetApp, logsInfo) {
    const appsToInstall = await getAppsToInstall(apps, targetApp);
    console.debug("Apps to install", appsToInstall.filter(a => a.doInstallation));
    const vars = {};
    const targetPath = await getTargetPath();
    for(const app of appsToInstall) {
        const appPath = targetPath + '\\' + app.code;
        if(app.doInstallation) {
            console.info("Install app", app.name, "with installer", app.installUri);
            logsInfo.value.title = "Install app: " + app.name;
            logsInfo.value.cancel = false;
            if(!app.installUri.endsWith(".bat")) {
                throw new Error("Can't install application, only bat file are managed", app.installUri);
            }
            const remoteVersion        = await getUriContent(app.versionUri);
            const installScriptContent = await getUriContent(app.installUri);
            const installScriptPath    = appPath + "_install.bat";
            const installScriptPathWrp = appPath + "_install_wrapper.bat";
            const appVersionPath       = appPath + ".version";
            const scriptSaveMessage    = await invoke("save_local_file_content", {path: installScriptPath, content: installScriptContent} );
            if(scriptSaveMessage !== "true") {
                throw new Error("Can't save installation script to file", installScriptPath, "error: " + scriptSaveMessage)
            }
            try {
                vars["APP_PATH"] = appPath;
                if(app.env) vars["ENV"] = app.env;
                const installScriptWrapperContent = `del ${installScriptPath}.status > nul 2>&1 \ncall ${installScriptPath} > ${installScriptPath}.log 2>&1 \nset RET=%ERRORLEVEL% \necho %RET% > ${installScriptPath}.status \nexit /B %RET%` 
                const scriptWrapperSaveMessage = await invoke("save_local_file_content", {path: installScriptPathWrp, content: installScriptWrapperContent} );
                if(scriptWrapperSaveMessage !== "true") {
                    throw new Error("Can't save installation script wrapper to file", installScriptPathWrp, "error: " + scriptWrapperSaveMessage)
                }
                const pid = await launch(targetPath, installScriptPathWrp, vars);
                while(true) {
                    const status  = await invoke("get_local_file_content", { path: installScriptPath + ".status" } );
                    const out     = await invoke("get_local_file_content", { path: installScriptPath + ".log" } );
                    if(!out.startsWith("error")) { 
                        logsInfo.value.output = out;
                    }
                    if(status.startsWith("error")) { //file status doesn't exist => process is not finished 
                        if(logsInfo.value.cancel) {
                            console.warn("installation cancelled by user");
                            await invoke("kill_process", { pid: pid } );
                            throw new Error("installation cancelled by user");
                        }
                        else {
                            await sleep(1000); 
                            continue; 
                        }
                    };
                    console.debug("- installation status: " + status + " final stdout: ", out);
                    if(status.trim() != "0") {
                        throw new Error("installation script error, status=" + status); 
                    }
                    break;
                }
            }
            catch(e) {
                throw new Error("Can't install application " + app.name + ", message: " + e);
            }
            if(!await invoke("is_path_exist", { path: appPath })) { //create dir in case of installation is somewhere else
                await invoke("create_dir", { path: appPath }); 
                console.warn("Installation in another folder, the application could not be UN-installed.");
            }
            const versionSaveMessage = await invoke("save_local_file_content", {path: appVersionPath, content: remoteVersion});
            if(versionSaveMessage !== "true") {
                throw new Error("Can't save version to file", appVersionPath)
            }
        }
        vars["HOME_" + app.code.toUpperCase()] = appPath;
    }
}
async function getAppsToInstall(apps, app) {
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
                const depsAppToInstall = await getAppsToInstall(apps, depApp);
                appsToInstall = appsToInstall.concat(depsAppToInstall);
            }
        }
        //check app
        if(await isInstalled(app)) {
            const pathVersion   = await getTargetPath() + '\\' + app.code + ".version";
            const localVersion  = await invoke("get_local_file_content", { path: pathVersion} );
            const remoteVersion = await getUriContent(app.versionUri);
            console.debug(`App '${app.code}': versions local/remote`, localVersion, remoteVersion);
            app.doInstallation = remoteVersion != localVersion;
            appsToInstall.push(app);
        } 
        else {
            app.doInstallation = true;
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
    const path = await getTargetPath() + '\\' + app.code;
    const command = path + '\\' + app.launchCommand;
    console.info("Launch app", app.name, "with command:", command);

    try {
        await launch(path, command, {});
    }
    catch(e) {
        throw new Error("Can't open application " + app.name);
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
    const outputFile = command + ".log"
    if(command.endsWith(".bat") || command.endsWith(".cmd")) {
        command = "cmd";
        args = ["/c", launchCommand]; //all args in first arg
    }
    console.debug("- launch command:", command, args, vars);
    const pid = await invoke("launch_process", { path: path, command: command, args: args, vars: vars, outputFile: outputFile });
    console.debug("- launch pid:", pid, "output: ", await invoke("get_local_file_content", { path: command + ".log" } ));
    if(pid.startsWith("error")){ 
        throw new Error("Can't launch " + launchCommand + ", " + pid);
    }
    return pid;
}

async function isInstalled(app) {
    const pathVersion = await getTargetPath() + '\\' + app.code + ".version";
    const isInstalled = await invoke("is_path_exist", { path: pathVersion });
    console.info("isInstalled", pathVersion, isInstalled);
    return isInstalled;
}  

async function remove(app) {
    const pathApp                 = await getTargetPath() + '\\' + app.code;
    const pathVersion             = await getTargetPath() + '\\' + app.code + ".version";
    const scriptPath              = await getTargetPath() + '\\' + app.code + "_install.bat";
    const scriptStatusPath        = await getTargetPath() + '\\' + app.code + "_install.bat.status";
    const scriptLogPath           = await getTargetPath() + '\\' + app.code + "_install.bat.log";
    const scriptWrapperPath       = await getTargetPath() + '\\' + app.code + "_install_wrapper.bat";
    if(await invoke("delete_dir",  { path: pathApp     })) {
        await invoke("delete_file", { path: pathVersion });
        await invoke("delete_file", { path: scriptPath });
        await invoke("delete_file", { path: scriptStatusPath });
        await invoke("delete_file", { path: scriptLogPath });
        await invoke("delete_file", { path: scriptWrapperPath });
        console.info("remove", pathVersion, pathApp, scriptPath);
        return true;
    } 
    else {
        console.error("remove", pathVersion, pathApp, scriptPath);
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

async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}