import { assertEquals, assertExists } from "@std/assert";

// 测试类型定义和工具函数
import { QuestionType, parseAnswerValue } from "./types.ts";

Deno.test("parseAnswerValue - 应该正确解析星级评分", () => {
  const answer = {
    id: 1,
    question_id: 1,
    submission_id: 1,
    value: "5"
  };
  const config = {
    type: QuestionType.STAR,
    maxStars: 5,
    required: true
  };

  const result = parseAnswerValue(answer, config);
  assertEquals(result, 5);
  assertEquals(typeof result, "number");
});

Deno.test("parseAnswerValue - 应该正确解析文本输入", () => {
  const answer = {
    id: 1,
    question_id: 1,
    submission_id: 1,
    value: "这是一段文本"
  };
  const config = {
    type: QuestionType.INPUT,
    required: true
  };

  const result = parseAnswerValue(answer, config);
  assertEquals(result, "这是一段文本");
  assertEquals(typeof result, "string");
});

