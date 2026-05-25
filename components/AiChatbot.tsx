"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Mic, Volume2, VolumeX } from "lucide-react";
import { t } from "@/lib/i18n";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatbot({ lang, condition }: { lang: "id" | "en", condition: string }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const msgs: Message[] = [];
    if (condition) {
      msgs.push({ role: "user", content: condition });
    }
    msgs.push({
      role: "assistant",
      content: lang === "en" 
        ? "I am your emergency medical assistant. I've analyzed your situation and prepared the layout to help you. Do you have any follow-up questions?" 
        : "Saya adalah asisten medis darurat Anda. Saya telah menganalisa situasi Anda dan menyiapkan panduan di layar ini. Apakah Anda memiliki pertanyaan lanjutan?"
    });
    return msgs;
  });

  useEffect(() => {
    setMessages((prev) => {
      const newMsgs = [...prev];
      const welcomeIdx = condition ? 1 : 0;
      if (newMsgs[welcomeIdx] && newMsgs[welcomeIdx].role === "assistant") {
        const isDefaultEn = newMsgs[welcomeIdx].content === "I am your emergency medical assistant. I've analyzed your situation and prepared the layout to help you. Do you have any follow-up questions?";
        const isDefaultId = newMsgs[welcomeIdx].content === "Saya adalah asisten medis darurat Anda. Saya telah menganalisa situasi Anda dan menyiapkan panduan di layar ini. Apakah Anda memiliki pertanyaan lanjutan?";
        if (isDefaultEn || isDefaultId) {
          newMsgs[welcomeIdx].content = lang === "en"
            ? "I am your emergency medical assistant. I've analyzed your situation and prepared the layout to help you. Do you have any follow-up questions?"
            : "Saya adalah asisten medis darurat Anda. Saya telah menganalisa situasi Anda dan menyiapkan panduan di layar ini. Apakah Anda memiliki pertanyaan lanjutan?";
        }
      }
      return newMsgs;
    });
  }, [lang, condition]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const speak = (text: string) => {
    if (!isVoiceOn || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'id-ID';
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceToggle = () => {
    if (isVoiceOn) {
      window.speechSynthesis.cancel();
      setIsVoiceOn(false);
    } else {
      setIsVoiceOn(true);
      const lastMsg = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastMsg && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(lastMsg.content);
        utterance.lang = lang === 'en' ? 'en-US' : 'id-ID';
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'en' ? 'en-US' : 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      recognition.onspeechend = () => {
        recognition.stop();
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      
      recognition.start();
    } else {
      alert(lang === 'en' ? "Voice input is not supported in your browser." : "Input suara tidak didukung di browser ini.");
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const makeRequest = async (retries = 1) => {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept-Language": lang
          },
          body: JSON.stringify({ messages: newMessages, condition, lang })
        });
        
        if (res.status === 429 && retries > 0) {
          await new Promise(r => setTimeout(r, 3000));
          return makeRequest(retries - 1);
        }
        if (!res.ok) throw new Error("API error");
        return res.json();
      };

      const data = await makeRequest();
      
      setMessages([...newMessages, { role: "assistant", content: data.text }]);
      if (isVoiceOn) {
        speak(data.text);
      }
    } catch (error) {
      console.error(error);
      const errMsg = lang === "en" ? "Connection error." : "Koneksi terputus.";
      setMessages([...newMessages, { role: "assistant", content: errMsg }]);
      if (isVoiceOn) {
        speak(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="absolute top-2 right-2 z-10 hidden md:block">
        <button 
          onClick={handleVoiceToggle}
          className={`p-2 border border-[#0082A6]/20 rounded-full focus:outline-none transition-colors ${isVoiceOn ? 'bg-[#FF3B30] text-white hover:bg-red-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          title={isVoiceOn ? (lang === 'en' ? 'Mute' : 'Bisukan') : (lang === 'en' ? 'Read Aloud' : 'Baca Bersuara')}
        >
          {isVoiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-6 pr-4 pt-4 md:pt-4 pb-4"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 text-sm md:text-base leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[#0082A6] text-white rounded-3xl rounded-tr-sm shadow-sm' 
                : 'bg-slate-50 text-slate-800 rounded-3xl rounded-tl-sm border border-[#0082A6]/10 shadow-sm'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 text-[#0082A6] font-bold uppercase tracking-widest text-[10px]">
                  <Bot className="w-4 h-4" /> Siaga AI
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-[85%] p-4 bg-slate-50 text-slate-800 rounded-3xl rounded-tl-sm border border-[#0082A6]/10 shadow-sm flex items-center justify-center">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="w-2 h-2 bg-[#0082A6]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[#0082A6]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[#0082A6]/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0 relative mt-4 border-t border-[#0082A6]/10 pt-4 p-4">
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={input}
          onChange={handleInputInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={t[lang].chatPlaceholder}
          className="flex-1 bg-slate-50 border border-[#0082A6]/20 p-3 md:p-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#0082A6] pr-12 rounded-2xl resize-none max-h-[120px] transition-shadow placeholder:text-slate-400"
          disabled={isLoading}
          rows={1}
        />
        <button
          type="button"
          onClick={startListening}
          disabled={isLoading || isRecording}
          className={`absolute right-16 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
            isRecording ? "text-[#FF3B30] animate-pulse bg-red-50" : "text-slate-400 hover:text-[#0082A6] hover:bg-slate-100"
          }`}
          title={lang === "en" ? "Voice Input" : "Input Suara"}
        >
          <Mic className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-[#0082A6] text-white p-3 md:p-4 rounded-xl hover:bg-[#006d8b] disabled:opacity-50 transition-colors shadow-md shadow-[#0082A6]/20 self-end ml-2"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
