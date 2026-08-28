/**
* Strict codec shims for the dsh-session-enhance Remote descriptors. The
* client typert gateway requires `mode: "strict"` codecs whose schema
* exposes a `parse()` function; plain functions satisfy the contract
* without shipping a second zod copy into this bundle.
*/
const sessionIdSchema = {
	parse(value) {
		if (typeof value !== "string" || value.length === 0) throw new TypeError(`sessionId must be a non-empty string, got ${String(value)}`);
		return value;
	}
};
const archivedSetSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		const ids = value.archivedSessionIds;
		if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
		return value;
	}
};
const deletedSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true) throw new TypeError("deleted must be true");
		return value;
	}
};
const archivedBatchTargetSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("target must be an object");
		if (value.scope === "all" || value.scope === "ungrouped") return value;
		if (value.scope === "workspace" && typeof value.workspaceId === "string" && value.workspaceId.length > 0) return value;
		throw new TypeError("target.scope must be all, ungrouped, or workspace with a non-empty workspaceId");
	}
};
const unarchivedBatchSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (!Array.isArray(value.archivedSessionIds) || value.archivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
		if (!Array.isArray(value.unarchivedSessionIds) || value.unarchivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("unarchivedSessionIds must be a string array");
		return value;
	}
};
const deletedBatchSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		for (const key of ["requestedSessionIds", "deletedSessionIds", "skippedSessionIds"]) {
			if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
		}
		if (!Array.isArray(value.failures) || value.failures.some((failure) => typeof failure !== "object" || failure === null || typeof failure.sessionId !== "string" || typeof failure.message !== "string")) throw new TypeError("failures must contain sessionId/message objects");
		return value;
	}
};
const archivedSessionMetadataSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.items)) throw new TypeError("result.items must be an array");
		if (value.items.some((item) => typeof item !== "object" || item === null || typeof item.sessionId !== "string" || typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt))) throw new TypeError("items must contain sessionId/createdAt objects");
		return value;
	}
};
/** moveSession 参数：目标工作区 id；null 表示移入「未分组」。 */
const workspaceTargetSchema = {
	parse(value) {
		if (value === null) return null;
		if (typeof value === "string" && value.length > 0) return value;
		throw new TypeError("targetWorkspaceId must be a non-empty string (workspace) or null (ungrouped)");
	}
};
/** moveSession 结果：`{ sessionId, workspaceId, previousWorkspaceId }`，空字符串表示未分组。 */
const moveSessionSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (typeof value.sessionId !== "string" || value.sessionId.length === 0) throw new TypeError("sessionId must be a non-empty string");
		if (typeof value.workspaceId !== "string") throw new TypeError("workspaceId must be a string (empty means ungrouped)");
		if (typeof value.previousWorkspaceId !== "string") throw new TypeError("previousWorkspaceId must be a string (empty means ungrouped)");
		return value;
	}
};
/** syncRecords 结果：`{ scanned, archivedRemoved, workspaceRemoved, workspaceAdded, projcacheRemoved }`。 */
const syncRecordsSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (!Number.isSafeInteger(value.scanned) || value.scanned < 0) throw new TypeError("scanned must be a non-negative safe integer");
		for (const key of ["archivedRemoved", "workspaceRemoved", "workspaceAdded", "projcacheRemoved"]) {
			if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
		}
		return value;
	}
};
/**
* 客户端通过 `ctx.remote.$mount` 注册 workspaceRegistry 的远程方法。
* 调用走 typert gateway SRC 路径，不影响既有 `/api/workspace.*` 网关。
*/
/** 基础设置（对话增强）读取/写入结果与更新载荷。 */
const settingsSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("settings must be an object");
		if (typeof value.homeDir !== "string" || value.homeDir.length === 0) throw new TypeError("homeDir must be a non-empty string");
		if (typeof value.notifyEnabled !== "boolean") throw new TypeError("notifyEnabled must be a boolean");
		return value;
	}
};
const settingsUpdateSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("settings must be an object");
		if (value.homeDir !== void 0 && (typeof value.homeDir !== "string" || value.homeDir.trim().length === 0)) throw new TypeError("homeDir must be a non-empty string when provided");
		if (value.notifyEnabled !== void 0 && typeof value.notifyEnabled !== "boolean") throw new TypeError("notifyEnabled must be a boolean when provided");
		return value;
	}
};
const SESSION_ENHANCE_REMOTE = {
	package: "dsh-session-enhance",
	descriptors: [
		{
			id: "dsh-session-enhance#workspaceRegistry/unarchiveSession",
			service: "workspaceRegistry",
			namespace: "workspaceRegistry",
			method: "unarchiveSession",
			invocation: { kind: "direct" },
			parameters: [{
				name: "sessionId",
				wire: "sessionId",
				source: "json",
				codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
			}],
			result: {
				mode: "strict",
				typeSymbol: "dsh-session-enhance/types#ArchivedSessionIds",
				schema: archivedSetSchema
			},
			sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
		},
		{
			id: "dsh-session-enhance#workspaceRegistry/deleteSession",
			service: "workspaceRegistry",
			namespace: "workspaceRegistry",
			method: "deleteSession",
			invocation: { kind: "direct" },
			parameters: [{
				name: "sessionId",
				wire: "sessionId",
				source: "json",
				codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
			}],
			result: {
				mode: "strict",
				typeSymbol: "dsh-session-enhance/types#Deleted",
				schema: deletedSchema
			},
			sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
		},
		{
			id: "dsh-session-enhance#workspaceRegistry/unarchiveSessions",
			service: "workspaceRegistry",
			namespace: "workspaceRegistry",
			method: "unarchiveSessions",
			invocation: { kind: "direct" },
			parameters: [{
				name: "target",
				wire: "target",
				source: "json",
				codec: { mode: "strict", typeSymbol: "dsh-session-enhance/types#ArchivedBatchTarget", schema: archivedBatchTargetSchema }
			}],
			result: {
				mode: "strict",
				typeSymbol: "dsh-session-enhance/types#UnarchivedBatch",
				schema: unarchivedBatchSchema
			},
			sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
		},
		{
			id: "dsh-session-enhance#workspaceRegistry/deleteArchivedSessions",
			service: "workspaceRegistry",
			namespace: "workspaceRegistry",
			method: "deleteArchivedSessions",
			invocation: { kind: "direct" },
			parameters: [{
				name: "target",
				wire: "target",
				source: "json",
				codec: { mode: "strict", typeSymbol: "dsh-session-enhance/types#ArchivedBatchTarget", schema: archivedBatchTargetSchema }
			}],
			result: {
				mode: "strict",
				typeSymbol: "dsh-session-enhance/types#DeletedBatch",
				schema: deletedBatchSchema
			},
			sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
		},
		{
			id: "dsh-session-enhance#workspaceRegistry/archivedSessionMetadata",
			service: "workspaceRegistry",
			namespace: "workspaceRegistry",
			method: "archivedSessionMetadata",
			invocation: { kind: "direct" },
			parameters: [],
			result: {
				mode: "strict",
				typeSymbol: "dsh-session-enhance/types#ArchivedSessionMetadata",
				schema: archivedSessionMetadataSchema
			},
			sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
		},
		{
			id: "dsh-session-enhance#workspaceRegistry/moveSession",
			service: "workspaceRegistry",
			namespace: "workspaceRegistry",
			method: "moveSession",
			invocation: { kind: "direct" },
			parameters: [{
				name: "sessionId",
				wire: "sessionId",
				source: "json",
				codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
			}, {
				name: "targetWorkspaceId",
				wire: "targetWorkspaceId",
				source: "json",
				codec: { mode: "strict", typeSymbol: "dsh-session-enhance/types#WorkspaceTarget", schema: workspaceTargetSchema }
			}],
			result: {
				mode: "strict",
				typeSymbol: "dsh-session-enhance/types#SessionMoved",
				schema: moveSessionSchema
			},
			sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
		},
		{
			id: "dsh-session-enhance#workspaceRegistry/syncRecords",
			service: "workspaceRegistry",
			namespace: "workspaceRegistry",
			method: "syncRecords",
			invocation: { kind: "direct" },
			parameters: [],
			result: {
				mode: "strict",
				typeSymbol: "dsh-session-enhance/types#SyncRecords",
				schema: syncRecordsSchema
			},
			sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
		},
		{
			id: "dsh-session-enhance#workspaceRegistry/getSettings",
			service: "workspaceRegistry",
			namespace: "workspaceRegistry",
			method: "getSettings",
			invocation: { kind: "direct" },
			parameters: [],
			result: {
				mode: "strict",
				typeSymbol: "dsh-session-enhance/types#Settings",
				schema: settingsSchema
			},
			sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
		},
		{
			id: "dsh-session-enhance#workspaceRegistry/setSettings",
			service: "workspaceRegistry",
			namespace: "workspaceRegistry",
			method: "setSettings",
			invocation: { kind: "direct" },
			parameters: [{
				name: "settings",
				wire: "settings",
				source: "json",
				codec: { mode: "strict", typeSymbol: "dsh-session-enhance/types#SettingsUpdate", schema: settingsUpdateSchema }
			}],
			result: {
				mode: "strict",
				typeSymbol: "dsh-session-enhance/types#Settings",
				schema: settingsSchema
			},
			sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
		}
	]
};

export { SESSION_ENHANCE_REMOTE };