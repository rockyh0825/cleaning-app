import React from 'react';
import { Alert, ScrollView } from 'react-native';
import {
    act,
    render,
    screen,
    fireEvent,
    waitFor,
    within,
} from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
    fireGestureHandler,
    getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FloorPlanIndexScreen from '../index';

// expo-router をモック（部屋タップで詳細画面へ push する）
jest.mock('expo-router', () => ({
    router: { push: jest.fn() },
}));

// useFloorPlan をモック
jest.mock('@/features/floor-plan/hooks/useFloorPlan', () => ({
    useFloorPlan: jest.fn(),
}));

import { router } from 'expo-router';
import { useFloorPlan } from '@/features/floor-plan/hooks/useFloorPlan';
import { resetUserIdCacheForTest } from '@/shared/hooks/useUserId';
import type { Furniture } from '@/features/floor-plan/types';
import { flushRunOnJS } from '@/shared/testing/flushRunOnJS';
const mockUseLayout = useFloorPlan as jest.Mock;

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
}

/** リビング1部屋のフロアプランで useFloorPlan をモックする（mutate・家具は差し替え可能） */
function mockHookWithLivingRoom(
    mutations: {
        addRoom?: jest.Mock;
        updateRoom?: jest.Mock;
        deleteRoom?: jest.Mock;
    } = {},
    furniture: Furniture[] = [],
) {
    mockUseLayout.mockReturnValue({
        floorPlan: {
            data: {
                rooms: [
                    {
                        id: 'room-1',
                        name: 'リビング',
                        type: 'LIVING',
                        gridX: 0,
                        gridY: 0,
                        gridW: 6,
                        gridH: 4,
                        createdAt: new Date('2024-01-01'),
                        updatedAt: new Date('2024-01-01'),
                        furniture,
                    },
                ],
            },
            isLoading: false,
            isError: false,
        },
        addRoom: { mutate: mutations.addRoom ?? jest.fn() },
        updateRoom: { mutate: mutations.updateRoom ?? jest.fn() },
        deleteRoom: { mutate: mutations.deleteRoom ?? jest.fn() },
    });
}

