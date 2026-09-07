--
-- PostgreSQL database dump
--

\restrict OAbvOzpMnMgozYOqqidgKgQW2TaI1XFTxSzlEfRy0OM2ij9IdeziO2wKzGjLYrk

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: override_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.override_type_enum AS ENUM (
    'LEAVE',
    'HOLIDAY',
    'SPECIAL_HOURS'
);


ALTER TYPE public.override_type_enum OWNER TO postgres;

--
-- Name: queue_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.queue_status_enum AS ENUM (
    'ACTIVE',
    'PAUSED',
    'CLOSED'
);


ALTER TYPE public.queue_status_enum OWNER TO postgres;

--
-- Name: ticket_source_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ticket_source_enum AS ENUM (
    'ONLINE',
    'WALK_IN'
);


ALTER TYPE public.ticket_source_enum OWNER TO postgres;

--
-- Name: ticket_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ticket_status_enum AS ENUM (
    'WAITING',
    'CALLED',
    'SERVING',
    'COMPLETED',
    'SKIPPED',
    'CANCELLED',
    'NO_SHOW'
);


ALTER TYPE public.ticket_status_enum OWNER TO postgres;

--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role_enum AS ENUM (
    'PATIENT',
    'HOSPITAL_ADMIN',
    'RECEPTIONIST',
    'DOCTOR',
    'NURSE',
    'SUPER_ADMIN'
);


ALTER TYPE public.user_role_enum OWNER TO postgres;

--
-- Name: verification_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.verification_status_enum AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'SUSPENDED'
);


