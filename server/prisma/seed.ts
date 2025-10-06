// 数据库种子数据
import { prisma } from "../db.ts";
import { hashPassword } from "../auth.ts";
import { UserRole, QuestionType } from "../types.ts";

async function main() {
  console.log("开始播种数据库...");

  // 创建管理员账号
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.upsert({
    where: { id_number: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      id_number: "ADMIN",
      password: adminPassword,
      role: UserRole.ADMIN
    }
  });
  console.log("✓ 创建管理员账号:", admin);

  // 创建示例学生账号
  const student1 = await prisma.user.upsert({
    where: { id_number: "2023001" },
    update: {},
    create: {
      name: "张三",
      id_number: "2023001",
      role: UserRole.STUDENT
    }
  });
  console.log("✓ 创建示例学生1:", student1);

  const student2 = await prisma.user.upsert({
    where: { id_number: "2023002" },
    update: {},
    create: {
      name: "李四",
      id_number: "2023002",
      role: UserRole.STUDENT
    }
  });
  console.log("✓ 创建示例学生2:", student2);

  // 创建更多示例学生
  const students = [];
  for (let i = 1; i <= 10; i++) {
    const student = await prisma.user.upsert({
      where: { id_number: `202300${i}` },
      update: {},
      create: {
        name: `学生${i}`,
        id_number: `202300${i}`,
        role: UserRole.STUDENT
      }
    });
    students.push(student);
  }
  console.log(`✓ 创建 ${students.length} 个示例学生`);

  // 创建多个相似的问卷（第1-4周）
  const surveys = [];
  const questionTemplates = [
    {
      description: "您对学校整体教学质量的满意度如何？",
      config: {
        type: QuestionType.STAR,
        maxStars: 5,
        required: true
      }
    },
    {
      description: "您对学校食堂的满意度如何？",
      config: {
        type: QuestionType.STAR,
        maxStars: 5,
        required: true
      }
    },
    {
      description: "您对学校宿舍环境的满意度如何？",
      config: {
        type: QuestionType.STAR,
        maxStars: 5,
        required: true
      }
    },
    {
      description: "您对学校的建议或意见（可选）",
      config: {
        type: QuestionType.INPUT,
        placeholder: "请输入您的建议...",
        required: false,
        maxLength: 500
      }
    }
  ];

  for (let week = 1; week <= 4; week++) {
    const survey = await prisma.survey.upsert({
      where: { id: week },
      update: {},
      create: {
        title: `家校互联满意度问卷 - 第${week}周`,
        description: "本问卷旨在了解学生和家长对学校各方面的满意度，帮助我们改进服务质量。",
        year: "2025",
        semester: 1,
        week: week,
        created_at: new Date(Date.now() - (4 - week) * 7 * 24 * 60 * 60 * 1000), // 按周递增
        questions: {
          create: questionTemplates
        }
      },
      include: {
        questions: true
      }
    });
    surveys.push(survey);
    console.log(`✓ 创建第${week}周问卷:`, survey.title);
  }

  // 为每个学生在每个问卷中创建答卷
  const inputSuggestions = [
    "学校整体很好，希望能增加课外活动。",
    "教学质量不错，食堂可以改进。",
    "宿舍环境舒适，希望能优化网络。",
    "老师认真负责，建议增加体育设施。",
    "课程安排合理，希望图书馆开放时间更长。",
    "校园环境优美，希望增加自习室。",
    "教学设备先进，希望食堂菜品更丰富。",
    "学习氛围好，建议增加社团活动。",
    "师资力量强，希望改善宿舍热水供应。",
    "课程内容充实，建议优化选课系统。"
  ];

  let submissionCount = 0;
  for (const survey of surveys) {
    if (survey.questions && survey.questions.length >= 4) {
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        // 模拟评分有轻微波动
        const baseScore = 3 + Math.random() * 2; // 3-5分之间
        const variation = () => Math.max(1, Math.min(5, Math.round(baseScore + (Math.random() - 0.5) * 2)));
        
        await prisma.submission.upsert({
          where: {
            survey_id_user_id: {
              survey_id: survey.id,
              user_id: student.id
            }
          },
          update: {},
          create: {
            survey_id: survey.id,
            user_id: student.id,
            answers: {
              create: [
                {
                  question_id: survey.questions[0].id,
                  value: String(variation())
                },
                {
                  question_id: survey.questions[1].id,
                  value: String(variation())
                },
                {
                  question_id: survey.questions[2].id,
                  value: String(variation())
                },
                {
                  question_id: survey.questions[3].id,
                  value: inputSuggestions[i]
                }
              ]
            }
          }
        });
        submissionCount++;
      }
    }
  }
  console.log(`✓ 创建 ${submissionCount} 份答卷`);

  console.log("播种完成！");
  console.log("\n管理员登录信息:");
  console.log("  账号: ADMIN");
  console.log("  密码: admin123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    Deno.exit(1);
  });
