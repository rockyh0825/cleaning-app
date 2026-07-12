import { useQuery } from "@tanstack/react-query";
import type { CleaningRecordRepository } from "../repositories/CleaningRecordRepository";
import type { Part } from "../types";

type PartListQueryKey = readonly ["parts", { userId: string }];

type PartListRepository = Pick<CleaningRecordRepository, "listParts">;

export function buildPartListQuery(
  userId: string,
  repository: PartListRepository,
) {
  return {
    queryKey: ["parts", { userId }] as PartListQueryKey,
    queryFn: () => repository.listParts(userId),
    enabled: userId !== "",
  };
}

export function filterPartsByOwner(
  parts: Part[] | undefined,
  ownerId: string,
): Part[] {
  return (parts ?? []).filter((part) => part.ownerId === ownerId);
}

export function buildPartNamesById(
  parts: Part[] | undefined,
): Record<string, string> {
  return Object.fromEntries((parts ?? []).map((part) => [part.id, part.name]));
}

/**
 * ユーザーの全パーツから partId → パーツ名の対応表を取得するフック。
 * 履歴一覧など、partId しか持たないデータに名前を表示する用途で使う。
 * userId が未解決（空文字）の間はフェッチしない。
 */
export function usePartNames(userId: string, repository: PartListRepository) {
  const query = useQuery(buildPartListQuery(userId, repository));

  return {
    partNamesById: buildPartNamesById(query.data),
    isPending: query.isPending,
    isError: query.isError,
  };
}

/**
 * 指定エリア（ownerId = areaId）に属するパーツリストを取得するフック。
 * userId が未解決（空文字）の間はフェッチしない。
 */
export function usePartList(
  userId: string,
  areaId: string,
  repository: PartListRepository,
) {
  const query = useQuery(buildPartListQuery(userId, repository));

  return {
    parts: filterPartsByOwner(query.data, areaId),
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  };
}
