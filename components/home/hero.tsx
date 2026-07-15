import Image from 'next/image'
import Link from 'next/link'
import { TriangleAlert, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Image
        alt="Earth at night from space"
        src="/earth-at-night.jpg"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAeEAADAAIBBQAAAAAAAAAAAAABAgMABBEFEiExQf/EABUBAQEAAAAAAAAAAAAAAAAAAAME/8QAFxEBAQEBAAAAAAAAAAAAAAAAAAECAP/aAAwDAQACEQMRAD8AnVp5ZpI2YlJHr2Y9A6gBC0yK2xJ28A+d9Yy1lMy2c//2Q=="
        fill
        quality={100}
        priority
        className="object-cover"
      />
      {/* Blending overlays */}
      <div
        className="absolute inset-0 bg-linear-to-r from-background/95 via-background/40 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-background/30"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary" />
            National Emergency Coordination Platform
          </span>

          <h1 className="mt-6 text-pretty text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            From Early Warning
            <br />
            <span className="text-primary text-glow">to Emergency Response.</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Protecting communities through intelligent emergency coordination, real-time
            reporting and proactive disaster awareness across Ghana.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              render={<Link href="/report" />}
              className="h-12 gap-2 rounded-full px-6 text-sm"
            >
              <TriangleAlert className="size-4" />
              Report an Incident
            </Button>
            <Button
              render={<Link href="/map" />}
              variant="outline"
              className="h-12 gap-2 rounded-full border-border/70 bg-card/40 px-6 text-sm backdrop-blur"
            >
              <Map className="size-4" />
              Explore Live Map
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
