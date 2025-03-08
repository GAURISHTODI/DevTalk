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
  ActivityIndicator,
  ScrollView,
  Linking,
  ToastAndroid
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/authContext';
import { db } from '../firebase/firebaseConfig';
import Entypo from '@expo/vector-icons/Entypo';
import { Highlight, themes } from 'prism-react-renderer';//for code snippets
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Clipboard from 'expo-clipboard';//clipboard API
import { 
  collection, 
  addDoc, 
  query, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDoc 
} from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

// CodeBlock Component for Syntax Highlighting
const CodeBlock = ({ code, language = 'javascript' }) => {
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(code);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Code copied to clipboard!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'Code copied to clipboard!');
    }
  };

  return (
    <View style={{ maxHeight: 400, minHeight: 100 }}> 
      <ScrollView 
        horizontal 
        style={{ 
          backgroundColor: '#f4f4f4', 
          borderRadius: 5, 
          padding: 10 
        }}
      >
        <ScrollView style={{ flexGrow: 1 }}>
          <Highlight
            code={code}
            language={language}
            theme={themes.oneLight}
          >
            {({ tokens, getLineProps, getTokenProps }) => (
              <View>
                {tokens.map((line, i) => (
                  <View key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <Text
                        key={key} 
                        {...getTokenProps({ token })}
                        style={{ 
                          fontFamily: 'monospace',
                          fontSize: 12 
                        }}
                      >
                        {token.content || ' '}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </Highlight>
        </ScrollView>
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }}>
        <TouchableOpacity 
          onPress={copyToClipboard} 
          style={styles.copyButton}
        >
          <Feather name="copy" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};


// Function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = timestamp.toDate();
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    if (isToday) {
      return `${formattedHours}:${formattedMinutes}`;
    } else {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      return `${day}/${month} ${formattedHours}:${formattedMinutes}`;
    }
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return '';
  }
};

export default function ChatRoom() {
  const { userTwoId, userTwoName, userTwoEmail } = useLocalSearchParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [userTwoDetails, setUserTwoDetails] = useState();
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const flatListRef = useRef(null);
  const router = useRouter();

  // Simplified code detection regex
  const CODE_REGEX = /```(\w+)?\n?([\s\S]*?)```/;

  // Parse message for code snippets
  const parseMessage = (text) => {
    const codeMatch = text.match(CODE_REGEX);
    if (codeMatch) {
      const language = codeMatch[1] || 'javascript';
      const code = codeMatch[2].trim();
      console.log('Code Detected:', { language, code });
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
        userOneName: user.name || user.email || 'Anonymous',
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


// Function to fetch userTwo's GitHub and contact details
const fetchUserTwoDetails = async () => {
  if (!userTwoId) return;

  try {
    const userRef = doc(db, 'users', userTwoId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('UserTwo Details:', userData);
      setUserTwoDetails({
        gitHub: userData.gitHub || 'Not available',
        phoneNumber: userData.phoneNumber || 'Not available',
      });
    } else {
      console.log('UserTwo not found');
    }
  } catch (error) {
    console.error('Error fetching userTwo details:', error);
  }
};

// Call this function inside useEffect
useEffect(() => {
  fetchUserTwoDetails();
}, [userTwoId]);


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
      const currentTimestamp = serverTimestamp();

      const messagesRef = collection(db, 'chatrooms', chatRoomId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        text: message.trim(),
        createdAt: currentTimestamp,
        senderName: user.name || user.displayName || user.email,
        receiverId: userTwoId,
        replyTo: replyTo ? {
          id: replyTo.id,
          text: replyTo.text,
          senderName: replyTo.senderName
        } : null,
        codeLanguage: parsedMessage.hasCode ? parsedMessage.language : null
      });

      // Update the lastMessage and lastMessageTimestamp
      const roomRef = doc(db, 'chatrooms', chatRoomId);
      await updateDoc(roomRef, {
        lastMessage: message.trim(),
        lastMessageTimestamp: currentTimestamp
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
              { color: isCurrentUserMessage ? 'black' : '#666' }
            ]}>
              Replying to {item.replyTo.senderName}
            </Text>
            <Text style={[
              styles.replyOriginalText, 
              { 
                fontStyle: 'italic', 
                color: isCurrentUserMessage ? 'black' : '#333' 
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
          <CodeBlock 
            code={item.parsedMessage.code} 
            language={item.parsedMessage.language || 'javascript'} 
          />
        )}
        
        {/* Message footer with timestamp and reply button */}
        <View style={styles.messageFooter}>
          {/* Timestamp */}
          {item.createdAt && (
            <Text style={[
              styles.timestampText,
              { color: isCurrentUserMessage ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }
            ]}>
              {formatTimestamp(item.createdAt)}
            </Text>
          )}
          
          {/* Reply button */}
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
      <TouchableOpacity style={{ marginTop: 10, margin: 5 }} onPress={() => router.push('/(tabs)/Chat')}>
       <Ionicons name="arrow-back-outline" size={20} color="black" />
     </TouchableOpacity>
  
      <Text style={styles.headerTitle}>{userTwoName || userTwoEmail}</Text>

      <View style={{ flexDirection: 'row', gap: 30 }}>
    
    <TouchableOpacity onPress={() => Linking.openURL(userTwoDetails.gitHub)}>
      <AntDesign name="github" size={20} color="black" />
    </TouchableOpacity>

    
    <TouchableOpacity onPress={() => Linking.openURL(`tel:${userTwoDetails.phoneNumber}`)}>
      <Ionicons name="call" size={20} color="black" />
    </TouchableOpacity>

    {/* Video Call (Assuming same phone number) */}
    <TouchableOpacity onPress={() => Linking.openURL(`tel:${userTwoDetails.phoneNumber}`)}>
      <FontAwesome name="video-camera" size={20} color="black" />
    </TouchableOpacity>
  </View>
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }} // Add paddingBottom for input box space
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message... (Use '```lang code```' for syntax highlight)"
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
    flexDirection: 'row',
    justifyContent:"space-around"
  },
  headerTitle: {
    fontSize: 25,
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
    fontFamily:'outfit-medium'
  },
  sentMessageText: {
    color: 'white',
    fontFamily:'outfit-medium'
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  timestampText: {
    fontSize: 12,
    marginRight: 10,
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
    borderRadius: 5,
  },
  replyText: {
    fontSize: 12,
    color: 'black',
    fontFamily:'outfit-bold'
  },
  replyOriginalText: {
    fontSize: 14,
    fontStyle: 'italic',
    color:'black'
  },
  replyPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  replyPreviewText: {
    flex: 1,
    padding: 5,
    color:'black'
  },
  cancelReplyText: {
    color: 'white',
    borderWidth: 1,
    backgroundColor: 'red',
    borderRadius: 5,
    margin: 5,
    padding: 5,
    fontFamily: 'outfit-bold'
  },
  codeContainer: {
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
  },
  replyButton: {
    alignSelf: 'flex-end',
  },
  replyButtonText: {
    color: 'black',
    fontSize: 15,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.3,
  },
  emptyListText: {
    color: 'black',
    fontSize: 16,
  },
  copyButton: {
    marginTop: 5,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 1,
    paddingVertical: 1,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  copyButtonText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#333',
  },
});