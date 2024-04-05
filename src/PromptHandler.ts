import { Notice, TFile } from 'obsidian';
import SpeechAutoToJournal from 'main'
import { getTFilesInFolder } from './utils'

export class PromptHandler {
	private plugin: SpeechAutoToJournal;

	constructor(plugin: SpeechAutoToJournal) {
		this.plugin = plugin;
	}

    async generateChatMessage(
        dateStr: string
    ): Promise<void> {
        const vault = this.plugin.app.vault
        const textFolder = `AutoJournal/${dateStr}/text`;
        const notes = await getTFilesInFolder(vault, textFolder)

        if (!notes || !notes.length) {
            new Notice(`no note found in ${textFolder}`)
            return
        }

        let data = []
        for (const note of notes) {
            const fileContent = await vault.read(note);
            data.push({
                name: note.basename,
                origin: fileContent,
                content: fileContent.replace(/!\[.*\]\n/g, '')
            })
        }
        data = data.sort((a: any, b: any) => a.name.localeCompare(b.name))
        const prompt = `Today is ${dateStr}. I want you to be my daily journal co-pilot. I will write down my random thoughts, notes ideas etc during the day. At the end of the day I will ask you to:
1. Write a version of my journal that is better formatted, logically structured/organized, with improved writing without altering the meaning of my journal.
2. Summarize the key take-aways from my journal
3. Discover important insights into my life
4. Base on my journal, create an actionable to-do lists of the tasks/plans mentioned in my journal. Write the list in first-person voice, also in JSON following this template:
{
"Task Name ": "Task Description",
}

Here is an example:
{
    "Develop AI Tutoring System": "I need to start developing my idea for a learning tutor system using ChatGPT.",
    "Invest in Tesla": "I need to review my investment plan for Tesla and decide whether to adjust it based on the recent market movement."
}

%%Begin of my day%%
`

        const promptEnd = `
%%End of my day%%

Perform the tasks now, thanks!`

        const ask = prompt + data.map((e) => e.content).join("\n\n") + promptEnd

        new Notice('Wait for ai responding')
        const result = await this.plugin.ai.singleChat(ask)
        const journalPath = `AutoJournal/${dateStr}/${dateStr}_auto_journal.md`
        new Notice(`Saving to ${journalPath}`)
        await vault.adapter.write(
            journalPath,
            "## User\n" + ask + `\n## Auto\n%%BEGIN-AUTO-JOURNAL-AI-RESPONSE%%\n${result}\n%%END-AUTO-JOURNAL-AI-RESPONSE%%\n### Audios\n` + data.map((e) => e.origin).join("\n\n")
        );
        new Notice('Done')
    }
}