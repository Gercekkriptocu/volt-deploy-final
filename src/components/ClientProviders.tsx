'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

const Providers = dynamic(
  () => import('@/app/providers').then((mod) => mod.Providers),
  { ssr: false }
);

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps): JSX.Element {
  return <Providers>{children}</Providers>;
}
