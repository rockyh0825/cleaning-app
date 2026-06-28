import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Props = {
    visible: boolean;
    roomId: string;
    onSubmit: (input: { name: string }) => void;
    onCancel: () => void;
};

export function AddFurnitureModal({ visible, onSubmit, onCancel }: Props) {
    const [name, setName] = useState('');

    function handleSubmit() {
        if (!name.trim()) {
            return;
        }
        onSubmit({ name: name.trim() });
        setName('');
    }

    function handleCancel() {
        setName('');
        onCancel();
    }

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>家具を追加</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="家具名"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

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
        marginBottom: 20,
        fontSize: 16,
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
