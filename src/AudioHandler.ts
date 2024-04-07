import { Vault, Notice } from 'obsidian';
import SpeechAutoToJournal from 'main';
import { SettingsManager, Settings } from 'src/SettingsManager';
import { inputFile, saveFile, ensureFolder, getAudioFilesInFolder } from './utils';

export class AudioHandler {
	private plugin: SpeechAutoToJournal;

	constructor(plugin: SpeechAutoToJournal) {
		this.plugin = plugin;
	}

    async saveAudioFilesToOb(
        dateStr: string
    ): Promise<void> {
        const audioFiles = await inputFile("audio/*", true)
        const audioFileDir = `AutoJournal/${dateStr}/audio/`
        // TODO:
        // const audioFileDir = this.plugin.settings.saveAudioFilePath ? `${this.plugin.settings.saveAudioFilePath}/` : ''
        const vault = this.plugin.app.vault
        ensureFolder(vault, audioFileDir)
        // promise array
        const promises :Promise<void>[] = []
        for (let i = 0; i < audioFiles.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                // Read the file as an ArrayBuffer (binary data)
                const file = audioFiles[i]
                const reader = new FileReader();
                reader.onload = async () => {
                    try {
                        // Convert the ArrayBuffer to Uint8Array
                        const arrayBuffer = reader.result as ArrayBuffer;
                        const uint8Array = new Uint8Array(arrayBuffer);
                        // Choose or define the save location within the Obsidian vault
                        // For simplicity, we're using a fixed path here. Consider allowing users to choose.
                        const savePath = audioFileDir + file.name; // Example path
                        // Use Obsidian's API to overwrite the file to the vault
                        await saveFile(vault, savePath, uint8Array);
                        console.log("Audio file saved successfully to", savePath);
                        resolve()
                    } catch (error) {
                        console.error("Failed to save audio file:", error);
                        reject(error)
                    }
                };
                reader.onerror = (error) => reject(error);
                reader.readAsArrayBuffer(file);
            }))
        }

        // wait all promise done
        await Promise.all(promises)
    }

    async audiosToText(
        dateStr: string
    ): Promise<void> {
        const audioFolder = `AutoJournal/${dateStr}/audio`;
        const textFolder = `AutoJournal/${dateStr}/text`;
        const vault = this.plugin.app.vault
        const files = await getAudioFilesInFolder(vault, audioFolder);

        if (!files || !files.length) {
            new Notice(`no audio found in ${audioFolder}`)
            return
        }

        const adapter = vault.adapter
        ensureFolder(vault, textFolder)
        for (const file of files) {
            const text = `${textFolder}/${file.basename}.text`
            if (await adapter.exists(text)) {
                new Notice(`${text} already existed! skip`)
                continue
            }

            const arrayBuffer = await vault.readBinary(file)
            new Notice(`Sending ${file.path}`);
            const data = await this.plugin.ai.audioToText(new Blob([arrayBuffer]), `${file.basename}.${file.extension}`);
            new Notice(`Saving ${text}`);
            await vault.create(
                    text,
                    `![[${file.path}]]\n${data}`
            );
        }
    }
}