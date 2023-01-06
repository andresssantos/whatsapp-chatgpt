const delay = require('delay');

import { Elasticsearch } from './elasticsearch';
import { Util } from './util';

const elasticsearch = new Elasticsearch()
const util = new Util()

export class ConversationHistory {
  
  getByChatId = async (id: any, embeddingVector: any) => {
    let contextHistory: string = ''
    const newIndex = await elasticsearch.createIndexIfNotExists(id)
  
    await delay(1000)
  
    if(!newIndex){
      const documentsByCosineSimilarity = await elasticsearch.getDocumentsByCosineSimilarity(id, embeddingVector)
  
      if (documentsByCosineSimilarity.length === 0) {
        const lastDocuments = await elasticsearch.getLastDocuments(id, 10)
        contextHistory = util.transformToQAFormat(lastDocuments.reverse())
        console.log('[Conversation-history] History by last documents:' + JSON.stringify(contextHistory, null, 2))
      } else {
        contextHistory = util.transformToQAFormat(documentsByCosineSimilarity)
        console.log('[Conversation-history] History by cosine similarity:' + JSON.stringify(contextHistory, null, 2))
      }  
    }
    
    return contextHistory 
  }  

  save = async (id: any, timestamp: any, prompt: any, response: any, embeddingVector: any) => {
    await elasticsearch.save(
        id,
        new Date(timestamp*1000).toISOString(),
        prompt,
        response.replace(/\r?\n/g, ''),
        embeddingVector
      )
  }

}
  