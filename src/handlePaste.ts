import {
    Editor,
    MarkdownView,
    MarkdownFileInfo,
    Modal,
    Notice,
    Plugin,
    Platform, App, normalizePath,
    TFolder
} from 'obsidian';
export const targetFolder = 'filesAndphotos'

export function handlePaste(app: App) {

    app.workspace.on('editor-paste', async (event, editor) => {

        await handleFilePaste(event, editor, app)
    })
    // work on drag and drop later
    app.workspace.on('editor-drop', async (event, editor) => {
        await handleFileDrag(event, editor, app)
    })
}


async function handleFilePaste(event: ClipboardEvent, editor: Editor, app: App) {
    if (!event.clipboardData) return;
    if (!event.clipboardData.items) return;
    if (event.defaultPrevented) return;
    //check for files
    for (const item of event.clipboardData.items) {
        if (item.kind != 'file') continue;
        event.preventDefault()
        const file = item.getAsFile() as File
        await handleFile(file, editor, app)
    }

}

async function handleFileDrag(event: DragEvent, editor: Editor, app: App) {
    if (event.defaultPrevented) return;
    if (!event.dataTransfer) return;

    for (const file of event.dataTransfer.files) {
        event.preventDefault()
        await handleFile(file, editor, app)
    }

}

async function handleFile(file: File, editor: Editor, app: App) {
    let fileName = file.name;


    const folder = await app.vault.getAbstractFileByPath(targetFolder)
    if (!folder || !(folder instanceof TFolder)) {
        await app.vault.createFolder(targetFolder)
    }
    let path = normalizePath(`${targetFolder}/${fileName}`)

    const check = app.vault.getFileByPath(path)
    if (check != null) {
        console.log('inside if statement')
        const parts = fileName.split('.')
        const name = parts[0]
        const kind = parts[1]
        fileName = name + Date.now() + '.' + kind
        path = normalizePath(`${targetFolder}/${fileName}`)
    }

    const buffer = await file.arrayBuffer()
    await app.vault.createBinary(path, buffer)

    //start working on building the code block that will be rendered.
    const codeBlock = buildCodeBlock(app.vault.getName(), fileName, false)

    const cursorLocation = editor.getCursor()
    editor.replaceSelection("```arnstein\n" + codeBlock + "\n```\n")



}

export function buildCodeBlock(vaultname: string, fileName: string, uploaded: boolean) {
    return `            vaultname:${vaultname}
            file:${fileName}
            uploaded:${uploaded ? 'true' : 'false'}
       `
}