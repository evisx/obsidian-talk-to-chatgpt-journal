import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { SettingsManager, Settings } from 'src/SettingsManager';
import { SettingsTab } from 'src/SettingsTab';
import { AudioHandler } from 'src/AudioHandler';
import { PromptHandler } from 'src/PromptHandler';
import { AiManager } from 'src/AiManager';


export default class SpeechAutoToJournal extends Plugin {
	settings: Settings;
	settingsManager: SettingsManager;
	audioHandler: AudioHandler;
	promptHandler: PromptHandler;
	ai: AiManager;

	async onload() {
		this.settingsManager = new SettingsManager(this);
		this.settings = await this.settingsManager.loadSettings();

		this.addSettingTab(new SettingsTab(this.app, this));

		this.audioHandler = new AudioHandler(this);
		this.promptHandler = new PromptHandler(this);
		this.ai = new AiManager(this.settings.apiKey)
		this.addCommands();
	}

	onunload() {
	}

	addCommands() {
		this.addCommand({
			id: "save-audio-files-to-current-date",
			name: "save audio files to current date",
			callback: async () => {
				const current = this.app.workspace.getActiveFile()
				if (!current) {
					new Notice('No active file')
					return
				}
				// Use a regular expression to extract a date in the format YYYY-MM-DD
				const regex = /\d{4}-\d{2}-\d{2}/;
				const match = current.basename.match(regex);

				if (!match) {
					new Notice('No in a date file')
					return
				}

				const dateStr = match[0]
				this.audioHandler.saveAudioFilesToOb(dateStr)
				new Notice('Audio files saved!')
			}
		});

		this.addCommand({
			id: "generate-auto-journal-of-current-date",
			name: "generate auto journal of current date",
			callback: async () => {
				const current = this.app.workspace.getActiveFile()
				if (!current) {
					new Notice('No active file')
					return
				}
				// Use a regular expression to extract a date in the format YYYY-MM-DD
				const regex = /\d{4}-\d{2}-\d{2}/;
				const match = current.basename.match(regex);

				if (!match) {
					new Notice('No in a date file')
					return
				}

				const dateStr = match[0]
				this.audioHandler.audiosToText(dateStr)
					.then(() => this.promptHandler.generateChatMessage(dateStr))
			}
		});

		this.addCommand({
			id: "speech-to-auto-journal",
			name: "speech to auto journal",
			callback: async () => {
				const current = this.app.workspace.getActiveFile()
				if (!current) {
					new Notice('No active file')
					return
				}
				// Use a regular expression to extract a date in the format YYYY-MM-DD
				const regex = /\d{4}-\d{2}-\d{2}/;
				const match = current.basename.match(regex);

				if (!match) {
					new Notice('No in a date file')
					return
				}

				const dateStr = match[0]

				await this.audioHandler.saveAudioFilesToOb(dateStr)
				new Notice('Audio files saved!')
				this.audioHandler.audiosToText(dateStr)
					.then(() => this.promptHandler.generateChatMessage(dateStr))
			}
		});
	}
}