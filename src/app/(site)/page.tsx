import { Hero } from "@/components/home/hero";
import { About } from "@/components/home/about";
import { StudentsGallery } from "@/components/home/students-gallery";
import { AssistantShowcase } from "@/components/home/assistant-showcase";
import { Approach } from "@/components/home/approach";
import { Programmes } from "@/components/home/programmes";
import { FaqPreview } from "@/components/home/faq-preview";
import { ContactCta } from "@/components/home/contact-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StudentsGallery />
      <About />
      <AssistantShowcase />
      <Approach />
      <Programmes />
      <FaqPreview />
      <ContactCta />
    </>
  );
}
