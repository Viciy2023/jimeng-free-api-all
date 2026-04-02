FROM node:lts AS BUILD_IMAGE

WORKDIR /app

# 从 GitHub 拉取最新源码
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
ARG GITHUB_REPO=Viciy2023/jimeng-free-api-all
ARG GITHUB_BRANCH=main
RUN git clone --depth 1 --branch ${GITHUB_BRANCH} https://github.com/${GITHUB_REPO}.git /tmp/src \
    && cp -r /tmp/src/. /app/ \
    && rm -rf /tmp/src

RUN yarn install --registry https://registry.npmmirror.com/ --ignore-engines && yarn run build

FROM node:lts

# 安装 Chromium 依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libwayland-client0 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=BUILD_IMAGE /app/configs /app/configs
COPY --from=BUILD_IMAGE /app/package.json /app/package.json
COPY --from=BUILD_IMAGE /app/dist /app/dist
COPY --from=BUILD_IMAGE /app/public /app/public
COPY --from=BUILD_IMAGE /app/node_modules /app/node_modules

WORKDIR /app

# 安装 Playwright Chromium 浏览器
RUN npx playwright-core install chromium

EXPOSE 7860

ENV SERVER_HOST=0.0.0.0

CMD ["sh", "-c", "export SERVER_PORT=${PORT:-7860} && npm start"]
