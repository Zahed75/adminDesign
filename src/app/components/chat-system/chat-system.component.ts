// chat-system.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chat.service';
import { Subscription } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface User {
  id: number;
  name?: string;
  username?: string;
  user_type: string;
  email?: string;
}

interface ChatRoom {
  id: number;
  customer: User;
  designer: User;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

@Component({
  selector: 'app-chat-system',
  standalone: true,
  templateUrl: './chat-system.component.html',
  styleUrls: ['./chat-system.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    AvatarModule,
    BadgeModule,
    ProgressSpinnerModule,
    TooltipModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class ChatSystemComponent implements OnInit, OnDestroy {
  chatRooms: ChatRoom[] = [];
  selectedRoom: ChatRoom | null = null;
  messages: any[] = [];
  users: User[] = [];

  newMessage = '';
  currentUser: any = null;

  selectedFile: File | null = null;
  audioBlob: Blob | null = null;

  isRecording = false;
  isSending = false;
  mediaRecorder: MediaRecorder | null = null;

  selectedUserForNewChat: number | null = null;
  messageInputFocused = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  private subscriptions: Subscription[] = [];

  constructor(
    public chatService: ChatService,
    private sanitizer: DomSanitizer,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    try {
      this.currentUser = userData ? JSON.parse(userData) : null;
      if (!this.currentUser?.id) throw new Error('Invalid user data');

      // Ensure display name exists
      this.currentUser.name = this.coalesceName(this.currentUser);

      console.log('🔍 DEBUG: Current user loaded:', this.currentUser);

      this.loadChatRooms();
      this.loadUsers();
    } catch (err) {
      console.error('Failed to initialize user:', err);
      this.showError('Please log in to access chat');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.chatService.disconnect();
    if (this.mediaRecorder) this.stopRecording();
  }

  loadChatRooms(): void {
    if (!this.currentUser) {
      this.showError('User not logged in');
      return;
    }
    
    console.log('🔄 Loading chat rooms for user:', this.currentUser.id, this.currentUser.email);
    
    const sub = this.chatService.getChatRooms().subscribe({
      next: (rooms: any[]) => {
        console.log('📦 Raw chat rooms received:', rooms);
        
        if (rooms.length === 0) {
          console.log('No chat rooms found');
          this.chatRooms = [];
          this.selectedRoom = null;
          this.messages = [];
          return;
        }
        
        // Normalize rooms
        this.chatRooms = rooms.map((room: any) => {
          const customer = this.normalizeUser(room.customer);
          const designer = this.normalizeUser(room.designer);
          
          const normalizedRoom = {
            ...room,
            customer,
            designer,
            unread_count: room.unread_count || 0,
            created_at: room.created_at || new Date().toISOString(),
            updated_at: room.updated_at || new Date().toISOString(),
          } as ChatRoom;
          
          console.log(`   Room ${normalizedRoom.id}: Customer ${customer.id}, Designer ${designer.id}`);
          return normalizedRoom;
        });

        console.log('🎯 All normalized chat rooms:', this.chatRooms);
        
        // Filter rooms by email (to handle ID mismatch)
        const userRooms = this.chatRooms.filter(room => {
          const isParticipant = room.customer.email === this.currentUser?.email || 
                              room.designer.email === this.currentUser?.email;
          console.log(`   Room ${room.id} - User ${this.currentUser?.email} participant: ${isParticipant}`);
          return isParticipant;
        });
        
        console.log('✅ Rooms user has access to:', userRooms);
        
        if (userRooms.length > 0) {
          if (!this.selectedRoom || !this.userRoomsIncludes(this.selectedRoom, userRooms)) {
            this.selectRoom(userRooms[0]);
          }
        } else {
          this.selectedRoom = null;
          this.messages = [];
          console.log('No accessible chat rooms for user');
        }
      },
      error: (error) => {
        console.error('Error loading chat rooms:', error);
        this.showError('Failed to load chat rooms: ' + error.message);
      },
    });
    this.subscriptions.push(sub);
  }

  loadMessages(roomId: number): void {
    const sub = this.chatService.getMessages(roomId).subscribe({
      next: (messages: any[]) => {
        this.messages = messages.map((m) => this.normalizeMessage(m));
        this.scrollToBottom();
      },
      error: () => this.showError('Failed to load messages'),
    });
    this.subscriptions.push(sub);
  }

  loadUsers(): void {
    const sub = this.chatService.getAllUsers().subscribe({
      next: (users: any[]) => {
        console.log('👥 DEBUG: Raw users from API:', users);
        
        const normalized = users
          .map((u) => this.normalizeUser(u))
          .filter((u) => u.email !== this.currentUser?.email);

        this.users = normalized.filter((u) => this.isChatEligible(u));
        console.log('👥 DEBUG: Filtered users for chat:', this.users);
      },
      error: () => this.showError('Failed to load users'),
    });
    this.subscriptions.push(sub);
  }

  // selectRoom(room: ChatRoom | null): void {
  //   if (!room) return;

  //   console.log('Selecting room:', room.id, 'for user:', this.currentUser?.email);
    
  //   // Check by email (to handle ID mismatch)
  //   const isParticipant = room.customer.email === this.currentUser?.email || 
  //                        room.designer.email === this.currentUser?.email;
    
  //   console.log('Participant check by email:', {
  //       roomCustomerEmail: room.customer.email,
  //       roomDesignerEmail: room.designer.email,
  //       currentUserEmail: this.currentUser?.email,
  //       isParticipant: isParticipant
  //   });
    
  //   if (!isParticipant) {
  //       console.error('User not authorized for this room');
  //       this.showError('You do not have access to this chat room');
  //       return;
  //   }

  //   this.selectedRoom = room;
  //   this.messages = [];
  //   this.loadMessages(room.id);
  //   this.chatService.disconnect();

  //   this.chatService
  //       .connect(room.id.toString())
  //       .then(() => {
  //           this.chatService.onMessage((message: any) => {
  //               if (message.room === this.selectedRoom?.id) {
  //                   this.messages.push(this.normalizeMessage(message));
  //                   this.scrollToBottom();
  //               }
  //           });
  //       })
  //       .catch((error) => {
  //           console.error('WebSocket connection failed:', error);
  //           this.showError('Failed to connect to chat. Please refresh the page.');
  //       });
  // }





  // In chat-system.component.ts - update the selectRoom method and add message handling




  selectRoom(room: ChatRoom | null): void {
    if (!room) return;

    console.log('Selecting room:', room.id, 'for user:', this.currentUser?.email);
    
    // Check by email (to handle ID mismatch)
    const isParticipant = room.customer.email === this.currentUser?.email || 
                         room.designer.email === this.currentUser?.email;
    
    console.log('Participant check by email:', {
        roomCustomerEmail: room.customer.email,
        roomDesignerEmail: room.designer.email,
        currentUserEmail: this.currentUser?.email,
        isParticipant: isParticipant
    });
    
    if (!isParticipant) {
        console.error('User not authorized for this room');
        this.showError('You do not have access to this chat room');
        return;
    }

    // Clear previous room data
    this.selectedRoom = room;
    this.messages = [];
    this.chatService.disconnect();

    // Load existing messages first
    this.loadMessages(room.id);

    // Then connect to WebSocket for real-time updates
    this.chatService
        .connect(room.id.toString())
        .then(() => {
            console.log('✅ WebSocket connected, setting up message listener');
            
            // Set up message listener for real-time updates
            this.chatService.onMessage((message: any) => {
                console.log('📨 WebSocket message received:', message);
                
                // Only add message if it belongs to the current room
                if (message.room === this.selectedRoom?.id) {
                    // Check if message already exists to avoid duplicates
                    const messageExists = this.messages.some(m => m.id === message.id);
                    if (!messageExists) {
                        console.log('✅ Adding new message to chat:', message);
                        this.messages.push(this.normalizeMessage(message));
                        this.scrollToBottom();
                        
                        // Play notification sound for new messages from others
                        if (message.sender !== this.currentUser?.id) {
                            this.playNotificationSound();
                        }
                    } else {
                        console.log('⚠️ Message already exists, skipping:', message.id);
                    }
                } else {
                    console.log('❌ Message for different room, ignoring. Current room:', this.selectedRoom?.id, 'Message room:', message.room);
                }
            });
        })
        .catch((error) => {
            console.error('WebSocket connection failed:', error);
            this.showError('Failed to connect to chat. Please refresh the page.');
        });
}

// Add notification sound method
private playNotificationSound(): void {
    try {
        const audio = new Audio();
        audio.src = 'assets/sounds/notification.mp3'; // Add a notification sound file
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
        console.log('Notification sound error:', error);
    }
}

// Update the normalizeMessage method to ensure proper formatting
private normalizeMessage(message: any): any {
    try {
        const normalized = {
            id: message?.id || 0,
            room: message?.room || this.selectedRoom?.id || 0,
            sender: message?.sender || message.sender_name || '',
            sender_name: message?.sender_name || message.sender || '',
            content: message?.content || message?.text || '',
            timestamp: message?.timestamp || new Date().toISOString(),
            is_read: message?.is_read || false,
            file_url: message?.file_url || message?.file,
            audio_url: message?.audio_url || message?.audio,
        };
        
        console.log('📝 Normalized message:', normalized);
        return normalized;
    } catch (error) {
        console.error('Error normalizing message:', error);
        return {
            id: 0,
            room: this.selectedRoom?.id || 0,
            sender: '',
            sender_name: '',
            content: 'Invalid message',
            timestamp: new Date().toISOString(),
            is_read: false,
        };
    }
}





  async startNewChat(user: User): Promise<void> {
    if (!this.currentUser) {
        this.showError('Please log in to start a chat');
        return;
    }
    if (!user?.id) {
        this.showError('Invalid user selected');
        return;
    }
    if (!this.isChatEligible(user)) {
        this.showError('Only customers and designers can start chats, and only with the opposite role.');
        return;
    }

    try {
        this.selectedUserForNewChat = user.id;
        this.isSending = true;

        console.log('Starting new chat between:', this.currentUser.email, 'and', user.email);

        // Check for existing room by email
        const existingRoom = this.chatRooms.find(
            (room) =>
                (room.customer.email === this.currentUser?.email && room.designer.email === user.email) ||
                (room.designer.email === this.currentUser?.email && room.customer.email === user.email)
        );
        
        if (existingRoom) {
            console.log('Existing room found:', existingRoom.id);
            this.selectRoom(existingRoom);
            return;
        }

        // Only send receiver_id - backend will use current user as sender
        const payload = { receiver_id: user.id };
        console.log('Creating new room with payload:', payload);
        
        const response = await this.chatService.createChatRoom(payload).toPromise();

        if (response) {
            console.log('Room created successfully:', response.room_id);
            this.showSuccess('Chat started successfully');
            
            // Reload chat rooms to get the new room
            this.loadChatRooms();
        }
    } catch (error) {
        console.error('Error creating chat room:', error);
        this.showError(typeof error === 'string' ? error : 'Failed to start a new chat');
    } finally {
        this.isSending = false;
        this.selectedUserForNewChat = null;
    }
  }

  // Helper methods (keep your existing implementations)
  private userRoomsIncludes(room: ChatRoom, userRooms: ChatRoom[]): boolean {
    return userRooms.some(userRoom => userRoom.id === room.id);
  }

  public coalesceName(u?: Partial<User> | null): string {
    if (!u) return 'Unknown';
    const n = (u.name || '').trim();
    const un = (u.username || '').trim();
    const em = (u.email || '').trim();
    if (n) return n;
    if (un) return un;
    if (em) return em;
    if (typeof u.id === 'number') return `User #${u.id}`;
    return 'Unknown';
  }

  public getInitial(name?: string | null): string {
    const s = (name || '').trim();
    return s ? s.charAt(0).toUpperCase() : '?';
  }

  public normalizeUser(u: any): User {
    return {
      id: Number(u?.id ?? 0),
      name: (u?.name ?? '').toString(),
      username: (u?.username ?? '').toString(),
      email: (u?.email ?? '').toString(),
      user_type: (u?.user_type ?? 'CUS').toString(),
    };
  }


  public getParticipantName(room: ChatRoom | null): string {
    if (!room || !this.currentUser) return 'Unknown';
    try {
      const myEmail = this.currentUser.email;
      const other = room.customer.email === myEmail ? room.designer : room.customer;
      return this.coalesceName(other);
    } catch {
      return 'Unknown';
    }
  }

  public getCurrentUserRole(): string {
    return this.currentUser?.user_type?.toLowerCase() || '';
  }

  // Rest of your existing methods (sendMessage, file handling, etc.)
  sendMessage(event?: KeyboardEvent): void {
    if (event && event.key === 'Enter' && event.shiftKey) return;
    if (event && event.key === 'Enter') {
      event.preventDefault();
      this.processMessageSending();
    }
  }

  sendButtonClick(): void {
    this.processMessageSending();
  }

  private processMessageSending(): void {
    if (
      (!this.newMessage.trim() && !this.selectedFile && !this.audioBlob) ||
      !this.selectedRoom ||
      this.isSending ||
      !this.chatService.isConnected
    ) {
      return;
    }

    this.isSending = true;
    let content = this.newMessage.trim();

    const send = (fileUrl?: string, audioUrl?: string) => {
      const sub = this.chatService
        .sendMessage(this.selectedRoom!.id, content, fileUrl, audioUrl)
        .subscribe({
          next: (message: any) => {
            this.messages.push(this.normalizeMessage(message));
            this.newMessage = '';
            this.selectedFile = null;
            this.audioBlob = null;
            this.isSending = false;
            if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
            this.scrollToBottom();
          },
          error: (error) => {
            console.error('Error sending message:', error);
            this.isSending = false;
            this.showError('Failed to send message');
          },
        });
      this.subscriptions.push(sub);
    };

    if (this.selectedFile) {
      content = `[File] ${this.selectedFile.name}`;
      this.uploadFile(this.selectedFile).then(send).catch(() => (this.isSending = false));
    } else if (this.audioBlob) {
      content = '[Voice] Audio message';
      this.uploadAudio(this.audioBlob)
        .then((audioUrl) => send(undefined, audioUrl))
        .catch(() => (this.isSending = false));
    } else {
      send();
    }
  }

  private async uploadFile(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  private async uploadAudio(audio: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(audio);
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages-container') as HTMLElement | null;
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.newMessage = `[File] ${this.selectedFile.name}`;
    }
  }

  public toggleVoiceRecording(): void {
    this.isRecording = !this.isRecording;
    if (this.isRecording) this.startRecording();
    else this.stopRecording();
  }

  private startRecording(): void {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          stream.getTracks().forEach((t) => t.stop());
          this.newMessage = '[Voice] Audio message';
        };

        this.mediaRecorder.start();
      })
      .catch((error) => {
        console.error('Microphone permission denied:', error);
        this.isRecording = false;
        this.showError('Microphone access denied. Please allow microphone permissions.');
      });
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  public downloadFile(message: any): void {
    if (message.file_url) {
      const link = document.createElement('a');
      link.href = message.file_url;
      link.download = message.content.split('[File] ')[1] || 'file';
      link.click();
    }
  }

  public getAudioSrc(message: any): SafeUrl {
    return message.audio_url ? this.sanitizer.bypassSecurityTrustUrl(message.audio_url) : '';
  }

  public getDisplayContent(message: any): string {
    if (message.content.includes('[File]') || message.content.includes('[Voice]')) return '';
    return message.content;
  }

  public formatTime(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  public formatDate(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return '';
    }
  }

  public onMessageInputFocus(focused: boolean): void {
    this.messageInputFocused = focused;
    if (focused && this.messageInput?.nativeElement) {
      setTimeout(() => this.messageInput.nativeElement.focus(), 0);
    }
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000,
    });
  }

  private isChatEligible(user: User): boolean {
    if (!this.currentUser) return false;
    const me = this.normRole(this.currentUser.user_type);
    const them = this.normRole(user.user_type);
    if (!this.ALLOWED_ROLES.has(me) || !this.ALLOWED_ROLES.has(them)) return false;
    return me !== them;
  }

  private normRole(role?: string): 'CUS' | 'DES' | '' {
    const r = (role || '').toUpperCase();
    return r === 'CUS' || r === 'DES' ? r : '';
  }

  private readonly ALLOWED_ROLES = new Set(['CUS', 'DES']);
}