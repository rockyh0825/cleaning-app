import React, { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { RoomType } from '../types';

type Props = {
    visible: boolean;
    onSubmit: (input: { name: string; type: RoomType }) => void;
    onCancel: () => void;
};

const ROOM_TYPES: { label: string; value: RoomType }[] = [
    { label: 'リビング', value: 'LIVING' },
    { label: 'キッチン', value: 'KITCHEN' },
    { label: '寝室', value: 'BEDROOM' },
    { label: 'バスルーム', value: 'BATHROOM' },
    { label: 'トイレ', value: 'TOILET' },
    { label: 'その他', value: 'OTHER' },
];

export function AddRoomModal({ visible, onSubmit, onCancel }: Props) {
    const theme = useAppTheme();
    const [name, setName] = useState('');
    const [selectedType, setSelectedType] = useState<RoomType>('LIVING');

    function reset() {
        setName('');
        setSelectedType('LIVING');
    }

    function handleSubmit() {
        if (!name.trim()) {
            return;
        }
        onSubmit({ name: name.trim(), type: selectedType });
        reset();
    }

    function handleCancel() {
        reset();
        onCancel();
    }

    return (
        <BottomSheet visible={visible} onClose={handleCancel}>
            <Text
                style={[
                    theme.typography.title,
                    { color: theme.colors.text, marginBottom: theme.spacing.lg },
                ]}
            >
                部屋を追加
            </Text>

            <TextInput
                style={[
                    theme.typography.body,
                    {
                        color: theme.colors.text,
                        borderWidth: 1,
                        borderColor: theme.colors.outline,
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.md,
                        marginBottom: theme.spacing.lg,
                    },
                ]}
                placeholder="部屋名"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
            />

            <View style={[styles.typeGrid, { marginBottom: theme.spacing.xl }]}>
                {ROOM_TYPES.map((rt) => {
                    const accent = theme.roomAccents[rt.value];
                    const isSelected = selectedType === rt.value;
                    return (
                        <Pressable
                            key={rt.value}
                            testID={`room-type-card-${rt.value}`}
                            accessibilityRole="button"
                            accessibilityLabel={rt.label}
                            accessibilityState={{ selected: isSelected }}
                            style={[
                                styles.typeCard,
                                {
                                    backgroundColor: isSelected
                                        ? accent.fill
                                        : theme.colors.surfaceAlt,
                                    borderColor: isSelected
                                        ? accent.accent
                                        : theme.colors.outline,
                                    borderRadius: theme.radius.md,
                                    paddingVertical: theme.spacing.md,
                                    gap: theme.spacing.xs,
                                },
                            ]}
                            onPress={() => setSelectedType(rt.value)}
                        >
                            <Text style={styles.typeIcon}>{accent.icon}</Text>
                            <Text
                                style={[
                                    theme.typography.caption,
                                    {
                                        color: isSelected
                                            ? accent.accent
                                            : theme.colors.textMuted,
                                        fontWeight: isSelected ? '600' : '400',
                                    },
                                ]}
                            >
                                {rt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={[styles.buttonRow, { gap: theme.spacing.md }]}>
                <TouchableOpacity
                    style={{
                        borderWidth: 1,
                        borderColor: theme.colors.outline,
                        borderRadius: theme.radius.md,
                        paddingVertical: theme.spacing.md,
                        paddingHorizontal: theme.spacing.xl,
                    }}
                    onPress={handleCancel}
                >
                    <Text
                        style={[theme.typography.label, { color: theme.colors.textMuted }]}
                    >
                        キャンセル
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.radius.md,
                        paddingVertical: theme.spacing.md,
                        paddingHorizontal: theme.spacing.xl,
                    }}
                    onPress={handleSubmit}
                >
                    <Text
                        style={[theme.typography.label, { color: theme.colors.surface }]}
                    >
                        追加
                    </Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeCard: {
        width: '30%',
        flexGrow: 1,
        alignItems: 'center',
        borderWidth: 1,
    },
    typeIcon: {
        fontSize: 24,
        lineHeight: 30,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
