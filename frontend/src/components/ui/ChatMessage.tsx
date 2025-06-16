import React from 'react';
import { MessageType } from '../../types/gpt';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const response = message.response;

  if (isUser) {
    return (
      <div className="px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap rounded-2xl bg-blue-600 text-white self-end ml-auto">
        {message.content}
      </div>
    );
  }

  // Si c'est une réponse de l'assistant
  return (
    <div className="space-y-2 max-w-[80%] self-start mr-auto">
      {/* Message principal - utiliser response.message s'il existe, sinon message.content */}
      <div className="px-4 py-2 text-sm whitespace-pre-wrap rounded-2xl bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white">
        {response?.message || message.content}
      </div>

      {/* Résultats de l'opération (si c'est une action) */}
      {response?.type === 'action' && response.results && (
        <div className="px-4 py-2 text-xs rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Action effectuée</span>
          </div>
          
          {response.results.modified_columns && response.results.modified_columns.length > 0 && (
            <div className="text-zinc-500 dark:text-zinc-400">
              Colonnes modifiées : {response.results.modified_columns.join(', ')}
            </div>
          )}
          
          {response.results.rows_modified && (
            <div className="text-zinc-500 dark:text-zinc-400">
              {response.results.rows_modified} ligne(s) modifiée(s)
            </div>
          )}
        </div>
      )}

      {/* Message d'erreur uniquement si le code est vraiment manquant */}
      {response?.type === 'action' && response.requires_code && !response.results && (
        <div className="px-4 py-2 text-xs rounded-2xl bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Action non exécutée : code manquant</span>
        </div>
      )}
    </div>
  );
};

export default ChatMessage; 