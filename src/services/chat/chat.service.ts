import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../enviornments/enviornment';

interface User {
  id: number;
  name: string;
  user_type: string;
}

interface ChatRoom {
  id: number;
  customer: User;
  designer: User;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  room: number;
  sender: string;
  content: string;
  timestamp: string;
  is_read: boolean;
  file_url?: string;
  audio_url?: string;
}

interface CreateChatRoomResponse {
  detail: string;
  room_id: number;
  data?: {
    created_at: string;
    updated_at: string;
  };
}

interface WebSocketMessage {
  type: string;
  message: Message;
  room_id: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = `${environment.apiBaseUrl}/users/api`;
  private socket: WebSocket | null = null;
  private listeners: ((msg: Message) => void)[] = [];
  public isConnected = false;

  constructor(private http: HttpClient) {}

  // In chat.service.ts
private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('🔐 Token being used:', token);
    console.log('👤 User data from localStorage:', userData);
    
    return new HttpHeaders({
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
    });
}

  getChatRooms(): Observable<ChatRoom[]> {
    return this.http
        .get<ChatRoom[]>(`${this.apiUrl}/chat-rooms/`, {
          headers: this.getHeaders(),
        })
        .pipe(catchError(this.handleError));
  }

  getMessages(roomId: number): Observable<Message[]> {
    const url = `${this.apiUrl}/chat-messages/${roomId}/`;
    return this.http
        .get<Message[]>(url, {
            headers: this.getHeaders(),
        })
        .pipe(catchError(this.handleError));
}


sendMessage(
    roomId: number,
    content: string,
    fileUrl?: string,
    audioUrl?: string
): Observable<Message> {
    const payload: any = { content };
    if (fileUrl) payload.file_url = fileUrl;
    if (audioUrl) payload.audio_url = audioUrl;
    
    // Ensure the URL has proper formatting
    const url = `${this.apiUrl}/send-message/${roomId}/`;
    
    return this.http
        .post<Message>(url, payload, { 
            headers: this.getHeaders() 
        })
        .pipe(catchError(this.handleError));
}

  getAllUsers(): Observable<User[]> {
    return this.http
        .get<User[]>(`${this.apiUrl}/get-all-users/`, {
          headers: this.getHeaders(),
        })
        .pipe(catchError(this.handleError));
  }

  createChatRoom(payload: { sender_id: number; receiver_id: number }): Observable<CreateChatRoomResponse> {
    return this.http
        .post<CreateChatRoomResponse>(`${this.apiUrl}/create-chat-room/`, payload, {
          headers: this.getHeaders(),
        })
        .pipe(
            catchError((error) => {
              console.error('Create chat room error:', error);
              return throwError(() => new Error(
                  error.error?.detail ||
                  error.error?.message ||
                  'Failed to create chat room. Please try again.'
              ));
            })
        );
  }

connect(roomId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');
    if (!token || !roomId) {
      return reject('Invalid token or room');
    }

    // Use the corrected environment configuration
    const protocol = 'wss://'; // Since your API uses HTTPS, use WSS
    const host = environment.wsHost; // This should now be just 'api.designpro.qa'
    
    const wsUrl = `${protocol}${host}/ws/chat/${roomId}/?token=${token}`;

    console.log('🔌 WebSocket connecting to:', wsUrl);
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      resolve();
    };

    this.socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.isConnected = false;
      reject(`WebSocket connection failed: ${error}`);
    };

    this.socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          this.listeners.forEach((listener) => listener(data.message));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('🔌 WebSocket disconnected', event);
      this.isConnected = false;
      if (!event.wasClean) {
        console.error('WebSocket closed unexpectedly');
        setTimeout(() => {
          if (roomId && this.socket === null) { // Only reconnect if socket is null
            console.log('🔄 Attempting to reconnect...');
            this.connect(roomId).catch(err => console.error('Reconnect failed:', err));
          }
        }, 5000);
      }
    };
  });
}

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.listeners = [];
      this.isConnected = false;
    }
  }

  onMessage(callback: (msg: Message) => void): void {
    this.listeners.push(callback);
  }

 private handleError(error: any): Observable<never> {
    console.error('Chat Service Error:', error);
    let errorMessage = 'An error occurred';
    
    if (error.status === 404) {
        errorMessage = 'Chat room not found. Please refresh and try again.';
    } else if (error.status === 403) {
        errorMessage = 'Access denied to this chat room.';
    } else if (error.error && error.error.detail) {
        errorMessage = error.error.detail;
    } else if (error.error && error.error.error) {
        errorMessage = error.error.error;
    }
    
    return throwError(() => new Error(errorMessage));
}
}