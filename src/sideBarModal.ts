import {
    Modal,
    Platform
} from 'obsidian';

export class OperationModal extends Modal {
	
	onOpen() {
		const { contentEl } = this;
			contentEl.setText('This is where the ability to print the repo will go, eventually. Feature still under development');


		
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}