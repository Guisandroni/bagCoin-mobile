export default function ReleasePreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="rls min-h-screen bg-[var(--rls-background)]">
      {children}
    </div>
  )
}