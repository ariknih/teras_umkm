// Builder layout — full screen, no Saloka navigation header
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="builder-layout">
      {children}
    </div>
  )
}
