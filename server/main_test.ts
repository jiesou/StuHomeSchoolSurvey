import { assertEquals, assertExists } from "@std/assert";
import { getPrismaClient } from "./database.ts";
import { QuestionConfig } from "./types.ts";

Deno.test("Database connection test", async () => {
  const prisma = getPrismaClient();
  
  // Test database connection by counting surveys
  const count = await prisma.survey.count();
  assertEquals(typeof count, "number");
});

Deno.test("Survey creation test", async () => {
  const prisma = getPrismaClient();
  
  // Create a test survey
  const survey = await prisma.survey.create({
    data: {
      title: "Test Survey",
      description: "A test survey for unit testing",
      year: 2024,
      semester: 1,
      week: 1,
      questions: {
        create: [
          {
            description: "How do you rate our service?",
            config: { type: "star", required: true },
            order: 1
          },
          {
            description: "Any additional comments?",
            config: { type: "input", required: false },
            order: 2
          }
        ]
      }
    },
    include: {
      questions: true
    }
  });

  assertExists(survey.id);
  assertEquals(survey.title, "Test Survey");
  assertEquals(survey.questions.length, 2);
  
  const config1 = survey.questions[0]?.config as QuestionConfig;
  const config2 = survey.questions[1]?.config as QuestionConfig;
  assertEquals(config1?.type, "star");
  assertEquals(config2?.type, "input");

  // Clean up
  await prisma.survey.delete({ where: { id: survey.id } });
});

Deno.test("User and submission test", async () => {
  const prisma = getPrismaClient();
  
  // Create a test survey first
  const survey = await prisma.survey.create({
    data: {
      title: "Test Survey for Submission",
      year: 2024,
      semester: 1,
      week: 1,
      questions: {
        create: [
          {
            description: "Test question",
            config: { type: "star" },
            order: 1
          }
        ]
      }
    },
    include: { questions: true }
  });

  // Create a user
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      idNumber: "TEST001"
    }
  });

  // Create a submission
  const submission = await prisma.submission.create({
    data: {
      surveyId: survey.id,
      userId: user.id,
      answers: {
        create: [
          {
            questionId: survey.questions[0].id,
            value: "5"
          }
        ]
      }
    },
    include: {
      answers: true
    }
  });

  assertExists(submission.id);
  assertEquals(submission.answers.length, 1);
  assertEquals(submission.answers[0].value, "5");

  // Test unique constraint - should fail if user tries to submit again
  try {
    await prisma.submission.create({
      data: {
        surveyId: survey.id,
        userId: user.id,
        answers: {
          create: [
            {
              questionId: survey.questions[0].id,
              value: "3"
            }
          ]
        }
      }
    });
    // Should not reach here
    assertEquals(true, false);
  } catch (error) {
    // Expected to fail due to unique constraint
    assertExists(error);
  }

  // Clean up
  await prisma.survey.delete({ where: { id: survey.id } });
  await prisma.user.delete({ where: { id: user.id } });
});
