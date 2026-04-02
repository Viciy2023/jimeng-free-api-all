import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const builtinModelMap = {
  image: [
    { manufacturer: "jimeng", model: "jimeng" },
    { manufacturer: "jimeng", model: "jimeng-5.0" },
    { manufacturer: "jimeng", model: "jimeng-4.5" },
    { manufacturer: "jimeng", model: "jimeng-4.6" },
    { manufacturer: "jimeng", model: "jimeng-5.0-preview" },
    { manufacturer: "jimeng", model: "jimeng-4.1" },
    { manufacturer: "jimeng", model: "jimeng-4.0" },
    { manufacturer: "jimeng", model: "jimeng-3.1" },
    { manufacturer: "jimeng", model: "jimeng-3.0" },
    { manufacturer: "jimeng", model: "jimeng-2.1" },
    { manufacturer: "jimeng", model: "jimeng-2.0-pro" },
    { manufacturer: "jimeng", model: "jimeng-2.0" },
    { manufacturer: "jimeng", model: "jimeng-1.4" },
    { manufacturer: "jimeng", model: "jimeng-xl-pro" },
  ],
  video: [
    { manufacturer: "jimeng", model: "jimeng-video-3.5-pro" },
    { manufacturer: "jimeng", model: "jimeng-video-3.0" },
    { manufacturer: "jimeng", model: "jimeng-video-3.0-pro" },
    { manufacturer: "jimeng", model: "jimeng-video-2.0" },
    { manufacturer: "jimeng", model: "jimeng-video-2.0-pro" },
    { manufacturer: "jimeng", model: "jimeng-video-seedance-2.0" },
    { manufacturer: "jimeng", model: "jimeng-video-seedance-2.0-fast" },
    { manufacturer: "jimeng", model: "seedance-2.0" },
    { manufacturer: "jimeng", model: "seedance-2.0-pro" },
    { manufacturer: "jimeng", model: "seedance-2.0-fast" },
  ],
  text: [],
} as const;

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    type: z.enum(["text", "image", "video"]),
  }),
  async (req, res) => {
    const { type } = req.body;
    const sqlTableMap = {
      text: "t_textModel",
      image: "t_imageModel",
      video: "t_videoModel",
    };
    const modelLists = await u
      .db(sqlTableMap[type as "image" | "text" | "video"])
      .whereNot("manufacturer", "other")
      .select("id", "manufacturer", "model");
    const allModels = [...modelLists, ...builtinModelMap[type as "image" | "text" | "video"]];

    const result: Record<string, any[]> = {};
    const modelCache: Record<string, Set<string>> = {};

    for (const row of allModels) {
      if (!result[row.manufacturer]) {
        result[row.manufacturer] = [];
        modelCache[row.manufacturer] = new Set();
      }
      if (!modelCache[row.manufacturer].has(row.model)) {
        result[row.manufacturer].push({ label: row.model, value: row.model });
        modelCache[row.manufacturer].add(row.model);
      }
    }

    res.status(200).send(success(result));
  },
);

