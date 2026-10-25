create database College_fest;
use College_fest;

CREATE TABLE Participant (
    participant_id INT PRIMARY KEY,
    name VARCHAR(100),
    contact_info VARCHAR(150)
);
CREATE TABLE Event (
    event_id INT PRIMARY KEY,
    event_name VARCHAR(100),
    event_date DATE,
    event_time TIME,
    venue VARCHAR(100),
    committee_id INT
);
CREATE TABLE Committee (
    committee_id INT PRIMARY KEY,
    head_name VARCHAR(100),
    email VARCHAR(100),
    phone_number VARCHAR(15),
    team_dept VARCHAR(100),
    members_name TEXT
);
ALTER TABLE Event
ADD FOREIGN KEY (committee_id) REFERENCES Committee(committee_id);

CREATE TABLE Registration (
    registration_id INT PRIMARY KEY,
    participant_id INT,
    event_id INT,
    registration_date DATE,
    registration_status VARCHAR(50),
    team_name VARCHAR(100),

    FOREIGN KEY (participant_id) REFERENCES Participant(participant_id),
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);

CREATE TABLE Payment (
    payment_id INT PRIMARY KEY,
    registration_id INT,
    amount DECIMAL(10,2),
    payment_date DATE,

    FOREIGN KEY (registration_id) REFERENCES Registration(registration_id)
);

CREATE TABLE Certificate (
    certificate_id INT PRIMARY KEY,
    participant_id INT,
    event_id INT,
    certificate_details TEXT,

    FOREIGN KEY (participant_id) REFERENCES Participant(participant_id),
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);


CREATE TABLE Sponsor (
    sponsor_id INT PRIMARY KEY,
    name VARCHAR(100),
    contact_info VARCHAR(150)
);
CREATE TABLE Event_Sponsor (
    sponsor_id INT,
    event_id INT,

    PRIMARY KEY (sponsor_id, event_id),
    FOREIGN KEY (sponsor_id) REFERENCES Sponsor(sponsor_id),
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);
CREATE TABLE Judge (
    judge_id INT PRIMARY KEY,
    name VARCHAR(100),
    contact_info VARCHAR(150)
);
CREATE TABLE Evaluates (
    judge_id INT,
    event_id INT,

    PRIMARY KEY (judge_id, event_id),
    FOREIGN KEY (judge_id) REFERENCES Judge(judge_id),
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);
