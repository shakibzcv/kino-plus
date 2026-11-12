import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Easing,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { BrandColors } from '@/constants/theme';

export interface VoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSpeechResult: (transcript: string) => void;
}


export function VoiceSearchModal({
  visible,
  onClose,
  onSpeechResult,
}: VoiceSearchModalProps) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Listening... Speak now');
  const webViewRef = useRef<any>(null);

  // Pulse animation for the glowing mic ring
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  // Web Speech API reference for web platform
  const webRecognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) {
      setTranscript('');
      setIsListening(false);
      setStatusMessage('Listening... Speak now');
      if (webRecognitionRef.current) {
        try {
          webRecognitionRef.current.abort();
        } catch {}
      }
      return;
    }

    setIsListening(true);
    setStatusMessage('Listening... Speak now');

    // Start pulsating animations
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim1, {
            toValue: 1.45,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim1, {
            toValue: 1,
            duration: 1200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseAnim2, {
            toValue: 1.8,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim2, {
            toValue: 1,
            duration: 1200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();

    // If on Web platform: Use native browser SpeechRecognition API directly
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onstart = () => {
            setIsListening(true);
            setStatusMessage('Listening... Speak now');
          };

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              current += event.results[i][0].transcript;
            }
            if (current) {
              setTranscript(current);
            }
            if (event.results[0] && event.results[0].isFinal) {
              const final = event.results[0][0].transcript;
              setTranscript(final);
              handleConfirmSearch(final);
            }
          };

          recognition.onerror = (e: any) => {
            if (e.error !== 'no-speech') {
              setStatusMessage('Tap a movie or speak clearly');
            }
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
          webRecognitionRef.current = recognition;
        } catch {
          setStatusMessage('Speak movie title or tap suggestion');
        }
      } else {
        setStatusMessage('Speak movie title or tap suggestion');
      }
    }

    return () => {
      pulseLoop.stop();
      if (webRecognitionRef.current) {
        try {
          webRecognitionRef.current.abort();
        } catch {}
      }
    };
  }, [visible, pulseAnim1, pulseAnim2, opacityAnim]);

  const handleConfirmSearch = useCallback(
    (textToSearch: string) => {
      const clean = textToSearch.trim();
      if (!clean) return;
      onSpeechResult(clean);
      onClose();
    },
    [onSpeechResult, onClose]
  );

  // HTML content injected into hidden WebView for native Android/iOS
  const webViewSpeechHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <script>
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognition) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'unsupported' }));
          } else {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'start' }));
            };

            recognition.onresult = function(event) {
              let current = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                current += event.results[i][0].transcript;
              }
              const isFinal = Boolean(event.results[event.results.length - 1].isFinal);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'result', text: current, isFinal }));
            };

            recognition.onerror = function(event) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: event.error }));
            };

            recognition.onend = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'end' }));
            };

            try {
              recognition.start();
            } catch (err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: err.message }));
            }
          }
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'start') {
        setIsListening(true);
        setStatusMessage('Listening... Speak now');
      } else if (data.type === 'result') {
        if (data.text) {
          setTranscript(data.text);
        }
        if (data.isFinal && data.text) {
          handleConfirmSearch(data.text);
        }
      } else if (data.type === 'unsupported') {
        setStatusMessage('Speak movie title or tap suggestion');
      } else if (data.type === 'end') {
        setIsListening(false);
      }
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/75">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="rounded-t-[32px] bg-[#16181e] border-t border-white/10 px-6 pt-3 pb-8 shadow-2xl items-center">
          {/* Top handle bar */}
          <View className="mb-5 h-1.5 w-12 rounded-full bg-white/20" />

          {/* Close button */}
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="absolute right-5 top-5 w-9 h-9 rounded-full bg-white/10 items-center justify-center active:opacity-75"
          >
            <Ionicons name="close" size={20} color="#ffffff" />
          </Pressable>

          {/* Pulsing Animated Mic Centerpiece */}
          <View className="h-44 w-44 items-center justify-center my-2">
            {/* Outer wave ring */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: BrandColors.primary,
                opacity: opacityAnim,
                transform: [{ scale: pulseAnim2 }],
              }}
            />

            {/* Inner wave ring */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 95,
                height: 95,
                borderRadius: 47.5,
                backgroundColor: BrandColors.primary,
                opacity: 0.35,
                transform: [{ scale: pulseAnim1 }],
              }}
            />

            {/* Core mic button */}
            <View
              className="w-20 h-20 rounded-full items-center justify-center shadow-lg"
              style={{
                backgroundColor: isListening ? BrandColors.primary : '#262933',
                elevation: 10,
              }}
            >
              <Ionicons
                name="mic"
                size={38}
                color="#ffffff"
              />
            </View>
          </View>

          {/* Status Label */}
          <Text className="text-[20px] font-extrabold text-white text-center tracking-tight">
            {transcript ? `"${transcript}"` : statusMessage}
          </Text>

          <Text className="mt-1.5 text-[13px] text-[#8a91a0] text-center max-w-[280px]">
            {transcript
              ? 'Transcribing your voice in real-time...'
              : 'Say a movie title, TV show, or genre to search'}
          </Text>

          {/* If transcript exists, action button to search immediately */}
          {transcript.trim().length > 0 && (
            <Pressable
              onPress={() => handleConfirmSearch(transcript)}
              className="mt-5 h-12 w-full max-w-[320px] rounded-full bg-[#f2545b] items-center justify-center flex-row active:opacity-90 shadow-md"
            >
              <Ionicons name="search" size={18} color="#ffffff" />
              <Text className="ml-2 text-[15px] font-bold text-white">
                Search for "{transcript}"
              </Text>
            </Pressable>
          )}


          {/* Hidden WebView on native platforms to process Web Speech API */}
          {Platform.OS !== 'web' && (
            <View style={{ width: 0, height: 0, opacity: 0, overflow: 'hidden' }}>
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: webViewSpeechHtml }}
                onMessage={handleWebViewMessage}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                javaScriptEnabled={true}
                onPermissionRequest={(request: any) => {
                  try {
                    request.grant(request.resources);
                  } catch {}
                }}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
