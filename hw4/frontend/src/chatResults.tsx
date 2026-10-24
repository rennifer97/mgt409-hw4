import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ProductCard } from './api'

// Product cards the chat agent returned, shared so the Products page can show them.
export type ChatResults = { label: string; products: ProductCard[] }

type ChatResultsState = {
  results: ChatResults | null
  showResults: (r: ChatResults) => void
  clearResults: () => void
}

const ChatResultsContext = createContext<ChatResultsState | null>(null)

export function ChatResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<ChatResults | null>(null)
  return (
    <ChatResultsContext.Provider
      value={{ results, showResults: setResults, clearResults: () => setResults(null) }}
    >
      {children}
    </ChatResultsContext.Provider>
  )
}

export function useChatResults() {
  const ctx = useContext(ChatResultsContext)
  if (!ctx) throw new Error('useChatResults must be used inside ChatResultsProvider')
  return ctx
}
