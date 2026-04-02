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

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const error = new Error(
                        data?.error?.message || data?.message || `接口请求失败：${response.status}`
                    );
                    error.status = response.status;
                    throw error;
                }

                const content = data?.choices?.[0]?.message?.content;
                if (!content) {
                    throw new Error("接口已返回，但没有拿到有效内容。");
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

    buildUrl(config) {
        const apiBase = String(config.apiBase || "").replace(/\/$/, "");
        if (!apiBase) {
            throw new Error("请先填写 API Base URL。");
        }
        return `${apiBase}/chat/completions`;
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
