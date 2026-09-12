import { App, normalizePath, Notice, requestUrl, TFolder } from "obsidian"
import { buildCodeBlock, targetFolder } from "./handlePaste"
export const addressBase = 'https://www.paccenter.org/'
export function postProcessor(context: any) {


    return function actualPostProcessor(source: any, el: any, ctx: any) {


        const lines = source.split('\n')
        const vaultname = lines[0].split(':')[1].trim()
        const file = lines[1].split(':')[1].trim()
        const uploaded = lines[2].split(':')[1].trim()

        if (uploaded != 'false' && uploaded != 'true') {
            new Notice('bad form on uploaded parameter on arnstien plugin detected, aborting load', 5000)
            el.createEl("p", { text: `bad form on uploaded parameter, must be true or false, instead says ${uploaded}` })
            return
        }


        const path = normalizePath(`${targetFolder}/${file}`)
        const tFile = context.app.vault.getFileByPath(path)

        if (!tFile && uploaded == 'false') {
            new Notice(`File not found at path: ${path}, starting download process`)
            return
        }

        if (!tFile && uploaded == 'true') {

            return downloadManager(source, el, ctx, context, 0, vaultname, file)
        }

        if (!tFile) {
            new Notice('missing file, please re-paste file into obsidian', 5000)
            el.createEl("p", { text: 'missing file, bad code block' })
            return
        }
        if (uploaded == 'false') {
            return uploadManager(source, el, ctx, context, 0, vaultname, file)
        }

        renderIfOnSite(el, context, tFile, file, path)

    }
}



async function uploadManager(source: any, el: any, ctx: any, context: any, tries: number, vaultname: string, file: string) {

    const temp = el.createEl('p', { text: 'uploading image...' })


    const token = context.settings.token


    try {
        const response = await requestUrl({
            url: addressBase + 'api/filesync/putfile',
            method: "POST",
            contentType: "application/json",
            body: JSON.stringify({ vaultname: vaultname, file: file, token: context.settings.token }),
        })

        if (response.status == 201) {
            if (response.text == 'already_have_file') {
                const errorString = 'already have file by that name uploaded. Change filename and try again'
                new Notice(errorString, 5000)
                console.error(errorString)
                el.createEl('p', { text: errorString })
                return;
            }

            try {

                const path = normalizePath(`${targetFolder}/${file}`)

                const buffer = await context.app.vault.readBinary(context.app.vault.getFileByPath(path))
                await requestUrl({
                    url: response.text.trim(),
                    body: buffer,
                    method: 'PUT',
                    contentType: 'application/octet-stream',
                })




                const fileMd = context.app.vault.getAbstractFileByPath(ctx.sourcePath);
                if (!fileMd) return;

                // Write back to the .md file
                context.app.vault.process(fileMd, (data: any) => {
                    return data.replace(source, buildCodeBlock(vaultname, file, true));
                });
                temp.remove()
                const pathForResource = normalizePath(`${targetFolder}/${file}`)
                const tFile = context.app.vault.getFileByPath(pathForResource)
                renderIfOnSite(el, context, tFile, file, pathForResource)
            } catch (e) {
                console.error(e)
                const errorString = 'upload to storage failed (check signed URL headers)'
                new Notice(errorString, 5000)
                el.createEl('p', { text: errorString })
            }
        }

    } catch (e) {
        handleLongin(source, el, ctx, context, tries, vaultname, file, uploadManager)
    }



}


async function downloadManager(source: any, el: any, ctx: any, context: any, tries: number, vaultname: string, file: string) {
    const folder = await context.app.vault.getAbstractFileByPath(targetFolder)
    if (!folder || !(folder instanceof TFolder)) {
        await context.app.vault.createFolder(targetFolder)
    }
    const temp = el.createEl('p', { text: 'downloading image...' })

    const token = context.settings.token


    try {
        new Notice('about to go to getfile', 500)
        const response = await requestUrl({
            url: addressBase + 'api/filesync/getfile',
            method: "POST",
            contentType: "application/json",
            body: JSON.stringify({ vaultname: vaultname, file: file, token: context.settings.token }),
        })
        if (response.status == 201) {


            try {

                const download = await requestUrl({ url: response.text, method: "GET" })
                await context.app.vault.adapter.writeBinary(`${targetFolder}/${file}`, download.arrayBuffer)


                temp.remove()
                const pathForResource = normalizePath(`${targetFolder}/${file}`)
                const tFile = context.app.vault.getFileByPath(pathForResource)
                if (!tFile) {
                    console.error('should never get here because we just downloaded the file')
                }
                renderIfOnSite(el, context, tFile, file, pathForResource)
            } catch (e) {
                console.error(e)
                const errorString = 'unable to download file'
                new Notice(errorString, 5000)
                console.error(errorString)
                el.createEl('p', { text: errorString })
                return;

            }
        }

    } catch (e) {
        handleLongin(source, el, ctx, context, tries, vaultname, file, downloadManager)

    }
}

function renderIfOnSite(el: any, context: any, tFile: any, file: any, path: string) {

    const extension = file.split(".").pop()?.toLowerCase()
    const imageTypes = ["png", "jpg", "jpeg", "webp", "gif", "svg"]

    const div = el.createDiv()

    if (extension && imageTypes.includes(extension)) {
        // Get the local app:// resource URL for the TFile
        const resourcePath = context.app.vault.getResourcePath(tFile)

        div.createEl("img", {
            attr: {
                src: resourcePath,
                alt: file,
                cls: 'image'
            },
        })
        div.createEl('caption', { text: file })
    } else {
        const resourcePath = context.app.vault.getResourcePath(tFile)
        const button = div.createEl("button", {
            text: 'open file ' + file,

        })
        button.addEventListener('click', () => {
            const file = context.app.vault.getFileByPath(path)
            if (!file) {
                new Notice('file not found ' + resourcePath, 5000)
                return
            };
            context.app.workspace.getLeaf('tab').openFile(file)
        })
    }
}


async function handleLongin(source: any, el: any, ctx: any, context: any, tries: number, vaultname: string, file: string, callback: any) {
    if (tries == 1) {
        const errorString = 'sync failure, may be issue with log in credentials, internet connectivity, or server availablity'
        new Notice(errorString, 5000)
        console.error(errorString)
        const pathForResource = normalizePath(`${targetFolder}/${file}`)
        const tFile = context.app.vault.getFileByPath(pathForResource)
        renderIfOnSite(el, context, tFile, file, pathForResource)
        el.createEl('p', { text: 'failed to sync above with paccenter' })

        return;
    }

    const username = context.app.secretStorage.getSecret(context.settings.username)
    const password = context.app.secretStorage.getSecret(context.settings.password)


    if (!username || !password) {
        new Notice('must add login credentials in the arnstein app setings', 500)
        el.createEl('p', { text: 'must add credentials in settings for arnstein plugin to work' })
        return;
    }
    new Notice('about to login', 500)
    const loginResponse = await requestUrl({
        url: addressBase + 'api/filesync/login', method: "POST", headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
    })

    const { token } = JSON.parse(loginResponse.text)


    context.settings.token = token;
    await context.saveSettings();

    return callback(source, el, ctx, context, tries + 1, vaultname, file)
}


