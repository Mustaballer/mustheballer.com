// Single source of truth for the site's professional content.
// Edit here — both the 3D study and recruiter mode read from this file.

export const profile = {
  name: "Mustafa Abdulrahman",
  title: "Software Engineer",
  company: "Amazon",
  location: "Toronto, ON",
  tagline:
    "I build GenAI agents, desktop apps, and the delivery pipelines that ship them safely to thousands of users.",
  email: "mus2003.abdul@gmail.com",
  links: {
    github: "https://github.com/Mustaballer",
    linkedin: "https://www.linkedin.com/in/mus123/",
    devpost: "https://devpost.com/mus2003abdul",
    myanimelist: "https://myanimelist.net/profile/mus_theballer",
    steam: "https://steamcommunity.com/profiles/76561199839140332/",
  },
  resume: "/Mustafa_Abdulrahman_Resume.pdf",
};

export type Quest = {
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  active?: boolean;
  rank: "S" | "A" | "B";
  achievement: string; // Steam-style achievement title
  highlight: string; // one-line headline metric
  bullets: string[];
  tags: string[];
};

export const experience: Quest[] = [
  {
    role: "Software Engineer",
    company: "Amazon",
    location: "Toronto, ON",
    start: "May 2026",
    end: "Present",
    active: true,
    rank: "S",
    achievement: "Main Quest: The Radiant Path",
    highlight: "Shipped an AI desktop assistant to 3,000+ finance analysts",
    bullets: [
      "Owned full continuous delivery for an Electron AI desktop assistant (Strands, Bedrock) rolled out to 3,000+ finance analysts — Playwright Windows E2E gates and daily prod canaries on EC2 (CDK), with zero manual approval steps.",
      "Drove AppSec certification of a high-risk GenAI agent across 28+ security CRs, fixing 4 threat-model findings and 8 production risks via Bedrock Guardrails, per-user S3/IAM session isolation, a read-only SQL allowlist, and a sandboxed Python runtime.",
      "Resolved Sev-2 incidents on call (silent Kinesis record loss) and root-caused a startup deadlock causing 0/18 successful launches by moving serial agent rehydration off a 90s readiness path into a worker pool.",
      "Migrated Promise-to-Pay and Dispute workflows on a collections platform used by ~1,000 analysts from Redux-Saga to TanStack Query, and built group-level tasks for resellers with hundreds of linked accounts.",
      "Ran user research with collections analysts to shape a consolidated multi-account inbox, and partnered with finance teams on agentic AI skills automating receipt matching and cross-country deductions.",
    ],
    tags: ["Electron", "Bedrock", "Strands", "Playwright", "CDK", "React", "TanStack Query"],
  },
  {
    role: "Software Engineering Intern",
    company: "Amazon",
    location: "Toronto, ON",
    start: "May 2025",
    end: "Aug 2025",
    rank: "A",
    achievement: "Policy Alchemist",
    highlight: "Policy-to-code turnaround cut from 2 weeks → 2 days",
    bullets: [
      "Designed an end-to-end GenAI system (Bedrock, LangChain, MCP) that auto-converts approval policy PDFs into Java rules with test cases, reducing turnaround from 2 weeks to 2 days.",
      "Implemented agentic workflows with TDD and LLMOps guardrails on Lambda, API Gateway, and CDK, eliminating 65% of potential production rollbacks and saving ~12 engineering hours per policy.",
    ],
    tags: ["Bedrock", "LangChain", "MCP", "Java", "Lambda", "CDK"],
  },
  {
    role: "Software Engineering Intern",
    company: "AMD",
    location: "Markham, ON",
    start: "May 2024",
    end: "Apr 2025",
    rank: "A",
    achievement: "Red Team Kernel Smith",
    highlight: "GPU kernels in HIP 35% faster",
    bullets: [
      "Engineered a system using the GitHub GraphQL API to extract and store 2M+ entries in PostgreSQL with daily updates, visualized in Power BI reports shared weekly with upper management.",
      "Optimized GPU kernel code in HIP — efficient matrix addition and moving-average filters — improving data processing speed by 35% and reducing compute time by 20%.",
    ],
    tags: ["HIP", "C++", "GraphQL", "PostgreSQL", "Power BI"],
  },
  {
    role: "Machine Learning Engineer Intern",
    company: "MLDSAI Inc.",
    location: "Toronto, ON",
    start: "May 2023",
    end: "Aug 2023",
    rank: "B",
    achievement: "Automaton Apprentice",
    highlight: "Manual task input cut by 50% with OpenAdapt",
    bullets: [
      "Developed the OpenAdapt Python library for AI-first process automation, using transformer completions for synthetic input generation to cut manual task input by 50%.",
      "Scripted automated recording of user inputs and screenshots, generating a 10,000+ sample dataset and saving ~40% time over manual collection.",
      "Accelerated data processing by implementing tokenization, reducing processing time by 30%.",
    ],
    tags: ["Python", "Transformers", "OpenAdapt"],
  },
];

export type Project = {
  name: string;
  blurb: string;
  bullets: string[];
  tags: string[];
  links: { label: string; href: string }[];
};

