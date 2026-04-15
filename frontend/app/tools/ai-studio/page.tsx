'use client';

import { useState, useRef, useEffect } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Send, Zap, Languages, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSummarizePDF, useChatWithPDF } from '@/lib/hooks/use-pdf-processing';
import * as api from '@/lib/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ page: number; text: string; relevance: number }>;
}

export default function AIStudio() {
  const { files } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Upload a PDF and I can help you summarize, translate, ask questions, and more! Note: AI features require ENABLE_AI_FEATURES=true on the server.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'chat' | 'summarize' | 'translate'>('chat');
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedFile = files.find((f) => f.id === selectedFileId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      if (aiMode === 'chat') {
        const response = await api.chatWithPDF(selectedFile.file, currentInput, 5);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (aiMode === 'summarize') {
        const response = await api.summarizePDF(selectedFile.file, 500, 100);
        setSummaryResult(response.summary);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `**Summary** (${response.word_count} words, ${response.page_count} pages):\n\n${response.summary}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (aiMode === 'translate') {
        const response = await api.translatePDF(selectedFile.file, 'en', currentInput || 'fr');
        const translatedText =
          (response as Record<string, unknown>)?.translated_text ?? 'Translation complete';
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `**Translation to ${currentInput || 'fr'}:**\n\n${translatedText}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'AI request failed';
      toast.error(errorMsg);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolWrapper
      title="AI Studio"
      description="Chat, summarize, and translate your PDFs with AI-powered assistance"
    >
      <FileSelector
        label="Select PDF to analyze"
        placeholder="Choose a file..."
        onFileSelect={setSelectedFileId}
      />

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Document Info</h3>
                <div className="aspect-[4/5] bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Quick Actions</p>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="sm"
                  onClick={() => {
                    setInput('Summarize this document');
                    setAiMode('summarize');
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Quick Summarize
                </Button>
              </div>
              <Button variant="outline" className="w-full gap-2" size="sm">
                <RefreshCw className="w-4 h-4" />
                Refresh Analysis
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 flex flex-col"
          >
            <Tabs
              value={aiMode}
              onValueChange={(v) => setAiMode(v as 'chat' | 'summarize' | 'translate')}
              className="flex flex-col h-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat" className="gap-2">
                  <Send className="w-4 h-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="summarize" className="gap-2">
                  <Zap className="w-4 h-4" />
                  Summarize
                </TabsTrigger>
                <TabsTrigger value="translate" className="gap-2">
                  <Languages className="w-4 h-4" />
                  Translate
                </TabsTrigger>
              </TabsList>

              {['chat', 'summarize', 'translate'].map((mode) => (
                <TabsContent key={mode} value={mode} className="flex-1 flex flex-col min-h-0 mt-4">
                  <div className="flex-1 bg-card border border-border rounded-lg p-4 overflow-y-auto space-y-4 mb-4 min-h-[400px] max-h-[500px]">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-sm px-4 py-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-accent text-accent-foreground rounded-br-none'
                              : 'bg-muted text-foreground rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <p className="text-xs font-semibold mb-1">Sources:</p>
                              {msg.sources.map((s, i) => (
                                <p key={i} className="text-xs opacity-70">
                                  Page {s.page}: {s.text.slice(0, 80)}...
                                </p>
                              ))}
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        mode === 'summarize'
                          ? 'Click to summarize or ask about summary...'
                          : mode === 'translate'
                          ? 'Enter target language code (e.g., fr, es, de)...'
                          : 'Ask anything about the PDF...'
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </motion.div>
      )}
    </ToolWrapper>
  );
}
