import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, isOpenAIAvailable } from "@/lib/openai";
import { z } from "zod";

const improveSchema = z.object({
  fullName: z.string().min(1).max(100),
  headline: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  skills: z.array(z.string()).max(30),
  experience: z.string().max(5000),
  education: z.string().max(2000),
});

interface ResumeImprovement {
  improvedSummary: string;
  improvedHeadline: string;
  skillSuggestions: string[];
  experienceTips: string[];
  overallScore: number;
  feedback: string;
}

function mockImprovement(data: z.infer<typeof improveSchema>): ResumeImprovement {
  return {
    improvedHeadline: data.headline
      ? `${data.headline} | Remote-Ready Professional`
      : "Skilled Virtual Assistant | Remote-Ready Professional",
    improvedSummary: `Results-driven professional with a strong foundation in ${data.skills.slice(0, 3).join(", ")}. ${
      data.summary ?? "Committed to delivering high-quality work remotely with excellent communication and time management skills."
    }`,
    skillSuggestions: ["Microsoft Office 365", "Slack", "Trello", "Asana", "Google Workspace"],
    experienceTips: [
      "Quantify achievements with numbers (e.g., 'Managed 50+ client emails daily')",
      "Use strong action verbs: coordinated, streamlined, implemented",
      "Highlight remote work experience and tools used",
    ],
    overallScore: 72,
    feedback:
      "Your resume shows good potential. Add measurable achievements and remote-specific skills to stand out to global employers.",
  };
}

async function improveWithAI(data: z.infer<typeof improveSchema>): Promise<ResumeImprovement> {
  const ai = getOpenAI();
  const prompt = `
Name: ${data.fullName}
Headline: ${data.headline ?? ""}
Summary: ${data.summary ?? ""}
Skills: ${data.skills.join(", ")}
Experience: ${data.experience}
Education: ${data.education}
  `.trim();

  const completion = await ai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional resume coach. Analyse the resume below and return ONLY a JSON object (no markdown) with these exact keys:
{
  "improvedHeadline": "<improved professional headline>",
  "improvedSummary": "<rewritten 3-4 sentence professional summary>",
  "skillSuggestions": ["<skill1>","<skill2>","<skill3>","<skill4>","<skill5>"],
  "experienceTips": ["<tip1>","<tip2>","<tip3>"],
  "overallScore": <0-100>,
  "feedback": "<1-2 paragraph overall feedback>"
}`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 900,
  });

  return JSON.parse(completion.choices[0]?.message?.content ?? "{}") as ResumeImprovement;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = improveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid resume data" },
        { status: 400 }
      );
    }

    const improvement = isOpenAIAvailable()
      ? await improveWithAI(parsed.data)
      : mockImprovement(parsed.data);

    return NextResponse.json({
      success: true,
      data: { improvement, aiPowered: isOpenAIAvailable() },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to improve resume";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
