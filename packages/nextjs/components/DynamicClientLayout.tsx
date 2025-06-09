"use client";

import { ReactNode, Suspense } from "react";
import dynamic from "next/dynamic";

// Import ClientLayout with SSR disabled to prevent indexedDB errors
const ClientLayout = dynamic(
  () => import("~~/components/ClientLayout").then((mod) => mod.ClientLayout),
  { ssr: false }
);

export function DynamicClientLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading app...</div>}>
      <ClientLayout>{children}</ClientLayout>
    </Suspense>
  );
}