import React, { useState, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import ScrollArea from './scroll-area';
import { useDashboardContext } from '../../context/DashboardContext';
import { callGpt } from '../../lib/callGpt';
import TervelSpinner from './TervelSpinner';
import ChatMessage from './ChatMessage';
import { MessageType } from '../../types/gpt';
import { useAuth, useUser } from '@clerk/clerk-react';
import Logger from '../../lib/logger';

interface KpiChatBoxProps {
  onPromptProcessed: (processedData: any, columns: string[]) => void;
}

const KpiChatBox: React.FC<KpiChatBoxProps> = ({ onPromptProcessed }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const { dashboardData: data } = useDashboardContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const { user } = useUser();

  // Mettre à jour les informations utilisateur quand elles changent
  React.useEffect(() => {
    if (user) {
      Logger.setUserInfo({
        email: user.primaryEmailAddress?.emailAddress,
        sub: user.id
      });
    }
  }, [user]);

  const handleSend = async () => {
    Logger.debug("handleSend triggered", { component: "KpiChatBox" });
    if (!input.trim() || isThinking) return;

    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');

    if (!data || data.length === 0) {
      const errorResponse: MessageType = {
        role: 'assistant',
        content: "❌ No data available to generate KPI.",
        response: {
          type: 'conversation',
          requires_code: false,
          message: "❌ No data available to generate KPI."
        }
      };
      setMessages(prev => [...prev, errorResponse]);
      setIsThinking(false);
      return;
    }

    try {
      // Obtention du token
      const token = await getToken();
      if (!token) {
        throw new Error("Non authentifié");
      }

      Logger.request("Appel GPT avec prompt", { 
        component: "KpiChatBox",
        details: { 
          prompt: input,
          email: user?.primaryEmailAddress?.emailAddress 
        }
      });

      Logger.auth(token, { 
        component: "KpiChatBox",
        details: { email: user?.primaryEmailAddress?.emailAddress }
      });
      
      const gptResponse = await callGpt(input, data, token, user?.primaryEmailAddress?.emailAddress);

      Logger.response("Réponse GPT reçue", { 
        component: "KpiChatBox",
        details: { type: gptResponse.type }
      });

      if (gptResponse.type === 'conversation') {
        const conversationMessage: MessageType = {
          role: 'assistant',
          content: gptResponse.message,
          response: gptResponse
        };
        setMessages(prev => [...prev, conversationMessage]);
        return;
      }

      const kpiData = gptResponse.kpi_data;
      if (kpiData && Array.isArray(kpiData) && kpiData.length > 0) {
        onPromptProcessed(kpiData, Object.keys(kpiData[0]));
        Logger.debug("Données envoyées à TablePreview", { 
          component: "KpiChatBox",
          details: { dataLength: kpiData.length }
        });
        
        const successMessage: MessageType = {
          role: 'assistant',
          content: gptResponse.message,
          response: gptResponse
        };
        setMessages(prev => [...prev, successMessage]);
      } else if (gptResponse.type === 'action') {
        const actionMessage: MessageType = {
          role: 'assistant',
          content: gptResponse.message,
          response: gptResponse
        };
        setMessages(prev => [...prev, actionMessage]);
      } else {
        const errorResponse: MessageType = {
          role: 'assistant',
          content: "❌ Invalid or empty KPI data.",
          response: {
            type: 'conversation',
            requires_code: false,
            message: "❌ Invalid or empty KPI data."
          }
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      Logger.error("Erreur GPT", { 
        component: "KpiChatBox",
        details: error 
      });
      const errorResponse: MessageType = {
        role: 'assistant',
        content: `❌ GPT Error: ${(error as Error).message || 'unknown'}`,
        response: {
          type: 'conversation',
          requires_code: false,
          message: `❌ GPT Error: ${(error as Error).message || 'unknown'}`
        }
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-full h-[300px] bg-transparent text-zinc-900 dark:text-white">
      <ScrollArea className="flex-1 px-4 pt-3 overflow-y-auto">
        <div ref={scrollRef} className="space-y-4">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900">
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
          placeholder="Type your command here..."
          className="flex-1 px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm font-normal"
        />
        <button
          type="submit"
          disabled={isThinking}
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
};

export default KpiChatBox;