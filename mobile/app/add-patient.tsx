import {Stack, useRouter} from 'expo-router';
import {Platform, Pressable, Text} from 'react-native';
import {AddPatientForm} from '../src/features/patients/AddPatientForm';
import {colors} from '../src/theme';

export default function AddPatientRoute() {
    const router = useRouter();

    return (
        <>
            <Stack.Screen
                options={{
                    // iOS modals have no back arrow, so give them an explicit Cancel
                    headerLeft:
                        Platform.OS === 'ios'
                            ? () => (
                                <Pressable onPress={() => router.back()} hitSlop={8}>
                                    <Text style={{color: colors.primary, fontSize: 17}}>Cancel</Text>
                                </Pressable>
                            )
                            : undefined,
                }}
            />
            <AddPatientForm onSaved={() => router.back()}/>
        </>
    );
}