ALTER TYPE public.verification_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id uuid NOT NULL,
    hospital_id uuid NOT NULL,
    branch_id uuid,
    name character varying(128) NOT NULL,
    code character varying(32),
    description text,
    floor_room character varying(128),
    avg_consultation_minutes integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: doctor_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_schedules (
    id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    max_patients_per_slot integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.doctor_schedules OWNER TO postgres;

--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    id uuid NOT NULL,
    user_id uuid,
    hospital_id uuid NOT NULL,
    branch_id uuid,
    department_id uuid NOT NULL,
    full_name character varying(128) NOT NULL,
    specialty character varying(128) NOT NULL,
    license_number character varying(64),
    bio text,
    photo_url character varying(512),
    room_number character varying(64),
    avg_consultation_minutes integer NOT NULL,
    is_available boolean NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Name: hospital_branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospital_branches (
    id uuid NOT NULL,
    hospital_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    address character varying(512) NOT NULL,
    phone character varying(32),
    latitude double precision,
    longitude double precision,
    is_main_branch boolean NOT NULL,
    is_active boolean NOT NULL,
    opening_hours character varying(255),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.hospital_branches OWNER TO postgres;

--
-- Name: hospitals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospitals (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    logo_url character varying(512),
    cover_image_url character varying(512),
    phone character varying(32),
    email character varying(255),
    website character varying(255),
    address character varying(512),
    latitude double precision,
    longitude double precision,
    is_active boolean NOT NULL,
    is_verified boolean NOT NULL,
    verification_status public.verification_status_enum NOT NULL,
    emergency_service_available boolean NOT NULL,
    rating double precision NOT NULL,
    total_reviews integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.hospitals OWNER TO postgres;

--
-- Name: patient_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient_profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    date_of_birth date,
    gender character varying(16),
    blood_type character varying(8),
    emergency_contact_name character varying(128),
    emergency_contact_phone character varying(32),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.patient_profiles OWNER TO postgres;

--
-- Name: queue_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_sessions (
    id uuid NOT NULL,
    hospital_id uuid NOT NULL,
    branch_id uuid,
    department_id uuid NOT NULL,
    doctor_id uuid,
    session_date date NOT NULL,
    status public.queue_status_enum NOT NULL,
    current_serving_ticket_id uuid,
    current_serving_number character varying(32),
    total_issued_today integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.queue_sessions OWNER TO postgres;

--
-- Name: schedule_overrides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_overrides (
    id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    specific_date date NOT NULL,
    override_type public.override_type_enum NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    reason character varying(255),
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.schedule_overrides OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id uuid NOT NULL,
    hospital_id uuid NOT NULL,
    department_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    duration_minutes integer NOT NULL,
    price double precision NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: ticket_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_logs (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    from_status public.ticket_status_enum,
    to_status public.ticket_status_enum NOT NULL,
    actor_id uuid,
    note text,
    "timestamp" timestamp without time zone NOT NULL
);


ALTER TABLE public.ticket_logs OWNER TO postgres;

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id uuid NOT NULL,
    ticket_number character varying(32) NOT NULL,
    queue_session_id uuid NOT NULL,
    hospital_id uuid NOT NULL,
    branch_id uuid,
    department_id uuid NOT NULL,
    doctor_id uuid,
    service_id uuid,
    patient_id uuid,
    patient_name character varying(128) NOT NULL,
    patient_phone character varying(32),
    ticket_source public.ticket_source_enum NOT NULL,
    status public.ticket_status_enum NOT NULL,
    "position" integer NOT NULL,
    estimated_wait_minutes integer NOT NULL,
    called_at timestamp without time zone,
    serving_started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255),
    phone_number character varying(32),
    hashed_password character varying(255) NOT NULL,
    full_name character varying(128) NOT NULL,
    role public.user_role_enum NOT NULL,
    is_active boolean NOT NULL,
    is_verified boolean NOT NULL,
    profile_photo_url character varying(512),
    hospital_id uuid,
    branch_id uuid,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
c5df6da040e4
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, hospital_id, branch_id, name, code, description, floor_room, avg_consultation_minutes, is_active, created_at, updated_at) FROM stdin;
18a42baf-6235-47ad-9695-77fb7b631b06	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	Dermatology & Skin Care	DERM	Clinical dermatology, eczema, acne, allergy tests, and skin evaluations.	Building B, Floor 1, Room 105	15	t	2026-09-01 10:01:02.215979	2026-09-03 02:42:02.068675
35c3cc8d-2220-4700-93ba-692c22e09358	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	Cardiology & Heart Center	CARDIO	\N	Building A, Floor 2, Room 201	20	t	2026-09-03 07:28:36.50136	2026-09-03 07:28:36.501363
348a6a68-0319-4590-a919-c125f50a3c39	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	Pediatrics	PEDS	Infant, child and adolescent healthcare, developmental tracking, and vaccination.	Building A, Floor 1, Room 102	15	t	2026-09-01 10:01:02.215981	2026-09-03 02:42:02.06868
4ad9a572-c294-40a8-b65e-6758f3d99940	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	General Medicine	GEN	Primary care, adult wellness examinations, routine physicals, and acute illness treatment.	Building A, Ground Floor, Room G03	15	t	2026-09-03 02:42:02.072022	2026-09-03 02:42:02.072024
fdf041e8-d819-420d-b4a1-a49a1291b2ae	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	Orthopedics & Sports Medicine	ORTHO	Bone fractures, joint care, sports injury rehabilitation, and arthritis consultation.	Building C, Floor 2, Room 210	20	t	2026-09-03 02:42:02.072025	2026-09-03 02:42:02.072026
5be2455b-8c17-4700-bf99-b151d34bd9fd	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	Dental Care	DENT	Preventive dental cleaning, cavity treatments, root canals, and orthodontic checks.	Building B, Floor 2, Room 208	25	t	2026-09-03 02:42:02.072027	2026-09-03 02:42:02.072027
b73f700f-f7b7-4bdd-9f47-842d8cdcf790	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	Neurology & Stroke Center	NEURO	\N	Building B, Floor 3, Room 305	25	t	2026-09-03 07:28:36.57397	2026-09-03 07:28:36.573972
2b4415af-9829-4cd8-9a48-74f9b0cf6d09	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	Cardiology	CARDIO	Comprehensive cardiac consultations, ECG, and cardiovascular screenings.	Building A, Floor 2, Room 201	20	t	2026-09-01 10:01:02.215975	2026-09-03 03:24:38.58218
75a56657-1d0b-4b2d-93fa-fe7b2926a463	b511edf7-340e-488c-8102-aeae51dfd556	6cac73af-2f8e-4cfb-83f2-4d6fff238a53	Internal Medicine & General Practice	INT-MED	Comprehensive physical examination and chronic disease management.	Ground Floor, Room 101	15	t	2026-09-03 04:39:10.095848	2026-09-03 04:39:10.095851
072c3c90-482b-455a-b078-6b9e13edb7f6	b511edf7-340e-488c-8102-aeae51dfd556	6cac73af-2f8e-4cfb-83f2-4d6fff238a53	Dental & Oral Care	DENTAL	Preventive and restorative dentistry, cleaning, and dental hygiene.	1st Floor, Room 202	25	t	2026-09-03 04:39:10.095852	2026-09-03 04:39:10.095853
ef35d097-4449-4a40-a88e-24d13a2a43c4	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	General & Laparoscopic Surgery	SURG	\N	Building A, Floor 1, Room 102	15	t	2026-09-03 07:28:36.597404	2026-09-03 07:28:36.597406
4e25ab1e-2cd1-40c9-9015-42b39baf82ae	7275b121-7861-440c-aa24-f6e36c883293	\N	Pulmonology & Respiratory Medicine	PULMO	\N	Building C, Floor 1, Room 108	15	t	2026-09-03 07:28:36.624722	2026-09-03 07:28:36.624724
e94208b9-a54f-46f8-bec9-18071fc2fbab	7275b121-7861-440c-aa24-f6e36c883293	\N	Nephrology & Hemodialysis	NEPHRO	\N	Building D, Floor 2, Room 205	20	t	2026-09-03 07:28:36.646751	2026-09-03 07:28:36.646753
bc8d9a21-cee2-465c-ad48-d68e63aed89d	1a19d7f8-b12d-46b5-a60f-8ad59c812672	\N	Pediatric Outpatient Consultation	PEDIATRIC	\N	Outpatient Pavilion, Room P-101	15	t	2026-09-03 07:28:36.670092	2026-09-03 07:28:36.670095
12a3318c-1e12-40d4-bc19-1bd3872f5bfa	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	Emergency & Stroke Center	SJH-STROKE	\N	Ground Floor, Room ER-01	20	t	2026-09-03 07:28:36.702485	2026-09-03 07:28:36.702488
058c8293-2aeb-45bc-9990-87f0b48bb06b	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	Gastroenterology & Endoscopy Center	SJH-GASTRO	\N	Floor 2, Room 215	20	t	2026-09-03 07:28:36.723158	2026-09-03 07:28:36.723162
a07e7b9c-7a93-466f-92b9-60ba85720ad9	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	Orthopedics & Joint Replacement	ORTHO	\N	Building 2, Floor 2, Room 204	15	t	2026-09-03 07:28:36.759582	2026-09-03 07:28:36.759586
a6d4f86c-643d-480f-b674-957897449838	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	Ophthalmology (Eye Care Center)	EYE	\N	Building 3, Floor 1, Room 118	15	t	2026-09-03 07:28:36.784814	2026-09-03 07:28:36.784818
cfda9424-593b-4f2e-a905-cd59896b0ffc	d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	\N	Rabies Prevention & Animal Bite Center	RABIES	\N	Ground Floor, Vaccination Hall Room 101	10	t	2026-09-03 07:28:36.811905	2026-09-03 07:28:36.811907
b107e9bf-9911-4149-8add-0cf91a19914a	5117399c-07c2-4eec-b59d-efa61d38a3b8	a14f97f3-482d-4bb6-a19c-ae8bcb48ca12	Pet Outpatient & General Medicine	VET-OPD	General veterinary medical care, puppy and kitten wellness, and microchipping.	Room Vet-A (Ground Floor)	15	t	2026-09-03 04:39:10.113932	2026-09-03 07:28:36.841218
e7a5aa51-dc52-4c02-a643-01e55c29ad2b	5117399c-07c2-4eec-b59d-efa61d38a3b8	a14f97f3-482d-4bb6-a19c-ae8bcb48ca12	Animal Surgery & Urgent Care	VET-SURG	Trauma care, wound suture, soft tissue pet surgery, and sterilization.	Room Vet-Surg (Floor 2)	25	t	2026-09-03 04:39:10.113938	2026-09-03 07:28:36.8587
9d826969-4267-431e-8164-9ab07229eacb	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	\N	Implant & Oral Maxillofacial Surgery	DENT-SURG	\N	Floor 3, Surgical Suite 301	25	t	2026-09-03 07:57:39.781866	2026-09-03 07:57:39.781868
c1ecc154-2fb6-46ea-a842-4123edd9bd3f	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	\N	Orthodontics & Pediatric Dentistry	DENT-ORTHO	\N	Floor 2, Clinic Room 204	20	t	2026-09-03 07:57:39.816903	2026-09-03 07:57:39.816905
f0112271-16a9-4baa-866d-e106530e69a4	3b700cc3-bc60-4c4c-90f4-69f1b5b16064	\N	Obstetrics & Gynecology (OB-GYN)	OBGYN	\N	Building B, Ground Floor, Room 102	20	t	2026-09-03 07:57:39.835474	2026-09-03 07:57:39.835476
398599bb-799b-4b91-b567-5aa4b053101d	4a011297-fd8a-4555-b661-049569bf2a55	\N	Comprehensive Ophthalmology & Cataract	EYE-CAT	\N	Floor 2, Examination Room 202	15	t	2026-09-03 07:57:39.855759	2026-09-03 07:57:39.855762
ef5718d4-2014-4175-a712-fd3ce63ae713	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	\N	Veterinary Outpatient & Diagnostics	VET-OPD	\N	Ground Floor, Consultation Bay 1	15	t	2026-09-03 07:57:39.873403	2026-09-03 07:57:39.873405
26539f80-bc35-43e7-9094-cf1ae71f6a4c	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	\N	Pet Orthopedic & Soft Tissue Surgery	VET-SURG	\N	Floor 1, Sterile Operating Theater	30	t	2026-09-03 07:57:39.887782	2026-09-03 07:57:39.887785
4f492e80-4667-44b6-9464-b7b6eaa7d4dd	c9c2a60c-b15f-42ea-a0ae-931ecf59b311	\N	Animal ICU & Emergency Triage	PET-ER	\N	Emergency Ground Floor Bay	20	t	2026-09-03 07:57:39.905929	2026-09-03 07:57:39.905932
a3feba76-3e96-4de5-8122-1d86b53f21a5	b8e5a5bf-2589-4959-a372-0bd16eabb4e6	\N	Preventative Pet Care & Wellness	PET-WELL	\N	Room 1	15	t	2026-09-03 07:57:39.940043	2026-09-03 07:57:39.940045
184550b4-21d9-4b17-b64d-8fb1c25c5f2a	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	Orthopedics & Sports Medicine	TEST7F9	Bone, joint, and sports injury care.	Building C, 1st Floor	20	t	2026-09-04 02:51:26.687274	2026-09-04 02:51:26.687278
\.


--
-- Data for Name: doctor_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_schedules (id, doctor_id, day_of_week, start_time, end_time, max_patients_per_slot, is_active, created_at) FROM stdin;
c9cd28da-8448-4dfa-9341-7226b4a006b8	dfef2b00-92ff-4204-92f6-1766c90b7d1a	1	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382312
c101d497-7f95-4f54-92ed-cd4bf0f6ff4c	dfef2b00-92ff-4204-92f6-1766c90b7d1a	2	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382313
dd34af44-9b45-490e-ad43-f70933bb2223	dfef2b00-92ff-4204-92f6-1766c90b7d1a	3	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382314
f917a549-07c7-4b49-a061-341421e94f9b	dfef2b00-92ff-4204-92f6-1766c90b7d1a	4	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382314
2c19eaac-28aa-4659-99c7-d721182b94ed	dfef2b00-92ff-4204-92f6-1766c90b7d1a	5	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382315
998bed45-a6e2-4592-81e6-d6a4c4b0d2f0	40b50a5f-4add-45e9-bdc3-48049560b9f2	0	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382316
b1e433b6-0275-4d25-8f98-9b11637ba0b5	40b50a5f-4add-45e9-bdc3-48049560b9f2	2	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382317
520d4386-426b-4874-9e76-4f294d56a982	40b50a5f-4add-45e9-bdc3-48049560b9f2	4	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382318
fb756103-d1f2-49f0-8394-fbbc46b7b816	59ff22ce-bdca-4209-a888-36133c0cfbb9	0	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382318
ea0e8574-bd98-413f-b701-9a10b490cfd6	59ff22ce-bdca-4209-a888-36133c0cfbb9	1	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382319
0e784913-454b-4c1e-8576-b0361f4d17ae	59ff22ce-bdca-4209-a888-36133c0cfbb9	2	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.38232
dbab7cbd-9407-4ce2-b837-075f27ac18e3	59ff22ce-bdca-4209-a888-36133c0cfbb9	3	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.38232
a39a95ef-73be-491e-8e13-ea166b90ee89	59ff22ce-bdca-4209-a888-36133c0cfbb9	4	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382321
608759cb-a50c-4edb-af91-f0c4507ad4d6	3664e6dc-82bc-4086-bf22-97c388d3195f	0	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382322
74a1ee68-b396-431c-ae1a-2a81faf70af0	3664e6dc-82bc-4086-bf22-97c388d3195f	1	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382323
2e4ea90e-f27d-4549-884e-c183bba5b3ac	3664e6dc-82bc-4086-bf22-97c388d3195f	2	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382324
175d35d6-cc51-4397-ad73-1b7c66b0f855	3664e6dc-82bc-4086-bf22-97c388d3195f	3	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382324
1a55cd05-f792-4d08-abfc-c34ddddf32b6	3664e6dc-82bc-4086-bf22-97c388d3195f	4	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382325
f16537d7-46c5-47a6-9c2a-9dd5954e47fd	3664e6dc-82bc-4086-bf22-97c388d3195f	5	08:00:00	17:00:00	30	t	2026-09-03 02:43:55.382326
ecd65dfa-3bfd-45c3-b690-238f3d6990f3	26818da6-35be-412e-8a5c-6b3da239625e	0	08:00:00	17:00:00	30	t	2026-09-03 02:45:37.327914
05824c15-baf6-436c-96d1-d733c7d30eaf	26818da6-35be-412e-8a5c-6b3da239625e	1	08:00:00	17:00:00	30	t	2026-09-03 02:45:37.327916
d9f0795d-462c-4fa5-9f85-7a83e501e3c9	26818da6-35be-412e-8a5c-6b3da239625e	2	08:00:00	17:00:00	30	t	2026-09-03 02:45:37.327917
9d0946f9-8bd7-4cc2-8d77-992e26e89d1f	26818da6-35be-412e-8a5c-6b3da239625e	3	08:00:00	17:00:00	30	t	2026-09-03 02:45:37.327918
105334b4-db1c-4cbe-bb56-0446379a1269	26818da6-35be-412e-8a5c-6b3da239625e	4	08:00:00	17:00:00	30	t	2026-09-03 02:45:37.327919
b8a58bf7-08e7-482b-a66c-1ffb6b79ae2c	26818da6-35be-412e-8a5c-6b3da239625e	5	08:00:00	17:00:00	30	t	2026-09-03 02:45:37.32792
9e359a6e-a18c-4922-a8fd-a4d17c91cb9f	26818da6-35be-412e-8a5c-6b3da239625e	6	08:00:00	17:00:00	30	t	2026-09-03 02:45:37.327921
97caa9f4-a472-47e1-be4a-a38e1a22906a	c4cbf503-8e98-4d9c-9950-ed2bfebbebe4	0	08:00:00	17:00:00	30	t	2026-09-04 02:08:54.239953
4568080f-236f-4247-95fc-9a2d60b3f495	c4cbf503-8e98-4d9c-9950-ed2bfebbebe4	1	08:00:00	17:00:00	30	t	2026-09-04 02:08:54.239956
e6d86abd-4147-4e16-9378-57937e794003	c4cbf503-8e98-4d9c-9950-ed2bfebbebe4	2	08:00:00	17:00:00	30	t	2026-09-04 02:08:54.239958
e0d8cc84-8a5c-4fac-a316-ae57e36a00f3	c4cbf503-8e98-4d9c-9950-ed2bfebbebe4	3	08:00:00	17:00:00	30	t	2026-09-04 02:08:54.239959
86159b13-87ac-40fa-9d55-b0806fe3fb42	c4cbf503-8e98-4d9c-9950-ed2bfebbebe4	4	08:00:00	17:00:00	30	t	2026-09-04 02:08:54.23996
21d1d0ed-d180-4916-a85b-04ea1db77e25	58a6d799-e734-4dbc-82d1-3b5a0fb231ca	2	08:00:00	16:00:00	20	t	2026-09-04 02:51:27.573675
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (id, user_id, hospital_id, branch_id, department_id, full_name, specialty, license_number, bio, photo_url, room_number, avg_consultation_minutes, is_available, is_active, created_at, updated_at) FROM stdin;
26818da6-35be-412e-8a5c-6b3da239625e	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	Dr. Sokha Meas, MD	Senior Cardiologist	MD-KH-2015-883	15+ years experience in cardiovascular care, preventive cardiology, and echocardiography.	https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300	Room 201	20	t	t	2026-09-01 10:01:03.241625	2026-09-03 02:43:55.367504
40b50a5f-4add-45e9-bdc3-48049560b9f2	07cf4708-8590-49bf-b394-407fa48bf304	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	fdf041e8-d819-420d-b4a1-a49a1291b2ae	Dr. Vatanak Srey, MD	Orthopedic Surgeon	MD-KH-2021-999	\N	\N	Room 210	20	t	t	2026-09-01 10:16:00.998395	2026-09-03 02:43:55.370595
dfef2b00-92ff-4204-92f6-1766c90b7d1a	41930aa6-6eb9-4e71-954e-336ea32fe35e	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	18a42baf-6235-47ad-9695-77fb7b631b06	Dr. Chann Vatey, MD	Consultant Dermatologist	MD-KH-2018-492	Specialist in medical dermatology, pediatric skin health, and allergy management.	https://images.unsplash.com/photo-1594824813590-482490b4d48c?w=300	Room 105	15	t	t	2026-09-01 10:01:03.241629	2026-09-03 02:43:55.375221
59ff22ce-bdca-4209-a888-36133c0cfbb9	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	348a6a68-0319-4590-a919-c125f50a3c39	Dr. Keo Phalla, MD	Pediatric Specialist	MD-KH-2019-114	\N	\N	Room 102	15	t	t	2026-09-03 02:43:55.377636	2026-09-03 02:43:55.377639
3664e6dc-82bc-4086-bf22-97c388d3195f	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	4ad9a572-c294-40a8-b65e-6758f3d99940	Dr. Samnang Chea, MD	Primary Care Physician	MD-KH-2016-527	\N	\N	Room G03	15	t	t	2026-09-03 02:43:55.377641	2026-09-03 02:43:55.377642
c4cbf503-8e98-4d9c-9950-ed2bfebbebe4	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	5be2455b-8c17-4700-bf99-b151d34bd9fd	Dr. Bopha Tep, DDS	Senior Dental Surgeon	DDS-KH-2017-302	\N	\N	Room 208	25	t	t	2026-09-03 02:43:55.377643	2026-09-03 02:43:55.377644
d45e3f0b-2066-4cd4-932c-981462398147	\N	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	35c3cc8d-2220-4700-93ba-692c22e09358	Sokha Meas, MD	Senior Interventional Cardiologist	\N	Fellow of European Society of Cardiology with 18+ years treating coronary artery disease and hypertension.	\N	Room 201	20	t	t	2026-09-03 07:28:36.514908	2026-09-03 07:28:36.51491
56679aad-9198-49d8-ba38-1f9b5e543928	\N	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	b73f700f-f7b7-4bdd-9f47-842d8cdcf790	Vicheth Chea, MD	Neurologist & Stroke Specialist	\N	Specialist in acute ischemic stroke, Parkinson's disease, and epilepsy management.	\N	Room 305	25	t	t	2026-09-03 07:28:36.576825	2026-09-03 07:28:36.576828
c5d33ee6-401a-42e6-9570-19947a26a37e	\N	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	ef35d097-4449-4a40-a88e-24d13a2a43c4	Bunna Seng, MD	Chief Laparoscopic Surgeon	\N	Specialized in minimally invasive abdominal surgery and emergency trauma.	\N	Room 102	15	t	t	2026-09-03 07:28:36.601225	2026-09-03 07:28:36.601228
4e27868c-a4b8-4765-9c6e-428f9d7d33d4	\N	7275b121-7861-440c-aa24-f6e36c883293	\N	4e25ab1e-2cd1-40c9-9015-42b39baf82ae	Sovannarith Keo, MD	Pulmonology & Asthma Consultant	\N	National expert in asthma, COPD, chronic cough, and lung infections.	\N	Room 108	15	t	t	2026-09-03 07:28:36.628841	2026-09-03 07:28:36.628843
290e07d5-1ed7-4569-ae90-e50334e08342	\N	7275b121-7861-440c-aa24-f6e36c883293	\N	e94208b9-a54f-46f8-bec9-18071fc2fbab	Rithy Lim, MD	Nephrologist & Renal Specialist	\N	Experienced kidney specialist overseeing inpatient dialysis and chronic kidney disease management.	\N	Room 205	20	t	t	2026-09-03 07:28:36.651165	2026-09-03 07:28:36.651168
da48475c-8c98-4b89-b528-40f1e5d58ed1	\N	1a19d7f8-b12d-46b5-a60f-8ad59c812672	\N	bc8d9a21-cee2-465c-ad48-d68e63aed89d	Chan Moly, MD	Chief Pediatric Consultant	\N	Dedicated child health physician with 20 years at Kantha Bopha managing acute infections and malnutrition.	\N	Room P-101	15	t	t	2026-09-03 07:28:36.67445	2026-09-03 07:28:36.674453
b0a618bb-499d-4d68-a951-0885769d6158	\N	1a19d7f8-b12d-46b5-a60f-8ad59c812672	\N	bc8d9a21-cee2-465c-ad48-d68e63aed89d	Bopha Tep, MD	Pediatrician & Neonatal Specialist	\N	Specialist in newborn screening, infant fever, and vaccination schedules.	\N	Room P-102	15	t	t	2026-09-03 07:28:36.678032	2026-09-03 07:28:36.678034
26ae9662-f6c2-41d7-a89b-0c38cc4ac265	\N	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	12a3318c-1e12-40d4-bc19-1bd3872f5bfa	Kenjiro Tanaka, MD	Emergency & Neuro-Trauma Director	\N	Certified emergency specialist from Tokyo Medical Center with rapid stroke intervention expertise.	\N	Room ER-01	20	t	t	2026-09-03 07:28:36.706246	2026-09-03 07:28:36.706248
79470500-31b0-436b-a1d6-8d9a9818daf7	\N	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	058c8293-2aeb-45bc-9990-87f0b48bb06b	Khemara Seng, MD	Gastroenterologist & Hepatologist	\N	Specialist in liver health, hepatitis B/C, acid reflux (GERD), and colonoscopy.	\N	Room 215	20	t	t	2026-09-03 07:28:36.728303	2026-09-03 07:28:36.728306
4e8ebba4-c28a-4300-8a5e-bafea826e101	\N	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	a07e7b9c-7a93-466f-92b9-60ba85720ad9	Dararith Pen, MD	Orthopedic & Trauma Surgeon	\N	22 years experience performing joint replacements, fracture fixations, and athletic sports injuries.	\N	Room 204	15	t	t	2026-09-03 07:28:36.764104	2026-09-03 07:28:36.764107
ac388dfc-3cd7-4869-a6a7-258223ef88f5	\N	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	a6d4f86c-643d-480f-b674-957897449838	Chamroeun Som, MD	Senior Eye Surgeon & Cataract Specialist	\N	Expert in Phaco cataract surgery, diabetic retinopathy, and refractive error correction.	\N	Room 118	15	t	t	2026-09-03 07:28:36.789547	2026-09-03 07:28:36.78955
e5915c28-4130-4a83-ae95-0694cbb14c53	\N	d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	\N	cfda9424-593b-4f2e-a905-cd59896b0ffc	Sophal Tuy, MD	Vaccinologist & Rabies Protocol Specialist	\N	Director of rabies post-exposure prophylaxis with over 15 years preventing rabies in Cambodia.	\N	Room 101	10	t	t	2026-09-03 07:28:36.814607	2026-09-03 07:28:36.814609
f2b36329-2070-4956-8d72-d278b1d6af05	\N	5117399c-07c2-4eec-b59d-efa61d38a3b8	\N	b107e9bf-9911-4149-8add-0cf91a19914a	Dr. Seyha Long, DVM	Small Animal Veterinary Physician	\N	Veterinary doctor specializing in canine dermatology, feline infectious diseases, and puppy wellness.	\N	Room Vet-A	15	t	t	2026-09-03 07:28:36.84632	2026-09-03 07:28:36.846323
38f58627-0c2d-430e-b72e-32b77148374f	\N	5117399c-07c2-4eec-b59d-efa61d38a3b8	\N	e7a5aa51-dc52-4c02-a643-01e55c29ad2b	Dr. Thida Roeun, DVM	Veterinary Soft-Tissue Surgeon	\N	Experienced veterinary surgeon for emergency wound repairs, neutering/spaying, and gastrointestinal foreign body removal.	\N	Room Vet-Surg	25	t	t	2026-09-03 07:28:36.862412	2026-09-03 07:28:36.862414
9cd0e018-9b8e-445e-a0c9-8808ed5ce9ec	\N	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	\N	9d826969-4267-431e-8164-9ab07229eacb	Dr. Tith Hongsar, DDS	Maxillofacial & Dental Implant Surgeon	\N	Founding director and international master implantologist with 25+ years experience in bone grafting and guided implantology.	\N	Suite 301	25	t	t	2026-09-03 07:57:39.787431	2026-09-03 07:57:39.787432
7f6aa298-afe3-4bed-bdaa-365ec0108f49	\N	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	\N	c1ecc154-2fb6-46ea-a842-4123edd9bd3f	Dr. Vuthy Keo, DDS	Orthodontist	\N	Certified Invisalign specialist providing comprehensive bite alignment and pediatric interceptive orthodontics.	\N	Room 204	20	t	t	2026-09-03 07:57:39.819684	2026-09-03 07:57:39.819687
3f145285-e1a8-4f71-9ad6-2598ac3b65b5	\N	3b700cc3-bc60-4c4c-90f4-69f1b5b16064	\N	f0112271-16a9-4baa-866d-e106530e69a4	Dr. Chantrea Sam, MD	Senior Obstetrician & Gynecologist	\N	Experienced maternal-fetal medicine specialist with over 15 years supervising high-risk deliveries and prenatal screening.	\N	Room 102	20	t	t	2026-09-03 07:57:39.837983	2026-09-03 07:57:39.837985
7b62d936-ab30-4a86-82fe-5ba57b225797	\N	4a011297-fd8a-4555-b661-049569bf2a55	\N	398599bb-799b-4b91-b567-5aa4b053101d	Dr. Sovannarith Kong, MD	Consultant Ophthalmic Surgeon	\N	Fellow of the Royal College of Ophthalmologists, specializing in micro-incision cataract surgery and refractive lenses.	\N	Room 202	15	t	t	2026-09-03 07:57:39.85843	2026-09-03 07:57:39.858432
ebbe446b-d2ba-4d02-974d-774ac3892b6a	\N	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	\N	ef5718d4-2014-4175-a712-fd3ce63ae713	Dr. Kimheng Ouk, DVM	Small Animal Clinical Veterinarian	\N	Veterinary medical doctor specialized in feline and canine infectious diseases, dermatology, and preventative wellness.	\N	Bay 1	15	t	t	2026-09-03 07:57:39.876026	2026-09-03 07:57:39.876029
ba5bc8fb-ca0a-4495-bc51-b635a655dbe4	\N	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	\N	26539f80-bc35-43e7-9094-cf1ae71f6a4c	Dr. Julien Moreau, DVM	Senior Veterinary Surgeon	\N	European board-certified veterinary surgeon focusing on fracture plating, cruciate ligament repair, and laparoscopy.	\N	Surg-OT	30	t	t	2026-09-03 07:57:39.890252	2026-09-03 07:57:39.890254
9e16520f-d42c-47a2-9056-938af2217751	\N	c9c2a60c-b15f-42ea-a0ae-931ecf59b311	\N	4f492e80-4667-44b6-9464-b7b6eaa7d4dd	Dr. Sereyroth Mao, DVM	Emergency & Critical Care Veterinarian	\N	Over 10 years experience in veterinary trauma, poison ingestion triage, and critical cardiopulmonary care for pets.	\N	ER Bay	20	t	t	2026-09-03 07:57:39.909487	2026-09-03 07:57:39.90949
13a97347-becc-4db1-bc6b-2973c9b35acf	\N	b8e5a5bf-2589-4959-a372-0bd16eabb4e6	\N	a3feba76-3e96-4de5-8122-1d86b53f21a5	Dr. Piseth Rin, DVM	General Practice Veterinarian	\N	Compassionate companion animal doctor offering health screening, tick-fever prophylaxis, and pet travel health certificates.	\N	Room 1	15	t	t	2026-09-03 07:57:39.947619	2026-09-03 07:57:39.947622
58a6d799-e734-4dbc-82d1-3b5a0fb231ca	8d39ca2d-43e1-4504-8a51-694ce972ab42	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	Dr. Vatanak Srey, MD	Pediatric Orthopedic Surgeon	MD-KH-1762	\N	\N	Room 302	20	t	t	2026-09-04 02:51:27.468613	2026-09-04 02:51:27.468617
\.


--
-- Data for Name: hospital_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospital_branches (id, hospital_id, name, address, phone, latitude, longitude, is_main_branch, is_active, opening_hours, created_at, updated_at) FROM stdin;
835d843a-d634-46ef-91d9-a2532a673fe7	11c80144-bc31-4ed1-8529-f25db3a203d3	Main Campus - Monivong	Building 12, Monivong Blvd, Phnom Penh	+85523888999	11.5564	104.9282	t	t	Mon-Sun: 24/7 Emergency, Outpatient: 07:30 - 18:00	2026-09-01 10:01:02.210604	2026-09-01 10:01:02.210607
6cac73af-2f8e-4cfb-83f2-4d6fff238a53	b511edf7-340e-488c-8102-aeae51dfd556	Central Clinic - Daun Penh	Street 214, Sangkat Boeung Raing, Phnom Penh	+85523999111	\N	\N	t	t	Mon-Sat: 08:00 - 18:00	2026-09-03 04:39:10.086022	2026-09-03 04:39:10.086029
a14f97f3-482d-4bb6-a19c-ae8bcb48ca12	5117399c-07c2-4eec-b59d-efa61d38a3b8	BKK1 Animal Hospital	Building 45, Street 360, BKK1, Phnom Penh	+85523777888	\N	\N	t	t	Mon-Sun: 08:00 - 20:00 (Emergency on-call)	2026-09-03 04:39:10.111732	2026-09-03 04:39:10.111736
\.


--
-- Data for Name: hospitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospitals (id, name, slug, description, logo_url, cover_image_url, phone, email, website, address, latitude, longitude, is_active, is_verified, verification_status, emergency_service_available, rating, total_reviews, created_at, updated_at) FROM stdin;
11c80144-bc31-4ed1-8529-f25db3a203d3	Royal City General Hospital	royal-city-general-hospital	Leading multi-specialty healthcare institution equipped with modern diagnostics, emergency care, and expert consultants.	https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200	https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1000	+85523888999	info@royalcityhospital.com	https://royalcityhospital.com	Building 12, Monivong Blvd, Phnom Penh	11.5564	104.9282	t	t	APPROVED	t	4.8	142	2026-09-01 10:01:02.189247	2026-09-01 10:01:02.18925
b511edf7-340e-488c-8102-aeae51dfd556	Monivong Medical Specialty Clinic	monivong-medical-specialty-clinic	Specialized outpatient medical facility focusing on family medicine, dental health, and preventive care.	\N	\N	+85523999111	\N	\N	Street 214, Sangkat Boeung Raing, Phnom Penh	\N	\N	t	t	APPROVED	f	4.7	89	2026-09-03 04:39:10.078277	2026-09-03 04:39:10.078281
5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	Calmette Hospital (មន្ទីរពេទ្យកាល់ម៉ែត)	calmette-hospital-phnom-penh	Cambodia's premier public tertiary referral hospital specializing in cardiology, neurosurgery, emergency trauma, and oncology.	\N	\N	+85523426948	info@calmette.gov.kh	https://calmette.gov.kh	No. 3, Preah Monivong Blvd, Srah Chak, Daun Penh, Phnom Penh	11.5831	104.9189	t	t	APPROVED	t	4.8	1240	2026-09-03 07:28:36.492662	2026-09-03 07:28:36.492664
7275b121-7861-440c-aa24-f6e36c883293	Khmer-Soviet Friendship Hospital (មន្ទីរពេទ្យមិត្តភាពខ្មែរ-សូវៀត / ពេទ្យរុស្ស៊ី)	khmer-soviet-friendship-hospital	Major public hospital in Chamkarmon known for pulmonary diseases, infectious medicine, hemodialysis, and general internal medicine.	\N	\N	+85523217764	info@ksfh.gov.kh	\N	Yothapol Khemarak Phoumin Blvd (St. 271), Chamkarmon, Phnom Penh	11.5369	104.9084	t	t	APPROVED	t	4.6	980	2026-09-03 07:28:36.620927	2026-09-03 07:28:36.62093
1a19d7f8-b12d-46b5-a60f-8ad59c812672	Kantha Bopha Children's Hospital IV (មន្ទីរពេទ្យគន្ធបុប្ផាទី៤ ភ្នំពេញ)	kantha-bopha-hospital-phnom-penh	Legendary pediatric hospital delivering free, world-class medical and surgical treatment for infants, children, and pregnant mothers.	\N	\N	+85523722020	\N	https://beat-richner.ch	Street 47, Sangkat Wat Phnom, Khan Daun Penh, Phnom Penh	11.5786	104.9228	t	t	APPROVED	t	5	3500	2026-09-03 07:28:36.666736	2026-09-03 07:28:36.666738
f0fc91eb-b864-46cb-a652-047047a0fda1	Sunrise Japan Hospital Phnom Penh (មន្ទីរពេទ្យជប៉ុន សាន់រ៉ាយស៍)	sunrise-japan-hospital-phnom-penh	International Japanese-standard hospital in Chroy Changvar with Japanese and Cambodian doctors providing advanced emergency, stroke care, and executive checkups.	\N	\N	+85523432666	contact@sunrise-hs.com	https://sunrise-hs.com	No. 177D, Kola Loum Street, Chroy Changvar, Phnom Penh	11.5975	104.9312	t	t	APPROVED	t	4.9	750	2026-09-03 07:28:36.698319	2026-09-03 07:28:36.698322
18cf2375-f6e7-4767-9a5c-73056e87743a	Preah Ket Mealea Hospital (មន្ទីរពេទ្យព្រះកេតុមាលា / ពេទ្យទាហាន)	preah-ket-mealea-hospital	Historic national hospital known for orthopedic trauma, joint surgery, ophthalmology, and ear-nose-throat (ENT) care.	\N	\N	+85523883011	\N	\N	Preah Mohaksat Treiyani Kossamak Blvd (St. 47), Srah Chak, Phnom Penh	11.5804	104.9192	t	t	APPROVED	t	4.5	610	2026-09-03 07:28:36.753871	2026-09-03 07:28:36.753875
d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	Pasteur Institute of Cambodia (វិទ្យាស្ថានប៉ាស្ទ័រ កម្ពុជា)	pasteur-institute-cambodia	Leading scientific institution offering international-standard rabies prevention, travel vaccines, and medical laboratory diagnostics.	\N	\N	+85523426009	info@pasteur-kh.org	https://pasteur-kh.org	5 Preah Monivong Blvd (St. 93), Srah Chak, Daun Penh, Phnom Penh	11.5798	104.9195	t	t	APPROVED	t	4.9	1890	2026-09-03 07:28:36.809006	2026-09-03 07:28:36.809008
5117399c-07c2-4eec-b59d-efa61d38a3b8	Phnom Penh Animal Care & Veterinary Clinic (គ្លីនិកព្យាបាលសត្វភ្នំពេញ)	phnom-penh-animal-care-clinic	Full-service animal clinic providing veterinary consultations, pet surgery, and routine wellness inoculations.	\N	\N	+85523777888	\N	\N	Building 45, Street 360, BKK1, Phnom Penh	\N	\N	t	t	APPROVED	t	4.9	115	2026-09-03 04:39:10.10896	2026-09-03 07:28:36.834613
8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	Roomchang Dental & Aesthetic Hospital (មន្ទីរព្យាបាលធ្មេញ និងកែសម្ផស្ស រំចង់)	roomchang-dental-hospital-phnom-penh	Cambodia's premier international dental and maxillofacial specialty center providing digital dentistry, dental implants, orthodontics, and cosmetic dental surgery.	\N	\N	+85523211801	contact@roomchang.com	https://roomchang.com	No. 42, Street 178, Chey Chumneah, Daun Penh, Phnom Penh	11.5642	104.9281	t	t	APPROVED	t	4.9	640	2026-09-03 07:57:39.773109	2026-09-03 07:57:39.773112
3b700cc3-bc60-4c4c-90f4-69f1b5b16064	International Polyclinic & Maternity Center (គ្លីនិកសម្ភព និងរោគស្ត្រី អន្តរជាតិ)	international-polyclinic-maternity-phnom-penh	Specialized women's health clinic providing obstetric care, 4D high-definition ultrasound, gynecological surgery, and family planning.	\N	\N	+85523992255	care@maternitypolyclinic.com.kh	https://maternitypolyclinic.com.kh	No. 188, Mao Tse Toung Blvd, Tuol Svay Prey, Boeng Keng Kang, Phnom Penh	11.5458	104.9123	t	t	APPROVED	t	4.7	420	2026-09-03 07:57:39.833317	2026-09-03 07:57:39.833319
4a011297-fd8a-4555-b661-049569bf2a55	Angkor Eye Care Specialty Clinic (គ្លីនិកឯកទេសចក្ខុរោគ អង្គរ)	angkor-eye-care-clinic-phnom-penh	Leading ophthalmology center offering phacoemulsification cataract surgery, corneal topography, retina assessment, and laser vision correction.	\N	\N	+85523881144	info@angkoreye.com.kh	https://angkoreye.com.kh	No. 76, Russian Federation Blvd, Teuk Laak I, Tuol Kork, Phnom Penh	11.5689	104.8987	t	t	APPROVED	f	4.8	310	2026-09-03 07:57:39.852746	2026-09-03 07:57:39.852748
c95e2ac2-591c-4bd6-ae63-f64efa2541ff	VET-Care Cambodia Animal Hospital (មន្ទីរពេទ្យសត្វ វ៉េតឃែរ កម្ពុជា)	vet-care-cambodia-animal-hospital	Modern full-service companion animal hospital equipped with in-house laboratory, digital radiology, pet ICU, and orthopedic surgery suites.	\N	\N	+85523668899	care@vetcarecambodia.com	https://vetcarecambodia.com	No. 55, Street 315, Boeng Kak II, Tuol Kork, Phnom Penh	11.5794	104.9012	t	t	APPROVED	t	4.9	380	2026-09-03 07:57:39.870707	2026-09-03 07:57:39.87071
c9c2a60c-b15f-42ea-a0ae-931ecf59b311	Angkor Pet Hospital & Emergency Care (មន្ទីរពេទ្យសត្វអង្គរ និងសង្គ្រោះបន្ទាន់)	angkor-pet-hospital-emergency-phnom-penh	24/7 round-the-clock veterinary critical care facility specialized in animal trauma resuscitation, oxygen therapy, and emergency toxicity treatment.	\N	\N	+85523991122	emergency@angkorpethospital.com	https://angkorpethospital.com	No. 112, Norodom Blvd, Tonle Bassac, Chamkarmon, Phnom Penh	11.5521	104.9312	t	t	APPROVED	t	4.8	510	2026-09-03 07:57:39.902699	2026-09-03 07:57:39.902701
b8e5a5bf-2589-4959-a372-0bd16eabb4e6	Lucky Dog & Cat Veterinary Clinic (គ្លីនិកព្យាបាលសត្វឆ្កែ និងឆ្មា ឡាក់គី)	lucky-dog-cat-clinic-phnom-penh	Friendly neighborhood companion animal clinic providing preventative health checks, microchipping, grooming, and routine outpatient care.	\N	\N	+85523774411	hello@luckypetclinic.kh	https://luckypetclinic.kh	No. 29, Street 2004, Kakab, Pur Senchey, Phnom Penh	11.5543	104.8621	t	t	APPROVED	f	4.7	230	2026-09-03 07:57:39.936617	2026-09-03 07:57:39.936619
\.


--
-- Data for Name: patient_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patient_profiles (id, user_id, date_of_birth, gender, blood_type, emergency_contact_name, emergency_contact_phone, created_at, updated_at) FROM stdin;
d8408321-1639-4c68-bf0e-7979204ee7c1	1b56b5f9-5349-4cc4-9b31-47d27c253632	1995-08-20	Female	A+	\N	\N	2026-09-01 10:06:17.722941	2026-09-01 10:06:17.72295
0c5d0578-90c1-4465-87d3-72729791bf8a	30a00c3e-8098-465e-8af0-83b693e34df6	1995-08-20	Female	A+	\N	\N	2026-09-01 10:07:59.094773	2026-09-01 10:07:59.094778
03a7b5a9-0ae5-4f22-8bd8-3b3f203b8753	1499cf53-af56-4a6f-999a-03f0e1c47772	1995-08-20	Female	A+	\N	\N	2026-09-01 10:10:24.006356	2026-09-01 10:10:24.00636
74415245-2fea-4bc0-9758-84556defe1a7	eba521de-22df-458f-a7c0-80812ff5475a	1995-08-20	Female	A+	\N	\N	2026-09-01 10:11:42.7476	2026-09-01 10:11:42.747605
1d1272ef-b1a5-47fc-8869-4bb7f4ad74b2	04ed9536-e670-4eb9-8467-850c1646e5cf	1995-08-20	Female	A+	\N	\N	2026-09-01 10:12:36.736797	2026-09-01 10:12:36.736802
7cec8b91-2f83-41b7-8d2a-d5073b7cd57c	7386f938-9ec9-43e9-a379-178ea670acee	1995-08-20	Female	A+	\N	\N	2026-09-01 10:13:28.738532	2026-09-01 10:13:28.738535
40cbe790-a199-4c23-afa4-7393eae07b50	c356e214-ddcd-497f-9f51-cd21fc0a18b1	1995-08-20	Female	A+	\N	\N	2026-09-01 10:15:57.75725	2026-09-01 10:15:57.757254
4d782928-60f0-4550-ac0d-92ab2bb7d5af	c8e12eb5-d0ef-4136-8992-662c6e0d6d51	1995-08-20	Female	A+	\N	\N	2026-09-01 10:19:20.922585	2026-09-01 10:19:20.922589
41a7710a-8e1c-4fec-b899-f17bac10bce4	ed05f7c3-d894-4b67-b410-14fe0199efe8	1995-08-20	Female	A+	\N	\N	2026-09-01 10:19:51.514494	2026-09-01 10:19:51.514498
6992cb2a-16af-423a-9367-82ca342ecb84	8d4cc166-72fc-4bd9-97cd-2039e35fec9d	1995-08-20	Female	A+	\N	\N	2026-09-01 10:22:16.277025	2026-09-01 10:22:16.277029
ad7dc362-f34b-492e-807b-3487a24c8ae8	ce90176b-032f-4254-81ce-7326d572355c	1995-08-20	Female	A+	\N	\N	2026-09-01 10:24:00.983325	2026-09-01 10:24:00.983329
06bc7261-fabe-46a4-b60d-e9429e9484e4	b91b4391-43d0-44a6-90e4-df02f6add795	1995-08-20	Female	A+	\N	\N	2026-09-01 10:24:45.737699	2026-09-01 10:24:45.737709
1ef2f7ba-45c4-482c-8f08-ad0b8c9b4eca	149b29b3-8535-4cd8-8bee-5836b2651734	1995-08-20	Female	A+	\N	\N	2026-09-01 10:25:08.817872	2026-09-01 10:25:08.817875
07904975-118a-4325-8e2b-56da44e7c150	162f0832-5f86-4ee2-a48e-41f76c8f70d7	1992-05-14	Male	O+	Sothea Chea	+85512999888	2026-09-01 10:01:03.237282	2026-09-01 10:25:14.088181
96b4fed8-22d7-4c8d-a8ca-254032abdd65	7e418ea7-4ee5-426c-8fce-da938bbe16ac	1995-08-20	Female	A+	\N	\N	2026-09-01 10:26:56.084499	2026-09-01 10:26:56.084503
5a5f6e72-4c18-4968-8ed3-fdc57500714c	359876bf-f42a-45f7-9189-8a047b876b1f	1995-08-20	Female	A+	\N	\N	2026-09-01 10:29:43.464682	2026-09-01 10:29:43.464695
327df212-026b-49aa-b94a-89b3afeca682	4fcbee64-b867-4ceb-9a44-e2620f4924ec	1995-08-20	Female	A+	\N	\N	2026-09-01 10:30:37.52165	2026-09-01 10:30:37.521653
d607c5c3-eb16-4cad-ad76-265812fa289e	d921d482-96cc-42d4-9bd0-68a4e04341b4	1995-08-20	Female	A+	\N	\N	2026-09-01 10:31:35.57981	2026-09-01 10:31:35.579817
e0769dbe-ad16-4eae-bb52-8537e16cb19d	039013c7-4029-4af9-a891-378d8509da2d	1995-08-20	Female	A+	\N	\N	2026-09-01 10:34:33.691457	2026-09-01 10:34:33.69146
1fe81f68-ed00-404d-b0e6-8d7825023c43	773cb949-7fac-4729-b36a-e6d0ed5e6437	1995-08-20	Female	A+	\N	\N	2026-09-01 10:35:04.835529	2026-09-01 10:35:04.835533
b8cca207-e769-4ca7-959f-034c60cad454	4b74b3d7-f994-49f8-b15b-c76836294c72	1995-08-20	Female	A+	\N	\N	2026-09-01 10:41:48.894135	2026-09-01 10:41:48.89414
7f2d31eb-eb2b-46b4-8a4d-f89118544318	0a637638-f98b-4062-b3b9-a0832524eef8	1995-08-20	Female	A+	\N	\N	2026-09-01 10:42:43.574231	2026-09-01 10:42:43.574236
8b1fa755-7609-4099-bbc3-9bc17e427de1	d3048e85-9516-4c1c-91e9-9b6a8b4a8604	1995-08-20	Female	A+	\N	\N	2026-09-01 10:46:06.368937	2026-09-01 10:46:06.368945
00a40621-de25-46b5-8225-68b12ede2513	2246fa92-61e9-485d-9c96-8be3c14c7921	1995-08-20	Female	A+	\N	\N	2026-09-01 10:49:23.080222	2026-09-01 10:49:23.080226
88f6915c-8849-4c62-ab3b-cc80427f119a	d8960117-e081-480a-81fc-dd74446a3813	1995-08-20	Female	A+	\N	\N	2026-09-01 10:50:12.471795	2026-09-01 10:50:12.471799
d0a82730-72cb-429d-a4ac-86a19f369972	6a8720f6-935e-40c2-a538-3b93e6c06a23	1995-08-20	Female	A+	\N	\N	2026-09-01 11:04:36.919987	2026-09-01 11:04:36.919994
713bcd78-3de3-49b1-a85f-a5cb430d65de	27b32573-501f-4744-b6dc-1e8e094d7198	1995-08-20	Female	A+	\N	\N	2026-09-01 15:10:19.631591	2026-09-01 15:10:19.631596
9956ea4f-2d29-4be1-88c2-56c8be3229c6	c358853e-826b-4312-ab4d-4277c6dd02e2	1995-08-20	Female	A+	\N	\N	2026-09-04 02:51:21.120282	2026-09-04 02:51:21.120285
\.


--
-- Data for Name: queue_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queue_sessions (id, hospital_id, branch_id, department_id, doctor_id, session_date, status, current_serving_ticket_id, current_serving_number, total_issued_today, created_at, updated_at) FROM stdin;
f0ee6944-566c-4a8b-8a66-774592ff647e	5117399c-07c2-4eec-b59d-efa61d38a3b8	\N	b107e9bf-9911-4149-8add-0cf91a19914a	\N	2026-09-04	ACTIVE	\N	\N	1	2026-09-04 01:59:05.292093	2026-09-04 01:59:05.318015
50f3436b-8c84-4e5a-b85e-35720aac6b8b	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	2026-09-04	ACTIVE	\N	CARDIO-001	2	2026-09-04 01:55:18.443303	2026-09-04 02:51:23.515103
f9153da1-28da-4b26-bbc9-ce075fa7d4c3	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	26818da6-35be-412e-8a5c-6b3da239625e	2026-09-01	ACTIVE	\N	CARD-003	3	2026-09-01 10:01:03.253392	2026-09-01 10:11:47.386314
18bd3806-f097-4b88-b157-e00162e5152c	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	18a42baf-6235-47ad-9695-77fb7b631b06	\N	2026-09-04	ACTIVE	\N	\N	5	2026-09-04 02:51:25.510286	2026-09-04 02:51:31.232794
f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	2026-09-01	ACTIVE	\N	CARDIO-004	109	2026-09-01 10:10:27.420101	2026-09-01 15:10:35.970293
89255e45-b94b-4783-9512-62542768e454	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	2026-09-02	ACTIVE	\N	\N	0	2026-09-02 02:56:41.901343	2026-09-02 02:56:41.901345
9f500406-f599-45d8-a8ee-18b7b265ef5a	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	5be2455b-8c17-4700-bf99-b151d34bd9fd	\N	2026-09-03	ACTIVE	\N	\N	0	2026-09-03 02:42:46.932931	2026-09-03 02:42:46.932935
9e176685-dd20-4fe2-b1f8-b6523bf1f23b	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	18a42baf-6235-47ad-9695-77fb7b631b06	\N	2026-09-03	ACTIVE	\N	\N	0	2026-09-03 02:42:51.992553	2026-09-03 02:42:51.992557
5802faf0-b5c0-452b-a061-3263a88f11b8	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	348a6a68-0319-4590-a919-c125f50a3c39	\N	2026-09-03	ACTIVE	\N	\N	0	2026-09-03 02:42:54.879093	2026-09-03 02:42:54.879095
70cfbcca-7894-41d8-b9a1-fdf27328a244	5117399c-07c2-4eec-b59d-efa61d38a3b8	\N	b107e9bf-9911-4149-8add-0cf91a19914a	\N	2026-09-03	ACTIVE	\N	\N	1	2026-09-03 07:15:33.392813	2026-09-03 07:15:33.423021
586c324b-80a2-4681-a3d8-01468295f527	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	4ad9a572-c294-40a8-b65e-6758f3d99940	\N	2026-09-03	ACTIVE	\N	\N	1	2026-09-03 02:42:53.257617	2026-09-03 07:22:10.938115
6580d55b-4004-47cf-8414-0c3dfc489ecd	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	35c3cc8d-2220-4700-93ba-692c22e09358	\N	2026-09-03	ACTIVE	\N	CARDIO-008	10	2026-09-03 07:28:36.550269	2026-09-03 07:28:36.550271
a5702c02-e5db-4d34-96fa-26f13f35eede	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	ef35d097-4449-4a40-a88e-24d13a2a43c4	\N	2026-09-03	ACTIVE	\N	SURG-006	7	2026-09-03 07:28:36.612358	2026-09-03 07:28:36.612359
3a34a6d0-9c21-47fa-9f21-6c08711afe2d	7275b121-7861-440c-aa24-f6e36c883293	\N	4e25ab1e-2cd1-40c9-9015-42b39baf82ae	\N	2026-09-03	ACTIVE	\N	PULMO-012	9	2026-09-03 07:28:36.63991	2026-09-03 07:28:36.639912
fbf1e67e-2837-468e-baec-57eccaa4cf34	7275b121-7861-440c-aa24-f6e36c883293	\N	e94208b9-a54f-46f8-bec9-18071fc2fbab	\N	2026-09-03	ACTIVE	\N	NEPHRO-003	7	2026-09-03 07:28:36.660999	2026-09-03 07:28:36.661
752a812f-4589-4023-a448-0c3a9c0bff37	1a19d7f8-b12d-46b5-a60f-8ad59c812672	\N	bc8d9a21-cee2-465c-ad48-d68e63aed89d	\N	2026-09-03	ACTIVE	\N	PEDIATRIC-024	9	2026-09-03 07:28:36.691804	2026-09-03 07:28:36.691806
ff61ad03-16cd-433e-a70a-bcec33546fc0	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	12a3318c-1e12-40d4-bc19-1bd3872f5bfa	\N	2026-09-03	ACTIVE	\N	SJH-STROKE-005	7	2026-09-03 07:28:36.71617	2026-09-03 07:28:36.716171
bf2da0d3-eb9b-456e-aed2-fd53e6dfd010	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	058c8293-2aeb-45bc-9990-87f0b48bb06b	\N	2026-09-03	ACTIVE	\N	SJH-GASTRO-002	8	2026-09-03 07:28:36.74667	2026-09-03 07:28:36.746672
02b94ac9-736d-4f9f-86fd-fe1490ed4bb7	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	a07e7b9c-7a93-466f-92b9-60ba85720ad9	\N	2026-09-03	ACTIVE	\N	ORTHO-009	8	2026-09-03 07:28:36.777112	2026-09-03 07:28:36.777114
d73e3d8a-8a9b-4630-801b-9e57b225c53d	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	a6d4f86c-643d-480f-b674-957897449838	\N	2026-09-03	ACTIVE	\N	EYE-007	8	2026-09-03 07:28:36.800624	2026-09-03 07:28:36.800625
c4a12ef5-7fc4-4fc8-96db-f861667b454a	d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	\N	cfda9424-593b-4f2e-a905-cd59896b0ffc	\N	2026-09-03	ACTIVE	\N	RABIES-018	9	2026-09-03 07:28:36.827678	2026-09-03 07:28:36.82768
7d87ce48-4caf-4e75-a00b-e939a53dff93	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	\N	9d826969-4267-431e-8164-9ab07229eacb	\N	2026-09-03	ACTIVE	\N	DENT-004	7	2026-09-03 07:57:39.799513	2026-09-03 07:57:39.799515
29d62e46-7fd3-42a8-a637-9b5cae8a8729	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	\N	c1ecc154-2fb6-46ea-a842-4123edd9bd3f	\N	2026-09-03	ACTIVE	\N	BRACE-002	6	2026-09-03 07:57:39.827595	2026-09-03 07:57:39.827597
00beeb22-6424-43a6-94bd-ccfdf2a09f7b	3b700cc3-bc60-4c4c-90f4-69f1b5b16064	\N	f0112271-16a9-4baa-866d-e106530e69a4	\N	2026-09-03	ACTIVE	\N	OBGYN-006	8	2026-09-03 07:57:39.846515	2026-09-03 07:57:39.846516
c770030a-4560-4dae-b150-07e50c1dc3c4	4a011297-fd8a-4555-b661-049569bf2a55	\N	398599bb-799b-4b91-b567-5aa4b053101d	\N	2026-09-03	ACTIVE	\N	EYE-003	7	2026-09-03 07:57:39.866464	2026-09-03 07:57:39.866465
316bc69a-8170-4c42-84ba-f3be35a53a02	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	\N	ef5718d4-2014-4175-a712-fd3ce63ae713	\N	2026-09-03	ACTIVE	\N	VET-OPD-005	8	2026-09-03 07:57:39.883461	2026-09-03 07:57:39.883463
10a50164-f842-4988-b120-fdac8f9884c9	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	\N	26539f80-bc35-43e7-9094-cf1ae71f6a4c	\N	2026-09-03	ACTIVE	\N	PET-SURG-002	6	2026-09-03 07:57:39.898321	2026-09-03 07:57:39.898323
e4b74b24-f1a4-4112-ae3d-b55d7ded425f	c9c2a60c-b15f-42ea-a0ae-931ecf59b311	\N	4f492e80-4667-44b6-9464-b7b6eaa7d4dd	\N	2026-09-03	ACTIVE	\N	PET-ER-003	7	2026-09-03 07:57:39.930039	2026-09-03 07:57:39.930041
7843e3c2-baa0-4ee1-bdc5-6c3d84a3008f	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	b73f700f-f7b7-4bdd-9f47-842d8cdcf790	\N	2026-09-03	ACTIVE	\N	NEURO-004	9	2026-09-03 07:28:36.588797	2026-09-03 08:16:54.438864
9b64992a-8745-483c-a0ea-61800f9f5263	5117399c-07c2-4eec-b59d-efa61d38a3b8	\N	e7a5aa51-dc52-4c02-a643-01e55c29ad2b	\N	2026-09-03	ACTIVE	\N	\N	3	2026-09-03 07:06:07.947688	2026-09-03 09:22:13.895639
0330b3a1-f60e-442b-9a6c-3e75754d7942	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	2026-09-03	ACTIVE	bf6b4c2b-54ac-438e-9025-6865eb2b2217	CARDIO-001	1	2026-09-03 02:10:19.815021	2026-09-03 10:15:05.900169
a50ebf04-4d8b-465d-9a93-cf306a6960d8	b8e5a5bf-2589-4959-a372-0bd16eabb4e6	\N	a3feba76-3e96-4de5-8122-1d86b53f21a5	\N	2026-09-03	ACTIVE	\N	LUCKY-002	8	2026-09-03 07:57:39.959099	2026-09-03 10:31:07.948774
\.


--
-- Data for Name: schedule_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schedule_overrides (id, doctor_id, specific_date, override_type, start_time, end_time, reason, created_at) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, hospital_id, department_id, name, description, duration_minutes, price, is_active, created_at, updated_at) FROM stdin;
07db7693-e255-4dac-932b-cc7b92737b7f	11c80144-bc31-4ed1-8529-f25db3a203d3	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	Specialist Cardiology Consultation	In-depth consultation with senior cardiologist including vitals assessment.	20	35	t	2026-09-01 10:01:02.221198	2026-09-01 10:01:02.221201
1f6f5874-544e-4cc6-8cfb-fecf522134cd	11c80144-bc31-4ed1-8529-f25db3a203d3	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	12-Lead Electrocardiogram (ECG)	Resting 12-lead heart rhythm screening.	15	25	t	2026-09-01 10:01:02.221202	2026-09-01 10:01:02.221203
53117e2f-5dd7-415b-a90f-9bbfb9fc2b7a	11c80144-bc31-4ed1-8529-f25db3a203d3	18a42baf-6235-47ad-9695-77fb7b631b06	Dermatology Examination	Skin allergy, rash, and lesion diagnosis.	15	30	t	2026-09-01 10:01:02.221204	2026-09-01 10:01:02.221205
043204f9-39bf-415d-8c74-c34e882431a5	b511edf7-340e-488c-8102-aeae51dfd556	75a56657-1d0b-4b2d-93fa-fe7b2926a463	General Physician Health Consultation	General health triage, vitals screening, and consultation.	15	20	t	2026-09-03 04:39:10.100885	2026-09-03 04:39:10.100888
9b46de88-2d5b-42af-9cd9-0bce93a551ef	b511edf7-340e-488c-8102-aeae51dfd556	072c3c90-482b-455a-b078-6b9e13edb7f6	Dental Scaling & Cleaning	Ultrasonic tartar removal and polish.	25	30	t	2026-09-03 04:39:10.100889	2026-09-03 04:39:10.10089
293631ef-e346-4261-bd6b-5ce533d76077	5117399c-07c2-4eec-b59d-efa61d38a3b8	b107e9bf-9911-4149-8add-0cf91a19914a	Pet Health Examination & Physical Triage	Comprehensive nose-to-tail physical exam for dogs and cats.	15	15	t	2026-09-03 04:39:10.116311	2026-09-03 04:39:10.116313
48fe1dee-e2a3-49ba-a752-32dfec890ca6	5117399c-07c2-4eec-b59d-efa61d38a3b8	b107e9bf-9911-4149-8add-0cf91a19914a	Core Vaccine & Rabies Inoculation	Annual core vaccinations, rabies immunization and deworming.	15	25	t	2026-09-03 04:39:10.116314	2026-09-03 04:39:10.116315
9b61a158-bb2c-4ff5-be57-ae3903127a92	5117399c-07c2-4eec-b59d-efa61d38a3b8	b107e9bf-9911-4149-8add-0cf91a19914a	Pet Dental Cleaning & Scaling	Veterinary ultrasonic dental scaling and polishing under sedation.	30	35	t	2026-09-03 04:39:10.116316	2026-09-03 04:39:10.116318
5f34fe96-80b4-4b21-a464-86a25e2f5214	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	35c3cc8d-2220-4700-93ba-692c22e09358	12-Lead ECG & Consultation	\N	15	25	t	2026-09-03 07:28:36.526155	2026-09-03 07:28:36.526157
bc7d1e15-01cb-4705-8d4f-f69a3c13115d	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	35c3cc8d-2220-4700-93ba-692c22e09358	Color Doppler Echocardiography	\N	30	65	t	2026-09-03 07:28:36.53223	2026-09-03 07:28:36.532232
b2e74814-5bdf-4054-974c-6470be7700ad	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	35c3cc8d-2220-4700-93ba-692c22e09358	24-Hour Holter Blood Pressure Monitoring	\N	20	45	t	2026-09-03 07:28:36.536174	2026-09-03 07:28:36.536176
a8823bea-d054-4401-a15c-d48d832da1a7	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	b73f700f-f7b7-4bdd-9f47-842d8cdcf790	Comprehensive Neurological Assessment	\N	25	35	t	2026-09-03 07:28:36.579668	2026-09-03 07:28:36.57967
e2406d0f-8e6a-4734-b217-fded29b2c306	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	b73f700f-f7b7-4bdd-9f47-842d8cdcf790	Brain MRI & Stroke Protocol	\N	40	180	t	2026-09-03 07:28:36.584573	2026-09-03 07:28:36.584575
54b76621-a0c7-43c2-9167-a59afcb21f09	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	ef35d097-4449-4a40-a88e-24d13a2a43c4	Pre-Surgical Consultation & Triage	\N	15	20	t	2026-09-03 07:28:36.605448	2026-09-03 07:28:36.605451
c8040f6d-7096-4d0f-bce4-7711820934fc	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	ef35d097-4449-4a40-a88e-24d13a2a43c4	Abdominal Ultrasound Examination	\N	20	30	t	2026-09-03 07:28:36.609123	2026-09-03 07:28:36.609126
67f7ce65-6288-494a-89ac-0a95e8be245c	7275b121-7861-440c-aa24-f6e36c883293	4e25ab1e-2cd1-40c9-9015-42b39baf82ae	Digital Chest X-Ray & Pulmonology Review	\N	15	20	t	2026-09-03 07:28:36.632881	2026-09-03 07:28:36.632883
f16a0df2-e86a-4660-b243-0af83aaa441a	7275b121-7861-440c-aa24-f6e36c883293	4e25ab1e-2cd1-40c9-9015-42b39baf82ae	Spirometry Lung Function Test	\N	20	30	t	2026-09-03 07:28:36.636457	2026-09-03 07:28:36.636459
271dbe81-32f8-48b3-bd10-e69c1b7341d4	7275b121-7861-440c-aa24-f6e36c883293	e94208b9-a54f-46f8-bec9-18071fc2fbab	Kidney Function Blood Panel (eGFR, Creatinine)	\N	15	18	t	2026-09-03 07:28:36.655106	2026-09-03 07:28:36.655108
c45550fc-95a7-4fe5-bed0-475b5db680ee	7275b121-7861-440c-aa24-f6e36c883293	e94208b9-a54f-46f8-bec9-18071fc2fbab	Routine Hemodialysis Session	\N	240	45	t	2026-09-03 07:28:36.657687	2026-09-03 07:28:36.657689
90d75f02-0f91-4121-ae90-921c02829779	1a19d7f8-b12d-46b5-a60f-8ad59c812672	bc8d9a21-cee2-465c-ad48-d68e63aed89d	Free Pediatric Comprehensive Consultation	\N	15	0	t	2026-09-03 07:28:36.681635	2026-09-03 07:28:36.681637
6b893d1f-904e-4ad2-8086-b8fafb4df95f	1a19d7f8-b12d-46b5-a60f-8ad59c812672	bc8d9a21-cee2-465c-ad48-d68e63aed89d	Child Fever & Dengue Diagnostic Evaluation	\N	20	0	t	2026-09-03 07:28:36.684851	2026-09-03 07:28:36.684854
1547d13b-ed16-4d79-a6c6-e1c100804113	1a19d7f8-b12d-46b5-a60f-8ad59c812672	bc8d9a21-cee2-465c-ad48-d68e63aed89d	Essential Childhood Immunization Protocol	\N	15	0	t	2026-09-03 07:28:36.68813	2026-09-03 07:28:36.688132
5f487518-45f4-4850-8561-5aa3b0e8f321	f0fc91eb-b864-46cb-a652-047047a0fda1	12a3318c-1e12-40d4-bc19-1bd3872f5bfa	Rapid Emergency Triage & Neuro Evaluation	\N	20	50	t	2026-09-03 07:28:36.709341	2026-09-03 07:28:36.709344
c8da40e3-fe32-4091-a176-e7b071a1ef12	f0fc91eb-b864-46cb-a652-047047a0fda1	12a3318c-1e12-40d4-bc19-1bd3872f5bfa	High-Definition 1.5T Brain MRI	\N	35	210	t	2026-09-03 07:28:36.71281	2026-09-03 07:28:36.712812
cee9eca5-7989-47e8-a91d-3029da205d15	f0fc91eb-b864-46cb-a652-047047a0fda1	058c8293-2aeb-45bc-9990-87f0b48bb06b	Digestive Health Consultation & H. Pylori Test	\N	20	40	t	2026-09-03 07:28:36.737404	2026-09-03 07:28:36.737406
f2351f1a-c69d-4ef5-bf43-91cbd745920b	f0fc91eb-b864-46cb-a652-047047a0fda1	058c8293-2aeb-45bc-9990-87f0b48bb06b	Video Gastroscopy (Stomach Endoscopy)	\N	30	160	t	2026-09-03 07:28:36.741778	2026-09-03 07:28:36.741781
b1cff37b-644f-40f8-9261-7878841e278b	18cf2375-f6e7-4767-9a5c-73056e87743a	a07e7b9c-7a93-466f-92b9-60ba85720ad9	Bone & Joint Consultation with X-Ray	\N	15	25	t	2026-09-03 07:28:36.768563	2026-09-03 07:28:36.768566
42a280fb-5f1f-44be-9af7-35212d87b816	18cf2375-f6e7-4767-9a5c-73056e87743a	a07e7b9c-7a93-466f-92b9-60ba85720ad9	Knee Osteoarthritis Hyaluronic Injection	\N	20	60	t	2026-09-03 07:28:36.772933	2026-09-03 07:28:36.772935
90ebdbc8-d9b1-4cce-9ab2-693f5f5e31ba	18cf2375-f6e7-4767-9a5c-73056e87743a	a6d4f86c-643d-480f-b674-957897449838	Slit-Lamp Eye Exam & Refraction Check	\N	15	18	t	2026-09-03 07:28:36.793386	2026-09-03 07:28:36.79339
e9ce803b-cd2c-458a-b56a-3f7b487e26b9	18cf2375-f6e7-4767-9a5c-73056e87743a	a6d4f86c-643d-480f-b674-957897449838	Glaucoma Screening & Intraocular Pressure Test	\N	20	25	t	2026-09-03 07:28:36.797424	2026-09-03 07:28:36.797426
9fbfda96-8890-445d-8e1d-661aaa953f73	d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	cfda9424-593b-4f2e-a905-cd59896b0ffc	Post-Exposure Rabies Vaccine Injection (Dose 1-4)	\N	10	15	t	2026-09-03 07:28:36.818362	2026-09-03 07:28:36.818365
dbea80ee-16b7-490d-8b40-3600ea95d016	d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	cfda9424-593b-4f2e-a905-cd59896b0ffc	Rabies Immunoglobulin (RIG) Administration	\N	20	45	t	2026-09-03 07:28:36.821804	2026-09-03 07:28:36.821806
fbd575e2-dfba-4e54-a275-f665ad07625f	d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	cfda9424-593b-4f2e-a905-cd59896b0ffc	Tetanus Toxoid Booster Injection	\N	10	10	t	2026-09-03 07:28:36.824505	2026-09-03 07:28:36.824506
0e39f82e-8136-44ed-9f39-87a7ef40e275	5117399c-07c2-4eec-b59d-efa61d38a3b8	b107e9bf-9911-4149-8add-0cf91a19914a	Core Canine Vaccine (DHPPi + Rabies)	\N	15	20	t	2026-09-03 07:28:36.852142	2026-09-03 07:28:36.852144
a5406cdc-4f20-4855-81e9-c46b9aa37d97	5117399c-07c2-4eec-b59d-efa61d38a3b8	e7a5aa51-dc52-4c02-a643-01e55c29ad2b	Emergency Pet Trauma & Wound Suture	\N	30	45	t	2026-09-03 07:28:36.865799	2026-09-03 07:28:36.865801
f625dbbf-261b-44bb-bf33-b45f2355104c	5117399c-07c2-4eec-b59d-efa61d38a3b8	e7a5aa51-dc52-4c02-a643-01e55c29ad2b	Pet Abdominal Ultrasound Scan	\N	25	40	t	2026-09-03 07:28:36.869074	2026-09-03 07:28:36.869076
d559da71-7e14-495a-bac3-3aacf7ffe6a3	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	9d826969-4267-431e-8164-9ab07229eacb	3D CBCT Scan & Implant Consultation	\N	25	40	t	2026-09-03 07:57:39.791858	2026-09-03 07:57:39.791861
e3207380-7b50-4474-b603-be3138ba5c13	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	9d826969-4267-431e-8164-9ab07229eacb	Surgical Tooth Extraction (Wisdom Tooth)	\N	35	80	t	2026-09-03 07:57:39.796228	2026-09-03 07:57:39.796229
2785e9e5-d2fc-4585-bc5f-4c5ede9e8e81	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	c1ecc154-2fb6-46ea-a842-4123edd9bd3f	Orthodontic & Aligners Evaluation	\N	20	30	t	2026-09-03 07:57:39.822603	2026-09-03 07:57:39.822605
28b833b0-c369-4951-a8a4-6138ff5f9c77	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	c1ecc154-2fb6-46ea-a842-4123edd9bd3f	Routine Dental Cleaning & Airflow Polish	\N	25	25	t	2026-09-03 07:57:39.825193	2026-09-03 07:57:39.825195
0dea9068-6060-4261-84ef-2e4e2f186dee	3b700cc3-bc60-4c4c-90f4-69f1b5b16064	f0112271-16a9-4baa-866d-e106530e69a4	4D HD Live Prenatal Ultrasound	\N	25	35	t	2026-09-03 07:57:39.840364	2026-09-03 07:57:39.840366
c09f30ac-248c-4888-bf52-766b4f6c8a68	3b700cc3-bc60-4c4c-90f4-69f1b5b16064	f0112271-16a9-4baa-866d-e106530e69a4	Cervical Cancer Screening (Pap Smear + HPV)	\N	15	45	t	2026-09-03 07:57:39.842776	2026-09-03 07:57:39.842778
6cce9e80-c349-4b9b-a89b-f4536f5a1f38	4a011297-fd8a-4555-b661-049569bf2a55	398599bb-799b-4b91-b567-5aa4b053101d	Dilated Fundus & Retinal Examination	\N	20	25	t	2026-09-03 07:57:39.86136	2026-09-03 07:57:39.861362
96f23c96-b8e9-4d6f-8e05-b2f07cb6ac24	4a011297-fd8a-4555-b661-049569bf2a55	398599bb-799b-4b91-b567-5aa4b053101d	Intraocular Pressure (Tonometry) Glaucoma Check	\N	15	18	t	2026-09-03 07:57:39.863981	2026-09-03 07:57:39.863983
19abb115-4af0-49b3-bc21-65c4211694c9	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	ef5718d4-2014-4175-a712-fd3ce63ae713	Canine 5-in-1 Vaccine (DHPP) + Rabies	\N	15	22	t	2026-09-03 07:57:39.878741	2026-09-03 07:57:39.878743
97239c0b-f04d-4ad2-9a85-04d343bfb3d6	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	ef5718d4-2014-4175-a712-fd3ce63ae713	Complete Pet Blood Count (CBC) & Chem-10	\N	20	38	t	2026-09-03 07:57:39.881281	2026-09-03 07:57:39.881282
335b5184-f265-4ace-b5fa-846c6611e20c	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	26539f80-bc35-43e7-9094-cf1ae71f6a4c	Pet Fracture Fixation Consultation	\N	30	45	t	2026-09-03 07:57:39.893145	2026-09-03 07:57:39.893147
bebc7fbd-f13b-4ad1-ae04-48227ab3062b	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	26539f80-bc35-43e7-9094-cf1ae71f6a4c	Canine Soft Tissue Spay / Neuter Procedure	\N	45	75	t	2026-09-03 07:57:39.895847	2026-09-03 07:57:39.895849
e99d0866-36cd-4233-9edb-a1ff910ec330	c9c2a60c-b15f-42ea-a0ae-931ecf59b311	4f492e80-4667-44b6-9464-b7b6eaa7d4dd	Emergency Animal Poison & Trauma Stabilization	\N	30	50	t	2026-09-03 07:57:39.913214	2026-09-03 07:57:39.913218
586b833b-76cc-40cf-8cc2-c7c7da8de347	c9c2a60c-b15f-42ea-a0ae-931ecf59b311	4f492e80-4667-44b6-9464-b7b6eaa7d4dd	Pet Oxygen Therapy & ICU Monitoring (per hour)	\N	60	30	t	2026-09-03 07:57:39.925981	2026-09-03 07:57:39.925984
de11f32e-fec5-4a43-8070-feea762df2c2	b8e5a5bf-2589-4959-a372-0bd16eabb4e6	a3feba76-3e96-4de5-8122-1d86b53f21a5	Pet Wellness Health Checkup	\N	15	15	t	2026-09-03 07:57:39.95234	2026-09-03 07:57:39.952343
e93c5b54-0e4f-439e-bea5-f49cfe3bdb08	b8e5a5bf-2589-4959-a372-0bd16eabb4e6	a3feba76-3e96-4de5-8122-1d86b53f21a5	ISO Pet Microchip Implantation & Registration	\N	15	20	t	2026-09-03 07:57:39.95558	2026-09-03 07:57:39.955582
\.


--
-- Data for Name: ticket_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_logs (id, ticket_id, from_status, to_status, actor_id, note, "timestamp") FROM stdin;
bb235988-e407-48b7-b6ac-c2752ab25702	a2659b4e-7f1f-414d-83e8-1d8aab9a1f9c	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket booked online via Patient Mobile App	2026-09-01 09:16:03.286529
d05123d6-7ca2-43c0-a298-aac23a875d46	a2659b4e-7f1f-414d-83e8-1d8aab9a1f9c	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started in Room 204A	2026-09-01 09:53:03.286598
8338a0cd-9a8e-4651-a673-2dca5236516f	d4b30d1a-0c1c-4188-9e1f-156e6c2c65f9	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:10:27.560641
d603c04a-836a-4951-9d51-9bcd201e87d2	66da68b1-0b84-4b44-9903-72103639b956	WAITING	CALLED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient called by Dr. Sokha Meas	2026-09-01 10:10:29.293067
8f3ab84f-f079-4f2b-896f-d54a9f685b76	d4b30d1a-0c1c-4188-9e1f-156e6c2c65f9	WAITING	CALLED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient called by Dr. Sokha Meas	2026-09-01 10:10:30.435159
e08550ce-0ad3-4017-a661-f472863d7ea5	ce9298f6-5ce8-4dc5-beb4-66ce0bd852e8	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:11:45.878502
fc6782cb-16cb-44b6-96b4-d28aad17141b	de4bdf32-d847-4d3c-878d-8de1d8147031	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:11:46.340279
dfb5e823-124a-4279-ae1d-5d55ff8a24e0	36620259-55cf-4576-b66b-49a1bc9a480d	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:11:46.886419
2d290520-e576-4236-b66c-52d1fd059876	f921d657-2bd5-4c59-ada3-d94253009125	WAITING	CALLED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient called by Dr. Sokha Meas	2026-09-01 10:11:47.09458
8533ca42-631c-4a35-95f3-b00c8a4e76ec	f921d657-2bd5-4c59-ada3-d94253009125	CALLED	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:11:47.275223
7e9a460b-511c-4767-9f70-ae0447f35e64	f921d657-2bd5-4c59-ada3-d94253009125	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:11:47.388643
2636a653-6baa-48df-b544-06aa01a8884b	0f9d4d98-2093-424d-a00f-1fef316028fa	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:11:48.208568
686da206-007e-46e2-8e04-99bbf89c9f4a	0f9d4d98-2093-424d-a00f-1fef316028fa	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:11:48.290532
9c6310cc-f873-47af-b54a-33fbd8933402	fd4c9d5e-ab73-4889-a97e-66c54bc887c7	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:12:39.124602
692ce546-9955-49a6-85c7-22725deee8ec	ea63811d-8941-4d03-b5da-e7fd64ec3c6b	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:12:39.54726
a72f3a05-6497-48d9-8e47-9a9694884728	5722b639-aa23-4c74-9b5f-2897700e8638	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:12:40.049756
6822dfe9-c61a-4db9-97ad-7b103cb105b2	eb0eebb1-6f0e-4261-980e-ec6a206f16ce	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:12:41.088066
4503bc8c-442e-4821-8fa9-5383767ad971	eb0eebb1-6f0e-4261-980e-ec6a206f16ce	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:12:41.261286
f5d0315a-9f07-44a0-b968-ff3334b26eb1	fe0cbdee-9ab9-4d89-a749-5e7466d9599a	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:13:31.384223
8cfadabd-db07-4668-91c5-2c19bc570851	d3c1e3aa-8dbc-4dbb-befc-ac8916de04f7	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:13:31.910743
a5f3bd2d-a673-46bf-88a9-f87261008bd7	d207bde4-7877-44af-bfa5-0f34ffe81288	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:13:32.506207
2f872a23-6b75-49a3-b08e-6b9f15c8dbcc	d207bde4-7877-44af-bfa5-0f34ffe81288	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:13:32.622403
384a4ea5-88f7-4a5b-a4ba-bb829b9d0681	d207bde4-7877-44af-bfa5-0f34ffe81288	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:13:32.751837
a656c865-2212-48c7-a221-0573d49a02ee	96dfb9dc-4973-40bb-9bc4-0ae9f9383482	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:13:33.366716
7b1e8fcd-dd49-410a-a702-341c60b42ddb	96dfb9dc-4973-40bb-9bc4-0ae9f9383482	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:13:33.488787
8ca030c9-b23e-45d3-ad61-837ec4c21ab1	be5a159d-1412-43a2-8657-70bcaca9c91e	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:16:02.351504
3e626de0-ef1e-4b65-b67a-3f85db409a6f	267d8acc-832c-4e32-a0a2-1cb2e7ec9f19	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:16:02.857071
8c8a1c4a-23b6-4b08-ac9c-3e31aa1f7d84	e656e97c-6ef0-40b5-8cc6-bdf447842046	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:16:03.267871
da50e69d-f862-47e5-a7d7-588481527513	e656e97c-6ef0-40b5-8cc6-bdf447842046	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:16:03.382454
e82d8dae-58d5-425a-bc21-b24f5aa29043	e656e97c-6ef0-40b5-8cc6-bdf447842046	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:16:03.485913
c70c04b1-8a5a-4bf9-8027-706ea4331ba9	9b12d8dd-0ad7-4a16-9cde-6b9b3d7775eb	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:16:04.026421
f7ad2a41-b91b-4eb7-86de-4d219ddc26db	9b12d8dd-0ad7-4a16-9cde-6b9b3d7775eb	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:16:04.138932
e62e657a-ce54-437a-afb4-dfb202af999f	14e1c34c-1701-4618-aa09-5293d89c3599	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:19:25.973762
4e901d61-b487-4484-a0c7-7970063e3723	c0447514-3a02-42de-ba66-c4598a72ffcb	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:19:26.393086
81bf8049-3423-400c-8b1c-ae28a7bf9c0c	d1914039-a6aa-4277-8f21-b6ec3f3ab500	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:19:26.905163
1fde2979-8da9-4ab2-9eb7-2111ce634898	d1914039-a6aa-4277-8f21-b6ec3f3ab500	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:19:26.997286
209dc7bc-dc08-4f2a-816e-1fd0574ff88f	d1914039-a6aa-4277-8f21-b6ec3f3ab500	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:19:27.111413
f4d8163d-c90d-493a-91a5-1e9db5bbd47c	daa1ae2f-79a8-4bea-9b41-70673813e890	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:19:27.657839
a06b3fd6-e4aa-4b75-bb76-635c4421c5ab	daa1ae2f-79a8-4bea-9b41-70673813e890	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:19:27.743295
64dee08b-cfa2-48ed-9ee3-1e051bc96cd5	c3905560-325d-4c3f-ae19-73820a732282	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:19:57.687189
44e28e8a-a463-49df-b571-7263fb8d76f1	dc700abe-9e10-422a-be09-d73e56fef30b	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:19:58.102775
a72675ea-bc1f-4f96-863d-f0b06d4d11f0	f9969a06-cf79-453a-95ca-cd2c3780cfc5	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:19:58.523635
53491329-720a-467e-9dab-5df394d53b66	f9969a06-cf79-453a-95ca-cd2c3780cfc5	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:19:58.603262
6ae594c8-eb37-41ec-b0a7-dbf3f842edd8	f9969a06-cf79-453a-95ca-cd2c3780cfc5	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:19:58.702889
02ddb240-93c6-4a0e-a93e-55c20c983310	c6dc7bf0-2bbc-49d7-b6a1-ec234c92bc31	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:19:59.279482
988fd9fe-ab3d-4206-a899-26dee99ea178	c6dc7bf0-2bbc-49d7-b6a1-ec234c92bc31	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:19:59.389571
88c6dff5-da54-4251-a7b7-f9c740b6cf7f	788b940f-abdb-421b-a175-795de5e02b8a	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:22:20.580786
a4ea38e6-f76a-45a9-ad52-ac855035223b	d215eac7-61c0-4b34-929b-da67051f0a2d	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:22:20.976557
bbca3304-c10f-47a6-b7e2-c709de10e21c	3d7f6b43-aa1c-471b-b01f-8c9cf6d9877e	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:22:21.480217
c0204651-5448-48b9-ac93-bff0cedd9ab1	3d7f6b43-aa1c-471b-b01f-8c9cf6d9877e	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:22:21.585458
6f546c5a-76bf-4fc7-a11a-623c089af05f	3d7f6b43-aa1c-471b-b01f-8c9cf6d9877e	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:22:21.697004
d5ecc343-d70f-4319-8638-ca8baf37f076	7c805735-4ae8-4a00-8569-07fb21cb22f3	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:22:22.240274
cf97f86b-941f-421c-96f2-0fa772fd3802	7c805735-4ae8-4a00-8569-07fb21cb22f3	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:22:22.312605
a9c0888b-30da-4b12-adb4-aabfa55bcda2	228bfaae-e14c-4705-b734-689a7912dd93	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:24:07.867225
e95573e7-41d0-4c3e-8052-46194b28bd9b	fe7bdb5a-b082-4d75-aebc-194ef1cdbde1	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:24:08.291254
398fa6be-ec31-478c-bb6c-9417af659a94	a57c95bb-a85f-4ed9-966d-87c3135b7e72	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:24:08.742199
4b0aeff3-1456-4244-9d60-f130755f860d	a57c95bb-a85f-4ed9-966d-87c3135b7e72	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:24:08.843865
ca9db5df-5451-452b-9c2b-1434b5fb565e	a57c95bb-a85f-4ed9-966d-87c3135b7e72	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:24:08.947499
979cf6cb-855e-4ca8-9472-64744bb17c10	4e30747a-5c64-4a42-b319-8e836ae9bff7	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:24:09.622157
92446361-1c2e-4d2d-9050-26d9b8f6f0b0	4e30747a-5c64-4a42-b319-8e836ae9bff7	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:24:09.72927
3d290c0d-a513-46ef-83ee-9e59f867bd3f	6ae70a37-9c6d-40f5-b7e4-94972f33a850	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:24:51.526509
a568dfdd-0046-467e-a0b7-803f9362d491	56a61efd-6ca6-4b64-94d9-c51ac7c94640	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:24:51.89737
cccfa32a-634b-4a33-9100-d0437b23ed59	74495da5-f1f3-4714-b53f-d4fc821b740e	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:24:52.343468
b8ade440-1906-4d3e-8f52-c3403315e349	74495da5-f1f3-4714-b53f-d4fc821b740e	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:24:52.426177
5c53a348-ca3f-414e-904d-381238ae0b13	74495da5-f1f3-4714-b53f-d4fc821b740e	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:24:52.533945
593c8cb7-e09d-45c1-93a1-f20e019ca5b2	bb3fafc7-b400-4ba2-ad89-cd7da58b3e0a	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:24:53.07097
2d77a517-388c-4ca7-9e9e-33435650c395	bb3fafc7-b400-4ba2-ad89-cd7da58b3e0a	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:24:53.158667
4b528615-cb00-419d-ab2f-c6ec42077f30	5353cfd2-add5-403c-a343-5f0546fb7915	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:25:14.767356
f68a94ef-017c-407f-9606-be9ddc9b2ffa	cd8b9c06-8f1e-4e23-8dac-12645202c9e0	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:25:15.157262
58309f55-b1e2-4b19-b0be-5098bc68150f	228f5d44-906f-4550-a535-dbbe903a45e6	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:25:15.608076
fb0b5b22-e9a4-4611-91a9-a3d3a7b5541f	228f5d44-906f-4550-a535-dbbe903a45e6	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:25:15.687381
ca03ff1f-5df5-476b-931c-16578c9a8b01	228f5d44-906f-4550-a535-dbbe903a45e6	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:25:15.808762
1698e635-afbd-439b-8077-dc782a23fd16	2bf8352a-b068-4cc0-a78c-7366cac9b216	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:25:16.339409
f3e199e1-3277-470e-88ac-00b0925bc3c1	2bf8352a-b068-4cc0-a78c-7366cac9b216	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:25:16.433836
306e570f-cff0-4c7f-b34b-917a7c6befcd	dd304a90-97dc-4f09-998d-60b314d75bb7	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:27:01.93874
242020fc-d73e-4708-99a9-0aec08c9d001	e21c17fb-8973-45b9-869c-ccddb03cd179	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:27:02.329924
94919dfe-f4c6-4168-83fb-0dde866eb7af	e8ab61c5-4611-4fc4-a7f6-948b42a983bf	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:27:02.842745
29e2db10-2da0-4424-9c4e-fe50a62c79f2	e8ab61c5-4611-4fc4-a7f6-948b42a983bf	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:27:02.922298
5afbe6b0-0b04-4d85-b088-27f2a49e9c90	e8ab61c5-4611-4fc4-a7f6-948b42a983bf	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:27:03.024594
328d90a9-53d5-48cb-8513-983f143e0e9c	fa15dfe9-b0f6-4096-9251-0778a5134dbb	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:27:03.619314
0368886d-1965-46d3-9c03-d44fd0dcfd1e	fa15dfe9-b0f6-4096-9251-0778a5134dbb	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:27:03.717611
360f81d5-9f73-42dc-bdd3-75d8fd116dbb	f4bd0923-dec3-465c-9928-9c670fecab84	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:29:49.860655
a2f7d2b6-f356-4095-819b-f3f54c64c21a	9e34700c-c012-43a0-9871-5d13176b4f88	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:29:50.384934
24b3d492-5478-4540-8afe-bd30c294314b	5a9dd5c2-188b-424a-b9c1-150479f0fdd7	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:29:51.17887
4ced3cd2-2b23-4e23-878d-3af99ff11b74	5a9dd5c2-188b-424a-b9c1-150479f0fdd7	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:29:51.486085
299fae38-37e9-4c9b-afdf-158c7ca3b678	5a9dd5c2-188b-424a-b9c1-150479f0fdd7	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:29:52.079021
4286f6ea-5ee3-46c7-809f-5d0bca6e7ead	b92f93c6-5049-4611-b591-bd1add2684dc	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:29:53.689482
a99ec4a1-2bd4-4fd7-8d2c-abf990d1f8cb	b92f93c6-5049-4611-b591-bd1add2684dc	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:29:54.020506
c616f006-1fa4-46ae-855b-ee9f6a3b15f7	15edbe0d-fec2-492c-afa3-71e47d08d230	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:30:43.388078
f6622864-2d4d-45bd-97f9-545c2112de1b	85d1e85f-a0a1-4391-88ba-748dff777b17	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:30:43.816914
7c1e3d1d-fd49-4a0d-bb2a-c60a631a57d2	ba5e6681-985a-498c-9d6f-bec6ae4e206a	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:30:44.30749
8988f8a8-a8b9-47e1-9c27-db45161d43a6	ba5e6681-985a-498c-9d6f-bec6ae4e206a	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:30:44.400605
00a6ffe7-f67b-4bfd-b58b-961e6fe93f4e	ba5e6681-985a-498c-9d6f-bec6ae4e206a	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:30:44.505677
5937c8db-10a5-4384-980a-85a47a40a2a3	95909ddb-16a0-4094-bd9f-f23900150816	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:30:45.064622
40ea8df9-cd5b-4948-94b4-1b67ca864fba	95909ddb-16a0-4094-bd9f-f23900150816	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:30:45.147568
64bc9838-e2b4-451b-bc65-cf492326c0c3	c6ec1ab7-909e-4ad9-b4e3-d655b50190cc	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:31:41.919355
6b13b225-e1e1-4fc6-ba32-5c106dc706cd	1acc510b-df46-449b-ace4-0afc01ffffe4	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:31:42.419302
23b8f77d-bca0-484c-b405-8619be5888b9	0ccb1a0d-9e98-4ad4-ac02-c7410b2576d2	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:31:42.875851
cef33931-1a0c-4533-acfb-e4db72e54e2d	0ccb1a0d-9e98-4ad4-ac02-c7410b2576d2	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:31:42.974723
ae368b17-fbaf-47c3-a6bd-12d85e9fc151	0ccb1a0d-9e98-4ad4-ac02-c7410b2576d2	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:31:43.052994
2c6747f0-6996-482a-8dc6-7143833f8a9d	e2f0c8cd-4824-4532-92a0-3f2cc984235a	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:31:43.519151
8c305eb5-ce36-40bd-9215-88479fce1dec	e2f0c8cd-4824-4532-92a0-3f2cc984235a	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:31:43.588166
d8bd40a8-dfd2-4b8d-80c1-8c5ea9bf3149	65cf43f6-a98d-414c-8697-299b961e81de	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:34:36.688567
7cb0dcc1-ed70-4138-aa6c-c24eb6b2eb57	ce127420-a371-4b25-96a4-abe8541ff146	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:34:41.214358
fd94a602-9758-411d-875b-ca9c62e84684	692a1d17-e541-4670-9df8-7750f53d1920	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:34:41.789264
abe4966e-6a6b-43fe-92b0-eff45ea9e6ad	4b3aac61-bcf1-4cb1-ae42-51c929c647c6	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:34:42.292679
c273fb95-9b7d-4310-9f16-1cc6a19d5df1	4b3aac61-bcf1-4cb1-ae42-51c929c647c6	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:34:42.37925
88b70c99-c950-4931-8e73-a25c20dc43bd	4b3aac61-bcf1-4cb1-ae42-51c929c647c6	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:34:42.473465
ca481831-74ad-44e8-a86e-55416627036f	12231fd8-df12-43e6-904f-ea065ec7e76c	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:34:43.004947
07fac205-44cc-4b4b-a93d-092bbd049122	12231fd8-df12-43e6-904f-ea065ec7e76c	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:34:43.082263
acbf87aa-0169-4885-9e2b-9b55bbb33a29	66ea792e-b08a-4e22-8f0f-a65f10ce512e	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:35:08.545176
a7f8ff2e-25df-477e-a10c-2d48aff224d4	c0182fd1-344b-4bce-be74-42182c3e2d75	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:35:14.088996
208eb841-c361-41ea-a292-30f935730213	fe094201-4e3e-4024-b449-eca2112d169f	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:35:14.640955
17d49da8-3138-44aa-89ea-3263cbc5f8db	7f79e205-4eee-4667-84b8-dd7403628c7d	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:35:15.286699
17e717f2-a63a-46b5-b852-7af31da034ec	7f79e205-4eee-4667-84b8-dd7403628c7d	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:35:15.41172
b87af204-3f5b-43df-ab6d-163515ac9b4f	7f79e205-4eee-4667-84b8-dd7403628c7d	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:35:15.567337
43386ea0-6486-4141-9d2c-bbdb56b4a23d	3c2a1671-55c7-4bd5-b40e-b9d9e0183daf	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:35:16.268385
7a90b46b-efdd-4d48-a536-9fd96dbd2188	3c2a1671-55c7-4bd5-b40e-b9d9e0183daf	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:35:16.393408
58942d73-038b-4d52-a2ab-9130d5c90cda	4783bda9-fbb0-4948-90a7-53dd1451a230	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:41:51.627328
f23d69ff-079f-404b-8338-22dbfc8ed069	5cf49176-9521-446b-831b-e3becb9bc664	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:41:55.4976
550a5648-f006-47fb-8ea2-b37c32a31bb7	fc41ad18-f064-4a34-a2e7-294987de912d	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:41:55.87572
9a737c0d-1b9b-4bb8-8add-84b104969cec	66d0453e-b722-4b0c-8420-c4579f0eb0b1	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:41:56.303091
3ee6fba7-b403-4966-a644-9bbdab5eb7c7	66d0453e-b722-4b0c-8420-c4579f0eb0b1	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:41:56.387455
1e94fc36-ce03-4a8c-9925-1e781e28dbd8	66d0453e-b722-4b0c-8420-c4579f0eb0b1	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:41:56.492904
1707da50-9fe0-4101-8c80-0c9699a41856	763f6db2-c6bb-477a-a97e-b30ba3b7bc86	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:41:57.025701
300b424a-e951-4fd5-8e7d-8d9f0f5ff6f6	763f6db2-c6bb-477a-a97e-b30ba3b7bc86	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:41:57.103892
968214e9-3b27-40aa-b442-c1868d3bd9f2	f429ff0d-525d-4710-a3cb-cf05931164bc	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:42:46.204197
ae761ea0-876d-4c7f-8b10-6dd585ed6efd	c9c961db-332b-4765-9965-f891c88210a1	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:42:50.11854
1a342779-6c04-4f86-8e54-76e8a79d4131	5e6bf07c-743c-40bb-90f7-de5a3b20375f	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:42:50.541831
baabdb64-a8b7-4fef-b955-3197178dc10d	febb2aa1-88f0-4a18-8772-46ae7bd3f0a8	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:42:51.00806
0fc5c749-4ddf-43fa-ad07-47ae2825d36a	febb2aa1-88f0-4a18-8772-46ae7bd3f0a8	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:42:51.097641
930b49ae-9830-4229-84ae-a8d42ee47621	febb2aa1-88f0-4a18-8772-46ae7bd3f0a8	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:42:51.176558
74aa473d-8b72-4a31-8dfe-a46e74d0bde2	6c25d63f-9c44-4549-a7a4-3b3a09b7fe80	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:42:51.839293
11edf690-851a-4783-84e1-f0213cb67912	6c25d63f-9c44-4549-a7a4-3b3a09b7fe80	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:42:51.935196
4dab64e8-13bb-4c9f-9c1d-b07212b03680	47056711-bc11-4b82-b90a-c89f6a0c8b87	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:46:09.444377
938a4bf7-88ae-4246-9b0b-605a5ae79a0e	6e79a4b7-6167-4db2-8e7b-2643c4309f93	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:46:13.278455
5870a133-808b-4137-b9b1-4fb4f7aaf519	9932fa69-0bbc-4a8a-a4ed-fe34861ee0f4	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:46:13.73421
fcc52ff5-dafa-4b0a-aa5e-c33b60377ed1	c43f6bda-e76c-4fb7-9f8f-1d02ea7b15e5	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:46:14.230151
ec3d3bb1-3e56-487a-b676-112e675daec8	c43f6bda-e76c-4fb7-9f8f-1d02ea7b15e5	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:46:14.30738
f3690315-9bec-4866-bd5e-8b6491d91cdb	c43f6bda-e76c-4fb7-9f8f-1d02ea7b15e5	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:46:14.402071
93dbe0d1-01a1-4309-bb76-15269d2313da	45267ef1-1eaa-4c11-9c62-faa4e459a357	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:46:14.912087
1b84ad38-7e0c-4d5f-aeee-42decdf979b2	45267ef1-1eaa-4c11-9c62-faa4e459a357	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:46:15.032142
999c8ab9-00b1-44a5-9443-52aca562db84	e019a7d1-4661-49ab-aeab-789410019531	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:49:25.148955
f90de855-99a4-43ad-93dc-c83bf0419cdc	4d49f7fc-d37c-4fc0-b485-590b7b69a295	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:49:26.809
c874cbb6-1ec1-4b6e-9f49-0f2c84ac57c8	fe36ec67-29e1-4a79-bc71-a156c06a04ee	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:49:30.981833
a3a21dcf-9d08-494d-a16b-6839a266ed2f	7dfe8de3-719c-4424-bd3f-fd1568c49aa9	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:49:31.406267
93e5fe8f-1e01-4cba-9a67-bd181b1b2dd2	8808ea85-c047-4540-a34a-d317c2dea79c	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:49:31.913376
4663d20b-b4d3-442f-8441-fbca52933c42	8808ea85-c047-4540-a34a-d317c2dea79c	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:49:32.022612
1b72c4f6-10d8-498b-ab8a-6a25a388198d	8808ea85-c047-4540-a34a-d317c2dea79c	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:49:32.146615
e3fc13d8-839a-497b-a45d-7fb2861b1dd0	0f62c960-1803-4315-bcf6-202384851bb0	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:49:32.803957
f072e4f2-e82f-4388-9641-d5ec7949102d	0f62c960-1803-4315-bcf6-202384851bb0	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:49:32.924581
274fb97a-285c-4468-a630-c0d07efdd0c8	6dd4c96e-acc3-42ad-b7a3-7252a1ff8e57	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:50:14.334734
9998e2c4-fc8c-4b2d-8c15-817b75d50ca0	ce9298f6-5ce8-4dc5-beb4-66ce0bd852e8	WAITING	CALLED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient called by Dr. Sokha Meas	2026-09-01 10:50:14.807225
0953f23f-a7a1-4709-9422-11de36f1ee0b	ce9298f6-5ce8-4dc5-beb4-66ce0bd852e8	CALLED	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Started clinical consultation	2026-09-01 10:50:14.929118
05a113d3-9eb8-4126-af25-75abf3a31910	ce9298f6-5ce8-4dc5-beb4-66ce0bd852e8	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient treated successfully	2026-09-01 10:50:15.029677
67c3ec59-f690-4c98-873f-3f4bf143e491	c1cdd0e2-eaa1-4c24-a73e-e54c0bb30f2a	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:50:15.156605
70e39e22-525d-404a-9adc-7844130e5ce9	4600f3a3-3422-4b70-9293-ef8a00765e31	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:50:17.20489
8dbd3bc1-039f-4c1f-be61-8054787f4625	8996dd93-55d7-4267-88df-cee68befabfa	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 10:50:21.852977
965f5728-f6bb-4658-9f00-c7a625ce0ee7	795f74c4-e20a-48e2-887f-1030618f5f2d	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:50:22.38404
f5d4929f-81f5-491b-a94c-b492daf36f6c	00a2fe03-d092-48b7-a959-04623cea784d	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:50:22.948101
02d15934-14fc-4f30-a582-e7fdcb3bb352	00a2fe03-d092-48b7-a959-04623cea784d	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 10:50:23.091795
2b92aa1f-360a-4c93-9ccb-85e95ffff9b4	00a2fe03-d092-48b7-a959-04623cea784d	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 10:50:23.215482
7f3cf0bb-0099-496d-b873-bd3a3c97f3ff	fca5b8d2-19c4-4ba6-bdcd-ccff517c1374	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 10:50:23.753974
221ec662-02da-4355-ae9a-e52de10febf0	fca5b8d2-19c4-4ba6-bdcd-ccff517c1374	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 10:50:23.836604
8f5c6f48-d3b1-46a2-999d-3b64f22df091	3f5ab0e8-08da-4610-a8f2-70dce659da3c	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 11:04:38.783109
782b3526-532b-4ae1-8336-332d170630be	de4bdf32-d847-4d3c-878d-8de1d8147031	WAITING	CALLED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient called by Dr. Sokha Meas	2026-09-01 11:04:39.284702
2be2e562-ca7c-4517-b74f-f9683c41c55b	de4bdf32-d847-4d3c-878d-8de1d8147031	CALLED	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Started clinical consultation	2026-09-01 11:04:39.393087
ef063de5-afdc-417a-aa9c-c954ff179fe8	de4bdf32-d847-4d3c-878d-8de1d8147031	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient treated successfully	2026-09-01 11:04:39.509041
7cca7261-5a61-42a6-a26c-0eda93c087e2	db07152d-df5d-4b85-b938-0e88f7c89e0b	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 11:04:39.664208
fd6e3a9f-1641-4bb9-9d42-cdd00eeaf503	8920f411-8092-443d-bbbf-ea02c4932993	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 11:04:41.595044
44336b4e-fbba-4dfe-a622-28cd9f029682	aa84d7e7-9519-447a-a7b1-cfbc8133c7b4	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 11:04:45.5321
b530510f-59fd-4f60-ac1f-623e71ed9025	73e20770-f69c-4336-abb0-32655164c799	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 11:04:45.958073
922b6c05-429f-4bb2-a6d6-34a626e90b9d	7304a2ff-ee14-41dc-b983-cc312f8de4b1	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 11:04:46.423781
1c5488fd-20fc-49e8-b858-b631e54c48f9	7304a2ff-ee14-41dc-b983-cc312f8de4b1	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 11:04:46.511225
756527f4-e9c3-4ea1-a8c7-37ed91ccf627	7304a2ff-ee14-41dc-b983-cc312f8de4b1	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 11:04:46.615681
6ede3d52-f8ef-4102-8e61-cec3e25612b4	a7e168c2-37e4-428b-936a-1ec14e4b21a2	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 11:04:47.305479
fac9722c-bec2-4e77-944c-25dac9242979	a7e168c2-37e4-428b-936a-1ec14e4b21a2	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 11:04:47.414497
edbf421e-89d4-4731-9d7c-e121af49c412	b707a759-10b7-49a1-bffa-85f81aa584df	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 15:10:22.063423
9b802781-3373-459d-9c30-e6b16b2834ac	36620259-55cf-4576-b66b-49a1bc9a480d	WAITING	CALLED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient called by Dr. Sokha Meas	2026-09-01 15:10:22.745288
81924173-53a9-493b-8683-ee41d9b1ce32	36620259-55cf-4576-b66b-49a1bc9a480d	CALLED	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Started clinical consultation	2026-09-01 15:10:22.886682
64ee046b-0d8b-4867-b869-990735fc25eb	36620259-55cf-4576-b66b-49a1bc9a480d	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient treated successfully	2026-09-01 15:10:23.040855
281f8b00-3202-4974-858f-49ac5195c6b5	afb98663-52a0-4c2e-aa6c-85d7743421f4	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 15:10:23.326424
7d4975a7-f67d-4ad7-912a-2cb999695ca8	bebed529-ab97-48b1-af55-798acce6bcf9	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 15:10:26.477856
9471d3c9-44a0-4792-b0a2-cd292a2e044a	4697f386-debc-4c2b-9d9f-44b45f215acd	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-01 15:10:32.813652
312e0ccd-df6a-46f5-87af-241791530093	83e57131-4a44-4a47-9092-fabed7e1f507	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 15:10:33.507069
25e4f277-3d06-4196-9dfc-ab5bf818e49f	7ee28082-f283-412b-8a3d-7377467797ce	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 15:10:34.452527
88a95c89-0356-4f0e-a6a6-22589fc26744	7ee28082-f283-412b-8a3d-7377467797ce	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-01 15:10:34.725809
14388763-811e-42b5-a8cb-f5fdc4a118f2	7ee28082-f283-412b-8a3d-7377467797ce	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-01 15:10:35.007357
69130ad5-d2ed-4183-8e13-a2c28b74a7ca	ed60d066-05d3-46b9-bb29-1e8327b14311	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-01 15:10:36.063002
a8f736d5-c111-4b0e-be19-525d79f297a7	ed60d066-05d3-46b9-bb29-1e8327b14311	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-01 15:10:36.320082
bb6ff49a-3bb2-408f-936f-6f31798a6a8d	bf6b4c2b-54ac-438e-9025-6865eb2b2217	\N	WAITING	\N	Ticket issued via ONLINE	2026-09-03 06:50:39.788412
29f48c56-d0c5-47a0-9e36-fc4555da5dae	0eecabab-8713-4e4f-a4ec-c2ff30665eac	\N	WAITING	\N	Ticket issued via ONLINE	2026-09-03 07:06:08.210247
be581128-d7ac-400d-8025-6fc99d7607a1	fe6d9585-7d11-489a-924d-ac4d31e1d809	\N	WAITING	\N	Ticket issued via ONLINE	2026-09-03 07:15:33.433154
10d6ebe3-ee80-49e3-8684-a5f07565d91d	f38ed54a-12ba-42a9-a3bf-9cd55ed34c05	\N	WAITING	\N	Ticket issued via ONLINE	2026-09-03 07:22:10.949643
d919ddb0-926a-4be4-bba7-e728d645523d	ac9dcf01-5f48-4692-a5bd-1709014b34d1	\N	WAITING	\N	Ticket issued via ONLINE	2026-09-03 08:01:25.373823
f4179383-5f33-426a-9ca1-30524726f23e	fcf6b058-284b-4e26-b813-3c1b4905a825	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-03 08:16:54.45404
66e367f3-af75-4906-9d61-b521383a8fc0	fc5b0ca0-82dd-413a-b56b-ee0d67e7d6bb	\N	WAITING	\N	Ticket issued via ONLINE	2026-09-03 08:50:46.31653
2cf716ec-f68f-4a4b-9f4a-4fa4d70f31bc	6525e01d-8e06-48cb-b209-4c37ea51404d	\N	WAITING	\N	Ticket issued via ONLINE	2026-09-03 09:22:13.911675
7a01d4a0-3b86-40b6-96ab-de370824b68f	bf6b4c2b-54ac-438e-9025-6865eb2b2217	WAITING	CALLED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Called from Counter Console	2026-09-03 10:15:05.908536
419f531b-c164-41b2-904c-c362ff24a8ad	bf6b4c2b-54ac-438e-9025-6865eb2b2217	CALLED	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-03 10:15:14.777624
15402df9-9934-43a1-873d-c920c5f76034	bf6b4c2b-54ac-438e-9025-6865eb2b2217	SKIPPED	CALLED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Recalled from Counter Console	2026-09-03 10:15:20.455973
057bd37e-6597-417a-aa2e-cddffb21bb26	bf6b4c2b-54ac-438e-9025-6865eb2b2217	CALLED	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-03 10:15:26.248905
612e7148-7ea3-43b6-acc4-cb73cf1fba8a	de18fda3-c8d9-4553-b671-d9f876a2abb1	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-03 10:31:07.966522
9e6fef71-2f7f-49c5-a1d1-277f0e615dac	b291dccc-850c-4989-aa52-7a7d8ce4bb67	\N	WAITING	\N	Ticket issued via ONLINE	2026-09-04 01:59:05.329474
38239f04-1e09-47e1-8f8d-b55bb930b5e4	4cf644d8-b277-4e87-998a-b6956b459e7d	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-04 02:51:22.890259
4db162cc-f81a-4226-8b2c-ee736f5bcbd6	4cf644d8-b277-4e87-998a-b6956b459e7d	WAITING	CALLED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient called by Dr. Sokha Meas	2026-09-04 02:51:23.269847
5e40b98c-ad55-46b9-bf1e-56482c1e8304	4cf644d8-b277-4e87-998a-b6956b459e7d	CALLED	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Started clinical consultation	2026-09-04 02:51:23.347804
37b311f9-7d89-42de-bfba-83c30c9cfdf5	4cf644d8-b277-4e87-998a-b6956b459e7d	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient treated successfully	2026-09-04 02:51:23.428185
926c7566-605a-4686-81da-9fd698b13a12	6305b181-e9fa-4515-8bcf-92d71d225d11	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-04 02:51:23.536494
5166a158-01a0-4251-a75d-bcd1ffdadc30	13b069d2-8565-4711-af9d-84fe05e8fe1f	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-04 02:51:25.605146
64a60123-72b4-429c-815e-2eb9c15770b9	36f19bf0-a2d3-4c74-8d5a-b783ed687993	\N	WAITING	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Ticket issued via ONLINE	2026-09-04 02:51:29.924372
7e552530-c6c4-429d-9ec9-9f08ee48bcd0	16142f21-6f99-4bec-af47-e9ef9a553819	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-04 02:51:30.273924
d4c37bee-8e86-4ed3-9f7a-2273e4af740a	6f92046d-b77a-4b9e-9c96-b65319e3cffb	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-04 02:51:30.657184
f18e4bcf-4f65-4e58-b49c-d00803098730	6f92046d-b77a-4b9e-9c96-b65319e3cffb	WAITING	SERVING	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation started by Dr. Sokha Meas	2026-09-04 02:51:30.724931
d9f8a567-ccca-456f-9c59-6826893567f2	6f92046d-b77a-4b9e-9c96-b65319e3cffb	SERVING	COMPLETED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Consultation completed by Dr. Sokha Meas	2026-09-04 02:51:30.807552
506541d2-9cf7-4c74-b065-e86c90e93dee	5a82bd3f-ca0c-4f46-99a9-05fb91a231f9	\N	WAITING	\N	Ticket issued via WALK_IN	2026-09-04 02:51:31.251176
62e195cc-1965-474a-860e-61651307c51c	5a82bd3f-ca0c-4f46-99a9-05fb91a231f9	WAITING	SKIPPED	e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	Patient skipped by counter staff	2026-09-04 02:51:31.316634
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, ticket_number, queue_session_id, hospital_id, branch_id, department_id, doctor_id, service_id, patient_id, patient_name, patient_phone, ticket_source, status, "position", estimated_wait_minutes, called_at, serving_started_at, completed_at, created_at, updated_at) FROM stdin;
a2659b4e-7f1f-414d-83e8-1d8aab9a1f9c	CARD-001	f9153da1-28da-4b26-bbc9-ce075fa7d4c3	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	26818da6-35be-412e-8a5c-6b3da239625e	07db7693-e255-4dac-932b-cc7b92737b7f	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	SERVING	1	0	2026-09-01 09:51:03.267459	2026-09-01 09:53:03.267497	\N	2026-09-01 10:01:03.275294	2026-09-01 10:01:03.275297
66da68b1-0b84-4b44-9903-72103639b956	CARD-002	f9153da1-28da-4b26-bbc9-ce075fa7d4c3	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	26818da6-35be-412e-8a5c-6b3da239625e	1f6f5874-544e-4cc6-8cfb-fecf522134cd	1c4a4a5e-c6c2-4113-a7e9-61c01287a594	Sophea Rath	+85512999003	ONLINE	CALLED	0	0	2026-09-01 10:10:29.262182	\N	\N	2026-09-01 09:31:03.286676	2026-09-01 10:10:29.264138
e656e97c-6ef0-40b5-8cc6-bdf447842046	CARDIO-016	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	12	189	\N	2026-09-01 10:16:03.378095	2026-09-01 10:16:03.469065	2026-09-01 10:16:03.256281	2026-09-01 10:16:03.469841
d4b30d1a-0c1c-4188-9e1f-156e6c2c65f9	CARDIO-001	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	CALLED	0	0	2026-09-01 10:10:30.410539	\N	\N	2026-09-01 10:10:27.547698	2026-09-01 10:10:30.411627
14e1c34c-1701-4618-aa09-5293d89c3599	CARDIO-018	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	8	130	\N	\N	\N	2026-09-01 10:19:25.958085	2026-09-01 15:10:22.762707
ce9298f6-5ce8-4dc5-beb4-66ce0bd852e8	CARDIO-002	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	COMPLETED	0	0	2026-09-01 10:50:14.785081	2026-09-01 10:50:14.925797	2026-09-01 10:50:15.011112	2026-09-01 10:11:45.862418	2026-09-01 10:50:15.011719
228bfaae-e14c-4705-b734-689a7912dd93	CARDIO-030	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	14	250	\N	\N	\N	2026-09-01 10:24:07.852823	2026-09-01 15:10:22.762716
267d8acc-832c-4e32-a0a2-1cb2e7ec9f19	CARDIO-015	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	7	110	\N	\N	\N	2026-09-01 10:16:02.841501	2026-09-01 15:10:22.762718
f921d657-2bd5-4c59-ada3-d94253009125	CARD-003	f9153da1-28da-4b26-bbc9-ce075fa7d4c3	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	26818da6-35be-412e-8a5c-6b3da239625e	07db7693-e255-4dac-932b-cc7b92737b7f	\N	Sarith Pich (Walk-In)	+85598777123	WALK_IN	COMPLETED	0	0	2026-09-01 10:11:47.040514	2026-09-01 10:11:47.269592	2026-09-01 10:11:47.372369	2026-09-01 09:46:03.286717	2026-09-01 10:11:47.373203
6dd4c96e-acc3-42ad-b7a3-7252a1ff8e57	CARDIO-089	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999888	ONLINE	WAITING	47	910	\N	\N	\N	2026-09-01 10:50:14.320539	2026-09-01 15:10:22.76275
0f9d4d98-2093-424d-a00f-1fef316028fa	CARDIO-005	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	5	63	\N	\N	\N	2026-09-01 10:11:48.193737	2026-09-01 10:11:48.287982
788b940f-abdb-421b-a175-795de5e02b8a	CARDIO-026	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	12	210	\N	\N	\N	2026-09-01 10:22:20.562232	2026-09-01 15:10:22.762756
795f74c4-e20a-48e2-887f-1030618f5f2d	CARDIO-093	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	51	990	\N	\N	\N	2026-09-01 10:50:22.366424	2026-09-01 15:10:22.762757
7dfe8de3-719c-4424-bd3f-fd1568c49aa9	CARDIO-086	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	46	890	\N	\N	\N	2026-09-01 10:49:31.392938	2026-09-01 15:10:22.762761
85d1e85f-a0a1-4391-88ba-748dff777b17	CARDIO-051	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	25	470	\N	\N	\N	2026-09-01 10:30:43.789039	2026-09-01 15:10:22.762763
eb0eebb1-6f0e-4261-980e-ec6a206f16ce	CARDIO-009	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	8	117	\N	\N	\N	2026-09-01 10:12:41.054841	2026-09-01 10:12:41.254911
8996dd93-55d7-4267-88df-cee68befabfa	CARDIO-092	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	50	970	\N	\N	\N	2026-09-01 10:50:21.837544	2026-09-01 15:10:22.762768
9932fa69-0bbc-4a8a-a4ed-fe34861ee0f4	CARDIO-080	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	42	810	\N	\N	\N	2026-09-01 10:46:13.722967	2026-09-01 15:10:22.76277
9e34700c-c012-43a0-9871-5d13176b4f88	CARDIO-047	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	23	430	\N	\N	\N	2026-09-01 10:29:50.373547	2026-09-01 15:10:22.762772
aa84d7e7-9519-447a-a7b1-cfbc8133c7b4	CARDIO-099	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	55	1070	\N	\N	\N	2026-09-01 11:04:45.516534	2026-09-01 15:10:22.762774
d207bde4-7877-44af-bfa5-0f34ffe81288	CARDIO-012	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	10	153	\N	2026-09-01 10:13:32.613174	2026-09-01 10:13:32.733678	2026-09-01 10:13:32.494926	2026-09-01 10:13:32.734753
96dfb9dc-4973-40bb-9bc4-0ae9f9383482	CARDIO-013	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	10	153	\N	\N	\N	2026-09-01 10:13:33.354445	2026-09-01 10:13:33.483468
9b12d8dd-0ad7-4a16-9cde-6b9b3d7775eb	CARDIO-017	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	12	189	\N	\N	\N	2026-09-01 10:16:04.013368	2026-09-01 10:16:04.133432
d1914039-a6aa-4277-8f21-b6ec3f3ab500	CARDIO-020	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	14	225	\N	2026-09-01 10:19:26.993409	2026-09-01 10:19:27.08877	2026-09-01 10:19:26.890455	2026-09-01 10:19:27.090443
daa1ae2f-79a8-4bea-9b41-70673813e890	CARDIO-021	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	14	225	\N	\N	\N	2026-09-01 10:19:27.634339	2026-09-01 10:19:27.740707
f9969a06-cf79-453a-95ca-cd2c3780cfc5	CARDIO-024	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	16	261	\N	2026-09-01 10:19:58.599939	2026-09-01 10:19:58.688906	2026-09-01 10:19:58.510788	2026-09-01 10:19:58.689514
c6dc7bf0-2bbc-49d7-b6a1-ec234c92bc31	CARDIO-025	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	16	261	\N	\N	\N	2026-09-01 10:19:59.258813	2026-09-01 10:19:59.386683
3d7f6b43-aa1c-471b-b01f-8c9cf6d9877e	CARDIO-028	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	18	297	\N	2026-09-01 10:22:21.581393	2026-09-01 10:22:21.677868	2026-09-01 10:22:21.460901	2026-09-01 10:22:21.678479
7c805735-4ae8-4a00-8569-07fb21cb22f3	CARDIO-029	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	18	297	\N	\N	\N	2026-09-01 10:22:22.229657	2026-09-01 10:22:22.309477
a57c95bb-a85f-4ed9-966d-87c3135b7e72	CARDIO-032	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	20	333	\N	2026-09-01 10:24:08.837642	2026-09-01 10:24:08.930939	2026-09-01 10:24:08.72793	2026-09-01 10:24:08.932204
4e30747a-5c64-4a42-b319-8e836ae9bff7	CARDIO-033	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	20	333	\N	\N	\N	2026-09-01 10:24:09.609693	2026-09-01 10:24:09.724471
74495da5-f1f3-4714-b53f-d4fc821b740e	CARDIO-036	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	22	369	\N	2026-09-01 10:24:52.422079	2026-09-01 10:24:52.517522	2026-09-01 10:24:52.335077	2026-09-01 10:24:52.518132
bb3fafc7-b400-4ba2-ad89-cd7da58b3e0a	CARDIO-037	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	22	369	\N	\N	\N	2026-09-01 10:24:53.057475	2026-09-01 10:24:53.154945
228f5d44-906f-4550-a535-dbbe903a45e6	CARDIO-040	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	24	405	\N	2026-09-01 10:25:15.682917	2026-09-01 10:25:15.781882	2026-09-01 10:25:15.598472	2026-09-01 10:25:15.782778
1acc510b-df46-449b-ace4-0afc01ffffe4	CARDIO-055	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	27	510	\N	\N	\N	2026-09-01 10:31:42.406763	2026-09-01 15:10:22.762714
8808ea85-c047-4540-a34a-d317c2dea79c	CARDIO-087	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	51	990	\N	2026-09-01 10:49:32.018042	2026-09-01 10:49:32.120349	2026-09-01 10:49:31.887697	2026-09-01 10:49:32.121248
2bf8352a-b068-4cc0-a78c-7366cac9b216	CARDIO-041	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	24	405	\N	\N	\N	2026-09-01 10:25:16.327248	2026-09-01 10:25:16.430337
73e20770-f69c-4336-abb0-32655164c799	CARDIO-100	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	56	1090	\N	\N	\N	2026-09-01 11:04:45.936472	2026-09-01 15:10:22.762754
0f62c960-1803-4315-bcf6-202384851bb0	CARDIO-088	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	51	990	\N	\N	\N	2026-09-01 10:49:32.78067	2026-09-01 10:49:32.92061
e8ab61c5-4611-4fc4-a7f6-948b42a983bf	CARDIO-044	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	26	441	\N	2026-09-01 10:27:02.91762	2026-09-01 10:27:03.006161	2026-09-01 10:27:02.832567	2026-09-01 10:27:03.007335
be5a159d-1412-43a2-8657-70bcaca9c91e	CARDIO-014	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	6	90	\N	\N	\N	2026-09-01 10:16:02.332793	2026-09-01 15:10:22.762778
c0182fd1-344b-4bce-be74-42182c3e2d75	CARDIO-064	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	32	610	\N	\N	\N	2026-09-01 10:35:14.073592	2026-09-01 15:10:22.76278
c6ec1ab7-909e-4ad9-b4e3-d655b50190cc	CARDIO-054	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	26	490	\N	\N	\N	2026-09-01 10:31:41.900508	2026-09-01 15:10:22.762788
fa15dfe9-b0f6-4096-9251-0778a5134dbb	CARDIO-045	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	26	441	\N	\N	\N	2026-09-01 10:27:03.605332	2026-09-01 10:27:03.714951
c9c961db-332b-4765-9965-f891c88210a1	CARDIO-074	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	38	730	\N	\N	\N	2026-09-01 10:42:50.106174	2026-09-01 15:10:22.76279
cd8b9c06-8f1e-4e23-8dac-12645202c9e0	CARDIO-039	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	19	350	\N	\N	\N	2026-09-01 10:25:15.146573	2026-09-01 15:10:22.762792
83e57131-4a44-4a47-9092-fabed7e1f507	CARDIO-107	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	61	1190	\N	\N	\N	2026-09-01 15:10:33.454664	2026-09-01 15:10:35.083692
5a9dd5c2-188b-424a-b9c1-150479f0fdd7	CARDIO-048	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	28	477	\N	2026-09-01 10:29:51.463449	2026-09-01 10:29:51.942755	2026-09-01 10:29:51.115612	2026-09-01 10:29:51.94401
0eecabab-8713-4e4f-a4ec-c2ff30665eac	VET-SURG-001	9b64992a-8745-483c-a0ea-61800f9f5263	5117399c-07c2-4eec-b59d-efa61d38a3b8	\N	e7a5aa51-dc52-4c02-a643-01e55c29ad2b	\N	\N	\N	Dararith Ken	+85512999001	ONLINE	WAITING	1	0	\N	\N	\N	2026-09-03 07:06:08.133946	2026-09-03 07:06:08.13395
b35d7006-7fa6-4b03-8665-ee1e0613d6c8	SJH-STROKE-001	ff61ad03-16cd-433e-a70a-bcec33546fc0	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	12a3318c-1e12-40d4-bc19-1bd3872f5bfa	\N	\N	\N	Tola Seng	012558833	WALK_IN	WAITING	1	20	\N	\N	\N	2026-09-03 07:28:36.71876	2026-09-03 07:28:36.718763
6b0983c5-f18e-4031-b63d-7e6c0e245dd3	SJH-STROKE-002	ff61ad03-16cd-433e-a70a-bcec33546fc0	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	12a3318c-1e12-40d4-bc19-1bd3872f5bfa	\N	\N	\N	Chanthy Noun	098224466	ONLINE	WAITING	2	40	\N	\N	\N	2026-09-03 07:28:36.718766	2026-09-03 07:28:36.718767
b92f93c6-5049-4611-b591-bd1add2684dc	CARDIO-049	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	28	477	\N	\N	\N	2026-09-01 10:29:53.675381	2026-09-01 10:29:54.014248
fde76a7f-3728-43b4-a693-9bad10cbf399	SJH-GASTRO-001	bf2da0d3-eb9b-456e-aed2-fd53e6dfd010	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	058c8293-2aeb-45bc-9990-87f0b48bb06b	\N	\N	\N	Sopheak Men	015994422	WALK_IN	WAITING	1	20	\N	\N	\N	2026-09-03 07:28:36.749107	2026-09-03 07:28:36.749109
48321065-7d0a-4c91-8ecc-fac834e2c351	SJH-GASTRO-002	bf2da0d3-eb9b-456e-aed2-fd53e6dfd010	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	058c8293-2aeb-45bc-9990-87f0b48bb06b	\N	\N	\N	Kanika Som	092334411	ONLINE	WAITING	2	40	\N	\N	\N	2026-09-03 07:28:36.749114	2026-09-03 07:28:36.749115
17b38377-ac31-452d-aef4-94b938fd5f68	SJH-GASTRO-003	bf2da0d3-eb9b-456e-aed2-fd53e6dfd010	f0fc91eb-b864-46cb-a652-047047a0fda1	\N	058c8293-2aeb-45bc-9990-87f0b48bb06b	\N	\N	\N	Vuthy Chhay	088665511	WALK_IN	WAITING	3	60	\N	\N	\N	2026-09-03 07:28:36.749118	2026-09-03 07:28:36.749119
916e8af6-9786-4c6c-bb3f-3ccf0a57f307	ORTHO-001	02b94ac9-736d-4f9f-86fd-fe1490ed4bb7	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	a07e7b9c-7a93-466f-92b9-60ba85720ad9	\N	\N	\N	Mao Sambath	012778899	WALK_IN	WAITING	1	15	\N	\N	\N	2026-09-03 07:28:36.779281	2026-09-03 07:28:36.779283
ba5e6681-985a-498c-9d6f-bec6ae4e206a	CARDIO-052	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	30	513	\N	2026-09-01 10:30:44.397167	2026-09-01 10:30:44.490108	2026-09-01 10:30:44.290059	2026-09-01 10:30:44.49096
03ac8d09-ab52-487b-89d5-f92442833aad	ORTHO-002	02b94ac9-736d-4f9f-86fd-fe1490ed4bb7	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	a07e7b9c-7a93-466f-92b9-60ba85720ad9	\N	\N	\N	Thida Chea	096554433	ONLINE	WAITING	2	30	\N	\N	\N	2026-09-03 07:28:36.779287	2026-09-03 07:28:36.779288
b04b4537-01f1-4a5c-9dfb-3f8d1e0a9a93	ORTHO-003	02b94ac9-736d-4f9f-86fd-fe1490ed4bb7	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	a07e7b9c-7a93-466f-92b9-60ba85720ad9	\N	\N	\N	Pharith Oung	088332211	WALK_IN	WAITING	3	45	\N	\N	\N	2026-09-03 07:28:36.779291	2026-09-03 07:28:36.779292
5aaa02e9-4923-4137-97cd-7fcc6eaa264b	EYE-001	d73e3d8a-8a9b-4630-801b-9e57b225c53d	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	a6d4f86c-643d-480f-b674-957897449838	\N	\N	\N	Chhay Hak	012441199	WALK_IN	WAITING	1	15	\N	\N	\N	2026-09-03 07:28:36.803806	2026-09-03 07:28:36.803808
95909ddb-16a0-4094-bd9f-f23900150816	CARDIO-053	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	30	513	\N	\N	\N	2026-09-01 10:30:45.051272	2026-09-01 10:30:45.145433
37189223-138e-405f-b7e6-e2391bb6e52d	EYE-002	d73e3d8a-8a9b-4630-801b-9e57b225c53d	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	a6d4f86c-643d-480f-b674-957897449838	\N	\N	\N	Sophea Yim	092881133	ONLINE	WAITING	2	30	\N	\N	\N	2026-09-03 07:28:36.803811	2026-09-03 07:28:36.803812
afeccd72-47f0-4a27-893b-bbbe7238c908	EYE-003	d73e3d8a-8a9b-4630-801b-9e57b225c53d	18cf2375-f6e7-4767-9a5c-73056e87743a	\N	a6d4f86c-643d-480f-b674-957897449838	\N	\N	\N	Nary Seng	016554422	WALK_IN	WAITING	3	45	\N	\N	\N	2026-09-03 07:28:36.803814	2026-09-03 07:28:36.803815
b4b12399-ea78-4155-b456-a63520d9af2c	RABIES-001	c4a12ef5-7fc4-4fc8-96db-f861667b454a	d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	\N	cfda9424-593b-4f2e-a905-cd59896b0ffc	\N	\N	\N	Bunnarith Sin	012993322	WALK_IN	WAITING	1	10	\N	\N	\N	2026-09-03 07:28:36.829844	2026-09-03 07:28:36.829846
0ccb1a0d-9e98-4ad4-ac02-c7410b2576d2	CARDIO-056	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	32	549	\N	2026-09-01 10:31:42.971288	2026-09-01 10:31:43.042565	2026-09-01 10:31:42.862054	2026-09-01 10:31:43.043205
e2f0c8cd-4824-4532-92a0-3f2cc984235a	CARDIO-057	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	32	549	\N	\N	\N	2026-09-01 10:31:43.509167	2026-09-01 10:31:43.586176
4b3aac61-bcf1-4cb1-ae42-51c929c647c6	CARDIO-061	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	35	603	\N	2026-09-01 10:34:42.375422	2026-09-01 10:34:42.44976	2026-09-01 10:34:42.276044	2026-09-01 10:34:42.450585
12231fd8-df12-43e6-904f-ea065ec7e76c	CARDIO-062	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	35	603	\N	\N	\N	2026-09-01 10:34:42.992272	2026-09-01 10:34:43.079124
7f79e205-4eee-4667-84b8-dd7403628c7d	CARDIO-066	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	38	657	\N	2026-09-01 10:35:15.405265	2026-09-01 10:35:15.544322	2026-09-01 10:35:15.273274	2026-09-01 10:35:15.545357
3c2a1671-55c7-4bd5-b40e-b9d9e0183daf	CARDIO-067	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	38	657	\N	\N	\N	2026-09-01 10:35:16.255332	2026-09-01 10:35:16.389734
66d0453e-b722-4b0c-8420-c4579f0eb0b1	CARDIO-071	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	41	711	\N	2026-09-01 10:41:56.383141	2026-09-01 10:41:56.473588	2026-09-01 10:41:56.29317	2026-09-01 10:41:56.474986
763f6db2-c6bb-477a-a97e-b30ba3b7bc86	CARDIO-072	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	41	711	\N	\N	\N	2026-09-01 10:41:57.013339	2026-09-01 10:41:57.100882
febb2aa1-88f0-4a18-8772-46ae7bd3f0a8	CARDIO-076	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	44	765	\N	2026-09-01 10:42:51.094618	2026-09-01 10:42:51.165844	2026-09-01 10:42:50.996011	2026-09-01 10:42:51.166508
6c25d63f-9c44-4549-a7a4-3b3a09b7fe80	CARDIO-077	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	44	765	\N	\N	\N	2026-09-01 10:42:51.82732	2026-09-01 10:42:51.931346
c43f6bda-e76c-4fb7-9f8f-1d02ea7b15e5	CARDIO-081	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	47	910	\N	2026-09-01 10:46:14.303604	2026-09-01 10:46:14.387139	2026-09-01 10:46:14.219833	2026-09-01 10:46:14.387949
7304a2ff-ee14-41dc-b983-cc312f8de4b1	CARDIO-101	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	59	1160	\N	2026-09-01 11:04:46.507428	2026-09-01 11:04:46.597628	2026-09-01 11:04:46.407736	2026-09-01 11:04:46.598041
15edbe0d-fec2-492c-afa3-71e47d08d230	CARDIO-050	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	24	450	\N	\N	\N	2026-09-01 10:30:43.365552	2026-09-01 15:10:22.762711
7ee28082-f283-412b-8a3d-7377467797ce	CARDIO-108	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	63	1240	\N	2026-09-01 15:10:34.710089	2026-09-01 15:10:34.956334	2026-09-01 15:10:34.378711	2026-09-01 15:10:34.958033
afb98663-52a0-4c2e-aa6c-85d7743421f4	CARDIO-104	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-in Guest	+85599887766	WALK_IN	WAITING	58	1130	\N	\N	\N	2026-09-01 15:10:23.283937	2026-09-01 15:10:35.083695
fe6d9585-7d11-489a-924d-ac4d31e1d809	VET-OPD-001	70cfbcca-7894-41d8-b9a1-fdf27328a244	5117399c-07c2-4eec-b59d-efa61d38a3b8	\N	b107e9bf-9911-4149-8add-0cf91a19914a	\N	\N	\N	Dararith Ken	+85512999001	ONLINE	WAITING	1	0	\N	\N	\N	2026-09-03 07:15:33.427778	2026-09-03 07:15:33.427781
068fddbc-090c-4b82-ae19-0f47cb996dbe	RABIES-002	c4a12ef5-7fc4-4fc8-96db-f861667b454a	d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	\N	cfda9424-593b-4f2e-a905-cd59896b0ffc	\N	\N	\N	Davy Heng	097886655	ONLINE	WAITING	2	20	\N	\N	\N	2026-09-03 07:28:36.829849	2026-09-03 07:28:36.82985
f0bc2bf3-f81a-41b2-940a-8fb3ceb6aa14	RABIES-003	c4a12ef5-7fc4-4fc8-96db-f861667b454a	d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	\N	cfda9424-593b-4f2e-a905-cd59896b0ffc	\N	\N	\N	Phalla Keo	092443311	WALK_IN	WAITING	3	30	\N	\N	\N	2026-09-03 07:28:36.829852	2026-09-03 07:28:36.829852
23d05e49-3e25-4531-aaab-56d85dbd9f67	RABIES-004	c4a12ef5-7fc4-4fc8-96db-f861667b454a	d4bf50c2-9df2-44c0-a57a-f1ca3ec59b23	\N	cfda9424-593b-4f2e-a905-cd59896b0ffc	\N	\N	\N	Sophearith Tan	015776655	ONLINE	WAITING	4	40	\N	\N	\N	2026-09-03 07:28:36.829854	2026-09-03 07:28:36.829855
ac9dcf01-5f48-4692-a5bd-1709014b34d1	PET-WELL-007	a50ebf04-4d8b-465d-9a93-cf306a6960d8	b8e5a5bf-2589-4959-a372-0bd16eabb4e6	\N	a3feba76-3e96-4de5-8122-1d86b53f21a5	\N	\N	\N	Dararith Ken	+85512999001	ONLINE	WAITING	2	16	\N	\N	\N	2026-09-03 08:01:25.362336	2026-09-03 08:01:25.362338
fc5b0ca0-82dd-413a-b56b-ee0d67e7d6bb	VET-SURG-002	9b64992a-8745-483c-a0ea-61800f9f5263	5117399c-07c2-4eec-b59d-efa61d38a3b8	\N	e7a5aa51-dc52-4c02-a643-01e55c29ad2b	\N	\N	\N	Dararith Ken	+85512999001	ONLINE	WAITING	2	28	\N	\N	\N	2026-09-03 08:50:46.309648	2026-09-03 08:50:46.309651
de18fda3-c8d9-4553-b671-d9f876a2abb1	PET-WELL-008	a50ebf04-4d8b-465d-9a93-cf306a6960d8	b8e5a5bf-2589-4959-a372-0bd16eabb4e6	\N	a3feba76-3e96-4de5-8122-1d86b53f21a5	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	3	30	\N	\N	\N	2026-09-03 10:31:07.957015	2026-09-03 10:31:07.957018
4cf644d8-b277-4e87-998a-b6956b459e7d	CARDIO-001	50f3436b-8c84-4e5a-b85e-35720aac6b8b	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999888	ONLINE	COMPLETED	0	0	2026-09-04 02:51:23.251978	2026-09-04 02:51:23.345078	2026-09-04 02:51:23.41336	2026-09-04 02:51:22.880914	2026-09-04 02:51:23.413981
13b069d2-8565-4711-af9d-84fe05e8fe1f	DERM-001	18bd3806-f097-4b88-b157-e00162e5152c	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	18a42baf-6235-47ad-9695-77fb7b631b06	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999777	ONLINE	WAITING	1	0	\N	\N	\N	2026-09-04 02:51:25.595926	2026-09-04 02:51:25.59593
6f92046d-b77a-4b9e-9c96-b65319e3cffb	DERM-004	18bd3806-f097-4b88-b157-e00162e5152c	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	18a42baf-6235-47ad-9695-77fb7b631b06	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	4	52	\N	2026-09-04 02:51:30.721822	2026-09-04 02:51:30.796898	2026-09-04 02:51:30.648842	2026-09-04 02:51:30.797234
16142f21-6f99-4bec-af47-e9ef9a553819	DERM-003	18bd3806-f097-4b88-b157-e00162e5152c	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	18a42baf-6235-47ad-9695-77fb7b631b06	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	3	25	\N	\N	\N	2026-09-04 02:51:30.265313	2026-09-04 02:51:30.816754
36f19bf0-a2d3-4c74-8d5a-b783ed687993	DERM-002	18bd3806-f097-4b88-b157-e00162e5152c	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	18a42baf-6235-47ad-9695-77fb7b631b06	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	2	8	\N	\N	\N	2026-09-04 02:51:29.91246	2026-09-04 02:51:30.816757
45267ef1-1eaa-4c11-9c62-faa4e459a357	CARDIO-082	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	47	910	\N	\N	\N	2026-09-01 10:46:14.901061	2026-09-01 10:46:15.029231
a7e168c2-37e4-428b-936a-1ec14e4b21a2	CARDIO-102	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	59	1160	\N	\N	\N	2026-09-01 11:04:47.287229	2026-09-01 11:04:47.411163
3f5ab0e8-08da-4610-a8f2-70dce659da3c	CARDIO-096	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999888	ONLINE	WAITING	52	1010	\N	\N	\N	2026-09-01 11:04:38.766033	2026-09-01 15:10:22.76272
4600f3a3-3422-4b70-9293-ef8a00765e31	CARDIO-091	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999777	ONLINE	WAITING	49	950	\N	\N	\N	2026-09-01 10:50:17.188865	2026-09-01 15:10:22.762722
47056711-bc11-4b82-b90a-c89f6a0c8b87	CARDIO-078	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999777	ONLINE	WAITING	40	770	\N	\N	\N	2026-09-01 10:46:09.427192	2026-09-01 15:10:22.762724
4783bda9-fbb0-4948-90a7-53dd1451a230	CARDIO-068	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999777	ONLINE	WAITING	34	650	\N	\N	\N	2026-09-01 10:41:51.612689	2026-09-01 15:10:22.762726
4d49f7fc-d37c-4fc0-b485-590b7b69a295	CARDIO-084	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999777	ONLINE	WAITING	44	850	\N	\N	\N	2026-09-01 10:49:26.794605	2026-09-01 15:10:22.762729
5353cfd2-add5-403c-a343-5f0546fb7915	CARDIO-038	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	18	330	\N	\N	\N	2026-09-01 10:25:14.755489	2026-09-01 15:10:22.762731
56a61efd-6ca6-4b64-94d9-c51ac7c94640	CARDIO-035	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	17	310	\N	\N	\N	2026-09-01 10:24:51.887185	2026-09-01 15:10:22.762733
5722b639-aa23-4c74-9b5f-2897700e8638	CARDIO-008	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	WAITING	3	30	\N	\N	\N	2026-09-01 10:12:40.038471	2026-09-01 15:10:22.762735
5cf49176-9521-446b-831b-e3becb9bc664	CARDIO-069	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	35	670	\N	\N	\N	2026-09-01 10:41:55.483355	2026-09-01 15:10:22.762737
5e6bf07c-743c-40bb-90f7-de5a3b20375f	CARDIO-075	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	39	750	\N	\N	\N	2026-09-01 10:42:50.527111	2026-09-01 15:10:22.76274
65cf43f6-a98d-414c-8697-299b961e81de	CARDIO-058	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999777	ONLINE	WAITING	28	530	\N	\N	\N	2026-09-01 10:34:36.662047	2026-09-01 15:10:22.762742
66ea792e-b08a-4e22-8f0f-a65f10ce512e	CARDIO-063	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999777	ONLINE	WAITING	31	590	\N	\N	\N	2026-09-01 10:35:08.526388	2026-09-01 15:10:22.762744
00a2fe03-d092-48b7-a959-04623cea784d	CARDIO-094	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	55	1080	\N	2026-09-01 10:50:23.082778	2026-09-01 10:50:23.189862	2026-09-01 10:50:22.925739	2026-09-01 10:50:23.190324
692a1d17-e541-4670-9df8-7750f53d1920	CARDIO-060	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	30	570	\N	\N	\N	2026-09-01 10:34:41.763188	2026-09-01 15:10:22.762746
de4bdf32-d847-4d3c-878d-8de1d8147031	CARDIO-003	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	COMPLETED	0	0	2026-09-01 11:04:39.261855	2026-09-01 11:04:39.389077	2026-09-01 11:04:39.482052	2026-09-01 10:11:46.32759	2026-09-01 11:04:39.482711
6ae70a37-9c6d-40f5-b7e4-94972f33a850	CARDIO-034	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	16	290	\N	\N	\N	2026-09-01 10:24:51.515427	2026-09-01 15:10:22.762748
6e79a4b7-6167-4db2-8e7b-2643c4309f93	CARDIO-079	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	41	790	\N	\N	\N	2026-09-01 10:46:13.266392	2026-09-01 15:10:22.762752
fca5b8d2-19c4-4ba6-bdcd-ccff517c1374	CARDIO-095	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	55	1080	\N	\N	\N	2026-09-01 10:50:23.742631	2026-09-01 10:50:23.832968
36620259-55cf-4576-b66b-49a1bc9a480d	CARDIO-004	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Lifecycle Patient Test	\N	WALK_IN	COMPLETED	0	0	2026-09-01 15:10:22.718734	2026-09-01 15:10:22.878366	2026-09-01 15:10:23.006659	2026-09-01 10:11:46.865603	2026-09-01 15:10:23.007526
bebed529-ab97-48b1-af55-798acce6bcf9	CARDIO-105	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999777	ONLINE	WAITING	59	1150	\N	\N	\N	2026-09-01 15:10:26.43161	2026-09-01 15:10:35.083701
ed60d066-05d3-46b9-bb29-1e8327b14311	CARDIO-109	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	63	1240	\N	\N	\N	2026-09-01 15:10:36.015701	2026-09-01 15:10:36.307044
f38ed54a-12ba-42a9-a3bf-9cd55ed34c05	GEN-001	586c324b-80a2-4681-a3d8-01468295f527	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	4ad9a572-c294-40a8-b65e-6758f3d99940	\N	\N	\N	Dararith Ken	+85512999001	ONLINE	WAITING	1	0	\N	\N	\N	2026-09-03 07:22:10.94209	2026-09-03 07:22:10.942093
ec5b2bc5-848e-42de-9841-83e8dc264e85	DENT-001	7d87ce48-4caf-4e75-a00b-e939a53dff93	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	\N	9d826969-4267-431e-8164-9ab07229eacb	\N	\N	\N	Vicheka Seng	012884422	WALK_IN	WAITING	1	25	\N	\N	\N	2026-09-03 07:57:39.804174	2026-09-03 07:57:39.804176
f3d0c2f0-6029-477f-80a9-9e7de72787fb	DENT-002	7d87ce48-4caf-4e75-a00b-e939a53dff93	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	\N	9d826969-4267-431e-8164-9ab07229eacb	\N	\N	\N	Chhany Rath	098776655	ONLINE	WAITING	2	50	\N	\N	\N	2026-09-03 07:57:39.804179	2026-09-03 07:57:39.804179
f4ed496e-9d27-42a9-8560-819584f7015b	BRACE-001	29d62e46-7fd3-42a8-a637-9b5cae8a8729	8c84b4bb-73da-4e59-b0b0-e33c16d0ad0c	\N	c1ecc154-2fb6-46ea-a842-4123edd9bd3f	\N	\N	\N	Maly Samnang	011332211	WALK_IN	WAITING	1	20	\N	\N	\N	2026-09-03 07:57:39.829534	2026-09-03 07:57:39.829536
9fb55b48-cad4-4807-b774-1b981c34aaaa	OBGYN-001	00beeb22-6424-43a6-94bd-ccfdf2a09f7b	3b700cc3-bc60-4c4c-90f4-69f1b5b16064	\N	f0112271-16a9-4baa-866d-e106530e69a4	\N	\N	\N	Sreypov Meas	089223344	WALK_IN	WAITING	1	20	\N	\N	\N	2026-09-03 07:57:39.84848	2026-09-03 07:57:39.848482
855a68ef-38fb-4860-95fb-ca32c6475f17	OBGYN-002	00beeb22-6424-43a6-94bd-ccfdf2a09f7b	3b700cc3-bc60-4c4c-90f4-69f1b5b16064	\N	f0112271-16a9-4baa-866d-e106530e69a4	\N	\N	\N	Kanika Nhem	092113355	ONLINE	WAITING	2	40	\N	\N	\N	2026-09-03 07:57:39.848485	2026-09-03 07:57:39.848485
962a0d72-a76d-4f24-9b2d-8331477f2d03	OBGYN-003	00beeb22-6424-43a6-94bd-ccfdf2a09f7b	3b700cc3-bc60-4c4c-90f4-69f1b5b16064	\N	f0112271-16a9-4baa-866d-e106530e69a4	\N	\N	\N	Davy Chorn	070667788	WALK_IN	WAITING	3	60	\N	\N	\N	2026-09-03 07:57:39.848488	2026-09-03 07:57:39.848488
40bb73cd-b4e5-48b4-bc98-aa9e9436760f	EYE-001	c770030a-4560-4dae-b150-07e50c1dc3c4	4a011297-fd8a-4555-b661-049569bf2a55	\N	398599bb-799b-4b91-b567-5aa4b053101d	\N	\N	\N	Bunly Heng	012998877	WALK_IN	WAITING	1	15	\N	\N	\N	2026-09-03 07:57:39.868066	2026-09-03 07:57:39.868068
bf225392-7670-4206-b7a2-ee99aa89d54e	EYE-002	c770030a-4560-4dae-b150-07e50c1dc3c4	4a011297-fd8a-4555-b661-049569bf2a55	\N	398599bb-799b-4b91-b567-5aa4b053101d	\N	\N	\N	Channa Ros	097554433	ONLINE	WAITING	2	30	\N	\N	\N	2026-09-03 07:57:39.86807	2026-09-03 07:57:39.86807
66c98cad-1067-447f-8327-b4942c54fdb8	VET-OPD-001	316bc69a-8170-4c42-84ba-f3be35a53a02	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	\N	ef5718d4-2014-4175-a712-fd3ce63ae713	\N	\N	\N	Chenda Krouch (Dog: Max)	088554433	WALK_IN	WAITING	1	15	\N	\N	\N	2026-09-03 07:57:39.884826	2026-09-03 07:57:39.884828
e9b62e27-6a5b-47ac-a64c-2f899b7e9de0	VET-OPD-002	316bc69a-8170-4c42-84ba-f3be35a53a02	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	\N	ef5718d4-2014-4175-a712-fd3ce63ae713	\N	\N	\N	Romny Teng (Cat: Mochi)	016778899	ONLINE	WAITING	2	30	\N	\N	\N	2026-09-03 07:57:39.884831	2026-09-03 07:57:39.884832
5be74158-9ebe-49d3-bb14-9035f72433d0	VET-OPD-003	316bc69a-8170-4c42-84ba-f3be35a53a02	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	\N	ef5718d4-2014-4175-a712-fd3ce63ae713	\N	\N	\N	Sopheap Nuon (Dog: Lucky)	010445566	WALK_IN	WAITING	3	45	\N	\N	\N	2026-09-03 07:57:39.884833	2026-09-03 07:57:39.884834
83ffacb9-1b55-4a05-abac-cc91d5df10eb	PET-SURG-001	10a50164-f842-4988-b120-fdac8f9884c9	c95e2ac2-591c-4bd6-ae63-f64efa2541ff	\N	26539f80-bc35-43e7-9094-cf1ae71f6a4c	\N	\N	\N	Vannak Long (Dog: Rocky)	012338899	WALK_IN	WAITING	1	30	\N	\N	\N	2026-09-03 07:57:39.899785	2026-09-03 07:57:39.899787
7bd1a279-713f-46e3-9e29-fc63d1ff823d	PET-ER-001	e4b74b24-f1a4-4112-ae3d-b55d7ded425f	c9c2a60c-b15f-42ea-a0ae-931ecf59b311	\N	4f492e80-4667-44b6-9464-b7b6eaa7d4dd	\N	\N	\N	Kimly Chhay (Dog: Milo)	015443322	WALK_IN	WAITING	1	20	\N	\N	\N	2026-09-03 07:57:39.932354	2026-09-03 07:57:39.932356
db12e441-b4f7-4bb6-9c00-5cdaadf1a7dc	PET-ER-002	e4b74b24-f1a4-4112-ae3d-b55d7ded425f	c9c2a60c-b15f-42ea-a0ae-931ecf59b311	\N	4f492e80-4667-44b6-9464-b7b6eaa7d4dd	\N	\N	\N	Panha Rin (Cat: Luna)	093221100	ONLINE	WAITING	2	40	\N	\N	\N	2026-09-03 07:57:39.932359	2026-09-03 07:57:39.932359
3d0f9a06-bef5-4976-a531-a2a87f034f4e	LUCKY-001	a50ebf04-4d8b-465d-9a93-cf306a6960d8	b8e5a5bf-2589-4959-a372-0bd16eabb4e6	\N	a3feba76-3e96-4de5-8122-1d86b53f21a5	\N	\N	\N	Bora Noun (Dog: Cooper)	077889900	WALK_IN	WAITING	1	15	\N	\N	\N	2026-09-03 07:57:39.960844	2026-09-03 07:57:39.960847
fcf6b058-284b-4e26-b813-3c1b4905a825	NEURO-009	7843e3c2-baa0-4ee1-bdc5-6c3d84a3008f	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	b73f700f-f7b7-4bdd-9f47-842d8cdcf790	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	4	82	\N	\N	\N	2026-09-03 08:16:54.443811	2026-09-03 08:16:54.443813
6525e01d-8e06-48cb-b209-4c37ea51404d	VET-SURG-003	9b64992a-8745-483c-a0ea-61800f9f5263	5117399c-07c2-4eec-b59d-efa61d38a3b8	\N	e7a5aa51-dc52-4c02-a643-01e55c29ad2b	\N	\N	\N	Dararith Ken	+85512999001	ONLINE	WAITING	3	50	\N	\N	\N	2026-09-03 09:22:13.899749	2026-09-03 09:22:13.899752
b291dccc-850c-4989-aa52-7a7d8ce4bb67	VET-OPD-001	f0ee6944-566c-4a8b-8a66-774592ff647e	5117399c-07c2-4eec-b59d-efa61d38a3b8	\N	b107e9bf-9911-4149-8add-0cf91a19914a	\N	\N	\N	Dararith Ken	+85512999001	ONLINE	WAITING	1	0	\N	\N	\N	2026-09-04 01:59:05.324158	2026-09-04 01:59:05.324161
6305b181-e9fa-4515-8bcf-92d71d225d11	CARDIO-002	50f3436b-8c84-4e5a-b85e-35720aac6b8b	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-in Guest	+85599887766	WALK_IN	WAITING	1	0	\N	\N	\N	2026-09-04 02:51:23.527929	2026-09-04 02:51:23.527932
5a82bd3f-ca0c-4f46-99a9-05fb91a231f9	DERM-005	18bd3806-f097-4b88-b157-e00162e5152c	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	18a42baf-6235-47ad-9695-77fb7b631b06	\N	\N	\N	Skip Patient Test	\N	WALK_IN	SKIPPED	4	52	\N	\N	\N	2026-09-04 02:51:31.24318	2026-09-04 02:51:31.314637
4697f386-debc-4c2b-9d9f-44b45f215acd	CARDIO-106	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	60	1170	\N	\N	\N	2026-09-01 15:10:32.798341	2026-09-01 15:10:35.083687
8920f411-8092-443d-bbbf-ea02c4932993	CARDIO-098	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999777	ONLINE	WAITING	54	1050	\N	\N	\N	2026-09-01 11:04:41.580842	2026-09-01 15:10:22.762765
b707a759-10b7-49a1-bffa-85f81aa584df	CARDIO-103	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999888	ONLINE	WAITING	57	1110	\N	\N	\N	2026-09-01 15:10:22.04179	2026-09-01 15:10:22.762776
c0447514-3a02-42de-ba66-c4598a72ffcb	CARDIO-019	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	9	150	\N	\N	\N	2026-09-01 10:19:26.376621	2026-09-01 15:10:22.762782
c1cdd0e2-eaa1-4c24-a73e-e54c0bb30f2a	CARDIO-090	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-in Guest	+85599887766	WALK_IN	WAITING	48	930	\N	\N	\N	2026-09-01 10:50:15.145498	2026-09-01 15:10:22.762784
c3905560-325d-4c3f-ae19-73820a732282	CARDIO-022	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	10	170	\N	\N	\N	2026-09-01 10:19:57.674984	2026-09-01 15:10:22.762786
ce127420-a371-4b25-96a4-abe8541ff146	CARDIO-059	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	29	550	\N	\N	\N	2026-09-01 10:34:41.201752	2026-09-01 15:10:22.762794
d215eac7-61c0-4b34-929b-da67051f0a2d	CARDIO-027	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	13	230	\N	\N	\N	2026-09-01 10:22:20.960042	2026-09-01 15:10:22.762795
d3c1e3aa-8dbc-4dbb-befc-ac8916de04f7	CARDIO-011	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	5	70	\N	\N	\N	2026-09-01 10:13:31.893657	2026-09-01 15:10:22.762797
db07152d-df5d-4b85-b938-0e88f7c89e0b	CARDIO-097	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-in Guest	+85599887766	WALK_IN	WAITING	53	1030	\N	\N	\N	2026-09-01 11:04:39.6497	2026-09-01 15:10:22.762799
dc700abe-9e10-422a-be09-d73e56fef30b	CARDIO-023	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	11	190	\N	\N	\N	2026-09-01 10:19:58.082146	2026-09-01 15:10:22.762801
dd304a90-97dc-4f09-998d-60b314d75bb7	CARDIO-042	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	20	370	\N	\N	\N	2026-09-01 10:27:01.924876	2026-09-01 15:10:22.762805
e019a7d1-4661-49ab-aeab-789410019531	CARDIO-083	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999888	ONLINE	WAITING	43	830	\N	\N	\N	2026-09-01 10:49:25.133525	2026-09-01 15:10:22.762807
e21c17fb-8973-45b9-869c-ccddb03cd179	CARDIO-043	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	21	390	\N	\N	\N	2026-09-01 10:27:02.318398	2026-09-01 15:10:22.762808
ea63811d-8941-4d03-b5da-e7fd64ec3c6b	CARDIO-007	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	2	10	\N	\N	\N	2026-09-01 10:12:39.535205	2026-09-01 15:10:22.76281
f429ff0d-525d-4710-a3cb-cf05931164bc	CARDIO-073	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999777	ONLINE	WAITING	37	710	\N	\N	\N	2026-09-01 10:42:46.190754	2026-09-01 15:10:22.762812
f4bd0923-dec3-465c-9928-9c670fecab84	CARDIO-046	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	22	410	\N	\N	\N	2026-09-01 10:29:49.848626	2026-09-01 15:10:22.762814
fc41ad18-f064-4a34-a2e7-294987de912d	CARDIO-070	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	36	690	\N	\N	\N	2026-09-01 10:41:55.864856	2026-09-01 15:10:22.762816
fd4c9d5e-ab73-4889-a97e-66c54bc887c7	CARDIO-006	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	1	0	\N	\N	\N	2026-09-01 10:12:39.106814	2026-09-01 15:10:22.762818
fe094201-4e3e-4024-b449-eca2112d169f	CARDIO-065	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	33	630	\N	\N	\N	2026-09-01 10:35:14.615094	2026-09-01 15:10:22.762821
fe0cbdee-9ab9-4d89-a749-5e7466d9599a	CARDIO-010	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	4	50	\N	\N	\N	2026-09-01 10:13:31.37124	2026-09-01 15:10:22.762823
fe36ec67-29e1-4a79-bc71-a156c06a04ee	CARDIO-085	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	162f0832-5f86-4ee2-a48e-41f76c8f70d7	Dararith Ken	+85512999001	ONLINE	WAITING	45	870	\N	\N	\N	2026-09-01 10:49:30.969637	2026-09-01 15:10:22.762825
fe7bdb5a-b082-4d75-aebc-194ef1cdbde1	CARDIO-031	f798aa04-a981-4859-8b66-c6f58caee331	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Walk-In Testing Patient	+85512333444	WALK_IN	WAITING	15	270	\N	\N	\N	2026-09-01 10:24:08.279905	2026-09-01 15:10:22.762827
ea4150a4-982a-4390-9a93-b6783230c740	CARDIO-001	6580d55b-4004-47cf-8414-0c3dfc489ecd	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	35c3cc8d-2220-4700-93ba-692c22e09358	\N	\N	\N	Vannak Keo	012345671	WALK_IN	WAITING	1	20	\N	\N	\N	2026-09-03 07:28:36.558436	2026-09-03 07:28:36.558438
4917a9c2-8dca-428d-99a5-91b0904a60be	CARDIO-002	6580d55b-4004-47cf-8414-0c3dfc489ecd	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	35c3cc8d-2220-4700-93ba-692c22e09358	\N	\N	\N	Sokly Mom	092445566	ONLINE	WAITING	2	40	\N	\N	\N	2026-09-03 07:28:36.55844	2026-09-03 07:28:36.558441
75808c67-67a9-4ee4-9ecf-109f5dd72bd0	CARDIO-003	6580d55b-4004-47cf-8414-0c3dfc489ecd	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	35c3cc8d-2220-4700-93ba-692c22e09358	\N	\N	\N	Borey Hem	078990011	WALK_IN	WAITING	3	60	\N	\N	\N	2026-09-03 07:28:36.558442	2026-09-03 07:28:36.558443
1ede5980-706d-4a55-93da-547f0dd05567	CARDIO-004	6580d55b-4004-47cf-8414-0c3dfc489ecd	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	35c3cc8d-2220-4700-93ba-692c22e09358	\N	\N	\N	Thavy Ly	015882233	ONLINE	WAITING	4	80	\N	\N	\N	2026-09-03 07:28:36.558445	2026-09-03 07:28:36.558445
4b4bfbad-de06-454e-9276-acd22428b2fe	CARDIO-005	6580d55b-4004-47cf-8414-0c3dfc489ecd	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	35c3cc8d-2220-4700-93ba-692c22e09358	\N	\N	\N	Chanthou Sin	089334455	WALK_IN	WAITING	5	100	\N	\N	\N	2026-09-03 07:28:36.558448	2026-09-03 07:28:36.558449
efd0ab17-c761-4801-bbcd-9ae1e332221e	NEURO-001	7843e3c2-baa0-4ee1-bdc5-6c3d84a3008f	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	b73f700f-f7b7-4bdd-9f47-842d8cdcf790	\N	\N	\N	Bunrath Chan	012998877	WALK_IN	WAITING	1	25	\N	\N	\N	2026-09-03 07:28:36.591743	2026-09-03 07:28:36.591745
427f9aec-37c9-4deb-bac0-998f09de1326	NEURO-002	7843e3c2-baa0-4ee1-bdc5-6c3d84a3008f	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	b73f700f-f7b7-4bdd-9f47-842d8cdcf790	\N	\N	\N	Kimheng Pich	098112233	ONLINE	WAITING	2	50	\N	\N	\N	2026-09-03 07:28:36.591748	2026-09-03 07:28:36.591749
594069e9-73bc-45c1-a492-c8384e78291c	NEURO-003	7843e3c2-baa0-4ee1-bdc5-6c3d84a3008f	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	b73f700f-f7b7-4bdd-9f47-842d8cdcf790	\N	\N	\N	Sreyneth Som	077556644	WALK_IN	WAITING	3	75	\N	\N	\N	2026-09-03 07:28:36.591751	2026-09-03 07:28:36.591752
d013298a-645f-424b-9fd4-c46786576786	SURG-001	a5702c02-e5db-4d34-96fa-26f13f35eede	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	ef35d097-4449-4a40-a88e-24d13a2a43c4	\N	\N	\N	Kunthea Ros	093448822	WALK_IN	WAITING	1	15	\N	\N	\N	2026-09-03 07:28:36.614709	2026-09-03 07:28:36.614711
e9a8985c-c224-43db-9dba-1d00c8036f52	SURG-002	a5702c02-e5db-4d34-96fa-26f13f35eede	5b3a4677-c2a9-4c2a-a0b5-2eb0af9e5d36	\N	ef35d097-4449-4a40-a88e-24d13a2a43c4	\N	\N	\N	Dara Nguon	011229988	ONLINE	WAITING	2	30	\N	\N	\N	2026-09-03 07:28:36.614716	2026-09-03 07:28:36.614717
a0f51fe3-de13-40eb-8ae0-b71cd69e4e05	PULMO-001	3a34a6d0-9c21-47fa-9f21-6c08711afe2d	7275b121-7861-440c-aa24-f6e36c883293	\N	4e25ab1e-2cd1-40c9-9015-42b39baf82ae	\N	\N	\N	Sovanrithy Chhay	012665544	WALK_IN	WAITING	1	15	\N	\N	\N	2026-09-03 07:28:36.64197	2026-09-03 07:28:36.641972
8185d8f2-724f-41cb-8cd5-6d29dbbc7dd1	PULMO-002	3a34a6d0-9c21-47fa-9f21-6c08711afe2d	7275b121-7861-440c-aa24-f6e36c883293	\N	4e25ab1e-2cd1-40c9-9015-42b39baf82ae	\N	\N	\N	Bopha Meng	096332211	ONLINE	WAITING	2	30	\N	\N	\N	2026-09-03 07:28:36.641975	2026-09-03 07:28:36.641976
12d03a00-52ce-4df4-9ca4-e72b54b304a9	PULMO-003	3a34a6d0-9c21-47fa-9f21-6c08711afe2d	7275b121-7861-440c-aa24-f6e36c883293	\N	4e25ab1e-2cd1-40c9-9015-42b39baf82ae	\N	\N	\N	Vireak Roth	088776655	WALK_IN	WAITING	3	45	\N	\N	\N	2026-09-03 07:28:36.641978	2026-09-03 07:28:36.641978
cf92065b-8849-4431-861c-f8ab698cd244	PULMO-004	3a34a6d0-9c21-47fa-9f21-6c08711afe2d	7275b121-7861-440c-aa24-f6e36c883293	\N	4e25ab1e-2cd1-40c9-9015-42b39baf82ae	\N	\N	\N	Channa Eam	092113344	ONLINE	WAITING	4	60	\N	\N	\N	2026-09-03 07:28:36.64198	2026-09-03 07:28:36.641981
47767387-b77e-4572-9788-072296ac55d9	NEPHRO-001	fbf1e67e-2837-468e-baec-57eccaa4cf34	7275b121-7861-440c-aa24-f6e36c883293	\N	e94208b9-a54f-46f8-bec9-18071fc2fbab	\N	\N	\N	Kosal Prak	012887766	WALK_IN	WAITING	1	20	\N	\N	\N	2026-09-03 07:28:36.663286	2026-09-03 07:28:36.663289
7641c11f-860d-448d-b685-e262fb6ed075	NEPHRO-002	fbf1e67e-2837-468e-baec-57eccaa4cf34	7275b121-7861-440c-aa24-f6e36c883293	\N	e94208b9-a54f-46f8-bec9-18071fc2fbab	\N	\N	\N	Theara Suon	097665544	ONLINE	WAITING	2	40	\N	\N	\N	2026-09-03 07:28:36.663293	2026-09-03 07:28:36.663294
1f0223b8-0c33-462c-ba49-b67660175da9	PEDIATRIC-001	752a812f-4589-4023-a448-0c3a9c0bff37	1a19d7f8-b12d-46b5-a60f-8ad59c812672	\N	bc8d9a21-cee2-465c-ad48-d68e63aed89d	\N	\N	\N	Chenda Khorn (Child: Seyha)	012339944	WALK_IN	WAITING	1	15	\N	\N	\N	2026-09-03 07:28:36.694427	2026-09-03 07:28:36.694429
6fefeed9-b74f-453a-ba3d-61f5be019fd9	PEDIATRIC-002	752a812f-4589-4023-a448-0c3a9c0bff37	1a19d7f8-b12d-46b5-a60f-8ad59c812672	\N	bc8d9a21-cee2-465c-ad48-d68e63aed89d	\N	\N	\N	Piseth Yan (Child: Dara)	093887766	ONLINE	WAITING	2	30	\N	\N	\N	2026-09-03 07:28:36.694432	2026-09-03 07:28:36.694433
767feba3-85b0-4c1f-a4da-d73b9fb4f27c	PEDIATRIC-003	752a812f-4589-4023-a448-0c3a9c0bff37	1a19d7f8-b12d-46b5-a60f-8ad59c812672	\N	bc8d9a21-cee2-465c-ad48-d68e63aed89d	\N	\N	\N	Malen Chey (Child: Sreypov)	088221144	WALK_IN	WAITING	3	45	\N	\N	\N	2026-09-03 07:28:36.694435	2026-09-03 07:28:36.694436
b9d24b20-abd2-416b-9093-d596d2089c09	PEDIATRIC-004	752a812f-4589-4023-a448-0c3a9c0bff37	1a19d7f8-b12d-46b5-a60f-8ad59c812672	\N	bc8d9a21-cee2-465c-ad48-d68e63aed89d	\N	\N	\N	Rath Sam (Child: Makara)	077998811	ONLINE	WAITING	4	60	\N	\N	\N	2026-09-03 07:28:36.694438	2026-09-03 07:28:36.694439
bf6b4c2b-54ac-438e-9025-6865eb2b2217	CARDIO-001	0330b3a1-f60e-442b-9a6c-3e75754d7942	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2b4415af-9829-4cd8-9a48-74f9b0cf6d09	\N	\N	\N	Phally Makara	012345678	ONLINE	SKIPPED	0	0	2026-09-03 10:15:20.44248	\N	\N	2026-09-03 06:50:39.770123	2026-09-03 10:15:26.24527
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, phone_number, hashed_password, full_name, role, is_active, is_verified, profile_photo_url, hospital_id, branch_id, created_at, updated_at) FROM stdin;
d3fe8ab3-f4de-4196-ad20-0c7fb74ed61f	admin@carequeue.ai	+85512000001	$2b$12$Uj7siMdiXIOwxbvbmUgpu.XJCKt5AE03PJhBqC7wKVpq.vq6R/jzq	Super Platform Admin	SUPER_ADMIN	t	t	\N	\N	\N	2026-09-01 10:01:03.223806	2026-09-01 10:01:03.223809
e5c56464-26ef-4df1-ae7b-cacf1fdee2bf	dr.sokha@royalcityhospital.com	+85512000002	$2b$12$16YpMNnUm3xYw9X/N9IHo.fRl0FxTF8ZJGrTQkoSYlNp6FBNA/on6	Dr. Sokha Meas	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	2026-09-01 10:01:03.22381	2026-09-01 10:01:03.223811
41930aa6-6eb9-4e71-954e-336ea32fe35e	dr.chann@royalcityhospital.com	+85512000003	$2b$12$KBHrr61K61cljrBPVFAEDeTIMFpswC6UF8VOUWc3IkdOBcVnR5epu	Dr. Chann Vatey	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	835d843a-d634-46ef-91d9-a2532a673fe7	2026-09-01 10:01:03.223812	2026-09-01 10:01:03.223812
162f0832-5f86-4ee2-a48e-41f76c8f70d7	patient.dararith@gmail.com	+85512999001	$2b$12$BFZVqvoarpI6c7VM7z.D4.GfMYl.sW/fiDvZnosUEHu1nzvAanKoS	Dararith Ken	PATIENT	t	t	\N	\N	\N	2026-09-01 10:01:03.223813	2026-09-01 10:01:03.223814
1c4a4a5e-c6c2-4113-a7e9-61c01287a594	patient.sophea@gmail.com	+85512999003	$2b$12$ZEx1vPoyU1rQbeCPtC.lEO0WfIaTBdlj6e6Cb4TBNUV8pyrzKjLbm	Sophea Rath	PATIENT	t	t	\N	\N	\N	2026-09-01 10:01:03.223814	2026-09-01 10:01:03.223815
1b56b5f9-5349-4cc4-9b31-47d27c253632	newpatient.test@carequeue.ai	+85512777888	$2b$12$MMJlR3BKxP3qOxJJcWYXOOZmffwV.Vj8jikoiEs6.QhuOXqvO8pGi	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:06:17.712459	2026-09-01 10:06:17.712474
30a00c3e-8098-465e-8af0-83b693e34df6	patient.671772@carequeue.ai	+85512713682	$2b$12$q6XO8xir8EKAo9Wh5wAL.eeeplmYtx.538IY5EwHJ8x1BKM/oIMt2	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:07:59.090162	2026-09-01 10:07:59.090168
1499cf53-af56-4a6f-999a-03f0e1c47772	patient.e5d7cd@carequeue.ai	+85512592730	$2b$12$CXfhkJEYeFcLRXHLr0OhjedPJhCbdPCHFiFSUDAntfipQzkzLFgUm	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:10:24.00045	2026-09-01 10:10:24.000457
eba521de-22df-458f-a7c0-80812ff5475a	patient.7bbc7f@carequeue.ai	+85512867668	$2b$12$pBqki3.K6G87JXz6UYiO7u80rkQHGKRLaD1W7h0UP3xf.Eza5yOqS	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:11:42.74218	2026-09-01 10:11:42.742186
04ed9536-e670-4eb9-8467-850c1646e5cf	patient.fdbd84@carequeue.ai	+85512815954	$2b$12$gMvI.fB/oSChivkApIWX4eZYp.DhWm3BjtjIRBcrvACro4vh9dJfq	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:12:36.732737	2026-09-01 10:12:36.732743
7386f938-9ec9-43e9-a379-178ea670acee	patient.d96eb0@carequeue.ai	+85512470254	$2b$12$1No6BcNyyuTdoJcZENPYcOOJBIxGcfQH1lhWbO6dPN/CIQVtlrl/K	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:13:28.734216	2026-09-01 10:13:28.734221
c356e214-ddcd-497f-9f51-cd21fc0a18b1	patient.1e4225@carequeue.ai	+85512399493	$2b$12$1w9JEAc08U9i4LUmooWLv.nDYyYLWf4howauF2wfyVgaFzZ1WgQ3.	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:15:57.749475	2026-09-01 10:15:57.749482
07cf4708-8590-49bf-b394-407fa48bf304	dr.new0e8c@royalcityhospital.com	+85512777333	$2b$12$6UtTJ0GOjWAsj4UVuiq1Iuz2ZrMVJ49N1KJ5tu3sC73GemtsUyz0G	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:16:00.987208	2026-09-01 10:16:00.987212
c8e12eb5-d0ef-4136-8992-662c6e0d6d51	patient.4121d3@carequeue.ai	+85512299314	$2b$12$i7jOXxZE0FBdy2IN/RdcGOQO4vh7LdrYA4ZFOvM06etEde92spzei	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:19:20.913004	2026-09-01 10:19:20.913009
ed05f7c3-d894-4b67-b410-14fe0199efe8	patient.30dde1@carequeue.ai	+85512237893	$2b$12$27BrCIL/iIytkqEnFt5Fb.TTt03jJkvhbq.ICJLpXHUdkTz7vwcvK	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:19:51.489695	2026-09-01 10:19:51.489703
2b39bfb5-f844-4ff8-ad61-2a5c0ba1417a	dr.new4088@royalcityhospital.com	+85512358229	$2b$12$eGxW8qkTz7AtjRp7TFNE9.aOEw/w6BIGig0GXQpq7Ko6ArkYSXf7G	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:19:56.576215	2026-09-01 10:19:56.57622
8d4cc166-72fc-4bd9-97cd-2039e35fec9d	patient.56e7f8@carequeue.ai	+85512588492	$2b$12$KqRvxGgNUBPqHhWJzyAhZuEJjLR1h7WyxoNrCAqXHmOnRnNXWFVX6	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:22:16.273259	2026-09-01 10:22:16.273267
bacb2a62-559d-40cf-a0e5-3d467a9163d9	dr.new7f85@royalcityhospital.com	+85512750881	$2b$12$oe5hoA9TIn8ScoseKGJaee0U5ptnF6Oyq6SPWOCSPqW0MGo5.g5OG	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:22:19.333906	2026-09-01 10:22:19.333911
ce90176b-032f-4254-81ce-7326d572355c	patient.9ef309@carequeue.ai	+85512532598	$2b$12$MDhvNDExob285gXYMzSYzuhlPIsL3dwVPiv9SvbcE/pfBZvwuHmGq	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:24:00.978605	2026-09-01 10:24:00.978617
1aa77f0e-b3a6-462a-80ac-e8036619b028	dr.newd544@royalcityhospital.com	+85512341353	$2b$12$LTyxQo9J2mIq65M0pfRUzec3H2cL9gTNkiUJuMs95baad.ozhWdt6	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:24:04.278254	2026-09-01 10:24:04.278261
b91b4391-43d0-44a6-90e4-df02f6add795	patient.7dbf0c@carequeue.ai	+85512427973	$2b$12$jE2uw27P5FpbEAektfne5eV7YqB8LFkuTdKDDZO4LdwVr0gfCOya2	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:24:45.731438	2026-09-01 10:24:45.731445
8f7ef0cc-1694-4a21-828f-8e8eeaa1ef93	dr.new820a@royalcityhospital.com	+85512867458	$2b$12$xdop7nRIOxVIh4ef4euM1eAuLRuXTWy7U/2YmZQf.4Udi5g.tSJii	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:24:49.191196	2026-09-01 10:24:49.191201
149b29b3-8535-4cd8-8bee-5836b2651734	patient.8f9a0c@carequeue.ai	+85512523448	$2b$12$h0WH.eTJUSgFW.WWyZeKWePt.fBOqj2DJfmiqlP5nxuyydZUc5i7S	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:25:08.813311	2026-09-01 10:25:08.81332
04fe919e-98c1-4de2-8e2c-781e8b2d2b60	dr.new60b3@royalcityhospital.com	+85512652144	$2b$12$AgRSWNQ0LwA4lMp6EtwlQuRjOYv.8A5UrnH5eCoItn/4KpnfoKFN.	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:25:12.293555	2026-09-01 10:25:12.293559
7e418ea7-4ee5-426c-8fce-da938bbe16ac	patient.64a84e@carequeue.ai	+85512087495	$2b$12$Ho2Wet1TpsFPoQJei4LyP.lGXXWKJggDGZ2a1gT6PZ94VjJrN4u3G	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:26:56.078166	2026-09-01 10:26:56.078172
92f7435d-3707-4a20-a0b7-03032d207d16	dr.new2da8@royalcityhospital.com	+85512584693	$2b$12$Ykt6fQu6cbslYHcnh.zRzuoxAuG.sPvlBfbAtwDcaDoVQ.wQOuXf6	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:26:59.614128	2026-09-01 10:26:59.614136
359876bf-f42a-45f7-9189-8a047b876b1f	patient.e8edc0@carequeue.ai	+85512694804	$2b$12$yHNTjO20J60AgdH.2i1Uvec7mKZ4S/mLeuPTFsn9flbmZfMExTqTa	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:29:43.459832	2026-09-01 10:29:43.459838
9c16fc06-fb51-4433-a090-b25765b90b0e	dr.new493e@royalcityhospital.com	+85512449308	$2b$12$WWDn315Eegjr9BrhKXAPye5qU84xxEROvzwPknfAUuAvy3WvpntA2	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:29:47.174554	2026-09-01 10:29:47.174558
4fcbee64-b867-4ceb-9a44-e2620f4924ec	patient.e91ae3@carequeue.ai	+85512126051	$2b$12$GIhTmFmp44X.XuIVe68shOSyma6G1KIr5SON2n2z.fizNYOBIhVuy	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:30:37.51661	2026-09-01 10:30:37.516616
1be04cba-2ef8-46dc-981f-8db9cab46834	dr.newd71f@royalcityhospital.com	+85512581854	$2b$12$LIqkLoPznMnlHJF9RlQGEepyQPfX54CS.a/p87HVrFSvlH6dI.bsu	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:30:41.016055	2026-09-01 10:30:41.016059
d921d482-96cc-42d4-9bd0-68a4e04341b4	patient.c329bd@carequeue.ai	+85512575544	$2b$12$T16v1pBUiI9fAHkLhBZROuW8ge.NTKknq3GNx8TkfK269hBrZykpK	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:31:35.571537	2026-09-01 10:31:35.571548
e1a25642-d508-405a-85f3-69545515909e	dr.newe8d4@royalcityhospital.com	+85512794522	$2b$12$06941oDnu9GgJikBNajSH.fd0cIzxrjlvX70Wj.MKZCUEXnmjYEDa	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:31:39.680359	2026-09-01 10:31:39.680363
039013c7-4029-4af9-a891-378d8509da2d	patient.9fd214@carequeue.ai	+85512142844	$2b$12$h7KBrLPVrRPI01xmVUdYYO581lZEqm3lyr4EfFzLZxICUaWUKXKz.	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:34:33.686689	2026-09-01 10:34:33.686696
3606d702-3415-4ddb-b00e-dc0a95bff9ee	dr.new381f@royalcityhospital.com	+85512855129	$2b$12$Ohj/ySbA57xEV82JBbfmmu.IYlDbIWnPOkbZ0/.K1zw.JUn78FKxe	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:34:38.683975	2026-09-01 10:34:38.68398
773cb949-7fac-4729-b36a-e6d0ed5e6437	patient.ca4dc4@carequeue.ai	+85512651806	$2b$12$WRYJ2SSlgfc6s4L1kvo.feKZr3TEgYL78t/zoD3dGgOkBGdqXdABy	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:35:04.830032	2026-09-01 10:35:04.830039
29e7c592-e58c-4a52-9532-e7928e6b3cf9	dr.new91a2@royalcityhospital.com	+85512624908	$2b$12$Pi6BGr41Ik2SOL4tTCrLfOHHTTFaJbGdwzEdSC9qqjURFlxs5hQiu	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:35:10.750916	2026-09-01 10:35:10.750921
4b74b3d7-f994-49f8-b15b-c76836294c72	patient.648ee6@carequeue.ai	+85512986289	$2b$12$EP8Ge3HHNQb2UW31jeiHh./j0W1.OtsBm1prSoEmiB.W1afD3six2	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:41:48.887602	2026-09-01 10:41:48.887612
31327cd2-1560-46ee-80cd-42b1eb60b06e	dr.newc13e@royalcityhospital.com	+85512951495	$2b$12$9jSD5Jtkk/pjirEiosdrzO5GCSXCLwL3P08nxB2kFXLqohmNfhnfy	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:41:53.11801	2026-09-01 10:41:53.118015
0a637638-f98b-4062-b3b9-a0832524eef8	patient.6445c8@carequeue.ai	+85512619332	$2b$12$Fcmg0bMT1N1JeKc59Bb5s.qvXQkjC8RbBd0oS8ecrELgyhvidxXdW	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:42:43.569871	2026-09-01 10:42:43.569877
9cc28ab1-1e79-4fe7-9453-1b63715c43e7	dr.new5b64@royalcityhospital.com	+85512920159	$2b$12$KKxrSXBaGOzpcYl5cqmVteky2Ug.yydelbFzvUdUBXkaCwlLaw8Nu	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:42:47.72004	2026-09-01 10:42:47.720046
d3048e85-9516-4c1c-91e9-9b6a8b4a8604	patient.7b53a6@carequeue.ai	+85512100306	$2b$12$aRA/ne0RtepoWOpQMfE3uuk7CQOXcmcAdjmPBa.SA/aTRmPSabpqe	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:46:06.364558	2026-09-01 10:46:06.364564
50a59f09-4af6-4f6c-b3b8-542c44b29f3e	dr.newa308@royalcityhospital.com	+85512701222	$2b$12$x/ssALzGqoChT9nfCBV2XuRPxsXUhDEcKmS5AiiakLuwbO37A4o0m	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:46:11.09629	2026-09-01 10:46:11.096295
2246fa92-61e9-485d-9c96-8be3c14c7921	patient.b4541a@carequeue.ai	+85512924534	$2b$12$j4IDHJQNM3MUFi5Ry2x2Vex63BDO19X3BxE4Yo1HvZYHQW2gASaA2	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:49:23.075228	2026-09-01 10:49:23.075234
a82791ce-c500-4e6d-9275-f79eb5a3e04f	dr.new87c7@royalcityhospital.com	+85512915233	$2b$12$gGztnjeSiRSwFQH.rVMm4egjxv/83qgbVcXm3PXTY1PlRKENPZQpe	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:49:28.48197	2026-09-01 10:49:28.481975
d8960117-e081-480a-81fc-dd74446a3813	patient.1ebbbb@carequeue.ai	+85512582038	$2b$12$MgmjpuH8LnY1uP8/qSJBkuyAt37OfKKP2v8HW2IZ1WGOQUXAhoZYK	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 10:50:12.466644	2026-09-01 10:50:12.466652
b0c98dc4-3a35-4a8b-828c-8803cb4e765f	dr.new5193@royalcityhospital.com	+85512480815	$2b$12$w8RBhthnwfA1LUDUb10dHOsAIH2kIhQg/Aj7Vt.6QB3DppOGI6mA2	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 10:50:18.881493	2026-09-01 10:50:18.881498
6a8720f6-935e-40c2-a538-3b93e6c06a23	patient.54cc2c@carequeue.ai	+85512060430	$2b$12$oUl7PNmMAEvHDwm6iPDVH.eUPUD4ftWkPV96vUMwfXJ.rMi5kGmfi	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 11:04:36.912222	2026-09-01 11:04:36.91223
a9b847eb-fc50-44cd-8ab1-a88f6090f6d1	dr.new4852@royalcityhospital.com	+85512277968	$2b$12$FEF9l4tJ5hWcKkutcFvZAuQXXRYUWZck7ADwjOZoHzz.s/Fo02zxy	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 11:04:43.229571	2026-09-01 11:04:43.229576
27b32573-501f-4744-b6dc-1e8e094d7198	patient.c65f9c@carequeue.ai	+85512830215	$2b$12$7qsiLYOnYAWTJTQYfG8vE.RuSa6dNV0GeT.s15Pn3laPEwMCf6.am	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-01 15:10:19.619228	2026-09-01 15:10:19.619235
be0cc6a4-4aad-4391-a7a4-9a97e5f75b8e	dr.new044d@royalcityhospital.com	+85512897323	$2b$12$GfvcB/MbCwmbrv6yoYOCNukKoku/RbR2MCiH2CiuW9Znf3NN69JI6	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-01 15:10:28.844291	2026-09-01 15:10:28.844296
c358853e-826b-4312-ab4d-4277c6dd02e2	patient.21c5f2@carequeue.ai	+85512138596	$2b$12$KCVGFR6uLvuztoDeuCXk4uB5BnSHoPp0SSNB9WtkhHltA4WiDHqFy	Test Patient	PATIENT	t	t	\N	\N	\N	2026-09-04 02:51:21.110382	2026-09-04 02:51:21.110388
8d39ca2d-43e1-4504-8a51-694ce972ab42	dr.newf2ba@royalcityhospital.com	+85512864788	$2b$12$oVSa81Pard4vinXUx5G0hej4LOh2CuFrQnyX735kI//qVF7.L.qxW	Dr. Vatanak Srey, MD	DOCTOR	t	t	\N	11c80144-bc31-4ed1-8529-f25db3a203d3	\N	2026-09-04 02:51:27.464579	2026-09-04 02:51:27.464583
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: doctor_schedules doctor_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_key UNIQUE (user_id);


