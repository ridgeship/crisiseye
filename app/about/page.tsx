"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-16"
      >
        {/* Header Section */}
        <motion.div variants={fadeUp} className="text-center">
          <Image
            src="/ghana-coat-of-arms.png"
            alt="Government of Ghana coat of arms"
            width={96}
            height={96}
            className="mx-auto h-24 w-24 object-contain mb-6"
          />
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            CrisisEye
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Ghana's Intelligent Emergency Coordination Platform
          </p>
        </motion.div>

        {/* Mission & Vision */}
        <motion.div variants={fadeUp} className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border/50 bg-card/40 p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To provide a unified, real-time emergency reporting and coordination system that empowers citizens and enables first responders to act swiftly and decisively during crises.
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/40 p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              A safer, more resilient Ghana where every citizen has immediate access to emergency services and disaster intelligence through cutting-edge technology.
            </p>
          </div>
        </motion.div>

        {/* Objectives */}
        <motion.div variants={fadeUp} className="space-y-6">
          <h2 className="text-3xl font-semibold text-foreground text-center">Key Objectives</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Reduce emergency response times",
              "Provide accurate situational awareness",
              "Centralize inter-agency coordination",
              "Deliver real-time community risk intelligence",
              "Eliminate hoax calls through verified reporting",
              "Build a national disaster data repository",
            ].map((objective, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/20 p-4">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{objective}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div variants={fadeUp} className="space-y-8">
          <h2 className="text-3xl font-semibold text-foreground text-center">How CrisisEye Works</h2>
          <div className="relative border-l border-border ml-4 md:ml-0 md:border-none">
            <div className="md:grid md:grid-cols-4 md:gap-8 space-y-8 md:space-y-0">
              {[
                { step: "01", title: "Observe", desc: "Citizen identifies an emergency situation or hazard." },
                { step: "02", title: "Report", desc: "User submits an incident via the app with GPS, media, and voice evidence." },
                { step: "03", title: "Coordinate", desc: "System instantly routes verified data to Police, Fire, Ambulance, or NADMO." },
                { step: "04", title: "Respond", desc: "Agencies dispatch units using real-time map intelligence." },
              ].map((item, idx) => (
                <div key={idx} className="relative pl-8 md:pl-0">
                  <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary md:hidden" />
                  <div className="hidden md:block text-4xl font-black text-border mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Platform Architecture & Tech Stack */}
        <motion.div variants={fadeUp} className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Platform Architecture</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              CrisisEye operates on a distributed, high-availability architecture designed for national deployment. 
              It features real-time data synchronization, secure evidence storage, and scalable map rendering engines 
              capable of handling massive concurrent reporting during national disasters.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Technology Stack</h2>
            <div className="flex flex-wrap gap-2">
              {["Next.js", "Convex", "React", "Google Maps API", "OpenWeather API", "Tailwind CSS", "Framer Motion"].map((tech) => (
                <span key={tech} className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
