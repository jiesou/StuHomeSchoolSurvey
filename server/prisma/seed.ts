// 数据库种子数据
import { prisma } from "../db.ts";
import { hashPassword } from "../auth.ts";
import { UserRole, QuestionType } from "../types.ts";

// 生成随机密码
function generateRandomPassword(length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function main() {
  console.log("开始播种数据库...");

  // 创建管理员账号
  const adminPasswordPlain = generateRandomPassword();
  const adminPassword = await hashPassword(adminPasswordPlain);
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
  const students = [];
  const studentNames = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十", "郑十一", "冯十二"];
  
  for (let i = 0; i < 10; i++) {
    const student = await prisma.user.upsert({
      where: { id_number: `202300${i + 1}` },
      update: {},
      create: {
        name: studentNames[i],
        id_number: `202300${i + 1}`,
        role: UserRole.STUDENT
      }
    });
    students.push(student);
    console.log(`✓ 创建示例学生${i + 1}:`, student);
  }

  const student1 = students[0];
  const student2 = students[1];

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
  console.log("✓ 创建示例问卷1:", survey);

  // 创建第2周问卷
  const survey2 = await prisma.survey.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: "家校互联满意度问卷",
      description: "本问卷旨在了解学生和家长对学校各方面的满意度，帮助我们改进服务质量。",
      year: "2025",
      semester: 1,
      week: 2,
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
  console.log("✓ 创建示例问卷2:", survey2);

  // 创建第3周问卷
  const survey3 = await prisma.survey.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: "家校互联满意度问卷",
      description: "本问卷旨在了解学生和家长对学校各方面的满意度，帮助我们改进服务质量。",
      year: "2025",
      semester: 1,
      week: 3,
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
  console.log("✓ 创建示例问卷3:", survey3);

  // 为所有学生创建答卷
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

    // 为其他学生创建第1周的答卷
    const starAnswers1 = [5, 4, 5, 3, 4, 5, 4, 3];
    const starAnswers2 = [4, 3, 4, 4, 5, 3, 5, 4];
    const starAnswers3 = [4, 4, 5, 3, 4, 4, 3, 5];
    const textAnswers = [
      "教学质量很好，老师认真负责。",
      "食堂菜品丰富，味道不错。",
      "宿舍环境舒适，管理规范。",
      "希望能增加更多的课外活动。",
      "学校图书馆资源丰富。",
      "体育设施需要进一步完善。",
      "课程安排合理，学习氛围好。",
      "建议增加实践课程。"
    ];

    for (let i = 2; i < students.length; i++) {
      const student = students[i];
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
                value: String(starAnswers1[i - 2])
              },
              {
                question_id: survey.questions[1].id,
                value: String(starAnswers2[i - 2])
              },
              {
                question_id: survey.questions[2].id,
                value: String(starAnswers3[i - 2])
              },
              {
                question_id: survey.questions[3].id,
                value: textAnswers[i - 2]
              }
            ]
          }
        }
      });
      console.log(`✓ 创建学生${i + 1}的第1周答卷`);
    }
  }

  // 为所有学生创建第2周的答卷
  if (survey2.questions && survey2.questions.length >= 4) {
    const starAnswers1 = [5, 5, 4, 4, 3, 5, 4, 4, 5, 3];
    const starAnswers2 = [4, 4, 5, 3, 4, 4, 5, 3, 4, 5];
    const starAnswers3 = [5, 4, 4, 5, 3, 4, 5, 4, 3, 4];
    const textAnswers = [
      "整体感觉比上周更好了。",
      "食堂新增的菜品很好吃。",
      "宿舍卫生有所改善。",
      "课外活动增加了，很好。",
      "图书馆新书很多，很棒。",
      "体育设施有改善。",
      "学习压力适中。",
      "实践课程很有趣。",
      "老师教学方法有创新。",
      "同学关系融洽。"
    ];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      await prisma.submission.upsert({
        where: {
          survey_id_user_id: {
            survey_id: survey2.id,
            user_id: student.id
          }
        },
        update: {},
        create: {
          survey_id: survey2.id,
          user_id: student.id,
          answers: {
            create: [
              {
                question_id: survey2.questions[0].id,
                value: String(starAnswers1[i])
              },
              {
                question_id: survey2.questions[1].id,
                value: String(starAnswers2[i])
              },
              {
                question_id: survey2.questions[2].id,
                value: String(starAnswers3[i])
              },
              {
                question_id: survey2.questions[3].id,
                value: textAnswers[i]
              }
            ]
          }
        }
      });
      console.log(`✓ 创建学生${i + 1}的第2周答卷`);
    }
  }

  // 为所有学生创建第3周的答卷
  if (survey3.questions && survey3.questions.length >= 4) {
    const starAnswers1 = [4, 5, 5, 4, 4, 5, 3, 4, 5, 4];
    const starAnswers2 = [5, 4, 4, 5, 3, 4, 5, 4, 3, 4];
    const starAnswers3 = [4, 4, 5, 4, 5, 3, 4, 5, 4, 5];
    const textAnswers = [
      "继续保持这个水平。",
      "食堂服务态度很好。",
      "宿舍管理越来越好。",
      "课外活动丰富多彩。",
      "图书馆环境舒适。",
      "体育课程安排合理。",
      "学习氛围浓厚。",
      "实验设备齐全。",
      "老师答疑及时。",
      "校园环境优美。"
    ];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      await prisma.submission.upsert({
        where: {
          survey_id_user_id: {
            survey_id: survey3.id,
            user_id: student.id
          }
        },
        update: {},
        create: {
          survey_id: survey3.id,
          user_id: student.id,
          answers: {
            create: [
              {
                question_id: survey3.questions[0].id,
                value: String(starAnswers1[i])
              },
              {
                question_id: survey3.questions[1].id,
                value: String(starAnswers2[i])
              },
              {
                question_id: survey3.questions[2].id,
                value: String(starAnswers3[i])
              },
              {
                question_id: survey3.questions[3].id,
                value: textAnswers[i]
              }
            ]
          }
        }
      });
      console.log(`✓ 创建学生${i + 1}的第3周答卷`);
    }
  }

  console.log("播种完成！");
  console.log("\n管理员登录信息:");
  console.log("  账号: ADMIN");
  console.log("  密码:", adminPasswordPlain);
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
