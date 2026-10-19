import {Ionicons} from '@expo/vector-icons';
import {Tabs} from 'expo-router';
import {colors} from '../../src/theme';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                headerShadowVisible: false,
                headerTitleStyle: {fontWeight: '700'},
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Patients',
                    tabBarIcon: ({color, size}) => <Ionicons name="people" size={size} color={color}/>,
                }}
            />
            
        </Tabs>
    );
}