const fs = require('fs');

import { Util } from './util';

// Environment variables
require('dotenv').config()

export class ConversationHistory {
    private conversationsHistory: any;
  
    constructor() {
      this.conversationsHistory = {}
      this.readAllHistory()
    }

  private maxHistorySize = Number(process.env.MAX_HISTORY_SIZE); // tamanho máximo do histórico

  storeMessage(id: string, keyword: string, prompt: string, response: string) {
    const util = new Util();
    const maxHistorySize = this.maxHistorySize; // Define o tamanho máximo permitido para o histórico de conversa
  
    // Inicializa a variável data como um array vazio
    let data: { 
      keyword: string,
       history: { 
        prompt: string,
        response: string
       }[]
      }[] = [];

    // Verifica se o arquivo JSON com o histórico de conversa já existe
    if (fs.existsSync(`${id}.json`)) {
      // Se existir, lê o arquivo JSON e armazena o conteúdo em data
      data = JSON.parse(fs.readFileSync(`${id}.json`));
      data = Object.values(data);
    }
  
    // Verifica se a keyword já existe em algum objeto da lista
    let keywordExists = false;
    for (let i = 0; i < data.length; i++) {
      if (data[i].keyword === keyword) {
        // Se a keyword já existir, adiciona o prompt e o response ao atributo history do objeto
        data[i].history.push({ prompt: prompt, response: response });
  
        // Verifica se o tamanho da lista history excede o tamanho máximo permitido
        if (data[i].history.length > maxHistorySize) {
          // Se exceder, remove o primeiro elemento da lista (a mensagem mais antiga)
          data[i].history.shift();
        }
        keywordExists = true;
        break;
      }
    }
  
    if (!keywordExists) {
      // Se a keyword não existir, cria um novo objeto com a nova keyword e adiciona prompt e response ao atributo history desse novo objeto
      const newData = {
        keyword: keyword,
        history: [{ prompt: prompt, response: response }]
      };
  
      // Adiciona o novo objeto à lista de objetos
      data.push(newData);
    }
  
    // Grava a lista atualizada de objetos em um arquivo JSON
    fs.writeFileSync(`${id}.json`, JSON.stringify(data, null, 2));
  }
  
  readHistory(id: string) {
    // Define o caminho do arquivo JSON
    const filePath = `${id}.json`;
  
    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return null;
    }
  
    // Lê o conteúdo do arquivo JSON e armazena em uma variável
    let data = fs.readFileSync(filePath);
  
    // Converte o conteúdo do arquivo JSON em um objeto JavaScript
    return JSON.parse(data);
  }  

  readAllHistory() {
    // Lê todos os arquivos do diretório
    const files = fs.readdirSync('./');
  
    // Filtra os arquivos para obter somente aqueles que terminam com .json
    const jsonFiles = files.filter((file) => file.endsWith('.json'));
  
    // Para cada arquivo JSON, lê o conteúdo e armazena em conversationsHistory
    jsonFiles.forEach((file) => {
      // Lê o conteúdo do arquivo JSON
      const data = JSON.parse(fs.readFileSync(file));
  
      // Armazena o histórico de conversa em conversationsHistory
      this.conversationsHistory[file] = data.history;
    });
  }

  filterHistoryByKeywords = (id: string, keywords: string[] | undefined) => {
    let filteredHistory = '';
    let historyCount = 0;
  
    // Lê o arquivo JSON com o histórico de conversa
    const data: [{
      keyword: string,
      history: {
        prompt: string,
        response: string
      }[]
    }] = this.readHistory(id);
  
    // Verifica se o objeto data é nulo ou vazio
    if (data === null) {
      return undefined;
    }

    // Verifica se o array de keywords foi passado como parâmetro
    if (!keywords) {
      // Se não foi passado, percorre todo o histórico
      for (const conversation of Object.values(data).reverse()) {
        // Verifica se o objeto atual da iteração é nulo ou se não possui a propriedade keyword
        if (conversation === null || !conversation.hasOwnProperty('keyword')) {
          continue;
        }
  
        // Percorre a lista de histórico de conversa
        for (const history of conversation.history) {
          historyCount++;

          if (historyCount > this.maxHistorySize) {
            break;
          }
          
          // Adiciona o prompt e o response no acumulador
          filteredHistory += `${history.prompt} ${history.response}\n`;
        }
      }
    } else {
      // Se o array de keywords foi passado, percorre somente o histórico das keywords especificadas
      for (const conversation of Object.values(data)) {
        // Verifica se o objeto atual da iteração é nulo ou se não possui a propriedade keyword
        if (conversation === null || !conversation.hasOwnProperty('keyword')) {
          continue;
        }
  
        // Verifica se o atributo keyword está contido no array de keywords passado como parâmetro
        if (keywords.includes(conversation.keyword)) {
          // Percorre a lista de histórico de conversa
          for (const history of conversation.history) {
            historyCount++;

            if (historyCount > this.maxHistorySize) {
              break;
            }
            
            // Adiciona o prompt e o response no acumulador
            filteredHistory += `${history.prompt} ${history.response}\n`;
          }
        }
      }
    }

    return filteredHistory
  }

}
  