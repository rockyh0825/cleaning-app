import React from 'react';
import { Alert } from 'react-native';
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
import RoomDetailScreen from '../[roomId]';

jest.mock('@/features/floor-plan/hooks/useFloorPlan', () => ({
    useFloorPlan: jest.fn(),
}));

jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ roomId: 'room-1' }),
    router: { push: jest.fn() },
}));

jest.mock('@/shared/hooks/useUserId', () => ({
    useUserId: () => 'user-1',
}));

import { router } from 'expo-router';
import { useFloorPlan } from '@/features/floor-plan/hooks/useFloorPlan';
const mockUseFloorPlan = useFloorPlan as jest.Mock;

const targetRoom = {
    id: 'room-1',
    name: 'リビング',
    type: 'LIVING',
    gridX: 0,
    gridY: 0,
    gridW: 4,
    gridH: 4,
    furniture: [],
};

const sofa = {
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
};

/** 指定した家具を持つ部屋で useFloorPlan をモックする（mutate は差し替え可能） */
function mockHookWithFurniture(
    furniture: Array<Record<string, unknown>>,
    mutations: { updateFurniture?: jest.Mock; deleteFurniture?: jest.Mock } = {},
) {
    mockUseFloorPlan.mockReturnValue({
        floorPlan: {
            data: { rooms: [{ ...targetRoom, furniture }] },
            isLoading: false,
            isError: false,
        },
        addFurniture: { mutate: jest.fn() },
        updateFurniture: { mutate: mutations.updateFurniture ?? jest.fn() },
        deleteFurniture: { mutate: mutations.deleteFurniture ?? jest.fn() },
    });
}

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

