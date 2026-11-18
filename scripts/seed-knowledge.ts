/**
 * Imports the AIDA knowledge base into the database without overwriting anything.
 *
 *   npm run kb:seed
 *
 * 1. Adds knowledge sections from knowledge/aida/*.md that are not yet in the database.
 * 2. Adds the Q&As from the FAQ section as published FAQ entries (skipping existing questions).
 * 3. Adds the AIDA AI Training Programme to the programme catalogue if it is missing.
 * 4. Updates starter FAQ answers only if they are still exactly the original starter text.
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sslFor } from "../src/lib/db-ssl";
import { parseFaqPairs, parseKnowledgeFile, seedSectionsFromFiles } from "../src/features/knowledge/knowledge";

config({ path: [".env.local", ".env"], quiet: true });

const OUTDATED_STARTER: Record<string, { old: string; replacement: string }> = {
  "What is AIDA?": {
    old: "AIDA stands for Artificial Intelligence Digital Academy, a digital academy focused on artificial intelligence education. More information about AIDA will be published on the About page (/about) as it is confirmed.",
    replacement:
      "AIDA (Artificial Intelligence Digital Academy) teaches practical AI skills through beginner-friendly, hands-on learning. It offers one programme, the AIDA AI Training Programme: 10 days of live, instructor-led online classes. See /about and /programme.",
  },
  "Is registering interest the same as applying for admission?": {
    old: "No. Registering interest only lets AIDA contact you with news. It is not an application for admission, does not reserve a place and creates no commitment for you or for AIDA. Formal admission applications will be handled through a separate process once admissions open.",
    replacement: "No. Registering interest only lets AIDA contact you with news. It is not an application for admission, does not reserve a place and creates no commitment for you or for AIDA. To apply for a place, please use the Student Admission Form at /admission.",
  },
  "Where can I find programme details and fees?": {
    old: 'Published programmes are listed at /programmes, each with its overview, who it is for, duration, study format, entry requirements and fees. Details that have not been confirmed yet are shown as "To be confirmed".',
    replacement:
      "See /programme for the AI Training Programme, /curriculum for what you will learn, and /fees-admission for fees, payment and how to register.",
  },
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, ssl: sslFor(url) }) });
  try {
    const dir = path.resolve("knowledge/aida");
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => parseKnowledgeFile(fs.readFileSync(path.join(dir, f), "utf8")));

    const added = await seedSectionsFromFiles(db, files);
    console.log(`Knowledge sections added: ${added.length ? added.join(", ") : "none (all present)"}`);

    const faqSection = files.find((f) => f.key === "faq");
    let faqAdded = 0;
    if (faqSection) {
      const existing = new Set((await db.faqEntry.findMany({ select: { question: true } })).map((q) => q.question.toLowerCase()));
      const max = (await db.faqEntry.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0;
      for (const [i, pair] of parseFaqPairs(faqSection.body).entries()) {
        if (existing.has(pair.question.toLowerCase())) continue;
        await db.faqEntry.create({ data: { ...pair, status: "PUBLISHED", sortOrder: max + (i + 1) * 10 } });
        faqAdded++;
      }
    }
    console.log(`FAQ entries added: ${faqAdded}`);

    // Changing existing rows is opt-in: only with --update-starter, and only if the
    // starter answer is still exactly the original text (never a staff edit).
    if (process.argv.includes("--update-starter")) {
      for (const [question, { old, replacement }] of Object.entries(OUTDATED_STARTER)) {
        const r = await db.faqEntry.updateMany({ where: { question, answer: old }, data: { answer: replacement } });
        if (r.count) console.log(`Updated starter answer: ${question}`);
      }
    } else {
      const stale = await db.faqEntry.count({
        where: { OR: Object.entries(OUTDATED_STARTER).map(([question, { old }]) => ({ question, answer: old })) },
      });
      if (stale) console.log(`${stale} starter FAQ answer(s) are outdated; run with --update-starter to refresh them.`);
    }

    if (!(await db.programme.findUnique({ where: { slug: "ai-training-programme" } }))) {
      await db.programme.create({
        data: {
          slug: "ai-training-programme",
          title: "AIDA AI Training Programme",
          summary:
            "A 10-day, live, instructor-led online programme for complete beginners: learn Claude and AI tools, AI website development, AI agents and automation, and how to publish websites online.",
          overview:
            "AIDA's one confirmed programme teaches practical AI skills through hands-on learning. Learning areas: Claude and AI tools; website development using AI; AI agent development and deployment; AI agents and AI employees; WhatsApp AI assistants and employees; practical AI automation. Students keep their project files and source code, and those who complete the course successfully receive an AIDA certificate.",
          audience: "Complete beginners. No coding, programming or technical background is required.",
          duration: "10 days (batches: 1st–10th, 11th–20th, 21st–30th of each month)",
          studyFormat: "Live, instructor-led online classes, 9:00–10:00 PM Pakistan Standard Time",
          entryRequirements: "A laptop (mobile-only is not sufficient). Free ChatGPT is sufficient; Claude Pro is required for the training workflow.",
          fees: "Pakistan: PKR 15,000. Saudi Arabia: SAR 200. International: USD 55. 100% refund if not satisfied after the first day's class.",
          status: "PUBLISHED",
          publishedAt: new Date(),
          sortOrder: 0,
        },
      });
      console.log("Programme added: AIDA AI Training Programme");
    } else {
      console.log("Programme already present: AIDA AI Training Programme");
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
