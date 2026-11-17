import { Hero } from "@/components/home/hero";
import { AssistantShowcase } from "@/components/home/assistant-showcase";
import { Approach } from "@/components/home/approach";
import { FaqPreview } from "@/components/home/faq-preview";
import { ContactCta } from "@/components/home/contact-cta";
import { ClaudeAcademy, Disciplines, Principles, ProgrammeFacts, Solutions, Tracks } from "@/components/home/sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Disciplines />
      <Tracks />
      <ProgrammeFacts />
      <Solutions />
      <ClaudeAcademy />
      <Principles />
      <AssistantShowcase />
      <Approach />
      <FaqPreview />
      <ContactCta />
    </>
  );
}
