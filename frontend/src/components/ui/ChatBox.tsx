import React, { useState, useRef, useEffect, useContext } from 'react';
import { ArrowUp } from 'lucide-react';
import ScrollArea from './scroll-area';
import { FileContext } from '../../context/FileContext';
import TervelSpinner from './TervelSpinner';
import { processPrompt } from '../../lib/callGpt';
import ChatMessage from './ChatMessage';
import { MessageType } from '../../types/gpt';
import { useAuth, useUser } from '@clerk/clerk-react';
import Logger from '../../lib/logger';

type ChatBoxProps = {
  onPromptProcessed?: (processedData: any, columns: string[]) => void;
};

export default function ChatBox({ onPromptProcessed }: ChatBoxProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data, setData } = useContext(FileContext);
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  // Mettre à jour les informations utilisateur quand elles changent
  useEffect(() => {
    if (user) {
      Logger.setUserInfo({
        email: user.primaryEmailAddress?.emailAddress,
        sub: user.id
      });
    }
  }, [user]);

  const addAssistantMessage = (content: string, type: 'error' | 'success' = 'success') => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content,
        response: {
          type: type === 'error' ? 'conversation' : 'action',
          requires_code: false,
          message: content
        }
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    setIsThinking(true);
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');

    try {
      // Vérification de l'authentification
      if (!isSignedIn) {
        throw new Error("Veuillez vous connecter pour utiliser cette fonctionnalité");
      }

      // Vérification des données
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Aucune donnée disponible pour appliquer la règle");
      }

      // Obtention du token
      const token = await getToken();
      if (!token) {
        throw new Error("Impossible d'obtenir le token d'authentification");
      }

      Logger.auth(token, { 
        component: "ChatBox",
        details: { email: user?.primaryEmailAddress?.emailAddress }
      });

      // Préparation des données
      const inputHeaders = Object.keys(data[0]);
      const inputRows = data.map(row => inputHeaders.map(header => row[header]));
      const dataAsAOA = [inputHeaders, ...inputRows];

      Logger.request("Envoi de la requête", { 
        component: "ChatBox",
        details: { 
          prompt: input,
          dataRows: dataAsAOA.length
        }
      });
      
      const response = await processPrompt(input, dataAsAOA, token, user?.primaryEmailAddress?.emailAddress);
      
      Logger.response("Réponse reçue", { 
        component: "ChatBox",
        details: { 
          messageLength: response.message.length,
          dataRows: response.data.length
        }
      });
      
      // Traitement de la réponse
      const [outputHeaders, ...outputRows] = response.data;
      const formattedData = outputRows.map(row => {
        const obj: { [key: string]: any } = {};
        outputHeaders.forEach((header: string, index: number) => {
          obj[header] = row[index];
        });
        return obj;
      });

      Logger.debug("Données formatées", { 
        component: "ChatBox",
        details: { 
          rowCount: formattedData.length,
          columns: outputHeaders
        }
      });

      // Mise à jour des données et de l'interface
      setData(formattedData);
      addAssistantMessage(response.message);

      if (onPromptProcessed) {
        onPromptProcessed(formattedData, outputHeaders as string[]);
      }

    } catch (error) {
      Logger.error("Erreur", { 
        component: "ChatBox",
        details: error 
      });
      const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue s'est produite";
      addAssistantMessage(`❌ ${errorMessage}`, 'error');
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col w-full max-w-full h-full bg-transparent text-zinc-900 dark:text-white">
      <ScrollArea className="flex-1 px-4 pt-3 overflow-y-auto">
        <div ref={bottomRef} className="space-y-4">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
        </div>
      </ScrollArea>

      <form 
        onSubmit={(e) => { 
          e.preventDefault(); 
          handleSend(); 
        }} 
        className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Entrez votre commande ici..."
          className="flex-1 px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm font-normal"
          disabled={!isSignedIn}
        />
        <button
          type="submit"
          disabled={isThinking || !isSignedIn}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isThinking ? (
            <TervelSpinner className="w-5 h-5" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}