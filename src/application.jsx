import { invoke } from "@tauri-apps/api/tauri";
import { BaseDirectory, exists, removeDir } from '@tauri-apps/api/fs';
import { Command } from "@tauri-apps/api/shell";


async function readEnvVariable(variableName) {
    const commandResult = await new Command("cmd", [ "/c", "set", variableName]).execute();
    if (commandResult.code !== 0) {
      throw new Error(commandResult.stderr);
    }
    const out = commandResult.stdout;
    const outSplit = out.split("=");
    return (outSplit.length > 0) ? outSplit[1] : null; 
}
let _targetPath = null;
async function getTargetPath() {
    if(_targetPath == null) {
        _targetPath = await invoke("get_target_path");
    }
    return _targetPath;
}

async function install(apps, app) {
    try {
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
    try {
        console.info("open", app.launchCommand,
            await new Command(app.launchCommand, [], { dir: await getTargetPath() }).execute());
    } catch (e) {
        console.error("open", app.launchCommand, e);
    }
}

async function isInstalled(app) {
    const aa = await getTargetPath()
    const bb =  await exists(await getTargetPath() + "/" + app.code, { dir: BaseDirectory.Home });
    console.log(bb);
    return bb;
}  

async function remove(app) {
    console.info("remove", app.code,
        await removeDir(await getTargetPath() + "/" + app.code, { dir: BaseDirectory.Home }));
}  

export {
    install     as installApplication,
    isInstalled as isApplicationInstalled, 
    open        as openApplication,
    remove      as removeApplication
  };