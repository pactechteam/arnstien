import {
	Editor,
	MarkdownView,
	MarkdownFileInfo,
	Modal,
	Notice,
	Plugin,
	Platform,
	Setting,
	PluginSettingTab,
	App,
} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	ArnsteinSettingsTab,
} from './settings';

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('refresh-ccw-dot', 'Sample', (_evt: MouseEvent) => {
			// Called when the user clicks the icon.
			console.log('got here')
			new OperationModal(this.app).open()
		});




		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ArnsteinSettingsTab(this.app, this));


		this.addCommand({
			id: 'replace-selected',
			name: 'Replace selected content',
			editorCallback: (
				editor: Editor,
				_ctx: MarkdownView | MarkdownFileInfo,
			) => {
				editor.replaceSelection('Sample editor command');
			},
		})

	}

	onunload() {}

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


class OperationModal extends Modal {
	
	onOpen() {
		const { contentEl } = this;
		if(Platform.isDesktopApp){
			contentEl.setText('This is the desktop app, you can do git operations her');
		}else{
			if(Platform.isMobileApp){
						contentEl.setText('Functionality is limited on mobile, please see additional provided training for how to setup');
		}else{
			contentEl.setText('This state should never be reached, please inform the developer');
		}
		}
		

		
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
