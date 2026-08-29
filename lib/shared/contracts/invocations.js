import {
	archivedBatchTargetSchema,
	archivedSessionMetadataSchema,
	archivedSetSchema,
	deletedBatchSchema,
	deletedSchema,
	deletionVerificationSchema,
	emptyWorkspaceDirectoriesSchema,
	emptyWorkspaceDirectoryNameSchema,
	moveSessionSchema,
	sessionIdSchema,
	settingsSchema,
	settingsUpdateSchema,
	syncRecordsSchema,
	unarchivedBatchSchema,
	workspaceDirectoryDeletedSchema,
	workspaceTargetSchema
} from "./schemas.js";

/**
 * Host 严格描述符。网关优先读 typert.local，避免 SRC 扫描缓存
 * 或协议包双份导致 /api/workspaceRegistry/deleteSession 在生产环境 404。
 *
 * 说明：sourceLocation 为占位元数据，无运行时代码溯源用途。
 */
export const SESSION_ENHANCE_INVOCATIONS = [
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
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
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
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
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
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
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
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
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
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
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
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
	},
	{
		id: "dsh-session-enhance#workspaceRegistry/verifyDeleted",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "verifyDeleted",
		invocation: { kind: "direct" },
		parameters: [{
			name: "sessionId",
			wire: "sessionId",
			source: "json",
			codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#DeletionVerification",
			schema: deletionVerificationSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
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
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
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
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
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
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
	},
	{
		id: "dsh-session-enhance#workspaceRegistry/listEmptyWorkspaceDirectories",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "listEmptyWorkspaceDirectories",
		invocation: { kind: "direct" },
		parameters: [],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#EmptyWorkspaceDirectories",
			schema: emptyWorkspaceDirectoriesSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
	},
	{
		id: "dsh-session-enhance#workspaceRegistry/deleteEmptyWorkspaceDirectory",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "deleteEmptyWorkspaceDirectory",
		invocation: { kind: "direct" },
		parameters: [{
			name: "name",
			wire: "name",
			source: "json",
			codec: { mode: "strict", typeSymbol: "dsh-session-enhance/types#EmptyWorkspaceDirectoryName", schema: emptyWorkspaceDirectoryNameSchema }
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#WorkspaceDirectoryDeleted",
			schema: workspaceDirectoryDeletedSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/shared/contracts/invocations.js", line: 1, column: 1 }
	}
];

export const SESSION_ENHANCE_TYPERT = {
	package: "dsh-session-enhance",
	face: "host",
	schemas: [],
	model: { services: [], events: [], objects: [] },
	invocations: SESSION_ENHANCE_INVOCATIONS
};

export function registerHostRemote(ctx) {
	const existing = ctx.get("typert");
	if (existing !== undefined) {
		existing.register(SESSION_ENHANCE_TYPERT);
		return;
	}
	ctx.inject(["typert"], (typertCtx) => {
		typertCtx.typert.register(SESSION_ENHANCE_TYPERT);
	});
}
