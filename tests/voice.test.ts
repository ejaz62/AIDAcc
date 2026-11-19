import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { offlineReply } from "@/features/assistant/offline";
import { pickVoice, speechChunks, textForSpeech, voiceErrorMessage, voiceLangFor } from "@/features/assistant/voice";
import { parseFaqPairs, parseKnowledgeFile } from "@/features/knowledge/knowledge";

const dir = path.resolve("knowledge/aida");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => parseKnowledgeFile(fs.readFileSync(path.join(dir, f), "utf8")));
const faq = parseFaqPairs(files.find((f) => f.key === "faq")!.body).map((p, i) => ({ id: `faq${i}`, ...p }));
const ask = (q: string) => offlineReply(q, { faq, sections: files });

const voices = [
  { lang: "en-US", name: "US English" },
  { lang: "en-GB", name: "UK English" },
  { lang: "en-IN", name: "Indian English" },
  { lang: "hi-IN", name: "Hindi" },
  { lang: "ur-PK", name: "Urdu" },
];

describe("text read aloud", () => {
  it("leaves out page links and the More details line, but keeps the facts", () => {
    const spoken = textForSpeech(ask("What is the course fee?"));
    expect(spoken).toContain("PKR 15,000");
    expect(spoken).not.toMatch(/More details|\/fees-admission/);
  });

  it("does the same for Roman Urdu and Urdu answers", () => {
    expect(textForSpeech(ask("class kab hoti hai"))).not.toMatch(/Mazeed maloomat|\/programme/);
    const urdu = textForSpeech(ask("فیس کتنی ہے؟"));
    expect(urdu).toContain("PKR 15,000");
    expect(urdu).not.toMatch(/مزید معلومات|\/fees-admission/);
  });

  it("reads phone numbers digit by digit and drops web addresses and markdown", () => {
    expect(textForSpeech("Call +92 322 720 4898 today.")).toContain("+ 9 2 3 2 2 7 2 0 4 8 9 8");
    expect(textForSpeech("See **https://example.com/x** now")).toBe("See now");
  });

  it("splits long replies into sentence-sized pieces without losing text", () => {
    const text = textForSpeech(ask("I am travelling next week and will miss two classes."));
    const chunks = speechChunks(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 180 || !c.includes(". "))).toBe(true);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toBe(text.replace(/\s+/g, " "));
    expect(speechChunks("پہلا جملہ۔ دوسرا جملہ؟", 10)).toEqual(["پہلا جملہ۔", "دوسرا جملہ؟"]);
  });
});

describe("voice choice", () => {
  it("uses an English voice for English, an Urdu voice for Urdu script, and a South Asian voice for Roman Urdu", () => {
    expect(pickVoice(voices, "The course fee is PKR 15,000.")?.lang).toBe("en-GB");
    expect(pickVoice(voices, "کورس فیس 15,000 روپے ہے")?.lang).toBe("ur-PK");
    expect(pickVoice(voices, "Classes raat 9:00 PM se hoti hain")?.lang).toBe("en-IN");
  });

  it("returns no voice (so the visitor is told honestly) when the device has no Urdu voice", () => {
    expect(pickVoice(voices.filter((v) => v.lang !== "ur-PK"), "کورس فیس")).toBeNull();
    expect(pickVoice([], "Hello")).toBeNull();
  });

  it("accepts underscore language codes used by some Android devices", () => {
    expect(pickVoice([{ lang: "ur_PK", name: "Urdu" }], "فیس")?.name).toBe("Urdu");
  });
});

describe("microphone", () => {
  it("listens in English or Urdu (spoken Roman Urdu is Urdu speech)", () => {
    expect(voiceLangFor("en")).toBe("en-US");
    expect(voiceLangFor("roman")).toBe("ur-PK");
    expect(voiceLangFor("urdu")).toBe("ur-PK");
  });

  it("explains errors in plain language", () => {
    expect(voiceErrorMessage("not-allowed")).toMatch(/allow the microphone/);
    expect(voiceErrorMessage("no-speech")).toMatch(/didn't hear/);
    expect(voiceErrorMessage("audio-capture")).toMatch(/No microphone/);
    expect(voiceErrorMessage("aborted")).toBe("");
    expect(voiceErrorMessage("something-new")).toMatch(/type your question/);
  });

  it("the site allows its own pages to use the microphone, and nothing else new", () => {
    const config = fs.readFileSync(path.resolve("next.config.ts"), "utf8");
    expect(config).toContain("microphone=(self)");
    expect(config).toContain("camera=()");
    expect(config).toContain("geolocation=()");
  });
});
