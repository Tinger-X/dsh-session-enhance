/**
 * dsh-session-enhance 共享常量。
 *
 * 生产代码（session-move.js）与测试（scripts/session-move.test.mjs）同源，
 * 避免两边各自维护一份导致漂移。
 */
import { constants } from "node:zlib";

/** 与 @deepseek-ai/dsh-session-persistence-jsonl 后端一致的 zstd 选项（checksum 帧）。 */
export const CHECKSUM_OPTIONS = { params: { [constants.ZSTD_c_checksumFlag]: 1 } };

/** zstd 帧魔数（little-endian）。 */
export const ZSTD_MAGIC = 4247762216;
