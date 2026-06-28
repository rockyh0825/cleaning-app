import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
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
    const [name, setName] = useState('');
    const [selectedType, setSelectedType] = useState<RoomType>('LIVING');

    function handleSubmit() {
        if (!name.trim()) {
            return;
        }
        onSubmit({ name: name.trim(), type: selectedType });
        setName('');
        setSelectedType('LIVING');
    }

    function handleCancel() {
        setName('');
        setSelectedType('LIVING');
        onCancel();
    }

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>部屋を追加</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="部屋名"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

                    <View style={styles.typeContainer}>
                        {ROOM_TYPES.map((rt) => (
                            <TouchableOpacity
                                key={rt.value}
                                style={[
                                    styles.typeButton,
                                    selectedType === rt.value && styles.typeButtonSelected,
                                ]}
                                onPress={() => setSelectedType(rt.value)}
                            >
                                <Text
                                    style={[
                                        styles.typeButtonText,
                                        selectedType === rt.value && styles.typeButtonTextSelected,
                                    ]}
                                >
                                    {rt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelButtonText}>キャンセル</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>追加</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '85%',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
        fontSize: 16,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    typeButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    typeButtonSelected: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    typeButtonText: {
        fontSize: 13,
        color: '#555',
    },
    typeButtonTextSelected: {
        color: '#fff',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    cancelButtonText: {
        fontSize: 15,
        color: '#555',
    },
    submitButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#4A90E2',
    },
    submitButtonText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
});
