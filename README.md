# Privy Custom Login UI

Custom login UI for Privy authentication with Google, Apple, Email, SMS, and Passkey support.

## Quick Start

1. `npm install`
2. Copy `.env.example` to `.env` and add your `VITE_PRIVY_APP_ID`
3. `npm run dev`

## Usage

```tsx
import { LoginPage } from '@/components/auth/LoginPage'

<LoginPage config={{
  appName: 'My App',
  tagline: 'Sign in to continue',
  methods: { google: true, apple: false, passkey: false, email: true, sms: true },
  backgroundImage: '/images/bg.jpg',
}} />
