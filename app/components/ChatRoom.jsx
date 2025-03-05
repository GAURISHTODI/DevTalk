import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/authContext';
import { db } from '../firebase/firebaseConfig';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  limit
} from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function ChatRoom() {
  const { userTwoId, userTwoName, userTwoEmail } = useLocalSearchParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const flatListRef = useRef(null);

  // Create a unique chat room ID (sorted to ensure consistency)
  const chatRoomId = [user.uid, userTwoId].sort().join('_');

  // Code detection regex (improved)
  const CODE_REGEX = /```(\w+)?\n([\s\S]*?)```/;

  const parseMessage = (text) => {
    const codeMatch = text.match(CODE_REGEX);
    if (codeMatch) {
      const language = codeMatch[1] || 'javascript';
      const code = codeMatch[2];
      return { 
        hasCode: true, 
        language, 
        text: text.replace(CODE_REGEX, '').trim(),
        code 
      };
    }
    return { hasCode: false, text };
  };

  const sendMessage = async () => {
    if (message.trim() === '') return;

    try {
      const parsedMessage = parseMessage(message.trim());

      await addDoc(collection(db, 'chats'), {
        chatRoomId,
        senderId: user.uid,
        text: message.trim(),
        createdAt: serverTimestamp(),
        senderName: user.displayName || user.name || user.email,
        receiverId: userTwoId,
        replyTo: replyTo ? {
          id: replyTo.id,
          text: replyTo.text,
          senderName: replyTo.senderName
        } : null,
        codeLanguage: parsedMessage.hasCode ? parsedMessage.language : null
      });

      // Reset reply and message
      setMessage('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Send Failed', 'Unable to send message. Please try again.');
    }
  };

  const fetchMessages = useCallback(() => {
    const q = query(
      collection(db, 'chats'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('createdAt', 'asc'),
      limit(100) // Limit to last 100 messages for performance
    );

    return onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        parsedMessage: parseMessage(doc.data().text)
      }));

      setMessages(fetchedMessages);
    }, (error) => {
      console.error('Error fetching messages:', error);
      Alert.alert('Fetch Error', 'Unable to load messages.');
    });
  }, [chatRoomId]);

  useEffect(() => {
    const unsubscribe = fetchMessages();
    return () => unsubscribe();
  }, [fetchMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const renderMessage = ({ item }) => {
    const isCurrentUserMessage = item.senderId === user.uid;

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUserMessage ? styles.sentMessage : styles.receivedMessage
      ]}>
        {/* Reply reference */}
        {item.replyTo && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyText}>
              Replying to {item.replyTo.senderName}
            </Text>
            <Text style={styles.replyOriginalText} numberOfLines={2}>
              {item.replyTo.text}
            </Text>
          </View>
        )}

        {/* Main message text */}
        <Text style={styles.messageText}>{item.parsedMessage.text}</Text>

        {/* Code highlighting */}
        {item.parsedMessage.hasCode && (
          <View style={styles.codeContainer}>
            <SyntaxHighlighter
              language={item.parsedMessage.language}
              highlighter="hljs"
              style={{
                backgroundColor: '#f4f4f4',
                padding: 10,
                borderRadius: 5
              }}
            >
              {item.parsedMessage.code}
            </SyntaxHighlighter>
          </View>
        )}

        {/* Reply button */}
        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => setReplyTo(item)}
        >
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{userTwoName || userTwoEmail}</Text>
      </View>

      {/* Reply Preview */}
      {replyTo && (
        <View style={styles.replyPreviewContainer}>
          <Text style={styles.replyPreviewText}>
            Replying to: {replyTo.senderName}
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Text style={styles.cancelReplyText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={() => (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>No messages yet</Text>
          </View>
        )}
      />

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message... (Use ```lang code``` for syntax highlight)"
          multiline={true}
          numberOfLines={4}
          maxLength={1000} // Optional: limit message length
        />
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            message.trim() === '' && styles.sendButtonDisabled
          ]} 
          onPress={sendMessage}
          disabled={message.trim() === ''}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageList: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  messageContainer: {
    maxWidth: width * 0.8,
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
  },
  messageText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  replyContainer: {
    backgroundColor: '#f0f0f0',
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    paddingLeft: 10,
    marginBottom: 5,
  },
  replyText: {
    fontSize: 12,
    color: '#666',
  },
  replyOriginalText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  replyPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  replyPreviewText: {
    flex: 1,
  },
  cancelReplyText: {
    color: 'red',
  },
  codeContainer: {
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
  replyButton: {
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  replyButtonText: {
    color: '#007bff',
    fontSize: 12,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.3,
  },
  emptyListText: {
    color: '#888',
    fontSize: 16,
  },
});