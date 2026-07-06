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
import { GRID_COLS, GRID_ROWS } from '../constants';
import type { RoomType } from '../types';

type Props = {
    visible: boolean;
    onSubmit: (input: {
        name: string;
        type: RoomType;
        gridW: number;
        gridH: number;
    }) => void;
    onCancel: () => void;
};

const DEFAULT_SIZE = 4;

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
    const [gridW, setGridW] = useState(DEFAULT_SIZE);
    const [gridH, setGridH] = useState(DEFAULT_SIZE);

    function reset() {
        setName('');
        setSelectedType('LIVING');
        setGridW(DEFAULT_SIZE);
        setGridH(DEFAULT_SIZE);
    }

    function handleSubmit() {
        if (!name.trim()) {
            return;
        }
        onSubmit({ name: name.trim(), type: selectedType, gridW, gridH });
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

            <View style={[styles.sizeRow, { marginBottom: theme.spacing.xl }]}>
                <SizeStepper
                    label="幅"
                    idPrefix="room-width"
                    value={gridW}
                    min={1}
                    max={GRID_COLS}
                    onChange={setGridW}
                />
                <SizeStepper
                    label="高さ"
                    idPrefix="room-height"
                    value={gridH}
                    min={1}
                    max={GRID_ROWS}
                    onChange={setGridH}
                />
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

type SizeStepperProps = {
    label: string;
    idPrefix: string;
    value: number;
    min: number;
    max: number;
    onChange: (next: number) => void;
};

function SizeStepper({
    label,
    idPrefix,
    value,
    min,
    max,
    onChange,
}: SizeStepperProps) {
    const theme = useAppTheme();
    const canDecrement = value > min;
    const canIncrement = value < max;

    return (
        <View style={styles.sizeStepper}>
            <Text
                style={[
                    theme.typography.caption,
                    { color: theme.colors.textMuted, marginBottom: theme.spacing.xs },
                ]}
            >
                {label}
            </Text>
            <View style={[styles.stepperRow, { gap: theme.spacing.sm }]}>
                <TouchableOpacity
                    testID={`${idPrefix}-stepper-dec`}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}を減らす`}
                    disabled={!canDecrement}
                    onPress={() => onChange(Math.max(min, value - 1))}
                    style={[
                        styles.stepperButton,
                        {
                            borderColor: theme.colors.outline,
                            borderRadius: theme.radius.md,
                            opacity: canDecrement ? 1 : 0.4,
                        },
                    ]}
                >
                    <Text
                        style={[theme.typography.title, { color: theme.colors.text }]}
                    >
                        −
                    </Text>
                </TouchableOpacity>
                <Text
                    testID={`${idPrefix}-value`}
                    style={[
                        theme.typography.title,
                        { color: theme.colors.text, minWidth: theme.spacing.xl },
                        styles.stepperValue,
                    ]}
                >
                    {value}
                </Text>
                <TouchableOpacity
                    testID={`${idPrefix}-stepper-inc`}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}を増やす`}
                    disabled={!canIncrement}
                    onPress={() => onChange(Math.min(max, value + 1))}
                    style={[
                        styles.stepperButton,
                        {
                            borderColor: theme.colors.outline,
                            borderRadius: theme.radius.md,
                            opacity: canIncrement ? 1 : 0.4,
                        },
                    ]}
                >
                    <Text
                        style={[theme.typography.title, { color: theme.colors.text }]}
                    >
                        ＋
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
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
    sizeRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    sizeStepper: {
        alignItems: 'center',
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepperButton: {
        width: 40,
        height: 40,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValue: {
        textAlign: 'center',
    },
});
