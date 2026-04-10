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
  // Priority: 1. Custom API Key from UI, 2. Environment variable
  const apiKey = (customApiKey && customApiKey.trim() !== '') ? customApiKey : process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error("API Key chưa được cấu hình. Vui lòng vào mục 'Cấu hình API' để nhập Key của bạn.");
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy phân tích nội dung sau đây và chuyển đổi nó thành một cấu trúc sơ đồ tư duy (Mind Map) đa cấp chuyên nghiệp.
      
      Yêu cầu quan trọng:
      1. Nút gốc (Root): Tiêu đề chính của toàn bộ nội dung.
      2. Nhánh cấp 1 (Level 1): Các ý lớn, đề mục chính (ví dụ: H1, H2, hoặc các ý chính).
      3. Nhánh cấp 2 (Level 2): Các ý chi tiết thuộc nhánh cấp 1 (ví dụ: H1.1, H1.2, hoặc các gạch đầu dòng con).
      4. Nhánh cấp 3, 4... (Level 3+): Các ý nhỏ hơn nữa nếu có.
      5. ĐẶC BIỆT: Phải trích xuất đầy đủ các cấp bậc phân cấp. Nếu nội dung có cấu trúc lồng nhau (như H1 -> H1.1 -> H1.1.1), sơ đồ tư duy PHẢI thể hiện đúng sự lồng nhau đó thông qua thuộc tính 'children'. KHÔNG ĐƯỢC để tất cả các ý ở cùng một cấp.
      6. Mỗi nút phải có 'id' (chuỗi ngẫu nhiên) và 'label' (nội dung ngắn gọn, súc tích).
      
      Nội dung cần xử lý: ${text}`,
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
                      children: { 
                        type: Type.ARRAY, 
                        items: { type: Type.OBJECT, description: "Recursive MindMapNode structure" } 
                      }
                    },
                    required: ["id", "label"]
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

    return JSON.parse(result.text || "{}");
  } catch (e: any) {
    console.error("Gemini API Error:", e);
    if (e.message?.includes("API_KEY_INVALID")) {
      throw new Error("API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình API.");
    }
    throw new Error("Không thể xử lý nội dung. Vui lòng thử lại.");
  }
}
