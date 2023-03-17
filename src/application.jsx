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

async function getUrlContent(url) {
    console.debug("fetch", url);
    if(url.startsWith("https://")) {
        return await invoke("get_url_content", {url: url});
    }
    else {
        return await (await fetch(url)).text();
    }
}
async function getUrlContentJson(url) {
    try {
        const content = await getUrlContent(url);
        return JSON.parse(content);
    }
    catch(e) {
        console.error("Can't get content of " + url, e);
        return null;
    }
}

async function install(apps, app) {
    try {
//manage tools in tools
//if folder doest exist at the end check app.uninstall & create it
//add version in loval
        const appsToInstall = [];
        //check tools
        if(app.tools) for(const tool of app.tools) {
            const toolApp = apps.value.filter["tools"].filter(a => a.name === tool);
            const localVersion = await invoke("get_app_file_version", { appCode: toolApp.code });
            const remoteVersion = await(await fetch(toolApp.versionUri)).json();
            console.debug(`Tool '${toolApp.code}': versions ${localVersion}/${remoteVersion}`);
            if(remoteVersion != localVersion) appsToInstall.push(toolApp.installUri);
        }
        //check app
        const localVersion = await invoke("get_app_file_version", { appCode: app.code });
        const remoteVersion = await(await fetch(app.versionUri)).json();
        console.debug(`App '${app.code}': versions ${localVersion}/${remoteVersion}`);
        if(remoteVersion != localVersion) appsToInstall.push(app.installUri);
        //installations
        for(const appToInstall of appsToInstall) {
            console.info("install app", app.installUri, 
                await invoke("install_app", { installUri: app.installUri }));
        }
    } 
    catch(e) {
        console.error(e);
        return false;
    }
}

async function open(app) {
    const pathApp = await getTargetPath() + '/' + app.code;
    let command = app.launchCommand;
    let args = [];
    if(command.includes(" ")) {
        const commandSplit = command.split(" ");
        command = commandSplit[0];
        args = commandSplit.slice(1);
    }
    if(command.endsWith(".bat") || command.endsWith(".cmd")) {
        command = "cmd";
        args = ["/c", app.launchCommand]; //all args in first arg
    }
    const out = await invoke("launch", { path: pathApp, command: command, args: args });
    const outSplit = out.split("-|-"); //internal protocol: status-|-stdout-|-stderr
    console.info("launch", pathApp, command, args);
    if(outSplit[0] === "true") {
        console.info("launch output", outSplit[1]);
        if(outSplit[2].trim().length > 0) {
            console.info("launch error", outSplit[2]);
        }
    }
    else {
        if(outSplit[2].trim().length > 0) {
            console.info("launch error", outSplit[2]);
        }
        throw Error("Can't launch application " + app.name);
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
    if(await invoke("delete_dir",  { path: pathApp     })
    && await invoke("delete_file", { path: pathVersion })) {
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