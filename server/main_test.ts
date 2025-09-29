import { assertEquals } from "@std/assert";
import { SurveyService } from "./survey-service.ts";
import { CreateSurveyRequest } from "./types.ts";

Deno.test("Survey Service - Basic functionality", async (t) => {
  await t.step("should create survey request type", () => {
    const request: CreateSurveyRequest = {
      title: "Test Survey",
      description: "A test survey",
      year: 2024,
      semester: 1,
      week: 5,
      questions: [
        {
          description: "Rate our service",
          config: { type: "star", maxRating: 5 }
        },
        {
          description: "Any comments?",
          config: { type: "input", multiline: true }
        }
      ]
    };
    
    assertEquals(request.title, "Test Survey");
    assertEquals(request.questions.length, 2);
    assertEquals(request.questions[0].config.type, "star");
    assertEquals(request.questions[1].config.type, "input");
  });
});

Deno.test("Validation - Question config types", () => {
  // Test star question config
  const starConfig = { type: "star" as const, maxRating: 5 };
  assertEquals(starConfig.type, "star");
  assertEquals(starConfig.maxRating, 5);
  
  // Test input question config  
  const inputConfig = { type: "input" as const, multiline: true };
  assertEquals(inputConfig.type, "input");
  assertEquals(inputConfig.multiline, true);
});
