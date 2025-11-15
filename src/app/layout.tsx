import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
import FarcasterWrapper from "@/components/FarcasterWrapper";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
        <html lang="en">
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <ClientProviders>
      <FarcasterWrapper>
        {children}
      </FarcasterWrapper>
      </ClientProviders>
          </body>
        </html>
      );
}

export const metadata: Metadata = {
        title: "Retro Contract Launcher",
        description: "Deploy simple and complex contracts using a nostalgic 1980s UI with Rainbowkit. Get live Sepolia network stats refreshed every minute from Giwa's explorer.",
        other: { "fc:frame": JSON.stringify({"version":"next","imageUrl":"https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_58044ec6-bf7e-45fc-bb46-64b50969e653-4cGHiPnbGMR5trfyUkMoJrHFqupAn2","button":{"title":"Open with Ohara","action":{"type":"launch_frame","name":"Retro Contract Launcher","url":"https://father-post-311.app.ohara.ai","splashImageUrl":"https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg","splashBackgroundColor":"#ffffff"}}}
        ) }
    };
