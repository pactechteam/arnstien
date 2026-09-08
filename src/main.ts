import {
	Editor,
	MarkdownView,
	MarkdownFileInfo,
	Modal,
	Notice,
	Plugin,
	Platform,
} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	ArnsteinSettingsTab,
} from './settings';
import { OperationModal } from './sideBarModal';
import { handlePaste } from './handlePaste';
import { postProcessor } from './postProcessor';

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		await this.loadData()

		// This adds a settings tab so the user can add their paccenter username and password
		this.addSettingTab(new ArnsteinSettingsTab(this.app, this));

		//add menu option on desktop
		if (Platform.isDesktopApp) {
			this.addRibbonIcon('refresh-ccw-dot', 'Print Repo', (_evt: MouseEvent) => {
				// Called when the user clicks the icon.
				console.log('got here')
				new OperationModal(this.app).open()
			});
		}

		//handle paste operations
		handlePaste(this.app)

		//handle the rendering of the image block
		this.registerMarkdownCodeBlockProcessor('arnstein', postProcessor(this))


		//idea, handle a post change to check for any image links and convert them to an arnstien link
	}




	onunload() { }

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


