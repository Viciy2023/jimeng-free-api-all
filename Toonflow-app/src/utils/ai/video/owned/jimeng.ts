import "../type";
import axios from "axios";
import u from "@/utils";

function normalizeBaseUrl(baseURL?: string) {
  if (!baseURL) throw new Error("缺少baseUrl");
  return baseURL.replace(/\/+$/, "");
}

function normalizeResolution(resolution: string): "480p" | "720p" | "1080p" {
  if (resolution === "1080p") return "1080p";
  if (resolution === "480p") return "480p";
  return "720p";
}

async function uploadImagesToUrls(imageBase64: string[], projectId: number) {
  return Promise.all(
    imageBase64.map(async (image, index) => {
      if (/^https?:\/\//i.test(image)) return image;

      const base64Data = image.replace(/^data:image\/[^;]+;base64,/, "");
      const ext = image.match(/^data:image\/(\w+)/)?.[1] || "png";
      const imagePath = `/${projectId || 0}/jimeng/video-source-${Date.now()}-${index}.${ext}`;
      await u.oss.writeFile(imagePath, Buffer.from(base64Data, "base64"));
      return u.oss.getFileUrl(imagePath);
    }),
  );
}

async function submitSyncVideo(requestUrl: string, body: Record<string, any>, authorization: string) {
  const { data } = await axios.post(requestUrl, body, {
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    timeout: 1000 * 60 * 20,
  });

  const videoUrl = data?.data?.[0]?.url;
  if (!videoUrl) {
    throw new Error(data?.message || data?.error || "Jimeng 视频生成失败");
  }

  return videoUrl;
}

async function submitAsyncVideo(baseUrl: string, body: Record<string, any>, authorization: string) {
  const submitUrl = `${baseUrl}/videos/generations/async`;
  const { data } = await axios.post(submitUrl, body, {
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
  });

  const taskId = data?.task_id;
  if (!taskId) {
    throw new Error(data?.message || data?.error || "Jimeng 异步视频任务提交失败");
  }

  const queryUrl = `${baseUrl}/videos/generations/async/${taskId}`;
  const { data: result } = await axios.get(queryUrl, {
    headers: { Authorization: authorization },
    timeout: 1000 * 60 * 20,
  });

  const videoUrl = result?.data?.[0]?.url;
  if (!videoUrl) {
    throw new Error(result?.message || result?.error || "Jimeng 异步视频生成失败");
  }

  return videoUrl;
}

export default async (input: VideoConfig, config: AIConfig): Promise<string> => {
  if (!config.model) throw new Error("缺少Model名称");
  if (!config.apiKey) throw new Error("缺少API Key");

  const baseUrl = normalizeBaseUrl(config.baseURL);
  const requestUrl = `${baseUrl}/videos/generations`;
  const authorization = `Bearer ${config.apiKey.replace(/^Bearer\s*/i, "").trim()}`;
  const filePaths = input.imageBase64?.length ? await uploadImagesToUrls(input.imageBase64, input.projectId) : [];

  const body: Record<string, any> = {
    model: config.model,
    prompt: input.prompt,
    ratio: input.aspectRatio || "16:9",
    resolution: normalizeResolution(input.resolution),
    duration: input.duration,
  };

  if (filePaths.length) {
    if (input.mode === "single") {
      body.file_paths = [filePaths[0]];
    } else if (input.mode === "startEnd") {
      body.file_paths = filePaths.slice(0, 2);
    } else if (input.mode === "multi") {
      body.file_paths = filePaths;
    } else {
      body.file_paths = filePaths;
    }
  }

  try {
    return await submitSyncVideo(requestUrl, body, authorization);
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.response?.data?.error || "";
    if (message.includes("超时") || message.toLowerCase().includes("timeout")) {
      return submitAsyncVideo(baseUrl, body, authorization);
    }
    throw error;
  }
};