describe('RoomDetailScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders_the_target_room_from_route_params_on_the_canvas', async () => {
        // Arrange
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: { rooms: [targetRoom] }, isLoading: false, isError: false },
            addFurniture: { mutate: jest.fn() },
        });

        // Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('room-shape-room-1')).toBeTruthy();
        });
    });

    it('calls_add_furniture_mutation_with_room_id_from_route_params_on_submit', async () => {
        // Arrange
        const mutate = jest.fn();
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: { rooms: [targetRoom] }, isLoading: false, isError: false },
            addFurniture: { mutate },
        });

        // Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(screen.getByTestId('fab'));
        fireEvent.changeText(screen.getByPlaceholderText('家具名'), '本棚');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mutate).toHaveBeenCalledWith({
            roomId: 'room-1',
            input: expect.objectContaining({ name: '本棚' }),
        });
    });

    it('navigates_to_area_detail_when_log_cleaning_button_is_pressed', async () => {
        // Arrange
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: { rooms: [targetRoom] }, isLoading: false, isError: false },
            addFurniture: { mutate: jest.fn() },
        });
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        await screen.findByTestId('room-shape-room-1');

        // Act
        fireEvent.press(screen.getByText('掃除を記録'));

        // Assert
        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('/area/room-1?ownerType=ROOM');
        });
    });

    it('shows_selection_actions_when_furniture_is_pressed', async () => {
        // Arrange
        mockHookWithFurniture([sofa]);
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Act: 家具をタップして選択する
        fireEvent.press(await screen.findByText('ソファ'));

        // Assert: 家具名付きの操作バーと各操作ボタンが表示される
        const actions = screen.getByTestId('selection-actions');
        expect(within(actions).getByText('ソファ')).toBeTruthy();
        expect(screen.getByTestId('selection-rename')).toBeTruthy();
        expect(screen.getByTestId('selection-delete')).toBeTruthy();
    });

    it('navigates_to_furniture_area_detail_when_cleaning_parts_button_is_pressed', async () => {
        // Arrange
        mockHookWithFurniture([sofa]);
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));

        // Act: 操作バーの「掃除場所」を押す
        fireEvent.press(screen.getByTestId('selection-cleaning-parts'));

        // Assert: 家具のエリア詳細へ ownerType 付きで遷移する
        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('/area/furn-1?ownerType=FURNITURE');
        });
    });

    it('shows_irreversible_confirmation_when_furniture_delete_is_pressed', async () => {
        // Arrange
        const alertSpy = jest.spyOn(Alert, 'alert');
        mockHookWithFurniture([sofa]);
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));

        // Act
        fireEvent.press(screen.getByTestId('selection-delete'));

        // Assert: 取り消せない旨を明示する確認ダイアログが破壊的スタイルで出る
        expect(alertSpy).toHaveBeenCalledTimes(1);
        const [title, message, buttons] = alertSpy.mock.calls[0];
        expect(title).toMatch(/ソファ/);
        expect(`${title}${message}`).toMatch(/取り消せません/);
        const destructiveButton = buttons?.find((b) => b.style === 'destructive');
        expect(destructiveButton).toBeTruthy();
    });

    it('mutates_delete_furniture_when_deletion_is_confirmed', async () => {
        // Arrange
        const alertSpy = jest.spyOn(Alert, 'alert');
        const mockDeleteMutate = jest.fn();
        mockHookWithFurniture([sofa], { deleteFurniture: mockDeleteMutate });
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));
        fireEvent.press(screen.getByTestId('selection-delete'));

        // Act: 確認ダイアログの破壊的ボタンで確定する
        const buttons = alertSpy.mock.calls[0][2];
        const destructiveButton = buttons?.find((b) => b.style === 'destructive');
        act(() => {
            destructiveButton?.onPress?.();
        });

        // Assert
        expect(mockDeleteMutate).toHaveBeenCalledWith('furn-1');
    });

    it('does_not_delete_furniture_when_only_confirmation_is_shown', async () => {
        // Arrange
        jest.spyOn(Alert, 'alert');
        const mockDeleteMutate = jest.fn();
        mockHookWithFurniture([sofa], { deleteFurniture: mockDeleteMutate });
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));

        // Act: 削除ボタンを押すだけで確定はしない
        fireEvent.press(screen.getByTestId('selection-delete'));

        // Assert
        expect(mockDeleteMutate).not.toHaveBeenCalled();
    });

    it('mutates_update_furniture_with_new_name_when_rename_is_confirmed', async () => {
        // Arrange
        const mockUpdateMutate = jest.fn();
        mockHookWithFurniture([sofa], { updateFurniture: mockUpdateMutate });
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));

        // Act: 名称変更 → シートで新しい名前を入力して確定
        fireEvent.press(screen.getByTestId('selection-rename'));
        fireEvent.changeText(screen.getByTestId('rename-input'), 'テレビ台');
        fireEvent.press(screen.getByTestId('rename-submit'));

        // Assert: name のみの部分更新が呼ばれ、シートが閉じる
        expect(mockUpdateMutate).toHaveBeenCalledWith({
            furnitureId: 'furn-1',
            input: { name: 'テレビ台' },
        });
        await waitFor(() => {
            expect(screen.queryByTestId('rename-input')).toBeNull();
        });
    });

    it('closes_rename_sheet_without_mutation_when_cancel_is_pressed', async () => {
        // Arrange: 家具を選択して名称変更シートを開く
        const mockUpdateMutate = jest.fn();
        mockHookWithFurniture([sofa], { updateFurniture: mockUpdateMutate });
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));
        fireEvent.press(screen.getByTestId('selection-rename'));
        expect(screen.getByTestId('rename-input')).toBeTruthy();

        // Act
        fireEvent.press(screen.getByTestId('rename-cancel'));

        // Assert: シートが閉じ、更新 mutation は呼ばれない
        await waitFor(() => {
            expect(screen.queryByTestId('rename-input')).toBeNull();
        });
        expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('hides_selection_actions_when_room_is_pressed', async () => {
        // Arrange: 家具を選択して操作バーを表示する
        mockHookWithFurniture([sofa]);
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));
        expect(screen.getByTestId('selection-actions')).toBeTruthy();

        // Act: 部屋をタップする
        fireEvent.press(
            within(screen.getByTestId('room-shape-room-1')).getByText('リビング'),
        );

        // Assert: 家具の選択が解除され操作バーが消える
        expect(screen.queryByTestId('selection-actions')).toBeNull();
    });

    it('does_not_show_room_selection_outline_when_room_is_pressed', async () => {
        // Arrange: 詳細画面には部屋選択の解除導線が無いため常に非選択とする
        mockHookWithFurniture([sofa]);
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        await screen.findByTestId('room-shape-room-1');

        // Act: 家具解除のために部屋をタップする
        fireEvent.press(
            within(screen.getByTestId('room-shape-room-1')).getByText('リビング'),
        );

        // Assert: 部屋の選択枠は出ない（制御下で常に非選択）
        expect(screen.queryByTestId('room-selected-room-1')).toBeNull();
    });

    it('closes_rename_sheet_without_mutation_when_room_is_pressed_while_renaming', async () => {
        // Arrange: 家具を選択して名称変更シートを開く
        const mockUpdateMutate = jest.fn();
        mockHookWithFurniture([sofa], { updateFurniture: mockUpdateMutate });
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));
        fireEvent.press(screen.getByTestId('selection-rename'));
        expect(screen.getByTestId('rename-input')).toBeTruthy();

        // Act: シート表示中に部屋をタップする
        fireEvent.press(
            within(screen.getByTestId('room-shape-room-1')).getByText('リビング'),
        );

        // Assert: シートが閉じ、更新 mutation は呼ばれない
        await waitFor(() => {
            expect(screen.queryByTestId('rename-input')).toBeNull();
        });
        expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('switches_selection_actions_target_name_when_another_furniture_is_pressed', async () => {
        // Arrange: 家具A（ソファ）を選択して操作バーを表示する
        const table = {
            id: 'furn-2',
            roomId: 'room-1',
            name: 'テーブル',
            presetKey: 'table',
            gridX: 1,
            gridY: 1,
            gridW: 1,
            gridH: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };
        mockHookWithFurniture([sofa, table]);
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));
        expect(
            within(screen.getByTestId('selection-actions')).getByText('ソファ'),
        ).toBeTruthy();

        // Act: 別の家具B（テーブル）をタップする
        fireEvent.press(screen.getByText('テーブル'));

        // Assert: 操作バーの対象名がBに切り替わる
        const actions = screen.getByTestId('selection-actions');
        expect(within(actions).getByText('テーブル')).toBeTruthy();
        expect(within(actions).queryByText('ソファ')).toBeNull();
    });

    it('hides_selection_actions_when_dismiss_is_pressed', async () => {
        // Arrange: 家具を選択して操作バーを表示する
        mockHookWithFurniture([sofa]);
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));
        expect(screen.getByTestId('selection-actions')).toBeTruthy();

        // Act: 選択解除ボタンを押す
        fireEvent.press(screen.getByTestId('selection-dismiss'));

        // Assert
        expect(screen.queryByTestId('selection-actions')).toBeNull();
    });

    it('hides_selection_actions_when_canvas_background_is_pressed', async () => {
        // Arrange: 家具を選択して操作バーを表示する
        mockHookWithFurniture([sofa]);
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));
        expect(screen.getByTestId('selection-actions')).toBeTruthy();

        // Act: 家具のない空白領域をタップする（✕ を押さずに解除できる）
        fireGestureHandler(getByGestureTestId('canvas-background-tap'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);

        // Assert
        await waitFor(() => {
            expect(screen.queryByTestId('selection-actions')).toBeNull();
        });
    });

    it('closes_rename_sheet_without_mutation_when_canvas_background_is_pressed', async () => {
        // Arrange: 家具を選択して名称変更シートを開く
        const mockUpdateMutate = jest.fn();
        mockHookWithFurniture([sofa], { updateFurniture: mockUpdateMutate });
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));
        fireEvent.press(screen.getByTestId('selection-rename'));
        expect(screen.getByTestId('rename-input')).toBeTruthy();

        // Act: 空白領域をタップする
        fireGestureHandler(getByGestureTestId('canvas-background-tap'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);

        // Assert: 選択解除の他経路（✕・部屋タップ）と揃えてリネーム対象も破棄される
        await waitFor(() => {
            expect(screen.queryByTestId('rename-input')).toBeNull();
        });
        expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('hides_selection_actions_when_selected_furniture_is_removed_from_data', async () => {
        // Arrange: 家具を選択して操作バーを表示する
        mockHookWithFurniture([sofa]);
        const view = render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));
        expect(screen.getByTestId('selection-actions')).toBeTruthy();

        // Act: 楽観的削除で家具がキャッシュから消えた状態を再現する
        mockHookWithFurniture([]);
        view.rerender(<RoomDetailScreen />);

        // Assert: 存在しない家具の操作バーは表示しない
        expect(screen.queryByTestId('selection-actions')).toBeNull();
    });

    it('shows_loading_indicator_and_not_not_found_while_floor_plan_is_loading', () => {
        // Arrange: フェッチ中（data 未取得）の状態を再現する
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: undefined, isLoading: true, isError: false },
            addFurniture: { mutate: jest.fn() },
        });

        // Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Assert: ローディングを表示し「部屋が見つかりません」は出さない
        expect(screen.getByTestId('room-loading')).toBeTruthy();
        expect(screen.queryByTestId('room-not-found')).toBeNull();
    });

    it('shows_error_message_and_not_not_found_when_floor_plan_fetch_fails', () => {
        // Arrange: フェッチ失敗の状態を再現する
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: undefined, isLoading: false, isError: true },
            addFurniture: { mutate: jest.fn() },
        });

        // Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Assert: エラーを表示し「部屋が見つかりません」は出さない
        expect(screen.getByTestId('room-error')).toBeTruthy();
        expect(screen.queryByTestId('room-not-found')).toBeNull();
    });

    it('keeps_rendering_the_room_when_background_refetch_fails_with_stale_data', () => {
        // Arrange: 初回取得済みの stale データが残ったまま背景 refetch が失敗した状態を再現する
        mockUseFloorPlan.mockReturnValue({
            floorPlan: {
                data: { rooms: [targetRoom] },
                isLoading: false,
                isError: true,
            },
            addFurniture: { mutate: jest.fn() },
            updateFurniture: { mutate: jest.fn() },
            deleteFurniture: { mutate: jest.fn() },
        });

        // Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Assert: 閲覧中の部屋を描画し続け、エラー全画面には切り替えない
        expect(screen.getByTestId('room-shape-room-1')).toBeTruthy();
        expect(screen.queryByTestId('room-error')).toBeNull();
    });

    it('shows_loading_indicator_over_error_when_both_flags_are_true_without_the_room', () => {
        // Arrange: 該当部屋が無い状態で isLoading と isError が同時に真になる状況を再現する
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: undefined, isLoading: true, isError: true },
            addFurniture: { mutate: jest.fn() },
        });

        // Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Assert: ローディングを優先し、エラー画面は出さない
        expect(screen.getByTestId('room-loading')).toBeTruthy();
        expect(screen.queryByTestId('room-error')).toBeNull();
    });

    it('shows_not_found_only_after_load_completes_without_the_room', () => {
        // Arrange: 取得完了かつ該当部屋（room-1）が存在しない状態を再現する
        mockUseFloorPlan.mockReturnValue({
            floorPlan: {
                data: { rooms: [{ ...targetRoom, id: 'other-room', furniture: [] }] },
                isLoading: false,
                isError: false,
            },
            addFurniture: { mutate: jest.fn() },
        });

        // Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Assert: ロード完了・該当なしのときだけ not-found を出す
        expect(screen.getByTestId('room-not-found')).toBeTruthy();
        expect(screen.queryByTestId('room-loading')).toBeNull();
        expect(screen.queryByTestId('room-error')).toBeNull();
    });

    describe('家具の空き配置（タスク10・相対座標）', () => {
        /** 指定した部屋・家具で useFloorPlan をモックし、addFurniture の mutate を返す */
        function mockHookWithRoom(
            roomOverrides: Record<string, unknown>,
            furniture: Array<Record<string, unknown>> = [],
        ): jest.Mock {
            const addMutate = jest.fn();
            mockUseFloorPlan.mockReturnValue({
                floorPlan: {
                    data: {
                        rooms: [{ ...targetRoom, ...roomOverrides, furniture }],
                    },
                    isLoading: false,
                    isError: false,
                },
                addFurniture: { mutate: addMutate },
                updateFurniture: { mutate: jest.fn() },
                deleteFurniture: { mutate: jest.fn() },
            });
            return addMutate;
        }

        it('places_added_furniture_at_free_relative_position_avoiding_existing_furniture', () => {
            // Arrange: 部屋 4x4、相対 (0,0) に既存家具（sofa 1x1）
            const addMutate = mockHookWithRoom({}, [sofa]);
            render(<RoomDetailScreen />, { wrapper: createWrapper() });

            // Act: 自由名称（1x1）を追加
            fireEvent.press(screen.getByTestId('fab'));
            fireEvent.changeText(screen.getByPlaceholderText('家具名'), '本棚');
            fireEvent.press(screen.getByText('追加'));

            // Assert: (0,0) は埋まっているので隣の空き (1,0) に相対配置される
            expect(addMutate).toHaveBeenCalledWith({
                roomId: 'room-1',
                input: expect.objectContaining({
                    name: '本棚',
                    gridX: 1,
                    gridY: 0,
                    gridW: 1,
                    gridH: 1,
                }),
            });
        });

        it('uses_relative_zero_based_coordinates_even_when_room_is_offset', () => {
            // Arrange: 部屋を (5,5) に置く（空）
            const addMutate = mockHookWithRoom({ gridX: 5, gridY: 5 });
            render(<RoomDetailScreen />, { wrapper: createWrapper() });

            // Act
            fireEvent.press(screen.getByTestId('fab'));
            fireEvent.changeText(screen.getByPlaceholderText('家具名'), '本棚');
            fireEvent.press(screen.getByText('追加'));

            // Assert: 部屋の絶対位置(5,5)ではなく相対原点(0,0)で配置される
            expect(addMutate).toHaveBeenCalledWith({
                roomId: 'room-1',
                input: expect.objectContaining({ gridX: 0, gridY: 0 }),
            });
        });

        it('falls_back_to_relative_origin_when_room_is_full', () => {
            // Arrange: 1x1 の部屋が 1x1 家具で満杯
            const filler = { ...sofa, gridX: 0, gridY: 0, gridW: 1, gridH: 1 };
            const addMutate = mockHookWithRoom({ gridW: 1, gridH: 1 }, [filler]);
            render(<RoomDetailScreen />, { wrapper: createWrapper() });

            // Act: 空きが無くてもクラッシュせず追加する
            fireEvent.press(screen.getByTestId('fab'));
            fireEvent.changeText(screen.getByPlaceholderText('家具名'), '本棚');
            fireEvent.press(screen.getByText('追加'));

            // Assert: フォールバックで相対原点 (0,0)
            expect(addMutate).toHaveBeenCalledWith({
                roomId: 'room-1',
                input: expect.objectContaining({ gridX: 0, gridY: 0 }),
            });
        });

        it('clamps_selected_preset_size_to_room_before_placing', () => {
            // Arrange: 2x2 の部屋にベッド(2×3)プリセットを追加 → 高さが部屋にクランプ
            const addMutate = mockHookWithRoom({ gridW: 2, gridH: 2 });
            render(<RoomDetailScreen />, { wrapper: createWrapper() });

            // Act
            fireEvent.press(screen.getByTestId('fab'));
            fireEvent.press(screen.getByTestId('furniture-preset-chip-bed'));
            fireEvent.press(screen.getByText('追加'));

            // Assert: h は部屋の 2 にクランプ、(0,0) に配置
            expect(addMutate).toHaveBeenCalledWith({
                roomId: 'room-1',
                input: expect.objectContaining({
                    presetKey: 'bed',
                    gridX: 0,
                    gridY: 0,
                    gridW: 2,
                    gridH: 2,
                }),
            });
        });
    });

    it('does_not_reopen_rename_sheet_for_next_selection_after_target_furniture_disappears', async () => {
        // Arrange: 家具Aを選択して名称変更シートを開く
        mockHookWithFurniture([sofa]);
        const view = render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(await screen.findByText('ソファ'));
        fireEvent.press(screen.getByTestId('selection-rename'));
        expect(screen.getByTestId('rename-input')).toBeTruthy();

        // Act: 対象の家具Aがデータから消えたあと、別の家具Bを選択する
        const table = {
            id: 'furn-2',
            roomId: 'room-1',
            name: 'テーブル',
            presetKey: 'table',
            gridX: 1,
            gridY: 1,
            gridW: 1,
            gridH: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };
        mockHookWithFurniture([table]);
        view.rerender(<RoomDetailScreen />);
        fireEvent.press(screen.getByText('テーブル'));

        // Assert: 家具Bの選択でシートが勝手に開かない
        expect(screen.queryByTestId('rename-input')).toBeNull();
    });
});
