"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

const sections = [
  { id: "action", label: "First Aid Hub" },
  { id: "facilities", label: "Nearest Facilities" },
  { id: "triage", label: "Summary Report" },
];

export default function SectionTracker() {
  const [activeSection, setActiveSection] = useState("action");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-6 mix-blend-difference">
      {sections.map((section) => (
        <a key={section.id} href={`#${section.id}`} className="group flex items-center gap-4">
          <motion.div
            className={`w-3 h-3 rounded-full border-2 border-white ${activeSection === section.id ? "bg-white" : "bg-transparent shadow-sm"}`}
            initial={false}
            animate={{ scale: activeSection === section.id ? 1.5 : 1 }}
          />
          <span className={`text-[10px] font-bold uppercase tracking-widest text-white transition-opacity ${activeSection === section.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            {section.label}
          </span>
        </a>
      ))}
    </div>
  );
}
