CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  isAdmin TINYINT(1) DEFAULT 0
);

-- CREATE TABLE events (
--     event_id INT AUTO_INCREMENT PRIMARY KEY,
--     event_name VARCHAR(255) NOT NULL,
--     start_datetime DATETIME NOT NULL,
--     end_datetime DATETIME NOT NULL,
--     venue VARCHAR(255) NOT NULL,
--     event_type VARCHAR(100) DEFAULT 'unlisted',
--     department VARCHAR(100), -- Optional
--     capacity INT NOT NULL,
--     organiser_name VARCHAR(255), -- Optional
--     agenda TEXT, -- Optional
--     description TEXT NOT NULL,
    
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

CREATE TABLE events (
    event_id INT NOT NULL AUTO_INCREMENT,
    event_name VARCHAR(255) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) DEFAULT 'unlisted',
    department VARCHAR(100),
    capacity INT NOT NULL,
    organiser_name VARCHAR(255),
    agenda TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    registrations INT DEFAULT 0,
    event_status ENUM('upcoming', 'ongoing', 'past', 'cancelled'),
    PRIMARY KEY (event_id)
);

ALTER TABLE events
ADD COLUMN created_by INT,
ADD CONSTRAINT fk_created_by
FOREIGN KEY (created_by) REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE TABLE temporary_events (
    event_id INT NOT NULL AUTO_INCREMENT,
    event_name VARCHAR(255) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) DEFAULT 'unlisted',
    department VARCHAR(100),
    capacity INT NOT NULL,
    organiser_name VARCHAR(255),
    agenda TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    registrations INT DEFAULT 0,
    status ENUM('pending', 'rejected') NOT NULL DEFAULT 'pending',
    remaining_approvals INT DEFAULT 3,
    PRIMARY KEY (event_id)
);

ALTER TABLE temporary_events
ADD COLUMN created_by INT,
ADD CONSTRAINT fk_temp_events_created_by
FOREIGN KEY (created_by) REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE temporary_events
ADD COLUMN rejected_by INT DEFAULT 0;

CREATE TABLE EventApprovals (
    approval_id INT AUTO_INCREMENT PRIMARY KEY,
    -- Link to the event waiting for approval
    temp_event_id INT NOT NULL,
    -- Link to the user who must approve
    approver_user_id INT NOT NULL,
    -- Track the status of this single approval
    status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    request_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_timestamp TIMESTAMP NULL,
    -- Foreign key to your temporary_events table
    -- ON DELETE CASCADE is crucial: If the temp event is deleted, all its requests are auto-cleaned up.
    FOREIGN KEY (temp_event_id) 
        REFERENCES temporary_events(event_id) 
        ON DELETE CASCADE,
    -- Foreign key to your users table
    FOREIGN KEY (approver_user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE,
    -- Ensures a user can't be asked to approve the same event twice
    UNIQUE KEY unique_approval (temp_event_id, approver_user_id)
);

create table register(user_id INT, event_id INT);
create table wishlist(user_id INT, event_id INT);

INSERT INTO users (name, email, password, isAdmin)
VALUES ('admin', 'admin@gmail.com', '$2b$10$44L2FlQPbclisFGjapvQSuA0i6MbY0ba2S0n7giYJ6MTijhXov06C', 1);

CREATE TABLE `student_notes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `note` TEXT NOT NULL,
  `datetime` DATETIME NOT NULL,
  `notified` TINYINT(1) NOT NULL DEFAULT '0',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_user_id_idx` (`user_id` ASC),
  CONSTRAINT `fk_note_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);