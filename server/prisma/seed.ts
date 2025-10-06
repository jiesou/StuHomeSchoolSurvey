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

  // 创建示例问卷
  const survey = await prisma.survey.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "家校互联满意度问卷",
      description: "本问卷旨在了解学生和家长对学校各方面的满意度，帮助我们改进服务质量。",
      year: "2025",
      semester: 1,
      week: 1,
      questions: {
        create: [
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
        ]
      }
    },
    include: {
      questions: true
    }
  });
  console.log("✓ 创建示例问卷:", survey);

  // 为示例学生创建答卷
  if (survey.questions && survey.questions.length >= 4) {
    const submission1 = await prisma.submission.upsert({
      where: {
        survey_id_user_id: {
          survey_id: survey.id,
          user_id: student1.id
        }
      },
      update: {},
      create: {
        survey_id: survey.id,
        user_id: student1.id,
        answers: {
          create: [
            {
              question_id: survey.questions[0].id,
              value: "5"
            },
            {
              question_id: survey.questions[1].id,
              value: "4"
            },
            {
              question_id: survey.questions[2].id,
              value: "4"
            },
            {
              question_id: survey.questions[3].id,
              value: "学校整体很好，希望能增加一些课外活动。"
            }
          ]
        }
      }
    });
    console.log("✓ 创建学生1的答卷:", submission1);

    const submission2 = await prisma.submission.upsert({
      where: {
        survey_id_user_id: {
          survey_id: survey.id,
          user_id: student2.id
        }
      },
      update: {},
      create: {
        survey_id: survey.id,
        user_id: student2.id,
        answers: {
          create: [
            {
              question_id: survey.questions[0].id,
              value: "5"
            },
            {
              question_id: survey.questions[1].id,
              value: "3"
            },
            {
              question_id: survey.questions[2].id,
              value: "5"
            },
            {
              question_id: survey.questions[3].id,
              value: "宿舍很好，食堂希望能多一些菜品选择。"
            }
          ]
        }
      }
    });
    console.log("✓ 创建学生2的答卷:", submission2);
  }

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
