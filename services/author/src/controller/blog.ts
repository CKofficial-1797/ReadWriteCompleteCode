import { AuthenticatedRequest } from "../middleware/isAuth.js";
import TryCatch from "../utils/TryCatch.js";
import getBuffer from "../utils/datauri.js";
import  cloudinary  from "cloudinary";
import { sql } from "../utils/db.js";
import { invalidateChacheJob } from "../utils/rabbitmq.js";
import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";


export const createBlog = TryCatch(async (req:AuthenticatedRequest, res) => {
    const { title, description, blogcontent , category } = req.body;

    const file =req.file;
    if(!file){
        res.status(400).json({
            message: "Please upload a file",
        });
        return;
    }
    const fileBuffer = getBuffer(file);
    if(!fileBuffer|| !fileBuffer.content){
        res.status(400).json({
            message: "Failed to generate buffer",
        });
        return;
    }
    const cloud = await cloudinary.v2.uploader.upload(fileBuffer.content, {
        folder: "blogs",
    });
    const result = await sql `INSERT INTO blogs (title, description,image, blogcontent,  category, author) VALUES (${title}, ${description},  ${cloud.secure_url},${blogcontent}, ${category}, ${req.user?._id}) RETURNING *;`;

    await invalidateChacheJob(["blogs:*"]);
    // Invalidate the cache for all blogs

    res.json({
      message: "Blog Created",
      blog: result[0],  
    })

})
;

export const updateBlog = TryCatch(async(req:AuthenticatedRequest, res) => {
    const {id} = req.params;
    const { title, description, blogcontent , category } = req.body;
    const file =req.file;
    const blog = await sql `SELECT * FROM blogs WHERE id=${id};`;
    if(!blog.length){
        res.status(404).json({
            message: "Blog not found",
        });
        return;
    }
    if(blog[0].author !== req.user?._id){
        res.status(401).json({
            message: "Unauthorized ",
        }); 
        return;
    }

    let imageUrl = blog[0].image;
    if(file){
        const fileBuffer = getBuffer(file);
        if(!fileBuffer|| !fileBuffer.content){
            res.status(400).json({
                message: "Failed to generate buffer",
            });
            return;
        }
        const cloud = await cloudinary.v2.uploader.upload(fileBuffer.content, {
            folder: "blogs",
        });
        imageUrl = cloud.secure_url;
    }
    const updatedBlog = await sql `UPDATE blogs SET title=${title || blog[0].title}, description=${description|| blog[0].description}, 
    image=${imageUrl}, blogcontent=${blogcontent || blog[0].blogcontent}, category=${category || blog[0].category}  WHERE id=${id} RETURNING *;`;

    await invalidateChacheJob(["blogs:*", `blog:${id}`]);
    // Invalidate the cache for all blogs and the specific blog

    res.json({
        message: "Blog Updated",
        blog: updatedBlog[0],
    })
}  
);

export const deleteBlog = TryCatch(async(req:AuthenticatedRequest, res) => {
    const {id} = req.params;
    const blog = await sql `SELECT * FROM blogs WHERE id=${id};`;
    if(!blog.length){
        res.status(404).json({
            message: "Blog not found",
        });
        return;
    }
    if(blog[0].author !== req.user?._id){
        res.status(401).json({
            message: "Unauthorized ",
        }); 
        return;
    }
    await sql `DELETE FROM savedblogs WHERE blogid=${req.params.id};`; // if someone saved the blog after deleting it, it will be deleted from savedblogs
    await sql `DELETE FROM comments WHERE blogid=${req.params.id};`;// if someone commented on the blog after deleting it, it will be deleted from comments
    await sql `DELETE FROM blogs WHERE id=${req.params.id};`;
    
    await invalidateChacheJob(["blogs:*", `blog:${req.params.id}`]);
    // Invalidate the cache for all blogs and the specific blog

    res.json({
        message: "Blog Deleted",
    })
}  
);

