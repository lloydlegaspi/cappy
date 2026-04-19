import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { AlagaColors } from '@/constants/alaga-theme';

type ChatRole = 'cappy' | 'user';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

const mascotImage = require('../../assets/images/cappy-mascot.png');

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'cappy',
    text: 'Hi! I am Cappy. I can help with gentle medication reminders and quick check-ins.',
  },
  {
    id: 'starter-tip',
    role: 'cappy',
    text: 'Try asking: "What should I take now?" or "Help me remember my evening meds."',
  },
];

export default function AskScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');

  const sendDisabled = useMemo(() => draft.trim().length === 0, [draft]);

  const sendMessage = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const cappyReply: ChatMessage = {
      id: `cappy-${Date.now()}`,
      role: 'cappy',
      text: 'Thanks for sharing. Full chat support is coming soon, but Cappy is ready to guide your next step.',
    };

    setMessages((current) => [...current, userMessage, cappyReply]);
    setDraft('');
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Ask Cappy</Text>
          <Text style={styles.subtitle}>A calm space for medication questions and support.</Text>
        </View>
        <Image source={mascotImage} style={styles.mascot} resizeMode="contain" />
      </View>

      <ScrollView
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {messages.map((message) => {
          const isUser = message.role === 'user';

          return (
            <View key={message.id} style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowCappy]}>
              <View style={[styles.bubble, isUser ? styles.userBubble : styles.cappyBubble]}>
                <Text style={[styles.bubbleText, isUser ? styles.userBubbleText : styles.cappyBubbleText]}>
                  {message.text}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputWrap}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message to Cappy"
          placeholderTextColor={AlagaColors.textMuted}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <Pressable
          onPress={sendMessage}
          style={[styles.sendButton, sendDisabled && styles.sendButtonDisabled]}
          disabled={sendDisabled}
          accessibilityRole="button"
          accessibilityLabel="Send message to Cappy">
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: AlagaColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AlagaColors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: AlagaColors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    color: AlagaColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  mascot: {
    width: 56,
    height: 56,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 10,
  },
  bubbleRow: {
    width: '100%',
  },
  bubbleRowCappy: {
    alignItems: 'flex-start',
  },
  bubbleRowUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '90%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cappyBubble: {
    backgroundColor: '#EBF3FB',
    borderWidth: 1,
    borderColor: '#D8E6F4',
  },
  userBubble: {
    backgroundColor: AlagaColors.accentBlue,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  cappyBubbleText: {
    color: AlagaColors.textPrimary,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  inputWrap: {
    borderTopWidth: 1,
    borderTopColor: AlagaColors.border,
    backgroundColor: AlagaColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E6F4',
    backgroundColor: '#FFFFFF',
    color: AlagaColors.textPrimary,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AlagaColors.accentBlue,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
