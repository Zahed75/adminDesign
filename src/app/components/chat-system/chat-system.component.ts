import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
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
  avatar?: string;
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
  // Defensive for PrimeNG custom elements like <p-avatar />
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})



export class ChatSystemComponent implements OnInit, OnDestroy {
  // ===== State =====
  chatRooms: ChatRoom[] = [];
  selectedRoom: ChatRoom | null = null;
  messages: any[] = [];
  users: User[] = [];

  newMessage = '';
  currentUser: User | null = null;

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

  // Only these roles can chat
  private readonly ALLOWED_ROLES = new Set(['CUS', 'DES']);

  constructor(
    public chatService: ChatService,
    private sanitizer: DomSanitizer,
    private messageService: MessageService
  ) { }

  // ===== Lifecycle =====

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    try {
      const raw = userData ? JSON.parse(userData) : null;
      this.currentUser = raw ? this.normalizeUser(raw) : null;
      if (!this.currentUser?.id) throw new Error('Invalid user data');

      // Ensure display name exists
      this.currentUser.name = this.coalesceName(this.currentUser);

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

  // ===== Data loading =====



  // In chat-system.component.ts

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
          console.log('❌ Backend returned empty rooms array');
          this.chatRooms = [];
          this.selectedRoom = null;
          this.messages = [];
          this.showError('No chat rooms found.');
          return;
        }

        // Normalize rooms with better debugging
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

