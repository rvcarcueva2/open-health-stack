import {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {Button} from '../../components/Button';
import {DateField} from '../../components/DateField';
import {Field} from '../../components/Field';
import {SegmentedControl} from '../../components/SegmentedControl';
import {colors, spacing} from '../../theme';
import {Gender} from './fhir';
import {genderLabel, toIsoDate} from './format';
import {useCreatePatient} from './hooks';

const GENDER_OPTIONS = (Object.keys(genderLabel) as Gender[]).map((value) => ({
    value,
    label: genderLabel[value],
}));

export function AddPatientForm({onSaved}: { onSaved: () => void }) {
    const [given, setGiven] = useState('');
    const [family, setFamily] = useState('');
    const [gender, setGender] = useState<Gender>('unknown');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const mutation = useCreatePatient();

    const errors = {
        given: given.trim() ? null : 'Enter a given name',
        family: family.trim() ? null : 'Enter a family name',
        birthDate: birthDate ? null : 'Select a birth date',
    };
    const show = (e: string | null) => (submitted ? e : null);

    const submit = () => {
        setSubmitted(true);
        if (errors.given || errors.family || !birthDate) return;
        mutation.mutate(
            {given, family, gender, birthDate: toIsoDate(birthDate)},
            {onSuccess: onSaved},
        );
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
        >
            <Field
                label="Given name"
                value={given}
                onChangeText={setGiven}
                error={show(errors.given)}
                autoCapitalize="words"
                autoComplete="off"
                textContentType="givenName"
                returnKeyType="next"
            />
            <Field
                label="Family name"
                value={family}
                onChangeText={setFamily}
                error={show(errors.family)}
                autoCapitalize="words"
                autoComplete="off"
                textContentType="familyName"
                returnKeyType="done"
            />
            <DateField label="Birth date" value={birthDate} onChange={setBirthDate} error={show(errors.birthDate)}/>
            <SegmentedControl label="Gender" options={GENDER_OPTIONS} value={gender} onChange={setGender}/>

            <View style={styles.actions}>
                <Button title="Save patient" onPress={submit} loading={mutation.isPending}/>
                <Text style={styles.hint}>Saved on this device first. It uploads the next time you tap “Sync
                    now”.</Text>
                {mutation.isError &&
                    <Text style={styles.error}>Could not save the patient on this device. Try again.</Text>}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg},
    content: {padding: spacing.lg, gap: spacing.lg},
    actions: {gap: spacing.sm, marginTop: spacing.sm},
    hint: {fontSize: 13, color: colors.textMuted, textAlign: 'center'},
    error: {fontSize: 13, color: colors.danger, textAlign: 'center'},
});