import { usePrivy } from '@privy-io/react-auth'
import { LoginPage } from '@/components/auth/LoginPage'
import { ShoppingCart, Trophy, Users, Gamepad2 } from 'lucide-react'

function App() {
  const { authenticated, logout, user } = usePrivy()

  // Show login page if not authenticated
  if (!authenticated) {
    return (
      <LoginPage
        config={{
          appName: 'My App',
          appIcon: <Gamepad2 className="w-8 h-8 text-primary" />,
          tagline: 'Sign in to access all features and save your progress.',
          features: [
            { icon: <ShoppingCart className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />, text: 'Access marketplace' },
            { icon: <Trophy className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />, text: 'Compete in tournaments' },
            { icon: <Users className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />, text: 'Connect with friends' },
          ],
          methods: {
            google: true,
            apple: false, // Set to true if configured in Privy dashboard
            passkey: false, // Set to true if configured in Privy dashboard
            email: true,
            sms: true, // Requires SMS config in Privy dashboard
          },
          // Optional: Add a background image
          // backgroundImage: '/images/background.jpg',
          // backgroundOverlayOpacity: 60,
          footerText: 'Access is restricted to authorized users only',
          showDevIndicator: true,
        }}
      />
    )
  }

  // Show main app content when authenticated
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Welcome!</h1>
        <p className="text-muted-foreground">
          You are logged in as: {user?.email?.address || user?.phone?.number || 'Unknown'}
        </p>
        <button
          onClick={logout}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default App
