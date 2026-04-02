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

        const temperature = Number(options.temperature ?? config.temperature ?? 0.7);
        const maxTokens = Number(options.maxTokens ?? config.maxTokens ?? 4000);
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

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), options.timeout || 180000);

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
                const errorMessage = data?.error?.message || data?.message || `接口请求失败（${response.status}）`;
                throw new Error(errorMessage);
            }

            const content = data?.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error("接口已返回，但没有拿到有效内容。");
            }

            return content;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("接口请求超时，请稍后重试或调低生成范围。");
            }
            throw error;
        } finally {
            window.clearTimeout(timeout);
        }
    }

    buildUrl(config) {
        const apiBase = String(config.apiBase || "").replace(/\/$/, "");
        if (!apiBase) {
            throw new Error("请先填写 API Base URL。");
        }
        return `${apiBase}/chat/completions`;
    }
}
