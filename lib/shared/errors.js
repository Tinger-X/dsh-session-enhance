/**
 * dsh-session-enhance 共享领域错误。
 */
function unknownSessionMessage(sessionId) {
	return `unknown session "${sessionId}" (UNKNOWN_SESSION)`;
}
export class SessionEnhanceUnknownSessionError extends Error {
	sessionId;
	constructor(sessionId) {
		super(unknownSessionMessage(sessionId));
		this.sessionId = sessionId;
		this.name = "SessionEnhanceUnknownSessionError";
	}
}
