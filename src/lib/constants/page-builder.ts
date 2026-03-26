export const MAX_SECTIONS_PER_PAGE = 20;
export const MAX_PAGES_PER_ORG = 10;

export const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Poppins",
  "Montserrat", "Playfair Display", "Merriweather"
] as const;

export type GoogleFont = (typeof GOOGLE_FONTS)[number];

export const SECTION_TYPE_LABELS = {
  HERO: "Hero Banner",
  FEATURES: "Features List",
  TESTIMONIALS: "Testimonials",
  CONTACT: "Contact Info",
  CTA: "Call to Action",
  TEXT: "Text Block",
  IMAGE: "Image",
} as const;

export const DEFAULT_SECTION_CONTENT = {
  HERO: {
    headline: "Welcome to Our Platform",
    subheadline: "Your trusted learning partner",
    backgroundImage: "",
    ctaText: "Get Started",
    ctaLink: "/enroll",
  },
  FEATURES: {
    title: "Why Choose Us",
    items: [
      { icon: "✓", title: "Expert Instructors", description: "Learn from industry professionals" },
      { icon: "📚", title: "Quality Content", description: "Comprehensive and up-to-date curriculum" },
      { icon: "🏆", title: "Certification", description: "Earn recognized certificates" },
    ],
  },
  TESTIMONIALS: {
    title: "What Our Students Say",
    items: [
      { name: "Student Name", role: "Course Graduate", quote: "This platform changed my career.", avatar: "" },
    ],
  },
  CONTACT: {
    title: "Get In Touch",
    description: "We'd love to hear from you.",
    showForm: true,
  },
  CTA: {
    headline: "Ready to Start Learning?",
    subheadline: "Join thousands of students today",
    buttonText: "Enroll Now",
    buttonLink: "/enroll",
  },
  TEXT: {
    title: "About Us",
    body: "Tell your story here.",
  },
  IMAGE: {
    url: "",
    alt: "Image description",
    caption: "",
  },
} as const;
