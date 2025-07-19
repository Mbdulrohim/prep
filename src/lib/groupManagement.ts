// src/lib/groupManagement.ts
import { db } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  arrayRemove,
  increment
} from "firebase/firestore";

export interface StudyGroup {
  id: string;
  name: string;
  planId: string;
  ownerId: string;
  ownerEmail: string;
  members: GroupMember[];
  maxMembers: number;
  currentMembers: number;
  isPaid: boolean;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
  examTypes: string[];
  attemptsPerUser: number;
  retakeAllowed: boolean;
}

export interface GroupMember {
  userId: string;
  email: string;
  displayName: string;
  university?: string;
  joinedAt: Date;
  role: "owner" | "member";
  attemptsUsed: {
    [examType: string]: {
      paper1: number;
      paper2: number;
    }
  };
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: Date;
  expiresAt: Date;
}

export class GroupManager {
  private static instance: GroupManager;

  static getInstance(): GroupManager {
    if (!GroupManager.instance) {
      GroupManager.instance = new GroupManager();
    }
    return GroupManager.instance;
  }

  // Create a new study group
  async createGroup(
    ownerId: string,
    ownerEmail: string,
    groupName: string,
    planId: string
  ): Promise<string> {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const group: StudyGroup = {
      id: groupId,
      name: groupName,
      planId,
      ownerId,
      ownerEmail,
      members: [{
        userId: ownerId,
        email: ownerEmail,
        displayName: ownerEmail.split('@')[0],
        joinedAt: new Date(),
        role: "owner",
        attemptsUsed: {
          RN: { paper1: 0, paper2: 0 },
          RM: { paper1: 0, paper2: 0 },
          RPHN: { paper1: 0, paper2: 0 }
        }
      }],
      maxMembers: planId.includes("_5_") ? 5 : 10,
      currentMembers: 1,
      isPaid: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      examTypes: ["RN", "RM", "RPHN"],
      attemptsPerUser: 6,
      retakeAllowed: true
    };

    await setDoc(doc(db, "studyGroups", groupId), group);
    return groupId;
  }

  // Get group by ID
  async getGroup(groupId: string): Promise<StudyGroup | null> {
    const groupDoc = await getDoc(doc(db, "studyGroups", groupId));
    if (groupDoc.exists()) {
      return { ...groupDoc.data(), id: groupDoc.id } as StudyGroup;
    }
    return null;
  }

  // Get groups where user is a member
  async getUserGroups(userId: string): Promise<StudyGroup[]> {
    const groupsQuery = query(
      collection(db, "studyGroups"),
      where("members", "array-contains-any", [userId])
    );
    
    const snapshot = await getDocs(groupsQuery);
    const groups: StudyGroup[] = [];
    
    snapshot.forEach(doc => {
      const group = { ...doc.data(), id: doc.id } as StudyGroup;
      // Check if user is actually in the members array
      if (group.members.some(member => member.userId === userId)) {
        groups.push(group);
      }
    });
    
    return groups;
  }

  // Invite user to group
  async inviteToGroup(
    groupId: string,
    inviterEmail: string,
    inviteeEmail: string
  ): Promise<string> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error("Group not found");
    
    if (group.currentMembers >= group.maxMembers) {
      throw new Error("Group is full");
    }

    const invitationId = `invite_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const invitation: GroupInvitation = {
      id: invitationId,
      groupId,
      groupName: group.name,
      inviterEmail,
      inviteeEmail,
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    await setDoc(doc(db, "groupInvitations", invitationId), invitation);
    return invitationId;
  }

  // Accept group invitation
  async acceptInvitation(
    invitationId: string,
    userId: string,
    userEmail: string,
    displayName: string
  ): Promise<void> {
    const inviteDoc = await getDoc(doc(db, "groupInvitations", invitationId));
    if (!inviteDoc.exists()) throw new Error("Invitation not found");

    const invitation = inviteDoc.data() as GroupInvitation;
    if (invitation.status !== "pending") throw new Error("Invitation already processed");
    if (invitation.expiresAt < new Date()) throw new Error("Invitation expired");

    const group = await this.getGroup(invitation.groupId);
    if (!group) throw new Error("Group not found");

    if (group.currentMembers >= group.maxMembers) {
      throw new Error("Group is full");
    }

    // Add user to group
    const newMember: GroupMember = {
      userId,
      email: userEmail,
      displayName,
      joinedAt: new Date(),
      role: "member",
      attemptsUsed: {
        RN: { paper1: 0, paper2: 0 },
        RM: { paper1: 0, paper2: 0 },
        RPHN: { paper1: 0, paper2: 0 }
      }
    };

    await updateDoc(doc(db, "studyGroups", invitation.groupId), {
      members: arrayUnion(newMember),
      currentMembers: increment(1),
      updatedAt: new Date()
    });

    // Update invitation status
    await updateDoc(doc(db, "groupInvitations", invitationId), {
      status: "accepted"
    });
  }

  // Remove member from group
  async removeMember(groupId: string, memberUserId: string, requesterId: string): Promise<void> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error("Group not found");

    // Only owner can remove members (or member can remove themselves)
    if (group.ownerId !== requesterId && memberUserId !== requesterId) {
      throw new Error("Unauthorized to remove member");
    }

    if (memberUserId === group.ownerId) {
      throw new Error("Cannot remove group owner");
    }

    const memberToRemove = group.members.find(m => m.userId === memberUserId);
    if (!memberToRemove) throw new Error("Member not found");

    await updateDoc(doc(db, "studyGroups", groupId), {
      members: arrayRemove(memberToRemove),
      currentMembers: increment(-1),
      updatedAt: new Date()
    });
  }

  // Mark group as paid
  async markGroupAsPaid(groupId: string, paymentReference: string): Promise<void> {
    await updateDoc(doc(db, "studyGroups", groupId), {
      isPaid: true,
      paymentReference,
      updatedAt: new Date()
    });

    // Grant access to all group members
    const group = await this.getGroup(groupId);
    if (group) {
      for (const member of group.members) {
        await this.grantGroupAccess(member.userId, groupId, group.planId);
      }
    }
  }

  // Grant access to group member
  private async grantGroupAccess(userId: string, groupId: string, planId: string): Promise<void> {
    const accessData = {
      userId,
      planType: "group_access",
      groupId,
      planId,
      isActive: true,
      purchaseDate: new Date(),
      maxAttempts: 6, // 3 for each paper
      remainingAttempts: 6,
      retakeAllowed: true,
      groupLeaderboard: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, "userAccess", userId), accessData);
  }

  // Update member's exam attempts
  async updateMemberAttempts(
    groupId: string, 
    userId: string, 
    examType: string, 
    paper: "paper1" | "paper2"
  ): Promise<void> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error("Group not found");

    const memberIndex = group.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) throw new Error("Member not found");

    group.members[memberIndex].attemptsUsed[examType][paper] += 1;

    await updateDoc(doc(db, "studyGroups", groupId), {
      members: group.members,
      updatedAt: new Date()
    });
  }
}

export const groupManager = GroupManager.getInstance();
