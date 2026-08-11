import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-cemac-50 flex items-center justify-center mb-4">
        <Construction className="h-8 w-8 text-cemac-700" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-muted-foreground mt-2 max-w-md">{description}</p>
      <p className="text-xs text-muted-foreground mt-4 bg-gold-50 border border-gold-200 rounded-lg px-4 py-2">
        Module en cours de développement — Phase 3
      </p>
    </div>
  )
}
