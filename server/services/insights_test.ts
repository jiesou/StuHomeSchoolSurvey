// Insights 服务单元测试
import { assertEquals } from "@std/assert";
import { generateWordCloud, generateStarDistribution, generateQuestionInsight } from "./insights.ts";
import { QuestionType, type Answer, type QuestionConfig } from "../types.ts";

// 测试词云生成
Deno.test("generateWordCloud - 应该正确统计词频", () => {
  const mockAnswers: Answer[] = [
    { id: 1, question_id: 1, submission_id: 1, value: "老师讲课很好" },
    { id: 2, question_id: 1, submission_id: 2, value: "老师教学认真负责" },
    { id: 3, question_id: 1, submission_id: 3, value: "教学质量很好" },
  ];

  const result = generateWordCloud(mockAnswers);
  
  // 验证返回格式
  assertEquals(Array.isArray(result), true);
  assertEquals(result.length > 0, true);
  
  // 验证每个元素是 [word, count] 格式
  for (const [word, count] of result) {
    assertEquals(typeof word, "string");
    assertEquals(typeof count, "number");
    assertEquals(count > 0, true);
  }
  
  // 验证按词频降序排列
  for (let i = 1; i < result.length; i++) {
    assertEquals(result[i][1] <= result[i - 1][1], true);
  }
});

// 测试空答案的词云生成
Deno.test("generateWordCloud - 空答案应返回空数组", () => {
  const mockAnswers: Answer[] = [];
  const result = generateWordCloud(mockAnswers);
  
  assertEquals(result, []);
});

// 测试星级分布生成
Deno.test("generateStarDistribution - 应该正确统计星级分布", () => {
  const mockAnswers: Answer[] = [
    { id: 1, question_id: 1, submission_id: 1, value: "5" },
    { id: 2, question_id: 1, submission_id: 2, value: "4" },
    { id: 3, question_id: 1, submission_id: 3, value: "5" },
    { id: 4, question_id: 1, submission_id: 4, value: "3" },
    { id: 5, question_id: 1, submission_id: 5, value: "5" },
  ];

  const result = generateStarDistribution(mockAnswers, 5);
  
  // 验证分布统计
  assertEquals(result.distribution[0], 0);
  assertEquals(result.distribution[1], 0);
  assertEquals(result.distribution[2], 0);
  assertEquals(result.distribution[3], 1);
  assertEquals(result.distribution[4], 1);
  assertEquals(result.distribution[5], 3);
  
  // 验证总数
  assertEquals(result.totalResponses, 5);
  
  // 验证平均分 (5+4+5+3+5)/5 = 4.4
  assertEquals(result.average, 4.4);
});

// 测试空答案的星级分布
Deno.test("generateStarDistribution - 空答案应返回0平均分", () => {
  const mockAnswers: Answer[] = [];
  const result = generateStarDistribution(mockAnswers, 5);
  
  assertEquals(result.totalResponses, 0);
  assertEquals(result.average, 0);
  assertEquals(result.distribution[0], 0);
  assertEquals(result.distribution[5], 0);
});

// 测试生成INPUT类型问题的统计
Deno.test("generateQuestionInsight - INPUT类型应返回词云数据", () => {
  const mockAnswers: Answer[] = [
    { id: 1, question_id: 1, submission_id: 1, value: "老师讲课很好" },
    { id: 2, question_id: 1, submission_id: 2, value: "教学质量不错" },
  ];
  
  const config: QuestionConfig = {
    type: QuestionType.INPUT,
    placeholder: "请输入评价",
  };

  const result = generateQuestionInsight(1, config, mockAnswers);
  
  assertEquals(result.type, "wordcloud");
  assertEquals(result.questionId, 1);
  assertEquals(result.questionType, QuestionType.INPUT);
  assertEquals(result.totalResponses, 2);
  if (result.type === "wordcloud") {
    assertEquals(Array.isArray(result.words), true);
  }
});

// 测试生成STAR类型问题的统计
Deno.test("generateQuestionInsight - STAR类型应返回星级分布数据", () => {
  const mockAnswers: Answer[] = [
    { id: 1, question_id: 2, submission_id: 1, value: "5" },
    { id: 2, question_id: 2, submission_id: 2, value: "4" },
    { id: 3, question_id: 2, submission_id: 3, value: "5" },
  ];
  
  const config: QuestionConfig = {
    type: QuestionType.STAR,
    maxStars: 5,
  };

  const result = generateQuestionInsight(2, config, mockAnswers);
  
  assertEquals(result.type, "star_distribution");
  assertEquals(result.questionId, 2);
  assertEquals(result.questionType, QuestionType.STAR);
  assertEquals(result.totalResponses, 3);
  if (result.type === "star_distribution") {
    assertEquals(typeof result.average, "number");
    assertEquals(typeof result.distribution, "object");
  }
});
