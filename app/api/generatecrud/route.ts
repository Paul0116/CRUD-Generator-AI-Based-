import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface GenerateCrudRequest {
  entity: string;
  fields: { name: string; type: string; isRequired: boolean; instructions?: string }[];
  database: string;
  language: LanguageType;
}

type LanguageType = 'java' | 'react js' | 'next js' | 'node js';

const languagePrompts: Record<LanguageType, (entity: string, fields: string, database?: string) => string> = {
  java: (entity, fields, database) => `
    Generate a Java Spring Boot CRUD application using **ONLY JSON OUTPUT**.
    - **Entity Name**: ${entity}
    - **Fields**: ${fields}
    - **Database**: ${database}
    - Use Lombok annotations for the entity and dto.
    - Add Validations (e.g., @NotNull for required fields).
    - Include all validation instructions.
    - Use Response Entity
    - Please remove valiadtion on DTO
    - Please make repository extends database (e.g., Mongo db repository if mongo db, jpa repository if postgre or other sqls,  etc)
    - if field has password, the password must be encrypted before saving to the database
    - 🚨 **Strict JSON Output Format** (NO explanations, NO markdown, NO extra text):
    **Rules:**
    1️⃣ **DO NOT** include explanations or formatting outside JSON.
    2️⃣ **DO NOT** wrap JSON in markdown (\`\`\`json ... \`\`\`).
    3️⃣ **ENSURE** valid Java syntax for each section.
    Output JSON:
    {
      "Entity": "<Java entity code>",
      "DTO": "<Java dto code>",
      "DTOConverter": "<Java dto converter code>",
      "Repository": "<Java repository code>",
      "Service": "<Java service code>",
      "Controller": "<Java controller code>"
    }
  `,
  'react js': (entity, fields) => `
    Generate a React CRUD form using functional components and hooks.
    - **Entity Name**: ${entity}
    - **Fields**: ${fields}
    - Use React hooks and Tailwind components.
    - Use Redux Toolkit
    - Use RTK Query
    - Use ShadUI
    - Use TypeScript.
    - Use YUP validation (include required validations and special instructions).
    - Use tailwind css as design
    - Use table for data viewing
    - USE modal for updating and adding data
    - 🚨 **Strict JSON Output Format** (NO explanations, NO markdown, NO extra text):
    **Rules:**
    1️⃣ **DO NOT** include explanations or formatting outside JSON.
    2️⃣ **DO NOT** wrap JSON in markdown (\`\`\`json ... \`\`\`).
    3️⃣ **ENSURE** valid Java syntax for each section.
    Output JSON:
    {
      "${entity} component page": "<React components code>",
      "${entity} slice": "<React slice code>",
      "api": "<React RTK Query API>",
      "types": "<React types code>"
    }
  `,
  'next js': (entity, fields) => `
    Generate a Next.js CRUD application using API routes and React components.
    - **Entity Name**: ${entity}
    - **Fields**: ${fields}
    - Use the Next.js App Router and React Server Actions.
    - Use React hooks and Tailwind components.
    - Use Redux Toolkit
    - Use RTK Query
    - Use TypeScript.
    - Use YUP validation (include required validations and special instructions).
    - Use tailwind css as design
    - 🚨 **Strict JSON Output Format** (NO explanations, NO markdown, NO extra text):
    **Rules:**
    1️⃣ **DO NOT** include explanations or formatting outside JSON.
    2️⃣ **DO NOT** wrap JSON in markdown (\`\`\`json ... \`\`\`).
    3️⃣ **ENSURE** valid Java syntax for each section.
    Output JSON:
    {
      "Component": "<Next.js component code>",
      "API": "<Next.js API route code>"
    }
  `,
  'node js': (entity, fields, database) => `
    Generate a Node.js CRUD application using Express and Mongoose.
    - **Entity Name**: ${entity}
    - **Fields**: ${fields}
    - **Database**: ${database}
    - Include required fields and any special instructions.
    - 🚨 **Strict JSON Output Format** (NO explanations, NO markdown, NO extra text):
    **Rules:**
    1️⃣ **DO NOT** include explanations or formatting outside JSON.
    2️⃣ **DO NOT** wrap JSON in markdown (\`\`\`json ... \`\`\`).
    3️⃣ **ENSURE** valid Java syntax for each section.
    Output JSON:
    {
      "Model": "<Mongoose model code>",
      "Routes": "<Express route code>",
      "Controller": "<Controller logic>"
    }
  `,
};

export async function POST(req: Request) {
  try {
    const body: GenerateCrudRequest = await req.json();
    const { entity, fields, database, language } = body;

    if (!Object.keys(languagePrompts).includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    const fieldDefinitions = fields
      .map((f) => {
        const validation = f.instructions ? ` - Instructions: ${f.instructions.replace(/\n/g, ' ')}` : '';
        return `${f.name} (${f.type})${f.isRequired ? ' [Required]' : ''}${validation}`;
      })
      .join(', ');

    const prompt = languagePrompts[language](entity, fieldDefinitions, database);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: `You are an expert ${language} developer. Respond with pure JSON output only.` },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const codeSnippet = response.choices[0]?.message?.content || '{}';
    return NextResponse.json(JSON.parse(codeSnippet), { status: 200 });
  } catch (error) {
    console.error('Error generating CRUD code:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}