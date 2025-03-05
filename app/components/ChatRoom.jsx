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
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/authContext';
import { db } from '../firebase/firebaseConfig';
// import SyntaxHighlighter from 'react-native-syntax-highlighter';
// import { atomOneDark } from 'react-native-syntax-highlighter/styles/hljs';

import Entypo from '@expo/vector-icons/Entypo';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  doc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function ChatRoom() {
  const { userTwoId, userTwoName, userTwoEmail } = useLocalSearchParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const flatListRef = useRef(null);

  // Simplified code detection regex
  const CODE_REGEX = /```(\w+)?\n([\s\S]*?)```/;

  // Parse message for code snippets
  const parseMessage = (text) => {
    const codeMatch = text.match(CODE_REGEX);
    if (codeMatch) {
      const language = codeMatch[1] || 'javascript';
      const code = codeMatch[2].trim();
      return { 
        hasCode: true, 
        language, 
        text: text.replace(CODE_REGEX, '').trim(),
        code 
      };
    }
    return { hasCode: false, text };
  };

  // Generate a consistent chatroom ID for two users
  const generateChatRoomId = (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
  };

  // Comprehensive chatroom initialization
  const initializeChatRoom = useCallback(async () => {
    if (!user?.uid || !userTwoId) {
      console.error('Missing user information');
      Alert.alert('Error', 'Unable to initialize chat room');
      return null;
    }
  
    const roomId = generateChatRoomId(user.uid, userTwoId);
    
    try {
      const roomRef = doc(db, 'chatrooms', roomId);
      
      const chatRoomData = {
        participants: [user.uid, userTwoId],
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTimestamp: null,
        userOne: user.uid,
        userTwo: userTwoId,
        userOneName: user.displayName || user.email || 'Anonymous',
        userTwoName: userTwoName || userTwoEmail || 'Anonymous'
      };
  
      await setDoc(roomRef, chatRoomData, { merge: true });
  
      return roomId;
    } catch (error) {
      console.error('Chatroom initialization error:', error);
      Alert.alert('Error', `Could not initialize chat room: ${error.message}`);
      return null;
    }
  }, [user.uid, userTwoId, userTwoName, userTwoEmail]);

  // Enhanced message fetching
  const fetchMessages = useCallback(() => {
    if (!chatRoomId) return () => {};

    const messagesRef = collection(db, 'chatrooms', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const fetchedMessages = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          parsedMessage: parseMessage(doc.data().text)
        }));

        setMessages(fetchedMessages);
      }, 
      (error) => {
        console.error('Error fetching messages:', error);
        Alert.alert('Fetch Error', `Unable to load messages: ${error.message}`);
      }
    );

    return unsubscribe;
  }, [chatRoomId]);

  // Unified effect for chatroom and message initialization
  useEffect(() => {
    let unsubscribe = null;

    const setupChatRoom = async () => {
      const roomId = await initializeChatRoom();
      if (roomId) {
        setChatRoomId(roomId);
        unsubscribe = fetchMessages();
      }
    };

    setupChatRoom();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initializeChatRoom, fetchMessages]);

  // Send message function
  const sendMessage = async () => {
    if (message.trim() === '' || !chatRoomId) return;

    try {
      const parsedMessage = parseMessage(message.trim());

      const messagesRef = collection(db, 'chatrooms', chatRoomId, 'messages');
      await addDoc(messagesRef, {
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

      const roomRef = doc(db, 'chatrooms', chatRoomId);
      await updateDoc(roomRef, {
        lastMessage: message.trim(),
        lastMessageTimestamp: serverTimestamp()
      });

      setMessage('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Send Failed', 'Unable to send message. Please try again.');
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);
  

  useEffect(() => {
    if (chatRoomId) {
      return fetchMessages();
    }
  }, [chatRoomId]);
  
  const renderMessage = ({ item }) => {
    const isCurrentUserMessage = item.senderId === user.uid;
  
    return (
      <View style={[
        styles.messageContainer,
        {
          alignSelf: isCurrentUserMessage ? 'flex-end' : 'flex-start',
          backgroundColor: isCurrentUserMessage ? '#5865F2' : '#e9ecef'
        }
      ]}>
        {/* Reply reference */}
        {item.replyTo && (
          <View style={styles.replyContainer}>
            <Text style={[
              styles.replyText, 
              { color: isCurrentUserMessage ? 'rgba(255,255,255,0.7)' : '#666' }
            ]}>
              Replying to {item.replyTo.senderName}
            </Text>
            <Text style={[
              styles.replyOriginalText, 
              { 
                fontStyle: 'italic', 
                color: isCurrentUserMessage ? 'rgba(255,255,255,0.9)' : '#333' 
              }
            ]} numberOfLines={2}>
              {item.replyTo.text}
            </Text>
          </View>
        )}
  
        {/* Main message text */}
        <Text style={[
          styles.messageText, 
          { 
            color: isCurrentUserMessage ? 'white' : 'black',
          }
        ]}>
          {item.parsedMessage.text}
        </Text>
  
        {/* Code highlighting */}
        {item.parsedMessage.hasCode && (
          <View style={styles.codeContainer}>
            <SyntaxHighlighter
              language={item.parsedMessage.language || 'javascript'}
              style={atomOneLight}
              highlighter="hljs"
            >
              {item.parsedMessage.code}
            </SyntaxHighlighter>
          </View>
        )}
  
        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => setReplyTo(item)}
        >
          <Entypo 
            name="reply" 
            size={24} 
            color={isCurrentUserMessage ? 'white' : 'black'} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 64}
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
            <ActivityIndicator size="large" color="#5865F2" />
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
          maxLength={1000}
        />
        <TouchableOpacity 
          style={styles.sendButton} 
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
    backgroundColor: '#5865F2',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
  },
  messageText: {
    color: '#000',
  },
  sentMessageText: {
    color: 'white',
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
    backgroundColor: '#5865F2',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  replyContainer: {
    backgroundColor: '#f0f0f0',
    borderLeftWidth: 4,
    borderLeftColor: '#5865F2',
    paddingLeft: 10,
    marginBottom: 5,
    borderRadius:5,
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
    backgroundColor: '#f0f0f0',
    borderRadius:5,
  },
  replyPreviewText: {
    flex: 1,
    padding:5,
    
  },
  cancelReplyText: {
    color: 'white',
    borderWidth: 1,
    backgroundColor: 'red',
    borderRadius: 5,
    margin: 5,
    padding:5,
fontFamily:'outfit-bold'
  },
  codeContainer: {
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    borderRadius:5,
  },
  replyButton: {
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  replyButtonText: {
    color: 'black',
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