describe('FloorPlanIndexScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // モジュールレベルにメモ化された初期化 Promise をテスト間でリセットする
        resetUserIdCacheForTest();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    });

    it('shows_empty_state_when_floor_plan_has_no_rooms', async () => {
        // Arrange
        mockUseLayout.mockReturnValue({
            floorPlan: { data: { rooms: [] }, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');

        // Act
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('empty-state')).toBeTruthy();
        });
    });

    it('shows_empty_state_with_illustration_and_cta_when_no_rooms', async () => {
        // Arrange
        mockUseLayout.mockReturnValue({
            floorPlan: { data: { rooms: [] }, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');

        // Act
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Assert: イラスト（絵文字）と CTA が表示される
        await waitFor(() => {
            expect(screen.getByTestId('empty-state')).toBeTruthy();
        });
        expect(screen.getByTestId('empty-state-illustration')).toBeTruthy();
        expect(screen.getByText('最初の部屋を追加')).toBeTruthy();
    });

    it('opens_add_room_modal_when_empty_state_cta_is_pressed', async () => {
        // Arrange
        mockUseLayout.mockReturnValue({
            floorPlan: { data: { rooms: [] }, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        await screen.findByTestId('empty-state');

        // Act
        fireEvent.press(screen.getByText('最初の部屋を追加'));

        // Assert: AddRoomModal（ボトムシート）が開く
        await waitFor(() => {
            expect(screen.getByPlaceholderText('部屋名')).toBeTruthy();
        });
    });

    it('opens_add_room_modal_when_fab_is_pressed', async () => {
        // Arrange
        mockUseLayout.mockReturnValue({
            floorPlan: { data: { rooms: [] }, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        await screen.findByTestId('empty-state');

        // Act
        fireEvent.press(screen.getByTestId('fab'));

        // Assert: AddRoomModal（ボトムシート）が開く
        await waitFor(() => {
            expect(screen.getByPlaceholderText('部屋名')).toBeTruthy();
        });
    });

    it('selects_room_without_navigating_when_room_is_pressed', async () => {
        // Arrange
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Act: 初回タップは選択のみ
        fireEvent.press(await screen.findByText('リビング'));

        // Assert: 操作バーが表示され、詳細画面へは遷移しない
        expect(screen.getByTestId('selection-actions')).toBeTruthy();
        expect(router.push).not.toHaveBeenCalled();
    });

    it('navigates_to_room_detail_when_edit_interior_is_pressed', async () => {
        // Arrange: 初回タップで選択済みの状態にする
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));

        // Act: 「中を修正」を押す
        fireEvent.press(screen.getByTestId('selection-edit-interior'));

        // Assert: 家具配置の修正画面（部屋詳細）へ遷移する
        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('/floor-plan/room-1');
        });
    });

    it('does_not_navigate_when_selected_room_is_pressed_again', async () => {
        // Arrange: 初回タップで選択済みの状態にする
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));

        // Act: 選択中の部屋をもう一度タップ
        fireEvent.press(
            within(screen.getByTestId('room-shape-room-1')).getByText('リビング'),
        );

        // Assert: 遷移は「中を修正」ボタン経由のみ。選択は維持される
        expect(router.push).not.toHaveBeenCalled();
        expect(screen.getByTestId('selection-actions')).toBeTruthy();
    });

    it('shows_selection_actions_with_room_name_when_room_is_pressed', async () => {
        // Arrange
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Act
        fireEvent.press(await screen.findByText('リビング'));

        // Assert: 操作バーに部屋名と「中を修正」「名称修正」「削除」が並ぶ
        // （375pt 幅端末で部屋名が潰れないよう短縮ラベルを使う）
        const actions = screen.getByTestId('selection-actions');
        expect(within(actions).getByText('リビング')).toBeTruthy();
        expect(within(actions).getByText('中を修正')).toBeTruthy();
        expect(within(actions).getByText('名称修正')).toBeTruthy();
        expect(screen.getByTestId('selection-rename')).toBeTruthy();
        expect(screen.getByTestId('selection-delete')).toBeTruthy();
    });

    it('opens_full_screen_rename_when_rename_is_pressed', async () => {
        // Arrange
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));

        // Act: 「名称修正」を押す
        fireEvent.press(screen.getByTestId('selection-rename'));

        // Assert: 入力が画面を支配するフルスクリーンの名称変更画面が開く
        expect(screen.getByTestId('rename-screen')).toBeTruthy();
        expect(screen.getByTestId('rename-input').props.autoFocus).toBe(true);
        expect(screen.getByTestId('rename-input').props.value).toBe('リビング');
    });

    it('shows_cascade_delete_confirmation_when_delete_is_pressed', async () => {
        // Arrange
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));

        // Act
        fireEvent.press(screen.getByTestId('selection-delete'));

        // Assert: カスケード削除を明示する確認ダイアログが破壊的スタイルで出る
        expect(alertSpy).toHaveBeenCalledTimes(1);
        const [title, message, buttons] = alertSpy.mock.calls[0];
        expect(title).toMatch(/リビング/);
        expect(`${title}${message}`).toMatch(/家具・パーツ・掃除記録/);
        const destructiveButton = buttons?.find((b) => b.style === 'destructive');
        expect(destructiveButton).toBeTruthy();
    });

    it('switches_selection_without_navigating_when_another_room_is_pressed', async () => {
        // Arrange: 重ならない2部屋を用意して room-1 を選択する
        mockUseLayout.mockReturnValue({
            floorPlan: {
                data: {
                    rooms: [
                        {
                            id: 'room-1',
                            name: 'リビング',
                            type: 'LIVING',
                            gridX: 0,
                            gridY: 0,
                            gridW: 6,
                            gridH: 4,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                            furniture: [],
                        },
                        {
                            id: 'room-2',
                            name: 'キッチン',
                            type: 'KITCHEN',
                            gridX: 6,
                            gridY: 0,
                            gridW: 4,
                            gridH: 4,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                            furniture: [],
                        },
                    ],
                },
                isLoading: false,
                isError: false,
            },
            addRoom: { mutate: jest.fn() },
            updateRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));

        // Act: 別の部屋をタップする
        fireEvent.press(screen.getByText('キッチン'));

        // Assert: 選択が切り替わるだけで詳細画面へは遷移しない
        const actions = screen.getByTestId('selection-actions');
        expect(within(actions).getByText('キッチン')).toBeTruthy();
        expect(router.push).not.toHaveBeenCalled();
    });

    it('closes_rename_sheet_without_mutation_when_cancel_is_pressed', async () => {
        // Arrange: 部屋を選択して名称変更シートを開く
        const mockUpdateMutate = jest.fn();
        mockHookWithLivingRoom({ updateRoom: mockUpdateMutate });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        fireEvent.press(screen.getByTestId('selection-rename'));
        expect(screen.getByTestId('rename-input')).toBeTruthy();

        // Act: キャンセルする
        fireEvent.press(screen.getByTestId('rename-cancel'));

        // Assert: シートが閉じ、更新 mutation は呼ばれない
        await waitFor(() => {
            expect(screen.queryByTestId('rename-input')).toBeNull();
        });
        expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('mutates_delete_room_when_deletion_is_confirmed', async () => {
        // Arrange
        const alertSpy = jest.spyOn(Alert, 'alert');
        const mockDeleteMutate = jest.fn();
        mockHookWithLivingRoom({ deleteRoom: mockDeleteMutate });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        fireEvent.press(screen.getByTestId('selection-delete'));

        // Act: 確認ダイアログの破壊的ボタンで確定する
        const buttons = alertSpy.mock.calls[0][2];
        const destructiveButton = buttons?.find((b) => b.style === 'destructive');
        act(() => {
            destructiveButton?.onPress?.();
        });

        // Assert: roomId と、失敗時ロールバック後の通知用 onError を渡して削除する
        expect(mockDeleteMutate).toHaveBeenCalledWith(
            'room-1',
            expect.objectContaining({ onError: expect.any(Function) }),
        );
    });

    it('alerts_delete_failure_when_delete_room_mutation_fails', async () => {
        // Arrange: mutate は onError を受け取り、それを発火させて失敗を再現する
        const alertSpy = jest.spyOn(Alert, 'alert');
        const mockDeleteMutate = jest.fn(
            (_roomId: string, options?: { onError?: () => void }) => {
                options?.onError?.();
            },
        );
        mockHookWithLivingRoom({ deleteRoom: mockDeleteMutate });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        fireEvent.press(screen.getByTestId('selection-delete'));

        // Act: 確認ダイアログの破壊的ボタンで確定する（mutate が失敗して onError が走る）
        const buttons = alertSpy.mock.calls[0][2];
        const destructiveButton = buttons?.find((b) => b.style === 'destructive');
        act(() => {
            destructiveButton?.onPress?.();
        });

        // Assert: 失敗通知の Alert が出る（確認ダイアログの1回に加えて2回目）
        expect(alertSpy).toHaveBeenCalledTimes(2);
        const [failureTitle] = alertSpy.mock.calls[1];
        expect(failureTitle).toMatch(/削除に失敗しました/);
    });

    it('does_not_delete_room_when_only_confirmation_is_shown', async () => {
        // Arrange
        jest.spyOn(Alert, 'alert');
        const mockDeleteMutate = jest.fn();
        mockHookWithLivingRoom({ deleteRoom: mockDeleteMutate });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));

        // Act: 削除ボタンを押すだけで確定はしない
        fireEvent.press(screen.getByTestId('selection-delete'));

        // Assert
        expect(mockDeleteMutate).not.toHaveBeenCalled();
    });

    it('mutates_update_room_with_new_name_when_rename_is_confirmed', async () => {
        // Arrange
        const mockUpdateMutate = jest.fn();
        mockHookWithLivingRoom({ updateRoom: mockUpdateMutate });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));

        // Act: 名称変更 → シートで新しい名前を入力して確定
        fireEvent.press(screen.getByTestId('selection-rename'));
        fireEvent.changeText(screen.getByTestId('rename-input'), '和室');
        fireEvent.press(screen.getByTestId('rename-submit'));

        // Assert: name のみの部分更新が呼ばれ、シートが閉じる
        expect(mockUpdateMutate).toHaveBeenCalledWith({
            roomId: 'room-1',
            input: { name: '和室' },
        });
        await waitFor(() => {
            expect(screen.queryByTestId('rename-input')).toBeNull();
        });
    });

    it('hides_selection_actions_when_selected_room_is_removed_from_data', async () => {
        // Arrange: 部屋を選択して操作バーを表示する
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        const view = render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        expect(screen.getByTestId('selection-actions')).toBeTruthy();

        // Act: 楽観的更新で部屋がキャッシュから消えた状態を再現する
        mockUseLayout.mockReturnValue({
            floorPlan: { data: { rooms: [] }, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            updateRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        view.rerender(<FloorPlanIndexScreen />);

        // Assert: 存在しない部屋の操作バーは表示しない
        expect(screen.queryByTestId('selection-actions')).toBeNull();
    });

    it('hides_selection_actions_when_dismiss_is_pressed', async () => {
        // Arrange: 部屋を選択して操作バーを表示する
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        expect(screen.getByTestId('selection-actions')).toBeTruthy();

        // Act: 選択解除ボタンを押す
        fireEvent.press(screen.getByTestId('selection-dismiss'));

        // Assert: 操作バーが消える
        expect(screen.queryByTestId('selection-actions')).toBeNull();
    });

    it('hides_selection_actions_when_canvas_background_is_pressed', async () => {
        // Arrange: 部屋を選択して操作バーを表示する
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        expect(screen.getByTestId('selection-actions')).toBeTruthy();

        // Act: 部屋のない空白領域をタップする（✕ を押さずに解除できる）
        fireGestureHandler(getByGestureTestId('canvas-background-tap'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        await flushRunOnJS();

        // Assert: 操作バーが消える
        expect(screen.queryByTestId('selection-actions')).toBeNull();
    });

    it('closes_rename_screen_without_mutation_when_canvas_background_is_pressed', async () => {
        // Arrange: 部屋を選択して名称変更画面を開く
        const mockUpdateMutate = jest.fn();
        mockHookWithLivingRoom({ updateRoom: mockUpdateMutate });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        fireEvent.press(screen.getByTestId('selection-rename'));
        expect(screen.getByTestId('rename-input')).toBeTruthy();

        // Act: 空白領域をタップする
        fireGestureHandler(getByGestureTestId('canvas-background-tap'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        await flushRunOnJS();

        // Assert: 選択解除の他経路（✕・家具タップ）と揃えてリネーム対象も破棄される
        expect(screen.queryByTestId('rename-input')).toBeNull();
        expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('clears_room_selection_when_furniture_is_pressed', async () => {
        // Arrange: 家具付きの部屋を選択して操作バーを表示する
        mockHookWithLivingRoom({}, [
            {
                id: 'furn-1',
                roomId: 'room-1',
                name: 'ソファ',
                presetKey: 'sofa',
                gridX: 0,
                gridY: 0,
                gridW: 1,
                gridH: 1,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            },
        ]);
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        expect(screen.getByTestId('selection-actions')).toBeTruthy();

        // Act: 家具をタップする
        fireEvent.press(screen.getByText('ソファ'));

        // Assert: 部屋を対象にした操作バーは消える（誤削除防止）
        expect(screen.queryByTestId('selection-actions')).toBeNull();
    });

    it('shows_room_selection_outline_when_room_is_selected', async () => {
        // Arrange
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Act: 部屋を選択する
        fireEvent.press(await screen.findByText('リビング'));

        // Assert: キャンバス内に選択枠が表示される
        expect(screen.getByTestId('room-selected-room-1')).toBeTruthy();
    });

    it('hides_room_selection_outline_when_dismiss_is_pressed', async () => {
        // Arrange: 部屋を選択して選択枠を表示する
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        expect(screen.getByTestId('room-selected-room-1')).toBeTruthy();

        // Act: 選択解除ボタンを押す
        fireEvent.press(screen.getByTestId('selection-dismiss'));

        // Assert: 操作バーと同時にキャンバス内の選択枠も消える
        expect(screen.queryByTestId('room-selected-room-1')).toBeNull();
    });

    it('hides_room_selection_outline_when_furniture_is_pressed', async () => {
        // Arrange: 家具付きの部屋を選択して選択枠を表示する
        mockHookWithLivingRoom({}, [
            {
                id: 'furn-1',
                roomId: 'room-1',
                name: 'ソファ',
                presetKey: 'sofa',
                gridX: 0,
                gridY: 0,
                gridW: 1,
                gridH: 1,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            },
        ]);
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        expect(screen.getByTestId('room-selected-room-1')).toBeTruthy();

        // Act: 家具をタップする
        fireEvent.press(screen.getByText('ソファ'));

        // Assert: バーと同時にキャンバス内の選択枠も消える
        expect(screen.queryByTestId('room-selected-room-1')).toBeNull();
    });

    it('does_not_reopen_rename_sheet_for_next_selection_after_target_room_disappears', async () => {
        // Arrange: 部屋Aを選択して名称変更シートを開く
        mockHookWithLivingRoom();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        const view = render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('リビング'));
        fireEvent.press(screen.getByTestId('selection-rename'));
        expect(screen.getByTestId('rename-input')).toBeTruthy();

        // Act: 対象の部屋Aがデータから消えたあと、別の部屋Bを選択する
        mockUseLayout.mockReturnValue({
            floorPlan: {
                data: {
                    rooms: [
                        {
                            id: 'room-2',
                            name: 'キッチン',
                            type: 'KITCHEN',
                            gridX: 6,
                            gridY: 0,
                            gridW: 4,
                            gridH: 4,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                            furniture: [],
                        },
                    ],
                },
                isLoading: false,
                isError: false,
            },
            addRoom: { mutate: jest.fn() },
            updateRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        view.rerender(<FloorPlanIndexScreen />);
        fireEvent.press(screen.getByText('キッチン'));

        // Assert: 部屋Bの選択でシートが勝手に開かない
        expect(screen.queryByTestId('rename-input')).toBeNull();
    });

    it('saves_new_uuid_to_async_storage_when_no_uuid_exists', async () => {
        // Arrange
        mockUseLayout.mockReturnValue({
            floorPlan: { data: { rooms: [] }, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

        // Act
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                'user-uuid',
                expect.any(String),
            );
        });
    });

    it('adds_room_at_non_overlapping_position_when_origin_is_occupied', async () => {
        // Arrange: (0,0) に 4x4 の既存部屋 → 新規部屋(4x4)は重ならない (4,0) に配置される
        const mockMutate = jest.fn();
        mockUseLayout.mockReturnValue({
            floorPlan: {
                data: {
                    rooms: [
                        {
                            id: 'room-1',
                            name: 'リビング',
                            type: 'LIVING',
                            gridX: 0,
                            gridY: 0,
                            gridW: 4,
                            gridH: 4,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                            furniture: [],
                        },
                    ],
                },
                isLoading: false,
                isError: false,
            },
            addRoom: { mutate: mockMutate },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Act
        fireEvent.press(screen.getByTestId('fab'));
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), 'キッチン');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                expect.objectContaining({ gridX: 4, gridY: 0, gridW: 4, gridH: 4 }),
            );
        });
    });

    it('adds_room_with_size_selected_in_modal_steppers', async () => {
        // Arrange: 空のキャンバスでモーダルからサイズを変更して追加する
        const mockMutate = jest.fn();
        mockUseLayout.mockReturnValue({
            floorPlan: { data: { rooms: [] }, isLoading: false, isError: false },
            addRoom: { mutate: mockMutate },
            updateRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        await screen.findByTestId('empty-state');

        // Act: モーダルを開き、幅を 4→6、高さを 4→5 に変更して送信
        fireEvent.press(screen.getByTestId('fab'));
        fireEvent.press(screen.getByTestId('room-width-stepper-inc'));
        fireEvent.press(screen.getByTestId('room-width-stepper-inc'));
        fireEvent.press(screen.getByTestId('room-height-stepper-inc'));
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), '寝室');
        fireEvent.press(screen.getByText('追加'));

        // Assert: モーダルで選んだサイズが mutate に反映される
        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                expect.objectContaining({ gridW: 6, gridH: 5 }),
            );
        });
    });

    it('adds_room_at_origin_without_crashing_when_canvas_is_full', async () => {
        // Arrange: キャンバス(20x20)全面を占有する部屋 → 空きなし → (0,0) に配置
        const mockMutate = jest.fn();
        mockUseLayout.mockReturnValue({
            floorPlan: {
                data: {
                    rooms: [
                        {
                            id: 'room-1',
                            name: '巨大部屋',
                            type: 'OTHER',
                            gridX: 0,
                            gridY: 0,
                            gridW: 20,
                            gridH: 20,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                            furniture: [],
                        },
                    ],
                },
                isLoading: false,
                isError: false,
            },
            addRoom: { mutate: mockMutate },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Act
        fireEvent.press(screen.getByTestId('fab'));
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), '物置');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                expect.objectContaining({ gridX: 0, gridY: 0 }),
            );
        });
    });

    it('renders_canvas_and_all_rooms_without_scroll_view', async () => {
        // Arrange: ScrollView 入れ子を廃止してもキャンバスと全部屋が描画される
        mockUseLayout.mockReturnValue({
            floorPlan: {
                data: {
                    rooms: [
                        {
                            id: 'room-1',
                            name: 'リビング',
                            type: 'LIVING',
                            gridX: 0,
                            gridY: 0,
                            gridW: 6,
                            gridH: 4,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                            furniture: [],
                        },
                        {
                            id: 'room-2',
                            name: 'キッチン',
                            type: 'KITCHEN',
                            gridX: 6,
                            gridY: 0,
                            gridW: 4,
                            gridH: 4,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                            furniture: [],
                        },
                    ],
                },
                isLoading: false,
                isError: false,
            },
            addRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');

        // Act
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('floorPlan-canvas')).toBeTruthy();
        });
        expect(screen.getByTestId('room-shape-room-1')).toBeTruthy();
        expect(screen.getByTestId('room-shape-room-2')).toBeTruthy();
        expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
    });

    it('mutates_update_room_with_snapped_rect_when_room_drag_commits', async () => {
        // Arrange: cellSize=40 で 56px（1.4 セル分）右へドラッグ → gridX が 1 になる
        const mockUpdateMutate = jest.fn();
        mockUseLayout.mockReturnValue({
            floorPlan: {
                data: {
                    rooms: [
                        {
                            id: 'room-1',
                            name: 'リビング',
                            type: 'LIVING',
                            gridX: 0,
                            gridY: 0,
                            gridW: 6,
                            gridH: 4,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                            furniture: [],
                        },
                    ],
                },
                isLoading: false,
                isError: false,
            },
            addRoom: { mutate: jest.fn() },
            updateRoom: { mutate: mockUpdateMutate },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });
        await screen.findByText('リビング');

        // Act
        fireGestureHandler(getByGestureTestId('room-pan-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: 楽観的更新の mutation にスナップ済み座標が渡る
        await waitFor(() => {
            expect(mockUpdateMutate).toHaveBeenCalledWith({
                roomId: 'room-1',
                input: { gridX: 1, gridY: 0, gridW: 6, gridH: 4 },
            });
        });
    });
});