--
-- Name: hospital_branches hospital_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_branches
    ADD CONSTRAINT hospital_branches_pkey PRIMARY KEY (id);


--
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (id);


--
-- Name: patient_profiles patient_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_profiles
    ADD CONSTRAINT patient_profiles_pkey PRIMARY KEY (id);


--
-- Name: patient_profiles patient_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_profiles
    ADD CONSTRAINT patient_profiles_user_id_key UNIQUE (user_id);


--
-- Name: queue_sessions queue_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_sessions
    ADD CONSTRAINT queue_sessions_pkey PRIMARY KEY (id);


--
-- Name: schedule_overrides schedule_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_overrides
    ADD CONSTRAINT schedule_overrides_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: ticket_logs ticket_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_departments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_departments_id ON public.departments USING btree (id);


--
-- Name: ix_departments_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_departments_name ON public.departments USING btree (name);


--
-- Name: ix_doctor_schedules_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_schedules_doctor_id ON public.doctor_schedules USING btree (doctor_id);


--
-- Name: ix_doctors_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctors_department_id ON public.doctors USING btree (department_id);


--
-- Name: ix_doctors_full_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctors_full_name ON public.doctors USING btree (full_name);


--
-- Name: ix_doctors_hospital_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctors_hospital_id ON public.doctors USING btree (hospital_id);


