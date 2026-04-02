import u from "@/utils";

export async function testVideoModelConnection(params: {
  modelName?: string;
  apiKey: string;
  baseURL?: string;
  manufacturer: string;
}) {
  const { modelName, apiKey, baseURL, manufacturer } = params;
  const duration = modelName?.includes("seedance") ? 4 : manufacturer === "gemini" ? 4 : 5;
  const mode = manufacturer === "jimeng" ? "text" : "single";

  const videoPath = await u.ai.video(
    {
      imageBase64: [],
      savePath: "test.mp4",
      prompt: "stickman Dances",
      duration,
      resolution: "720p",
      aspectRatio: "16:9",
      audio: false,
      mode,
      taskClass: "测试视频生成",
      name: "测试视频生成",
      describe: "测试视频生成",
      projectId: 0,
    },
    {
      model: modelName,
      apiKey,
      baseURL,
      manufacturer,
    },
  );

  return /^https?:\/\//i.test(videoPath) ? videoPath : await u.oss.getFileUrl(videoPath);
}
