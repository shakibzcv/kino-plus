import React, { useRef, useEffect } from 'react';
import {
  View,
  Pressable,
  Keyboard,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';

export interface HeaderSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  isLoading?: boolean;
  onSubmitEditing?: () => void;
  showVoiceIcon?: boolean;
  showAudioButton?: boolean;
  onVoicePress?: () => void;
  onAudioPress?: () => void;
}

export function HeaderSearchBar({
  value,
  onChangeText,
  onClose,
  placeholder = 'Type to search',
  autoFocus = true,
  style,
  containerStyle,
  isLoading = false,
  onSubmitEditing,
  showVoiceIcon = true,
  showAudioButton = false,
  onVoicePress,
  onAudioPress,
}: HeaderSearchBarProps) {
  const searchbarRef = useRef<any>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        searchbarRef.current?.focus?.();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  return (
    <View
      style={[
        {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 48,
          borderWidth: 0,
        },
        containerStyle,
      ]}
    >
      <Searchbar
        ref={searchbarRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8a90a0"
        icon={({ color }) => (
          <Ionicons name="arrow-back" size={22} color={color || '#ffffff'} />
        )}
        onIconPress={() => {
          Keyboard.dismiss();
          onClose();
        }}
        clearIcon={({ color }) => (
          <Ionicons name="close" size={20} color={color || '#ffffff'} />
        )}
        onClearIconPress={() => onChangeText('')}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        loading={isLoading}
        elevation={0}
        mode="bar"
        selectionColor={BrandColors.primary}
        rippleColor="rgba(242, 84, 91, 0.12)"
        style={[
          {
            flex: 1,
            height: 48,
            minHeight: 48,
            backgroundColor: '#212124',
            borderRadius: 24,
            borderWidth: 0,
            justifyContent: 'center',
          },
          style as any,
        ]}
        inputStyle={{
          minHeight: 48,
          color: '#ffffff',
          fontSize: 16,
          alignSelf: 'center',
          paddingVertical: 0,
        }}
        theme={{
          colors: {
            primary: BrandColors.primary,
            elevation: {
              level0: '#212124',
              level1: '#212124',
              level2: '#212124',
              level3: '#212124',
              level4: '#212124',
              level5: '#212124',
            },
            surface: '#212124',
            onSurface: '#ffffff',
            onSurfaceVariant: '#8a90a0',
          },
        }}
      />

      {showAudioButton && (
        <Pressable
          onPress={onAudioPress || onVoicePress}
          hitSlop={8}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#212124',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
            borderWidth: 0,
          }}
          accessibilityLabel="Voice search"
          accessibilityRole="button"
        >
          <Ionicons name="mic" size={22} color="#ffffff" />
        </Pressable>
      )}
    </View>
  );
}
