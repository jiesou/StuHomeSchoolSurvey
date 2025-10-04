// Insights 服务 - 处理问卷数据统计分析
import { cut } from "npm:jieba-wasm";
import { QuestionType, type Answer, type QuestionConfig, type QuestionInsight, type WordCloudInsight, type StarDistributionInsight } from "../types.ts";

// 生成词云数据 - INPUT类型题目
export function generateWordCloud(answers: Answer[]): WordCloudInsight['words'] {
  const wordFreq = new Map<string, number>();
  
  // 分词并统计词频
  for (const answer of answers) {
    const text = String(answer.value).trim();
    if (!text) continue;
    
    const words = cut(text, true); // 精确模式分词
    for (const word of words) {
      const trimmedWord = word.trim();
      if (trimmedWord.length > 0) {
        wordFreq.set(trimmedWord, (wordFreq.get(trimmedWord) || 0) + 1);
      }
    }
  }
  
  // 转换为数组并排序
  const wordsArray = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100); // 限制最多100个词
  
  return wordsArray;
}

// 生成星级分布数据 - STAR类型题目
export function generateStarDistribution(answers: Answer[], maxStars = 5): Omit<StarDistributionInsight, 'type' | 'questionId' | 'questionType'> {
  const distribution: { [star: number]: number } = {};
  
  // 初始化分布
  for (let i = 0; i <= maxStars; i++) {
    distribution[i] = 0;
  }
  
  let totalStars = 0;
  let validCount = 0;
  
  // 统计每个星级的数量
  for (const answer of answers) {
    const value = parseInt(String(answer.value), 10);
    if (!isNaN(value) && value >= 0 && value <= maxStars) {
      distribution[value] = (distribution[value] || 0) + 1;
      totalStars += value;
      validCount++;
    }
  }
  
  const average = validCount > 0 ? totalStars / validCount : 0;
  
  return {
    distribution,
    totalResponses: validCount,
    average: Math.round(average * 100) / 100, // 保留两位小数
  };
}

// 生成问题的统计数据
export function generateQuestionInsight(
  questionId: number,
  config: QuestionConfig,
  answers: Answer[]
): QuestionInsight {
  if (config.type === QuestionType.INPUT) {
    const words = generateWordCloud(answers);
    return {
      type: 'wordcloud',
      questionId,
      questionType: QuestionType.INPUT,
      words,
      totalResponses: answers.length,
    };
  } else if (config.type === QuestionType.STAR) {
    const starData = generateStarDistribution(answers, config.maxStars || 5);
    return {
      type: 'star_distribution',
      questionId,
      questionType: QuestionType.STAR,
      ...starData,
    };
  }
  
  throw new Error(`Unsupported question type: ${config.type}`);
}
