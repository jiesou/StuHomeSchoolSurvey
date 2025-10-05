// 验证相关中间件
import { Context } from "@oak/oak";
import { CreateSurveyRequest } from "../types.ts";

// 验证问卷输入的中间件
export function validateSurveyInput(body: CreateSurveyRequest): string | null {
  // 验证字段长度
  if (body.title.length > 200) {
    return "问卷标题不能超过200个字符";
  }
  if (body.description && body.description.length > 1000) {
    return "问卷描述不能超过1000个字符";
  }
  if (body.year.length > 20) {
    return "学年格式不正确";
  }
  for (const question of body.questions) {
    if (question.description && question.description.length > 500) {
      return "问题描述不能超过500个字符";
    }
    // 确保 input 类型的问题有默认 maxLength
    if (question.config.type === "input" && !question.config.maxLength) {
      question.config.maxLength = 10000;
    }
  }
  return null;
}

// 验证用户输入
export function validateUserInput(user: { name: string; id_number: string }): string | null {
  if (user.name.length > 100) {
    return "姓名长度不能超过100个字符";
  }
  if (user.id_number.length > 50) {
    return "学号长度不能超过50个字符";
  }
  return null;
}
