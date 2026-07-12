import { Construction } from 'lucide-react'

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
        <Construction className="size-6" />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
