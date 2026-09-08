import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  CheckCircle,
  Package,
  QrCode,
  UserPlus,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';

const Tab = createBottomTabNavigator();

type PatientHistoryItem = {
  date: string;
  diagnostic: string;
  facility: string;
};

type Patient = {
  name: string;
  age: number;
  abhaId: string;
  history: PatientHistoryItem[];
};

function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [scannedPatient, setScannedPatient] = useState<Patient | null>(null);
  const device = useCameraDevice('back');

  useEffect(() => {
    let isMounted = true;

    const requestPermission = async () => {
      const status = await Camera.requestCameraPermission();
      if (isMounted) {
        setHasPermission(status === 'granted');
      }
    };

    requestPermission();

    return () => {
      isMounted = false;
    };
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && !scannedPatient) {
        setScannedPatient({
          name: 'Anandi Bai Patil (आनंदीबाई पाटील)',
          age: 67,
          abhaId: '91-4432-8891-0023',
          history: [
            {
              date: '12/08/2025',
              diagnostic: 'Hypertension / उच्च रक्तदाब',
              facility: 'PHC Shirsufal',
            },
            {
              date: '04/01/2026',
              diagnostic: 'Type 2 Diabetes Screening',
              facility: 'Rural Hospital Baramati',
            },
          ],
        });
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text>No Camera Permission Granted</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text>No Camera Device Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scannedPatient ? (
        <View style={styles.cameraContainer}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive
            codeScanner={codeScanner}
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              Align Patient QR Code Inside Box
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.cardContainer}>
          <View style={styles.card}>
            <CheckCircle color="#10B981" size={40} />
            <Text style={styles.patientName}>{scannedPatient.name}</Text>
            <Text style={styles.patientSub}>
              Age: {scannedPatient.age} | ABHA: {scannedPatient.abhaId}
            </Text>

            <Text style={styles.sectionTitle}>
              Medical Timeline (वैद्यकीय इतिहास)
            </Text>
            {scannedPatient.history.map((item) => (
              <View key={`${item.date}-${item.facility}`} style={styles.timelineItem}>
                <Text style={styles.timelineDate}>
                  {item.date} - {item.facility}
                </Text>
                <Text style={styles.timelineText}>{item.diagnostic}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.referButton}
              onPress={() =>
                Alert.alert(
                  'Referral Initiated',
                  'Patient referred to Urban Specialist Hospital dashboard.',
                )
              }
            >
              <Text style={styles.buttonText}>Escalate / Refer to Specialist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setScannedPatient(null)}
            >
              <Text style={styles.resetButtonText}>Scan Next Patient</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function RegisterScreen() {
  const [name, setName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [vitals, setVitals] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  const handleRegister = () => {
    if (!name.trim() || !aadhaar.trim()) {
      Alert.alert('Error', 'Please fill essential fields.');
      return;
    }

    Alert.alert(
      isOnline ? 'Success' : 'Offline Mode Active',
      isOnline
        ? 'Record synced directly to central ABDM Grid.'
        : 'Record saved securely to local device storage. It will auto-sync when network returns.',
    );
    setName('');
    setAadhaar('');
    setVitals('');
  };

  return (
    <ScrollView style={styles.formContainer}>
      <TouchableOpacity
        style={[
          styles.networkToggle,
          isOnline ? styles.online : styles.offline,
        ]}
        onPress={() => setIsOnline((current) => !current)}
      >
        {isOnline ? <Wifi color="#FFF" size={18} /> : <WifiOff color="#FFF" size={18} />}
        <Text style={styles.networkText}>
          {isOnline ? 'Network: Online (Sync Active)' : 'Network: Offline (Edge Storage)'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Patient Name / रुग्णाचे नाव *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter full name"
      />

      <Text style={styles.label}>
        Aadhaar Card Number * (Used for generating ABHA)
      </Text>
      <TextInput
        style={styles.input}
        value={aadhaar}
        onChangeText={setAadhaar}
        placeholder="XXXX XXXX XXXX"
        keyboardType="numeric"
        maxLength={12}
      />

      <Text style={styles.label}>Current Symptoms / Vitals (लक्षणे)</Text>
      <TextInput
        style={[styles.input, styles.vitalsInput]}
        value={vitals}
        onChangeText={setVitals}
        placeholder="BP, Sugar levels, or general health issues..."
        multiline
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>Generate Unique QR &amp; Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InventoryScreen() {
  const mockInventory = [
    {
      id: '1',
      item: 'Paracetamol 500mg',
      status: 'In Stock',
      qty: '450 units',
      tier: 'PHC Clinic',
    },
    {
      id: '2',
      item: 'Amoxicillin Antibiotic',
      status: 'Low Stock',
      qty: '12 units',
      tier: 'PHC Clinic',
    },
    {
      id: '3',
      item: 'O+ Blood Units',
      status: 'Available',
      qty: '8 bags',
      tier: 'Regional Hospital',
    },
    {
      id: '4',
      item: 'On-Duty Pediatrician',
      status: 'Active Now',
      qty: 'Dr. R. Deshmukh',
      tier: 'Civil Specialist Hub',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>
        Regional Infrastructure Availability Ledger
      </Text>
      <FlatList
        data={mockInventory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.inventoryCard}>
            <View>
              <Text style={styles.itemName}>{item.item}</Text>
              <Text style={styles.itemTier}>{item.tier}</Text>
            </View>
            <View style={styles.rightAlign}>
              <Text
                style={[
                  styles.itemStatus,
                  item.status === 'Low Stock'
                    ? styles.lowStock
                    : styles.available,
                ]}
              >
                {item.status}
              </Text>
              <Text style={styles.itemQty}>{item.qty}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#0284C7',
          tabBarInactiveTintColor: '#64748B',
          headerStyle: { backgroundColor: '#0284C7' },
          headerTintColor: '#FFF',
        }}
      >
        <Tab.Screen
          name="Scan Patient"
          component={ScanScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <QrCode color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Register Patient"
          component={RegisterScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <UserPlus color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Live Diagnostics"
          component={InventoryScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Package color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  overlayText: { color: '#FFF', fontWeight: 'bold' },
  cardContainer: { flex: 1 },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 12,
    textAlign: 'center',
  },
  patientSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284C7',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  timelineItem: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 8,
  },
  timelineDate: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  timelineText: { fontSize: 14, color: '#334155', marginTop: 2 },
  referButton: {
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  resetButton: {
    borderColor: '#64748B',
    borderWidth: 1,
    padding: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: { color: '#64748B', fontWeight: '600' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  formContainer: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#334155',
  },
  vitalsInput: { height: 80, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#0284C7',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  networkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  online: { backgroundColor: '#10B981' },
  offline: { backgroundColor: '#64748B' },
  networkText: { color: '#FFF', marginLeft: 8, fontWeight: '600' },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  inventoryCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  itemTier: { fontSize: 12, color: '#64748B', marginTop: 4 },
  rightAlign: { alignItems: 'flex-end' },
  itemStatus: { fontSize: 14, fontWeight: 'bold' },
  lowStock: { color: '#EF4444' },
  available: { color: '#10B981' },
  itemQty: { fontSize: 13, color: '#64748B', marginTop: 4 },
});