export const projects: Project[] = [
  {
    name: "RabbitHole",
    blurb:
      "Capstone: pick a seed paper and explore its citation neighbourhood as an interactive graph that ranks and explains how each paper relates.",
    bullets: [
      "Built the relevance engine: SPECTER2 embeddings of chunked full-text (max-pooled per paper) blended with year proximity and citation signals, with an embedding cache for fast re-runs.",
      "Implemented bidirectional citation-graph expansion (references and citations) and the Flask API + Celery/Redis task queue that ingests papers asynchronously, with Flower monitoring in Docker Compose.",
      "Designed the React Flow graph UI (dagre layout, relevance-coloured nodes, LLM explanations per edge) with live polling for background scoring jobs.",
      "Benchmarked GPU (ROCm) vs CPU embedding throughput to size the ingestion workers.",
    ],
    tags: ["Python", "Flask", "Celery", "Redis", "Neo4j", "SPECTER2", "React", "React Flow", "Docker"],
    links: [{ label: "GitHub", href: "https://github.com/Ahmed-Labs/rabbithole" }],
  },
  {
    name: "Hardware Sign-out Site",
    blurb: "Open-source inventory & applications platform for Canada's largest Makeathon.",
    bullets: [
      "Directed a 15+ person team building an open-source inventory system for 5,000+ components — hardware wait times went from 4 hours to 10 minutes.",
      "Built an application review portal that cut screening time from 20 hours to 2 hours for 1,500+ applicants.",
    ],
    tags: ["React", "Redux", "Django", "PostgreSQL", "Docker"],
    links: [{ label: "GitHub", href: "https://github.com/ieeeuoft/hackathon-template" }],
  },
  {
    name: "OpenAdapt",
    blurb: "Open-source library for AI-first process automation using large multimodal models.",
    bullets: [
      "Core contributor during my MLDSAI internship: synthetic input generation with transformer completions and automated input/screenshot recording.",
    ],
    tags: ["Python", "LLMs", "Automation"],
    links: [{ label: "GitHub", href: "https://github.com/OpenAdaptAI/OpenAdapt" }],
  },
];

// Older projects from the original site — kept as a compact archive.
export const archive = [
  { name: "MyJikanBot", note: "Discord anime/manga bot", href: "https://github.com/Mustaballer/MyJikanBot" },
  { name: "EventNow", note: "Event booker · React, GraphQL", href: "https://github.com/Mustaballer/EVENTNOW" },
  { name: "ChillChat", note: "Chat rooms · Socket.io", href: "https://github.com/Mustaballer/ChillChat" },
  { name: "Winter Run", note: "2D arcade game · Phaser 3", href: "https://github.com/Mustaballer/winter_run" },
  { name: "Persona 5 Login", note: "Persona-styled login system", href: "https://github.com/Mustaballer/Persona-5-Login" },
];

// Skill ranks borrow Mushoku Tensei's magic tiers.
export const RANKS = ["Beginner", "Intermediate", "Advanced", "Saint", "King", "Emperor", "God"] as const;
export type Rank = (typeof RANKS)[number];

export const skills: { school: string; color: string; spells: { name: string; rank: Rank }[] }[] = [
  {
    school: "Languages",
    color: "#b3262e",
    spells: [
      { name: "TypeScript / JavaScript", rank: "Saint" },
      { name: "Python", rank: "Saint" },
      { name: "Java", rank: "Advanced" },
      { name: "C++", rank: "Advanced" },
      { name: "SQL", rank: "Advanced" },
      { name: "HTML / CSS", rank: "Saint" },
    ],
  },
  {
    school: "Frameworks",
    color: "#2f5d8a",
    spells: [
      { name: "React", rank: "Saint" },
      { name: "TanStack Query", rank: "Advanced" },
      { name: "Redux", rank: "Advanced" },
      { name: "Electron", rank: "Advanced" },
      { name: "Playwright", rank: "Advanced" },
      { name: "Django", rank: "Advanced" },
      { name: "Spring Boot", rank: "Intermediate" },
      { name: "Flask", rank: "Intermediate" },
    ],
  },
  {
    school: "AI & Agents",
    color: "#6b4fa3",
    spells: [
      { name: "Amazon Bedrock", rank: "Saint" },
      { name: "Strands Agents", rank: "Advanced" },
      { name: "Bedrock Guardrails", rank: "Advanced" },
      { name: "LangChain", rank: "Advanced" },
      { name: "MCP", rank: "Advanced" },
    ],
  },
  {
    school: "Cloud & Tools",
    color: "#a8741a",
    spells: [
      { name: "AWS (S3, IAM, Lambda, EC2, CloudWatch)", rank: "Saint" },
      { name: "AWS CDK", rank: "Advanced" },
      { name: "Docker", rank: "Advanced" },
      { name: "CI/CD · Jenkins", rank: "Advanced" },
      { name: "PostgreSQL / MySQL", rank: "Advanced" },
      { name: "Git", rank: "Saint" },
    ],
  },
];

export const education = {
  school: "University of Toronto",
  degree: "Bachelor of Applied Science in Computer Engineering",
  graduated: "May 2026",
};

export const library = [
  {
    title: "The Count of Monte Cristo",
    author: "Alexandre Dumas",
    status: "All-time favourite",
    quote: "All human wisdom is contained in these two words: Wait and Hope.",
    spine: "#7a1f24",
  },
  {
    title: "Words of Radiance",
    author: "Brandon Sanderson",
    status: "Favourite fantasy",
    quote: "Journey before destination.",
    spine: "#1f4a6b",
  },
  {
    title: "East of Eden",
    author: "John Steinbeck",
    status: "Currently reading",
    quote: "And now that you don't have to be perfect, you can be good.",
    spine: "#3f5a2c",
  },
];

export const battlestation = {
  name: "The Battlestation",
  rarity: "Legendary",
  specs: ["AMD Ryzen 9 7900X", "AMD Radeon RX 9070 XT", "All-white build"],
  flavor: "Renders anime at 4K and AWS bills at 1:1.",
};
