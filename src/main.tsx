import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@/providers/AuthProvider'
import App from './App'
import './index.css'

// Get your Privy App ID from https://dashboard.privy.io
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'your-privy-app-id'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider
      config={{
        appId: PRIVY_APP_ID,
        loginMethods: ['email', 'google', 'sms', 'apple', 'passkey'],
        appearance: {
          theme: 'dark',
          accentColor: '#22c55e',
        },
      }}
    >
      <App />
    </AuthProvider>
  </StrictMode>
)
