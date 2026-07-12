import Link from 'next/link'
import Image from 'next/image'
import { Phone } from 'lucide-react'
import { AGENCIES } from '@/lib/data'

export function EmergencyContacts() {
  return (
    <section className="bg-ops-grid">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Emergency Contacts
          </h2>
          <Link
            href="/map"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AGENCIES.map((agency) => (
            <a
              key={agency.id}
              href={`tel:${agency.phone.replace(/\s/g, '')}`}
              className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-lg bg-secondary/60 p-1.5">
                  <Image
                    src={agency.logo}
                    alt=""
                    width={36}
                    height={36}
                    className="h-full w-full object-contain"
                  />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{agency.short}</p>
                  <p className="font-mono text-lg leading-tight text-foreground">
                    {agency.phone}
                  </p>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <Phone className="size-3.5" />
                Call now
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
