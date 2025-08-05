# NextAuth SessionProvider Fix

## Issue

The application was encountering the following error:

```
Server Error
Error: [next-auth]: `useSession` must be wrapped in a <SessionProvider />
This error happened while generating the page. Any console logs will be displayed in the terminal window.
```

## Root Cause

The error occurred because the application was using the `useSession` hook from NextAuth.js in the `AuthContext.tsx` file, but the application wasn't wrapped with the required `<SessionProvider />` component.

In NextAuth.js, any component that uses the `useSession` hook must be a child of the `SessionProvider` component, which provides the session context to all components in the application.

## Solution

To fix this issue, I made the following changes to the `_app.tsx` file:

1. Imported the `SessionProvider` component from 'next-auth/react':
   ```typescript
   import { SessionProvider } from 'next-auth/react';
   ```

2. Wrapped the application with the `SessionProvider` component, passing the session from pageProps:
   ```typescript
   <SessionProvider session={pageProps.session}>
     <AuthProvider>
       {/* Only render the component on the client side */}
       {isClient && <AppContent Component={Component} pageProps={pageProps} />}
     </AuthProvider>
   </SessionProvider>
   ```

## Why This Fixes the Issue

The `SessionProvider` component creates a React context that holds the session data and authentication status. By wrapping our application with `SessionProvider`, we ensure that the `useSession` hook used in the `AuthContext.tsx` file has access to this context.

This is a standard requirement when using NextAuth.js, as documented in their official documentation:

> To use NextAuth.js from React you need to wrap your application with the SessionProvider.

The `session` prop passed to `SessionProvider` comes from `pageProps.session`, which is automatically populated by NextAuth.js when using `getServerSideProps` or `getInitialProps`.

## Additional Notes

- The `SessionProvider` should be the outermost provider in your application, wrapping any other providers that might need access to the session data.
- The fix maintains the existing functionality of the application, including the client-side rendering check and the custom `AuthProvider`.
- This change ensures that both our custom authentication system and NextAuth.js can work together seamlessly.