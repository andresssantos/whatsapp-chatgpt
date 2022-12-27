const fs = require('fs');

import { Util } from './util';

// Environment variables
require('dotenv').config()

export class ConversationHistory {
    private conversationsHistory: any;
  
    constructor() {
      this.conversationsHistory = {}
    }

  private maxHistorySize = Number(process.env.MAX_HISTORY_SIZE); // tamanho máximo do histórico

  storeMessage(id: string, prompt: any, response: any) {
    const util = new Util()
    if (typeof response === 'string') {
      // Check if the conversation history already exists
      if (this.conversationsHistory[id]) {
        // If it exists, add the new message to the existing history
        this.conversationsHistory[id].push(prompt + util.addPunctuation(response.replace(/\r?\n/g, '')));

        // Verifique se o tamanho do histórico excede o tamanho máximo permitido
        if (this.conversationsHistory[id].length > this.maxHistorySize) {
          // Se exceder, apague a mensagem mais antiga
          this.deleteOldestMessage(id);
        }
      } else {
        // If it doesn't exist, create a new history for the conversation
        this.conversationsHistory[id] = [prompt + util.addPunctuation(response.replace(/\r?\n/g, ''))];
      }

      // Save the updated history to a JSON file
      fs.writeFileSync(id + '.json', JSON.stringify(this.conversationsHistory[id], null, 2));
    }
  }
  readHistory(id: string) {
    const filePath = `${id}.json`;
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  }

  deleteOldestMessage(id: string) {
    this.conversationsHistory[id].shift(); // remove the first message from the array
    fs.writeFileSync(id + '.json', JSON.stringify(this.conversationsHistory[id], null, 2));
  }
}
  