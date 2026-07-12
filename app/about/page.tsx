import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Image
        src="/ghana-coat-of-arms.png"
        alt="Government of Ghana coat of arms"
        width={64}
        height={64}
        className="h-14 w-14 object-contain"
      />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
        About CrisisEye
      </h1>
      <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
        CrisisEye is Ghana&apos;s intelligent emergency coordination platform, built to move
        the nation from early warning to emergency response. It connects citizens,
        communities and response agencies on a single trusted system for reporting
        emergencies, receiving disaster warnings and coordinating a faster, verified response.
      </p>
      <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
        The platform is designed to work hand in hand with national institutions including the
        Ghana Police Service, Ghana National Fire Service, National Ambulance Service and
        NADMO, with a structure ready to integrate the Ghana Meteorological Agency for live
        hazard intelligence.
      </p>
    </div>
  )
}
