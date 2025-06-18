// src/lib/gpt.ts

export async function callGpt(prompt: string): Promise<{ type: 'text' | 'rule'; content: string | any }> {
    console.log('[GPT] Prompt envoyé :', prompt);
  
    // Mock : si le prompt contient "TEST", on renvoie une règle en JSON
    if (prompt.toLowerCase().includes('test')) {
      return {
        type: 'rule',
        content: {
          action: 'delete_rows_containing',
          column: 'Nom',
          value: 'TEST'
        }
      };
    }
  
    // Sinon réponse textuelle classique
    return {
      type: 'text',
      content: `Voici la réponse de GPT pour : "${prompt}"`
    };
  }