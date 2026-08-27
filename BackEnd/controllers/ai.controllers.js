import * as ai from "../services/ai.services.js";

export const getResult = async (req, res) => {
  try {
    const { prompt } = req.query;
    let result = await ai.generateResult(prompt);
    res.send(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const chatWithAi = async (req, res) => {
  try {
    const { prompt, currentFile, fileContent, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    let enrichedPrompt = prompt;
    if (currentFile && fileContent) {
      enrichedPrompt = `Current Active File: ${currentFile}\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser Request: ${prompt}`;
    }

    const result = await ai.generateResult(enrichedPrompt);
    let parsedResult = { text: result };

    try {
      let clean = result;
      const match = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) clean = match[1];
      parsedResult = JSON.parse(clean);
    } catch (e) {
      // Keep fallback as raw text in parsedResult.text
      parsedResult = { text: result };
    }

    return res.status(200).json({
      success: true,
      data: parsedResult,
      raw: result,
    });
  } catch (error) {
    console.error("chatWithAi error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};