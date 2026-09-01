window.__ModuleLoader__.load({
	id: "dsh-session-enhance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __export = (target, all) => {
		  for (var name in all)
		    __defProp(target, name, { get: all[name], enumerable: true });
		};
		var __copyProps = (to, from, except, desc) => {
		  if (from && typeof from === "object" || typeof from === "function") {
		    for (let key of __getOwnPropNames(from))
		      if (!__hasOwnProp.call(to, key) && key !== except)
		        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
		  }
		  return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
		  // If the importer is in node compatibility mode or this is not an ESM
		  // file that has been converted to a CommonJS file using a Babel-
		  // compatible transform (i.e. "__esModule" has not been set), then set
		  // "default" to the CommonJS "module.exports" for node compatibility.
		  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
		  mod
		));
		var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
		
		// src/client/index.js
		var index_exports = {};
		__export(index_exports, {
		  __test: () => __test,
		  apply: () => apply,
		  inject: () => inject
		});
		module.exports = __toCommonJS(index_exports);
		
		// src/client/contracts.js
		var sessionIdSchema = {
		  parse(value) {
		    if (typeof value !== "string" || value.length === 0) throw new TypeError(`sessionId must be a non-empty string, got ${String(value)}`);
		    return value;
		  }
		};
		var archivedSetSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		    const ids = value.archivedSessionIds;
		    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
		    return value;
		  }
		};
		var deletedSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true) throw new TypeError("deleted must be true");
		    return value;
		  }
		};
		var archivedBatchTargetSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("target must be an object");
		    if (value.scope === "all" || value.scope === "ungrouped") return value;
		    if (value.scope === "workspace" && typeof value.workspaceId === "string" && value.workspaceId.length > 0) return value;
		    throw new TypeError("target.scope must be all, ungrouped, or workspace with a non-empty workspaceId");
		  }
		};
		var unarchivedBatchSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		    if (!Array.isArray(value.archivedSessionIds) || value.archivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
		    if (!Array.isArray(value.unarchivedSessionIds) || value.unarchivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("unarchivedSessionIds must be a string array");
		    return value;
		  }
		};
		var deletedBatchSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		    for (const key of ["requestedSessionIds", "deletedSessionIds", "skippedSessionIds"]) {
		      if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
		    }
		    if (!Array.isArray(value.failures) || value.failures.some((failure) => typeof failure !== "object" || failure === null || typeof failure.sessionId !== "string" || typeof failure.message !== "string")) throw new TypeError("failures must contain sessionId/message objects");
		    return value;
		  }
		};
		var archivedSessionMetadataSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.items)) throw new TypeError("result.items must be an array");
		    if (value.items.some((item) => typeof item !== "object" || item === null || typeof item.sessionId !== "string" || typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt))) throw new TypeError("items must contain sessionId/createdAt objects");
		    return value;
		  }
		};
		var workspaceTargetSchema = {
		  parse(value) {
		    if (value === null) return null;
		    if (typeof value === "string" && value.length > 0) return value;
		    throw new TypeError("targetWorkspaceId must be a non-empty string (workspace) or null (ungrouped)");
		  }
		};
		var moveSessionSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		    if (typeof value.sessionId !== "string" || value.sessionId.length === 0) throw new TypeError("sessionId must be a non-empty string");
		    if (typeof value.workspaceId !== "string") throw new TypeError("workspaceId must be a string (empty means ungrouped)");
		    if (typeof value.previousWorkspaceId !== "string") throw new TypeError("previousWorkspaceId must be a string (empty means ungrouped)");
		    return value;
		  }
		};
		var syncRecordsSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		    if (!Number.isSafeInteger(value.scanned) || value.scanned < 0) throw new TypeError("scanned must be a non-negative safe integer");
		    for (const key of ["archivedRemoved", "workspaceRemoved", "workspaceAdded", "projcacheRemoved"]) {
		      if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
		    }
		    return value;
		  }
		};
		var settingsSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("settings must be an object");
		    if (typeof value.homeDir !== "string" || value.homeDir.length === 0) throw new TypeError("homeDir must be a non-empty string");
		    if (typeof value.notifyEnabled !== "boolean") throw new TypeError("notifyEnabled must be a boolean");
		    return value;
		  }
		};
		var settingsUpdateSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("settings must be an object");
		    if (value.homeDir !== void 0 && (typeof value.homeDir !== "string" || value.homeDir.trim().length === 0)) throw new TypeError("homeDir must be a non-empty string when provided");
		    if (value.notifyEnabled !== void 0 && typeof value.notifyEnabled !== "boolean") throw new TypeError("notifyEnabled must be a boolean when provided");
		    return value;
		  }
		};
		var emptyWorkspaceDirectoryNameSchema = {
		  parse(value) {
		    if (typeof value !== "string" || value.length === 0 || value === "." || value === ".." || value.includes("/") || value.includes("\\")) throw new TypeError("name must be a non-empty direct child directory name");
		    return value;
		  }
		};
		var emptyWorkspaceDirectoriesSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.directories)) throw new TypeError("result.directories must be an array");
		    if (value.directories.some((dir) => typeof dir !== "object" || dir === null || typeof dir.name !== "string" || typeof dir.path !== "string")) throw new TypeError("directories must contain name/path objects");
		    return value;
		  }
		};
		var workspaceDirectoryDeletedSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true || typeof value.name !== "string") throw new TypeError("deleted must be true and name must be a string");
		    return value;
		  }
		};
		var previewSessionSchema = {
		  parse(value) {
		    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		    if (typeof value.sessionId !== "string" || value.sessionId.length === 0) throw new TypeError("sessionId must be a non-empty string");
		    if (!Array.isArray(value.messages)) throw new TypeError("messages must be an array");
		    for (const message of value.messages) {
		      if (typeof message !== "object" || message === null) throw new TypeError("messages must contain objects");
		      if (message.kind !== "user" && message.kind !== "assistant" && message.kind !== "system") throw new TypeError("message.kind must be user, assistant, or system");
		      if (typeof message.text !== "string") throw new TypeError("message.text must be a string");
		      if (message.time !== void 0 && (typeof message.time !== "number" || !Number.isFinite(message.time))) throw new TypeError("message.time must be a finite number when provided");
		      for (const key of ["tag", "name", "label"]) {
		        if (message[key] !== void 0 && typeof message[key] !== "string") throw new TypeError(`message.${key} must be a string when provided`);
		      }
		    }
		    return value;
		  }
		};
		var SESSION_ENHANCE_REMOTE = {
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
		      id: "dsh-session-enhance#workspaceRegistry/previewSession",
		      service: "workspaceRegistry",
		      namespace: "workspaceRegistry",
		      method: "previewSession",
		      invocation: { kind: "direct" },
		      parameters: [{
		        name: "sessionId",
		        wire: "sessionId",
		        source: "json",
		        codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
		      }],
		      result: {
		        mode: "strict",
		        typeSymbol: "dsh-session-enhance/types#SessionPreview",
		        schema: previewSessionSchema
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
		      sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
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
		      sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
		    }
		  ]
		};
		
		// src/client/stores.js
		var _deepseek_ai_dsh_client_runtime_client = __toESM(require("@deepseek-ai/dsh-client-runtime/client"), 1);
		var FLAT_SESSION_ORDER_KEY = "__flat_session_order__";
		function createWorkspaceViewStore() {
		  return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
		    init: () => ({
		      groupBy: "workspace",
		      orderBy: "updated",
		      showArchived: false,
		      groupExpansion: {},
		      sessionOrderByAccount: {},
		      sessionUpdatedAtByAccount: {}
		    }),
		    persist: "dsh.workspace.view.v5",
		    actions: {
		      setGroupBy: (d, mode) => {
		        d.groupBy = mode;
		      },
		      setOrderBy: (d, mode) => {
		        d.orderBy = mode;
		      },
		      setShowArchived: (d, value) => {
		        d.showArchived = value === true;
		      },
		      setGroupExpanded: (d, key, expanded) => {
		        d.groupExpansion[key] = expanded;
		      },
		      retainAccountKeys: (d, workspaceKeys) => {
		        const retained = new Set(workspaceKeys);
		        d.groupExpansion = Object.fromEntries(Object.entries(d.groupExpansion).filter(([key]) => retained.has(key)));
		        d.sessionOrderByAccount = Object.fromEntries(Object.entries(d.sessionOrderByAccount).filter(([key]) => retained.has(key)));
		        d.sessionUpdatedAtByAccount = Object.fromEntries(Object.entries(d.sessionUpdatedAtByAccount).filter(([key]) => retained.has(key)));
		      },
		      syncSessionOrderAccount: (d, accountKey, order, updatedAt) => {
		        d.sessionOrderByAccount[accountKey] = order;
		        d.sessionUpdatedAtByAccount[accountKey] = updatedAt;
		      },
		      setSessionOrder: (d, accountKey, order) => {
		        d.sessionOrderByAccount[accountKey] = order;
		      }
		    }
		  });
		}
		
		// src/client/locales.js
		var zh = {
		  "group.ungrouped": "\u672A\u5206\u7EC4",
		  "session.new": "\u65B0\u4F1A\u8BDD",
		  "section.workspaces": "\u5DE5\u4F5C\u533A",
		  "section.sessions": "\u4F1A\u8BDD",
		  "viewOptions.label": "\u89C6\u56FE\u9009\u9879",
		  "groupBy.label": "\u5206\u7EC4\u65B9\u5F0F",
		  "groupBy.workspace": "\u6309\u5DE5\u4F5C\u533A",
		  "groupBy.flat": "\u5355\u5217\u8868",
		  "orderBy.label": "\u6392\u5E8F\u65B9\u5F0F",
		  "orderBy.manual": "\u624B\u52A8\u6392\u5E8F",
		  "orderBy.updated": "\u6700\u8FD1\u66F4\u65B0",
		  "sessions.expand": "\u5C55\u5F00\u5176\u4F59 {n} \u4E2A\u4F1A\u8BDD",
		  "sessions.collapse": "\u6536\u8D77",
		  "empty.none": "\u6682\u65E0\u4F1A\u8BDD",
		  "empty.noMatches": "\u65E0\u5339\u914D\u7ED3\u679C",
		  "workspace.add": "\u6DFB\u52A0\u5DE5\u4F5C\u533A",
		  "search.sessions.aria": "\u641C\u7D22\u4F1A\u8BDD",
		  "search.placeholder": "\u641C\u7D22\u4F1A\u8BDD\u2026",
		  "search.clear": "\u6E05\u9664\u641C\u7D22",
		  "search.results.aria": "\u641C\u7D22\u7ED3\u679C",
		  "search.pending": "\u6B63\u5728\u641C\u7D22\u4F1A\u8BDD\u5386\u53F2\u2026",
		  "search.unavailable": "\u5185\u5BB9\u641C\u7D22\u6682\u4E0D\u53EF\u7528\uFF0C\u4EC5\u663E\u793A\u540D\u79F0\u5339\u914D\u3002",
		  "search.noMatches": "\u65E0\u5339\u914D\u4F1A\u8BDD",
		  "search.hasMore": "\u4EC5\u663E\u793A\u524D {n} \u6761\u7ED3\u679C\uFF0C\u8BF7\u7F29\u5C0F\u641C\u7D22\u8303\u56F4\u3002",
		  "menu.addWorkspace": "\u6DFB\u52A0\u5DE5\u4F5C\u533A\u2026",
		  "menu.unarchive": "\u53D6\u6D88\u5F52\u6863",
		  "menu.deleteSession": "\u5220\u9664\u4F1A\u8BDD",
		  "menu.copySessionId": "\u590D\u5236ID",
		  "menu.copySessionIdCopied": "\u5DF2\u590D\u5236\u4F1A\u8BDD ID",
		  "menu.copySessionIdFailed": "\u590D\u5236\u5931\u8D25",
		  "archived.badge": "\u5DF2\u5F52\u6863",
		  "archived.notOpenable": "\u5DF2\u5F52\u6863\uFF0C\u53D6\u6D88\u5F52\u6863\u540E\u53EF\u7EE7\u7EED\u5BF9\u8BDD",
		  "archives.title": "\u5DF2\u5F52\u6863\u7684\u804A\u5929",
		  "archives.manageTitle": "\u5F52\u6863\u7BA1\u7406",
		  "settings.manageTitle": "\u5BF9\u8BDD\u589E\u5F3A",
		  "settings.basicTab": "\u57FA\u7840\u8BBE\u7F6E",
		  "settings.categoryBasic": "\u57FA\u7840\u8BBE\u7F6E",
		  "settings.categoryFeatures": "\u529F\u80FD\u8BBE\u7F6E",
		  "settings.description": "\u914D\u7F6E\u5BF9\u8BDD\u589E\u5F3A\u63D2\u4EF6\u7684\u5BB6\u76EE\u5F55\u4E0E\u901A\u77E5\u3002",
		  "settings.homeDir": ".dsh \u5BB6\u76EE\u5F55",
		  "settings.homeDirHint": "\u63D2\u4EF6\u636E\u6B64\u5B9A\u4F4D storages \u76EE\u5F55\uFF08\u9ED8\u8BA4 ~/.dsh\uFF09\u3002",
		  "settings.notify": "\u5BF9\u8BDD\u901A\u77E5",
		  "settings.notifyHint": "\u5728\u672A\u805A\u7126\u65F6\uFF0C\u662F\u5426\u901A\u77E5\u60A8\u5F85\u5904\u7406\u7684\u7528\u6237\u64CD\u4F5C\u8BF7\u6C42\u548C\u5BF9\u8BDD\u5B8C\u6210\u60C5\u51B5",
		  "settings.notifyEnabled": "\u542F\u7528\u5BF9\u8BDD\u901A\u77E5",
		  "settings.changeDirectory": "\u53D8\u66F4\u76EE\u5F55",
		  "settings.restoreDefault": "\u6062\u590D\u9ED8\u8BA4",
		  "settings.saved": "\u5DF2\u4FDD\u5B58",
		  "settings.pickDirectory": "\u70B9\u51FB\u9009\u62E9\u76EE\u5F55",
		  "settings.pickFailed": "\u9009\u62E9\u76EE\u5F55\u5931\u8D25\uFF1A{detail}",
		  "settings.saveFailed": "\u4FDD\u5B58\u5931\u8D25\uFF1A{detail}",
		  "settings.loadFailed": "\u52A0\u8F7D\u5931\u8D25\uFF1A{detail}",
		  "notify.finished": "\u5BF9\u8BDD\u5DF2\u7ED3\u675F\u3002",
		  "notify.needsAction": "\u5BF9\u8BDD\u9700\u8981\u4F60\u7684\u64CD\u4F5C\u3002",
		  "archives.description": "\u7BA1\u7406\u5DF2\u5F52\u6863\u7684\u4F1A\u8BDD\u3002",
		  "archives.empty": "\u6682\u65E0\u5DF2\u5F52\u6863\u4F1A\u8BDD",
		  "archives.emptyFiltered": "\u6CA1\u6709\u5339\u914D\u7684\u5DF2\u5F52\u6863\u804A\u5929",
		  "archives.searchPlaceholder": "\u641C\u7D22\u5DF2\u5F52\u6863\u804A\u5929",
		  "archives.sortBy": "\u6392\u5E8F\u65B9\u5F0F",
		  "archives.sortUpdated": "\u66F4\u65B0\u65F6\u95F4",
		  "archives.sortCreated": "\u521B\u5EFA\u65F6\u95F4",
		  "archives.sortAlphabetical": "\u6309\u5B57\u6BCD\u987A\u5E8F",
		  "archives.projectFilter": "\u6309\u9879\u76EE\u7B5B\u9009",
		  "archives.allProjects": "\u6240\u6709\u9879\u76EE",
		  "archives.sessionCount": "{n} \u4E2A\u804A\u5929",
		  "archives.timestamp": "{date}\uFF0C{time}",
		  "archives.restoreAll": "\u5168\u90E8\u6062\u590D",
		  "archives.sync": "\u540C\u6B65\u8BB0\u5F55",
		  "archives.syncResult": "\u5DF2\u540C\u6B65 {scanned} \u4E2A\u4F1A\u8BDD\uFF1A\u8865\u8BB0 {added} \u4E2A\uFF0C\u6E05\u7406\u5E7D\u7075\u8BB0\u5F55 {removed} \u4E2A",
		  "archives.syncFailed": "\u540C\u6B65\u5931\u8D25\uFF1A{detail}",
		  "archives.restoreProject": "\u5168\u90E8\u6062\u590D",
		  "archives.restoreUngrouped": "\u6062\u590D\u672A\u5206\u7EC4\u7684\u5168\u90E8\u804A\u5929",
		  "archives.deleteProject": "\u5168\u90E8\u5220\u9664",
		  "archives.deleteUngrouped": "\u5220\u9664\u672A\u5206\u7EC4\u7684\u5168\u90E8\u804A\u5929",
		  "archives.previewSession": "\u9884\u89C8\u5BF9\u8BDD",
		  "archives.previewLoading": "\u6B63\u5728\u52A0\u8F7D\u5BF9\u8BDD\u2026",
		  "archives.previewEmpty": "\u8BE5\u5BF9\u8BDD\u6682\u65E0\u6D88\u606F",
		  "archives.previewFailed": "\u9884\u89C8\u5931\u8D25\uFF1A{detail}",
		  "archives.roleUser": "\u7528\u6237",
		  "archives.roleAssistant": "\u52A9\u624B",
		  "archives.roleTool": "\u5DE5\u5177",
		  "archives.previewToolCall": "\u5DE5\u5177\u8C03\u7528",
		  "archives.previewToolCallName": "\u5DE5\u5177\u8C03\u7528 \xB7 {name}",
		  "archives.previewToolResult": "\u5DE5\u5177\u7ED3\u679C",
		  "archives.previewToolResultName": "\u5DE5\u5177\u7ED3\u679C \xB7 {name}",
		  "archives.previewContext": "system",
		  "archives.collapseTurn": "\u6536\u8D77\u672C\u8F6E\u5BF9\u8BDD",
		  "archives.expandTurn": "\u5C55\u5F00\u672C\u8F6E\u5BF9\u8BDD",
		  "archives.projectActions": "\u9879\u76EE\u201C{name}\u201D\u7684\u5F52\u6863\u64CD\u4F5C",
		  "archives.ungroupedActions": "\u672A\u5206\u7EC4\u804A\u5929\u7684\u5F52\u6863\u64CD\u4F5C",
		  "archives.restoreSuccess": "\u5DF2\u6062\u590D {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u3002",
		  "archives.restoreBatchFailed": "\u6279\u91CF\u6062\u590D\u5931\u8D25\uFF1A{detail}",
		  "archives.deleteAll": "\u5168\u90E8\u5220\u9664",
		  "archives.deleteAllTitle": "\u5220\u9664\u5168\u90E8\u5DF2\u5F52\u6863\u804A\u5929",
		  "archives.deleteAllDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u5168\u90E8 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\uFF08\u542B\u6B63\u5728\u8FD0\u884C\u7684\uFF09\u548C\u8BB0\u5F55\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
		  "archives.deleteAllPending": "\u6B63\u5728\u5220\u9664\u5DF2\u5F52\u6863\u804A\u5929\u2026",
		  "archives.deleteProjectTitle": "\u5220\u9664\u201C{name}\u201D\u4E2D\u7684\u5DF2\u5F52\u6863\u804A\u5929",
		  "archives.deleteProjectDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u201C{name}\u201D\u4E2D\u7684 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\u548C\u8BB0\u5F55\u3002\u9879\u76EE\u76EE\u5F55\u548C\u672A\u5F52\u6863\u804A\u5929\u4E0D\u4F1A\u53D7\u5F71\u54CD\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
		  "archives.deleteProjectConfirm": "\u5220\u9664\u8BE5\u9879\u76EE\u7684\u5168\u90E8\u804A\u5929",
		  "archives.deleteUngroupedTitle": "\u5220\u9664\u672A\u5206\u7EC4\u7684\u5DF2\u5F52\u6863\u804A\u5929",
		  "archives.deleteUngroupedDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u672A\u5206\u7EC4\u4E2D\u7684 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\u548C\u8BB0\u5F55\u3002\u5176\u4ED6\u9879\u76EE\u548C\u672A\u5F52\u6863\u804A\u5929\u4E0D\u4F1A\u53D7\u5F71\u54CD\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
		  "archives.deleteUngroupedConfirm": "\u5220\u9664\u672A\u5206\u7EC4\u7684\u5168\u90E8\u804A\u5929",
		  "archives.deleteBatchPending": "\u6B63\u5728\u5220\u9664\u5DF2\u5F52\u6863\u804A\u5929\u2026",
		  "archives.deleteSuccess": "\u5DF2\u5220\u9664 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u3002",
		  "archives.deletePartial": "\u5DF2\u5904\u7406 {done} \u4E2A\u804A\u5929\uFF0C{failed} \u4E2A\u5220\u9664\u5931\u8D25\uFF1A{detail}",
		  "archives.emptyDirDelete": "\u5220\u9664",
		  "archives.emptyDirDeleteTitle": "\u5220\u9664\u7A7A\u5DE5\u4F5C\u533A\u76EE\u5F55",
		  "archives.emptyDirDeleteDesc": "\u5C06\u5220\u9664\u7A7A\u5DE5\u4F5C\u533A\u76EE\u5F55\u201C{name}\u201D\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
		  "archives.emptyDirDeleteConfirm": "\u5220\u9664\u76EE\u5F55",
		  "archives.emptyDirDeletePending": "\u6B63\u5728\u5220\u9664\u7A7A\u5DE5\u4F5C\u533A\u76EE\u5F55\u2026",
		  "archives.emptyDirDeleted": "\u5DF2\u5220\u9664\u7A7A\u5DE5\u4F5C\u533A\u76EE\u5F55\u201C{name}\u201D\u3002",
		  "archives.emptyDirDeleteFailed": "\u5220\u9664\u7A7A\u5DE5\u4F5C\u533A\u76EE\u5F55\u5931\u8D25\uFF1A{detail}",
		  "archives.deleteWorkspaceDesc": "\u5C06\u5220\u9664\u5DE5\u4F5C\u533A\u201C{name}\u201D\u4E2D\u7684\u6240\u6709\u5DF2\u5F52\u6863\u5BF9\u8BDD\uFF0C\u5E76\u5220\u9664\u5176\u5DE5\u4F5C\u533A\u76EE\u5F55\u3002\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
		  "archives.deleteWorkspaceDone": "\u5DF2\u5220\u9664\u5DE5\u4F5C\u533A\u201C{name}\u201D\u3002",
		  "archives.deleteWorkspaceFailed": "\u5220\u9664\u5DE5\u4F5C\u533A\u5931\u8D25\uFF1A{detail}",
		  "archives.unarchiveUnknown": "\u4F1A\u8BDD\u5DF2\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u53D6\u6D88\u5F52\u6863\u3002",
		  "archives.unarchiveFailed": "\u53D6\u6D88\u5F52\u6863\u5931\u8D25\uFF1A{detail}",
		  "archives.archiveUnknown": "\u4F1A\u8BDD\u5DF2\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u5F52\u6863\u3002",
		  "archives.archiveFailed": "\u5F52\u6863\u5931\u8D25\uFF1A{detail}",
		  "archives.forkFailed": "\u5206\u53C9\u4F1A\u8BDD\u5931\u8D25\uFF1A{detail}",
		  "deleteSession.title": "\u5220\u9664\u4F1A\u8BDD",
		  "deleteSession.desc": "\u5C06\u6C38\u4E45\u5220\u9664\u4F1A\u8BDD\u201C{name}\u201D\u53CA\u5176\u5B50\u4EE3\u7406\uFF08\u542B\u6B63\u5728\u8FD0\u884C\u7684\uFF09\u548C\u5168\u90E8\u8BB0\u5F55\uFF08\u5BF9\u8BDD\u5185\u5BB9\u3001\u7EDF\u8BA1\u3001\u7F13\u5B58\uFF09\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
		  "deleteSession.pending": "\u6B63\u5728\u5220\u9664\u4F1A\u8BDD\u2026",
		  "deleteSession.unknown": "\u4F1A\u8BDD\u5DF2\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664\u3002",
		  "deleteSession.failed": "\u5220\u9664\u4F1A\u8BDD\u5931\u8D25\uFF1A{detail}",
		  "picker.loading": "\u6B63\u5728\u52A0\u8F7D\u5DE5\u4F5C\u533A\u2026",
		  "conflict.named": "\u5DF2\u5B58\u5728\u540D\u4E3A\u201C{name}\u201D\u7684\u5DE5\u4F5C\u533A\u3002",
		  "folderError.title": "\u65E0\u6CD5\u6253\u5F00\u6587\u4EF6\u5939",
		  "folderError.retry": "\u91CD\u65B0\u9009\u62E9",
		  "rename": "\u91CD\u547D\u540D",
		  "rename.workspace.title": "\u91CD\u547D\u540D\u5DE5\u4F5C\u533A",
		  "rename.session.title": "\u91CD\u547D\u540D\u4F1A\u8BDD",
		  "field.workspaceName": "\u5DE5\u4F5C\u533A\u540D\u79F0",
		  "field.sessionName": "\u4F1A\u8BDD\u540D\u79F0",
		  "delete.workspace": "\u5220\u9664\u5DE5\u4F5C\u533A",
		  "delete.desc": "\u5C06\u628A\u201C{name}\u201D\u4ECE\u5DE5\u4F5C\u533A\u5217\u8868\u4E2D\u79FB\u9664\u3002\u6587\u4EF6\u5939\u4E0E\u4F1A\u8BDD\u8BB0\u5F55\u4F1A\u4FDD\u7559\uFF0C\u5176\u4F1A\u8BDD\u5C06\u663E\u793A\u5728\u201C\u672A\u5206\u7EC4\u201D\u4E0B\u3002",
		  "delete.pending": "\u6B63\u5728\u5220\u9664\u5DE5\u4F5C\u533A\u2026",
		  "menu.fork": "\u5206\u53C9\u4F1A\u8BDD",
		  "menu.archiveSession": "\u5F52\u6863\u4F1A\u8BDD",
		  "sessions.count.one": "{n} \u4E2A\u4F1A\u8BDD",
		  "sessions.count.other": "{n} \u4E2A\u4F1A\u8BDD",
		  "actions.workspace.aria": "\u5DE5\u4F5C\u533A\u201C{name}\u201D\u7684\u64CD\u4F5C",
		  "actions.session.aria": "\u4F1A\u8BDD\u201C{name}\u201D\u7684\u64CD\u4F5C",
		  "actions.newSession.aria": "\u5728\u201C{name}\u201D\u4E2D\u65B0\u5EFA\u4F1A\u8BDD",
		  "status.running": "\u8FDB\u884C\u4E2D",
		  "status.subagentsRunning.one": "{n} \u4E2A\u5B50\u4EE3\u7406\u8FD0\u884C\u4E2D",
		  "status.subagentsRunning.other": "{n} \u4E2A\u5B50\u4EE3\u7406\u8FD0\u884C\u4E2D",
		  "status.idle": "\u7A7A\u95F2",
		  "status.waitingApproval": "\u7B49\u5F85\u5BA1\u6279",
		  "status.planReview": "\u8BA1\u5212\u5F85\u5BA1",
		  "status.waitingAnswer": "\u7B49\u5F85\u56DE\u7B54",
		  "status.completed": "\u5DF2\u5B8C\u6210",
		  "hover.created": "\u521B\u5EFA\u4E8E {time}",
		  "hover.copied": "\u5DF2\u590D\u5236",
		  "date.ymd": "{y}\u5E74{m}\u6708{d}\u65E5",
		  "time.now": "\u521A\u521A",
		  "time.minutes": "{n}\u5206\u949F",
		  "time.hours": "{n}\u5C0F\u65F6",
		  "time.days": "{n}\u5929",
		  "time.months": "{n}\u4E2A\u6708",
		  "time.years": "{n}\u5E74",
		  "time.ago": "{t}\u524D"
		};
		var en = {
		  "group.ungrouped": "Ungrouped",
		  "session.new": "New Session",
		  "section.workspaces": "Workspaces",
		  "section.sessions": "Sessions",
		  "viewOptions.label": "View options",
		  "groupBy.label": "Group by",
		  "groupBy.workspace": "Workspace",
		  "groupBy.flat": "In one list",
		  "orderBy.label": "Order by",
		  "orderBy.manual": "Manual",
		  "orderBy.updated": "Last updated",
		  "sessions.expand": "Show {n} more sessions",
		  "sessions.collapse": "Show less",
		  "empty.none": "No sessions yet",
		  "empty.noMatches": "No matches",
		  "workspace.add": "Add workspace",
		  "search.sessions.aria": "Search sessions",
		  "search.placeholder": "Search sessions...",
		  "search.clear": "Clear search",
		  "search.results.aria": "Search results",
		  "search.pending": "Searching session history\u2026",
		  "search.unavailable": "Content search is temporarily unavailable. Showing name matches.",
		  "search.noMatches": "No matching sessions",
		  "search.hasMore": "Showing the first {n} results. Narrow your search.",
		  "menu.addWorkspace": "Add workspace\u2026",
		  "menu.unarchive": "Unarchive",
		  "menu.deleteSession": "Delete session",
		  "menu.copySessionId": "Copy ID",
		  "menu.copySessionIdCopied": "Session ID copied",
		  "menu.copySessionIdFailed": "Copy failed",
		  "archived.badge": "Archived",
		  "archived.notOpenable": "This session is archived. Unarchive it to continue the conversation.",
		  "archives.title": "Archived chats",
		  "archives.manageTitle": "Archive Manager",
		  "settings.manageTitle": "Conversation Enhance",
		  "settings.basicTab": "Basic Settings",
		  "settings.categoryBasic": "Basic",
		  "settings.categoryFeatures": "Features",
		  "settings.description": "Configure the conversation-enhance plugin's home directory and notifications.",
		  "settings.homeDir": ".dsh home directory",
		  "settings.homeDirHint": "The plugin locates the storages directory from here (default ~/.dsh).",
		  "settings.notify": "Conversation notifications",
		  "settings.notifyHint": "Whether to notify you of pending user action requests and conversation completion while unfocused.",
		  "settings.notifyEnabled": "Enable conversation notifications",
		  "settings.changeDirectory": "Change Directory",
		  "settings.restoreDefault": "Restore Default",
		  "settings.saved": "Saved",
		  "settings.pickDirectory": "Click to choose a directory",
		  "settings.pickFailed": "Failed to pick directory: {detail}",
		  "settings.saveFailed": "Save failed: {detail}",
		  "settings.loadFailed": "Load failed: {detail}",
		  "notify.finished": "The conversation has finished.",
		  "notify.needsAction": "The conversation needs your attention.",
		  "archives.description": "Manage archived sessions.",
		  "archives.empty": "No archived sessions.",
		  "archives.emptyFiltered": "No archived chats match your filters.",
		  "archives.searchPlaceholder": "Search archived chats",
		  "archives.sortBy": "Sort archived chats",
		  "archives.sortUpdated": "Last updated",
		  "archives.sortCreated": "Created",
		  "archives.sortAlphabetical": "Alphabetical",
		  "archives.projectFilter": "Filter by project",
		  "archives.allProjects": "All projects",
		  "archives.sessionCount": "{n} chats",
		  "archives.timestamp": "{date}, {time}",
		  "archives.restoreAll": "Restore all",
		  "archives.sync": "Sync records",
		  "archives.syncResult": "Synced {scanned} sessions: {added} accounted, {removed} ghost records cleaned",
		  "archives.syncFailed": "Sync failed: {detail}",
		  "archives.restoreProject": "Restore all",
		  "archives.restoreUngrouped": "Restore all ungrouped chats",
		  "archives.deleteProject": "Delete all",
		  "archives.deleteUngrouped": "Delete all ungrouped chats",
		  "archives.previewSession": "Preview chat",
		  "archives.previewLoading": "Loading chat\u2026",
		  "archives.previewEmpty": "This chat has no messages.",
		  "archives.previewFailed": "Preview failed: {detail}",
		  "archives.roleUser": "User",
		  "archives.roleAssistant": "Assistant",
		  "archives.roleTool": "Tool",
		  "archives.previewToolCall": "Tool call",
		  "archives.previewToolCallName": "Tool call \xB7 {name}",
		  "archives.previewToolResult": "Tool result",
		  "archives.previewToolResultName": "Tool result \xB7 {name}",
		  "archives.previewContext": "system",
		  "archives.collapseTurn": "Collapse turn",
		  "archives.expandTurn": "Expand turn",
		  "archives.projectActions": "Archive actions for project {name}",
		  "archives.ungroupedActions": "Archive actions for ungrouped chats",
		  "archives.restoreSuccess": "Restored {n} archived chats.",
		  "archives.restoreBatchFailed": "Could not restore the archived chats: {detail}",
		  "archives.deleteAll": "Delete all",
		  "archives.deleteAllTitle": "Delete all archived chats",
		  "archives.deleteAllDesc": "This permanently deletes all {n} archived chats, their child agents (including any that are still running), and their records. This cannot be undone.",
		  "archives.deleteAllPending": "Deleting archived chats\u2026",
		  "archives.deleteProjectTitle": "Delete archived chats in {name}",
		  "archives.deleteProjectDesc": "This permanently deletes the {n} archived chats in {name}, their child agents, and their records. The project directory and unarchived chats are not affected. This cannot be undone.",
		  "archives.deleteProjectConfirm": "Delete all project chats",
		  "archives.deleteUngroupedTitle": "Delete ungrouped archived chats",
		  "archives.deleteUngroupedDesc": "This permanently deletes the {n} ungrouped archived chats, their child agents, and their records. Other projects and unarchived chats are not affected. This cannot be undone.",
		  "archives.deleteUngroupedConfirm": "Delete all ungrouped chats",
		  "archives.deleteBatchPending": "Deleting archived chats\u2026",
		  "archives.deleteSuccess": "Deleted {n} archived chats.",
		  "archives.deletePartial": "Processed {done} chats; {failed} could not be deleted: {detail}",
		  "archives.emptyDirDelete": "Delete",
		  "archives.emptyDirDeleteTitle": "Delete empty workspace folder",
		  "archives.emptyDirDeleteDesc": "This permanently deletes the empty folder \u201C{name}\u201D. This cannot be undone.",
		  "archives.emptyDirDeleteConfirm": "Delete folder",
		  "archives.emptyDirDeletePending": "Deleting empty workspace folder\u2026",
		  "archives.emptyDirDeleted": "Deleted empty workspace folder \u201C{name}\u201D.",
		  "archives.emptyDirDeleteFailed": "Could not delete the empty workspace folder: {detail}",
		  "archives.deleteWorkspaceDesc": "This permanently deletes all archived chats in workspace \u201C{name}\u201D and removes its workspace folder. This cannot be undone.",
		  "archives.deleteWorkspaceDone": "Deleted workspace \u201C{name}\u201D.",
		  "archives.deleteWorkspaceFailed": "Could not delete the workspace: {detail}",
		  "archives.unarchiveUnknown": "This session no longer exists, so it cannot be unarchived.",
		  "archives.unarchiveFailed": "Could not unarchive the session: {detail}",
		  "archives.archiveUnknown": "This session no longer exists, so it cannot be archived.",
		  "archives.archiveFailed": "Could not archive the session: {detail}",
		  "archives.forkFailed": "Could not fork the session: {detail}",
		  "deleteSession.title": "Delete session",
		  "deleteSession.desc": "This permanently deletes session \u201C{name}\u201D, its child agents (including any that are still running), and all of its records (conversation, stats, cache). This cannot be undone.",
		  "deleteSession.pending": "Deleting session\u2026",
		  "deleteSession.unknown": "This session no longer exists or was already deleted.",
		  "deleteSession.failed": "Could not delete the session: {detail}",
		  "picker.loading": "Loading workspaces\u2026",
		  "conflict.named": "A workspace named \u201C{name}\u201D already exists.",
		  "folderError.title": "Couldn\u2019t open folder",
		  "folderError.retry": "Choose again",
		  "rename": "Rename",
		  "rename.workspace.title": "Rename workspace",
		  "rename.session.title": "Rename session",
		  "field.workspaceName": "Workspace name",
		  "field.sessionName": "Session name",
		  "delete.workspace": "Delete workspace",
		  "delete.desc": "This removes \u201C{name}\u201D from the workspace list. The folder and session logs will be kept. Its sessions will appear under Ungrouped.",
		  "delete.pending": "Deleting workspace\u2026",
		  "menu.fork": "Fork session",
		  "menu.archiveSession": "Archive session",
		  "sessions.count.one": "{n} session",
		  "sessions.count.other": "{n} sessions",
		  "actions.workspace.aria": "Workspace actions for {name}",
		  "actions.session.aria": "Session actions for {name}",
		  "actions.newSession.aria": "New session in {name}",
		  "status.running": "Running",
		  "status.subagentsRunning.one": "{n} subagent running",
		  "status.subagentsRunning.other": "{n} subagents running",
		  "status.idle": "Idle",
		  "status.waitingApproval": "Waiting for approval",
		  "status.planReview": "Plan awaiting review",
		  "status.waitingAnswer": "Waiting for answer",
		  "status.completed": "Completed",
		  "hover.created": "Created {time}",
		  "hover.copied": "Copied",
		  "date.ymd": "{y}-{m}-{d}",
		  "time.now": "now",
		  "time.minutes": "{n}min",
		  "time.hours": "{n}h",
		  "time.days": "{n}d",
		  "time.months": "{n}mo",
		  "time.years": "{n}y",
		  "time.ago": "{t} ago"
		};
		
		// src/client/settings.js
		var react2 = __toESM(require("react"), 1);
		var react_jsx_runtime2 = __toESM(require("react/jsx-runtime"), 1);
		var _deepseek_ai_dsh_client_ui_primitives2 = __toESM(require("@deepseek-ai/dsh-client-ui-primitives"), 1);
		
		// src/client/derive.js
		var _deepseek_ai_dsh_client_runtime_client2 = __toESM(require("@deepseek-ai/dsh-client-runtime/client"), 1);
		var UNGROUPED_LABEL = "Ungrouped";
		function workspaceLabel(cwd) {
		  if (cwd === void 0 || cwd === "") return UNGROUPED_LABEL;
		  const base = cwd.replace(/[/\\]+$/, "").split(/[/\\]/).pop();
		  return base !== void 0 && base !== "" ? base : cwd;
		}
		function byRecency(a, b) {
		  if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
		  return a.id < b.id ? -1 : 1;
		}
		function sessionVisible(session, current, archived, showArchived) {
		  return session.origin !== "subagent" && (!archived.has(session.id) || showArchived === true) && (!session.blank || session.id === current);
		}
		function isUnknownSessionError(reason) {
		  const message = reason instanceof Error ? reason.message : String(reason);
		  return message.includes("UNKNOWN_SESSION") || message.includes("no such session");
		}
		function formatDeleteError(reason, t) {
		  if (isUnknownSessionError(reason)) return t("deleteSession.unknown");
		  const detail = reason instanceof Error ? reason.message : String(reason);
		  return t("deleteSession.failed", { detail });
		}
		function formatUnarchiveError(reason, t) {
		  if (isUnknownSessionError(reason)) return t("archives.unarchiveUnknown");
		  const detail = reason instanceof Error ? reason.message : String(reason);
		  return t("archives.unarchiveFailed", { detail });
		}
		function formatArchiveError(reason, t) {
		  if (isUnknownSessionError(reason)) return t("archives.archiveUnknown");
		  const detail = reason instanceof Error ? reason.message : String(reason);
		  return t("archives.archiveFailed", { detail });
		}
		function formatForkError(reason, t) {
		  const detail = reason instanceof Error ? reason.message : String(reason);
		  return t("archives.forkFailed", { detail });
		}
		function sessionTitle(session) {
		  return session.blank ? "New Session" : session.displayTitle;
		}
		function buildGroup(key, workspaceId, cwd, createdAt, label, members, order) {
		  const sessions = [...members];
		  if (order === "recency") sessions.sort(byRecency);
		  return {
		    key,
		    workspaceId,
		    cwd,
		    createdAt,
		    label,
		    sessions
		  };
		}
		function orderedUngrouped(members, stored) {
		  const byId = new Map(members.map((session) => [session.id, session]));
		  const included = /* @__PURE__ */ new Set();
		  const ordered = [];
		  for (const key of stored) {
		    const session = byId.get(key);
		    if (session === void 0 || included.has(key)) continue;
		    ordered.push(session);
		    included.add(key);
		  }
		  for (const session of [...members].sort(byRecency)) {
		    if (included.has(session.id)) continue;
		    ordered.push(session);
		  }
		  return ordered;
		}
		function groupByWorkspace(list, workspaces, archived, ungroupedOrder, showArchived) {
		  const groups = [];
		  const accounted = /* @__PURE__ */ new Set();
		  for (const workspace of workspaces) {
		    const members = [];
		    for (const id of workspace.sessionIds) {
		      const summary = list.byId[id];
		      if (summary === void 0) continue;
		      accounted.add(id);
		      if (!sessionVisible(summary, list.current, archived, showArchived)) continue;
		      members.push(summary);
		    }
		    groups.push(buildGroup(workspace.workspaceId, workspace.workspaceId, workspace.path, Date.parse(workspace.createdAt), workspace.title, members, "account"));
		  }
		  const stray = list.ids.map((id) => list.byId[id]).filter((s) => s !== void 0 && !accounted.has(s.id) && sessionVisible(s, list.current, archived, showArchived));
		  if (stray.length > 0) groups.push(buildGroup("", void 0, void 0, void 0, UNGROUPED_LABEL, ungroupedOrder === void 0 ? stray : orderedUngrouped(stray, ungroupedOrder), ungroupedOrder === void 0 ? "recency" : "account"));
		  return groups;
		}
		function sessionNode(s, descendants, archived) {
		  return {
		    id: s.id,
		    title: sessionTitle(s),
		    blank: s.blank,
		    running: s.running,
		    runningSubagentCount: descendants.get(s.id)?.runningCount ?? 0,
		    completed: s.completed === true,
		    updatedAt: s.updatedAt,
		    archived: archived.has(s.id),
		    ...s.pendingInteraction === void 0 ? {} : { pendingInteraction: s.pendingInteraction }
		  };
		}
		function deriveGroups(list, workspaces, archivedSessionIds, view) {
		  const archived = new Set(archivedSessionIds);
		  const expandedGroups = new Set(view.expandedGroups);
		  const descendants = (0, _deepseek_ai_dsh_client_runtime_client2.indexSubagentDescendants)(list.byId);
		  const currentGroup = list.current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(list.current))?.workspaceId ?? "";
		  const groups = [];
		  for (const g of groupByWorkspace(list, workspaces, archived, view.ungroupedOrder, view.showArchived)) {
		    const expanded = expandedGroups.has(g.key);
		    groups.push({
		      key: g.key,
		      workspaceId: g.workspaceId,
		      cwd: g.cwd,
		      createdAt: g.createdAt,
		      label: g.label,
		      sessionCount: g.sessions.length,
		      expanded,
		      containsCurrent: g.key === currentGroup,
		      sessions: expanded ? g.sessions.map((session) => sessionNode(session, descendants, archived)) : []
		    });
		  }
		  return groups;
		}
		function deriveFlat(list, archivedSessionIds, showArchived) {
		  const archived = new Set(archivedSessionIds);
		  const descendants = (0, _deepseek_ai_dsh_client_runtime_client2.indexSubagentDescendants)(list.byId);
		  const rows = [];
		  for (const id of list.ids) {
		    const s = list.byId[id];
		    if (s === void 0 || !sessionVisible(s, list.current, archived, showArchived)) continue;
		    rows.push(s);
		  }
		  rows.sort(byRecency);
		  return rows.map((session) => sessionNode(session, descendants, archived));
		}
		function deriveSearchResults(list, workspaces, query, archivedSessionIds, content, limit, showArchived) {
		  const q = query.trim().toLowerCase();
		  if (q === "") return {
		    items: [],
		    hasMore: false
		  };
		  const archived = new Set(archivedSessionIds);
		  const descendants = (0, _deepseek_ai_dsh_client_runtime_client2.indexSubagentDescendants)(list.byId);
		  const workspaceBySession = /* @__PURE__ */ new Map();
		  for (const workspace of workspaces) for (const sessionId of workspace.sessionIds) if (!workspaceBySession.has(sessionId)) workspaceBySession.set(sessionId, workspace.title);
		  const labelOf = (summary) => workspaceBySession.get(summary.id) ?? workspaceLabel(summary.cwd);
		  const contentBySession = /* @__PURE__ */ new Map();
		  for (const item of content.items) if (!contentBySession.has(item.sessionId)) contentBySession.set(item.sessionId, item);
		  const local = [];
		  for (const id of list.ids) {
		    const summary = list.byId[id];
		    if (summary === void 0 || summary.blank || !sessionVisible(summary, list.current, archived, showArchived)) continue;
		    if (sessionTitle(summary).toLowerCase().includes(q) || labelOf(summary).toLowerCase().includes(q)) local.push(summary);
		  }
		  local.sort(byRecency);
		  const ordered = [];
		  const included = /* @__PURE__ */ new Set();
		  const include = (summary) => {
		    if (included.has(summary.id)) return;
		    included.add(summary.id);
		    ordered.push(summary);
		  };
		  for (const summary of local) include(summary);
		  for (const item of content.items) {
		    const summary = list.byId[item.sessionId];
		    if (summary !== void 0 && !summary.blank && sessionVisible(summary, list.current, archived, showArchived)) include(summary);
		  }
		  return {
		    items: ordered.slice(0, limit).map((summary) => {
		      const match = contentBySession.get(summary.id);
		      return {
		        id: summary.id,
		        title: sessionTitle(summary),
		        workspace: labelOf(summary),
		        running: summary.running,
		        runningSubagentCount: descendants.get(summary.id)?.runningCount ?? 0,
		        archived: archived.has(summary.id),
		        ...summary.pendingInteraction === void 0 ? {} : { pendingInteraction: summary.pendingInteraction },
		        completed: summary.completed === true,
		        ...match === void 0 ? {} : { snippet: match.snippet }
		      };
		    }),
		    hasMore: content.hasMore || ordered.length > limit
		  };
		}
		function relativeTime(updatedAt, now) {
		  const MIN = 6e4;
		  const HOUR = 36e5;
		  const DAY = 864e5;
		  const diff = Math.max(0, now - updatedAt);
		  if (diff < MIN) return {
		    unit: "now",
		    n: 0
		  };
		  if (diff < HOUR) return {
		    unit: "minutes",
		    n: Math.floor(diff / MIN)
		  };
		  if (diff < DAY) return {
		    unit: "hours",
		    n: Math.floor(diff / HOUR)
		  };
		  if (diff < 30 * DAY) return {
		    unit: "days",
		    n: Math.floor(diff / DAY)
		  };
		  if (diff < 365 * DAY) return {
		    unit: "months",
		    n: Math.floor(diff / (30 * DAY))
		  };
		  return {
		    unit: "years",
		    n: Math.floor(diff / (365 * DAY))
		  };
		}
		
		// src/client/rows.js
		var react = __toESM(require("react"), 1);
		var react_jsx_runtime = __toESM(require("react/jsx-runtime"), 1);
		var _deepseek_ai_dsh_client_ui_primitives = __toESM(require("@deepseek-ai/dsh-client-ui-primitives"), 1);
		
		// src/client/clsx.js
		function r(e) {
		  var t, f, n = "";
		  if ("string" == typeof e || "number" == typeof e) n += e;
		  else if ("object" == typeof e) if (Array.isArray(e)) {
		    var o = e.length;
		    for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
		  } else for (f in e) e[f] && (n && (n += " "), n += f);
		  return n;
		}
		function clsx() {
		  for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
		  return n;
		}
		
		// src/client/styling.js
		var ARCHIVED_CLASSES = {
		  row: "dshse_archivedRow",
		  title: "dshse_archivedTitle",
		  badge: "dshse_archivedBadge",
		  content: "dshse_archiveCardContent",
		  meta: "dshse_archiveCardMeta",
		  actions: "dshse_archiveCardActions",
		  unarchive: "dshse_archiveCardUnarchive",
		  delete: "dshse_archiveCardDelete"
		};
		var ARCHIVED_CSS = ".YDXeBa_sessionRow.dshse_archivedRow{box-sizing:border-box;cursor:default;min-height:64px;height:auto;background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);border-radius:16px;gap:12px;margin:8px 0;padding:10px 16px}.YDXeBa_sessionRow.dshse_archivedRow:hover{background:var(--dsw-alias-button-elevated-fill);border-color:var(--dsw-alias-border-l3)}.YDXeBa_searchResultRow.dshse_archivedRow{background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);border-radius:16px;margin:8px 0;padding:10px 16px}.dshse_archivedTitle{color:var(--dsw-alias-label-primary);font-weight:600}.dshse_archivedBadge{display:none}.dshse_archiveCardContent{min-width:0;flex:1;flex-direction:column;gap:2px;display:flex}.dshse_archiveCardMeta{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.YDXeBa_sessionRow.dshse_archivedRow>.YDXeBa_time,.YDXeBa_sessionRow.dshse_archivedRow>.YDXeBa_rowActions{display:none}.dshse_archiveCardActions{align-items:center;gap:12px;display:inline-flex}.dshse_archiveCardActions button{cursor:pointer;border:none;flex:none}.dshse_archiveCardDelete{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:transparent;border-radius:8px;align-items:center;justify-content:center;display:inline-flex}.dshse_archiveCardDelete:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover)}.dshse_archiveCardUnarchive{height:32px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2)!important;border-radius:10px;padding:0 12px;font-size:13px;font-weight:600;line-height:20px}.dshse_archiveCardUnarchive:hover{background:var(--dsw-alias-interactive-bg-hover)}";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-session-enhance/Archived.module.css") + "]") === null) {
		  const tag = document.createElement("style");
		  tag.dataset.plugin = "dsh-session-enhance";
		  tag.dataset.pluginCss = "dsh-session-enhance/Archived.module.css";
		  tag.textContent = ARCHIVED_CSS;
		  document.head.appendChild(tag);
		}
		var DND_CSS = ".dshse_sessionDropTarget{outline:2px dashed var(--dsw-alias-accent-strong);outline-offset:2px;border-radius:12px;background:var(--dsw-alias-interactive-bg-hover)}";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-session-enhance/dnd.module.css") + "]") === null) {
		  const tag = document.createElement("style");
		  tag.dataset.plugin = "dsh-session-enhance";
		  tag.dataset.pluginCss = "dsh-session-enhance/dnd.module.css";
		  tag.textContent = DND_CSS;
		  document.head.appendChild(tag);
		}
		
		// src/client/rows.js
		var css$2 = '.YDXeBa_projectRow,.YDXeBa_sessionRow{cursor:pointer;user-select:none;color:var(--dsw-alias-label-primary);border-radius:8px;align-items:center;gap:6px;padding:0 8px;display:flex}.YDXeBa_projectRow:hover,.YDXeBa_sessionRow:hover,.YDXeBa_sessionRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultRow{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;min-height:48px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:8px;flex-direction:column;align-items:stretch;padding:4px 8px;display:flex}.YDXeBa_searchResultRow:hover,.YDXeBa_searchResultRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultHeading{align-items:center;min-width:0;display:flex}.YDXeBa_searchResultTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;margin-left:4px;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_searchResultMeta{align-items:center;gap:6px;min-width:0;margin-left:20px;display:flex}.YDXeBa_searchResultWorkspace,.YDXeBa_searchResultSnippet{text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:17px;overflow:hidden}.YDXeBa_searchResultWorkspace{max-width:40%;color:var(--dsw-alias-label-tertiary);flex:none}.YDXeBa_searchResultSnippet{min-width:0;color:var(--dsw-alias-label-secondary);flex:1}.YDXeBa_projectRow{box-sizing:border-box;align-items:center;height:34px}.YDXeBa_projectRow .YDXeBa_rowActions{height:20px}.YDXeBa_sessionRow{height:32px;animation:YDXeBa_row-in .15s var(--ds-ease-in-out);gap:0}.YDXeBa_sessionRow .YDXeBa_title{margin:0 6px 0 4px}.YDXeBa_flatSessionRowWithoutStatus .YDXeBa_title{margin-left:0}@keyframes YDXeBa_row-in{0%{opacity:0}}.YDXeBa_slot{width:16px;height:20px;color:var(--dsw-alias-label-tertiary);flex:none;justify-content:center;align-items:center;display:inline-flex}.YDXeBa_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.YDXeBa_folderActive{color:var(--dsw-alias-state-business-primary)}.YDXeBa_projectRow .YDXeBa_chevron{display:none}.YDXeBa_projectRow:hover .YDXeBa_chevron{display:inline-flex}.YDXeBa_projectRow:hover .YDXeBa_folder{display:none}.YDXeBa_arrow{transition:transform .15s var(--ds-ease-in-out)}.YDXeBa_arrowOpen{transform:rotate(90deg)}.YDXeBa_projectText{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.YDXeBa_title{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_renameInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);min-width:0;color:inherit;border-radius:4px;outline:none;padding:0 2px;font-size:14px;line-height:20px}.YDXeBa_sessionRow .YDXeBa_title{flex:1}.YDXeBa_meta{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow:hidden}.YDXeBa_time{color:var(--dsw-alias-label-tertiary);flex:none;font-size:12px;line-height:20px}.YDXeBa_dot{flex:none}.YDXeBa_rowActions{flex:none;align-items:center;gap:12px;display:none}.YDXeBa_projectRow:hover .YDXeBa_rowActions,.YDXeBa_sessionRow:hover .YDXeBa_rowActions,.YDXeBa_projectRow.YDXeBa_menuOpen .YDXeBa_rowActions,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_rowActions{display:inline-flex}.YDXeBa_sessionRow:hover .YDXeBa_time,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_time{display:none}.YDXeBa_projectRow.YDXeBa_menuOpen,.YDXeBa_sessionRow.YDXeBa_menuOpen{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_sessionRow.YDXeBa_dropBefore,.YDXeBa_sessionRow.YDXeBa_dropAfter{position:relative}.YDXeBa_sessionRow.YDXeBa_dropBefore:before,.YDXeBa_sessionRow.YDXeBa_dropAfter:after{content:"";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:4px}.YDXeBa_sessionRow.YDXeBa_dropBefore:before{top:-7px}.YDXeBa_sessionRow.YDXeBa_dropAfter:after{bottom:-7px}.YDXeBa_hoverContent{flex-direction:column;gap:8px;display:flex}.YDXeBa_hoverTitle{color:#fff;overflow-wrap:break-word;font-size:14px;line-height:20px}.YDXeBa_hoverPath{color:#cfd3d6;word-break:break-all;font-size:12px;line-height:16px}.YDXeBa_hoverTime{color:#cfd3d6;font-size:12px;line-height:16px}.YDXeBa_hoverStatus{color:#adb2b8;align-items:center;gap:8px;font-size:12px;line-height:20px;display:flex}.YDXeBa_iconButton{cursor:pointer;width:16px;height:16px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:4px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.YDXeBa_iconButton:hover{color:var(--dsw-alias-label-primary)}.YDXeBa_chevron{color:var(--dsw-alias-label-caption)}@media (prefers-reduced-motion:reduce){.YDXeBa_sessionRow,.YDXeBa_arrow{transition:none;animation:none}}';
		var tagId$2 = "@deepseek-ai/dsh-client-ui-workspace/Rows.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
		  const tag = document.createElement("style");
		  tag.dataset.plugin = "dsh-session-enhance";
		  tag.dataset.pluginCss = tagId$2;
		  tag.textContent = css$2;
		  document.head.appendChild(tag);
		}
		var Rows_module_css_default = {
		  "hoverTitle": "YDXeBa_hoverTitle",
		  "title": "YDXeBa_title",
		  "hoverContent": "YDXeBa_hoverContent",
		  "dropAfter": "YDXeBa_dropAfter",
		  "renameInput": "YDXeBa_renameInput",
		  "dot": "YDXeBa_dot",
		  "hoverTime": "YDXeBa_hoverTime",
		  "iconButton": "YDXeBa_iconButton",
		  "flatSessionRowWithoutStatus": "YDXeBa_flatSessionRowWithoutStatus",
		  "row-in": "YDXeBa_row-in",
		  "folder": "YDXeBa_folder",
		  "menuOpen": "YDXeBa_menuOpen",
		  "selected": "YDXeBa_selected",
		  "searchResultHeading": "YDXeBa_searchResultHeading",
		  "searchResultWorkspace": "YDXeBa_searchResultWorkspace",
		  "visuallyHidden": "YDXeBa_visuallyHidden",
		  "projectRow": "YDXeBa_projectRow",
		  "hoverStatus": "YDXeBa_hoverStatus",
		  "arrowOpen": "YDXeBa_arrowOpen",
		  "rowActions": "YDXeBa_rowActions",
		  "chevron": "YDXeBa_chevron",
		  "arrow": "YDXeBa_arrow",
		  "searchResultTitle": "YDXeBa_searchResultTitle",
		  "searchResultMeta": "YDXeBa_searchResultMeta",
		  "slot": "YDXeBa_slot",
		  "folderActive": "YDXeBa_folderActive",
		  "time": "YDXeBa_time",
		  "sessionRow": "YDXeBa_sessionRow",
		  "meta": "YDXeBa_meta",
		  "dropBefore": "YDXeBa_dropBefore",
		  "searchResultSnippet": "YDXeBa_searchResultSnippet",
		  "projectText": "YDXeBa_projectText",
		  "hoverPath": "YDXeBa_hoverPath",
		  "searchResultRow": "YDXeBa_searchResultRow"
		};
		function displayTitle(node, t) {
		  return node.blank ? t("session.new") : node.title ?? node.displayTitle ?? "";
		}
		function timeLabel(updatedAt, now, t) {
		  const { unit, n } = relativeTime(updatedAt, now);
		  return unit === "now" ? t("time.now") : t(`time.${unit}`, { n });
		}
		function archiveTimeLabel(updatedAt, t) {
		  const date = new Date(updatedAt);
		  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
		  return t("archives.timestamp", { date: t("date.ymd", { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() }), time });
		}
		function hoverTimeLabel(updatedAt, now, t) {
		  const { unit, n } = relativeTime(updatedAt, now);
		  return unit === "now" ? t("time.now") : t("time.ago", { t: t(`time.${unit}`, { n }) });
		}
		function createdLabel(createdAt, t) {
		  const d = new Date(createdAt);
		  const pad2 = (v) => String(v).padStart(2, "0");
		  return t("hover.created", {
		    time: `${t("date.ymd", {
		      y: d.getFullYear(),
		      m: d.getMonth() + 1,
		      d: d.getDate()
		    })} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
		  });
		}
		function WorkspaceHoverContent({ label, cwd, createdAt, t }) {
		  return (0, react_jsx_runtime.jsxs)("div", {
		    className: Rows_module_css_default.hoverContent,
		    children: [
		      (0, react_jsx_runtime.jsx)("div", {
		        className: Rows_module_css_default.hoverTitle,
		        children: label
		      }),
		      (0, react_jsx_runtime.jsx)("div", {
		        className: Rows_module_css_default.hoverPath,
		        children: cwd
		      }),
		      (0, react_jsx_runtime.jsx)("div", {
		        className: Rows_module_css_default.hoverTime,
		        children: createdLabel(createdAt, t)
		      })
		    ]
		  });
		}
		function rowHalf(e) {
		  const rect = e.currentTarget.getBoundingClientRect();
		  return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
		}
		function ProjectRowItem({ group, onToggle, onCreate, actions, drag, t }) {
		  const row = group;
		  const label = row.workspaceId === void 0 ? t("group.ungrouped") : row.label;
		  const active = group.expanded && group.containsCurrent;
		  const [menuOpen, setMenuOpen] = (0, react.useState)(false);
		  const workspaceMenuItems = [{
		    id: "rename",
		    label: t("rename"),
		    icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
		  }, {
		    id: "delete",
		    label: t("delete.workspace"),
		    icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
		    danger: true
		  }];
		  const ownRow = (0, react_jsx_runtime.jsxs)("div", {
		    className: clsx(Rows_module_css_default.projectRow, menuOpen && Rows_module_css_default.menuOpen),
		    role: "treeitem",
		    "aria-expanded": row.expanded,
		    onClick: onToggle,
		    draggable: drag !== void 0,
		    onDragStart: drag === void 0 ? void 0 : (e) => {
		      e.dataTransfer.effectAllowed = "move";
		      e.dataTransfer.setData("text/plain", row.key);
		      drag.start();
		    },
		    onDragEnd: drag?.end,
		    children: [
		      (0, react_jsx_runtime.jsx)("span", {
		        className: clsx(Rows_module_css_default.slot, Rows_module_css_default.folder, active && Rows_module_css_default.folderActive),
		        children: row.expanded ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpen16, {}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, {})
		      }),
		      (0, react_jsx_runtime.jsx)("span", {
		        className: clsx(Rows_module_css_default.slot, Rows_module_css_default.chevron),
		        children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTriangleRightFill14, { className: clsx(Rows_module_css_default.arrow, row.expanded && Rows_module_css_default.arrowOpen) })
		      }),
		      (0, react_jsx_runtime.jsx)("span", {
		        className: Rows_module_css_default.projectText,
		        children: (0, react_jsx_runtime.jsx)("span", {
		          className: Rows_module_css_default.title,
		          children: label
		        })
		      }),
		      (0, react_jsx_runtime.jsxs)("span", {
		        className: Rows_module_css_default.rowActions,
		        children: [actions !== void 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
		          open: menuOpen,
		          onClose: () => {
		            setMenuOpen(false);
		          },
		          items: workspaceMenuItems,
		          onSelect: (id) => {
		            setMenuOpen(false);
		            if (id !== "rename" && id !== "delete") return;
		            if (id === "rename") actions.rename();
		            else actions.delete();
		          },
		          portal: true,
		          closeOnPointerLeave: true,
		          anchor: (0, react_jsx_runtime.jsx)("button", {
		            type: "button",
		            className: Rows_module_css_default.iconButton,
		            "aria-label": t("actions.workspace.aria", { name: label }),
		            onClick: (e) => {
		              e.stopPropagation();
		              setMenuOpen((v) => !v);
		            },
		            children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
		          })
		        }), (0, react_jsx_runtime.jsx)("button", {
		          type: "button",
		          className: Rows_module_css_default.iconButton,
		          "aria-label": t("actions.newSession.aria", { name: label }),
		          onClick: (e) => {
		            e.stopPropagation();
		            onCreate();
		          },
		          children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {})
		        })]
		      })
		    ]
		  });
		  if (row.createdAt === void 0) return ownRow;
		  return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
		    anchor: ownRow,
		    content: (0, react_jsx_runtime.jsx)(WorkspaceHoverContent, {
		      label: row.label,
		      cwd: row.cwd,
		      createdAt: row.createdAt,
		      t
		    }),
		    disabled: menuOpen,
		    copyText: row.cwd,
		    copyLabel: t("copy"),
		    copiedLabel: t("hover.copied")
		  });
		}
		function assertNever(value) {
		  throw new Error(`unknown pending interaction: ${String(value)}`);
		}
		function sessionStatuses(node, t) {
		  const subagents = node.runningSubagentCount === 0 ? void 0 : {
		    state: "ongoing",
		    label: t(node.runningSubagentCount === 1 ? "status.subagentsRunning.one" : "status.subagentsRunning.other", { n: node.runningSubagentCount })
		  };
		  let pending;
		  switch (node.pendingInteraction) {
		    case "approval":
		      pending = {
		        state: "warning",
		        label: t("status.waitingApproval")
		      };
		      break;
		    case "plan-review":
		      pending = {
		        state: "warning",
		        label: t("status.planReview")
		      };
		      break;
		    case "question":
		      pending = {
		        state: "warning",
		        label: t("status.waitingAnswer")
		      };
		      break;
		    case void 0:
		      break;
		    /* v8 ignore next -- closed PendingInteractionStatus union */
		    default:
		      return assertNever(node.pendingInteraction);
		  }
		  if (pending !== void 0) return subagents === void 0 ? [pending] : [pending, subagents];
		  if (node.running) {
		    const primary = {
		      state: "ongoing",
		      label: t("status.running")
		    };
		    return subagents === void 0 ? [primary] : [primary, subagents];
		  }
		  if (subagents !== void 0) return [subagents];
		  if (node.completed) return [{
		    state: "done",
		    label: t("status.completed")
		  }];
		  return [{
		    state: "done",
		    label: t("status.idle")
		  }];
		}
		function SessionStatusDots({ statuses }) {
		  return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
		    children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: statuses[0].state }), statuses.map((status) => (0, react_jsx_runtime.jsx)("span", {
		      className: Rows_module_css_default.visuallyHidden,
		      children: status.label
		    }, status.label))]
		  });
		}
		function SessionHoverContent({ node, now, t }) {
		  const statuses = sessionStatuses(node, t);
		  return (0, react_jsx_runtime.jsxs)("div", {
		    className: Rows_module_css_default.hoverContent,
		    children: [
		      (0, react_jsx_runtime.jsx)("div", {
		        className: Rows_module_css_default.hoverTitle,
		        children: displayTitle(node, t)
		      }),
		      !node.blank && (0, react_jsx_runtime.jsx)("div", {
		        className: Rows_module_css_default.hoverTime,
		        children: hoverTimeLabel(node.updatedAt, now, t)
		      }),
		      statuses.map((status) => (0, react_jsx_runtime.jsxs)("div", {
		        className: Rows_module_css_default.hoverStatus,
		        children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: status.state }), (0, react_jsx_runtime.jsx)("span", { children: status.label })]
		      }, status.label))
		    ]
		  });
		}
		function SearchResultItem({ result, currentId, onOpen, t }) {
		  const selected = result.id === currentId;
		  const statuses = sessionStatuses(result, t);
		  const primaryStatus = statuses[0];
		  return (0, react_jsx_runtime.jsxs)("button", {
		    type: "button",
		    className: clsx(Rows_module_css_default.searchResultRow, selected && Rows_module_css_default.selected, result.archived === true && ARCHIVED_CLASSES.row),
		    role: "treeitem",
		    "aria-selected": selected,
		    onClick: () => {
		      onOpen(result.id);
		    },
		    children: [(0, react_jsx_runtime.jsxs)("span", {
		      className: Rows_module_css_default.searchResultHeading,
		      children: [(0, react_jsx_runtime.jsx)("span", {
		        className: Rows_module_css_default.slot,
		        children: (primaryStatus.state !== "done" || result.completed) && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
		      }), result.archived === true && (0, react_jsx_runtime.jsx)("span", {
		        className: ARCHIVED_CLASSES.badge,
		        children: t("archived.badge")
		      }), (0, react_jsx_runtime.jsx)("span", {
		        className: clsx(Rows_module_css_default.searchResultTitle, result.archived === true && ARCHIVED_CLASSES.title),
		        children: result.title
		      })]
		    }), (0, react_jsx_runtime.jsxs)("span", {
		      className: Rows_module_css_default.searchResultMeta,
		      children: [(0, react_jsx_runtime.jsx)("span", {
		        className: Rows_module_css_default.searchResultWorkspace,
		        children: result.workspace
		      }), result.snippet !== void 0 && (0, react_jsx_runtime.jsx)("span", {
		        className: Rows_module_css_default.searchResultSnippet,
		        children: result.snippet
		      })]
		    })]
		  });
		}
		function SessionNodeItem({ node, currentId, now, onOpen, onRename, onFork, onArchive, onUnarchive, onCopySessionId, onDeleteSession, drag, flat = false, t }) {
		  const row = node;
		  const title = displayTitle(node, t);
		  const selected = node.id === currentId;
		  const archived = row.archived === true;
		  const statuses = sessionStatuses(node, t);
		  const showStatus = statuses[0].state !== "done" || row.completed;
		  const [menuOpen, setMenuOpen] = (0, react.useState)(false);
		  const sessionMenuItems = archived ? [
		    {
		      id: "unarchive",
		      label: t("menu.unarchive"),
		      icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
		    },
		    {
		      id: "copy-id",
		      label: t("menu.copySessionId"),
		      icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutline16, {})
		    },
		    {
		      id: "delete-session",
		      label: t("menu.deleteSession"),
		      icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
		      danger: true
		    }
		  ] : [
		    {
		      id: "rename",
		      label: t("rename"),
		      icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
		    },
		    {
		      id: "fork",
		      label: t("menu.fork"),
		      icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {})
		    },
		    {
		      id: "archive",
		      label: t("menu.archiveSession"),
		      icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
		    },
		    {
		      id: "copy-id",
		      label: t("menu.copySessionId"),
		      icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutline16, {})
		    },
		    {
		      id: "delete-session",
		      label: t("menu.deleteSession"),
		      icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
		      danger: true
		    }
		  ];
		  return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
		    anchor: (0, react_jsx_runtime.jsxs)("div", {
		      className: clsx(Rows_module_css_default.sessionRow, selected && Rows_module_css_default.selected, menuOpen && Rows_module_css_default.menuOpen, flat && !showStatus && Rows_module_css_default.flatSessionRowWithoutStatus, archived && ARCHIVED_CLASSES.row, drag?.marker === "before" && Rows_module_css_default.dropBefore, drag?.marker === "after" && Rows_module_css_default.dropAfter),
		      role: "treeitem",
		      "aria-selected": selected,
		      onClick: () => {
		        if (archived) return;
		        onOpen(node.id);
		      },
		      draggable: drag !== void 0,
		      onDragStart: drag === void 0 ? void 0 : (e) => {
		        e.dataTransfer.effectAllowed = "move";
		        e.dataTransfer.setData("text/plain", node.id);
		        drag.start();
		      },
		      onDragEnd: drag?.end,
		      onDragOver: drag === void 0 ? void 0 : (e) => {
		        if (!drag.active) return;
		        e.preventDefault();
		        e.dataTransfer.dropEffect = "move";
		        drag.hover(rowHalf(e));
		      },
		      onDrop: drag === void 0 ? void 0 : (e) => {
		        if (!drag.active) return;
		        e.preventDefault();
		        drag.drop(rowHalf(e));
		      },
		      children: [
		        (!flat || showStatus) && (0, react_jsx_runtime.jsx)("span", {
		          className: Rows_module_css_default.slot,
		          children: showStatus && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
		        }),
		        archived && (0, react_jsx_runtime.jsx)("span", {
		          className: ARCHIVED_CLASSES.badge,
		          children: t("archived.badge")
		        }),
		        archived ? (0, react_jsx_runtime.jsxs)("span", {
		          className: ARCHIVED_CLASSES.content,
		          children: [(0, react_jsx_runtime.jsx)("span", {
		            className: clsx(Rows_module_css_default.title, ARCHIVED_CLASSES.title),
		            children: title
		          }), !row.blank && (0, react_jsx_runtime.jsx)("span", {
		            className: ARCHIVED_CLASSES.meta,
		            children: timeLabel(row.updatedAt, now, t)
		          })]
		        }) : (0, react_jsx_runtime.jsx)("span", {
		          className: Rows_module_css_default.title,
		          children: title
		        }),
		        !row.blank && (0, react_jsx_runtime.jsx)("span", {
		          className: Rows_module_css_default.time,
		          children: timeLabel(row.updatedAt, now, t)
		        }),
		        archived && !row.blank && (0, react_jsx_runtime.jsxs)("span", {
		          className: ARCHIVED_CLASSES.actions,
		          onClick: (e) => {
		            e.stopPropagation();
		          },
		          children: [(0, react_jsx_runtime.jsx)("button", {
		            type: "button",
		            className: ARCHIVED_CLASSES.delete,
		            "aria-label": t("menu.deleteSession"),
		            onClick: () => onDeleteSession(node.id, row.title),
		            children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {})
		          }), (0, react_jsx_runtime.jsx)("button", {
		            type: "button",
		            className: ARCHIVED_CLASSES.unarchive,
		            onClick: () => onUnarchive(node.id),
		            children: t("menu.unarchive")
		          })]
		        }),
		        !row.blank && (0, react_jsx_runtime.jsx)("span", {
		          className: Rows_module_css_default.rowActions,
		          children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
		            open: menuOpen,
		            onClose: () => {
		              setMenuOpen(false);
		            },
		            items: sessionMenuItems,
		            onSelect: (id) => {
		              setMenuOpen(false);
		              if (id === "rename") onRename(node.id, row.title);
		              if (id === "fork") onFork(node.id);
		              if (id === "archive") onArchive(node.id);
		              if (id === "unarchive") onUnarchive(node.id);
		              if (id === "copy-id") onCopySessionId(node.id);
		              if (id === "delete-session") onDeleteSession(node.id, row.title);
		            },
		            portal: true,
		            closeOnPointerLeave: true,
		            anchor: (0, react_jsx_runtime.jsx)("button", {
		              type: "button",
		              className: Rows_module_css_default.iconButton,
		              "aria-label": t("actions.session.aria", { name: title }),
		              onClick: (e) => {
		                e.stopPropagation();
		                setMenuOpen((v) => !v);
		              },
		              children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
		            })
		          })
		        })
		      ]
		    }),
		    content: (0, react_jsx_runtime.jsx)(SessionHoverContent, {
		      node,
		      now,
		      t
		    }),
		    disabled: menuOpen || drag?.active === true,
		    copyText: row.blank ? void 0 : row.title,
		    copyLabel: t("copy"),
		    copiedLabel: t("hover.copied")
		  });
		}
		
		// src/client/settings.js
		function projectKey(cwd) {
		  if (!cwd) return "_no-cwd";
		  let readable = "";
		  let separatorRun = false;
		  for (const ch of cwd) {
		    if (ch === "/" || ch === "\\" || ch === ":") {
		      if (!separatorRun) readable += "-";
		      separatorRun = true;
		    } else {
		      readable += ch;
		      separatorRun = false;
		    }
		  }
		  return `--${(readable.replace(/^-+/, "") || "root").slice(0, 251)}--`;
		}
		function emptyDirLabel(name) {
		  if (typeof name !== "string") return name;
		  const core = name.replace(/^--/, "").replace(/--$/, "");
		  const last = core.split("-").filter(Boolean).pop();
		  return last || name;
		}
		function EyeIcon() {
		  return (0, react_jsx_runtime2.jsxs)("svg", {
		    width: 16,
		    height: 16,
		    viewBox: "0 0 16 16",
		    fill: "none",
		    "aria-hidden": true,
		    children: [(0, react_jsx_runtime2.jsx)("path", {
		      d: "M1.5 8S4.2 3.5 8 3.5 14.5 8 14.5 8 11.8 12.5 8 12.5 1.5 8 1.5 8Z",
		      stroke: "currentColor",
		      strokeWidth: "1.3",
		      strokeLinecap: "round",
		      strokeLinejoin: "round"
		    }), (0, react_jsx_runtime2.jsx)("circle", {
		      cx: "8",
		      cy: "8",
		      r: "1.8",
		      stroke: "currentColor",
		      strokeWidth: "1.3"
		    })]
		  });
		}
		function RestoreIcon() {
		  return (0, react_jsx_runtime2.jsxs)("svg", {
		    width: 16,
		    height: 16,
		    viewBox: "0 0 16 16",
		    fill: "none",
		    "aria-hidden": true,
		    children: [(0, react_jsx_runtime2.jsx)("path", {
		      d: "M6 10.5 2.5 7 6 3.5",
		      stroke: "currentColor",
		      strokeWidth: "1.3",
		      strokeLinecap: "round",
		      strokeLinejoin: "round"
		    }), (0, react_jsx_runtime2.jsx)("path", {
		      d: "M2.5 7h6.5a4 4 0 0 1 0 8H7",
		      stroke: "currentColor",
		      strokeWidth: "1.3",
		      strokeLinecap: "round",
		      strokeLinejoin: "round"
		    })]
		  });
		}
		function RestoreAllIcon() {
		  return (0, react_jsx_runtime2.jsxs)("svg", {
		    width: 16,
		    height: 16,
		    viewBox: "0 0 16 16",
		    fill: "none",
		    "aria-hidden": true,
		    children: [(0, react_jsx_runtime2.jsx)("path", {
		      d: "M5.5 8.5 2.5 5.5 5.5 2.5",
		      stroke: "currentColor",
		      strokeWidth: "1.3",
		      strokeLinecap: "round",
		      strokeLinejoin: "round"
		    }), (0, react_jsx_runtime2.jsx)("path", {
		      d: "M2.5 5.5h5.5a3.5 3.5 0 0 1 0 7",
		      stroke: "currentColor",
		      strokeWidth: "1.3",
		      strokeLinecap: "round",
		      strokeLinejoin: "round"
		    }), (0, react_jsx_runtime2.jsx)("path", {
		      d: "M10 13 7 10l3-3",
		      stroke: "currentColor",
		      strokeWidth: "1.3",
		      strokeLinecap: "round",
		      strokeLinejoin: "round"
		    }), (0, react_jsx_runtime2.jsx)("path", {
		      d: "M7 10h5.5a3.5 3.5 0 0 1 0 7",
		      stroke: "currentColor",
		      strokeWidth: "1.3",
		      strokeLinecap: "round",
		      strokeLinejoin: "round"
		    })]
		  });
		}
		function systemMessageLabel(message, t) {
		  if (message.label !== void 0) return message.label;
		  if (message.tag === "tool-call") return message.name !== void 0 ? t("archives.previewToolCallName", { name: message.name }) : t("archives.previewToolCall");
		  if (message.tag === "tool") return message.name !== void 0 ? t("archives.previewToolResultName", { name: message.name }) : t("archives.previewToolResult");
		  return t("archives.previewContext");
		}
		function groupPreviewTurns(messages) {
		  const turns = [];
		  let current = null;
		  for (const message of messages) {
		    if (message.kind === "user") {
		      current = { user: message, items: [message] };
		      turns.push(current);
		    } else if (current !== null) {
		      current.items.push(message);
		    } else {
		      current = { user: null, items: [message] };
		      turns.push(current);
		    }
		  }
		  return turns;
		}
		function buildTurnBlocks(items) {
		  const blocks = [];
		  for (const message of items) {
		    if (message.kind === "system") {
		      const last = blocks[blocks.length - 1];
		      if (last !== void 0 && last.kind === "system-group") {
		        last.messages.push(message);
		      } else {
		        const previous = last;
		        blocks.push({ kind: "system-group", messages: [message], align: previous !== void 0 && previous.kind === "user" ? "right" : "left" });
		      }
		    } else {
		      blocks.push({ kind: message.kind, message });
		    }
		  }
		  return blocks;
		}
		function UserAvatarIcon({ className }) {
		  return (0, react_jsx_runtime2.jsxs)("svg", {
		    width: 22,
		    height: 22,
		    viewBox: "0 0 22 22",
		    className,
		    "aria-hidden": true,
		    children: [(0, react_jsx_runtime2.jsx)("circle", { cx: "11", cy: "11", r: "11", fill: "currentColor", opacity: "0.16" }), (0, react_jsx_runtime2.jsx)("circle", { cx: "11", cy: "8.6", r: "3", fill: "currentColor" }), (0, react_jsx_runtime2.jsx)("path", { d: "M4.4 19.2c.9-3.1 3.4-4.8 6.6-4.8s5.7 1.7 6.6 4.8", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round" })]
		  });
		}
		function AssistantAvatarIcon({ className }) {
		  return (0, react_jsx_runtime2.jsx)("span", {
		    className,
		    "aria-hidden": true,
		    children: (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.FishLogo, { size: 16 })
		  });
		}
		function PreviewMessageLine({ message, isUser, toggle, collapsed, t }) {
		  const timeLabel2 = typeof message.time === "number" ? archiveTimeLabel(message.time, t) : null;
		  const bubble = (0, react_jsx_runtime2.jsx)("div", {
		    className: isUser && collapsed ? "dshse_previewBubble dshse_previewBubbleCollapsed" : "dshse_previewBubble",
		    children: (0, react_jsx_runtime2.jsx)("div", { className: "dshse_previewText", children: message.text })
		  });
		  const avatarEl = isUser ? (0, react_jsx_runtime2.jsx)(UserAvatarIcon, { className: "dshse_previewAvatarUser" }) : (0, react_jsx_runtime2.jsx)(AssistantAvatarIcon, { className: "dshse_previewAvatarAssistant" });
		  const lineChildren = isUser ? [bubble, toggle, avatarEl] : [avatarEl, bubble];
		  return (0, react_jsx_runtime2.jsxs)("div", {
		    className: isUser ? "dshse_previewMsg dshse_previewMsgUser" : "dshse_previewMsg dshse_previewMsgAssistant",
		    children: [(0, react_jsx_runtime2.jsx)("div", { className: "dshse_previewMsgLine", children: lineChildren }), timeLabel2 !== null ? (0, react_jsx_runtime2.jsx)("div", { className: "dshse_previewMsgTime", children: timeLabel2 }) : null]
		  });
		}
		function PreviewSystemRow({ messages, align, t }) {
		  return (0, react_jsx_runtime2.jsx)("div", {
		    className: align === "right" ? "dshse_previewSystem dshse_previewSystemRight" : "dshse_previewSystem dshse_previewSystemLeft",
		    children: messages.map((message, index) => (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.Tooltip, {
		      label: message.text,
		      side: "bottom",
		      maxWidth: 360,
		      children: (0, react_jsx_runtime2.jsxs)("span", {
		        className: "dshse_previewTag",
		        children: [(0, react_jsx_runtime2.jsx)("span", { className: "dshse_previewTagDot" }), (0, react_jsx_runtime2.jsx)("span", { className: "dshse_previewTagLabel", children: systemMessageLabel(message, t) })]
		      })
		    }, index))
		  });
		}
		function PreviewTurn({ turn, t }) {
		  const [collapsed, setCollapsed] = (0, react2.useState)(false);
		  const blocks = (0, react2.useMemo)(() => buildTurnBlocks(turn.items), [turn.items]);
		  const canCollapse = turn.user !== null;
		  const userBlock = blocks.find((block) => block.kind === "user");
		  const restBlocks = blocks.filter((block) => block.kind !== "user");
		  const toggle = canCollapse ? (0, react_jsx_runtime2.jsx)("button", {
		    type: "button",
		    className: "dshse_previewToggle",
		    "aria-expanded": !collapsed,
		    "aria-label": collapsed ? t("archives.expandTurn") : t("archives.collapseTurn"),
		    onClick: () => setCollapsed((current) => !current),
		    children: (0, react_jsx_runtime2.jsx)("span", {
		      className: collapsed ? "dshse_previewToggleIcon dshse_previewToggleIconCollapsed" : "dshse_previewToggleIcon",
		      children: (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconChevronDownOutline14, {})
		    })
		  }) : null;
		  return (0, react_jsx_runtime2.jsxs)("div", {
		    className: "dshse_previewTurn",
		    children: [userBlock !== void 0 ? (0, react_jsx_runtime2.jsx)(PreviewMessageLine, { message: userBlock.message, isUser: true, toggle, collapsed, t }) : null, restBlocks.length > 0 ? (0, react_jsx_runtime2.jsx)("div", {
		      className: collapsed ? "dshse_previewTurnBody dshse_previewTurnBodyCollapsed" : "dshse_previewTurnBody",
		      children: (0, react_jsx_runtime2.jsx)("div", {
		        className: "dshse_previewTurnBodyInner",
		        children: restBlocks.map((block, index) => block.kind === "system-group" ? (0, react_jsx_runtime2.jsx)(PreviewSystemRow, { messages: block.messages, align: block.align, t }, index) : (0, react_jsx_runtime2.jsx)(PreviewMessageLine, { message: block.message, isUser: false, t }, index))
		      })
		    }) : null]
		  });
		}
		var ARCHIVE_SETTINGS_CSS = ".dshse_settings{box-sizing:border-box;width:min(100%,760px);margin:0 auto;padding:0 0 32px;color:var(--dsw-alias-label-primary)}.dshse_settingsHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}.dshse_settings h2{margin:0;font-size:20px;font-weight:650;letter-spacing:-.2px;line-height:28px}.dshse_settingsIntro{margin:4px 0 0;max-width:42em;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.dshse_settingsDanger{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 12px;color:var(--dsw-alias-state-error-primary);background:transparent;border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dshse_settingsDanger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 20%,transparent)}.dshse_settingsToolbar{display:flex;gap:8px;margin-bottom:16px}.dshse_settingsSearch{display:flex;align-items:center;gap:8px;min-width:0;flex:1;height:32px;padding:0 12px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));border:1px solid var(--dsw-alias-border-l2);border-radius:8px}.dshse_settingsSearch:focus-within{border-color:var(--dsw-alias-label-tertiary)}.dshse_settingsSearch input{width:100%;min-width:0;padding:0;color:var(--dsw-alias-label-primary);background:transparent;border:0;outline:0;font:inherit;font-size:12px}.dshse_settingsSearch input::placeholder{color:var(--dsw-alias-label-tertiary)}.dshse_settingsFilter{position:relative;min-width:168px;flex:none}.dshse_selectTrigger{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:32px;padding:0 10px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;line-height:20px;text-align:left}.dshse_selectTrigger:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshse_selectTrigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dshse_selectTrigger[aria-expanded='true']{border-color:var(--dsw-alias-label-primary)}.dshse_selectValue{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dshse_selectCaret{flex:none;width:12px;height:12px;color:var(--dsw-alias-label-tertiary)}.dshse_selectMenu{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;box-sizing:border-box;min-width:100%;max-height:280px;overflow:auto;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));box-shadow:var(--dsw-shadow-lv3)}.dshse_selectOption{box-sizing:border-box;display:flex;align-items:center;width:100%;min-height:32px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}.dshse_selectOption:hover,.dshse_selectOption[data-active='true']{background:var(--dsw-alias-interactive-bg-hover)}.dshse_selectOption[aria-selected='true']{color:var(--dsw-alias-label-primary)}.dshse_settingsGroup{margin:0 0 20px}.dshse_settingsGroupHeading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px}.dshse_settingsGroupTitle{display:flex;align-items:center;gap:8px;min-width:0;margin:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.dshse_settingsGroupTitle svg{flex:none;color:var(--dsw-alias-label-secondary)}.dshse_settingsCount{flex:none;color:var(--dsw-alias-label-tertiary);font-size:12px}.dshse_settingsList{overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-button-elevated-fill))}.dshse_settingsRow{display:flex;align-items:center;gap:12px;min-height:60px;padding:10px 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dshse_settingsRow:last-child{border-bottom:0}.dshse_settingsContent{min-width:0;flex:1}.dshse_settingsTitle{overflow:hidden;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:18px;text-overflow:ellipsis;white-space:nowrap}.dshse_settingsMeta{margin-top:2px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px}.dshse_settingsActions{display:flex;align-items:center;gap:8px}.dshse_settingsAction{min-height:32px;padding:0 12px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dshse_settingsAction:hover{filter:brightness(1.12)}.dshse_settingsDelete{display:flex;align-items:center;justify-content:center;width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dshse_settingsDelete:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsEmpty{padding:28px 8px;color:var(--dsw-alias-label-secondary);text-align:center}.dshse_settingsError{margin-top:10px;color:var(--dsw-alias-state-error-primary);font-size:12px}@media(max-width:720px){.dshse_settings{width:100%;margin:28px auto 48px;padding:0 16px}.dshse_settingsHeader{margin-bottom:28px}.dshse_settingsToolbar{flex-wrap:wrap;margin-bottom:28px}.dshse_settingsSearch{flex-basis:100%}.dshse_settingsFilter{flex:1;min-width:0}.dshse_settingsGroup{margin-bottom:32px}.dshse_settingsRow{padding:10px 12px}.dshse_settingsActions{gap:4px}}";
		var ARCHIVE_SETTINGS_BATCH_CSS = ".dshse_settingsHeaderActions,.dshse_settingsGroupMeta{display:flex;align-items:center;gap:8px;flex:none}.dshse_settingsRestoreAll{display:inline-flex;align-items:center;min-height:32px;padding:0 12px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dshse_settingsRestoreAll:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsRestoreAll:disabled,.dshse_settingsDanger:disabled,.dshse_settingsGroupMenu:disabled{cursor:not-allowed;opacity:.5}.dshse_settingsGroupMenu{display:flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dshse_settingsGroupMenu:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsStatus{margin-top:10px;color:var(--dsw-alias-label-secondary);font-size:12px}@media(max-width:720px){.dshse_settingsHeader{flex-direction:column}.dshse_settingsHeaderActions{align-self:flex-end}}";
		var ARCHIVE_PREVIEW_CSS = ".dshse_settingsIconButton{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dshse_settingsIconButton:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsIconButton:disabled{cursor:not-allowed;opacity:.5}.dshse_redIcon{color:var(--dsw-alias-state-error-primary)}.dshse_previewModal{width:min(760px,100%)!important}.dshse_previewBody{box-sizing:border-box;max-height:min(66vh,600px);overflow:auto;padding:12px 4px;display:flex;flex-direction:column;gap:14px}.dshse_previewTurn{display:flex;flex-direction:column;gap:8px}.dshse_previewTurnBody{display:grid;grid-template-rows:1fr;opacity:1;transition:grid-template-rows .18s ease,opacity .12s ease .08s}.dshse_previewTurnBodyCollapsed{grid-template-rows:0fr;opacity:0;transition:opacity .12s ease,grid-template-rows .18s ease .12s}.dshse_previewTurnBodyInner{min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:8px}.dshse_previewToggle{display:inline-flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;margin-top:2px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));color:var(--dsw-alias-label-primary);cursor:pointer}.dshse_previewToggle:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-label-dimmed)}.dshse_previewToggleIcon{display:inline-flex;transition:transform .2s ease}.dshse_previewToggleIconCollapsed{transform:rotate(-90deg)}.dshse_previewMsg{display:flex;flex-direction:column;gap:4px;max-width:82%}.dshse_previewMsgUser{align-self:flex-end;align-items:flex-end}.dshse_previewMsgAssistant{align-self:flex-start;align-items:flex-start}.dshse_previewMsgLine{display:flex;align-items:flex-start;gap:8px;min-width:0}.dshse_previewAvatarUser{flex:none;display:block;color:var(--dsw-alias-state-business-primary)}.dshse_previewAvatarAssistant{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:color-mix(in srgb,var(--dsw-alias-label-primary) 14%,transparent);color:var(--dsw-alias-label-primary)}.dshse_previewBubble{box-sizing:border-box;min-width:0;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill))}.dshse_previewMsgUser .dshse_previewBubble{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,var(--dsw-alias-bg-layer-2,transparent));border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 28%,var(--dsw-alias-border-l2))}.dshse_previewText{white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.6}.dshse_previewBubbleCollapsed .dshse_previewText{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dshse_previewMsgTime{color:var(--dsw-alias-label-tertiary);font-size:11px}.dshse_previewSystem{display:flex;flex-wrap:nowrap;gap:6px;padding:2px 0;max-width:100%;overflow-x:auto}.dshse_previewSystemLeft{justify-content:flex-start}.dshse_previewSystemRight{justify-content:flex-end}.dshse_previewTag{display:inline-flex;align-items:center;gap:5px;flex:none;max-width:240px;min-height:20px;padding:1px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;cursor:default}.dshse_previewTag:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.dshse_previewTagDot{flex:none;width:4px;height:4px;border-radius:50%;background:var(--dsw-alias-label-tertiary)}.dshse_previewTag:hover .dshse_previewTagDot{background:var(--dsw-alias-label-primary)}.dshse_previewTagLabel{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dshse_previewEmpty{padding:24px 8px;color:var(--dsw-alias-label-secondary);text-align:center}";
		var ARCHIVE_SETTINGS_LAYOUT_OVERRIDE = ".dshse_settings{margin:0 auto!important}@media(max-width:720px){.dshse_settings{margin:0 auto!important}}";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-session-enhance/ArchiveSettings.layout.css") + "]") === null) {
		  const tag = document.createElement("style");
		  tag.dataset.plugin = "dsh-session-enhance";
		  tag.dataset.pluginCss = "dsh-session-enhance/ArchiveSettings.layout.css";
		  tag.textContent = ARCHIVE_SETTINGS_LAYOUT_OVERRIDE;
		  document.head.appendChild(tag);
		}
		var ENHANCE_NAV_SPARKLE_PATH = "M10 2L11.697 8.303L18 10L11.697 11.697L10 18L8.303 11.697L2 10L8.303 8.303ZM15.5 13L16.03 14.97L18 15.5L16.03 16.03L15.5 18L14.97 16.03L13 15.5L14.97 14.97Z";
		function installEnhanceNavIconSwap() {
		  if (typeof document === "undefined") return () => {
		  };
		  const labels = new Set([zh["settings.manageTitle"], en["settings.manageTitle"]].filter(Boolean));
		  const apply2 = () => {
		    for (const button of document.querySelectorAll("button")) {
		      if (button.dataset.dshseNavIconPatched === "1") continue;
		      if (button.querySelector(":scope > span") === null || button.querySelector(":scope > svg") === null) continue;
		      if (!labels.has(button.textContent.replace(/\s+/g, " ").trim())) continue;
		      const svg = button.querySelector(":scope > svg");
		      const replacement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		      replacement.setAttribute("width", svg.getAttribute("width") ?? "16");
		      replacement.setAttribute("height", svg.getAttribute("height") ?? "16");
		      replacement.setAttribute("viewBox", "0 0 20 20");
		      replacement.setAttribute("fill", "none");
		      replacement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
		      const className = svg.getAttribute("class");
		      if (className !== null) replacement.setAttribute("class", className);
		      replacement.innerHTML = `<path fill="currentColor" d="${ENHANCE_NAV_SPARKLE_PATH}"/>`;
		      svg.replaceWith(replacement);
		      button.dataset.dshseNavIconPatched = "1";
		    }
		  };
		  apply2();
		  const observer = new MutationObserver(apply2);
		  observer.observe(document.body, { childList: true, subtree: true });
		  return () => observer.disconnect();
		}
		function ArchiveProjectSelect({ id, value, options, onChange, "aria-label": ariaLabel }) {
		  const [open, setOpen] = (0, react2.useState)(false);
		  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
		  const [active, setActive] = (0, react2.useState)(selectedIndex);
		  const rootRef = (0, react2.useRef)(null);
		  const triggerRef = (0, react2.useRef)(null);
		  const listRef = (0, react2.useRef)(null);
		  const wasOpen = (0, react2.useRef)(false);
		  const selected = options[selectedIndex];
		  (0, react2.useEffect)(() => {
		    if (!open) return;
		    setActive(selectedIndex);
		    const onPointerDown = (event) => {
		      const target = event.target;
		      if (target instanceof Node && rootRef.current?.contains(target) === true) return;
		      setOpen(false);
		    };
		    document.addEventListener("pointerdown", onPointerDown);
		    return () => document.removeEventListener("pointerdown", onPointerDown);
		  }, [open, selectedIndex]);
		  (0, react2.useEffect)(() => {
		    if (open) {
		      listRef.current?.focus();
		      wasOpen.current = true;
		      return;
		    }
		    if (wasOpen.current) {
		      triggerRef.current?.focus();
		      wasOpen.current = false;
		    }
		  }, [open]);
		  (0, react2.useEffect)(() => {
		    if (!open) return;
		    document.getElementById(id + "-opt-" + String(active))?.scrollIntoView({ block: "nearest" });
		  }, [active, open, id]);
		  const choose = (next) => {
		    onChange(next);
		    setOpen(false);
		  };
		  const move = (next) => {
		    if (options.length === 0) return;
		    setActive(Math.min(options.length - 1, Math.max(0, next)));
		  };
		  return (0, react_jsx_runtime2.jsxs)("div", {
		    className: "dshse_settingsFilter",
		    ref: rootRef,
		    children: [(0, react_jsx_runtime2.jsxs)("button", {
		      id,
		      ref: triggerRef,
		      type: "button",
		      className: "dshse_selectTrigger",
		      "aria-label": ariaLabel,
		      "aria-haspopup": "listbox",
		      "aria-expanded": open,
		      "aria-controls": id + "-list",
		      onClick: () => setOpen((current) => !current),
		      onKeyDown: (event) => {
		        if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
		          event.preventDefault();
		          setOpen(true);
		        }
		      },
		      children: [(0, react_jsx_runtime2.jsx)("span", { className: "dshse_selectValue", children: selected === void 0 ? "" : selected.label }), (0, react_jsx_runtime2.jsx)("svg", {
		        className: "dshse_selectCaret",
		        viewBox: "0 0 12 12",
		        "aria-hidden": true,
		        focusable: false,
		        children: (0, react_jsx_runtime2.jsx)("path", {
		          d: "M2.5 4.5L6 8l3.5-3.5",
		          fill: "none",
		          stroke: "currentColor",
		          strokeWidth: "1.5",
		          strokeLinecap: "round",
		          strokeLinejoin: "round"
		        })
		      })]
		    }), open ? (0, react_jsx_runtime2.jsx)("div", {
		      id: id + "-list",
		      ref: listRef,
		      className: "dshse_selectMenu",
		      role: "listbox",
		      tabIndex: 0,
		      "aria-activedescendant": id + "-opt-" + String(active),
		      onKeyDown: (event) => {
		        if (event.key === "ArrowDown") {
		          event.preventDefault();
		          move(active + 1);
		          return;
		        }
		        if (event.key === "ArrowUp") {
		          event.preventDefault();
		          move(active - 1);
		          return;
		        }
		        if (event.key === "Home") {
		          event.preventDefault();
		          move(0);
		          return;
		        }
		        if (event.key === "End") {
		          event.preventDefault();
		          move(options.length - 1);
		          return;
		        }
		        if (event.key === "Enter" || event.key === " ") {
		          event.preventDefault();
		          const option = options[active];
		          if (option !== void 0) choose(option.value);
		          return;
		        }
		        if (event.key === "Escape" || event.key === "Tab") {
		          event.preventDefault();
		          event.stopPropagation();
		          if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
		          setOpen(false);
		        }
		      },
		      children: options.map((option, index) => (0, react_jsx_runtime2.jsx)("button", {
		        id: id + "-opt-" + String(index),
		        type: "button",
		        role: "option",
		        className: "dshse_selectOption",
		        "aria-selected": option.value === value,
		        "data-active": index === active,
		        onMouseEnter: () => setActive(index),
		        onClick: () => choose(option.value),
		        children: option.label
		      }, option.value === "all" ? "all" : option.value))
		    }) : null]
		  });
		}
		function ArchivedGroupActions({ group, busy, allArchived, onRestore, onDelete, onDeleteWorkspace, t }) {
		  const [open, setOpen] = (0, react2.useState)(false);
		  const ungrouped = group.key === ARCHIVE_UNGROUPED_KEY;
		  const items = [{
		    id: "restore",
		    label: t(ungrouped ? "archives.restoreUngrouped" : "archives.restoreProject"),
		    icon: (0, react_jsx_runtime2.jsx)(RestoreAllIcon, {})
		  }, {
		    id: "delete",
		    label: t(ungrouped ? "archives.deleteUngrouped" : "archives.deleteProject"),
		    icon: (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconTrashOutline16, {}),
		    danger: true
		  }];
		  if (!ungrouped && allArchived) {
		    items.push({
		      type: "separator",
		      id: "delete-workspace-separator"
		    }, {
		      id: "deleteWorkspace",
		      label: t("delete.workspace"),
		      icon: (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconCloseFill14, { className: "dshse_redIcon" }),
		      danger: true
		    });
		  }
		  return (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.Menu, {
		    open,
		    onClose: () => setOpen(false),
		    items,
		    onSelect: (id) => {
		      setOpen(false);
		      if (id === "restore") onRestore();
		      else if (id === "delete") onDelete();
		      else if (id === "deleteWorkspace") onDeleteWorkspace();
		    },
		    portal: true,
		    anchor: (0, react_jsx_runtime2.jsx)("button", {
		      type: "button",
		      className: "dshse_settingsGroupMenu",
		      disabled: busy,
		      "aria-label": t(ungrouped ? "archives.ungroupedActions" : "archives.projectActions", { name: group.title }),
		      onClick: () => setOpen((current) => !current),
		      children: (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconEllipsisOutline16, {})
		    })
		  });
		}
		var ARCHIVE_UNGROUPED_KEY = "__ungrouped__";
		function archivedBatchTargetForGroup(groupKey) {
		  return groupKey === ARCHIVE_UNGROUPED_KEY ? { scope: "ungrouped" } : { scope: "workspace", workspaceId: groupKey };
		}
		function deriveArchivedBatchIds(archivedSessionIds, items, target) {
		  const ids = [...new Set((archivedSessionIds ?? []).filter((id) => typeof id === "string" && id.length > 0))];
		  if (target.scope === "all") return ids;
		  if (target.scope === "workspace") {
		    const accounted2 = new Set(items.find((workspace) => workspace.workspaceId === target.workspaceId)?.sessionIds ?? []);
		    return ids.filter((id) => accounted2.has(id));
		  }
		  const accounted = new Set(items.flatMap((workspace) => workspace.sessionIds));
		  return ids.filter((id) => !accounted.has(id));
		}
		function deriveArchivedGroups(byId, items, archivedSessionIds, ungroupedLabel) {
		  const byWorkspace = items.map((workspace) => ({
		    key: workspace.workspaceId,
		    title: workspace.title,
		    ids: new Set(workspace.sessionIds),
		    sessions: []
		  }));
		  const ungrouped = [];
		  for (const id of archivedSessionIds) {
		    const session = byId[id];
		    if (session === void 0 || session.origin === "subagent") continue;
		    const group = byWorkspace.find((workspace) => workspace.ids.has(id));
		    (group === void 0 ? ungrouped : group.sessions).push(session);
		  }
		  const result = byWorkspace.filter((group) => group.sessions.length > 0);
		  if (ungrouped.length > 0) result.push({ key: ARCHIVE_UNGROUPED_KEY, title: ungroupedLabel, sessions: ungrouped });
		  return result;
		}
		function sortArchivedGroups(groups, sortBy, createdAtById, t) {
		  const compareText = (left, right) => String(left).localeCompare(String(right), void 0, { numeric: true, sensitivity: "base" });
		  const timestampOf = (session) => {
		    const value = sortBy === "created" ? createdAtById[session.id] : session.updatedAt;
		    return typeof value === "number" && Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
		  };
		  const compareSessions = (left, right) => {
		    if (sortBy !== "alphabetical") {
		      const byTime = timestampOf(right) - timestampOf(left);
		      if (Number.isFinite(byTime) && byTime !== 0) return byTime;
		    }
		    return compareText(displayTitle(left, t), displayTitle(right, t)) || compareText(left.id, right.id);
		  };
		  const result = groups.map((group) => ({ ...group, sessions: [...group.sessions].sort(compareSessions) }));
		  return result.sort((left, right) => {
		    if (sortBy !== "alphabetical") {
		      const byTime = timestampOf(right.sessions[0]) - timestampOf(left.sessions[0]);
		      if (Number.isFinite(byTime) && byTime !== 0) return byTime;
		    }
		    return compareText(left.title, right.title) || compareText(left.key, right.key);
		  });
		}
		function ArchivedSessionsSection({ sessionStore, workspaceStore, unarchiveSession, deleteSession, deleteWorkspace, unarchiveSessions, deleteArchivedSessions, archivedSessionMetadata, previewSession, syncRecords, listEmptyWorkspaceDirectories, deleteEmptyWorkspaceDirectory, t }) {
		  const sessions = (0, react2.useSyncExternalStore)(sessionStore.subscribe, sessionStore.getSnapshot);
		  const workspaceState = (0, react2.useSyncExternalStore)(workspaceStore.subscribe, workspaceStore.getSnapshot);
		  const [deleteTarget, setDeleteTarget] = (0, react2.useState)(null);
		  const [preview, setPreview] = (0, react2.useState)(null);
		  const [busy, setBusy] = (0, react2.useState)(false);
		  const [error, setError] = (0, react2.useState)(null);
		  const [notice, setNotice] = (0, react2.useState)(null);
		  const [query, setQuery] = (0, react2.useState)("");
		  const [project, setProject] = (0, react2.useState)("all");
		  const [sortBy, setSortBy] = (0, react2.useState)("updated");
		  const [createdAtById, setCreatedAtById] = (0, react2.useState)({});
		  const [emptyDirs, setEmptyDirs] = (0, react2.useState)([]);
		  const emptyDirsLoadingRef = (0, react2.useRef)(false);
		  const archivedSet = (0, react2.useMemo)(() => new Set(workspaceState.archivedSessionIds), [workspaceState.archivedSessionIds]);
		  const workspaceByDirName = (0, react2.useMemo)(() => {
		    const map = /* @__PURE__ */ new Map();
		    for (const item of workspaceState.items) map.set(projectKey(item.path).toLowerCase(), { workspaceId: item.workspaceId, title: item.title });
		    return map;
		  }, [workspaceState.items]);
		  const groups = (0, react2.useMemo)(() => deriveArchivedGroups(sessions.byId, workspaceState.items, workspaceState.archivedSessionIds, t("group.ungrouped")), [sessions.byId, workspaceState, t]);
		  const sortedGroups = (0, react2.useMemo)(() => sortArchivedGroups(groups, sortBy, createdAtById, t), [groups, sortBy, createdAtById, t]);
		  (0, react2.useEffect)(() => {
		    let cancelled = false;
		    archivedSessionMetadata().then((result) => {
		      if (cancelled) return;
		      setCreatedAtById(Object.fromEntries(result.items.map((item) => [item.sessionId, item.createdAt])));
		    }).catch(() => {
		      if (!cancelled) setCreatedAtById({});
		    });
		    return () => {
		      cancelled = true;
		    };
		  }, [archivedSessionMetadata, workspaceState.archivedSessionIds]);
		  const refreshEmptyDirectories = (0, react2.useCallback)(async () => {
		    if (emptyDirsLoadingRef.current) return;
		    emptyDirsLoadingRef.current = true;
		    try {
		      const result = await listEmptyWorkspaceDirectories();
		      setEmptyDirs(result.directories);
		    } catch (reason) {
		      console.warn("listEmptyWorkspaceDirectories failed:", reason);
		    } finally {
		      emptyDirsLoadingRef.current = false;
		    }
		  }, [listEmptyWorkspaceDirectories]);
		  (0, react2.useEffect)(() => {
		    refreshEmptyDirectories();
		  }, [refreshEmptyDirectories]);
		  (0, react2.useEffect)(() => {
		    if (project === "all") return;
		    if (groups.some((group) => group.key === project)) return;
		    setProject("all");
		  }, [groups, project]);
		  const filteredGroups = (0, react2.useMemo)(() => {
		    const normalizedQuery = query.trim().toLocaleLowerCase();
		    return sortedGroups.filter((group) => project === "all" || project === group.key).map((group) => ({
		      ...group,
		      sessions: group.sessions.filter((session) => normalizedQuery === "" || displayTitle(session, t).toLocaleLowerCase().includes(normalizedQuery))
		    })).filter((group) => group.sessions.length > 0);
		  }, [sortedGroups, project, query, t]);
		  const allBatchTarget = { scope: "all" };
		  const allBatchSessionIds = (0, react2.useMemo)(() => deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, allBatchTarget), [workspaceState.archivedSessionIds, workspaceState.items]);
		  const onUnarchive = (sessionId) => {
		    setError(null);
		    setNotice(null);
		    unarchiveSession(sessionId).catch((reason) => {
		      setError(formatUnarchiveError(reason, t));
		    });
		  };
		  const onPreview = (session) => {
		    setError(null);
		    setNotice(null);
		    setPreview({ session, messages: null, loading: true });
		    previewSession(session.id).then((result) => {
		      setPreview((current) => current !== null && current.session.id === session.id ? { session, messages: result.messages, loading: false } : current);
		    }).catch((reason) => {
		      setPreview((current) => current !== null && current.session.id === session.id ? { session, messages: null, loading: false, error: reason instanceof Error ? reason.message : String(reason) } : current);
		    });
		  };
		  const closePreview = () => setPreview(null);
		  const previewTurns = (0, react2.useMemo)(() => preview !== null && Array.isArray(preview.messages) ? groupPreviewTurns(preview.messages) : [], [preview]);
		  const onBatchUnarchive = async (target) => {
		    if (busy) return;
		    setBusy(true);
		    setError(null);
		    setNotice(null);
		    try {
		      const result = await unarchiveSessions(target);
		      setNotice(t("archives.restoreSuccess", { n: result.unarchivedSessionIds.length }));
		    } catch (reason) {
		      setError(t("archives.restoreBatchFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		    } finally {
		      setBusy(false);
		    }
		  };
		  const onSync = async () => {
		    if (busy) return;
		    setBusy(true);
		    setError(null);
		    setNotice(null);
		    try {
		      const result = await syncRecords();
		      const removed = result.archivedRemoved.length + result.workspaceRemoved.length + result.projcacheRemoved.length;
		      setNotice(t("archives.syncResult", { scanned: result.scanned, added: result.workspaceAdded.length, removed }));
		    } catch (reason) {
		      setError(t("archives.syncFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		    } finally {
		      setBusy(false);
		    }
		  };
		  const closeDelete = () => {
		    if (!busy) setDeleteTarget(null);
		  };
		  (0, react2.useEffect)(() => {
		    if (deleteTarget === null) return;
		    const onKeyDown = (event) => {
		      if (event.key !== "Escape") return;
		      event.preventDefault();
		      event.stopPropagation();
		      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
		      if (!busy) setDeleteTarget(null);
		    };
		    window.addEventListener("keydown", onKeyDown, true);
		    return () => window.removeEventListener("keydown", onKeyDown, true);
		  }, [deleteTarget, busy]);
		  const confirmDelete = async () => {
		    if (busy || deleteTarget === null) return;
		    setBusy(true);
		    setError(null);
		    setNotice(null);
		    try {
		      if (deleteTarget.kind === "batch") {
		        const result = await deleteArchivedSessions(deleteTarget.target);
		        const completed = result.deletedSessionIds.length + result.skippedSessionIds.length;
		        if (result.failures.length > 0) {
		          setError(t("archives.deletePartial", { done: completed, failed: result.failures.length, detail: result.failures[0].message }));
		        } else {
		          setNotice(t("archives.deleteSuccess", { n: completed }));
		        }
		        await refreshEmptyDirectories();
		      } else if (deleteTarget.kind === "workspace") {
		        const result = await deleteArchivedSessions({ scope: "workspace", workspaceId: deleteTarget.workspaceId });
		        await deleteWorkspace(deleteTarget.workspaceId);
		        if (typeof deleteTarget.dirName === "string" && deleteTarget.dirName.length > 0) {
		          await deleteEmptyWorkspaceDirectory(deleteTarget.dirName);
		        }
		        if (result.failures.length > 0) {
		          const done = result.deletedSessionIds.length + result.skippedSessionIds.length;
		          setError(t("archives.deletePartial", { done, failed: result.failures.length, detail: result.failures[0].message }));
		        } else {
		          setNotice(t("archives.deleteWorkspaceDone", { name: deleteTarget.title }));
		        }
		        await refreshEmptyDirectories();
		      } else if (deleteTarget.kind === "workspaceDir") {
		        if (typeof deleteTarget.workspaceId === "string" && deleteTarget.workspaceId.length > 0) {
		          await deleteWorkspace(deleteTarget.workspaceId);
		        }
		        await deleteEmptyWorkspaceDirectory(deleteTarget.name);
		        setNotice(t("archives.emptyDirDeleted", { name: deleteTarget.name }));
		        await refreshEmptyDirectories();
		      } else {
		        await deleteSession(deleteTarget.session.id);
		        await refreshEmptyDirectories();
		      }
		      setDeleteTarget(null);
		    } catch (reason) {
		      const detail = reason instanceof Error ? reason.message : String(reason);
		      if (deleteTarget?.kind === "workspace") setError(t("archives.deleteWorkspaceFailed", { detail }));
		      else if (deleteTarget?.kind === "workspaceDir") setError(t("archives.emptyDirDeleteFailed", { detail }));
		      else setError(formatDeleteError(reason, t));
		    } finally {
		      setBusy(false);
		    }
		  };
		  const isWorkspaceDelete = deleteTarget?.kind === "workspace";
		  const isWorkspaceDirDelete = deleteTarget?.kind === "workspaceDir";
		  const batchScope = deleteTarget?.kind === "batch" ? deleteTarget.target.scope : null;
		  const deleteDialogTitle = isWorkspaceDelete ? t("delete.workspace") : isWorkspaceDirDelete ? t("archives.emptyDirDeleteTitle") : batchScope === "all" ? t("archives.deleteAllTitle") : batchScope === "ungrouped" ? t("archives.deleteUngroupedTitle") : batchScope === "workspace" ? t("archives.deleteProjectTitle", { name: deleteTarget.title }) : t("deleteSession.title");
		  const deleteDialogDescription = deleteTarget === null ? void 0 : isWorkspaceDelete ? t("archives.deleteWorkspaceDesc", { name: deleteTarget.title }) : isWorkspaceDirDelete ? t("archives.emptyDirDeleteDesc", { name: deleteTarget.name }) : batchScope === "all" ? t("archives.deleteAllDesc", { n: deleteTarget.count }) : batchScope === "ungrouped" ? t("archives.deleteUngroupedDesc", { n: deleteTarget.count }) : batchScope === "workspace" ? t("archives.deleteProjectDesc", { name: deleteTarget.title, n: deleteTarget.count }) : t("deleteSession.desc", { name: displayTitle(deleteTarget.session, t) });
		  const deleteConfirmLabel = isWorkspaceDelete ? t("delete.workspace") : isWorkspaceDirDelete ? t("archives.emptyDirDeleteConfirm") : batchScope === "all" ? t("archives.deleteAll") : batchScope === "ungrouped" ? t("archives.deleteUngroupedConfirm") : batchScope === "workspace" ? t("archives.deleteProjectConfirm") : t("deleteSession.title");
		  return (0, react_jsx_runtime2.jsxs)("section", {
		    className: "dshse_settings",
		    "aria-label": t("archives.title"),
		    children: [(0, react_jsx_runtime2.jsx)("style", { children: ARCHIVE_SETTINGS_CSS + ARCHIVE_SETTINGS_BATCH_CSS + ARCHIVE_PREVIEW_CSS }), (0, react_jsx_runtime2.jsxs)("header", { className: "dshse_settingsHeader", children: [(0, react_jsx_runtime2.jsxs)("div", { children: [(0, react_jsx_runtime2.jsx)("h2", { children: t("archives.title") }), (0, react_jsx_runtime2.jsx)("p", { className: "dshse_settingsIntro", children: t("archives.description") })] }), (0, react_jsx_runtime2.jsxs)("div", { className: "dshse_settingsHeaderActions", children: [(0, react_jsx_runtime2.jsx)("button", { type: "button", className: "dshse_settingsRestoreAll", disabled: busy, onClick: onSync, children: t("archives.sync") }), (0, react_jsx_runtime2.jsx)("button", { type: "button", className: "dshse_settingsRestoreAll", disabled: busy || allBatchSessionIds.length === 0, onClick: () => onBatchUnarchive(allBatchTarget), children: t("archives.restoreAll") }), (0, react_jsx_runtime2.jsxs)("button", { type: "button", className: "dshse_settingsDanger", disabled: busy || allBatchSessionIds.length === 0, onClick: () => setDeleteTarget({ kind: "batch", target: allBatchTarget, title: t("archives.allProjects"), count: allBatchSessionIds.length }), children: [(0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconTrashOutline16, {}), t("archives.deleteAll")] })] })] }), (0, react_jsx_runtime2.jsxs)("div", { className: "dshse_settingsToolbar", children: [(0, react_jsx_runtime2.jsxs)("label", { className: "dshse_settingsSearch", children: [(0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconSearchOutline16, {}), (0, react_jsx_runtime2.jsx)("input", { type: "search", value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("archives.searchPlaceholder"), "aria-label": t("archives.searchPlaceholder") })] }), (0, react_jsx_runtime2.jsx)(ArchiveProjectSelect, { id: "dshse-sort-filter", value: sortBy, options: [{ value: "updated", label: t("archives.sortUpdated") }, { value: "created", label: t("archives.sortCreated") }, { value: "alphabetical", label: t("archives.sortAlphabetical") }], onChange: setSortBy, "aria-label": t("archives.sortBy") }), (0, react_jsx_runtime2.jsx)(ArchiveProjectSelect, { id: "dshse-project-filter", value: project, options: [{ value: "all", label: t("archives.allProjects") }, ...sortedGroups.map((group) => ({ value: group.key, label: group.title }))], onChange: setProject, "aria-label": t("archives.projectFilter") })] }), groups.length === 0 ? emptyDirs.length === 0 ? (0, react_jsx_runtime2.jsx)("div", { className: "dshse_settingsEmpty", children: t("archives.empty") }) : null : filteredGroups.length === 0 ? (0, react_jsx_runtime2.jsx)("div", { className: "dshse_settingsEmpty", children: t("archives.emptyFiltered") }) : filteredGroups.map((group) => {
		      const target = archivedBatchTargetForGroup(group.key);
		      const count = deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, target).length;
		      const workspace = group.key === ARCHIVE_UNGROUPED_KEY ? void 0 : workspaceState.items.find((item) => item.workspaceId === group.key);
		      const allArchived = workspace !== void 0 && workspace.sessionIds.length > 0 && workspace.sessionIds.every((id) => archivedSet.has(id));
		      return (0, react_jsx_runtime2.jsxs)("section", {
		        className: "dshse_settingsGroup",
		        children: [(0, react_jsx_runtime2.jsxs)("div", { className: "dshse_settingsGroupHeading", children: [(0, react_jsx_runtime2.jsxs)("h3", { className: "dshse_settingsGroupTitle", children: [(0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconFolderOpenOutline16, {}), group.title] }), (0, react_jsx_runtime2.jsxs)("div", { className: "dshse_settingsGroupMeta", children: [(0, react_jsx_runtime2.jsx)("span", { className: "dshse_settingsCount", children: t("archives.sessionCount", { n: count }) }), (0, react_jsx_runtime2.jsx)(ArchivedGroupActions, { group, busy, allArchived, onRestore: () => onBatchUnarchive(target), onDelete: () => setDeleteTarget({ kind: "batch", target, title: group.title, count }), onDeleteWorkspace: () => setDeleteTarget({ kind: "workspace", workspaceId: group.key, title: group.title, dirName: workspace !== void 0 ? projectKey(workspace.path) : void 0 }), t })] })] }), (0, react_jsx_runtime2.jsx)("div", {
		          className: "dshse_settingsList",
		          children: group.sessions.map((session) => (0, react_jsx_runtime2.jsxs)("article", {
		            className: "dshse_settingsRow",
		            children: [(0, react_jsx_runtime2.jsxs)("div", { className: "dshse_settingsContent", children: [(0, react_jsx_runtime2.jsx)("div", { className: "dshse_settingsTitle", children: displayTitle(session, t) }), (0, react_jsx_runtime2.jsx)("div", { className: "dshse_settingsMeta", children: archiveTimeLabel(session.updatedAt, t) })] }), (0, react_jsx_runtime2.jsxs)("div", {
		              className: "dshse_settingsActions",
		              children: [(0, react_jsx_runtime2.jsx)("button", { type: "button", className: "dshse_settingsIconButton", disabled: busy, "aria-label": t("archives.previewSession"), title: t("archives.previewSession"), onClick: () => onPreview(session), children: (0, react_jsx_runtime2.jsx)(EyeIcon, {}) }), (0, react_jsx_runtime2.jsx)("button", { type: "button", className: "dshse_settingsIconButton", disabled: busy, "aria-label": t("menu.unarchive"), title: t("menu.unarchive"), onClick: () => onUnarchive(session.id), children: (0, react_jsx_runtime2.jsx)(RestoreIcon, {}) }), (0, react_jsx_runtime2.jsx)("button", { type: "button", className: "dshse_settingsDelete", disabled: busy, "aria-label": t("menu.deleteSession"), onClick: () => setDeleteTarget({ kind: "session", session }), children: (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconTrashOutline16, {}) })]
		            })]
		          }, session.id))
		        })]
		      }, group.key);
		    }), emptyDirs.map((dir) => (0, react_jsx_runtime2.jsxs)("section", {
		      className: "dshse_settingsGroup",
		      children: [(0, react_jsx_runtime2.jsxs)("div", {
		        className: "dshse_settingsGroupHeading",
		        children: [(0, react_jsx_runtime2.jsxs)("h3", {
		          className: "dshse_settingsGroupTitle",
		          children: [(0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconFolderOpenOutline16, {}), workspaceByDirName.get(dir.name.toLowerCase())?.title ?? emptyDirLabel(dir.name)]
		        }), (0, react_jsx_runtime2.jsxs)("div", {
		          className: "dshse_settingsGroupMeta",
		          children: [(0, react_jsx_runtime2.jsx)("span", { className: "dshse_settingsCount", children: t("archives.sessionCount", { n: 0 }) }), (0, react_jsx_runtime2.jsx)("button", { type: "button", className: "dshse_settingsDelete", disabled: busy, "aria-label": t("archives.emptyDirDelete"), onClick: () => setDeleteTarget({ kind: "workspaceDir", name: dir.name, path: dir.path, workspaceId: workspaceByDirName.get(dir.name.toLowerCase())?.workspaceId }), children: (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconTrashOutline16, {}) })]
		        })]
		      })]
		    }, dir.name)), error !== null && (0, react_jsx_runtime2.jsx)("div", { className: "dshse_settingsError", role: "alert", children: error }), notice !== null && (0, react_jsx_runtime2.jsx)("div", { className: "dshse_settingsStatus", role: "status", children: notice }), (0, react_jsx_runtime2.jsxs)(_deepseek_ai_dsh_client_ui_primitives2.Modal, {
		      open: deleteTarget !== null,
		      onClose: closeDelete,
		      closeLabel: t("close"),
		      title: deleteDialogTitle,
		      ...deleteDialogDescription === void 0 ? {} : { description: deleteDialogDescription },
		      footer: (0, react_jsx_runtime2.jsxs)(react_jsx_runtime2.Fragment, { children: [(0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.Button, { variant: "outline", disabled: busy, onClick: closeDelete, children: t("cancel") }), (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.Button, { variant: "outline", disabled: busy, onClick: confirmDelete, children: deleteConfirmLabel })] }),
		      children: busy && (0, react_jsx_runtime2.jsx)("div", { role: "status", children: deleteTarget?.kind === "workspace" ? t("delete.pending") : deleteTarget?.kind === "workspaceDir" ? t("archives.emptyDirDeletePending") : deleteTarget?.kind === "batch" ? t("archives.deleteBatchPending") : t("deleteSession.pending") })
		    }), (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.Modal, {
		      open: preview !== null,
		      onClose: closePreview,
		      closeLabel: t("close"),
		      title: preview === null ? "" : displayTitle(preview.session, t),
		      className: "dshse_previewModal",
		      children: (0, react_jsx_runtime2.jsx)("div", {
		        className: "dshse_previewBody",
		        children: preview === null ? null : preview.loading ? (0, react_jsx_runtime2.jsx)("div", { className: "dshse_previewEmpty", role: "status", children: t("archives.previewLoading") }) : preview.error !== void 0 ? (0, react_jsx_runtime2.jsx)("div", { className: "dshse_settingsError", role: "alert", children: t("archives.previewFailed", { detail: preview.error }) }) : previewTurns.length === 0 ? (0, react_jsx_runtime2.jsx)("div", { className: "dshse_previewEmpty", children: t("archives.previewEmpty") }) : previewTurns.map((turn, index) => (0, react_jsx_runtime2.jsx)(PreviewTurn, { turn, t }, index))
		      })
		    })]
		  });
		}
		var ENHANCE_TABS_CSS = ".dshse_enhance{box-sizing:border-box;width:min(100%,760px);margin:0 auto;padding:0 0 32px}.dshse_enhanceTabs{display:flex;gap:2px;margin-bottom:20px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dshse_enhanceTab{display:inline-flex;align-items:center;min-height:36px;padding:0 14px;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-bottom:2px solid transparent;border-radius:8px 8px 0 0;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dshse_enhanceTab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dshse_enhanceTabActive{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-label-primary)}";
		var BASIC_SETTINGS_CSS = '.dshse_settings{box-sizing:border-box;width:min(100%,760px);margin:0 auto;padding:0 0 32px;color:var(--dsw-alias-label-primary)}.dshse_settingsHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}.dshse_settings h2{margin:0;font-size:20px;font-weight:650;letter-spacing:-.2px;line-height:28px}.dshse_settingsIntro{margin:4px 0 0;max-width:42em;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.dshse_settingsError{margin-top:10px;color:var(--dsw-alias-state-error-primary);font-size:12px}.dshse_settingsStatus{margin-top:10px;color:var(--dsw-alias-label-secondary);font-size:12px}.dshse_settingsCategory{box-sizing:border-box;margin:0 0 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-button-elevated-fill));overflow:hidden}.dshse_settingsCategoryHeader{box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;min-height:44px;padding:0 14px;color:var(--dsw-alias-label-primary);background:transparent;border:0;cursor:pointer;font:inherit;font-size:13px;font-weight:600;line-height:20px;text-align:left}.dshse_settingsCategoryHeader:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsCategoryHeader:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.dshse_settingsCategoryChevron{flex:none;color:var(--dsw-alias-label-tertiary)}.dshse_settingsCategoryTitle{flex:1;min-width:0}.dshse_settingsCategoryBody{box-sizing:border-box;border-top:1px solid var(--dsw-alias-border-l2);padding:14px}.dshse_settingsField{margin:0 0 18px}.dshse_settingsField:last-child{margin-bottom:0}.dshse_settingsFieldLabel{display:block;margin-bottom:6px;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:18px}.dshse_settingsFieldHint{margin:0 0 10px;max-width:42em;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px}.dshse_settingsFieldRow{display:flex;align-items:center;gap:8px;max-width:560px}.dshse_settingsInputWrap{position:relative;display:flex;align-items:center;flex:1;min-width:0}.dshse_settingsInput{box-sizing:border-box;width:100%;min-width:0;height:34px;padding:0 34px 0 12px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));border:1px solid var(--dsw-alias-border-l2);border-radius:8px;outline:0;font:inherit;font-size:13px;cursor:pointer;text-overflow:ellipsis}.dshse_settingsInput:hover{border-color:var(--dsw-alias-label-dimmed)}.dshse_settingsInputIcon{position:absolute;right:10px;color:var(--dsw-alias-label-tertiary);pointer-events:none;display:inline-flex}.dshse_settingsPrimary{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 16px;color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-label-primary);border:0;border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500;line-height:20px}.dshse_settingsPrimary:hover:not(:disabled){filter:brightness(1.12)}.dshse_settingsPrimary:disabled{cursor:default;opacity:.45}.dshse_settingsPrimary:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dshse_settingsRestore{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 16px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500;line-height:20px}.dshse_settingsRestore:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsRestore:disabled{cursor:default;opacity:.45}.dshse_settingsRestore:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dshse_featureRow{display:flex;align-items:center;gap:12px;min-height:44px}.dshse_featureMain{display:flex;align-items:center;gap:10px;flex:1;min-width:0}.dshse_featureIcon{display:inline-flex;align-items:center;justify-content:center;flex:none;color:var(--dsw-alias-label-secondary)}.dshse_featureTitle{min-width:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:18px}.dshse_featureActions{display:flex;align-items:center;gap:10px;flex:none}.dshse_featureInfo{position:relative;display:inline-flex;align-items:center;color:var(--dsw-alias-label-tertiary)}.dshse_featureInfo:hover{color:var(--dsw-alias-label-secondary)}.dshse_featureInfoTip{position:absolute;bottom:calc(100% + 8px);right:0;z-index:20;box-sizing:border-box;width:max-content;max-width:260px;padding:8px 10px;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));border:1px solid var(--dsw-alias-border-l2);border-radius:8px;box-shadow:var(--dsw-shadow-lv3);font-size:12px;line-height:16px;font-weight:400;white-space:normal;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(2px);transition:opacity .12s,transform .12s,visibility .12s}.dshse_featureInfo:hover .dshse_featureInfoTip{opacity:1;visibility:visible;transform:translateY(0)}.dshse_featureSwitch{position:relative;box-sizing:border-box;flex:none;width:34px;height:20px;padding:0;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;cursor:pointer;transition:background .2s,border-color .2s}.dshse_featureSwitch:after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground,#fff);transition:transform .2s}.dshse_featureSwitch[aria-checked=true]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}.dshse_featureSwitch[aria-checked=true]:after{transform:translateX(14px)}.dshse_featureSwitch:disabled{cursor:not-allowed;opacity:.5}.dshse_featureSwitch:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}';
		function SettingsCategory({ title, defaultOpen, children }) {
		  const [open, setOpen] = (0, react2.useState)(defaultOpen !== false);
		  return (0, react_jsx_runtime2.jsxs)("section", {
		    className: "dshse_settingsCategory",
		    children: [(0, react_jsx_runtime2.jsxs)("button", {
		      type: "button",
		      className: "dshse_settingsCategoryHeader",
		      "aria-expanded": open,
		      onClick: () => setOpen(!open),
		      children: [(0, react_jsx_runtime2.jsx)(open ? _deepseek_ai_dsh_client_ui_primitives2.IconChevronDownOutline14 : _deepseek_ai_dsh_client_ui_primitives2.IconChevronRightOutline14, { className: "dshse_settingsCategoryChevron" }), (0, react_jsx_runtime2.jsx)("span", { className: "dshse_settingsCategoryTitle", children: title })]
		    }), open ? (0, react_jsx_runtime2.jsx)("div", { className: "dshse_settingsCategoryBody", children }) : null]
		  });
		}
		function FeatureRow({ icon, title, description, enabled, disabled, onToggle }) {
		  return (0, react_jsx_runtime2.jsxs)("div", {
		    className: "dshse_featureRow",
		    children: [(0, react_jsx_runtime2.jsxs)("div", { className: "dshse_featureMain", children: [(0, react_jsx_runtime2.jsx)("span", { className: "dshse_featureIcon", children: icon }), (0, react_jsx_runtime2.jsx)("span", { className: "dshse_featureTitle", children: title })] }), (0, react_jsx_runtime2.jsxs)("div", {
		      className: "dshse_featureActions",
		      children: [description ? (0, react_jsx_runtime2.jsxs)("span", { className: "dshse_featureInfo", children: [(0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconQuestionOutline14, {}), (0, react_jsx_runtime2.jsx)("span", { className: "dshse_featureInfoTip", role: "tooltip", children: description })] }) : null, (0, react_jsx_runtime2.jsx)("button", { type: "button", role: "switch", "aria-checked": enabled, className: "dshse_featureSwitch", disabled, onClick: () => onToggle(!enabled), "aria-label": title })]
		    })]
		  });
		}
		function BasicSettings({ getSettings, setSettings, pickDirectory, t }) {
		  const [settings, setLocalSettings] = (0, react2.useState)(null);
		  const [homeDirDraft, setHomeDirDraft] = (0, react2.useState)("");
		  const [saving, setSaving] = (0, react2.useState)(false);
		  const [error, setError] = (0, react2.useState)(null);
		  const [notice, setNotice] = (0, react2.useState)(null);
		  const noticeSeq = (0, react2.useRef)(0);
		  const showNoticeToast = (text) => {
		    noticeSeq.current += 1;
		    setNotice({ text, seq: noticeSeq.current });
		  };
		  (0, react2.useEffect)(() => {
		    let cancelled = false;
		    getSettings().then((value) => {
		      if (cancelled) return;
		      setLocalSettings(value);
		      setHomeDirDraft(value.homeDir);
		    }).catch((reason) => {
		      if (!cancelled) setError(t("settings.loadFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		    });
		    return () => {
		      cancelled = true;
		    };
		  }, [getSettings, t]);
		  const saveHomeDir = async () => {
		    if (saving) return;
		    setSaving(true);
		    setError(null);
		    setNotice(null);
		    try {
		      const next = await setSettings({ homeDir: homeDirDraft });
		      setLocalSettings(next);
		      showNoticeToast(t("settings.saved"));
		    } catch (reason) {
		      setError(t("settings.saveFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		    } finally {
		      setSaving(false);
		    }
		  };
		  const pickHomeDir = async () => {
		    if (saving || typeof pickDirectory !== "function") return;
		    setError(null);
		    setNotice(null);
		    try {
		      const path = await pickDirectory();
		      if (path !== null && path !== void 0) setHomeDirDraft(path);
		    } catch (reason) {
		      setError(t("settings.pickFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		    }
		  };
		  const setNotify = async (enabled) => {
		    if (saving || settings === null) return;
		    setSaving(true);
		    setError(null);
		    setNotice(null);
		    try {
		      const next = await setSettings({ notifyEnabled: enabled });
		      setLocalSettings(next);
		    } catch (reason) {
		      setError(t("settings.saveFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		    } finally {
		      setSaving(false);
		    }
		  };
		  const DEFAULT_HOME_DIR = "~/.dsh";
		  const homeDirChanged = settings !== null && homeDirDraft !== settings.homeDir;
		  const homeDirIsDefault = settings !== null && settings.homeDir === DEFAULT_HOME_DIR;
		  const restoreDefaultHomeDir = async () => {
		    if (saving || settings === null) return;
		    setSaving(true);
		    setError(null);
		    setNotice(null);
		    try {
		      const next = await setSettings({ homeDir: DEFAULT_HOME_DIR });
		      setLocalSettings(next);
		      setHomeDirDraft(next.homeDir);
		      showNoticeToast(t("settings.saved"));
		    } catch (reason) {
		      setError(t("settings.saveFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		    } finally {
		      setSaving(false);
		    }
		  };
		  return (0, react_jsx_runtime2.jsxs)("section", {
		    className: "dshse_settings",
		    "aria-label": t("settings.basicTab"),
		    children: [(0, react_jsx_runtime2.jsx)("style", { children: BASIC_SETTINGS_CSS }), (0, react_jsx_runtime2.jsxs)("header", { className: "dshse_settingsHeader", children: [(0, react_jsx_runtime2.jsxs)("div", { children: [(0, react_jsx_runtime2.jsx)("h2", { children: t("settings.basicTab") }), (0, react_jsx_runtime2.jsx)("p", { className: "dshse_settingsIntro", children: t("settings.description") })] })] }), error !== null && (0, react_jsx_runtime2.jsx)("div", { className: "dshse_settingsError", role: "alert", children: error }), notice !== null && (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.Toast, { key: notice.seq, text: notice.text, onDone: () => setNotice(null) }), (0, react_jsx_runtime2.jsxs)(SettingsCategory, {
		      title: t("settings.categoryBasic"),
		      children: [(0, react_jsx_runtime2.jsx)("div", { className: "dshse_settingsField", children: [(0, react_jsx_runtime2.jsx)("label", { className: "dshse_settingsFieldLabel", htmlFor: "dshse-home-dir", children: t("settings.homeDir") }), (0, react_jsx_runtime2.jsx)("p", { className: "dshse_settingsFieldHint", children: t("settings.homeDirHint") }), (0, react_jsx_runtime2.jsxs)("div", { className: "dshse_settingsFieldRow", children: [(0, react_jsx_runtime2.jsxs)("div", { className: "dshse_settingsInputWrap", children: [(0, react_jsx_runtime2.jsx)("input", { id: "dshse-home-dir", type: "text", className: "dshse_settingsInput", value: homeDirDraft, readOnly: true, onClick: pickHomeDir, placeholder: "~/.dsh", spellCheck: false, "aria-label": t("settings.homeDir"), title: t("settings.pickDirectory") }), (0, react_jsx_runtime2.jsx)(_deepseek_ai_dsh_client_ui_primitives2.IconFolderClose16, { className: "dshse_settingsInputIcon" })] }), (0, react_jsx_runtime2.jsx)("button", { type: "button", className: "dshse_settingsPrimary", disabled: saving || settings === null || !homeDirChanged, onClick: saveHomeDir, children: t("settings.changeDirectory") }), (0, react_jsx_runtime2.jsx)("button", { type: "button", className: "dshse_settingsRestore", disabled: saving || settings === null || homeDirIsDefault, onClick: restoreDefaultHomeDir, children: t("settings.restoreDefault") })] })] })]
		    }), (0, react_jsx_runtime2.jsxs)(SettingsCategory, {
		      title: t("settings.categoryFeatures"),
		      children: [(0, react_jsx_runtime2.jsx)(FeatureRow, {
		        icon: (0, react_jsx_runtime2.jsx)("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, children: (0, react_jsx_runtime2.jsx)("path", { fill: "currentColor", d: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" }) }),
		        title: t("settings.notify"),
		        description: t("settings.notifyHint"),
		        enabled: settings === null ? true : settings.notifyEnabled,
		        disabled: saving || settings === null,
		        onToggle: setNotify
		      })]
		    })]
		  });
		}
		function EnhancementSection(props) {
		  const [tab, setTab] = (0, react2.useState)("basic");
		  const { getSettings, setSettings, pickDirectory, t } = props;
		  return (0, react_jsx_runtime2.jsxs)("section", {
		    className: "dshse_enhance",
		    children: [(0, react_jsx_runtime2.jsx)("style", { children: ENHANCE_TABS_CSS }), (0, react_jsx_runtime2.jsx)("nav", { className: "dshse_enhanceTabs", role: "tablist", "aria-label": t("settings.manageTitle"), children: [(0, react_jsx_runtime2.jsx)("button", { type: "button", role: "tab", "aria-selected": tab === "basic", className: tab === "basic" ? "dshse_enhanceTab dshse_enhanceTabActive" : "dshse_enhanceTab", onClick: () => setTab("basic"), children: t("settings.basicTab") }), (0, react_jsx_runtime2.jsx)("button", { type: "button", role: "tab", "aria-selected": tab === "archive", className: tab === "archive" ? "dshse_enhanceTab dshse_enhanceTabActive" : "dshse_enhanceTab", onClick: () => setTab("archive"), children: t("archives.manageTitle") })] }), tab === "basic" ? (0, react_jsx_runtime2.jsx)(BasicSettings, { getSettings, setSettings, pickDirectory, t }) : (0, react_jsx_runtime2.jsx)(ArchivedSessionsSection, props)]
		  });
		}
		function installConversationNotifier(ctx, getSettings, t) {
		  if (typeof window === "undefined" || typeof Notification === "undefined") return () => {
		  };
		  const seen = /* @__PURE__ */ new Map();
		  const show = (title, body) => {
		    if (Notification.permission === "granted") {
		      new Notification(title, { body });
		    } else if (Notification.permission === "default") {
		      Notification.requestPermission();
		    }
		  };
		  return ctx.sessions.list.subscribe(() => {
		    const state = ctx.sessions.list.getSnapshot();
		    const current = state.current;
		    const pageFocused = typeof document === "undefined" || document.hasFocus();
		    for (const summary of Object.values(state.byId)) {
		      const prev = seen.get(summary.id);
		      if (prev === void 0) {
		        seen.set(summary.id, { running: summary.running, pending: summary.pendingInteraction });
		        continue;
		      }
		      const finished = prev.running === true && summary.running === false;
		      const needsAction = prev.pending === void 0 && summary.pendingInteraction !== void 0;
		      seen.set(summary.id, { running: summary.running, pending: summary.pendingInteraction });
		      if ((finished || needsAction) && (summary.id !== current || !pageFocused)) {
		        const title = summary.displayTitle || summary.id;
		        const body = needsAction ? t("notify.needsAction") : t("notify.finished");
		        getSettings().then((settings) => {
		          if (settings.notifyEnabled) show(title, body);
		        }).catch(() => {
		        });
		      }
		    }
		  });
		}
		
		// src/client/workspace-browser.js
		var react4 = __toESM(require("react"), 1);
		var react_jsx_runtime4 = __toESM(require("react/jsx-runtime"), 1);
		var _deepseek_ai_dsh_client_ui_primitives4 = __toESM(require("@deepseek-ai/dsh-client-ui-primitives"), 1);
		
		// src/client/workspace-picker.js
		var react3 = __toESM(require("react"), 1);
		var react_jsx_runtime3 = __toESM(require("react/jsx-runtime"), 1);
		var _deepseek_ai_dsh_client_ui_primitives3 = __toESM(require("@deepseek-ai/dsh-client-ui-primitives"), 1);
		var css$1 = "._G5b-a_modalAction{min-width:72px}._G5b-a_modalError,._G5b-a_menuStatus{margin-top:8px;font-size:12px;line-height:18px}._G5b-a_modalError{color:var(--dsw-alias-state-error-primary)}._G5b-a_menuStatus{color:var(--dsw-alias-label-secondary)}";
		var tagId$1 = "@deepseek-ai/dsh-client-ui-workspace/WorkspacePicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
		  const tag = document.createElement("style");
		  tag.dataset.plugin = "dsh-session-enhance";
		  tag.dataset.pluginCss = tagId$1;
		  tag.textContent = css$1;
		  document.head.appendChild(tag);
		}
		var WorkspacePicker_module_css_default = {
		  "modalAction": "_G5b-a_modalAction",
		  "menuStatus": "_G5b-a_menuStatus",
		  "modalError": "_G5b-a_modalError"
		};
		var ADD_WORKSPACE = "::add-workspace";
		function WorkspacePickFlow({ t, open, anchorRef, useWorkspaces, createWorkspace, useDirectoryFlow, renderDirectoryFlow, onPick, onClose, addOnly = false, side = "bottom", selectedId }) {
		  const workspaceSnapshot = useWorkspaces((state) => state);
		  const workspaces = workspaceSnapshot.items;
		  const getAnchorRect = (0, react3.useCallback)(() => anchorRef?.current?.getBoundingClientRect() ?? null, [anchorRef]);
		  const [errorOpen, setErrorOpen] = (0, react3.useState)(false);
		  const [modalError, setModalError] = (0, react3.useState)(null);
		  const [flowOpen, setFlowOpen] = (0, react3.useState)(false);
		  const [pickingFolder, setPickingFolder] = (0, react3.useState)(false);
		  const flowBusy = flowOpen || pickingFolder;
		  const flowAvailable = useDirectoryFlow((occupied) => occupied);
		  (0, react3.useEffect)(() => {
		    if (flowOpen && !flowAvailable) setFlowOpen(false);
		  }, [flowOpen, flowAvailable]);
		  const addEntries = flowAvailable ? [{
		    id: ADD_WORKSPACE,
		    label: t("menu.addWorkspace"),
		    icon: (0, react_jsx_runtime3.jsx)(_deepseek_ai_dsh_client_ui_primitives3.IconPlusOutline16, { size: 16 }),
		    disabled: flowBusy
		  }] : [];
		  const pinAdd = !addOnly && workspaces.length > 0;
		  const items = pinAdd ? workspaces.map((workspace) => ({
		    id: workspace.workspaceId,
		    label: workspace.title,
		    icon: (0, react_jsx_runtime3.jsx)(_deepseek_ai_dsh_client_ui_primitives3.IconFolderClose16, { size: 16 }),
		    disabled: flowBusy
		  })) : addEntries;
		  const menuIsEmpty = items.length === 0;
		  const closeModal = () => {
		    setErrorOpen(false);
		    setModalError(null);
		  };
		  const adoptDirectory = (path) => createWorkspace({ path }).then((workspace) => {
		    setFlowOpen(false);
		    onPick(workspace.workspaceId);
		  }).catch((reason) => {
		    setModalError(reason instanceof Error ? reason.message : String(reason));
		    setFlowOpen(false);
		    setErrorOpen(true);
		  });
		  const openDirectoryFlow = (0, react3.useCallback)(() => {
		    onClose();
		    setErrorOpen(false);
		    setModalError(null);
		    setFlowOpen(true);
		  }, [onClose]);
		  const listSettled = addOnly || workspaceSnapshot.phase === "ready";
		  const addIsTheOnlyEntry = !pinAdd && listSettled && addEntries.length === 1;
		  (0, react3.useEffect)(() => {
		    if (open && addIsTheOnlyEntry && !flowBusy) openDirectoryFlow();
		  }, [
		    open,
		    addIsTheOnlyEntry,
		    flowBusy,
		    openDirectoryFlow
		  ]);
		  const flowOwner = {
		    open: flowOpen,
		    busy: pickingFolder,
		    onPicked: (path) => {
		      setPickingFolder(true);
		      adoptDirectory(path).finally(() => {
		        setPickingFolder(false);
		      });
		    },
		    onCancel: () => {
		      setFlowOpen(false);
		    },
		    onError: (message) => {
		      setFlowOpen(false);
		      setModalError(message);
		      setErrorOpen(true);
		    }
		  };
		  const handleSelect = (id) => {
		    if (id === ADD_WORKSPACE) {
		      openDirectoryFlow();
		      return;
		    }
		    onPick(id);
		  };
		  return (0, react_jsx_runtime3.jsxs)(react_jsx_runtime3.Fragment, {
		    children: [
		      (0, react_jsx_runtime3.jsx)(_deepseek_ai_dsh_client_ui_primitives3.Menu, {
		        open: open && !addIsTheOnlyEntry && !menuIsEmpty,
		        anchor: null,
		        items,
		        ...pinAdd ? { footer: addEntries } : {},
		        selectedId,
		        onSelect: handleSelect,
		        onClose,
		        side,
		        portal: true,
		        getAnchorRect
		      }),
		      open && !addIsTheOnlyEntry && !menuIsEmpty && workspaceSnapshot.phase === "pending" && (0, react_jsx_runtime3.jsx)("div", {
		        className: WorkspacePicker_module_css_default.menuStatus,
		        role: "status",
		        children: t("picker.loading")
		      }),
		      renderDirectoryFlow(flowOwner),
		      (0, react_jsx_runtime3.jsx)(_deepseek_ai_dsh_client_ui_primitives3.Modal, {
		        open: errorOpen,
		        onClose: closeModal,
		        closeLabel: t("close"),
		        title: t("folderError.title"),
		        footer: (0, react_jsx_runtime3.jsxs)(react_jsx_runtime3.Fragment, {
		          children: [(0, react_jsx_runtime3.jsx)(_deepseek_ai_dsh_client_ui_primitives3.Button, {
		            variant: "outline",
		            className: WorkspacePicker_module_css_default.modalAction,
		            onClick: closeModal,
		            children: t("cancel")
		          }), (0, react_jsx_runtime3.jsx)(_deepseek_ai_dsh_client_ui_primitives3.Button, {
		            variant: "primary",
		            className: WorkspacePicker_module_css_default.modalAction,
		            disabled: !flowAvailable,
		            onClick: openDirectoryFlow,
		            children: t("folderError.retry")
		          })]
		        }),
		        children: (0, react_jsx_runtime3.jsx)("div", {
		          className: WorkspacePicker_module_css_default.modalError,
		          role: "alert",
		          children: modalError
		        })
		      })
		    ]
		  });
		}
		function WorkspacePicker({ open, anchorRef, useWorkspaces, selectedId, onPick, onClose, createWorkspace, useDirectoryFlow, renderSlot, t }) {
		  return (0, react_jsx_runtime3.jsx)(WorkspacePickFlow, {
		    t,
		    open,
		    anchorRef,
		    useWorkspaces,
		    createWorkspace,
		    useDirectoryFlow,
		    renderDirectoryFlow: (owner) => renderSlot("conversation.hero.workspace.directoryFlow", owner),
		    selectedId,
		    onPick,
		    onClose
		  });
		}
		
		// src/client/workspace-browser.js
		var css = '.qDHVXG_root{--dsh-session-list-edge-inset:var(--dsh-sidebar-inline-padding);--dsh-session-list-scrollbar-width:8px;--dsh-session-list-scrollbar-offset:2px;box-sizing:border-box;min-height:0;padding-right:var(--dsh-session-list-edge-inset);flex-direction:column;flex:1;display:flex}.qDHVXG_root.qDHVXG_rail{padding-right:0}.qDHVXG_iconButton{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_sectionHeader{box-sizing:border-box;height:36px;color:var(--dsw-alias-label-tertiary);border-radius:12px;flex:none;justify-content:flex-end;align-items:center;gap:4px;margin-bottom:4px;padding-left:4px;display:flex;overflow:hidden}.qDHVXG_root:not(.qDHVXG_rail) .qDHVXG_sectionHeader{margin-top:2px;margin-right:-4px}.qDHVXG_sectionLabel{white-space:nowrap;opacity:1;visibility:visible;min-width:0;max-width:45%;transition:max-width .18s var(--ds-ease-in-out), margin-right .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;line-height:20px;overflow:hidden}.qDHVXG_sectionLabelHidden{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transition-delay:0s,0s,0s,0s,.18s;transform:translate(-4px)}.qDHVXG_searchSlot{box-sizing:border-box;min-width:0;max-width:28px;transition:max-width .18s var(--ds-ease-in-out), padding-left .18s var(--ds-ease-in-out);flex:1;align-items:center;margin-left:auto;padding-left:0;display:flex}.qDHVXG_searchSlotExpanded{max-width:100%;padding-left:0}.qDHVXG_headerActions{opacity:1;visibility:visible;max-width:60px;transition:max-width .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:hidden}.qDHVXG_headerActionsHidden{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transition-delay:0s,0s,0s,.18s;transform:translate(4px)}.qDHVXG_search{box-sizing:border-box;cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out), padding .18s var(--ds-ease-in-out), border-color .18s var(--ds-ease-in-out), background-color .18s var(--ds-ease-in-out);background:0 0;border:none;border-radius:50%;flex:none;align-items:center;gap:0;margin:0;padding:0;display:flex;overflow:hidden}.qDHVXG_searchExpanded{border:1px solid var(--dsw-alias-border-l2);width:calc(100% + 4px);height:30px;color:var(--dsw-alias-label-caption);background:0 0;border-radius:10px;margin-inline:-2px;padding:0 4px 0 0}.qDHVXG_searchButton{cursor:pointer;width:28px;height:28px;color:inherit;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_searchExpanded .qDHVXG_searchButton{width:28px;height:30px}.qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_searchExpanded .qDHVXG_searchButton:hover{background:0 0}.qDHVXG_searchInput{opacity:0;pointer-events:none;width:0;min-width:0;color:var(--dsw-alias-label-primary);transition:opacity .12s var(--ds-ease-in-out);background:0 0;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.qDHVXG_searchExpanded .qDHVXG_searchInput{opacity:1;pointer-events:auto;margin-left:-2px}.qDHVXG_searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}.qDHVXG_clearButton{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_clearButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_rail .qDHVXG_sectionHeader{justify-content:flex-start;gap:0;margin-bottom:12px;padding-left:0}.qDHVXG_rail .qDHVXG_headerActions{max-width:none}.qDHVXG_rail .qDHVXG_iconButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_search{background:0 0;border-color:#0000;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}.qDHVXG_rail .qDHVXG_searchButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_listArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-session-list-edge-inset));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:visible}.qDHVXG_rail .qDHVXG_listArea{margin-left:0;margin-right:0;padding-left:0}.qDHVXG_treeBody{flex-direction:column;flex:1;min-height:0;display:flex;position:relative}.qDHVXG_fade{left:0;right:var(--dsh-session-list-edge-inset);background:linear-gradient(to bottom, transparent, var(--dsw-specific-sidebar-fill));pointer-events:none;height:24px;position:absolute;bottom:0}.qDHVXG_wide{animation:qDHVXG_wide-in .2s var(--ds-ease-in-out)}@keyframes qDHVXG_wide-in{0%{opacity:0}}.qDHVXG_list{min-height:0;margin-left:-4px;margin-right:var(--dsh-session-list-scrollbar-offset);padding-left:4px;padding-right:calc(var(--dsh-session-list-edge-inset) - var(--dsh-session-list-scrollbar-width) - var(--dsh-session-list-scrollbar-offset));scrollbar-gutter:stable;flex:1;padding-bottom:16px;overflow-y:auto}.qDHVXG_flatList>*+*,.qDHVXG_searchTree>[role=treeitem]+[role=treeitem],.qDHVXG_groupSection>*+*{margin-top:2px}.qDHVXG_searchStatus,.qDHVXG_searchWarning{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:12px;line-height:18px}.qDHVXG_searchWarning{color:var(--dsw-alias-label-secondary)}.qDHVXG_groupSection{position:relative}.qDHVXG_groupSection+.qDHVXG_groupSection{margin-top:4px}.qDHVXG_listTopDropIndicator,.qDHVXG_workspaceDropBefore:before,.qDHVXG_workspaceDropAfter:after{content:"";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:0}.qDHVXG_listTopDropIndicator{top:-8px;left:0;right:var(--dsh-session-list-edge-inset)}.qDHVXG_listTopDropActive>.qDHVXG_workspaceDropBefore:first-child:before{display:none}.qDHVXG_workspaceDropBefore:before{top:-8px}.qDHVXG_workspaceDropAfter:after{bottom:-8px}.qDHVXG_sessionOverflowButton{cursor:pointer;text-align:left;width:100%;height:28px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:8px;padding:0 12px 0 28px;font-size:12px}.qDHVXG_groupSection>.qDHVXG_sessionOverflowButton{margin-top:0}.qDHVXG_sessionOverflowButton:hover{color:var(--dsw-alias-label-secondary);background:0 0}.qDHVXG_empty{color:var(--dsw-alias-label-tertiary);padding:16px 12px;font-size:13px}.qDHVXG_renameInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;height:44px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:22px;outline:none;padding:7px 14px;font-size:14px;font-weight:400;line-height:22px}.qDHVXG_renameInput:disabled{color:var(--dsw-alias-label-dimmed)}.qDHVXG_renameError{color:var(--dsw-alias-state-error-primary);margin-top:8px;font-size:12px;line-height:18px}.qDHVXG_deleteAction:not(:disabled){color:var(--dsw-alias-state-error-primary)}.qDHVXG_deleteStatus{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}@media (prefers-reduced-motion:reduce){.qDHVXG_wide{animation:none}.qDHVXG_search,.qDHVXG_sectionLabel,.qDHVXG_searchSlot,.qDHVXG_searchInput,.qDHVXG_headerActions{transition:none}}';
		var tagId = "@deepseek-ai/dsh-client-ui-workspace/WorkspaceBrowser.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
		  const tag = document.createElement("style");
		  tag.dataset.plugin = "dsh-session-enhance";
		  tag.dataset.pluginCss = tagId;
		  tag.textContent = css;
		  document.head.appendChild(tag);
		}
		var WorkspaceBrowser_module_css_default = {
		  "wide-in": "qDHVXG_wide-in",
		  "searchWarning": "qDHVXG_searchWarning",
		  "empty": "qDHVXG_empty",
		  "deleteStatus": "qDHVXG_deleteStatus",
		  "search": "qDHVXG_search",
		  "fade": "qDHVXG_fade",
		  "workspaceDropAfter": "qDHVXG_workspaceDropAfter",
		  "searchSlot": "qDHVXG_searchSlot",
		  "rail": "qDHVXG_rail",
		  "searchSlotExpanded": "qDHVXG_searchSlotExpanded",
		  "searchButton": "qDHVXG_searchButton",
		  "workspaceDropBefore": "qDHVXG_workspaceDropBefore",
		  "deleteAction": "qDHVXG_deleteAction",
		  "root": "qDHVXG_root",
		  "clearButton": "qDHVXG_clearButton",
		  "listTopDropIndicator": "qDHVXG_listTopDropIndicator",
		  "listTopDropActive": "qDHVXG_listTopDropActive",
		  "headerActions": "qDHVXG_headerActions",
		  "searchStatus": "qDHVXG_searchStatus",
		  "sectionLabelHidden": "qDHVXG_sectionLabelHidden",
		  "searchInput": "qDHVXG_searchInput",
		  "listArea": "qDHVXG_listArea",
		  "searchExpanded": "qDHVXG_searchExpanded",
		  "list": "qDHVXG_list",
		  "iconButton": "qDHVXG_iconButton",
		  "sectionLabel": "qDHVXG_sectionLabel",
		  "groupSection": "qDHVXG_groupSection",
		  "renameInput": "qDHVXG_renameInput",
		  "sessionOverflowButton": "qDHVXG_sessionOverflowButton",
		  "treeBody": "qDHVXG_treeBody",
		  "wide": "qDHVXG_wide",
		  "flatList": "qDHVXG_flatList",
		  "searchTree": "qDHVXG_searchTree",
		  "sectionHeader": "qDHVXG_sectionHeader",
		  "headerActionsHidden": "qDHVXG_headerActionsHidden",
		  "renameError": "qDHVXG_renameError"
		};
		var EXPAND_SLIDE_MS = 300;
		var SEARCH_DEBOUNCE_MS = 250;
		var SEARCH_QUERY_MAX_CODE_UNITS = 500;
		var COLLAPSED_SESSION_LIMIT = 5;
		function sanitizeSearchQuery(value) {
		  const withoutNul = value.replaceAll("\0", "");
		  if (withoutNul.length <= SEARCH_QUERY_MAX_CODE_UNITS) return withoutNul;
		  let end = SEARCH_QUERY_MAX_CODE_UNITS;
		  const last = withoutNul.charCodeAt(end - 1);
		  const next = withoutNul.charCodeAt(end);
		  if (last >= 55296 && last <= 56319 && next >= 56320 && next <= 57343) end--;
		  return withoutNul.slice(0, end);
		}
		function toggled(list, key) {
		  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
		}
		function useNativeDragAcceptance(active) {
		  (0, react4.useEffect)(() => {
		    if (!active) return;
		    const acceptDrag = (event) => {
		      event.preventDefault();
		      if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "move";
		    };
		    const acceptDrop = (event) => {
		      event.preventDefault();
		    };
		    document.addEventListener("dragover", acceptDrag);
		    document.addEventListener("drop", acceptDrop);
		    return () => {
		      document.removeEventListener("dragover", acceptDrag);
		      document.removeEventListener("drop", acceptDrop);
		    };
		  }, [active]);
		}
		function reconciledSessionOrder(sessionIds, stored) {
		  if (stored === void 0) return [...sessionIds];
		  const byId = new Map(sessionIds.map((id) => [id, id]));
		  const ordered = [];
		  const included = /* @__PURE__ */ new Set();
		  for (const key of stored) {
		    const id = byId.get(key);
		    if (id === void 0 || included.has(key)) continue;
		    ordered.push(id);
		    included.add(key);
		  }
		  for (const id of sessionIds) {
		    if (included.has(id)) continue;
		    ordered.push(id);
		  }
		  return ordered;
		}
		function compareSessionRecency(a, b, byId) {
		  const aUpdatedAt = byId[a]?.updatedAt ?? Number.NEGATIVE_INFINITY;
		  const bUpdatedAt = byId[b]?.updatedAt ?? Number.NEGATIVE_INFINITY;
		  if (aUpdatedAt !== bUpdatedAt) return bUpdatedAt - aUpdatedAt;
		  return a < b ? -1 : 1;
		}
		function nextSessionOrderAccount({ sessionIds, previousOrder, previousUpdatedAt, list, orderBy, sortByRecency }) {
		  let order = reconciledSessionOrder(sessionIds, previousOrder);
		  if (sortByRecency) order.sort((a, b) => compareSessionRecency(a, b, list.byId));
		  else if (orderBy === "updated") {
		    const promoted = sessionIds.filter((id) => {
		      const session = list.byId[id];
		      return session !== void 0 && (previousUpdatedAt[id] === void 0 || session.updatedAt > previousUpdatedAt[id]);
		    }).sort((a, b) => compareSessionRecency(a, b, list.byId));
		    if (promoted.length > 0) {
		      const promotedIds = new Set(promoted);
		      order = [...promoted, ...order.filter((id) => !promotedIds.has(id))];
		    }
		  }
		  const updatedAt = {};
		  for (const id of sessionIds) {
		    const session = list.byId[id];
		    if (session !== void 0) updatedAt[id] = session.updatedAt;
		  }
		  const orderChanged = previousOrder === void 0 || order.length !== previousOrder.length || order.some((id, index) => id !== previousOrder[index]);
		  const timestampsChanged = Object.keys(updatedAt).length !== Object.keys(previousUpdatedAt).length || Object.entries(updatedAt).some(([id, timestamp]) => previousUpdatedAt[id] !== timestamp);
		  return {
		    order,
		    updatedAt,
		    changed: orderChanged || timestampsChanged
		  };
		}
		function ViewOptionsMenu({ groupBy, orderBy, onGroupPick, onOrderPick, t }) {
		  const [open, setOpen] = (0, react4.useState)(false);
		  return (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Menu, {
		    open,
		    onClose: () => {
		      setOpen(false);
		    },
		    items: [
		      {
		        type: "label",
		        id: "group-by",
		        text: t("groupBy.label")
		      },
		      {
		        id: "workspace",
		        label: t("groupBy.workspace")
		      },
		      {
		        id: "flat",
		        label: t("groupBy.flat")
		      },
		      {
		        type: "separator",
		        id: "order-by-separator"
		      },
		      {
		        type: "label",
		        id: "order-by",
		        text: t("orderBy.label")
		      },
		      {
		        id: "manual",
		        label: t("orderBy.manual")
		      },
		      {
		        id: "updated",
		        label: t("orderBy.updated")
		      }
		    ],
		    selectedIds: [groupBy, orderBy],
		    onSelect: (id) => {
		      if (id === "workspace" || id === "flat") onGroupPick(id);
		      else if (id === "manual" || id === "updated") onOrderPick(id);
		      setOpen(false);
		    },
		    align: "end",
		    dense: true,
		    portal: true,
		    anchor: (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Tooltip, {
		      label: t("viewOptions.label"),
		      side: "bottom",
		      delayMs: 500,
		      children: (0, react_jsx_runtime4.jsx)("button", {
		        type: "button",
		        className: clsx(WorkspaceBrowser_module_css_default.iconButton, WorkspaceBrowser_module_css_default.wide),
		        "aria-label": t("viewOptions.label"),
		        onClick: () => {
		          setOpen((v) => !v);
		        },
		        children: (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.IconPersonalizationOutline16, {})
		      })
		    })
		  });
		}
		function workspaceGroupHalf(e) {
		  const rect = e.currentTarget.getBoundingClientRect();
		  return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
		}
		function SessionTree({ useSessions, startSession, open, forkSession, workspaces, archivedSessionIds, showArchived, onRenameRequest, onDeleteRequest, onSessionRename, onSessionArchive, onSessionUnarchive, onCopySessionId, onSessionDelete, onMoveSession, insertWorkspaceBefore, insertSessionBefore, orderBy, groupExpansion, setGroupExpanded, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t }) {
		  const list = useSessions((s) => s);
		  const current = list.current;
		  const [expandedSessionGroups, setExpandedSessionGroups] = (0, react4.useState)([]);
		  const [drag, setDrag] = (0, react4.useState)(null);
		  const sessionDropCommitted = (0, react4.useRef)(false);
		  const [workspaceDrag, setWorkspaceDrag] = (0, react4.useState)(null);
		  const workspaceDropCommitted = (0, react4.useRef)(false);
		  const [sessionDropGroup, setSessionDropGroup] = (0, react4.useState)(null);
		  const previousOrderBy = (0, react4.useRef)(orderBy);
		  useNativeDragAcceptance(drag !== null || workspaceDrag !== null);
		  const currentGroup = current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(current))?.workspaceId ?? "";
		  (0, react4.useEffect)(() => {
		    if (current === void 0 || currentGroup === void 0 || Object.hasOwn(groupExpansion, currentGroup)) return;
		    setGroupExpanded(currentGroup, true);
		  }, [
		    current,
		    currentGroup,
		    setGroupExpanded,
		    groupExpansion
		  ]);
		  const expandedGroups = (0, react4.useMemo)(() => Object.entries(groupExpansion).filter(([, expanded]) => expanded).map(([key]) => key), [groupExpansion]);
		  const ungroupedSessionIds = (0, react4.useMemo)(() => {
		    const accounted = new Set(workspaces.flatMap((workspace) => workspace.sessionIds));
		    return list.ids.filter((id) => list.byId[id] !== void 0 && !accounted.has(id));
		  }, [list, workspaces]);
		  (0, react4.useEffect)(() => {
		    if (list.phase !== "ready") return;
		    const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
		    previousOrderBy.current = orderBy;
		    const accounts = [...workspaces.map((workspace) => ({
		      key: workspace.workspaceId,
		      sessionIds: workspace.sessionIds.filter((id) => list.byId[id] !== void 0)
		    })), {
		      key: "",
		      sessionIds: ungroupedSessionIds
		    }];
		    for (const { key, sessionIds } of accounts) {
		      const previousOrder = sessionOrderByAccount[key];
		      const next = nextSessionOrderAccount({
		        sessionIds,
		        previousOrder,
		        previousUpdatedAt: sessionUpdatedAtByAccount[key] ?? {},
		        list,
		        orderBy,
		        sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
		      });
		      if (next.changed) syncSessionOrderAccount(key, next.order.map((id) => id), next.updatedAt);
		    }
		  }, [
		    list,
		    orderBy,
		    sessionOrderByAccount,
		    sessionUpdatedAtByAccount,
		    syncSessionOrderAccount,
		    ungroupedSessionIds,
		    workspaces
		  ]);
		  const orderedWorkspaces = (0, react4.useMemo)(() => {
		    return workspaces.map((workspace) => {
		      const stored = sessionOrderByAccount[workspace.workspaceId];
		      const sessionIds = reconciledSessionOrder(workspace.sessionIds, stored);
		      return {
		        ...workspace,
		        sessionIds
		      };
		    });
		  }, [sessionOrderByAccount, workspaces]);
		  const orderedUngroupedSessionIds = (0, react4.useMemo)(() => reconciledSessionOrder(ungroupedSessionIds, sessionOrderByAccount[""]), [sessionOrderByAccount, ungroupedSessionIds]);
		  const groups = (0, react4.useMemo)(() => deriveGroups(list, orderedWorkspaces, archivedSessionIds, {
		    expandedGroups,
		    showArchived,
		    ...sessionOrderByAccount[""] === void 0 ? {} : { ungroupedOrder: sessionOrderByAccount[""] }
		  }), [
		    list,
		    orderedWorkspaces,
		    archivedSessionIds,
		    showArchived,
		    expandedGroups,
		    sessionOrderByAccount
		  ]);
		  const now = Date.now();
		  const commitSessionDrag = (activeDrag, over) => {
		    if (sessionDropCommitted.current) return;
		    const overGroup = groups.find((candidate) => candidate.sessions.some((session) => session.id === over.id));
		    if (overGroup !== void 0 && overGroup.key !== activeDrag.accountKey) {
		      sessionDropCommitted.current = true;
		      setDrag(null);
		      onMoveSession(activeDrag.sessionId, overGroup.workspaceId ?? null).catch((reason) => {
		        console.warn("session move rejected:", reason);
		      });
		      return;
		    }
		    sessionDropCommitted.current = true;
		    setDrag(null);
		    const group = groups.find((candidate) => candidate.key === activeDrag.accountKey);
		    if (group === void 0) return;
		    const targetIndex = group.sessions.findIndex((session) => session.id === over.id);
		    if (targetIndex === -1) return;
		    const anchor = over.half === "before" ? over.id : group.sessions[targetIndex + 1]?.id;
		    if (anchor === activeDrag.sessionId) return;
		    const sourceIndex = group.sessions.findIndex((session) => session.id === activeDrag.sessionId);
		    const anchorIndex = anchor === void 0 ? group.sessions.length : group.sessions.findIndex((session) => session.id === anchor);
		    if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
		    const accountSessionIds = activeDrag.accountKey === "" ? orderedUngroupedSessionIds : orderedWorkspaces.find((workspace) => workspace.workspaceId === activeDrag.accountKey)?.sessionIds;
		    if (accountSessionIds === void 0) return;
		    const nextOrder = accountSessionIds.filter((id) => id !== activeDrag.sessionId);
		    const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
		    nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
		    setSessionOrder(activeDrag.accountKey, nextOrder.map((id) => id));
		    if (orderBy === "updated" || activeDrag.accountKey === "") return;
		    insertSessionBefore(activeDrag.accountKey, activeDrag.sessionId, anchor).catch((reason) => {
		      console.warn("session reorder rejected:", reason);
		    });
		  };
		  const commitWorkspaceDrag = (activeDrag, over) => {
		    if (workspaceDropCommitted.current) return;
		    workspaceDropCommitted.current = true;
		    setWorkspaceDrag(null);
		    const rowIndex = workspaces.findIndex((workspace) => workspace.workspaceId === over.id);
		    if (rowIndex === -1) return;
		    const anchor = over.half === "before" ? over.id : workspaces[rowIndex + 1]?.workspaceId;
		    if (anchor === activeDrag.workspaceId) return;
		    const sourceIndex = workspaces.findIndex((workspace) => workspace.workspaceId === activeDrag.workspaceId);
		    const anchorIndex = anchor === void 0 ? workspaces.length : workspaces.findIndex((workspace) => workspace.workspaceId === anchor);
		    if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
		    insertWorkspaceBefore(activeDrag.workspaceId, anchor).catch((reason) => {
		      console.warn("workspace reorder rejected:", reason);
		    });
		  };
		  const workspaceDropAtListStart = groups[0]?.workspaceId !== void 0 && workspaceDrag?.over?.id === groups[0].workspaceId && workspaceDrag.over.half === "before";
		  const commitSessionHeaderDrop = (activeDrag, targetWorkspaceId) => {
		    if (sessionDropCommitted.current) return;
		    sessionDropCommitted.current = true;
		    setDrag(null);
		    onMoveSession(activeDrag.sessionId, targetWorkspaceId).catch((reason) => {
		      console.warn("session move rejected:", reason);
		    });
		  };
		  return (0, react_jsx_runtime4.jsxs)("div", {
		    className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
		    children: [
		      workspaceDropAtListStart && (0, react_jsx_runtime4.jsx)("span", {
		        className: WorkspaceBrowser_module_css_default.listTopDropIndicator,
		        "aria-hidden": "true"
		      }),
		      (0, react_jsx_runtime4.jsxs)("div", {
		        className: clsx(WorkspaceBrowser_module_css_default.list, workspaceDropAtListStart && WorkspaceBrowser_module_css_default.listTopDropActive),
		        role: "tree",
		        "aria-label": t("section.sessions"),
		        children: [groups.length === 0 && (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.empty,
		          children: t("empty.none")
		        }), groups.map((group) => {
		          const workspaceId = group.workspaceId;
		          const workspaceMarker = workspaceId !== void 0 && workspaceDrag?.over?.id === workspaceId ? workspaceDrag.over.half : null;
		          const workspaceDragProps = workspaceId === void 0 ? void 0 : {
		            start: () => {
		              workspaceDropCommitted.current = false;
		              setWorkspaceDrag({
		                workspaceId,
		                over: null
		              });
		            },
		            end: () => {
		              if (workspaceDrag?.over !== null && workspaceDrag?.over !== void 0) commitWorkspaceDrag(workspaceDrag, workspaceDrag.over);
		              else setWorkspaceDrag(null);
		              workspaceDropCommitted.current = false;
		            }
		          };
		          const hoverWorkspace = workspaceId === void 0 ? void 0 : (half) => {
		            setWorkspaceDrag((active) => active === null ? active : {
		              ...active,
		              over: {
		                id: workspaceId,
		                half
		              }
		            });
		          };
		          const dropWorkspace = workspaceId === void 0 ? void 0 : (half) => {
		            if (workspaceDrag === null) return;
		            commitWorkspaceDrag(workspaceDrag, {
		              id: workspaceId,
		              half
		            });
		          };
		          const groupWorkspaceId = group.workspaceId ?? null;
		          const acceptsSessionDrop = drag !== null && (groupWorkspaceId ?? "") !== drag.accountKey;
		          return (0, react_jsx_runtime4.jsxs)("div", {
		            className: clsx(WorkspaceBrowser_module_css_default.groupSection, workspaceMarker === "before" && WorkspaceBrowser_module_css_default.workspaceDropBefore, workspaceMarker === "after" && WorkspaceBrowser_module_css_default.workspaceDropAfter, acceptsSessionDrop && sessionDropGroup === group.key && "dshse_sessionDropTarget"),
		            onDragOver: (e) => {
		              if (workspaceDrag !== null && hoverWorkspace !== void 0) {
		                e.preventDefault();
		                e.dataTransfer.dropEffect = "move";
		                hoverWorkspace(workspaceGroupHalf(e));
		                return;
		              }
		              if (acceptsSessionDrop) {
		                e.preventDefault();
		                e.dataTransfer.dropEffect = "move";
		                setSessionDropGroup(group.key);
		              }
		            },
		            onDrop: (e) => {
		              e.preventDefault();
		              if (workspaceDrag !== null && dropWorkspace !== void 0) {
		                dropWorkspace(workspaceGroupHalf(e));
		                return;
		              }
		              if (acceptsSessionDrop && drag !== null) commitSessionHeaderDrop(drag, groupWorkspaceId);
		            },
		            onDragLeave: (e) => {
		              if (e.currentTarget.contains(e.relatedTarget)) return;
		              setSessionDropGroup((current2) => current2 === group.key ? null : current2);
		            },
		            children: [
		              (0, react_jsx_runtime4.jsx)(ProjectRowItem, {
		                group,
		                t,
		                onToggle: () => {
		                  if (group.expanded) setExpandedSessionGroups((keys) => keys.filter((key) => key !== group.key));
		                  setGroupExpanded(group.key, !group.expanded);
		                },
		                onCreate: () => {
		                  if (group.workspaceId !== void 0) {
		                    setGroupExpanded(group.key, true);
		                    startSession(group.workspaceId);
		                  }
		                },
		                drag: workspaceDragProps,
		                actions: group.workspaceId === void 0 ? void 0 : {
		                  rename: () => {
		                    if (group.workspaceId !== void 0) onRenameRequest(group.workspaceId, group.label);
		                  },
		                  delete: () => {
		                    if (group.workspaceId !== void 0) onDeleteRequest(group.workspaceId, group.label);
		                  }
		                }
		              }),
		              (expandedSessionGroups.includes(group.key) ? group.sessions : group.sessions.slice(0, COLLAPSED_SESSION_LIMIT)).map((node) => {
		                const sameGroupDrag = drag !== null && drag.accountKey === group.key;
		                return (0, react_jsx_runtime4.jsx)(SessionNodeItem, {
		                  node,
		                  currentId: current,
		                  now,
		                  onOpen: open,
		                  onRename: onSessionRename,
		                  onFork: (sessionId) => {
		                    Promise.resolve(forkSession(sessionId)).catch((reason) => {
		                      showArchivedToast(formatForkError(reason, t));
		                    });
		                  },
		                  onArchive: onSessionArchive,
		                  onUnarchive: onSessionUnarchive,
		                  onCopySessionId,
		                  onDeleteSession: onSessionDelete,
		                  drag: {
		                    start: () => {
		                      sessionDropCommitted.current = false;
		                      setDrag({
		                        accountKey: group.key,
		                        sessionId: node.id,
		                        over: null
		                      });
		                    },
		                    active: drag !== null,
		                    marker: sameGroupDrag && drag.over?.id === node.id ? drag.over.half : null,
		                    hover: (half) => {
		                      setDrag((d) => d === null ? d : {
		                        ...d,
		                        over: {
		                          id: node.id,
		                          half
		                        }
		                      });
		                    },
		                    drop: (half) => {
		                      if (drag === null) return;
		                      commitSessionDrag(drag, {
		                        id: node.id,
		                        half
		                      });
		                    },
		                    end: () => {
		                      if (drag?.over !== null && drag?.over !== void 0) commitSessionDrag(drag, drag.over);
		                      else setDrag(null);
		                      sessionDropCommitted.current = false;
		                    }
		                  },
		                  t
		                }, node.id);
		              }),
		              group.sessions.length > COLLAPSED_SESSION_LIMIT && (0, react_jsx_runtime4.jsx)("button", {
		                type: "button",
		                className: WorkspaceBrowser_module_css_default.sessionOverflowButton,
		                "aria-expanded": expandedSessionGroups.includes(group.key),
		                onClick: () => {
		                  setExpandedSessionGroups((keys) => toggled(keys, group.key));
		                },
		                children: expandedSessionGroups.includes(group.key) ? t("sessions.collapse") : t("sessions.expand", { n: group.sessions.length - COLLAPSED_SESSION_LIMIT })
		              })
		            ]
		          }, group.key);
		        })]
		      }),
		      (0, react_jsx_runtime4.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })
		    ]
		  });
		}
		function FlatList({ useSessions, open, forkSession, onSessionRename, onSessionArchive, onSessionUnarchive, onCopySessionId, onSessionDelete, archivedSessionIds, showArchived, orderBy, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t }) {
		  const list = useSessions((s) => s);
		  const baseRows = (0, react4.useMemo)(() => deriveFlat(list, archivedSessionIds, showArchived), [list, archivedSessionIds, showArchived]);
		  const sessionIds = (0, react4.useMemo)(() => baseRows.map((row) => row.id), [baseRows]);
		  const previousOrderBy = (0, react4.useRef)(orderBy);
		  (0, react4.useEffect)(() => {
		    if (list.phase !== "ready") return;
		    const previousOrder = sessionOrderByAccount[FLAT_SESSION_ORDER_KEY];
		    const previousUpdatedAt = sessionUpdatedAtByAccount[FLAT_SESSION_ORDER_KEY] ?? {};
		    const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
		    previousOrderBy.current = orderBy;
		    const next = nextSessionOrderAccount({
		      sessionIds,
		      previousOrder,
		      previousUpdatedAt,
		      list,
		      orderBy,
		      sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
		    });
		    if (next.changed) syncSessionOrderAccount(FLAT_SESSION_ORDER_KEY, next.order.map((id) => id), next.updatedAt);
		  }, [
		    list,
		    orderBy,
		    sessionOrderByAccount,
		    sessionUpdatedAtByAccount,
		    sessionIds,
		    syncSessionOrderAccount
		  ]);
		  const rows = (0, react4.useMemo)(() => {
		    const byId = new Map(baseRows.map((row) => [row.id, row]));
		    return reconciledSessionOrder(sessionIds, sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).flatMap((id) => {
		      const row = byId.get(id);
		      return row === void 0 ? [] : [row];
		    });
		  }, [
		    baseRows,
		    sessionOrderByAccount,
		    sessionIds
		  ]);
		  const [drag, setDrag] = (0, react4.useState)(null);
		  const dropCommitted = (0, react4.useRef)(false);
		  useNativeDragAcceptance(drag !== null);
		  const commitDrag = (activeDrag, over) => {
		    if (dropCommitted.current) return;
		    dropCommitted.current = true;
		    setDrag(null);
		    const targetIndex = rows.findIndex((row) => row.id === over.id);
		    if (targetIndex === -1) return;
		    const anchor = over.half === "before" ? over.id : rows[targetIndex + 1]?.id;
		    if (anchor === activeDrag.sessionId) return;
		    const sourceIndex = rows.findIndex((row) => row.id === activeDrag.sessionId);
		    const anchorIndex = anchor === void 0 ? rows.length : rows.findIndex((row) => row.id === anchor);
		    if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
		    const nextOrder = rows.map((row) => row.id).filter((id) => id !== activeDrag.sessionId);
		    const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
		    nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
		    setSessionOrder(FLAT_SESSION_ORDER_KEY, nextOrder.map((id) => id));
		  };
		  const now = Date.now();
		  return (0, react_jsx_runtime4.jsxs)("div", {
		    className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
		    children: [(0, react_jsx_runtime4.jsxs)("div", {
		      className: clsx(WorkspaceBrowser_module_css_default.list, WorkspaceBrowser_module_css_default.flatList),
		      role: "tree",
		      "aria-label": t("section.sessions"),
		      children: [rows.length === 0 && (0, react_jsx_runtime4.jsx)("div", {
		        className: WorkspaceBrowser_module_css_default.empty,
		        children: t("empty.none")
		      }), rows.map((node) => {
		        const active = drag !== null;
		        return (0, react_jsx_runtime4.jsx)(SessionNodeItem, {
		          node,
		          currentId: list.current,
		          now,
		          onOpen: open,
		          onRename: onSessionRename,
		          onFork: (sessionId) => {
		            Promise.resolve(forkSession(sessionId)).catch((reason) => {
		              showArchivedToast(formatForkError(reason, t));
		            });
		          },
		          onArchive: onSessionArchive,
		          onUnarchive: onSessionUnarchive,
		          onCopySessionId,
		          onDeleteSession: onSessionDelete,
		          flat: true,
		          drag: {
		            start: () => {
		              dropCommitted.current = false;
		              setDrag({
		                accountKey: FLAT_SESSION_ORDER_KEY,
		                sessionId: node.id,
		                over: null
		              });
		            },
		            active,
		            marker: active && drag.over?.id === node.id ? drag.over.half : null,
		            hover: (half) => {
		              setDrag((current) => current === null ? current : {
		                ...current,
		                over: {
		                  id: node.id,
		                  half
		                }
		              });
		            },
		            drop: (half) => {
		              if (drag !== null) commitDrag(drag, {
		                id: node.id,
		                half
		              });
		            },
		            end: () => {
		              if (drag?.over !== null && drag?.over !== void 0) commitDrag(drag, drag.over);
		              else setDrag(null);
		              dropCommitted.current = false;
		            }
		          },
		          t
		        }, node.id);
		      })]
		    }), (0, react_jsx_runtime4.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
		  });
		}
		function SearchResults({ useSessions, open, workspaces, archivedSessionIds, showArchived, query, remote, resultLimit, t }) {
		  const list = useSessions((s) => s);
		  const currentRemote = remote.query === query ? remote : {
		    query,
		    status: "loading",
		    items: [],
		    hasMore: false
		  };
		  const results = (0, react4.useMemo)(() => deriveSearchResults(list, workspaces, query, archivedSessionIds, currentRemote, resultLimit, showArchived), [
		    list,
		    workspaces,
		    query,
		    archivedSessionIds,
		    currentRemote,
		    resultLimit,
		    showArchived
		  ]);
		  const pending = currentRemote.status === "loading";
		  const failed = currentRemote.status === "error";
		  return (0, react_jsx_runtime4.jsxs)("div", {
		    className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
		    children: [(0, react_jsx_runtime4.jsxs)("div", {
		      className: WorkspaceBrowser_module_css_default.list,
		      children: [
		        (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.searchTree,
		          role: "tree",
		          "aria-label": t("search.results.aria"),
		          children: results.items.map((result) => (0, react_jsx_runtime4.jsx)(SearchResultItem, {
		            result,
		            currentId: list.current,
		            onOpen: open,
		            t
		          }, result.id))
		        }),
		        pending && (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.searchStatus,
		          role: "status",
		          children: t("search.pending")
		        }),
		        failed && (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.searchWarning,
		          role: "status",
		          children: t("search.unavailable")
		        }),
		        !pending && results.items.length === 0 && (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.empty,
		          children: t("search.noMatches")
		        }),
		        results.hasMore && (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.searchStatus,
		          children: t("search.hasMore", { n: resultLimit })
		        })
		      ]
		    }), (0, react_jsx_runtime4.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
		  });
		}
		function WorkspaceBrowser({ wide, expandSidebar, useSessions, useWorkspaces, useStore, actions, startSession, open, renameSession, forkSession, renameWorkspace, deleteWorkspace, insertWorkspaceBefore, archiveSession, unarchiveSession, deleteSession, moveSession, insertSessionBefore, createWorkspace, searchSessions, searchResultLimit, useDirectoryFlow, renderSlot, t }) {
		  const workspaces = useWorkspaces((state) => state.items);
		  const workspacePhase = useWorkspaces((state) => state.phase);
		  const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
		  const sessionSnapshot = useSessions((s) => s);
		  const directoryFlowAvailable = useDirectoryFlow((occupied) => occupied);
		  const groupBy = useStore((s) => s.groupBy);
		  const orderBy = useStore((s) => s.orderBy);
		  const showArchived = useStore((s) => s.showArchived) === true;
		  const groupExpansion = useStore((s) => s.groupExpansion);
		  const sessionOrderByAccount = useStore((s) => s.sessionOrderByAccount);
		  const sessionUpdatedAtByAccount = useStore((s) => s.sessionUpdatedAtByAccount);
		  const archivedSet = (0, react4.useMemo)(() => new Set(archivedSessionIds), [archivedSessionIds]);
		  const [archivedToast, setArchivedToast] = (0, react4.useState)(null);
		  const archivedToastSeq = (0, react4.useRef)(0);
		  const showArchivedToast2 = (text) => {
		    archivedToastSeq.current += 1;
		    setArchivedToast({
		      text,
		      seq: archivedToastSeq.current
		    });
		  };
		  const [copiedToast, setCopiedToast] = (0, react4.useState)(null);
		  const copiedToastSeq = (0, react4.useRef)(0);
		  const showCopiedToast = (text) => {
		    copiedToastSeq.current += 1;
		    setCopiedToast({
		      text,
		      seq: copiedToastSeq.current
		    });
		  };
		  const onCopySessionId = (sessionId) => {
		    Promise.resolve(_deepseek_ai_dsh_client_ui_primitives4.writeClipboard(sessionId)).then((ok) => {
		      showCopiedToast(ok ? t("menu.copySessionIdCopied") : t("menu.copySessionIdFailed"));
		    });
		  };
		  const guardedOpen = (sessionId) => {
		    if (archivedSet.has(sessionId)) {
		      showArchivedToast2(t("archived.notOpenable"));
		      return;
		    }
		    open(sessionId);
		  };
		  (0, react4.useEffect)(() => {
		    if (workspacePhase !== "ready") return;
		    actions.retainAccountKeys([
		      "",
		      FLAT_SESSION_ORDER_KEY,
		      ...workspaces.map((workspace) => workspace.workspaceId)
		    ]);
		  }, [
		    actions.retainAccountKeys,
		    workspacePhase,
		    workspaces
		  ]);
		  const [query, setQuery] = (0, react4.useState)("");
		  const [searchExpanded, setSearchExpanded] = (0, react4.useState)(false);
		  const normalizedQuery = sanitizeSearchQuery(query).trim();
		  const [remoteSearch, setRemoteSearch] = (0, react4.useState)({
		    query: "",
		    status: "idle",
		    items: [],
		    hasMore: false
		  });
		  const searchRoot = (0, react4.useRef)(null);
		  const searchInput = (0, react4.useRef)(null);
		  const [wsPickerOpen, setWsPickerOpen] = (0, react4.useState)(false);
		  const wsPlusRef = (0, react4.useRef)(null);
		  const composingRef = (0, react4.useRef)(false);
		  const [searchOnExpand, setSearchOnExpand] = (0, react4.useState)(false);
		  (0, react4.useEffect)(() => {
		    if (wide && searchOnExpand) {
		      const timer = window.setTimeout(() => {
		        searchInput.current?.focus({ preventScroll: true });
		        setSearchOnExpand(false);
		      }, EXPAND_SLIDE_MS);
		      return () => {
		        window.clearTimeout(timer);
		      };
		    }
		  }, [wide, searchOnExpand]);
		  (0, react4.useEffect)(() => {
		    if (!wide || !searchExpanded || searchOnExpand) return;
		    searchInput.current?.focus({ preventScroll: true });
		  }, [
		    wide,
		    searchExpanded,
		    searchOnExpand
		  ]);
		  (0, react4.useEffect)(() => {
		    if (!wide || !searchExpanded) return;
		    const onClick = (event) => {
		      if (!(event.target instanceof Node) || searchRoot.current?.contains(event.target) === true) return;
		      searchInput.current?.blur();
		      if (normalizedQuery !== "") return;
		      setSearchExpanded(false);
		    };
		    document.addEventListener("click", onClick);
		    return () => {
		      document.removeEventListener("click", onClick);
		    };
		  }, [
		    normalizedQuery,
		    wide,
		    searchExpanded
		  ]);
		  (0, react4.useEffect)(() => {
		    if (normalizedQuery === "") {
		      setRemoteSearch({
		        query: "",
		        status: "idle",
		        items: [],
		        hasMore: false
		      });
		      return;
		    }
		    const controller = new AbortController();
		    setRemoteSearch({
		      query: normalizedQuery,
		      status: "loading",
		      items: [],
		      hasMore: false
		    });
		    const timer = window.setTimeout(() => {
		      searchSessions(normalizedQuery, controller.signal).then((result) => {
		        if (controller.signal.aborted) return;
		        setRemoteSearch({
		          query: normalizedQuery,
		          status: "ready",
		          items: result.items,
		          hasMore: result.hasMore
		        });
		      }).catch(() => {
		        if (controller.signal.aborted) return;
		        setRemoteSearch({
		          query: normalizedQuery,
		          status: "error",
		          items: [],
		          hasMore: false
		        });
		      });
		    }, SEARCH_DEBOUNCE_MS);
		    return () => {
		      window.clearTimeout(timer);
		      controller.abort();
		    };
		  }, [normalizedQuery, searchSessions]);
		  const [renameTarget, setRenameTarget] = (0, react4.useState)(null);
		  const [renameDraft, setRenameDraft] = (0, react4.useState)("");
		  const [renaming, setRenaming] = (0, react4.useState)(false);
		  const [renameError, setRenameError] = (0, react4.useState)(null);
		  const renameTrimmed = renameDraft.trim();
		  const renameDuplicate = renameTarget !== null && renameTrimmed !== "" && renameTrimmed !== renameTarget.currentTitle && workspaces.some((w) => w.title === renameTrimmed);
		  const renameBlocked = renaming || renameTrimmed === "" || renameTarget === null || renameTrimmed === renameTarget.currentTitle || renameDuplicate;
		  const closeRename = () => {
		    if (renaming) return;
		    setRenameTarget(null);
		    setRenameError(null);
		  };
		  const confirmRename = () => {
		    if (renameBlocked) return;
		    setRenaming(true);
		    setRenameError(null);
		    renameWorkspace(renameTarget.workspaceId, renameTrimmed).then(() => {
		      setRenaming(false);
		      setRenameTarget(null);
		    }).catch((reason) => {
		      setRenaming(false);
		      setRenameError(reason instanceof Error ? reason.message : String(reason));
		    });
		  };
		  const [sessionRenameTarget, setSessionRenameTarget] = (0, react4.useState)(null);
		  const [sessionRenameDraft, setSessionRenameDraft] = (0, react4.useState)("");
		  const [sessionRenaming, setSessionRenaming] = (0, react4.useState)(false);
		  const [sessionRenameError, setSessionRenameError] = (0, react4.useState)(null);
		  const sessionRenameTrimmed = sessionRenameDraft.trim();
		  const sessionRenameBlocked = sessionRenaming || sessionRenameTrimmed === "" || sessionRenameTarget === null;
		  const closeSessionRename = () => {
		    if (sessionRenaming) return;
		    setSessionRenameTarget(null);
		    setSessionRenameError(null);
		  };
		  const confirmSessionRename = () => {
		    if (sessionRenameBlocked) return;
		    setSessionRenaming(true);
		    setSessionRenameError(null);
		    renameSession(sessionRenameTarget.sessionId, sessionRenameTrimmed).then(() => {
		      setSessionRenaming(false);
		      setSessionRenameTarget(null);
		    }).catch((reason) => {
		      setSessionRenaming(false);
		      setSessionRenameError(reason instanceof Error ? reason.message : String(reason));
		    });
		  };
		  const onSessionRename = (sessionId, currentTitle) => {
		    setSessionRenameTarget({
		      sessionId,
		      currentTitle
		    });
		    setSessionRenameDraft(currentTitle);
		    setSessionRenameError(null);
		  };
		  const onSessionArchive = (sessionId) => {
		    archiveSession(sessionId).catch((reason) => {
		      showArchivedToast2(formatArchiveError(reason, t));
		    });
		  };
		  const [deleteTarget, setDeleteTarget] = (0, react4.useState)(null);
		  const [deleting, setDeleting] = (0, react4.useState)(false);
		  const [deleteCommittedId, setDeleteCommittedId] = (0, react4.useState)(null);
		  const [deleteError, setDeleteError] = (0, react4.useState)(null);
		  (0, react4.useEffect)(() => {
		    if (deleteCommittedId === null || workspaces.some((workspace) => workspace.workspaceId === deleteCommittedId)) return;
		    setDeleting(false);
		    setDeleteCommittedId(null);
		    setDeleteTarget(null);
		  }, [deleteCommittedId, workspaces]);
		  const closeDelete = () => {
		    if (deleting) return;
		    setDeleteTarget(null);
		    setDeleteError(null);
		  };
		  const confirmDelete = () => {
		    if (deleting || deleteTarget === null) return;
		    setDeleting(true);
		    setDeleteCommittedId(null);
		    setDeleteError(null);
		    deleteWorkspace(deleteTarget.workspaceId).then(() => {
		      setDeleteCommittedId(deleteTarget.workspaceId);
		    }).catch((reason) => {
		      setDeleting(false);
		      setDeleteError(reason instanceof Error ? reason.message : String(reason));
		    });
		  };
		  const onSessionUnarchive = (sessionId) => {
		    unarchiveSession(sessionId).catch((reason) => {
		      showArchivedToast2(formatUnarchiveError(reason, t));
		    });
		  };
		  const [deleteSessionTarget, setDeleteSessionTarget] = (0, react4.useState)(null);
		  const [deletingSession, setDeletingSession] = (0, react4.useState)(false);
		  const [deleteSessionCommittedId, setDeleteSessionCommittedId] = (0, react4.useState)(null);
		  const [deleteSessionError, setDeleteSessionError] = (0, react4.useState)(null);
		  (0, react4.useEffect)(() => {
		    if (deleteSessionCommittedId === null || archivedSet.has(deleteSessionCommittedId) || workspaces.some((workspace) => workspace.sessionIds.includes(deleteSessionCommittedId))) return;
		    setDeletingSession(false);
		    setDeleteSessionCommittedId(null);
		    setDeleteSessionTarget(null);
		  }, [deleteSessionCommittedId, archivedSet, workspaces]);
		  const closeDeleteSession = () => {
		    if (deletingSession) return;
		    setDeleteSessionTarget(null);
		    setDeleteSessionError(null);
		  };
		  const confirmDeleteSession = () => {
		    if (deletingSession || deleteSessionTarget === null) return;
		    setDeletingSession(true);
		    setDeleteSessionError(null);
		    const rootId = deleteSessionTarget.sessionId;
		    (async () => {
		      await deleteSession(rootId);
		    })().then(() => {
		      setDeletingSession(false);
		      setDeleteSessionTarget(null);
		      setDeleteSessionCommittedId(rootId);
		    }).catch((reason) => {
		      setDeletingSession(false);
		      setDeleteSessionError(formatDeleteError(reason, t));
		    });
		  };
		  return (0, react_jsx_runtime4.jsxs)("div", {
		    className: clsx(WorkspaceBrowser_module_css_default.root, !wide && WorkspaceBrowser_module_css_default.rail),
		    children: [
		      (0, react_jsx_runtime4.jsxs)("div", {
		        className: WorkspaceBrowser_module_css_default.sectionHeader,
		        children: [
		          wide && (0, react_jsx_runtime4.jsx)("span", {
		            className: clsx(WorkspaceBrowser_module_css_default.sectionLabel, WorkspaceBrowser_module_css_default.wide, searchExpanded && WorkspaceBrowser_module_css_default.sectionLabelHidden),
		            children: groupBy === "flat" ? t("section.sessions") : t("section.workspaces")
		          }),
		          wide && (0, react_jsx_runtime4.jsx)("div", {
		            className: clsx(WorkspaceBrowser_module_css_default.searchSlot, searchExpanded && WorkspaceBrowser_module_css_default.searchSlotExpanded),
		            children: (0, react_jsx_runtime4.jsxs)("div", {
		              ref: searchRoot,
		              className: clsx(WorkspaceBrowser_module_css_default.search, searchExpanded && WorkspaceBrowser_module_css_default.searchExpanded),
		              onClick: () => {
		                setWsPickerOpen(false);
		                setSearchExpanded(true);
		                searchInput.current?.focus();
		              },
		              children: [
		                (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Tooltip, {
		                  label: t("search"),
		                  side: "bottom",
		                  delayMs: 500,
		                  disabled: searchExpanded,
		                  children: (0, react_jsx_runtime4.jsx)("button", {
		                    type: "button",
		                    className: WorkspaceBrowser_module_css_default.searchButton,
		                    "aria-label": t("search.sessions.aria"),
		                    "aria-expanded": searchExpanded,
		                    onClick: () => {
		                      setWsPickerOpen(false);
		                      setSearchExpanded(true);
		                    },
		                    children: (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.IconSearchOutline16, { size: searchExpanded ? 11 : 14 })
		                  })
		                }),
		                (0, react_jsx_runtime4.jsx)("input", {
		                  ref: searchInput,
		                  className: WorkspaceBrowser_module_css_default.searchInput,
		                  type: "text",
		                  placeholder: t("search.placeholder"),
		                  maxLength: SEARCH_QUERY_MAX_CODE_UNITS,
		                  value: query,
		                  tabIndex: searchExpanded ? 0 : -1,
		                  onChange: (e) => {
		                    setQuery(sanitizeSearchQuery(e.target.value));
		                  },
		                  onKeyDown: (e) => {
		                    if (e.key !== "Escape") return;
		                    setQuery("");
		                    setSearchExpanded(false);
		                  }
		                }),
		                searchExpanded && (0, react_jsx_runtime4.jsx)("button", {
		                  type: "button",
		                  className: WorkspaceBrowser_module_css_default.clearButton,
		                  "aria-label": t("search.clear"),
		                  onClick: (e) => {
		                    e.stopPropagation();
		                    setQuery("");
		                    setSearchExpanded(false);
		                  },
		                  children: (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.IconCloseFill14, {})
		                })
		              ]
		            })
		          }),
		          (0, react_jsx_runtime4.jsxs)("div", {
		            className: clsx(WorkspaceBrowser_module_css_default.headerActions, wide && searchExpanded && WorkspaceBrowser_module_css_default.headerActionsHidden),
		            children: [wide && (0, react_jsx_runtime4.jsx)(ViewOptionsMenu, {
		              groupBy,
		              orderBy,
		              onGroupPick: (mode) => {
		                actions.setGroupBy(mode);
		              },
		              onOrderPick: (mode) => {
		                actions.setOrderBy(mode);
		              },
		              t
		            }), directoryFlowAvailable && (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Tooltip, {
		              label: t("workspace.add"),
		              side: "bottom",
		              delayMs: 500,
		              children: (0, react_jsx_runtime4.jsx)("button", {
		                ref: wsPlusRef,
		                type: "button",
		                className: WorkspaceBrowser_module_css_default.iconButton,
		                "aria-label": t("workspace.add"),
		                onClick: () => {
		                  setWsPickerOpen((v) => !v);
		                },
		                children: (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.IconProjectAddOutline16, { size: wide ? 16 : 18 })
		              })
		            })]
		          }),
		          (0, react_jsx_runtime4.jsx)(WorkspacePickFlow, {
		            t,
		            open: wsPickerOpen,
		            anchorRef: wsPlusRef,
		            useWorkspaces,
		            createWorkspace,
		            useDirectoryFlow,
		            renderDirectoryFlow: (owner) => renderSlot("sidebar.workspaces.directoryFlow", owner),
		            addOnly: true,
		            side: "right",
		            onPick: (workspaceId) => {
		              setWsPickerOpen(false);
		              startSession(workspaceId);
		            },
		            onClose: () => {
		              setWsPickerOpen(false);
		            }
		          })
		        ]
		      }),
		      !wide && (0, react_jsx_runtime4.jsx)("div", {
		        className: WorkspaceBrowser_module_css_default.search,
		        children: (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Tooltip, {
		          label: t("search"),
		          children: (0, react_jsx_runtime4.jsx)("button", {
		            type: "button",
		            className: WorkspaceBrowser_module_css_default.searchButton,
		            "aria-label": t("search.sessions.aria"),
		            onClick: () => {
		              setSearchExpanded(true);
		              setSearchOnExpand(true);
		              expandSidebar();
		            },
		            children: (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.IconSearchOutline16, { size: 18 })
		          })
		        })
		      }),
		      (0, react_jsx_runtime4.jsx)("div", {
		        className: WorkspaceBrowser_module_css_default.listArea,
		        children: wide && (normalizedQuery !== "" ? (0, react_jsx_runtime4.jsx)(SearchResults, {
		          useSessions,
		          open: guardedOpen,
		          workspaces,
		          archivedSessionIds,
		          showArchived,
		          query: normalizedQuery,
		          remote: remoteSearch,
		          resultLimit: searchResultLimit,
		          t
		        }) : groupBy === "flat" ? (0, react_jsx_runtime4.jsx)(FlatList, {
		          useSessions,
		          open: guardedOpen,
		          forkSession,
		          onSessionRename,
		          onSessionArchive,
		          onSessionUnarchive,
		          onCopySessionId,
		          onSessionDelete: (sessionId, title) => {
		            setDeleteSessionTarget({ sessionId, title });
		            setDeleteSessionError(null);
		          },
		          archivedSessionIds,
		          showArchived,
		          orderBy,
		          sessionOrderByAccount,
		          sessionUpdatedAtByAccount,
		          syncSessionOrderAccount: actions.syncSessionOrderAccount,
		          setSessionOrder: actions.setSessionOrder,
		          t
		        }) : (0, react_jsx_runtime4.jsx)(SessionTree, {
		          useSessions,
		          onSessionRename,
		          onSessionArchive,
		          onSessionUnarchive,
		          onCopySessionId,
		          onSessionDelete: (sessionId, title) => {
		            setDeleteSessionTarget({ sessionId, title });
		            setDeleteSessionError(null);
		          },
		          onMoveSession: moveSession,
		          forkSession,
		          workspaces,
		          groupExpansion,
		          setGroupExpanded: actions.setGroupExpanded,
		          sessionOrderByAccount,
		          sessionUpdatedAtByAccount,
		          syncSessionOrderAccount: actions.syncSessionOrderAccount,
		          setSessionOrder: actions.setSessionOrder,
		          archivedSessionIds,
		          showArchived,
		          startSession,
		          open: guardedOpen,
		          insertWorkspaceBefore,
		          insertSessionBefore,
		          orderBy,
		          t,
		          onRenameRequest: (workspaceId, currentTitle) => {
		            setRenameTarget({
		              workspaceId,
		              currentTitle
		            });
		            setRenameDraft(currentTitle);
		            setRenameError(null);
		          },
		          onDeleteRequest: (workspaceId, title) => {
		            setDeleteTarget({
		              workspaceId,
		              title
		            });
		            setDeleteError(null);
		          }
		        }))
		      }),
		      (0, react_jsx_runtime4.jsxs)(_deepseek_ai_dsh_client_ui_primitives4.Modal, {
		        open: renameTarget !== null,
		        onClose: closeRename,
		        closeLabel: t("close"),
		        title: t("rename.workspace.title"),
		        footer: (0, react_jsx_runtime4.jsxs)(react_jsx_runtime4.Fragment, {
		          children: [(0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Button, {
		            variant: "outline",
		            disabled: renaming,
		            onClick: closeRename,
		            children: t("cancel")
		          }), (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Button, {
		            variant: "primary",
		            disabled: renameBlocked,
		            onClick: confirmRename,
		            children: t("rename")
		          })]
		        }),
		        children: [
		          (0, react_jsx_runtime4.jsx)("input", {
		            className: WorkspaceBrowser_module_css_default.renameInput,
		            value: renameDraft,
		            "aria-label": t("field.workspaceName"),
		            autoFocus: true,
		            disabled: renaming,
		            onFocus: (e) => {
		              e.target.select();
		            },
		            onChange: (e) => {
		              setRenameDraft(e.target.value);
		              setRenameError(null);
		            },
		            onCompositionStart: () => {
		              composingRef.current = true;
		            },
		            onCompositionEnd: () => {
		              composingRef.current = false;
		            },
		            onKeyDown: (e) => {
		              if (e.key === "Enter" && !composingRef.current) {
		                e.preventDefault();
		                confirmRename();
		              }
		            }
		          }),
		          renameDuplicate && (0, react_jsx_runtime4.jsx)("div", {
		            className: WorkspaceBrowser_module_css_default.renameError,
		            role: "alert",
		            children: t("conflict.named", { name: renameTrimmed })
		          }),
		          renameError !== null && (0, react_jsx_runtime4.jsx)("div", {
		            className: WorkspaceBrowser_module_css_default.renameError,
		            role: "alert",
		            children: renameError
		          })
		        ]
		      }),
		      (0, react_jsx_runtime4.jsxs)(_deepseek_ai_dsh_client_ui_primitives4.Modal, {
		        open: sessionRenameTarget !== null,
		        onClose: closeSessionRename,
		        closeLabel: t("close"),
		        title: t("rename.session.title"),
		        footer: (0, react_jsx_runtime4.jsxs)(react_jsx_runtime4.Fragment, {
		          children: [(0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Button, {
		            variant: "outline",
		            disabled: sessionRenaming,
		            onClick: closeSessionRename,
		            children: t("cancel")
		          }), (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Button, {
		            variant: "primary",
		            disabled: sessionRenameBlocked,
		            onClick: confirmSessionRename,
		            children: t("rename")
		          })]
		        }),
		        children: [(0, react_jsx_runtime4.jsx)("input", {
		          className: WorkspaceBrowser_module_css_default.renameInput,
		          value: sessionRenameDraft,
		          "aria-label": t("field.sessionName"),
		          autoFocus: true,
		          disabled: sessionRenaming,
		          onFocus: (e) => {
		            e.target.select();
		          },
		          onChange: (e) => {
		            setSessionRenameDraft(e.target.value);
		            setSessionRenameError(null);
		          },
		          onCompositionStart: () => {
		            composingRef.current = true;
		          },
		          onCompositionEnd: () => {
		            composingRef.current = false;
		          },
		          onKeyDown: (e) => {
		            if (e.key === "Enter" && !composingRef.current) {
		              e.preventDefault();
		              confirmSessionRename();
		            }
		          }
		        }), sessionRenameError !== null && (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.renameError,
		          role: "alert",
		          children: sessionRenameError
		        })]
		      }),
		      (0, react_jsx_runtime4.jsxs)(_deepseek_ai_dsh_client_ui_primitives4.Modal, {
		        open: deleteTarget !== null,
		        onClose: closeDelete,
		        closeLabel: t("close"),
		        title: t("delete.workspace"),
		        ...deleteTarget === null ? {} : { description: t("delete.desc", { name: deleteTarget.title }) },
		        footer: (0, react_jsx_runtime4.jsxs)(react_jsx_runtime4.Fragment, {
		          children: [(0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Button, {
		            variant: "outline",
		            disabled: deleting,
		            onClick: closeDelete,
		            children: t("cancel")
		          }), (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Button, {
		            variant: "outline",
		            className: WorkspaceBrowser_module_css_default.deleteAction,
		            disabled: deleting,
		            onClick: confirmDelete,
		            children: t("delete.workspace")
		          })]
		        }),
		        children: [deleting && (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.deleteStatus,
		          role: "status",
		          children: t("delete.pending")
		        }), deleteError !== null && (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.renameError,
		          role: "alert",
		          children: deleteError
		        })]
		      }),
		      (0, react_jsx_runtime4.jsxs)(_deepseek_ai_dsh_client_ui_primitives4.Modal, {
		        open: deleteSessionTarget !== null,
		        onClose: closeDeleteSession,
		        closeLabel: t("close"),
		        title: t("deleteSession.title"),
		        ...deleteSessionTarget === null ? {} : { description: t("deleteSession.desc", { name: deleteSessionTarget.title }) },
		        footer: (0, react_jsx_runtime4.jsxs)(react_jsx_runtime4.Fragment, {
		          children: [(0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Button, {
		            variant: "outline",
		            disabled: deletingSession,
		            onClick: closeDeleteSession,
		            children: t("cancel")
		          }), (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Button, {
		            variant: "outline",
		            className: WorkspaceBrowser_module_css_default.deleteAction,
		            disabled: deletingSession,
		            onClick: confirmDeleteSession,
		            children: t("deleteSession.title")
		          })]
		        }),
		        children: [deletingSession && (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.deleteStatus,
		          role: "status",
		          children: t("deleteSession.pending")
		        }), deleteSessionError !== null && (0, react_jsx_runtime4.jsx)("div", {
		          className: WorkspaceBrowser_module_css_default.renameError,
		          role: "alert",
		          children: deleteSessionError
		        })]
		      }),
		      archivedToast !== null && (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Toast, {
		        key: archivedToast.seq,
		        text: archivedToast.text,
		        onDone: () => {
		          setArchivedToast(null);
		        }
		      }),
		      copiedToast !== null && (0, react_jsx_runtime4.jsx)(_deepseek_ai_dsh_client_ui_primitives4.Toast, {
		        key: copiedToast.seq,
		        text: copiedToast.text,
		        onDone: () => {
		          setCopiedToast(null);
		        }
		      })
		    ]
		  });
		}
		
		// src/client/index.js
		var NS = "workspace";
		var inject = [
		  "slots",
		  "sessions",
		  "workspaces",
		  "locale",
		  "remote",
		  "typert"
		];
		async function apply(ctx) {
		  const remote = ctx.get("remote");
		  let disposeRemote = () => {
		  };
		  if (remote !== void 0) disposeRemote = await remote.$mount(SESSION_ENHANCE_REMOTE);
		  applyWorkspaceBrowser(ctx);
		  return async () => {
		    await disposeRemote();
		  };
		}
		function applyWorkspaceBrowser(ctx) {
		  ctx.effect(() => ctx.locale.register(NS, {
		    zh,
		    en
		  }), "dsh-session-enhance: dictionaries");
		  ctx.effect(() => installEnhanceNavIconSwap(), "dsh-session-enhance: enhance nav icon");
		  const searchSessions = async (query, signal) => {
		    const result = await ctx.sessions.search(query, signal);
		    if (!result.ok) throw new Error(result.error.message);
		    return result.value;
		  };
		  const flowSource = (hole) => ({
		    getSnapshot: () => ctx.slots.entries(hole).length > 0,
		    subscribe: (listener) => ctx.slots.subscribe(hole, listener)
		  });
		  const browserFlowSource = flowSource("sidebar.workspaces.directoryFlow");
		  const pickerFlowSource = flowSource("conversation.hero.workspace.directoryFlow");
		  const unarchiveSession = async (sessionId) => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.unarchiveSession(sessionId);
		    if (!result.ok) throw new Error(result.error.message);
		  };
		  const deleteSession = async (sessionId) => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.deleteSession(sessionId);
		    if (!result.ok) throw new Error(result.error.message);
		  };
		  const moveSession = async (sessionId, targetWorkspaceId) => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const wasCurrent = ctx.sessions.list.getSnapshot().current === sessionId;
		    const result = await registry.moveSession(sessionId, targetWorkspaceId);
		    if (!result.ok) throw new Error(result.error.message);
		    if (typeof ctx.sessions?.refresh === "function") {
		      const refreshed = ctx.sessions.refresh();
		      if (wasCurrent) {
		        refreshed.then(() => {
		          rearmMovedSession(sessionId);
		        }).catch((reason) => {
		          console.warn("session list refresh after move rejected:", reason);
		        });
		      } else {
		        refreshed.catch((reason) => {
		          console.warn("session list refresh after move rejected:", reason);
		        });
		      }
		    }
		    return result.value;
		  };
		  const rearmMovedSession = (sessionId) => {
		    try {
		      ctx.sessions.open(sessionId);
		    } catch (reason) {
		      console.warn("reopen of the moved current session rejected:", reason);
		    }
		    const inst = ctx.sessions.binding?.(sessionId)?.session;
		    if (inst === void 0) return;
		    const clearRemoved = () => {
		      if (inst.removed) {
		        inst.removed = false;
		        inst.notifier?.markDirty?.();
		        console.warn(`[dsh-session-enhance] cleared removed flag on moved session ${sessionId}`);
		      }
		    };
		    clearRemoved();
		    const unsub = typeof inst.subscribe === "function" ? inst.subscribe(clearRemoved) : void 0;
		    setTimeout(() => {
		      clearRemoved();
		      if (typeof unsub === "function") unsub();
		    }, 2e3);
		  };
		  const unarchiveSessions = async (target) => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.unarchiveSessions(target);
		    if (!result.ok) throw new Error(result.error.message);
		    return result.value;
		  };
		  const deleteArchivedSessions = async (target) => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.deleteArchivedSessions(target);
		    if (!result.ok) throw new Error(result.error.message);
		    return result.value;
		  };
		  const archivedSessionMetadata = async () => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.archivedSessionMetadata();
		    if (!result.ok) throw new Error(result.error.message);
		    return result.value;
		  };
		  const previewSession = async (sessionId) => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.previewSession(sessionId);
		    if (!result.ok) throw new Error(result.error.message);
		    return result.value;
		  };
		  const syncRecords = async () => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.syncRecords();
		    if (!result.ok) throw new Error(result.error.message);
		    return result.value;
		  };
		  const getSettings = async () => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.getSettings();
		    if (!result.ok) throw new Error(result.error.message);
		    return result.value;
		  };
		  const setSettings = async (settings) => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.setSettings(settings);
		    if (!result.ok) throw new Error(result.error.message);
		    return result.value;
		  };
		  const listEmptyWorkspaceDirectories = async () => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.listEmptyWorkspaceDirectories();
		    if (!result.ok) throw new Error(result.error.message);
		    return result.value;
		  };
		  const deleteEmptyWorkspaceDirectory = async (name) => {
		    const registry = ctx.get("remote.workspaceRegistry");
		    if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		    const result = await registry.deleteEmptyWorkspaceDirectory(name);
		    if (!result.ok) throw new Error(result.error.message);
		    return result.value;
		  };
		  ctx.effect(() => installConversationNotifier(ctx, getSettings, ctx.locale.bind(NS)), "dsh-session-enhance: conversation notifier");
		  const browserInjected = () => ({
		    startSession: (workspaceId) => {
		      ctx.workspaces.startSession(workspaceId);
		    },
		    open: (sessionId) => {
		      ctx.sessions.open(sessionId);
		    },
		    searchSessions,
		    searchResultLimit: ctx.sessions.searchResultLimit,
		    renameSession: async (sessionId, title) => {
		      const session = ctx.sessions.binding(sessionId)?.session;
		      if (session === void 0) throw new Error(`unknown session "${sessionId}"`);
		      const result = await session.rename(title);
		      if (!result.ok) throw new Error(result.error.message);
		    },
		    forkSession: (sessionId) => ctx.sessions.fork({
		      sessionId,
		      increaseTitle: true
		    }).then((childId) => {
		      ctx.sessions.open(childId);
		    }),
		    renameWorkspace: async (workspaceId, title) => {
		      await ctx.workspaces.rename(workspaceId, title);
		    },
		    deleteWorkspace: async (workspaceId) => {
		      await ctx.workspaces.delete(workspaceId);
		    },
		    insertWorkspaceBefore: async (workspaceId, beforeWorkspaceId) => {
		      await ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId);
		    },
		    archiveSession: async (sessionId) => {
		      await ctx.workspaces.archiveSession(sessionId);
		    },
		    unarchiveSession,
		    deleteSession,
		    moveSession,
		    insertSessionBefore: async (workspaceId, sessionId, beforeSessionId) => {
		      await ctx.workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId);
		    },
		    createWorkspace: (input) => ctx.workspaces.create(input),
		    hooks: { directoryFlow: browserFlowSource }
		  });
		  const pickerInjected = () => ({
		    createWorkspace: (input) => ctx.workspaces.create(input),
		    hooks: { directoryFlow: pickerFlowSource }
		  });
		  ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
		    name: "sidebar.workspaces",
		    children: {
		      "sidebar.workspaces.directoryFlow": {
		        kind: "single",
		        scope: "root"
		      }
		    },
		    store: createWorkspaceViewStore(),
		    inject: browserInjected,
		    locale: NS
		  }, WorkspaceBrowser));
		  ctx.slots.inject("conversation.hero.workspace", () => ctx.slots.register({
		    name: "conversation.hero.workspace",
		    children: {
		      "conversation.hero.workspace.directoryFlow": {
		        kind: "single",
		        scope: "root"
		      }
		    },
		    inject: pickerInjected,
		    locale: NS
		  }, WorkspacePicker));
		  ctx.slots.inject("settings.section", () => ctx.slots.register({
		    name: "settings.section",
		    id: "conversation-enhance",
		    order: 18,
		    label: () => ctx.locale.bind(NS)("settings.manageTitle"),
		    icon: "settings",
		    locale: NS,
		    inject: () => ({
		      sessionStore: ctx.sessions.list,
		      workspaceStore: ctx.workspaces.list,
		      unarchiveSession,
		      deleteSession,
		      unarchiveSessions,
		      deleteArchivedSessions,
		      archivedSessionMetadata,
		      previewSession,
		      syncRecords,
		      getSettings,
		      setSettings,
		      listEmptyWorkspaceDirectories,
		      deleteEmptyWorkspaceDirectory,
		      deleteWorkspace: async (workspaceId) => {
		        await ctx.workspaces.delete(workspaceId);
		      },
		      pickDirectory: () => ctx.workspaces.pickDirectory(),
		      t: ctx.locale.bind(NS)
		    })
		  }, EnhancementSection));
		}
		var __test = {
		  displayTitle,
		  sessionVisible,
		  isUnknownSessionError,
		  deriveGroups,
		  deriveFlat,
		  deriveSearchResults,
		  deriveArchivedGroups,
		  sortArchivedGroups,
		  deriveArchivedBatchIds,
		  createWorkspaceViewStore,
		  groupByWorkspace,
		  byRecency,
		  SESSION_ENHANCE_REMOTE
		};
		return module.exports;
	}
});
