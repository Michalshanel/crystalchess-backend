/**
 * User Service
 * Business logic for user operations
 */

const { prisma } = require("../../config/database");
const FileUtil = require("../../utils/file.util");

class UserService {
  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Promise<object>} User profile
   */
  async getUserProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        fullName: true,
        phone: true,
        profilePicture: true,
        userType: true,
        organizerApproved: true,
        userStatus: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Format profile picture URL
    if (user.profilePicture) {
      user.profilePictureUrl = FileUtil.getFileUrl(user.profilePicture);
    }

    return user;
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated user profile
   */
  async updateProfile(userId, updateData) {
    const { fullName, phone } = updateData;

    // Build update object
    const dataToUpdate = {};
    if (fullName) dataToUpdate.fullName = fullName;
    if (phone) dataToUpdate.phone = phone;

    // Update user
    const user = await prisma.user.update({
      where: { userId },
      data: dataToUpdate,
      select: {
        userId: true,
        email: true,
        fullName: true,
        phone: true,
        profilePicture: true,
        userType: true,
        organizerApproved: true,
        emailVerified: true,
      },
    });

    // Format profile picture URL
    if (user.profilePicture) {
      user.profilePictureUrl = FileUtil.getFileUrl(user.profilePicture);
    }

    return user;
  }

  /**
   * Upload profile picture
   * @param {number} userId - User ID
   * @param {string} filePath - Uploaded file path
   * @returns {Promise<object>} Updated user with new profile picture
   */
  async uploadProfilePicture(userId, filePath) {
    // Get current user to delete old profile picture
    const currentUser = await prisma.user.findUnique({
      where: { userId },
      select: { profilePicture: true },
    });

    // Delete old profile picture if exists
    if (currentUser.profilePicture) {
      FileUtil.deleteFile(currentUser.profilePicture);
    }

    // Update user with new profile picture
    const user = await prisma.user.update({
      where: { userId },
      data: { profilePicture: filePath },
      select: {
        userId: true,
        email: true,
        fullName: true,
        phone: true,
        profilePicture: true,
        userType: true,
      },
    });

    // Format profile picture URL
    user.profilePictureUrl = FileUtil.getFileUrl(user.profilePicture);

    return user;
  }

  /**
   * Get user statistics
   * @param {number} userId - User ID
   * @returns {Promise<object>} User statistics
   */
  async getUserStatistics(userId) {
    // Get user
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get participant count
    const participantCount = await prisma.participant.count({
      where: { userId },
    });

    // Get booking count and total amount spent
    const bookings = await prisma.booking.findMany({
      where: { userId },
      select: {
        bookingId: true,
        amountPaid: true,
        bookingStatus: true,
      },
    });

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(
      (b) => b.bookingStatus === "CONFIRMED"
    ).length;
    const totalAmountSpent = bookings.reduce(
      (sum, b) => sum + Number(b.amountPaid),
      0
    );

    // Get upcoming events count
    const upcomingBookings = await prisma.booking.count({
      where: {
        userId,
        bookingStatus: "CONFIRMED",
        event: {
          eventStatus: "UPCOMING",
        },
      },
    });

    return {
      participantCount,
      totalBookings,
      confirmedBookings,
      upcomingBookings,
      totalAmountSpent: totalAmountSpent.toFixed(2),
    };
  }
}

module.exports = new UserService();
