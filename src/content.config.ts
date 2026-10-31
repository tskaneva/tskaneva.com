import { defineCollection, z } from "astro:content";
import { file, glob } from "astro/loaders";

const link = z.object({ label: z.string().min(1), href: z.url() });
const publicationSchema = z.object({
  id: z.string(),
  featured: z.boolean().default(false),
  year: z.number().int(),
  type: z.string().min(1),
  title: z.string().trim().min(1),
  authors: z.string().min(1),
  venue: z.string().min(1),
  indexed: z.array(z.string()).default([]),
  links: z.array(link).default([]),
});
const studentSchema = z.object({
  id: z.string(),
  year: z.number().int(),
  level: z.string().min(1),
  title: z.string().min(1),
  names: z.string().min(1),
  links: z.array(link).default([]),
});
const awardDateSchema = z.preprocess(
  (value) => value instanceof Date ? value.toISOString().slice(0, 10) : typeof value === "number" ? String(value) : value,
  z.string().regex(/^\d{4}(?:-\d{2}-\d{2})?$/).refine((value) => {
    if (value.length === 4) return true;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Use a year (YYYY) or a valid date (YYYY-MM-DD)"),
);
const publicationsEn = defineCollection({ loader: file("./src/data/publications-en.yaml"), schema: publicationSchema });
const publicationsBg = defineCollection({ loader: file("./src/data/publications-bg.yaml"), schema: publicationSchema });
const studentsEn = defineCollection({ loader: file("./src/data/students-en.yaml"), schema: studentSchema });
const studentsBg = defineCollection({ loader: file("./src/data/students-bg.yaml"), schema: studentSchema });

const teaching = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/teaching",
  }),

  schema: z.object({
    title: z.string(),
    level: z.string(),
    semester: z.string(),
    year: z.string(),
    order: z.number().optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          // Existing course placeholders are tracked separately in WEBSITE_TASKS.md.
          href: z.union([z.url(), z.literal("#")])
        })
      )
      .optional(),
  }),
});

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/pages",
  }),

  schema: z.object({
    names: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    research_areas: z.array(z.string()),
    employment_history: z.array(z.object({
      period: z.string(),
      role: z.string(),
      institution: z.string(),
      department: z.string().optional(),
      description: z.string().optional(),
    })),
    projects: z.array(z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      url: z.url(),
      link_label: z.string().trim().min(1),
    })),
    student_branch: z.object({
      role: z.string().trim().min(1),
      link: z.url(),
      link_label: z.string().trim().min(1),
      logo_alt: z.string().trim().min(1),
    }),
    awards: z.array(z.object({
      date: awardDateSchema,
      title: z.string().trim().min(1),
      organization: z.string().trim().min(1),
      description: z.string().trim().min(1).optional(),
      image: z.string().startsWith("/").optional(),
      links: z.array(link).default([]),
    })),
  }),
});

const projects = defineCollection({
    loader: glob({
        pattern: "**/*.md",
        base: "./src/content/projects",
    }),
    schema: z.object({
    title: z.string(),
    code: z.string().optional(),
    role: z.string(),
    period: z.string().optional(),
    funding: z.string(),
    status: z.string(),
    type: z.string(),
    theme: z.enum([
      "energy",
      "ai",
      "data",
      "education",
      "agriculture",
      "infrastructure",
    ]).default("infrastructure"),
    keywords: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(999),
    links: z.array(
      z.object({
        label: z.string(),
        href: z.string().url(),
      })
    ).default([]),
  }),
});

const laboratories = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/laboratories",
  }),
  schema: z.object({
    title: z.string(),
    code: z.string().optional(),
    link: z.string().url(),
  }),
});

export const collections = { teaching, pages, projects, laboratories, publicationsEn, publicationsBg, studentsEn, studentsBg };
