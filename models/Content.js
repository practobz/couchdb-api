import { v4 as uuidv4 } from 'uuid';

export class Content {
  constructor(data) {
    this._id = data._id || uuidv4();
    this.title = data.title;
    this.description = data.description;
    this.customerId = data.customerId;
    this.creatorId = data.creatorId;
    this.assignedBy = data.assignedBy; // Admin who assigned the content
    this.platform = data.platform; // 'instagram', 'facebook', 'linkedin', 'youtube'
    this.contentType = data.contentType; // 'image', 'video', 'carousel', 'story'
    this.status = data.status || 'assigned'; // 'assigned', 'in_progress', 'under_review', 'revision_requested', 'approved', 'published', 'rejected'
    this.priority = data.priority || 'medium'; // 'low', 'medium', 'high'
    this.dueDate = data.dueDate;
    this.publishDate = data.publishDate || null;
    this.publishTime = data.publishTime || null;
    this.content = data.content || {}; // Actual content data (images, text, etc.)
    this.caption = data.caption || '';
    this.hashtags = data.hashtags || [];
    this.targetAudience = data.targetAudience || '';
    this.estimatedReach = data.estimatedReach || '';
    this.comments = data.comments || [];
    this.revisions = data.revisions || [];
    this.analytics = data.analytics || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Add comment to content
  addComment(userId, message, type = 'general') {
    const comment = {
      id: uuidv4(),
      userId,
      message,
      type, // 'general', 'approval', 'revision_request'
      timestamp: new Date().toISOString()
    };
    this.comments.push(comment);
    this.updatedAt = new Date().toISOString();
    return comment;
  }

  // Add revision
  addRevision(creatorId, changes, files = []) {
    const revision = {
      id: uuidv4(),
      creatorId,
      changes,
      files,
      timestamp: new Date().toISOString()
    };
    this.revisions.push(revision);
    this.status = 'under_review';
    this.updatedAt = new Date().toISOString();
    return revision;
  }

  // Update status
  updateStatus(newStatus, updatedBy, notes = '') {
    this.status = newStatus;
    this.updatedAt = new Date().toISOString();
    
    // Add status change to comments
    this.addComment(updatedBy, `Status changed to: ${newStatus}. ${notes}`, 'status_change');
  }

  // Check if user can view this content
  canUserView(user) {
    if (user.isAdmin()) return true;
    if (user.isCustomer() && user._id === this.customerId) return true;
    if (user.isContentCreator() && user._id === this.creatorId) return true;
    return false;
  }

  // Check if user can edit this content
  canUserEdit(user) {
    if (user.isAdmin()) return true;
    if (user.isContentCreator() && user._id === this.creatorId && 
        ['assigned', 'in_progress', 'revision_requested'].includes(this.status)) return true;
    return false;
  }

  // Check if user can approve/reject this content
  canUserApprove(user) {
    if (user.isAdmin()) return true;
    if (user.isCustomer() && user._id === this.customerId && 
        ['under_review'].includes(this.status)) return true;
    return false;
  }
}

export class ContentCalendar {
  constructor(data) {
    this._id = data._id || uuidv4();
    this.name = data.name;
    this.customerId = data.customerId;
    this.description = data.description || '';
    this.contentItems = data.contentItems || []; // Array of Content IDs
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Add content item to calendar
  addContentItem(contentId) {
    if (!this.contentItems.includes(contentId)) {
      this.contentItems.push(contentId);
      this.updatedAt = new Date().toISOString();
    }
  }

  // Remove content item from calendar
  removeContentItem(contentId) {
    this.contentItems = this.contentItems.filter(id => id !== contentId);
    this.updatedAt = new Date().toISOString();
  }
}