import { Hero } from "@/components/home/hero";
import { About } from "@/components/home/about";
import { Approach } from "@/components/home/approach";
import { Programmes } from "@/components/home/programmes";
import { ContactCta } from "@/components/home/contact-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Approach />
      <Programmes />
      <ContactCta />
    </>
  );
}
