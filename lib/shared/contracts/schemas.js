/**
 * dsh-session-enhance 运行时 schema（宿主 + 客户端共用的契约层）。
 *
 * 每个 schema 暴露 `parse()`，满足 typert 客户端网关 `mode: "strict"` 的契约，
 * 同时避免为校验引入第二份 zod 拷贝。宿主侧用于入参/返回值校验；客户端侧
 * 在构建期被打入 bundle，供 Remote 描述符使用。单一来源，杜绝两端复制漂移。
 */

export const sessionIdSchema = {
	parse(value) {
		if (typeof value !== "string" || value.length === 0) throw new TypeError(`sessionId must be a non-empty string, got ${String(value)}`);
		return value;
	}
};

export const workspaceTargetSchema = {
	parse(value) {
		if (value === null) return null;
		if (typeof value === "string" && value.length > 0) return value;
		throw new TypeError("targetWorkspaceId must be a non-empty string (workspace) or null (ungrouped)");
	}
};

export const archivedSetSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		const ids = value.archivedSessionIds;
		if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
		return value;
	}
};

export const deletedSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true) throw new TypeError("deleted must be true");
		return value;
	}
};

export const archivedBatchTargetSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("target must be an object");
		if (value.scope === "all" || value.scope === "ungrouped") return value;
		if (value.scope === "workspace" && typeof value.workspaceId === "string" && value.workspaceId.length > 0) return value;
		throw new TypeError("target.scope must be all, ungrouped, or workspace with a non-empty workspaceId");
	}
};

export const unarchivedBatchSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (!Array.isArray(value.archivedSessionIds) || value.archivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
		if (!Array.isArray(value.unarchivedSessionIds) || value.unarchivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("unarchivedSessionIds must be a string array");
		return value;
	}
};

export const deletedBatchSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		for (const key of ["requestedSessionIds", "deletedSessionIds", "skippedSessionIds"]) {
			if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
		}
		if (!Array.isArray(value.failures) || value.failures.some((failure) => typeof failure !== "object" || failure === null || typeof failure.sessionId !== "string" || typeof failure.message !== "string")) throw new TypeError("failures must contain sessionId/message objects");
		return value;
	}
};

export const archivedSessionMetadataSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.items)) throw new TypeError("result.items must be an array");
		if (value.items.some((item) => typeof item !== "object" || item === null || typeof item.sessionId !== "string" || typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt))) throw new TypeError("items must contain sessionId/createdAt objects");
		return value;
	}
};

export const moveSessionSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (typeof value.sessionId !== "string" || value.sessionId.length === 0) throw new TypeError("sessionId must be a non-empty string");
		if (typeof value.workspaceId !== "string") throw new TypeError("workspaceId must be a string (empty means ungrouped)");
		if (typeof value.previousWorkspaceId !== "string") throw new TypeError("previousWorkspaceId must be a string (empty means ungrouped)");
		return value;
	}
};

export const deletionVerificationSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (typeof value.sessionId !== "string" || value.sessionId.length === 0) throw new TypeError("sessionId must be a non-empty string");
		if (typeof value.transcriptExists !== "boolean") throw new TypeError("transcriptExists must be a boolean");
		if (!Array.isArray(value.storageTraces) || value.storageTraces.some((file) => typeof file !== "string")) throw new TypeError("storageTraces must be a string array");
		return value;
	}
};

export const syncRecordsSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (!Number.isSafeInteger(value.scanned) || value.scanned < 0) throw new TypeError("scanned must be a non-negative safe integer");
		for (const key of ["archivedRemoved", "workspaceRemoved", "workspaceAdded", "projcacheRemoved"]) {
			if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
		}
		return value;
	}
};

export const settingsSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("settings must be an object");
		if (typeof value.homeDir !== "string" || value.homeDir.length === 0) throw new TypeError("homeDir must be a non-empty string");
		if (typeof value.notifyEnabled !== "boolean") throw new TypeError("notifyEnabled must be a boolean");
		return value;
	}
};

export const settingsUpdateSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("settings must be an object");
		if (value.homeDir !== void 0 && (typeof value.homeDir !== "string" || value.homeDir.trim().length === 0)) throw new TypeError("homeDir must be a non-empty string when provided");
		if (value.notifyEnabled !== void 0 && typeof value.notifyEnabled !== "boolean") throw new TypeError("notifyEnabled must be a boolean when provided");
		return value;
	}
};
