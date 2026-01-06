import { useState, useEffect, useCallback } from 'react'
import { usePrivy, useLoginWithEmail, useLoginWithSms, useLoginWithOAuth } from '@privy-io/react-auth'
import {
  Mail,
  Phone,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Key,
  RotateCcw,
  X,
  Gamepad2,
  Trophy,
  Users,
  ShoppingCart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { InternationalPhoneInput } from './InternationalPhoneInput'

export interface LoginPageConfig {
  appName: string
  appIcon?: React.ReactNode
  tagline: string
  features: Array<{ icon: React.ReactNode; text: string }>
  backgroundImage?: string
  backgroundOverlayOpacity?: number
  methods: { google: boolean; apple: boolean; passkey: boolean; email: boolean; sms: boolean }
  footerText?: string
  showDevIndicator?: boolean
}

const defaultConfig: LoginPageConfig = {
  appName: 'App',
  tagline: 'Sign in to access your account',
  features: [
    { icon: <ShoppingCart className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />, text: 'Access all features' },
    { icon: <Trophy className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />, text: 'Save your progress' },
    { icon: <Users className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />, text: 'Connect with others' },
  ],
  methods: { google: true, apple: false, passkey: false, email: true, sms: true },
  footerText: 'Access is restricted to authorized users only',
  showDevIndicator: true,
}

const UnavailableIndicator = () => (
  <div className="absolute -top-1 -right-1 bg-danger rounded-full p-0.5" title="Not configured">
    <X className="w-3 h-3 text-white" />
  </div>
)

const LeftPanelContent = ({ isLandscape = false, isDev = false, config }: { isLandscape?: boolean; isDev?: boolean; config: LoginPageConfig }) => (
  <div className={`space-y-4 ${isLandscape ? '' : 'text-center'}`}>
    <div className={`space-y-3 ${isLandscape ? '' : 'flex flex-col items-center'}`}>
      <div className={`flex items-center space-x-2 ${isLandscape ? '' : 'justify-center'}`}>
        {config.appIcon || <Gamepad2 className="w-8 h-8 text-primary" />}
        <h1 className="text-xl font-bold">
          {isDev && config.showDevIndicator && <span className="text-warning">LOCAL </span>}
          {config.appName}
        </h1>
      </div>
      <p className={`text-muted-foreground ${isLandscape ? '' : 'text-sm max-w-xs'}`}>{config.tagline}</p>
    </div>
    {config.features.length > 0 && (
      <div className="space-y-3 p-4 bg-secondary/50 rounded-lg backdrop-blur-sm">
        <h4 className={`text-sm font-medium text-primary ${isLandscape ? '' : 'text-center'}`}>What you can do:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {config.features.map((feature, index) => (
            <li key={index} className={`flex items-start space-x-3 ${isLandscape ? '' : 'justify-center'}`}>
              {feature.icon}
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)

export interface LoginPageProps { config?: Partial<LoginPageConfig> }

export function LoginPage({ config: userConfig }: LoginPageProps = {}) {
  const config = { ...defaultConfig, ...userConfig }
  const { ready, login: privyLogin } = usePrivy()
  const { sendCode: sendEmailCode, loginWithCode: loginWithEmailCode, state: emailState } = useLoginWithEmail()
  const { sendCode: sendSmsCode, loginWithCode: loginWithSmsCode, state: smsState } = useLoginWithSms()
  const { initOAuth } = useLoginWithOAuth()

  const [activeTab, setActiveTab] = useState('quick')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [smsOtp, setSmsOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [showSmsVerification, setShowSmsVerification] = useState(false)

  const methodAvailability = config.methods
  const isDev = import.meta.env.DEV
  const overlayOpacity = config.backgroundOverlayOpacity ?? 60

  const startResendCooldown = useCallback(() => {
    setResendCooldown(30)
    const timer = setInterval(() => {
      setResendCooldown((prev) => { if (prev <= 1) { clearInterval(timer); return 0 } return prev - 1 })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleGoogleAuth = async () => {
    if (!methodAvailability.google) return
    setError(null)
    try { await initOAuth({ provider: 'google' }) }
    catch (err) { setError('Failed to sign in with Google. Please try again.'); console.error('[Auth] Google OAuth error:', err) }
  }

  const handleAppleAuth = async () => {
    if (!methodAvailability.apple) return
    setError(null)
    try { await initOAuth({ provider: 'apple' }) }
    catch (err) { setError('Failed to sign in with Apple. Please try again.'); console.error('[Auth] Apple OAuth error:', err) }
  }

  const handlePasskeyAuth = async () => {
    if (!methodAvailability.passkey) return
    setError(null)
    try { await privyLogin() }
    catch (err) { setError('Passkey authentication failed. Please try again.'); console.error('[Auth] Passkey error:', err) }
  }

  const handleSendEmailCode = async () => {
    if (!email || !methodAvailability.email) return
    setError(null)
    try { await sendEmailCode({ email }); setShowEmailVerification(true); startResendCooldown() }
    catch (err) { setError('Failed to send verification code. Please check your email and try again.'); console.error('[Auth] Email send code error:', err) }
  }

  const handleVerifyEmailCode = async () => {
    if (emailOtp.length !== 6) return
    setError(null)
    try { await loginWithEmailCode({ code: emailOtp }) }
    catch (err) { setError('Invalid verification code. Please try again.'); console.error('[Auth] Email verify error:', err) }
  }

  const handleSendSmsCode = async () => {
    if (!phone || !methodAvailability.sms) return
    setError(null)
    try { await sendSmsCode({ phoneNumber: phone }); setShowSmsVerification(true); startResendCooldown() }
    catch (err) { const errorMessage = err instanceof Error ? err.message : 'Unknown error'; console.error('[Auth] SMS send code error:', err); setError(errorMessage || 'Failed to send SMS code.') }
  }

  const handleVerifySmsCode = async () => {
    if (smsOtp.length !== 6) return
    setError(null)
    try { await loginWithSmsCode({ code: smsOtp }) }
    catch (err) { setError('Invalid verification code. Please try again.'); console.error('[Auth] SMS verify error:', err) }
  }

  const handleResendEmailCode = async () => { if (resendCooldown > 0) return; await handleSendEmailCode() }
  const handleResendSmsCode = async () => { if (resendCooldown > 0) return; await handleSendSmsCode() }
  const resetEmailVerification = () => { setShowEmailVerification(false); setEmailOtp(''); setError(null) }
  const resetSmsVerification = () => { setShowSmsVerification(false); setSmsOtp(''); setError(null) }

  useEffect(() => { if (emailOtp.length === 6 && showEmailVerification) handleVerifyEmailCode() }, [emailOtp])
  useEffect(() => { if (smsOtp.length === 6 && showSmsVerification) handleVerifySmsCode() }, [smsOtp])

  const isLoading = emailState.status === 'sending-code' || emailState.status === 'submitting-code' || smsState.status === 'sending-code' || smsState.status === 'submitting-code'
  const backgroundStyle = config.backgroundImage ? { backgroundImage: `url(${config.backgroundImage})`, backgroundSize: 'auto', backgroundRepeat: 'repeat' as const } : {}

  const renderAuthTabs = (isLandscape: boolean) => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-10">
        <TabsTrigger value="quick" className="text-sm">Quick</TabsTrigger>
        <TabsTrigger value="email" className="text-sm">Email</TabsTrigger>
        <TabsTrigger value="phone" className="text-sm">Phone</TabsTrigger>
      </TabsList>
      <div className={`${isLandscape ? 'min-h-[180px]' : 'min-h-[160px]'}`}>
        <TabsContent value="quick" className={`space-y-3 ${isLandscape ? 'mt-6' : 'mt-4'}`}>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Button onClick={handleGoogleAuth} disabled={isLoading || !methodAvailability.google} variant="outline" className={`w-full ${isLandscape ? 'h-12' : 'h-10'} active:scale-95 active:bg-accent transition-all`}>
                  <svg className={`${isLandscape ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className={isLandscape ? 'text-sm' : 'text-xs'}>Google</span>
                </Button>
                {!methodAvailability.google && <UnavailableIndicator />}
              </div>
              <div className="relative">
                <Button onClick={handleAppleAuth} disabled={isLoading || !methodAvailability.apple} variant="outline" className={`w-full ${isLandscape ? 'h-12' : 'h-10'} active:scale-95 active:bg-accent transition-all`}>
                  <svg className={`${isLandscape ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span className={isLandscape ? 'text-sm' : 'text-xs'}>Apple</span>
                </Button>
                {!methodAvailability.apple && <UnavailableIndicator />}
              </div>
            </div>
            <div className="relative">
              <Button onClick={handlePasskeyAuth} disabled={isLoading || !methodAvailability.passkey} variant="outline" className={`w-full ${isLandscape ? 'h-12' : 'h-10'} active:scale-95 active:bg-accent transition-all`}>
                <Key className={`${isLandscape ? 'w-5 h-5 mr-3' : 'w-4 h-4 mr-2'}`} />
                <span className={isLandscape ? 'text-sm' : 'text-xs'}>Continue with Passkey</span>
              </Button>
              {!methodAvailability.passkey && <UnavailableIndicator />}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="email" className={`space-y-3 ${isLandscape ? 'mt-6' : 'mt-4'}`}>
          <div className="space-y-2">
            <Label htmlFor="email-input" className="text-sm">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`pl-10 ${isLandscape ? 'h-12' : ''}`} disabled={isLoading} />
            </div>
          </div>
          <Button onClick={handleSendEmailCode} disabled={isLoading || !email} className={`w-full ${isLandscape ? 'h-12' : ''}`}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Sign in with Email
          </Button>
          <p className={`text-center text-xs text-muted-foreground ${isLandscape ? 'pt-2' : 'pt-1'}`}>We'll send you a verification code</p>
        </TabsContent>
        <TabsContent value="phone" className={`space-y-3 ${isLandscape ? 'mt-6' : 'mt-4'}`}>
          <div className="space-y-2">
            <Label htmlFor="phone-input" className="text-sm">Phone Number</Label>
            <InternationalPhoneInput value={phone} onChange={setPhone} placeholder="Enter phone number" disabled={isLoading} />
          </div>
          <Button onClick={handleSendSmsCode} disabled={isLoading || !phone} className={`w-full ${isLandscape ? 'h-12' : ''}`}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
            Send SMS Code
          </Button>
          <p className={`text-center text-xs text-muted-foreground ${isLandscape ? 'pt-2' : 'pt-1'}`}>We'll send you a 6-digit verification code</p>
        </TabsContent>
      </div>
      <div className={`${isLandscape ? 'mt-6 pt-4' : 'mt-4 pt-3'} border-t border-border text-center`}>
        <p className="text-xs text-muted-foreground">By signing in, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </Tabs>
  )

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={backgroundStyle}>
        {config.backgroundImage && <div className={`absolute inset-0 bg-black/${overlayOpacity}`} />}
        <div className="relative flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (showSmsVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={backgroundStyle}>
        {config.backgroundImage && <div className={`absolute inset-0 bg-black/${overlayOpacity}`} />}
        <div className="relative w-full max-w-md">
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-6 space-y-6 shadow-xl">
            <div className="space-y-2">
              <Button variant="ghost" size="sm" onClick={resetSmsVerification} className="mb-2"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              <div className="flex items-center justify-center space-x-2"><Phone className="w-6 h-6 text-primary" /><h2 className="text-xl font-bold">Verify Your Phone</h2></div>
              <p className="text-center text-muted-foreground text-sm">Enter the 6-digit code sent to {phone}</p>
            </div>
            {error && <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 text-danger text-sm text-center">{error}</div>}
            <div className="space-y-4">
              <Label className="text-center block">Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={smsOtp} onChange={setSmsOtp} disabled={isLoading}>
                  <InputOTPGroup className="gap-2">
                    {[0,1,2,3,4,5].map((index) => <InputOTPSlot key={index} index={index} className="w-12 h-12 text-lg border-2 border-border bg-background" />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <Button onClick={handleVerifySmsCode} disabled={isLoading || smsOtp.length !== 6} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}Verify Code
            </Button>
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">Didn't receive the code?</p>
              <Button onClick={handleResendSmsCode} disabled={resendCooldown > 0 || isLoading} variant="ghost" size="sm">
                <RotateCcw className="w-3 h-3 mr-2" />{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={backgroundStyle}>
        {config.backgroundImage && <div className={`absolute inset-0 bg-black/${overlayOpacity}`} />}
        <div className="relative w-full max-w-md">
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-6 space-y-6 shadow-xl">
            <div className="space-y-2">
              <Button variant="ghost" size="sm" onClick={resetEmailVerification} className="mb-2"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              <div className="flex items-center justify-center space-x-2"><Mail className="w-6 h-6 text-primary" /><h2 className="text-xl font-bold">Verify Your Email</h2></div>
              <p className="text-center text-muted-foreground text-sm">Enter the 6-digit code sent to {email}</p>
            </div>
            {error && <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 text-danger text-sm text-center">{error}</div>}
            <div className="space-y-4">
              <Label className="text-center block">Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={emailOtp} onChange={setEmailOtp} disabled={isLoading}>
                  <InputOTPGroup className="gap-2">
                    {[0,1,2,3,4,5].map((index) => <InputOTPSlot key={index} index={index} className="w-12 h-12 text-lg border-2 border-border bg-background" />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <Button onClick={handleVerifyEmailCode} disabled={isLoading || emailOtp.length !== 6} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}Verify Code
            </Button>
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">Didn't receive the code?</p>
              <Button onClick={handleResendEmailCode} disabled={resendCooldown > 0 || isLoading} variant="ghost" size="sm">
                <RotateCcw className="w-3 h-3 mr-2" />{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={backgroundStyle}>
      {config.backgroundImage && <div className={`absolute inset-0 bg-black/${overlayOpacity}`} />}
      <div className="relative w-full max-w-md landscape:max-w-4xl">
        <div className="bg-card/95 backdrop-blur-md border border-border/30 rounded-lg shadow-2xl overflow-hidden">
          <div className="landscape:hidden">
            <div className="p-6 pb-4 border-b border-border/50"><LeftPanelContent isLandscape={false} isDev={isDev} config={config} /></div>
            <div className="px-6 pb-6 pt-4">
              {error && <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 text-danger text-sm text-center mb-4">{error}</div>}
              {renderAuthTabs(false)}
            </div>
          </div>
          <div className="hidden landscape:grid landscape:grid-cols-5 landscape:gap-6 landscape:p-6">
            <div className="col-span-2"><LeftPanelContent isLandscape={true} isDev={isDev} config={config} /></div>
            <div className="col-span-3">
              {error && <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 text-danger text-sm text-center mb-4">{error}</div>}
              {renderAuthTabs(true)}
            </div>
          </div>
        </div>
        {config.footerText && <p className="text-center text-xs text-white/60 mt-6">{config.footerText}</p>}
      </div>
    </div>
  )
}
