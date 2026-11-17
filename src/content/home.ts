/**
 * Homepage content (adapted from the owner's AIDA design in Google AI Studio).
 * Programme facts (fees, dates, timings) come from the knowledge base, not from here.
 */

export const disciplines = [
  { title: "AI Agents & Employees", body: "Build autonomous digital employees for real operational tasks." },
  { title: "Website Dev Using AI", body: "Create fast, responsive business websites using AI coding tools." },
  { title: "AI Agent Deployment", body: "Configure, deploy, test and maintain live AI agents." },
  { title: "WhatsApp AI Employees", body: "Answer client enquiries 24/7 with AI assistants on WhatsApp." },
  { title: "Business AI Solutions", body: "Deliver practical, high-impact AI implementations for business clients." },
] as const;

export const tracks = [
  {
    title: "Website Development Using AI",
    tagline: "Use modern AI coding tools and agents to design, build and launch professional business websites.",
    competencies: [
      "Pair-programming with AI assistants such as Claude Code",
      "Prompting AI for clean code, modern components and responsive layouts",
      "Fast debugging and multi-file changes with AI",
      "Building mobile-friendly landing pages and business sites, and publishing them online",
    ],
    application: "Create and deliver websites for local and international business clients quickly and reliably.",
  },
  {
    title: "AI Agents and AI Employees",
    tagline: "Build intelligent AI agents and digital employees designed to perform real business tasks.",
    competencies: [
      "How agents plan tasks, use tools and remember context",
      "Connecting agents to knowledge, databases and external services",
      "Designing human oversight and safe boundaries",
      "Setting up digital employees for admin, research and operations",
    ],
    application: "Design digital employees that take over repetitive tasks, research and internal workflows.",
  },
  {
    title: "AI Agent Deployment",
    tagline: "Configure, deploy, test and maintain AI agents for reliable real-world use.",
    competencies: [
      "Configuration, environment settings, rate limits and API security",
      "Deploying agents to the cloud and to webhook endpoints",
      "Testing for accuracy and handling edge cases",
      "Monitoring usage and maintaining agents for clients",
    ],
    application: "Launch and support live AI solutions, not just prototypes.",
  },
  {
    title: "WhatsApp AI Employees",
    tagline: "Build AI employees for WhatsApp that answer customer enquiries and share business information 24/7.",
    competencies: [
      "Connecting AI to the WhatsApp Business platform",
      "Training assistants on verified business information and FAQs",
      "Polite tone, accurate guardrails and hand-over to human staff",
      "Round-the-clock responses to customer enquiries",
    ],
    application: "A high-demand service for shops, clinics, service providers and agencies.",
  },
] as const;

export const solutions = [
  {
    title: "AI-accelerated business websites",
    challenge: "Traditional web development can be slow and costly for growing businesses.",
    build: "Clean, fast business websites built with AI pair-programming in days rather than months.",
  },
  {
    title: "24/7 WhatsApp customer care",
    challenge: "Businesses lose customers outside working hours or struggle with repetitive WhatsApp questions.",
    build: "WhatsApp AI employees trained on verified company facts that answer FAQs and pass complex requests to staff.",
  },
  {
    title: "Internal operational AI agents",
    challenge: "Teams spend hours sorting documents, notes and customer records by hand.",
    build: "Agents that read documents, draft summaries and connect to company data to remove routine admin work.",
  },
  {
    title: "Deployment and maintenance",
    challenge: "Many businesses try chatbots but can't deploy, secure and maintain them.",
    build: "End-to-end agent operations: hosting, API key protection, usage budgets and ongoing accuracy checks.",
  },
] as const;

/** Anthropic Claude Academy courses completed by the founder (as supplied by AIDA). */
export const claudeCourses = [
  { title: "Claude 101", body: "Core capabilities and strengths of Claude models." },
  { title: "Claude Code 101", body: "Terminal-based coding agent fundamentals and safety controls." },
  { title: "Introduction to Claude Cowork", body: "Collaborative workspaces and document co-creation." },
  { title: "Claude Platform 101", body: "Console, API keys, rate limits and Workbench prototyping." },
  { title: "Claude Code in Action", body: "Real-world refactoring, automated testing and multi-file editing." },
  { title: "Introduction to Model Context Protocol", body: "MCP architecture and standard context servers." },
  { title: "Model Context Protocol: Advanced topics", body: "Custom MCP servers, prompts and tool registration." },
  { title: "AI Fluency: Framework and foundations", body: "Mental models for AI capabilities and responsible use." },
  { title: "Building effective human-agent teams", body: "Human-in-the-loop workflows, delegation and oversight." },
  { title: "Introduction to Claude Tag", body: "Prompt structuring with tags and reliable document parsing." },
] as const;

export const principles = [
  { title: "Beginner-friendly explanations", body: "Complex AI ideas in plain language. No coding background or degree needed." },
  { title: "Project-based learning", body: "Every lesson is anchored in real projects and working tools." },
  { title: "Modern AI tools", body: "Current tools including Claude and Claude Code, used the way professionals use them." },
  { title: "AI agents & automation", body: "Go beyond chat: agents and automations that do real work." },
  { title: "Skills for freelancing & business", body: "Skills you can offer to clients or use to improve your own business." },
] as const;

export const showcase = [
  {
    key: "lab",
    label: "Students Lab",
    src: "/images/hero-ai-students.webp",
    alt: "Pakistani students building AI agents together on laptops",
    eyebrow: "Collaborative learning",
    title: "Building next-gen AI agents, automated workflows & AI employees",
    body: "Hands-on practice: pair-programming with AI, configuring agents and automating real business tasks.",
  },
  {
    key: "workshop",
    label: "Live Workshops",
    src: "/images/workshop-ai-lab.webp",
    alt: "Students in an AI agent workflows workshop",
    eyebrow: "Live, instructor-led",
    title: "Live classes, 9:00–10:00 PM Pakistan time",
    body: "10-day programme with monthly batches. Recordings are provided for revision.",
  },
  {
    key: "workspace",
    label: "Learning Space",
    src: "/images/learning-workspace.webp",
    alt: "Students learning to build with AI on laptops at shared tables",
    eyebrow: "Practical learning",
    title: "Learn by building real AI projects",
    body: "Hands-on exercises with AI coding tools — you keep your project files and source code.",
  },
  {
    key: "agents",
    label: "AI Agents",
    src: "/images/ai-agents.webp",
    alt: "Illustration of AI agents, code generation and deployment workflows",
    eyebrow: "What you will build",
    title: "From prompt to deployed AI agent",
    body: "Learn how agents reason, generate code, run tests and connect to real systems.",
  },
] as const;
