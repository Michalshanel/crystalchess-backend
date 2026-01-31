-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `profile_picture` VARCHAR(255) NULL,
    `user_type` ENUM('player', 'organizer', 'admin') NULL DEFAULT 'player',
    `organizer_approved` BOOLEAN NOT NULL DEFAULT false,
    `user_status` ENUM('active', 'inactive', 'suspended') NULL DEFAULT 'active',
    `email_verified` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_login` TIMESTAMP(0) NULL,

    UNIQUE INDEX `email`(`email`),
    INDEX `idx_user_type`(`user_type`),
    INDEX `idx_status`(`user_status`),
    INDEX `idx_email`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participants` (
    `participant_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `gender` ENUM('male', 'female', 'others') NOT NULL,
    `contact_number` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `passport_photo` VARCHAR(255) NULL,
    `fide_id` VARCHAR(50) NULL,
    `birth_certificate` VARCHAR(255) NULL,
    `aadhar_card` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user`(`user_id`),
    INDEX `idx_full_name`(`full_name`),
    INDEX `idx_participant_created`(`created_at`),
    PRIMARY KEY (`participant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `event_id` INTEGER NOT NULL AUTO_INCREMENT,
    `organizer_id` INTEGER NOT NULL,
    `event_name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `event_dates` LONGTEXT NOT NULL,
    `event_start_time` TIME(0) NOT NULL,
    `event_end_time` TIME(0) NULL,
    `location` VARCHAR(255) NOT NULL,
    `venue_address` TEXT NULL,
    `google_map_link` TEXT NULL,
    `entry_fee` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `prize` TEXT NULL,
    `max_capacity` INTEGER NULL,
    `current_bookings` INTEGER NULL DEFAULT 0,
    `rules_text` TEXT NULL,
    `rules_pdf` VARCHAR(255) NULL,
    `event_type` ENUM('FIDE_RATED', 'STATE_LEVEL', 'DISTRICT_LEVEL', 'INTER_SCHOOL_LEVEL', 'COLLEGE_LEVEL') NULL,
    `event_status` ENUM('upcoming', 'in_progress', 'completed', 'cancelled') NULL DEFAULT 'upcoming',
    `event_image` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_status`(`event_status`),
    INDEX `idx_organizer`(`organizer_id`),
    INDEX `idx_event_type`(`event_type`),
    INDEX `idx_event_dates`(`event_dates`(768)),
    INDEX `idx_event_start_time`(`event_start_time`),
    INDEX `idx_location`(`location`),
    PRIMARY KEY (`event_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_categories` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(50) NOT NULL,
    `category_code` VARCHAR(10) NOT NULL,
    `age_limit` INTEGER NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `category_code`(`category_code`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_category_mapping` (
    `mapping_id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_event_id`(`event_id`),
    INDEX `idx_category_id`(`category_id`),
    UNIQUE INDEX `unique_event_category`(`event_id`, `category_id`),
    PRIMARY KEY (`mapping_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `booking_id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `booking_reference` VARCHAR(20) NOT NULL,
    `booking_status` ENUM('pending', 'confirmed', 'cancelled', 'completed') NULL DEFAULT 'pending',
    `payment_status` ENUM('pending', 'paid', 'refunded', 'failed') NULL DEFAULT 'pending',
    `amount_paid` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `booking_date` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `booking_reference`(`booking_reference`),
    INDEX `idx_booking_ref`(`booking_reference`),
    INDEX `idx_event`(`event_id`),
    INDEX `idx_user`(`user_id`),
    INDEX `idx_booking_status`(`booking_status`),
    INDEX `idx_composite_search`(`event_id`, `booking_status`, `payment_status`),
    INDEX `idx_payment_status`(`payment_status`),
    PRIMARY KEY (`booking_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `participant_id` INTEGER NOT NULL,
    `event_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_booking`(`booking_id`),
    INDEX `idx_participant`(`participant_id`),
    INDEX `idx_event`(`event_id`),
    UNIQUE INDEX `uq_booking_participant`(`booking_id`, `participant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `payment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `transaction_id` VARCHAR(100) NULL,
    `payment_gateway` ENUM('stripe', 'paypal', 'razorpay') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `admin_commission` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `currency` VARCHAR(3) NULL DEFAULT 'INR',
    `payment_status` ENUM('pending', 'completed', 'failed', 'refunded') NULL DEFAULT 'pending',
    `gateway_response` TEXT NULL,
    `payment_date` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `refund_date` TIMESTAMP(0) NULL,
    `refund_amount` DECIMAL(10, 2) NULL,

    UNIQUE INDEX `transaction_id`(`transaction_id`),
    INDEX `idx_transaction`(`transaction_id`),
    INDEX `idx_booking`(`booking_id`),
    INDEX `idx_status`(`payment_status`),
    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollments` (
    `enrollment_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `class_name` VARCHAR(100) NOT NULL,
    `student_name` VARCHAR(100) NOT NULL,
    `student_email` VARCHAR(100) NOT NULL,
    `student_phone` VARCHAR(20) NOT NULL,
    `student_age` INTEGER NOT NULL,
    `parent_name` VARCHAR(100) NULL,
    `parent_phone` VARCHAR(20) NULL,
    `parent_email` VARCHAR(100) NULL,
    `preferred_schedule` ENUM('morning', 'afternoon', 'evening', 'weekend') NOT NULL,
    `preferred_days` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `pincode` VARCHAR(10) NULL,
    `previous_experience` ENUM('none', 'beginner', 'intermediate', 'advanced') NULL DEFAULT 'none',
    `message` TEXT NULL,
    `enrollment_status` ENUM('pending', 'approved', 'rejected', 'cancelled') NULL DEFAULT 'pending',
    `enrollment_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `approved_date` DATETIME(0) NULL,
    `approved_by` INTEGER NULL,
    `rejection_reason` TEXT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `class_name`(`class_name`),
    INDEX `enrollment_status`(`enrollment_status`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`enrollment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_edit_requests` (
    `request_id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `organizer_id` INTEGER NOT NULL,
    `message` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_eer_event`(`event_id`),
    INDEX `fk_eer_organizer`(`organizer_id`),
    PRIMARY KEY (`request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flash_news` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` TEXT NOT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `event_id` INTEGER NULL,
    `recipient` ENUM('user', 'participant', 'all') NOT NULL DEFAULT 'all',
    `notification_type` ENUM('email', 'sms', 'both') NULL DEFAULT 'email',
    `subject` VARCHAR(255) NULL,
    `message` TEXT NOT NULL,
    `notification_status` ENUM('pending', 'sent', 'failed') NULL DEFAULT 'pending',
    `sent_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user`(`user_id`),
    INDEX `event_id`(`event_id`),
    INDEX `idx_status`(`notification_status`),
    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_templates` (
    `template_id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_name` VARCHAR(100) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `variables` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `template_name`(`template_name`),
    PRIMARY KEY (`template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `session_id` VARCHAR(128) NOT NULL,
    `user_id` INTEGER NULL,
    `session_data` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `last_activity` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user`(`user_id`),
    INDEX `idx_last_activity`(`last_activity`),
    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_resets` (
    `reset_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `expires_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `token`(`token`),
    INDEX `idx_token`(`token`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`reset_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` ENUM('user', 'event', 'booking', 'payment', 'settings') NOT NULL,
    `entity_id` INTEGER NULL,
    `old_values` TEXT NULL,
    `new_values` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_admin`(`admin_id`),
    INDEX `idx_created`(`created_at`),
    INDEX `idx_entity`(`entity_type`, `entity_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `setting_id` INTEGER NOT NULL AUTO_INCREMENT,
    `setting_key` VARCHAR(100) NOT NULL,
    `setting_value` TEXT NULL,
    `setting_type` ENUM('text', 'number', 'boolean', 'json') NULL DEFAULT 'text',
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `setting_key`(`setting_key`),
    INDEX `idx_key`(`setting_key`),
    PRIMARY KEY (`setting_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `participants` ADD CONSTRAINT `participants_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_ibfk_1` FOREIGN KEY (`organizer_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `event_category_mapping` ADD CONSTRAINT `fk_ecm_category` FOREIGN KEY (`category_id`) REFERENCES `event_categories`(`category_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `event_category_mapping` ADD CONSTRAINT `fk_ecm_event` FOREIGN KEY (`event_id`) REFERENCES `events`(`event_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events`(`event_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `booking_participants` ADD CONSTRAINT `booking_participants_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`booking_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `booking_participants` ADD CONSTRAINT `booking_participants_ibfk_2` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`participant_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `booking_participants` ADD CONSTRAINT `booking_participants_ibfk_3` FOREIGN KEY (`event_id`) REFERENCES `events`(`event_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`booking_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `event_edit_requests` ADD CONSTRAINT `fk_eer_event` FOREIGN KEY (`event_id`) REFERENCES `events`(`event_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `event_edit_requests` ADD CONSTRAINT `fk_eer_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events`(`event_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT;
