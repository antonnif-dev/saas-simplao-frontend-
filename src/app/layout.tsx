import "../styles/globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <head>
        {/* Scripts que precisam estar disponíveis globalmente */}
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        
        {/* O Script fica aqui, logo antes de fechar o body */}
        <Script 
          src="https://upload-widget.cloudinary.com/global/all.js" 
          strategy="afterInteractive" 
        />
      </body>
    </html>
  );
}