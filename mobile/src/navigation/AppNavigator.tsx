import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';

// Student Screens
import { StudentDashboardScreen } from '../screens/student/StudentDashboardScreen';
import { QRPresenterScreen } from '../screens/student/QRPresenterScreen';
import { AbsenceDeclarationScreen } from '../screens/student/AbsenceDeclarationScreen';
import { MealFeedbackScreen } from '../screens/student/MealFeedbackScreen';
import { StudentBillingScreen } from '../screens/student/StudentBillingScreen';

// Manager Screens
import { ManagerDashboardScreen } from '../screens/manager/ManagerDashboardScreen';
import { QRScannerScreen } from '../screens/manager/QRScannerScreen';
import { SlotManagementScreen } from '../screens/manager/SlotManagementScreen';
import { ManagerFeedbackScreen } from '../screens/manager/ManagerFeedbackScreen';

// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { UserApprovalsScreen } from '../screens/admin/UserApprovalsScreen';
import { HygieneAlertsScreen } from '../screens/admin/HygieneAlertsScreen';
import { AuditLogsScreen } from '../screens/admin/AuditLogsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Student Bottom Tab Navigator ---
function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = 'home';
          if (route.name === 'Schedule') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Absence') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Feedback') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Billing') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Schedule" component={StudentDashboardScreen} options={{ title: 'Meals' }} />
      <Tab.Screen name="Absence" component={AbsenceDeclarationScreen} options={{ title: 'Leave' }} />
      <Tab.Screen name="Feedback" component={MealFeedbackScreen} options={{ title: 'Rating' }} />
      <Tab.Screen name="Billing" component={StudentBillingScreen} options={{ title: 'My Bill' }} />
    </Tab.Navigator>
  );
}

// Student Stack with Modal for QR Pass
function StudentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentMain" component={StudentTabs} />
      <Stack.Screen
        name="QRPass"
        component={QRPresenterScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}

// --- Mess Manager Bottom Tab Navigator ---
function ManagerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = 'stats-chart';
          if (route.name === 'Demand') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Scanner') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'Slots') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Reviews') {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Demand" component={ManagerDashboardScreen} options={{ title: 'Demand' }} />
      <Tab.Screen name="Scanner" component={QRScannerScreen} options={{ title: 'Scan QR' }} />
      <Tab.Screen name="Slots" component={SlotManagementScreen} options={{ title: 'Menus' }} />
      <Tab.Screen name="Reviews" component={ManagerFeedbackScreen} options={{ title: 'Feedback' }} />
    </Tab.Navigator>
  );
}

// Manager Stack
function ManagerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerMain" component={ManagerTabs} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      <Stack.Screen name="SlotManagement" component={SlotManagementScreen} />
      <Stack.Screen name="ManagerFeedback" component={ManagerFeedbackScreen} />
    </Stack.Navigator>
  );
}

// --- College Admin Bottom Tab Navigator ---
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = 'shield';
          if (route.name === 'Overview') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Approvals') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Hygiene') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Audit') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Overview" component={AdminDashboardScreen} options={{ title: 'Overview' }} />
      <Tab.Screen name="Approvals" component={UserApprovalsScreen} options={{ title: 'Approvals' }} />
      <Tab.Screen name="Hygiene" component={HygieneAlertsScreen} options={{ title: 'Hygiene' }} />
      <Tab.Screen name="Audit" component={AuditLogsScreen} options={{ title: 'Audit Logs' }} />
    </Tab.Navigator>
  );
}

// Admin Stack
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMain" component={AdminTabs} />
      <Stack.Screen name="UserApprovals" component={UserApprovalsScreen} />
      <Stack.Screen name="HygieneAlerts" component={HygieneAlertsScreen} />
      <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
    </Stack.Navigator>
  );
}

// --- Main Root Navigator ---
export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      ) : user.status === 'pending_approval' ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        </Stack.Navigator>
      ) : user.role === 'mess_manager' ? (
        <ManagerStack />
      ) : user.role === 'college_admin' ? (
        <AdminStack />
      ) : (
        <StudentStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

