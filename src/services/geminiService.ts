import { GoogleGenAI, Type } from "@google/genai";

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export interface StructuredContent {
  title: string;
  sections: {
    heading: string;
    content: string;
    items?: string[];
  }[];
  mindMapData: MindMapNode;
}

export async function processContent(text: string, customApiKey?: string): Promise<StructuredContent> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Vui lòng cung cấp API Key để tiếp tục.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Hãy phân tích nội dung sau đây và chuyển đổi nó thành một cấu trúc phân cấp rõ ràng. 
    1. Chia nội dung thành các mục (sections) với tiêu đề và nội dung chi tiết.
    2. Tạo một cấu trúc sơ đồ tư duy (mind map) từ nội dung này.
    
    Nội dung: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                content: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["heading", "content"]
            }
          },
          mindMapData: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING },
              children: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    children: { type: Type.ARRAY, items: { type: Type.OBJECT } } // Recursive structure
                  }
                }
              }
            },
            required: ["id", "label"]
          }
        },
        required: ["title", "sections", "mindMapData"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Không thể xử lý nội dung. Vui lòng thử lại.");
  }
}
