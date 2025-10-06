// 认证相关工具函数
import { SignJWT, jwtVerify } from "jose";
import { crypto } from "@std/crypto";

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "";
const PASSWORD_SALT = Deno.env.get("PASSWORD_SALT") || "";

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.warn("警告：JWT_SECRET 未设置或长度不足32字符，请在环境变量中设置");
}

if (!PASSWORD_SALT) {
  console.warn("警告：PASSWORD_SALT 未设置，请在环境变量中设置");
}

// 生成密码哈希
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + PASSWORD_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// 验证密码
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// 生成 JWT token
export async function generateToken(userId: number, role: number): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7天有效期
    .sign(secret);
  
  return token;
}

// 验证 JWT token
export async function verifyToken(token: string): Promise<{ userId: number; role: number } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    if (typeof payload.userId === "number" && typeof payload.role === "number") {
      return { userId: payload.userId, role: payload.role };
    }
    
    return null;
  } catch (_error) {
    return null;
  }
}
