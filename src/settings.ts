import { App, PluginSettingTab, SecretComponent, Setting, } from 'obsidian';
import MyPlugin from './main';

export interface MyPluginSettings {
	username: string;
	password: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	username: '',
	password: '',
};


export class ArnsteinSettingsTab extends PluginSettingTab {
plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('username')
      .setDesc('Username or email for paccenter')
      .addComponent(el => new SecretComponent(this.app, el)
        .setValue(this.plugin.settings.username)
        .onChange(value => {
          this.plugin.settings.username = value;
          this.plugin.saveSettings();
        }));

        new Setting(containerEl)
      .setName('password')
      .setDesc('password for paccenter')
      .addComponent(el => new SecretComponent(this.app, el)
        .setValue(this.plugin.settings.password)
        .onChange(value => {
          this.plugin.settings.password = value;
          this.plugin.saveSettings();
        }));
  }
	}



