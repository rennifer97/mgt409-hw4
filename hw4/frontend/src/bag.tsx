import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { addToBag, fetchBag, removeFromBag, setBagReminders, type BagView } from './api'
import { useAuth } from './auth'

// The logged-in shopper's bag, shared by the header count, product pages, and the Bag page.
type BagState = {
  bag: BagView | null
  add: (productId: string, size: string) => Promise<void>
  remove: (id: number) => Promise<void>
  setReminders: (on: boolean) => Promise<void>
}

const BagContext = createContext<BagState | null>(null)

export function BagProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const [bag, setBag] = useState<BagView | null>(null)

  useEffect(() => {
    if (!user || !token) return setBag(null)
    fetchBag(token).then(setBag).catch(() => setBag(null))
  }, [user, token])

  const need = useCallback(() => {
    if (!token) throw new Error('Log in to save items to your bag.')
    return token
  }, [token])

  const value: BagState = {
    bag,
    add: async (productId, size) => setBag(await addToBag(need(), productId, size)),
    remove: async (id) => setBag(await removeFromBag(need(), id)),
    setReminders: async (on) => setBag(await setBagReminders(need(), on)),
  }
  return <BagContext.Provider value={value}>{children}</BagContext.Provider>
}

export function useBag() {
  const ctx = useContext(BagContext)
  if (!ctx) throw new Error('useBag must be used inside BagProvider')
  return ctx
}
