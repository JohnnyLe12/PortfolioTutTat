// Minimal root layout required by Next.js App Router.
// The actual UI is served by the Vite/React frontend in src/.
// This layout only exists to satisfy Next.js App Router requirements
// for the API routes under app/api/.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
