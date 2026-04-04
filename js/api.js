class AIAPIClient {
    constructor() {
        this.config = settingsStorage.load();
    }

    getConfig() {
        return { ...this.config };
    }

    updateConfig(nextConfig) {
        this.config = {
            ...DEFAULT_API_CONFIG,
            ...this.config,
            ...(nextConfig || {})
        };
        settingsStorage.save(this.config);
    }

    async callLLM(userPrompt, systemPrompt, options = {}) {
        const config = { ...this.config };
        if (!config.apiKey) {
            throw new Error("请先在 API 设置里填写 API Key。");
        }

        const temperature = Number(options.temperature ?? config.temperature ?? DEFAULT_API_CONFIG.temperature);
        const maxTokens = Number(options.maxTokens ?? config.maxTokens ?? DEFAULT_API_CONFIG.maxTokens);
        const timeoutMs = Number(options.timeout ?? config.timeoutMs ?? DEFAULT_API_CONFIG.timeoutMs);
        const retryCount = Math.max(1, Number(options.retryCount ?? config.retryCount ?? DEFAULT_API_CONFIG.retryCount));
        const model = options.model || config.model;
        const url = this.buildUrl(config);

        const payload = {
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature,
            max_tokens: maxTokens,
            stream: false
        };

        let lastError = null;

        for (let attempt = 1; attempt <= retryCount; attempt += 1) {
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${config.apiKey}`
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                const rawText = await response.text();
                const data = this.safeParseJSON(rawText) || {};
                if (!response.ok) {
                    const error = new Error(
                        data?.error?.message || data?.message || `接口请求失败：${response.status}`
                    );
                    error.status = response.status;
                    throw error;
                }

                const content = this.extractContent(data, rawText);
                if (!content) {
                    const responseKeys = data && typeof data === "object"
                        ? Object.keys(data).slice(0, 12).join(", ")
                        : "无";
                    const choiceKeys = data?.choices?.[0] && typeof data.choices[0] === "object"
                        ? Object.keys(data.choices[0]).slice(0, 12).join(", ")
                        : "无";
                    const rawPreview = String(rawText || "").replace(/\s+/g, " ").slice(0, 240);
                    if (typeof Utils !== "undefined" && typeof Utils.log === "function") {
                        Utils.log(
                            `接口返回为空内容：顶层键=${responseKeys || "无"}；choices[0]键=${choiceKeys || "无"}；原始片段=${rawPreview || "空响应"}。`,
                            "error"
                        );
                    }
                    throw new Error("接口已返回，但没有拿到有效内容。可能是返回结构不兼容。");
                }

                if (typeof Utils !== "undefined" && typeof Utils.log === "function") {
                    Utils.log(
                        `接口内容提取成功：内容长度 ${String(content).length} 字。`,
                        "info"
                    );
                }

                return content;
            } catch (error) {
                lastError = this.normalizeError(error);
                const canRetry = attempt < retryCount && this.shouldRetry(error);

                if (!canRetry) {
                    throw lastError;
                }

                if (typeof Utils !== "undefined" && typeof Utils.log === "function") {
                    Utils.log(
                        `AI 请求失败，正在重试第 ${attempt + 1}/${retryCount} 次：${lastError.message}`,
                        "error"
                    );
                }
                await this.delay(this.getRetryDelay(attempt));
            } finally {
                window.clearTimeout(timer);
            }
        }

        throw lastError || new Error("AI 请求失败。");
    }

    async fetchFanqieTrendSnapshot(params = {}) {
        const config = { ...this.config };
        const endpoint = String(config.rankApiUrl || "").trim();
        if (!endpoint) {
            return null;
        }

        const url = new URL(endpoint);
        Object.entries(params || {}).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "") {
                return;
            }
            url.searchParams.set(key, String(value));
        });

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                Accept: "application/json"
            }
        });

        const rawText = await response.text();
        const data = this.safeParseJSON(rawText) || {};
        if (!response.ok) {
            throw new Error(data?.error || data?.message || `榜单接口请求失败：${response.status}`);
        }

        return data;
    }

    buildUrl(config) {
        const apiBase = String(config.apiBase || "").replace(/\/$/, "");
        if (!apiBase) {
            throw new Error("请先填写 API Base URL。");
        }
        return `${apiBase}/chat/completions`;
    }

    extractContent(data, rawText = "") {
        const primary = this.normalizeContentValue(data?.choices?.[0]?.message?.content);
        if (primary) {
            return primary;
        }

        const alternateCandidates = [
            data?.choices?.[0]?.text,
            data?.choices?.[0]?.message?.text,
            data?.choices?.[0]?.delta?.content,
            data?.output_text,
            data?.response?.output_text,
            data?.data?.content,
            data?.content
        ];

        for (const value of alternateCandidates) {
            const normalized = this.normalizeContentValue(value);
            if (normalized) {
                return normalized;
            }
        }

        const outputArray = data?.output;
        if (Array.isArray(outputArray)) {
            const merged = outputArray
                .map((entry) => this.normalizeContentValue(entry?.content || entry?.text || entry))
                .filter(Boolean)
                .join("");
            if (merged.trim()) {
                return merged.trim();
            }
        }

        const rawCandidate = this.extractContentFromRawText(rawText);
        if (rawCandidate) {
            return rawCandidate;
        }

        return "";
    }

    normalizeContentValue(value) {
        if (typeof value === "string") {
            return value.trim();
        }

        if (Array.isArray(value)) {
            const merged = value
                .map((item) => {
                    if (typeof item === "string") {
                        return item;
                    }
                    if (item && typeof item === "object") {
                        return item.text || item.content || item.value || "";
                    }
                    return "";
                })
                .filter(Boolean)
                .join("");
            return merged.trim();
        }

        if (value && typeof value === "object") {
            const objectText = value.text || value.content || value.value || "";
            return typeof objectText === "string" ? objectText.trim() : "";
        }

        return "";
    }

    extractContentFromRawText(rawText) {
        const raw = String(rawText || "").trim();
        if (!raw) {
            return "";
        }

        const maybeJson = this.safeParseJSON(raw);
        if (maybeJson && maybeJson !== rawText) {
            const extracted = this.extractContent(maybeJson, "");
            if (extracted) {
                return extracted;
            }
        }

        if (/^(data:\s*)+/m.test(raw)) {
            const lines = raw
                .split(/\r?\n/)
                .map((line) => line.replace(/^data:\s*/, "").trim())
                .filter((line) => line && line !== "[DONE]");
            const merged = lines
                .map((line) => {
                    const parsed = this.safeParseJSON(line);
                    if (parsed) {
                        return this.extractContent(parsed, "");
                    }
                    return line;
                })
                .filter(Boolean)
                .join("");
            if (merged.trim()) {
                return merged.trim();
            }
        }

        if (!raw.startsWith("<") && raw.length >= 12) {
            return raw;
        }

        return "";
    }

    safeParseJSON(text) {
        const raw = String(text || "").trim();
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch (_error) {
            return null;
        }
    }

    normalizeError(error) {
        if (error?.name === "AbortError") {
            return new Error("接口请求超时。系统已自动重试；如果仍失败，可以继续调高超时时间。");
        }
        return error instanceof Error ? error : new Error(String(error || "AI 请求失败。"));
    }

    shouldRetry(error) {
        if (!error) {
            return false;
        }

        if (error.name === "AbortError") {
            return true;
        }

        if (typeof error.status === "number") {
            return error.status === 408 || error.status === 429 || error.status >= 500;
        }

        const message = String(error.message || "").toLowerCase();
        return [
            "timeout",
            "timed out",
            "network",
            "failed to fetch",
            "load failed",
            "temporarily unavailable",
            "overloaded",
            "rate limit"
        ].some((keyword) => message.includes(keyword));
    }

    getRetryDelay(attempt) {
        return Math.min(12000, 1200 * attempt);
    }

    delay(ms) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, ms);
        });
    }
}
