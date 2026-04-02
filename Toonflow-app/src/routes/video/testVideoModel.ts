import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import u from "@/utils";
import { testVideoModelConnection } from "./testVideoModelShared";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    modelName: z.string().optional(),
    apiKey: z.string(),
    baseURL: z.string().optional(),
    manufacturer: z.string(),
  }),
  async (req, res) => {
    const { modelName, apiKey, baseURL, manufacturer } = req.body;

    try {
      const url = await testVideoModelConnection({ modelName, apiKey, baseURL, manufacturer });
      res.status(200).send(success(url));
    } catch (err) {
      const msg = u.error(err).message;
      console.error(msg);
      res.status(500).send(error(msg));
    }
  },
);
