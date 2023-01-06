const elasticsearch = require('elasticsearch');

// Environment variables
require('dotenv').config()

// Elasticsearch client
const elastic = new elasticsearch.Client({
    host: 'https://elastic:elastic@ec2-54-165-57-42.compute-1.amazonaws.com:9200',
    auth: {
      username: 'elastic',
      password: 'elastic',
    },
    ssl: {
      verify: false,
    }
  });
  
  export class Elasticsearch{
    
    save = async (index: any, timestamp: any, prompt: any, completion: any, embeddings: any) => {
      await elastic.index({
        index: index,
        op_type: 'create',
        body: {
          timestamp: timestamp,
          prompt: prompt,
          completion: completion,
          embeddings: embeddings[0].embedding
        },
      });
    }
    
    getDocumentsByCosineSimilarity = async (index: any, embeddingVector: any) => {
      // Search for all documents in the specified index
      const response = await elastic.search({
          index: index,
          body: {
              query: {
                  match_all: {},
              },
          },
          size: 10000
      });
      
      // Compute the cosine similarity between the embedding vector vector and each document vector
      const hits = response.hits.hits.map((hit) => {
          const documentVector = hit._source.embeddings;
          const dotProduct = embeddingVector[0].embedding.reduce((acc, val, i) => acc + val * documentVector[i], 0);
          const embeddingVectorNorm = Math.sqrt(embeddingVector[0].embedding.reduce((acc, val) => acc + val * val, 0));
          const documentNorm = Math.sqrt(documentVector.reduce((acc, val) => acc + val * val, 0));
          hit._score = dotProduct / (embeddingVectorNorm * documentNorm);
          return hit;
      });

      // Criar uma cópia de cada objeto na lista "hits"
      let copy = response.hits.hits.map(hit => {
        return Object.assign({}, hit)
      })

      // Remover o campo "embeddings" da cópia
      copy.forEach(hit => {
        delete hit._source.embeddings
      })
      
      return hits
          .filter((hit) => hit._score >= 0.86)
          .sort((a, b) => a._score - b._score)
          .slice(0, 10);
    }

    getLastDocuments = async (index: any, numberOfDocuments: any) => {
      const result = await elastic.search({
        index: index,
        body: {
          query: {
            match_all: {}
          },
          sort: [{ 'timestamp': { 'order': 'desc' } }],
          size: numberOfDocuments
        }
      })

      // Criar uma cópia de cada objeto na lista "hits"
      let copy = result.hits.hits.map(hit => {
        return Object.assign({}, hit)
      })

      // Remover o campo "embeddings" da cópia
      copy.forEach(hit => {
        delete hit._source.embeddings
      })

      return result.hits.hits
    }

    createIndexIfNotExists = async (index: any) => {
      let indexCreated = false;
      const indexExists = await elastic.indices.exists({ index });
    
      if (!indexExists) {
        await elastic.indices.create({ index });
        indexCreated = true;
        console.log(`[Elasticsearch] Created index ${index}`);
      }
    
      return indexCreated;
    }

  }