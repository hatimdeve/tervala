import { GPTResponse } from "../types/gpt";
import Logger from './logger';

export type CleaningRule = {
  type: 'delete_rows' | 'format_column' | 'deduplicate';
  column: string;
  value?: string;
  format?: string;
};

export type KpiResult = {
  chartType: "bar" | "pie" | "line";
  data: any[];
};

export type ProcessPromptResponse = {
  data: any[][];
  message: string;
  gptResponse: GPTResponse;
};

interface DataRow {
  [key: string]: any;
}

export async function processPrompt(prompt: string, data: any[][], token: string, email?: string): Promise<ProcessPromptResponse> {
  try {
    if (!token) {
      throw new Error("Token d'authentification manquant");
    }

    Logger.debug("Préparation des données", { component: "processPrompt" });
    
    // Convertir le tableau de tableaux en tableau d'objets
    const [headers, ...rows] = data;
    const objectData = rows.map(row => {
      const obj: { [key: string]: any } = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    Logger.request("Envoi de la requête", { 
      component: "processPrompt",
      details: { endpoint: "/file/process" }
    });

    const processResponse = await fetch("http://localhost:8000/files/quick-process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-User-Email": email || '',
        "Accept": "application/json",
      },
      mode: 'cors',
      credentials: 'include',
      body: JSON.stringify({
        data: objectData,
        prompt: prompt
      }),
    });

    Logger.debug("Statut de la réponse", { 
      component: "processPrompt",
      details: { 
        status: processResponse.status,
        statusText: processResponse.statusText
      }
    });

    if (!processResponse.ok) {
      let errorMessage = `Erreur HTTP ${processResponse.status}`;
      try {
        const errorData = await processResponse.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        try {
          errorMessage = await processResponse.text();
        } catch {
          // Fallback au message d'erreur par défaut
        }
      }
      throw new Error(errorMessage);
    }

    const processResult = await processResponse.json();
    Logger.debug("Réponse du backend", { 
      component: "processPrompt",
      details: { messageLength: processResult.message.length }
    });
    
    // Créer la réponse GPT
    const gptResponse: GPTResponse = {
      type: processResult.message.toLowerCase().includes('bonjour') || 
            processResult.message.toLowerCase().includes('salut') || 
            processResult.message.toLowerCase().includes('hello') || 
            processResult.message.toLowerCase().includes('hi') ? 'conversation' : 'action',
      requires_code: !processResult.message.toLowerCase().includes('bonjour') && 
                    !processResult.message.toLowerCase().includes('salut') && 
                    !processResult.message.toLowerCase().includes('hello') && 
                    !processResult.message.toLowerCase().includes('hi'),
      message: processResult.message,
      results: {
        modified_columns: [],
        rows_before: data.length - 1,
        rows_after: processResult.data.length,
        rows_modified: Math.abs(data.length - 1 - processResult.data.length)
      }
    };

    // Convertir les données en format tableau de tableaux pour la réponse
    const resultHeaders = Object.keys(processResult.data[0] || {});
    const resultRows = processResult.data.map((row: DataRow) => resultHeaders.map(header => row[header]));
    const resultData = [resultHeaders, ...resultRows];

    return {
      data: resultData,
      message: processResult.message,
      gptResponse
    };

  } catch (error) {
    Logger.error("Erreur", { 
      component: "processPrompt",
      details: error 
    });
    throw error;
  }
}

export async function callGpt(prompt: string, data: any[], token: string, email?: string): Promise<GPTResponse> {
  try {
    if (!token) {
      throw new Error("Token d'authentification manquant");
    }

    Logger.request("Envoi de la requête", { 
      component: "callGpt",
      details: { endpoint: "/file/gpt" }
    });

    const response = await fetch("http://localhost:8000/files/gpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-User-Email": email || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        prompt: prompt,
        data: data
      }),
    });

    Logger.debug("Statut de la réponse", { 
      component: "callGpt",
      details: { 
        status: response.status,
        statusText: response.statusText
      }
    });

    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        try {
          errorMessage = await response.text();
        } catch {
          // Fallback au message d'erreur par défaut
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    Logger.debug("Réponse du backend", { 
      component: "callGpt",
      details: { type: result.type }
    });

    const gptResponse: GPTResponse = {
      type: result.type || "action",
      requires_code: result.requires_code || false,
      message: result.message,
      results: result.results,
      kpi_data: result.kpi_data
    };

    Logger.debug("Réponse GPT formatée", { 
      component: "callGpt",
      details: { type: gptResponse.type }
    });
    return gptResponse;
  } catch (error) {
    Logger.error("Erreur", { 
      component: "callGpt",
      details: error 
    });
    throw error;
  }
}