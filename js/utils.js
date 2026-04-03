class Utils {
    static loadingState = {
        startedAt: 0,
        progress: 0,
        logs: []
    };

    static uid(prefix = "id") {
        return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    }

    static debounce(fn, wait = 300) {
        let timer = null;
        return (...args) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => fn(...args), wait);
        };
    }

    static escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    static ensureArrayFromText(value) {
        if (!value) {
            return [];
        }

        if (Array.isArray(value)) {
            return value.filter(Boolean);
        }

        return String(value)
            .split(/[\n,，、；;]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    static formatTime(date = new Date()) {
        return new Intl.DateTimeFormat("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).format(date);
    }

    static chapterSort(left, right) {
        return Number(left.number || 0) - Number(right.number || 0);
    }

    static showLoading(message = "AI 正在处理中...") {
        const overlay = document.getElementById("loadingOverlay");
        const loadingText = document.getElementById("loadingText");
        const loadingMeta = document.getElementById("loadingMeta");
        const loadingLog = document.getElementById("loadingLog");
        const progressBar = document.getElementById("loadingProgressBar");

        Utils.loadingState = {
            startedAt: Date.now(),
            progress: 8,
            logs: []
        };

        if (overlay) {
            overlay.classList.add("active");
        }
        if (loadingText) {
            loadingText.textContent = message;
        }
        if (loadingMeta) {
            loadingMeta.textContent = "任务已开始，请稍等...";
        }
        if (loadingLog) {
            loadingLog.textContent = "等待开始...";
        }
        if (progressBar) {
            progressBar.style.width = "8%";
        }
    }

    static hideLoading() {
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) {
            overlay.classList.remove("active");
        }

        Utils.loadingState = {
            startedAt: 0,
            progress: 0,
            logs: []
        };
    }

    static updateLoading(message = "", options = {}) {
        const loadingText = document.getElementById("loadingText");
        const loadingMeta = document.getElementById("loadingMeta");
        const loadingLog = document.getElementById("loadingLog");
        const progressBar = document.getElementById("loadingProgressBar");
        const { progress, detail, appendLog = false } = options;

        if (loadingText && message) {
            loadingText.textContent = message;
        }

        if (typeof progress === "number" && progressBar) {
            const normalized = Math.max(6, Math.min(100, progress));
            Utils.loadingState.progress = normalized;
            progressBar.style.width = `${normalized}%`;
        }

        if (loadingMeta) {
            const elapsedMs = Utils.loadingState.startedAt ? Date.now() - Utils.loadingState.startedAt : 0;
            const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
            loadingMeta.textContent = detail
                ? `${detail} | 已等待 ${elapsedSeconds} 秒`
                : `已等待 ${elapsedSeconds} 秒`;
        }

        if (appendLog && loadingLog && message) {
            Utils.loadingState.logs.unshift(`[${Utils.formatTime()}] ${message}`);
            Utils.loadingState.logs = Utils.loadingState.logs.slice(0, 6);
            loadingLog.textContent = Utils.loadingState.logs.join("\n");
        }
    }

    static ensureToastStack() {
        let stack = document.querySelector(".toast-stack");
        if (!stack) {
            stack = document.createElement("div");
            stack.className = "toast-stack";
            document.body.appendChild(stack);
        }
        return stack;
    }

    static showMessage(message, type = "info") {
        const stack = Utils.ensureToastStack();
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        stack.appendChild(toast);

        window.setTimeout(() => {
            toast.remove();
        }, 2600);
    }

    static log(message, type = "info") {
        const logContent = document.getElementById("logContent");
        if (!logContent) {
            return;
        }

        const entry = document.createElement("div");
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${Utils.formatTime()}] ${message}`;
        logContent.prepend(entry);

        while (logContent.children.length > 120) {
            logContent.removeChild(logContent.lastElementChild);
        }

        const overlay = document.getElementById("loadingOverlay");
        if (overlay?.classList.contains("active")) {
            Utils.updateLoading(message, {
                appendLog: true,
                detail: type === "error" ? "处理中遇到问题，正在继续重试" : "任务仍在进行中"
            });
        }
    }

    static async copyText(text) {
        try {
            await navigator.clipboard.writeText(text || "");
            Utils.showMessage("已复制到剪贴板", "success");
            return true;
        } catch (error) {
            console.error("复制失败：", error);
            Utils.showMessage("复制失败，请手动复制", "error");
            return false;
        }
    }

    static downloadJSON(data, filename = "novel-outline.json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    static downloadText(text, filename = "novel-outline.txt") {
        const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    static readJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    resolve(JSON.parse(reader.result));
                } catch (error) {
                    reject(new Error("JSON 文件格式无效"));
                }
            };
            reader.onerror = () => reject(new Error("读取文件失败"));
            reader.readAsText(file);
        });
    }

    static parseJsonResponse(text) {
        if (!text) {
            return null;
        }

        const cleaned = String(text).trim();

        const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const candidates = [];
        if (fencedMatch?.[1]) {
            candidates.push(fencedMatch[1].trim());
        }

        candidates.push(cleaned);

        const firstArray = cleaned.indexOf("[");
        const lastArray = cleaned.lastIndexOf("]");
        if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
            candidates.push(cleaned.slice(firstArray, lastArray + 1));
        }

        const firstObject = cleaned.indexOf("{");
        const lastObject = cleaned.lastIndexOf("}");
        if (firstObject !== -1 && lastObject !== -1 && lastObject > firstObject) {
            candidates.push(cleaned.slice(firstObject, lastObject + 1));
        }

        for (const candidate of candidates) {
            try {
                return JSON.parse(candidate);
            } catch (error) {
                const normalized = this.normalizeJsonCandidate(candidate);
                if (normalized && normalized !== candidate) {
                    try {
                        return JSON.parse(normalized);
                    } catch (nestedError) {
                        continue;
                    }
                }
            }
        }

        return null;
    }

    static coerceJSONArray(value) {
        if (Array.isArray(value)) {
            return value;
        }

        if (typeof value === "string") {
            const parsed = this.parseJsonResponse(value);
            return Array.isArray(parsed) ? parsed : this.coerceJSONArray(parsed);
        }

        if (!value || typeof value !== "object") {
            return null;
        }

        const preferredKeys = [
            "items",
            "data",
            "list",
            "results",
            "chapters",
            "volumes",
            "characters",
            "output",
            "content",
            "response"
        ];

        for (const key of preferredKeys) {
            if (Array.isArray(value[key])) {
                return value[key];
            }
            if (typeof value[key] === "string") {
                const nested = this.coerceJSONArray(value[key]);
                if (Array.isArray(nested)) {
                    return nested;
                }
            }
        }

        const values = Object.values(value);
        const firstArray = values.find((item) => Array.isArray(item));
        if (firstArray) {
            return firstArray;
        }

        return null;
    }

    static normalizeJsonCandidate(text) {
        const raw = String(text || "").trim();
        if (!raw) {
            return "";
        }

        let normalized = raw
            .replace(/[“”]/g, "\"")
            .replace(/[‘’]/g, "'")
            .replace(/^\uFEFF/, "")
            .replace(/,\s*([}\]])/g, "$1");

        normalized = this.extractBalancedJson(normalized, "[", "]") || normalized;

        if (!normalized.startsWith("[")) {
            const objectArray = this.extractObjectArrayCandidate(normalized);
            if (objectArray) {
                normalized = objectArray;
            }
        }

        return normalized.trim();
    }

    static extractBalancedJson(text, openChar = "[", closeChar = "]") {
        const source = String(text || "");
        const start = source.indexOf(openChar);
        if (start < 0) {
            return "";
        }

        let depth = 0;
        let inString = false;
        let quoteChar = "";
        let escaped = false;

        for (let index = start; index < source.length; index += 1) {
            const char = source[index];

            if (inString) {
                if (escaped) {
                    escaped = false;
                    continue;
                }
                if (char === "\\") {
                    escaped = true;
                    continue;
                }
                if (char === quoteChar) {
                    inString = false;
                    quoteChar = "";
                }
                continue;
            }

            if (char === "\"" || char === "'") {
                inString = true;
                quoteChar = char;
                continue;
            }

            if (char === openChar) {
                depth += 1;
            } else if (char === closeChar) {
                depth -= 1;
                if (depth === 0) {
                    return source.slice(start, index + 1);
                }
            }
        }

        return "";
    }

    static extractObjectArrayCandidate(text) {
        const source = String(text || "");
        const objects = [];
        let searchIndex = 0;

        while (searchIndex < source.length) {
            const chunk = this.extractBalancedJson(source.slice(searchIndex), "{", "}");
            if (!chunk) {
                break;
            }
            try {
                objects.push(JSON.parse(chunk));
            } catch (error) {
                break;
            }
            const chunkIndex = source.indexOf(chunk, searchIndex);
            if (chunkIndex < 0) {
                break;
            }
            searchIndex = chunkIndex + chunk.length;
        }

        return objects.length >= 2 ? JSON.stringify(objects) : "";
    }

    static newlineJoin(items) {
        return items.filter(Boolean).join("\n");
    }

    static summarizeText(text, max = 120) {
        const plain = String(text || "").replace(/\s+/g, " ").trim();
        if (plain.length <= max) {
            return plain || "暂无内容";
        }
        return `${plain.slice(0, max)}...`;
    }
}
