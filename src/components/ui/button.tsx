import { PrivyProvider } from '@privy-io/react-auth'

export interface AuthProviderConfig {
  appId: string
  loginMethods?: ('email' | 'google' | 'sms' | 'apple' | 'passkey')[]
  appearance?: {
    theme?: 'light' | 'dark'
    accentColor?: string
    logo?: string
  }
}

interface AuthProviderProps {
  children: React.ReactNode
  config: AuthProviderConfig
}

export function AuthProvider({ children, config }: AuthProviderProps) {
  return (
    <PrivyProvider
      appId={config.appId}
      config={{
        loginMethods: config.loginMethods || ['email', 'google', 'sms', 'apple', 'passkey'],
        appearance: {
          theme: config.appearance?.theme || 'dark',
          accentColor: config.appearance?.accentColor || '#22c55e',
          logo: config.appearance?.logo,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
