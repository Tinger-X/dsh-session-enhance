import { Remote } from "@deepseek-ai/dsh-typert-protocol";

/**
 * 为实例上的方法登记 typert Remote 方法。
 *
 * 模拟 TS 装饰器管线 `@Remote(method)`：`Remote` 返回标准方法装饰器，
 * 这里构造一个 addInitializer 立即以 `this` = instance 执行的装饰器上下文。
 * @param {object} instance - 服务实例。
 * @param {string} method - 方法名。
 */
export function remoteMethod(instance, method) {
	const context = {
		private: false,
		static: false,
		name: method,
		addInitializer(fn) {
			fn.call(instance);
		}
	};
	Remote(method)(void 0, context);
}
