import type { Metadata } from "next";
import { getPublicSiteData } from "@/lib/services/tenant-page.service";
import ContactSection from "@/components/page-builder/sections/ContactSection";

export const revalidate = 60;

interface ContactPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicSiteData(slug);

  if (!data) return { title: "Contact" };

  const { organization } = data;
  const businessName = organization.siteName ?? organization.name;

  return {
    title: `Contact | ${businessName}`,
    description: `Get in touch with ${businessName}`,
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { slug } = await params;
  const data = await getPublicSiteData(slug);

  const contactPage = data?.pages.find((p) => p.type === "CONTACT");
  const contactSections = contactPage?.sections as
    | Array<{ type: string; content: Record<string, unknown> }>
    | undefined;

  const existingContactSection = contactSections?.find(
    (s) => s.type === "CONTACT",
  );

  const businessName = data
    ? (data.organization.siteName ?? data.organization.name)
    : "us";

  const contactContent = existingContactSection?.content ?? {
    title: "Get In Touch",
    description: `We'd love to hear from ${businessName}.`,
    showForm: true,
  };

  return (
    <div>
      <ContactSection
        content={
          contactContent as React.ComponentProps<typeof ContactSection>["content"]
        }
      />
    </div>
  );
}