--
-- Name: ix_doctors_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctors_id ON public.doctors USING btree (id);


--
-- Name: ix_doctors_specialty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctors_specialty ON public.doctors USING btree (specialty);


--
-- Name: ix_hospital_branches_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_hospital_branches_id ON public.hospital_branches USING btree (id);


--
-- Name: ix_hospitals_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_hospitals_id ON public.hospitals USING btree (id);


--
-- Name: ix_hospitals_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_hospitals_name ON public.hospitals USING btree (name);


--
-- Name: ix_hospitals_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_hospitals_slug ON public.hospitals USING btree (slug);


--
-- Name: ix_hospitals_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_hospitals_verification_status ON public.hospitals USING btree (verification_status);


--
-- Name: ix_queue_sessions_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_sessions_department_id ON public.queue_sessions USING btree (department_id);


--
-- Name: ix_queue_sessions_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_sessions_doctor_id ON public.queue_sessions USING btree (doctor_id);


--
-- Name: ix_queue_sessions_hospital_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_sessions_hospital_id ON public.queue_sessions USING btree (hospital_id);


--
-- Name: ix_queue_sessions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_sessions_id ON public.queue_sessions USING btree (id);


--
-- Name: ix_queue_sessions_session_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_sessions_session_date ON public.queue_sessions USING btree (session_date);


