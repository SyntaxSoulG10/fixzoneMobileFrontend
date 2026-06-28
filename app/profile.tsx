import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';
import ScreenContainer from '../components/ui/ScreenContainer';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/auth_context';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user: localUser, updateUser } = useUser();
  const { user: authUser, updateAuthUser, logout } = useAuth();

  // Form State
  const [name, setName] = useState(authUser?.fullName || localUser.name);
  const [mobile, setMobile] = useState(authUser?.phone || localUser.mobile);
  const [email, setEmail] = useState(authUser?.email || localUser.email);
  const [profileImage, setProfileImage] = useState(authUser?.profilePictureUrl || localUser.profileImage);
  const [isSaving, setIsSaving] = useState(false);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        const sourceUri = result.assets[0].uri;
        const filename = `profile_${Date.now()}.jpg`;
        
        // Use the new Expo FileSystem API (SDK 54+)
        const sourceFile = new File(sourceUri);
        const destinationFile = new File(Paths.document, filename);
        
        sourceFile.copy(destinationFile);
        
        setProfileImage(destinationFile.uri);
      } catch (error: any) {
        console.error('Error saving image:', error);
        Alert.alert('Save Failed', `Details: ${error.message || 'Unknown error'}`);
        setProfileImage(result.assets[0].uri);
      }
    }
  };

  const [mobileError, setMobileError] = useState('');

  const validatePhone = (num: string) => {
    // Sri Lankan mobile numbers are typically 9 digits starting with 7, 
    // or 10 digits starting with 0, or 12 digits starting with +947
    const cleaned = num.replace(/\s/g, '');
    const regex = /^(\+94|0)?7[0-9]{8}$/;
    return regex.test(cleaned);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Name cannot be empty.');
      return;
    }

    if (!mobile.trim()) {
      setMobileError('Mobile number is required');
      return;
    }

    if (!validatePhone(mobile)) {
      setMobileError('Please enter a valid Sri Lankan mobile number (e.g. 0771234567 or 771234567)');
      return;
    }

    setMobileError('');
    
    setIsSaving(true);
    try {
      // 1. Update Profile (Name and Phone)
      if (authUser?.userId) {
        await authService.updateProfile(authUser.userId, name, mobile);
        
        // 2. Update backend if image changed
        if (profileImage !== authUser.profilePictureUrl) {
          if (profileImage && profileImage.startsWith('file://')) {
            const base64 = await FileSystem.readAsStringAsync(profileImage, {
              encoding: 'base64',
            });
            const extension = profileImage.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = extension === 'png' ? 'image/png' : (extension === 'webp' ? 'image/webp' : 'image/jpeg');
            const imageData = `data:${mimeType};base64,${base64}`;
            await authService.updateProfileImage(authUser.userId, imageData);
          } else if (profileImage) {
            await authService.updateProfileImage(authUser.userId, profileImage);
          }
        }

        // 3. Sync with AuthContext
        updateAuthUser({ 
          fullName: name, 
          phone: mobile, 
          profilePictureUrl: profileImage || authUser.profilePictureUrl 
        });
      }

      // 4. Update local UserContext
      updateUser({ name, mobile, email, profileImage });
      
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error: any) {
      console.error('Profile Update Error:', error);
      Alert.alert('Update Failed', `Details: ${error.message || 'Check your connection or backend logs'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imageWrapper} onPress={pickImage} activeOpacity={0.9}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="person" size={60} color="#D1D5DB" />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userRole}>{getGreeting()} !</Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <AppInput
            label="Name"
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
            leftIcon="person-outline"
            maxLength={40}
          />
          <AppInput
            label="Mobile Number"
            placeholder="Your Mobile"
            value={mobile}
            onChangeText={(text) => { setMobile(text); setMobileError(''); }}
            error={mobileError}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />
          <AppInput
            label="Email Address"
            placeholder="Your Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            editable={false} // Email is not updatable
          />
        </View>

        <View style={styles.footer}>
          <AppButton
            label="Save Changes"
            onPress={handleSave}
            style={styles.saveBtn}
            loading={isSaving}
            disabled={isSaving}
          />
          
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout from Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginTop: -2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  detailsSection: {
    padding: 20,
  },
  footer: {
    padding: 20,
    marginTop: 10,
  },
  saveBtn: {
    marginBottom: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 8,
  },
});
