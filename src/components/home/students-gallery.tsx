import Image from "next/image";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const PHOTOS = [
  {
    src: "/images/workshop-ai-lab.webp",
    alt: "Students working together on AI agent workflows",
    caption: "Build AI agents and real projects",
    large: true,
  },
  { src: "/images/students/student-desk.webp", alt: "Student studying on his laptop at a desk", caption: "Live, instructor-led classes" },
  { src: "/images/students/student-hijab.webp", alt: "Smiling student in a pink hijab holding a tablet", caption: "Beginners welcome" },
  { src: "/images/students/student-glasses.webp", alt: "Young student working on a laptop at home", caption: "Learn from home" },
  { src: "/images/students/student-scarf.webp", alt: "Student typing on a laptop", caption: "Publish your own websites" },
] as const;

/** Photo band showing who the programme is for. Photos are illustrative. */
export function StudentsGallery() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Learn from anywhere"
          title="AI skills for students and professionals"
          lead="Classes are live and online, so you can join from anywhere in Pakistan, Saudi Arabia or abroad. All you need is a laptop."
        />
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:grid-rows-2">
          {PHOTOS.map((p) => (
            <li key={p.src} className={cn("large" in p && "col-span-2 lg:row-span-2")}>
              <figure
                className={cn(
                  "scale-original group relative h-full overflow-hidden rounded-(--radius-card) shadow-lg ring-1 ring-black/5",
                  "large" in p ? "aspect-[16/10] lg:aspect-auto" : "aspect-[4/5]",
                )}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes={"large" in p ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                <figcaption
                  className={cn(
                    "absolute inset-x-3 bottom-3 font-semibold text-white sm:inset-x-4 sm:bottom-4",
                    "large" in p ? "text-lg sm:text-2xl" : "text-sm sm:text-base",
                  )}
                >
                  {p.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-ink-400">Illustrative images.</p>
      </Container>
    </section>
  );
}
