class Utils {
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
            .split(/[、,，\n]/)
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
        if (overlay) {
            overlay.classList.add("active");
        }
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    static hideLoading() {
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) {
            overlay.classList.remove("active");
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
                continue;
            }
        }

        return null;
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
