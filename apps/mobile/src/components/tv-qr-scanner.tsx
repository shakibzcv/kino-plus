import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';
import { parseTvPairingCode } from '@/services/sessions';

interface TvQrScannerProps {
  onScanned: (code: string) => void;
  onClose: () => void;
  onEnterCode: () => void;
  busy?: boolean;
}

export function TvQrScanner({ onScanned, onClose, onEnterCode, busy }: TvQrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const handledRef = useRef(false);

  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 items-center justify-center bg-[#0e1013] px-6">
        <Ionicons name="qr-code-outline" size={48} color="#8b93a5" />
        <Text className="mt-4 text-center text-[16px] font-bold text-white">
          Camera scanning is available on the phone app
        </Text>
        <Pressable onPress={onEnterCode} className="mt-6 h-12 w-full items-center justify-center rounded-full bg-[#2aa8e0]">
          <Text className="text-[16px] font-bold text-white">Enter code instead</Text>
        </Pressable>
        <Pressable onPress={onClose} className="mt-3 py-3">
          <Text className="text-[15px] font-semibold text-[#8b93a5]">Cancel</Text>
        </Pressable>
      </View>
    );
  }

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0e1013]">
        <ActivityIndicator color={BrandColors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0e1013] px-6">
        <Ionicons name="camera-outline" size={48} color="#8b93a5" />
        <Text className="mt-4 text-center text-[16px] font-bold text-white">Camera access needed</Text>
        <Text className="mt-2 text-center text-[14px] leading-5 text-[#8b93a5]">
          Allow camera so you can scan the QR code shown on your Android TV.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="mt-6 h-12 w-full items-center justify-center rounded-full bg-[#2aa8e0]"
        >
          <Text className="text-[16px] font-bold text-white">Allow camera</Text>
        </Pressable>
        <Pressable onPress={onEnterCode} className="mt-3 py-3">
          <Text className="text-[15px] font-semibold text-[#8b93a5]">Enter code instead</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (handledRef.current || busy) return;
          const code = parseTvPairingCode(data);
          if (!code) return;
          handledRef.current = true;
          onScanned(code);
        }}
        style={{ flex: 1 }}
      />

      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <View className="h-56 w-56 rounded-3xl border-2 border-white/90" />
        <Text className="mt-5 px-8 text-center text-[15px] font-semibold text-white">
          Point your camera at the QR code on your TV
        </Text>
      </View>

      <View className="absolute left-0 right-0 top-12 flex-row items-center justify-between px-4">
        <Pressable
          onPress={onClose}
          className="h-11 w-11 items-center justify-center rounded-full bg-black/50"
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </Pressable>
        <Pressable
          onPress={() => setTorch((prev) => !prev)}
          className="h-11 w-11 items-center justify-center rounded-full bg-black/50"
        >
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color="#ffffff" />
        </Pressable>
      </View>

      <View className="absolute bottom-10 left-0 right-0 items-center px-6">
        {busy ? <ActivityIndicator color="#ffffff" /> : null}
        <Pressable onPress={onEnterCode} className="mt-4 py-3">
          <Text className="text-[15px] font-semibold text-white">Enter code instead</Text>
        </Pressable>
      </View>
    </View>
  );
}
