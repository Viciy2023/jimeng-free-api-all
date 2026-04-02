import "../type";
import axios from "axios";
import u from "@/utils";

const sizeMap: Record<string, "1k" | "2k" | "4k"> = {
  "1K": "1k",
  "2K": "2k",
  "4K": "4k",
};

function normalizeBaseUrl(baseURL?: string) {
  if (!baseURL) throw new Error("缺少baseUrl");
  return baseURL.replace(/\/+$/, "");
}

async function uploadImagesToUrls(imageBase64: string[], projectId: number) {
  return Promise.all(
    imageBase64.map(async (image, index) => {
      if (/^https?:\/\//i.test(image)) return image;

      const base64Data = image.replace(/^data:image\/[^;]+;base64,/, "");
      const ext = image.match(/^data:image\/(\w+)/)?.[1] || "png";
      const imagePath = `/${projectId || 0}/jimeng/image-${Date.now()}-${index}.${ext}`;
      await u.oss.writeFile(imagePath, Buffer.from(base64Data, "base64"));
      return u.oss.getFileUrl(imagePath);
    }),
  );
}

async function urlToBase64(url: string): Promise<string> {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const base64 = Buffer.from(res.data).toString("base64");
  const mimeType = res.headers["content-type"] || "image/png";
  return `data:${mimeType};base64,${base64}`;
}

export default async (input: ImageConfig, config: AIConfig): Promise<string> => {
  if (!config.model) throw new Error("缺少Model名称");
  if (!config.apiKey) throw new Error("缺少API Key");

  const requestUrl = `${normalizeBaseUrl(config.baseURL)}/images/generations`;
  const resolution = sizeMap[input.size] ?? "1k";
  const authorization = `Bearer ${config.apiKey.replace(/^Bearer\s*/i, "").trim()}`;
  const imageUrls = input.imageBase64?.length ? await uploadImagesToUrls(input.imageBase64, input.projectId) : [];

  const fullPrompt = input.systemPrompt ? `${input.systemPrompt}\n\n${input.prompt}` : input.prompt;

  const body: Record<string, any> = {
    model: config.model,
    prompt: fullPrompt,
    ratio: input.aspectRatio || "16:9",
    resolution,
    response_format: "url",
  };

  if (imageUrls.length) {
    body.images = imageUrls;
    body.sample_strength = 0.5;
  }

  let response;
  try {
    response = await axios.post(requestUrl, body, {
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    });
  } catch (axiosError: any) {
    const status = axiosError.response?.status;
    const responseData = axiosError.response?.data;
    console.error("[jimeng] API 请求失败:", {
      url: requestUrl,
      status,
      responseData,
      body,
      model: config.model,
    });
    throw new Error(`[请求jimeng失败]: ${responseData?.error || responseData?.message || axiosError.message}`);
  }

  const { data } = response;

  const imageUrl = data?.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error(data?.message || data?.error || "Jimeng 图片生成失败");
  }

  return input.resType === "url" ? imageUrl : await urlToBase64(imageUrl);
};