--
-- Name: ix_queue_sessions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_sessions_status ON public.queue_sessions USING btree (status);


--
-- Name: ix_schedule_overrides_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_schedule_overrides_doctor_id ON public.schedule_overrides USING btree (doctor_id);


--
-- Name: ix_schedule_overrides_specific_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_schedule_overrides_specific_date ON public.schedule_overrides USING btree (specific_date);


--
-- Name: ix_services_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_services_id ON public.services USING btree (id);


--
-- Name: ix_ticket_logs_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ticket_logs_ticket_id ON public.ticket_logs USING btree (ticket_id);


--
-- Name: ix_ticket_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ticket_logs_timestamp ON public.ticket_logs USING btree ("timestamp");


--
-- Name: ix_tickets_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tickets_created_at ON public.tickets USING btree (created_at);


--
-- Name: ix_tickets_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tickets_department_id ON public.tickets USING btree (department_id);


--
-- Name: ix_tickets_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tickets_doctor_id ON public.tickets USING btree (doctor_id);


--
-- Name: ix_tickets_hospital_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tickets_hospital_id ON public.tickets USING btree (hospital_id);


--
-- Name: ix_tickets_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tickets_id ON public.tickets USING btree (id);


--
-- Name: ix_tickets_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tickets_patient_id ON public.tickets USING btree (patient_id);


