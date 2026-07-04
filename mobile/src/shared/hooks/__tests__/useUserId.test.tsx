import { renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserId, USER_UUID_KEY } from '../useUserId';

describe('useUserId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns_stored_uuid_when_uuid_exists_in_async_storage', async () => {
        // Arrange
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');

        // Act
        const { result } = renderHook(() => useUserId());

        // Assert
        await waitFor(() => {
            expect(result.current).toBe('existing-uuid');
        });
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('generates_and_saves_new_uuid_when_no_uuid_exists', async () => {
        // Arrange
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

        // Act
        const { result } = renderHook(() => useUserId());

        // Assert
        await waitFor(() => {
            expect(result.current).not.toBeNull();
        });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            USER_UUID_KEY,
            expect.stringMatching(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
            ),
        );
    });
});
