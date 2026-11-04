-- Samgan EyeCare – MySQL 8 schema (Stage 1: auth, patients, appointments, tokens, audit)
CREATE DATABASE IF NOT EXISTS samgan_eyecare CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE samgan_eyecare;

SET
    FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs,
appointments,
patients,
uhid_counters,
users,
hospitals;

SET
    FOREIGN_KEY_CHECKS = 1;

CREATE TABLE
    hospitals (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE = InnoDB;

CREATE TABLE
    users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT UNSIGNED NOT NULL,
        username VARCHAR(50) NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM (
            'Hospital Admin',
            'Receptionist',
            'Optometrist',
            'Doctor',
            'Billing Executive'
        ) NOT NULL,
        active TINYINT (1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user (hospital_id, username),
        UNIQUE KEY uq_user_h (id, hospital_id),
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
    ) ENGINE = InnoDB;

CREATE TABLE
    uhid_counters (
        hospital_id INT UNSIGNED PRIMARY KEY,
        last_no INT UNSIGNED NOT NULL DEFAULT 0,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
    ) ENGINE = InnoDB;

CREATE TABLE
    patients (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT UNSIGNED NOT NULL,
        uhid VARCHAR(20) NOT NULL,
        name VARCHAR(120) NOT NULL,
        age TINYINT UNSIGNED NOT NULL,
        sex ENUM ('M', 'F', 'Other') NOT NULL,
        mobile CHAR(10) NOT NULL,
        address VARCHAR(255) NULL,
        registered_on DATE NOT NULL,
        created_by INT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_uhid (hospital_id, uhid),
        UNIQUE KEY uq_pat_h (id, hospital_id),
        KEY ix_mobile (hospital_id, mobile),
        KEY ix_name (hospital_id, name),
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
    ) ENGINE = InnoDB;

CREATE TABLE
    appointments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT UNSIGNED NOT NULL,
        patient_id INT UNSIGNED NOT NULL,
        doctor_id INT UNSIGNED NOT NULL,
        appt_date DATE NOT NULL,
        appt_time TIME NOT NULL,
        type ENUM ('New', 'Regular', 'Follow-up') NOT NULL,
        source ENUM ('Reception', 'Phone', 'Walk-in') NOT NULL DEFAULT 'Reception',
        status ENUM (
            'Booked',
            'Confirmed',
            'Waiting',
            'In Consultation',
            'Completed',
            'Cancelled',
            'No Show'
        ) NOT NULL DEFAULT 'Booked',
        token_no SMALLINT UNSIGNED NULL,
        checked_in_at DATETIME NULL,
        remarks VARCHAR(255) NULL,
        created_by INT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_token (hospital_id, doctor_id, appt_date, token_no),
        KEY ix_day (hospital_id, appt_date, doctor_id),
        KEY ix_pat (hospital_id, patient_id),
        FOREIGN KEY (patient_id, hospital_id) REFERENCES patients (id, hospital_id),
        FOREIGN KEY (doctor_id, hospital_id) REFERENCES users (id, hospital_id)
    ) ENGINE = InnoDB;

CREATE TABLE
    audit_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NULL,
        action VARCHAR(60) NOT NULL,
        entity VARCHAR(40) NULL,
        entity_id INT UNSIGNED NULL,
        detail VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY ix_audit (hospital_id, created_at)
    ) ENGINE = InnoDB;