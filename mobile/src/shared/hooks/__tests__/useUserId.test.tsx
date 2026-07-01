import { renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserId } from '../useUserId';

describe('useUserId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns_the_stored_uuid_when_one_already_exists', async () => {
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

    it('generates_and_persists_a_new_uuid_when_none_exists', async () => {
        // Arrange
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

        // Act
        const { result } = renderHook(() => useUserId());

        // Assert
        await waitFor(() => {
            expect(result.current).toEqual(expect.any(String));
        });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('user-uuid', result.current);
    });

    it('returns_null_while_the_uuid_lookup_is_still_in_flight', () => {
        // Arrange
        (AsyncStorage.getItem as jest.Mock).mockReturnValue(new Promise(() => {}));

        // Act
        const { result } = renderHook(() => useUserId());

        // Assert
        expect(result.current).toBeNull();
    });
});
