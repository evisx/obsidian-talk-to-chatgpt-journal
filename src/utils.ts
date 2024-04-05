import { Vault, TFolder, TFile } from 'obsidian';

export function getBaseFileName(filePath: string): string {
    // Extract the file name including extension
    const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
    // Remove the extension from the file name
    const baseFileName = fileName.substring(0, fileName.lastIndexOf("."));
    return baseFileName;
}

export async function inputFile(
    accept: string = "audio/*",
    multi: boolean = false
): Promise<FileList> {
    return new Promise((resolve, reject) => {
        // Create a file input element
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = accept;
        fileInput.multiple = multi; // Allow multiple file selection or note

        // Listen for file selection
        fileInput.onchange = () => {
            // Check if files were selected
            if (fileInput.files && fileInput.files.length > 0) {
                resolve(fileInput.files);
            } else {
                console.error('no file selected')
                reject();
            }
        };

        // Simulate a click on the file input to open the file dialog
        fileInput.click();
    });
}

export async function saveFile(
    vault: Vault,
    filePath: string,
    data: Uint8Array
): Promise<void> {
	return vault.adapter.writeBinary(
		filePath,
        data
	);
}

export async function ensureFolder(
    vault: Vault,
    folderPath: string
): Promise<void> {
    try {
        const ex = await vault.adapter.exists(folderPath);
        if (!ex) {
            await vault.createFolder(folderPath);
        }
    } catch (error) {
        console.error(`Error ensuring folder '${folderPath}':`, error);
        throw error; // Re-throw the error if you want calling code to handle it as well
    }
}

export async function getAudioFilesInFolder(
    vault: Vault,
    folderPath: string
): Promise<TFile[]> {
    return getTFilesInFolder(vault, folderPath, ['webm', 'mp3', 'wav', 'ogg', 'm4a'])
}

export async function getTFilesInFolder(
    vault: Vault,
    folderPath: string,
    extensions: string[] = ['md', 'text'],
): Promise<TFile[]> {
    const folder = vault.getAbstractFileByPath(folderPath);

    if (!folder || !(folder instanceof TFolder)) {
        console.error("Folder not found or path does not refer to a folder.");
        return [];
    }

    let files: TFile[] = [];

    folder.children.forEach(child => {
        if (child instanceof TFile && extensions.some(ext => child.name.toLowerCase().endsWith(`.${ext}`))) {
            files.push(child);
        }
    });

    // // Function to recursively get all files in the folder and filter by audio extensions
    // function getFilesRecursively(folder: TFolder) {
    //     // Access children of the folder
    //     folder.children.forEach(child => {
    //         if (child instanceof TFolder) {
    //             getFilesRecursively(child);
    //         } else if (child instanceof TFile && audioExtensions.some(ext => child.name.toLowerCase().endsWith(`.${ext}`))) {
    //             audioFiles.push(child);
    //         }
    //     });
    // }

    // // Start the recursive search from the target folder
    // getFilesRecursively(folder);

    return files;
}