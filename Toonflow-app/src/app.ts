import "./logger";
import "./err";
import "./env";
import express, { Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import logger from "morgan";
import cors from "cors";
import buildRoute from "@/core";
import { error as errorResponse } from "@/lib/responseFormat";
import fs from "fs";
import path from "path";
import u from "@/utils";
import jwt from "jsonwebtoken";
import normalizeError from "@/utils/error";

const app = express();
let server: ReturnType<typeof app.listen> | null = null;

export default async function startServe(randomPort: Boolean = false) {
  if (process.env.NODE_ENV == "dev") await buildRoute();

  expressWs(app);

  app.use(logger("dev"));
  app.use(cors({ origin: "*" }));
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  let rootDir: string;
  if (typeof process.versions?.electron !== "undefined") {
    const { app } = require("electron");
    const userDataDir: string = app.getPath("userData");
    rootDir = path.join(userDataDir, "uploads");
  } else {
    rootDir = path.join(process.cwd(), "uploads");
  }

  // 确保 uploads 目录存在
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true });
  }
  console.log("Upload dir:", rootDir);

  app.use(express.static(rootDir));

  app.use(async (req, res, next) => {
    const setting = await u.db("t_setting").where("id", 1).select("tokenKey").first();
    if (!setting) return res.status(500).send({ message: "Server is not configured" });
    const { tokenKey } = setting;
    // 从 header 或 query 参数获取 token
    const rawToken = req.headers.authorization || (req.query.token as string) || "";
    const token = rawToken.replace("Bearer ", "");
    // 白名单路径
    if (req.path === "/other/login" || req.path === "/video/testVideoModel") return next();

    if (!token) return res.status(401).send({ message: "Token is required" });
    try {
      const decoded = jwt.verify(token, tokenKey as string);
      (req as any).user = decoded;
      next();
    } catch (err) {
        return res.status(401).send({ message: "Invalid token" });
    }
  });

  const router = await import("@/router");
  await router.default(app);

  // 404 处理
  app.use((_, res, next: NextFunction) => {
    return res.status(404).json(errorResponse("Not Found"));
  });

  // 错误处理
  app.use((err: any, _: Request, res: Response, __: NextFunction) => {
    const normalized = normalizeError(err);
    res.locals.message = normalized.message;
    res.locals.error = normalized;
    console.error(normalized);
    res.status(normalized.status || err?.status || 500).json(errorResponse(normalized.message, normalized.responseData ?? null));
  });

  const port = randomPort ? 0 : parseInt(process.env.PORT || "60000");
  return await new Promise((resolve, reject) => {
    server = app.listen(port, async (v) => {
      const address = server?.address();
      const realPort = typeof address === "string" ? address : address?.port;
      console.log(`[server] started at http://localhost:${realPort}`);
      resolve(realPort);
    });
  });
}

// 支持await关闭
export function closeServe(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err?: Error) => {
        if (err) return reject(err);
        console.log("[server] stopped");
        resolve();
      });
    } else {
      resolve();
    }
  });
}

const isElectron = typeof process.versions?.electron !== "undefined";
if (!isElectron) startServe();
