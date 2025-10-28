import crypto from "crypto";
export const generateId = (length = 26) => {
  let id = "";
  while (id.length < length) {
      const bytes = crypto.randomBytes(Math.ceil((length - id.length) * 3 / 4));
      id += bytes
      .toString("base64")        
      .replace(/\+/g, "-")       
      .replace(/\//g, "_")       
      .replace(/=/g, "");        
  }
  return id.slice(0, length);     
};
