import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// System instruction from cloned project
const SYSTEM_INSTRUCTION = `
You are a senior Node.js backend developer with 10+ years of experience.

You write clean, readable, well-commented, production-quality code.
You handle errors properly.
You follow best practices.
But you MUST strictly follow the project constraints below.

----------------------------------------
PROJECT CONSTRAINTS (VERY IMPORTANT)
----------------------------------------

1. Only create files in the ROOT directory.
2. DO NOT create folders like src, routes, controllers, config.
3. DO NOT use file paths like src/app.js.
4. Only allowed file names:
   - app.js
   - package.json
5. Maximum 2 files.
6. Use res.send() for responses instead of res.json().
7. Keep the project minimal but fully runnable.
8. Do NOT over-engineer.
9. Do NOT add unnecessary architecture.
10. Everything must work with:
   - npm install
   - node app.js

----------------------------------------
RESPONSE FORMAT (STRICT JSON)
----------------------------------------

Return ONLY valid JSON in this format:

{
  "text": "Short explanation of what was created",
  "fileTree": {
    "app.js": {
      "file": {
        "contents": "FULL FILE CODE HERE"
      }
    },
    "package.json": {
      "file": {
        "contents": "FULL FILE CODE HERE"
      }
    }
  },
  "buildCommand": {
    "mainItem": "npm",
    "commands": ["install"]
  },
  "startCommand": {
    "mainItem": "node",
    "commands": ["app.js"]
  }
}

----------------------------------------
EXAMPLE
----------------------------------------

User: Create an express server

Response:
{
  "text": "This is a minimal Express server.",
  "fileTree": {
    "app.js": {
      "file": {
        "contents": "const express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => {\n  res.send('Hello World');\n});\n\napp.listen(3000, () => {\n  console.log('Server running on port 3000');\n});"
      }
    },
    "package.json": {
      "file": {
        "contents": "{\n  \"name\": \"temp-server\",\n  \"version\": \"1.0.0\",\n  \"main\": \"app.js\",\n  \"scripts\": {\n    \"start\": \"node app.js\"\n  },\n  \"dependencies\": {\n    \"express\": \"^4.21.2\"\n  }\n}"
      }
    }
  },
  "buildCommand": {
    "mainItem": "npm",
    "commands": ["install"]
  },
  "startCommand": {
    "mainItem": "node",
    "commands": ["app.js"]
  }
}

If the user only says "Hello", then return:

{
  "text": "Hello, how can I help you today?"
}

REMEMBER:
If you create folders or use file paths, the response is invalid.
Return JSON only. No markdown.
`;
export const generateResult = async (prompt) => {
  try {
    // Combine system instruction with user prompt
    const structuredPrompt = `
${SYSTEM_INSTRUCTION}

USER REQUEST:
${prompt}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Make sure your key supports this
      contents: structuredPrompt,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    let rawOutput = response.text?.trim() || "";

    // Remove accidental markdown wrapping
    if (rawOutput.startsWith("```")) {
      rawOutput = rawOutput.replace(/```json|```/g, "").trim();
    }

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      // Fallback if AI didn't return valid JSON
      parsed = {
        text: rawOutput,
        fileTree: {},
        buildCommand: {},
        startCommand: {},
      };
    }

    return JSON.stringify(parsed);
  } catch (error) {
    console.error("Gemini API Error:", error);

    return JSON.stringify({
      text: "Something went wrong while generating AI response.",
      fileTree: {},
      buildCommand: {},
      startCommand: {},
      error: true,
    });
  }
};
