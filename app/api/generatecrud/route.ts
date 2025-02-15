import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface GenerateCrudRequest {
  entity: string;
  fields: { name: string; type: string }[];
  database: string;
}

export async function POST(req: Request) {
  try {
    const body: GenerateCrudRequest = await req.json();
    const { entity, fields, database } = body;

    const fieldDefinitions = fields.map((f) => `${f.name} (${f.type})`).join(', ');

    const prompt = `
    Generate a Java Spring Boot CRUD application using **ONLY JSON OUTPUT**.

    - **Entity Name**: ${entity}
    - **Fields**: ${fieldDefinitions}
    - **Database**: ${database}

    🚨 **Strict JSON Output Format** (NO explanations, NO markdown, NO extra text):
    \`\`\`json
    {
      "Entity": "<Java entity code>",
      "Repository": "<Java repository code based on ${database}>",
      "Service": "<Java service code>",
      "Controller": "<Java controller code>"
    }
    \`\`\`

    **Rules:**
    1️⃣ **DO NOT** include explanations or formatting outside JSON.
    2️⃣ **DO NOT** wrap JSON in markdown (\`\`\`json ... \`\`\`).
    3️⃣ **ENSURE** valid Java syntax for each section.

    **Others:**
    **ENSURE** to use lombok
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert in Java Spring Boot development. Respond with pure JSON output only.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' }, // ✅ Forces JSON output
    });

    const codeSnippet = response.choices[0]?.message?.content || '{}';

    return NextResponse.json(JSON.parse(codeSnippet), { status: 200 });
  } catch (error) {
    console.error('Error generating CRUD code:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
