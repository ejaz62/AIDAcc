import Image from "next/image";
import { Container, SectionHeading } from "@/components/ui/primitives";

const PHOTOS = [
  { src: "/images/students/student-desk.webp", alt: "Student studying on his laptop at a desk", caption: "Live, instructor-led classes" },
  { src: "/images/students/student-hijab.webp", alt: "Smiling student in a pink hijab holding a tablet", caption: "Beginners welcome" },
  { src: "/images/students/student-glasses.webp", alt: "Young student working on a laptop at home", caption: "Learn from home" },
  { src: "/images/students/student-scarf.webp", alt: "Student typing on a laptop at a café table", caption: "Build real projects" },
] as const;

/** Photo band showing who the programme is for. Photos are illustrative stock images. */
export function StudentsGallery() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Learn from anywhere"
          title="AI skills for students and professionals"
          lead="Classes are live and online, so you can join from anywhere in Pakistan, Saudi Arabia or abroad. All you need is a laptop."
        />
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {PHOTOS.map((p, i) => (
            <li key={p.src} className={i % 2 === 1 ? "lg:translate-y-8" : ""}>
              <figure className="group relative aspect-[4/5] overflow-hidden rounded-(--radius-card) shadow-lg ring-1 ring-black/5">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-3 bottom-3 text-sm font-semibold text-white sm:inset-x-4 sm:bottom-4 sm:text-base">
                  {p.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <p className="mt-14 text-center text-xs text-ink-400">Illustrative photos.</p>
      </Container>
    </section>
  );
}
