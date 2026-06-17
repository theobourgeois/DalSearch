import { GoogleGenerativeAI } from "@google/generative-ai";
import { terms } from "@/lib/course-utils";
import { retrieveCourses } from "@/lib/rag";

const SYSTEM_PROMPT = `You are DalBot, a friendly course advisor AI for Dalhousie University students. You help students discover and choose the right courses using real-time data from DalSearch.

You can:
- Search for courses by topic, subject, level, or term
- Show professor ratings (from RateMyProfessors) including overall rating, difficulty, and % who would take again
- Explain prerequisites and course details
- Recommend courses based on interests, year level, or schedule preferences

Available terms: ${Object.entries(terms).map(([code, name]) => `${name} (code: ${code})`).join(", ")}.

Guidelines:
- Be concise and friendly
- Always include course code, title, credit hours, and prof ratings when listing courses
- Mention prerequisites if they exist
- If a student seems overwhelmed, suggest starting with 1000 or 2000 level courses
- Format course lists cleanly
- Base your answers only on the course context provided — do not invent course details`;

export async function POST(request: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return Response.json(
            { response: "AI advisor is not configured. Please add a GEMINI_API_KEY to the environment." },
            { status: 500 }
        );
    }

    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1].content;

    // Retrieve semantically relevant courses for this query
    const courseContext = await retrieveCourses(lastMessage);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction:
            SYSTEM_PROMPT +
            "\n\n## Relevant courses for this query:\n\n" +
            courseContext,
    });

    const allButLast = messages.slice(0, -1);
    const firstUserIdx = allButLast.findIndex((m: { role: string }) => m.role === "user");
    const history = (firstUserIdx === -1 ? [] : allButLast.slice(firstUserIdx)).map(
        (msg: { role: string; content: string }) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        })
    );

    const chat = model.startChat({ history });

    try {
        const response = await chat.sendMessage(lastMessage);
        return Response.json({ response: response.response.text() });
    } catch (error) {
        console.error("Chat error:", error);
        return Response.json(
            { response: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