          console.log(`   Room ${normalizedRoom.id}: Customer ${customer.id} (${customer.email}), Designer ${designer.id} (${designer.email})`);
          return normalizedRoom;
        });

        // Filter rooms to only include those where current user is a participant
        const userRooms = this.chatRooms.filter(room => {
          const isParticipant = room.customer.id === this.currentUser?.id ||
            room.designer.id === this.currentUser?.id;
          console.log(`   Room ${room.id} - User ${this.currentUser?.id} participant: ${isParticipant}`);
          return isParticipant;
        });

        console.log('✅ Rooms user has access to:', userRooms.map(r => r.id));

        if (userRooms.length > 0) {
          if (!this.selectedRoom || !this.userRoomsIncludes(this.selectedRoom, userRooms)) {
            this.selectRoom(userRooms[0]);
          }
        } else {
          this.selectedRoom = null;
          this.messages = [];
          console.log('❌ No accessible chat rooms for user');
          this.showError('No accessible chat rooms found. Please start a new chat.');
        }
      },
      error: (error) => {
        console.error('❌ Error loading chat rooms:', error);
        this.showError('Failed to load chat rooms: ' + error.message);
      },
    });
    this.subscriptions.push(sub);
  }

  // Helper method to check if room is in userRooms array
  private userRoomsIncludes(room: ChatRoom, userRooms: ChatRoom[]): boolean {
    return userRooms.some(userRoom => userRoom.id === room.id);
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

  // In chat-system.component.ts
loadUsers(): void {
    const sub = this.chatService.getAllUsers().subscribe({
        next: (users: any[]) => {
            console.log('🔍 DEBUG: Raw users from API:', users);
            
            const normalized = users
                .map((u) => this.normalizeUser(u))
                .filter((u) => u.id !== this.currentUser?.id);

            console.log('🔍 DEBUG: Normalized users:', normalized);
            
            this.users = normalized.filter((u) => this.isChatEligible(u));
            console.log('🔍 DEBUG: Filtered users for chat:', this.users);
        },
        error: () => this.showError('Failed to load users'),
    });
    this.subscriptions.push(sub);
}

  // ===== Room & message actions =====

  selectRoom(room: ChatRoom | null): void {
    if (!room) return;

    console.log('Selecting room:', room.id, 'for user:', this.currentUser?.id);

    // Improved participant detection - compare IDs properly
    const isParticipant = room.customer?.id === this.currentUser?.id ||
      room.designer?.id === this.currentUser?.id;

    console.log('Participant check:', {
      roomCustomerId: room.customer?.id,
      roomDesignerId: room.designer?.id,
      currentUserId: this.currentUser?.id,
      isParticipant: isParticipant
    });

    if (!isParticipant) {
      console.error('User not authorized for this room');
      this.showError('You do not have access to this chat room');
      return;
    }

    this.selectedRoom = room;
    this.messages = [];
    this.loadMessages(room.id);
    this.chatService.disconnect();

    this.chatService
      .connect(room.id.toString())
      .then(() => {
        this.chatService.onMessage((message: any) => {
          if (message.room === this.selectedRoom?.id) {
            this.messages.push(this.normalizeMessage(message));
            this.scrollToBottom();
          }
        });
      })
      .catch((error) => {
        console.error('WebSocket connection failed:', error);
        this.showError('Failed to connect to chat. Please refresh the page.');
      });
  }

  async startNewChat(user: User): Promise<void> {
    if (!this.currentUser) {
      this.showError('Please log in to start a chat');
      return;
    }

    console.log('🔍 DEBUG: Current user data:', this.currentUser);
    console.log('🔍 DEBUG: Selected user data:', user);
    // Make sure you're using UserProfile IDs, not User IDs
    const currentUserProfileId = this.currentUser.id;
    const targetUserProfileId = user.id;

    console.log('🔍 DEBUG: Using IDs - current:', currentUserProfileId, 'target:', targetUserProfileId);
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

      console.log('Starting new chat between:', this.currentUser.id, 'and', user.id);

      // Check for existing room (both directions)
      const existingRoom = this.chatRooms.find(
        (room) =>
          (room.customer.id === this.currentUser?.id && room.designer.id === user.id) ||
          (room.designer.id === this.currentUser?.id && room.customer.id === user.id)
      );

      if (existingRoom) {
        console.log('Existing room found:', existingRoom.id);
        this.selectRoom(existingRoom);
        return;
      }

      // Use the current user's ID as sender, not a hardcoded ID
      const payload = { sender_id: this.currentUser.id, receiver_id: user.id };
      console.log('Creating new room with payload:', payload);

      const response = await this.chatService.createChatRoom(payload).toPromise();

      if (response) {
        console.log('Room created successfully:', response.room_id);

        // Reload chat rooms to get the new room
        this.loadChatRooms();
        this.showSuccess('Chat started successfully');
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
      this.showError(typeof error === 'string' ? error : 'Failed to start a new chat');
    } finally {
      this.isSending = false;
      this.selectedUserForNewChat = null;
    }
  }

  // Send message (Enter => send; Shift+Enter => newline)
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

  // ===== Helpers used by template (must be public) =====

  /** Normalize role to CUS/DES/'' */
  public normRole(role?: string): 'CUS' | 'DES' | '' {
    const r = (role || '').toUpperCase();
    return r === 'CUS' || r === 'DES' ? r : '';
  }

  /** Prefer name → username → email → fallback */
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

  /** Initial for avatar label */
  public getInitial(name?: string | null): string {
    const s = (name || '').trim();
    return s ? s.charAt(0).toUpperCase() : '?';
  }

  /** Normalize a user object to ensure fields exist as strings */
  public normalizeUser(u: any): User {
    return {
      id: Number(u?.id ?? 0),
      name: (u?.name ?? '').toString(),
      username: (u?.username ?? '').toString(),
      email: (u?.email ?? '').toString(),
      user_type: (u?.user_type ?? 'CUS').toString(),
      avatar: (u?.avatar ?? '').toString(),
    };
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

  private normalizeMessage(message: any): any {
    try {
      return {
        id: message?.id || 0,
        room: message?.room || this.selectedRoom?.id || 0,
        sender: message?.sender || '',
        content: message?.content || message?.text || '',
        timestamp: message?.timestamp || new Date().toISOString(),
        is_read: message?.is_read || false,
        file_url: message?.file_url || message?.file,
        audio_url: message?.audio_url || message?.audio,
      };
    } catch (error) {
      console.error('Error normalizing message:', error);
      return {
        id: 0,
        room: this.selectedRoom?.id || 0,
        sender: '',
        content: 'Invalid message',
        timestamp: new Date().toISOString(),
        is_read: false,
      };
    }
  }

  public getParticipantName(room: ChatRoom | null): string {
    if (!room || !this.currentUser) return 'Unknown';
    try {
      const meId = this.currentUser.id;
      const other = room.customer?.id === meId ? room.designer : room.customer;
      return this.coalesceName(other);
    } catch {
      return 'Unknown';
    }
  }

  public getCurrentUserRole(): string {
    return this.currentUser?.user_type?.toLowerCase() || '';
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

  // Role pair check
  private isChatEligible(user: User): boolean {
    if (!this.currentUser) return false;
    const me = this.normRole(this.currentUser.user_type);
    const them = this.normRole(user.user_type);
    if (!this.ALLOWED_ROLES.has(me) || !this.ALLOWED_ROLES.has(them)) return false;
    return me !== them;
  }
}
