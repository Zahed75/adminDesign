import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InvitationService } from '../../../services/invitation/invitation.service';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  user_type: string;
  image?: string;
}

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    TableModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
  ],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css'],
  providers: [ConfirmationService, MessageService, InvitationService],
})
export class TeamComponent implements OnInit {
  inviteEmail: string = '';
  name: string = 'Team Member';
  selectedRole: string = 'TM';
  teamMembers: TeamMember[] = [];
  editingMember: TeamMember | null = null;
  isLoading: boolean = false;
  showDialog: boolean = false;

  roles = [
    { name: 'Admin', value: 'AD' },
    { name: 'Team Member', value: 'TM' },
    { name: 'Designer', value: 'DES' },
    { name: 'Customer', value: 'CUS' },
  ];

  roleDisplayMap: { [key: string]: string } = {
    'AD': 'Admin',
    'TM': 'Team Member',
    'DES': 'Designer',
    'CUS': 'Customer'
  };

  constructor(
      private confirmationService: ConfirmationService,
      private messageService: MessageService,
      private invitationService: InvitationService
  ) {}

  ngOnInit(): void {
    this.loadTeamMembers();
  }

  loadTeamMembers(): void {
    this.isLoading = true;
    this.invitationService.getTeamMembers().subscribe({
      next: (members: any[]) => {
        this.teamMembers = members.map((member: any) => ({
          ...member,
          image: 'assets/default-avatar.png'
        }));
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading team members:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load team members'
        });
        this.isLoading = false;
      }
    });
  }

  onInvite(): void {
    if (!this.inviteEmail) return;

    this.isLoading = true;
    this.invitationService.inviteTeamMember(
        this.inviteEmail,
        this.name,
        this.selectedRole
    ).subscribe({
      next: (response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Team member invited successfully!'
        });
        this.loadTeamMembers();
        this.resetForm();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to invite team member'
        });
        this.isLoading = false;
      }
    });
  }

  onEdit(member: TeamMember): void {
    this.editingMember = { ...member };
    this.showDialog = true;
  }

  updateMember(): void {
    if (!this.editingMember) return;

    this.isLoading = true;
    this.invitationService.updateTeamMember(
        this.editingMember.id,
        this.editingMember.email,
        this.editingMember.name,
        this.editingMember.user_type
    ).subscribe({
      next: (response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Team member updated successfully!'
        });
        this.loadTeamMembers();
        this.showDialog = false;
        this.editingMember = null;
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to update team member'
        });
        this.isLoading = false;
      }
    });
  }

  onDelete(memberId: number): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this team member?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.isLoading = true;
        this.invitationService.deleteTeamMember(memberId).subscribe({
          next: (response: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Team member deleted successfully!'
            });
            this.loadTeamMembers();
          },
          error: (err: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'Failed to delete team member'
            });
            this.isLoading = false;
          }
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cancelled',
          detail: 'Deletion cancelled.'
        });
      }
    });
  }

  private resetForm(): void {
    this.inviteEmail = '';
    this.name = 'Team Member';
    this.selectedRole = 'TM';
    this.isLoading = false;
  }



  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (role) {
      case 'AD': return 'danger';
      case 'TM': return 'info';
      case 'DES': return 'warn';  // Changed from 'warning' to 'warn'
      case 'CUS': return 'success';
      default: return 'info';
    }
  }

}