--
-- Name: ix_tickets_queue_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tickets_queue_session_id ON public.tickets USING btree (queue_session_id);


--
-- Name: ix_tickets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tickets_status ON public.tickets USING btree (status);


--
-- Name: ix_tickets_ticket_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tickets_ticket_number ON public.tickets USING btree (ticket_number);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_phone_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_phone_number ON public.users USING btree (phone_number);


--
-- Name: ix_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_role ON public.users USING btree (role);


--
-- Name: departments departments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.hospital_branches(id) ON DELETE CASCADE;


--
-- Name: departments departments_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;


--
-- Name: doctor_schedules doctor_schedules_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: doctors doctors_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.hospital_branches(id) ON DELETE SET NULL;


--
-- Name: doctors doctors_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: doctors doctors_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;


--
-- Name: doctors doctors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: hospital_branches hospital_branches_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_branches
    ADD CONSTRAINT hospital_branches_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;


--
-- Name: patient_profiles patient_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_profiles
    ADD CONSTRAINT patient_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: queue_sessions queue_sessions_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_sessions
    ADD CONSTRAINT queue_sessions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.hospital_branches(id) ON DELETE SET NULL;


--
-- Name: queue_sessions queue_sessions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_sessions
    ADD CONSTRAINT queue_sessions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: queue_sessions queue_sessions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_sessions
    ADD CONSTRAINT queue_sessions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;


--
-- Name: queue_sessions queue_sessions_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_sessions
    ADD CONSTRAINT queue_sessions_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;


--
-- Name: schedule_overrides schedule_overrides_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_overrides
    ADD CONSTRAINT schedule_overrides_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: services services_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: services services_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;


--
-- Name: ticket_logs ticket_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ticket_logs ticket_logs_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.hospital_branches(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_queue_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_queue_session_id_fkey FOREIGN KEY (queue_session_id) REFERENCES public.queue_sessions(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: users users_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.hospital_branches(id) ON DELETE SET NULL;


--
-- Name: users users_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict OAbvOzpMnMgozYOqqidgKgQW2TaI1XFTxSzlEfRy0OM2ij9IdeziO2wKzGjLYrk

