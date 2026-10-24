import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth.tsx'
import { ChatResultsProvider } from './chatResults.tsx'
import { BagProvider } from './bag.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BagProvider>
          <ChatResultsProvider>
            <App />
          </ChatResultsProvider>
        </BagProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
