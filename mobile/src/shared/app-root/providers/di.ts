/**
 * DI配線。Capability インターフェースと実装を繋ぐ。
 * ビジネスロジックは持たない。
 *
 * 注意: DefaultApi は `scripts/generate-api-client.sh` で生成されるコードのため
 * gitignore 対象。本番環境では生成後にインポート可能になる。
 * 現時点では stub として any 型でインスタンスを渡す。
 */

import { LayoutRepository } from '@/features/layout/repositories/LayoutRepository';
import { LayoutCapabilityImpl } from '@/features/layout/repositories/LayoutCapabilityImpl';
import type { LayoutCapability } from '@/capabilities/LayoutCapability';

// DefaultApi は生成コードのため stub を使用
// 本番では: import { DefaultApi } from '@/shared/api/apis/DefaultApi';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiStub: any = {};

const layoutRepository = new LayoutRepository(apiStub);

export const layoutCapability: LayoutCapability = new LayoutCapabilityImpl(layoutRepository);
