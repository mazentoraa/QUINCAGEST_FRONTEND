/**
 * User model structure
 * 
 * @typedef {Object} User
 * @property {string} id - Unique identifier for the user
 * @property {string} username - User's username (required)
 * @property {string} email - User's email (required)
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} token - Authentication token
 * @property {Array<string>} roles - User roles/permissions
 * @property {Date} lastLogin - Date of last login
 */

export default class UserModel {
  constructor(data = {}) {
    this.id = data.id || '';
    this.username = data.username || '';
    this.email = data.email || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.token = data.token || '';
    this.roles = data.roles || [];
    this.lastLogin = data.lastLogin ? new Date(data.lastLogin) : null;
  }

  get fullName() {
    if (this.firstName || this.lastName) {
      return `${this.firstName} ${this.lastName}`.trim();
    }
    return this.username;
  }

  hasRole(role) {
    return this.roles.includes(role);
  }

  static createEmpty() {
    return new UserModel();
  }
}