export const aiTitleResponse = TryCatch(async (req, res) => {
    const { text } = req.body;
  
    const prompt = `Correct the grammar of the following blog title and return only the corrected title without any additional text, formatting, or symbols: "${text}"`;
  
    let result;
  
    const ai = new GoogleGenAI({
      apiKey: process.env.Gemini_Api_Key,
    });
  
    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
  
      let rawtext = response.text;
  
      if (!rawtext) {
        res.status(400).json({
          message: "Something went wrong",
        });
        return;
      }
  
      result = rawtext
        .replace(/\*\*/g, "")
        .replace(/[\r\n]+/g, "")
        .replace(/[*_`~]/g, "")
        .trim();
    }
  
    await main();
  
    res.json(result);
  });
  
  export const aiDescriptionResponse = TryCatch(async (req, res) => {
    const { title, description } = req.body;
  
    const prompt =
      description === ""
        ? `Generate only one short blog description based on this 
  title: "${title}". Your response must be only one sentence, strictly under 30 words, with no options, no greetings, and 
  no extra text. Do not explain. Do not say 'here is'. Just return the description only.`
        : `Fix the grammar in the 
  following blog description and return only the corrected sentence. Do not add anything else: "${description}"`;
  
    let result;
  
    const ai = new GoogleGenAI({
      apiKey: process.env.Gemini_Api_Key,
    });
  
    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
  
      let rawtext = response.text;
  
      if (!rawtext) {
        res.status(400).json({
          message: "Something went wrong",
        });
        return;
      }
  
      result = rawtext
        .replace(/\*\*/g, "")
        .replace(/[\r\n]+/g, "")
        .replace(/[*_`~]/g, "")
        .trim();
    }
  
    await main();
  
    res.json(result);
  });
  export const aiBlogResponse = TryCatch(async (req, res) => {
    const prompt = `You will act as a grammar correction engine. I will provide you with blog content in rich HTML format (from Jodit Editor). Do not generate or rewrite the content with new ideas. Only correct grammatical, punctuation, and spelling errors while preserving all HTML tags and formatting. Maintain inline styles, image tags, line breaks, and structural tags exactly as they are. Return the full corrected HTML string as output.`;
  
    const { blog } = req.body;
    if (!blog) {
      res.status(400).json({
        message: "Please provide blog",
      });
      return;
    }
  
    const fullMessage = `${prompt}\n\n${blog}`;
  
    const ai = new GoogleGenAI({
      apiKey: process.env.Gemini_Api_Key,
    });
  
    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: fullMessage }],
          },
        ],
      });
  
      const rawtext = response.candidates?.[0]?.content?.parts?.[0]?.text;
  
      if (!rawtext) {
        return null;
      }
      const cleanedHtml = rawtext
      .replace(/^html\s*/i, "")        // Remove "html" at the start
      .replace(/^```html\s*/i, "")     // Remove "```html" if present
      .replace(/^```/, "")             // Remove any starting ```
      .replace(/```$/, "")             // Remove ending ```
      .replace(/\*\*/g, "")            // Remove bold markdown
      .trim();
    
  
      return cleanedHtml;
    }
  
    const cleanedHtml = await main();
  
    if (!cleanedHtml) {
      res.status(500).json({ message: "Something went wrong" });
      return;
    }
  
    res.json({ html: cleanedHtml });

  });
  
  
//   export const aiBlogResponse = TryCatch(async (req, res) => {
//     const prompt = ` You will act as a grammar correction engine. I will provide you with blog content 
//   in rich HTML format (from Jodit Editor). Do not generate or rewrite the content with new ideas. Only correct 
//   grammatical, punctuation, and spelling errors while preserving all HTML tags and formatting. Maintain inline styles, 
//   image tags, line breaks, and structural tags exactly as they are. Return the full corrected HTML string as output. `;
  
//     const { blog } = req.body;
//     if (!blog) {
//       res.status(400).json({
//         message: "Please provide blog",
//       });
//       return;
//     }
  
//     const fullMessage = `${prompt}\n\n${blog}`;
  
//     // const ai = new GoogleGenerativeAI(process.env.Gemini_Api_Key as string);
  
//     // const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });
//     const ai = new GoogleGenAI({
//         apiKey: process.env.Gemini_Api_Key,
//       });
  
//     // const result = await model.generateContent({
//     //   contents: [
//     //     {
//     //       role: "user",
//     //       parts: [
//     //         {
//     //           text: fullMessage,
//     //         },
//     //       ],
//     //     },
//     //   ],
//     // });
    
//     async function main() {
//         const response = await ai.models.generateContent({
//           model: "gemini-2.0-flash",
//           contents: prompt,
//         });
//         let rawtext = response.text;
  
  
//     // const responseText = await result.response.text();
  
//     // const cleanedHtml = responseText
//     //   .replace(/^(html|```html|```)\n?/i, "")
//     //   .replace(/```$/i, "")
//     //   .replace(/\*\*/g, "")
//     //   .replace(/[\r\n]+/g, "")
//     //   .replace(/[*_`~]/g, "")
//     //   .trim();
    
//     if (!rawtext) {
//         res.status(400).json({
//           message: "Something went wrong",
//         });
//         return;
//       }
  
//       const cleanedHtml = rawtext
//         .replace(/\*\*/g, "")
//         .replace(/[\r\n]+/g, "")
//         .replace(/[*_`~]/g, "")
//         .trim();
//     }
  
    
//     await main();
  
//     res.json(cleanedHtml);
  