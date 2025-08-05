import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from '../../../services/chat/chat.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextarea } from 'primeng/inputtextarea';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import {ToastModule} from "primeng/toast";

interface User {
  id: number;
  name: string;
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
  templateUrl: './chat-system.component.html',
  styleUrls: ['./chat-system.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextarea,
    AvatarModule,
    BadgeModule,
    ProgressSpinnerModule,
    TooltipModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class ChatSystemComponent implements OnInit, OnDestroy {
  chatRooms: ChatRoom[] = [];
  selectedRoom: ChatRoom | null = null;
  messages: any[] = [];
  users: User[] = [];
  newMessage: string = '';
  currentUser: User | null = null;
  selectedFile: File | null = null;
  audioBlob: Blob | null = null;
  isRecording: boolean = false;
  isSending: boolean = false;
  mediaRecorder: MediaRecorder | null = null;
  selectedUserForNewChat: number | null = null;
  messageInputFocused: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

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
      if (!this.currentUser?.id) {
        throw new Error('Invalid user data');
      }
      this.loadChatRooms();
      this.loadUsers();
    } catch (error) {
      console.error('Failed to initialize user:', error);
      this.showError('Please log in to access chat');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.chatService.disconnect();
    if (this.mediaRecorder) {
      this.stopRecording();
    }
  }

  loadChatRooms(): void {
    if (!this.currentUser) {
      this.showError('User not logged in');
      return;
    }

    const sub = this.chatService.getChatRooms().subscribe({
      next: (rooms: ChatRoom[]) => {
        this.chatRooms = rooms.map((room) => ({
          ...room,
          customer: {
            id: room.customer?.id || 0,
            name: room.customer?.name || 'Unknown',
            user_type: room.customer?.user_type || 'CUS'
          },
          designer: {
            id: room.designer?.id || 0,
            name: room.designer?.name || 'Unknown',
            user_type: room.designer?.user_type || 'DES'
          },
          unread_count: room.unread_count || 0,
        }));
        if (rooms.length > 0 && !this.selectedRoom) {
          this.selectRoom(rooms[0]);
        }
      },
      error: (error) => this.showError('Failed to load chat rooms')
    });
    this.subscriptions.push(sub);
  }

  loadMessages(roomId: number): void {
    const sub = this.chatService.getMessages(roomId).subscribe({
      next: (messages: any[]) => {
        this.messages = messages.map((msg) => this.normalizeMessage(msg));
        this.scrollToBottom();
      },
      error: (error) => this.showError('Failed to load messages')
    });
    this.subscriptions.push(sub);
  }

  loadUsers(): void {
    const sub = this.chatService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.users = users
            .filter((user) => user.id !== this.currentUser?.id)
            .map((user) => ({
              ...user,
              name: user.name || 'Unknown',
              user_type: user.user_type || 'CUS'
            }));
      },
      error: (error) => this.showError('Failed to load users')
    });
    this.subscriptions.push(sub);
  }

  selectRoom(room: ChatRoom | null): void {
    if (!room) return;

    this.selectedRoom = room;
    this.messages = [];
    this.loadMessages(room.id);
    this.chatService.disconnect();

    this.chatService.connect(room.id.toString()).then(() => {
      this.chatService.onMessage((message: any) => {
        if (message.room === this.selectedRoom?.id) {
          this.messages.push(this.normalizeMessage(message));
          this.scrollToBottom();
        }
      });
    }).catch(error => {
      this.showError('Failed to connect to chat. Please refresh the page.');
    });
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

    try {
      this.selectedUserForNewChat = user.id;
      this.isSending = true;

      const existingRoom = this.chatRooms.find(room =>
          (room.customer.id === this.currentUser?.id && room.designer.id === user.id) ||
          (room.designer.id === this.currentUser?.id && room.customer.id === user.id)
      );

      if (existingRoom) {
        this.selectRoom(existingRoom);
        return;
      }

      const payload = {
        sender_id: this.currentUser.id,
        receiver_id: user.id
      };

      const response = await this.chatService.createChatRoom(payload).toPromise();

      if (response) {
        const newRoom: ChatRoom = {
          id: response.room_id,
          customer: this.currentUser.user_type === 'CUS' ?
              {
                id: this.currentUser.id,
                name: this.currentUser.name || 'Unknown',
                user_type: this.currentUser.user_type
              } :
              {
                id: user.id,
                name: user.name || 'Unknown',
                user_type: user.user_type || 'DES'
              },
          designer: this.currentUser.user_type === 'DES' ?
              {
                id: this.currentUser.id,
                name: this.currentUser.name || 'Unknown',
                user_type: this.currentUser.user_type
              } :
              {
                id: user.id,
                name: user.name || 'Unknown',
                user_type: user.user_type || 'CUS'
              },
          created_at: response.data?.created_at || new Date().toISOString(),
          updated_at: response.data?.updated_at || new Date().toISOString(),
          unread_count: 0,
        };

        this.chatRooms.push(newRoom);
        this.selectRoom(newRoom);
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

  sendMessage(event?: KeyboardEvent): void {
    if (event && event.key === 'Enter' && event.shiftKey) {
      return; // Allow new line with Shift+Enter
    }

    if (event && event.key === 'Enter') {
      event.preventDefault();
      this.processMessageSending();
    }
  }

  sendButtonClick(): void {
    this.processMessageSending();
  }

  private processMessageSending(): void {
    if ((!this.newMessage.trim() && !this.selectedFile && !this.audioBlob) ||
        !this.selectedRoom ||
        this.isSending ||
        !this.chatService.isConnected) {
      return;
    }

    this.isSending = true;
    let content = this.newMessage.trim();

    const send = (fileUrl?: string, audioUrl?: string) => {
      const sub = this.chatService.sendMessage(
          this.selectedRoom!.id,
          content,
          fileUrl,
          audioUrl
      ).subscribe({
        next: (message: any) => {
          this.messages.push(this.normalizeMessage(message));
          this.newMessage = '';
          this.selectedFile = null;
          this.audioBlob = null;
          this.isSending = false;
          if (this.fileInput?.nativeElement) {
            this.fileInput.nativeElement.value = '';
          }
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
      this.uploadFile(this.selectedFile).then(send).catch(() => {
        this.isSending = false;
      });
    } else if (this.audioBlob) {
      content = '[Voice] Audio message';
      this.uploadAudio(this.audioBlob).then((audioUrl) => send(undefined, audioUrl)).catch(() => {
        this.isSending = false;
      });
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
      const container = document.querySelector('.chat-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
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
        is_read: false
      };
    }
  }

  getParticipantName(room: ChatRoom | null): string {
    if (!room || !this.currentUser) return 'Unknown';

    try {
      const participant = room.customer.id === this.currentUser.id ?
          room.designer :
          room.customer;
      return participant?.email || 'Unknown';
    } catch (error) {
      console.error('Error getting participant name:', error);
      return 'Unknown';
    }
  }

  getCurrentUserRole(): string {
    return this.currentUser?.user_type?.toLowerCase() || '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.newMessage = `[File] ${this.selectedFile.name}`;
    }
  }

  toggleVoiceRecording(): void {
    this.isRecording = !this.isRecording;
    if (this.isRecording) {
      this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  private startRecording(): void {
    navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          this.mediaRecorder = new MediaRecorder(stream);
          const audioChunks: Blob[] = [];

          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };

          this.mediaRecorder.onstop = () => {
            this.audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach((track) => track.stop());
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

  downloadFile(message: any): void {
    if (message.file_url) {
      const link = document.createElement('a');
      link.href = message.file_url;
      link.download = message.content.split('[File] ')[1] || 'file';
      link.click();
    }
  }

  getAudioSrc(message: any): SafeUrl {
    return message.audio_url ? this.sanitizer.bypassSecurityTrustUrl(message.audio_url) : '';
  }

  getDisplayContent(message: any): string {
    if (message.content.includes('[File]') || message.content.includes('[Voice]')) {
      return '';
    }
    return message.content;
  }

  formatTime(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  formatDate(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return '';
    }
  }

  getInitial(name: string | undefined | null): string {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : '?';
  }

  onMessageInputFocus(focused: boolean): void {
    this.messageInputFocused = focused;
    if (focused && this.messageInput?.nativeElement) {
      setTimeout(() => {
        this.messageInput.nativeElement.focus();
      }, 0);
    }
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000
    });
  }
}